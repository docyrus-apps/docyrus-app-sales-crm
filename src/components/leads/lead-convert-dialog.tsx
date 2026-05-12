/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useDocyrusClient } from '@docyrus/signin'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { AwesomeDialog } from '@/components/docyrus/awesome-dialog/awesome-dialog'
import { AwesomeDialogBody } from '@/components/docyrus/awesome-dialog/awesome-dialog-body'
import { AwesomeDialogFooter } from '@/components/docyrus/awesome-dialog/awesome-dialog-footer'
import { AwesomeDialogHeader } from '@/components/docyrus/awesome-dialog/awesome-dialog-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  type FieldKind,
  type SelectOption,
} from '@/components/leads/field-mapping-row'
import { LeadConvertModeSelector } from '@/components/leads/lead-convert-mode-selector'
import {
  LeadConvertChangeConfirmDialog,
  type LeadConvertPendingChange,
} from '@/components/leads/lead-convert-change-confirm-dialog'
import { LeadConvertProgress } from '@/components/leads/lead-convert-progress'
import { LeadConvertTabs } from '@/components/leads/lead-convert-tabs'
import { createDataSourceClient } from '@docyrus/app-utils'
import { useEnumEntities } from '@/hooks/use-enums'
import {
  useLeadConvertEnumMappings,
  optionByName,
} from '@/components/leads/use-lead-convert-enum-mappings'
import {
  getRelationId,
  getRelationName,
  isLeadConvertedRecord,
  normalizeConversionKey,
} from '@/lib/lead-conversion'
import { cn } from '@/lib/utils'

type ConversionMode = 'company_contact_deal' | 'contact_deal' | 'deal_only'
type StepState = 'pending' | 'running' | 'done' | 'warn' | 'failed' | 'skipped'
type DetailTone = 'success' | 'info' | 'warn' | 'error' | 'neutral'
type StepDetail = { tone: DetailTone; label: string }
type LinkedWorkMigrationResult = {
  attemptedCount: number
  updatedCount: number
  failedCount: number
  warningCount: number
}
type PrecheckTargetSummary = {
  status: 'unchecked' | 'clean' | 'matches' | 'exact'
  count: number
  exactName?: string
}
type ConvertTarget = 'company' | 'contact' | 'deal'
type EntityCandidate = Record<string, any> & { id?: string; name?: string }
type FieldMeta = { slug?: string }
type DataSourceMeta = { fields?: Array<FieldMeta> }
type CurrentUserResponse = { id?: string }

const KNOWN_FIELDS: Record<ConvertTarget, Array<string>> = {
  company: [
    'name',
    'email',
    'phone',
    'website',
    'address',
    'city',
    'industry',
    'company_size',
    'country',
    'source_lead',
    'record_owner',
  ],
  contact: [
    'name',
    'job_title',
    'email',
    'mobile',
    'organization',
    'source_lead',
    'record_owner',
  ],
  deal: [
    'name',
    'deal_value',
    'description',
    'stage',
    'lead_source',
    'customer_type',
    'country',
    'record_owner',
    'organization',
    'contact_person',
    'source_lead',
  ],
}

const SYSTEM_HIDDEN_FIELDS = new Set([
  'id',
  'autonumber_id',
  'created_by',
  'created_on',
  'last_modified_by',
  'last_modified_on',
  'followers',
  'status',
])

interface LeadConvertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: any
}

function useModeLabels(
  t: (key: string) => string,
): Record<ConversionMode, string> {
  return {
    company_contact_deal: t('leads.convert.mode.company_contact_deal'),
    contact_deal: t('leads.convert.mode.contact_deal'),
    deal_only: t('leads.convert.mode.deal_only'),
  }
}

function useTargetLabels(
  t: (key: string) => string,
): Record<'company' | 'contact' | 'deal', string> {
  return {
    company: t('leads.convert.target.company'),
    contact: t('leads.convert.target.contact'),
    deal: t('leads.convert.target.deal'),
  }
}

function useStepLabels(t: (key: string) => string): Record<string, string> {
  return {
    precheck: t('leads.convert.step.precheck'),
    organization: t('leads.convert.step.organization'),
    contact: t('leads.convert.step.contact'),
    deal: t('leads.convert.step.deal'),
    activity: t('leads.convert.step.activity'),
    lead: t('leads.convert.step.lead'),
  }
}

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

function sanitizeKeyword(value?: string | null) {
  if (!value) return ''
  return value
    .replace(/https?:\/\//gi, '')
    .replace(/[:&|!*()<>'"\\\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizePhone(value?: string | null) {
  return value?.replace(/\D/g, '') ?? ''
}

function normalizeDomain(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
    )
    return url.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return (
      trimmed
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        ?.toLowerCase() ?? ''
    )
  }
}

function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message)
  }

  return t('leads.convert.alert.errorTitle')
}

function isAbortLikeError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const maybeAbort = error as { name?: string; code?: string }
  return maybeAbort.name === 'AbortError' || maybeAbort.code === 'ABORT_ERROR'
}

function logLeadConvertEvent(
  level: 'info' | 'warn' | 'error',
  event: string,
  payload: Record<string, unknown>,
) {
  const entry = {
    event,
    ...payload,
  }

  if (level === 'error') {
    console.error('[LeadConvert]', entry)
  } else if (level === 'warn') {
    console.warn('[LeadConvert]', entry)
  } else {
    console.info('[LeadConvert]', entry)
  }
}

function getFieldSlugs(dataSource?: DataSourceMeta | null) {
  return new Set(
    (dataSource?.fields ?? []).map((field) => field.slug).filter(Boolean),
  )
}

function hasAllFields(slugs: Set<string | undefined>, fields: Array<string>) {
  return fields.every((field) => slugs.has(field))
}

function pickDefined(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  )
}

function unwrapItems(response: unknown): Array<EntityCandidate> {
  if (Array.isArray(response)) return response as Array<EntityCandidate>
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: unknown }).data
    return Array.isArray(data) ? (data as Array<EntityCandidate>) : []
  }

  return []
}

function firstItem(response: unknown): EntityCandidate | undefined {
  return unwrapItems(response)[0]
}

export function LeadConvertDialog({
  open,
  onOpenChange,
  lead,
}: LeadConvertDialogProps) {
  const { t } = useTranslation()
  const client = useDocyrusClient()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const MODE_LABELS = useModeLabels((key) => t(key))
  const TARGET_LABEL = useTargetLabels((key) => t(key))
  const STEP_LABELS = useStepLabels((key) => t(key))
  const [isWorking, setIsWorking] = useState(false)
  const [duplicatesChecked, setDuplicatesChecked] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [companyCandidates, setCompanyCandidates] = useState<
    Array<EntityCandidate>
  >([])
  const [contactCandidates, setContactCandidates] = useState<
    Array<EntityCandidate>
  >([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    getRelationId(lead?.converted_organization) ?? null,
  )
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    getRelationId(lead?.converted_contact) ?? null,
  )
  const [exactCompanyId, setExactCompanyId] = useState<string | null>(null)
  const [exactContactId, setExactContactId] = useState<string | null>(null)
  const [dealCandidates, setDealCandidates] = useState<Array<EntityCandidate>>(
    [],
  )
  const [precheckSummary, setPrecheckSummary] = useState<{
    company: PrecheckTargetSummary
    contact: PrecheckTargetSummary
    deal: PrecheckTargetSummary
  }>({
    company: { status: 'unchecked', count: 0 },
    contact: { status: 'unchecked', count: 0 },
    deal: { status: 'unchecked', count: 0 },
  })
  const [pendingChanges, setPendingChanges] =
    useState<Array<LeadConvertPendingChange> | null>(null)
  const [changesConfirmed, setChangesConfirmed] = useState(false)
  const progressSectionRef = useRef<HTMLDivElement | null>(null)
  const duplicateCheckRef = useRef<{
    requestId: number
    controller: AbortController | null
  }>({ requestId: 0, controller: null })
  const [mode, setMode] = useState<ConversionMode>(() => {
    const savedMode = getRelationName(lead?.conversion_mode)
    if (savedMode === 'contact_deal' || savedMode === 'deal_only') {
      return savedMode
    }

    return lead?.company_name_text || lead?.website
      ? 'company_contact_deal'
      : 'contact_deal'
  })
  const initialStepState = useMemo(() => {
    const hasOrg = Boolean(getRelationId(lead?.converted_organization))
    const hasContact = Boolean(getRelationId(lead?.converted_contact))
    const hasDeal = Boolean(getRelationId(lead?.converted_deal))
    const stateName = getRelationName(lead?.conversion_state)
    const isCompleted = stateName === 'completed'
    const isFailedOrPartial = stateName === 'failed' || stateName === 'partial'

    const steps: Record<string, StepState> = {
      precheck: hasOrg || hasContact || hasDeal ? 'done' : 'pending',
      organization: hasOrg ? 'done' : 'pending',
      contact: hasContact ? 'done' : 'pending',
      deal: hasDeal ? 'done' : 'pending',
      activity: isCompleted ? 'done' : 'pending',
      lead: isCompleted ? 'done' : 'pending',
    }

    const hasAny = hasOrg || hasContact || hasDeal
    if (isFailedOrPartial && hasAny) {
      const sequence: Array<keyof typeof steps> = [
        'precheck',
        'organization',
        'contact',
        'deal',
      ]
      const firstPending = sequence.find((key) => steps[key] === 'pending')
      if (firstPending) steps[firstPending] = 'failed'
    }
    const details: Record<string, Array<StepDetail>> = {
      precheck: [],
      organization: hasOrg
        ? [
            {
              tone: 'success',
              label: t('leads.convert.result.existing', {
                name: getRelationName(lead?.converted_organization) ?? '—',
              }),
            },
            { tone: 'info', label: t('leads.convert.result.willSkip') },
          ]
        : [],
      contact: hasContact
        ? [
            {
              tone: 'success',
              label: t('leads.convert.result.existing', {
                name: getRelationName(lead?.converted_contact) ?? '—',
              }),
            },
            { tone: 'info', label: t('leads.convert.result.willSkip') },
          ]
        : [],
      deal: hasDeal
        ? [
            {
              tone: 'success',
              label: t('leads.convert.result.existing', {
                name: getRelationName(lead?.converted_deal) ?? '—',
              }),
            },
            { tone: 'info', label: t('leads.convert.result.willSkip') },
          ]
        : [],
      activity: [],
      lead: [],
    }

    if (isFailedOrPartial) {
      const errorMessage =
        typeof lead?.conversion_error_message === 'string' &&
        lead.conversion_error_message
          ? lead.conversion_error_message
          : null
      const failedKey = (Object.keys(steps) as Array<keyof typeof steps>).find(
        (key) => steps[key] === 'failed',
      )
      if (failedKey && errorMessage) {
        details[failedKey] = [
          {
            tone: 'error',
            label: t('leads.convert.result.previousError', {
              message: errorMessage,
            }),
          },
          { tone: 'info', label: t('leads.convert.result.willRetry') },
        ]
      }
    }

    return { steps, details }
  }, [lead, t])

  const [steps, setSteps] = useState<Record<string, StepState>>(
    () => initialStepState.steps,
  )
  const [stepDetails, setStepDetails] = useState<
    Record<string, Array<StepDetail>>
  >(() => initialStepState.details)
  const [form, setForm] = useState(() => ({
    companyName: lead?.company_name_text || '',
    companyWebsite: lead?.website || '',
    companyEmail: lead?.company_email || '',
    companyPhone: lead?.company_phone || '',
    companyAddress: lead?.address || '',
    companyCity: lead?.city || '',
    companyIndustry: '',
    companySize: '',
    companyCountry: getRelationId(lead?.countries) || '',
    contactName: lead?.name || '',
    contactEmail: lead?.email || '',
    contactPhone: lead?.phone || '',
    contactJobTitle: lead?.contact_job_title || '',
    dealName:
      [lead?.company_name_text, lead?.name].filter(Boolean).join(' - ') ||
      lead?.name ||
      t('leads.convert.dealDefaultName'),
    dealValue: lead?.deal_value ? String(lead.deal_value) : '',
    notes: lead?.contact_message || '',
    dealStageId: '',
    dealLeadSourceId: '',
    dealCustomerTypeId: '',
    dealCountry: getRelationId(lead?.countries) || '',
    dealOwner: getRelationId(lead?.record_owner) || '',
  }))
  const [extraFields, setExtraFields] = useState<{
    company: Array<{
      slug: string
      label: string
      kind: FieldKind
      value: string
    }>
    contact: Array<{
      slug: string
      label: string
      kind: FieldKind
      value: string
    }>
    deal: Array<{ slug: string; label: string; kind: FieldKind; value: string }>
  }>({ company: [], contact: [], deal: [] })
  const [targetFields, setTargetFields] = useState<{
    company: Array<{ slug: string; name: string; type: string }>
    contact: Array<{ slug: string; name: string; type: string }>
    deal: Array<{ slug: string; name: string; type: string }>
  }>({ company: [], contact: [], deal: [] })
  const [activeTab, setActiveTab] = useState<'company' | 'contact' | 'deal'>(
    'deal',
  )

  const {
    stageOptions,
    dealLeadSourceOptions,
    customerTypeOptions,
    orgIndustryOptions,
    orgCompanySizeOptions,
    stageSelectOptions,
    leadSourceSelectOptions,
    customerTypeSelectOptions,
    industrySelectOptions,
    companySizeSelectOptions,
    leadCompanyIndustryName,
    leadCompanySizeName,
    leadSourceName,
    leadTypeName,
    newStageId,
    mappedDealLeadSourceId,
    mappedCustomerTypeId,
    mappedCompanyIndustryId,
    mappedCompanySizeId,
    effectiveStageId,
    effectiveLeadSourceId,
    effectiveCustomerTypeId,
    effectiveCompanyIndustryId,
    effectiveCompanySizeId,
  } = useLeadConvertEnumMappings(lead, form)

  const { data: leadStatusOptions = [] } = useEnumEntities('lead_status', {
    appSlug: 'base_crm',
    dataSourceSlug: 'leads',
  })
  const { data: conversionStateOptions = [] } = useEnumEntities(
    'conversion_state',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'leads',
    },
  )
  const { data: conversionModeOptions = [] } = useEnumEntities(
    'conversion_mode',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'leads',
    },
  )
  const requireEnumValue = (
    options: Array<{ id: string; name: string }>,
    name: string,
    label: string,
  ) => {
    const id = optionByName(options, name)
    if (!id) {
      throw new Error(
        t('leads.convert.validation.enumOptionMissing', {
          field: label,
          value: name,
        }),
      )
    }

    return id
  }

  const conversionStateValue = (state: string) =>
    requireEnumValue(
      conversionStateOptions,
      state,
      t('leads.convert.field.conversionState', {
        defaultValue: 'Conversion state',
      }),
    )
  const conversionModeValue = (selectedMode: ConversionMode) =>
    requireEnumValue(
      conversionModeOptions,
      selectedMode,
      t('leads.convert.field.conversionMode', {
        defaultValue: 'Conversion mode',
      }),
    )

  useEffect(() => {
    if (mode === 'deal_only') {
      setActiveTab('deal')
    } else if (mode === 'contact_deal') {
      setActiveTab('contact')
    } else {
      setActiveTab('company')
    }
  }, [mode])

  useEffect(
    () => () => {
      duplicateCheckRef.current.requestId += 1
      duplicateCheckRef.current.controller?.abort()
      duplicateCheckRef.current.controller = null
    },
    [],
  )

  useEffect(() => {
    if (!open || !client) return
    const dataSources = createDataSourceClient(client)
    let cancelled = false
    const load = async () => {
      const [org, contact, deal] = await Promise.all([
        dataSources
          .getBySlug('base', 'organization', { expand: 'fields' })
          .catch(() => null),
        dataSources
          .getBySlug('base', 'contact', { expand: 'fields' })
          .catch(() => null),
        dataSources
          .getBySlug('base_crm', 'deal', { expand: 'fields' })
          .catch(() => null),
      ])
      if (cancelled) return
      const mapFields = (
        ds: {
          fields?: Array<{ slug?: string; name?: string; type?: string }>
        } | null,
      ) =>
        (ds?.fields ?? [])
          .filter((f): f is { slug: string; name: string; type: string } =>
            Boolean(f?.slug && f?.name && f?.type),
          )
          .map((f) => ({ slug: f.slug, name: f.name, type: f.type }))
      setTargetFields({
        company: mapFields(org),
        contact: mapFields(contact),
        deal: mapFields(deal),
      })
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [open, client])

  const progress =
    (Object.values(steps).filter((state) =>
      ['done', 'warn', 'skipped'].includes(state),
    ).length /
      Object.keys(steps).length) *
    100

  const isAlreadyCompleted = isLeadConvertedRecord(lead)
  const hasAnyCreated = Boolean(
    lead?.converted_organization ||
    lead?.converted_contact ||
    lead?.converted_deal,
  )
  const conversionStateName = normalizeConversionKey(
    getRelationName(lead?.conversion_state),
  )
  const hasPartialState = !isAlreadyCompleted && hasAnyCreated
  const hasFailedAttempt =
    !isAlreadyCompleted &&
    !hasAnyCreated &&
    conversionStateName === normalizeConversionKey('failed')

  const setStep = (key: string, state: StepState) => {
    setSteps((current) => ({ ...current, [key]: state }))
  }

  const setStepDetail = (key: string, details: Array<StepDetail>) => {
    setStepDetails((current) => ({ ...current, [key]: details }))
  }

  const addStepDetail = (key: string, detail: StepDetail) => {
    setStepDetails((current) => ({
      ...current,
      [key]: [...(current[key] ?? []), detail],
    }))
  }

  const detail = (tone: DetailTone, label: string): StepDetail => ({
    tone,
    label,
  })

  const SEARCH_RELEVANT_FIELDS = new Set<keyof typeof form>([
    'companyName',
    'companyWebsite',
    'companyPhone',
    'contactName',
    'contactEmail',
    'contactPhone',
  ])

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (SEARCH_RELEVANT_FIELDS.has(key)) {
      setDuplicatesChecked(false)
    }
  }

  const updateLead = async (data: Record<string, unknown>) => {
    if (!client || !lead?.id) throw new Error(t('leads.failedToLoad'))
    await client.patch(
      `/v1/apps/base_crm/data-sources/leads/items/${lead.id}`,
      pickDefined(data),
    )
  }

  const migrateLinkedWork = async ({
    organizationId,
    contactId,
    dealId,
  }: {
    organizationId?: string
    contactId?: string
    dealId?: string
  }) => {
    const result: LinkedWorkMigrationResult = {
      attemptedCount: 0,
      updatedCount: 0,
      failedCount: 0,
      warningCount: 0,
    }
    if (!client || !lead?.id) return result

    const dataSources = createDataSourceClient(client)
    const [taskDataSource, eventDataSource] = await Promise.all([
      dataSources.getBySlug('base', 'task', { expand: 'fields' }).catch(() => {
        result.warningCount += 1
        return null
      }),
      dataSources.getBySlug('base', 'event', { expand: 'fields' }).catch(() => {
        result.warningCount += 1
        return null
      }),
    ])

    const updates: Array<Promise<unknown>> = []
    const taskFields = getFieldSlugs(taskDataSource)
    const eventFields = getFieldSlugs(eventDataSource)

    if (hasAllFields(taskFields, ['lead'])) {
      const response = await client
        .get('/v1/apps/base/data-sources/task/items', {
          columns: 'id',
          filters: {
            rules: [{ field: 'lead', operator: '=', value: lead.id }],
          },
          limit: 200,
        })
        .catch(() => {
          result.warningCount += 1
          return []
        })
      const taskPatch = pickDefined({
        organization: taskFields.has('organization')
          ? organizationId
          : undefined,
        contact: taskFields.has('contact') ? contactId : undefined,
        deal: taskFields.has('deal') ? dealId : undefined,
      })

      if (Object.keys(taskPatch).length > 0) {
        for (const item of unwrapItems(response)) {
          if (!item.id) continue
          result.attemptedCount += 1
          updates.push(
            client
              .patch(
                `/v1/apps/base/data-sources/task/items/${item.id}`,
                taskPatch,
              )
              .then(
                () => {
                  result.updatedCount += 1
                },
                () => {
                  result.failedCount += 1
                },
              ),
          )
        }
      }
    }

    if (hasAllFields(eventFields, ['lead'])) {
      const response = await client
        .get('/v1/apps/base/data-sources/event/items', {
          columns: 'id',
          filters: {
            rules: [{ field: 'lead', operator: '=', value: lead.id }],
          },
          limit: 200,
        })
        .catch(() => {
          result.warningCount += 1
          return []
        })
      const eventPatch = pickDefined({
        organization: eventFields.has('organization')
          ? organizationId
          : undefined,
        contact: eventFields.has('contact') ? contactId : undefined,
        deal: eventFields.has('deal') ? dealId : undefined,
      })

      if (Object.keys(eventPatch).length > 0) {
        for (const item of unwrapItems(response)) {
          if (!item.id) continue
          result.attemptedCount += 1
          updates.push(
            client
              .patch(
                `/v1/apps/base/data-sources/event/items/${item.id}`,
                eventPatch,
              )
              .then(
                () => {
                  result.updatedCount += 1
                },
                () => {
                  result.failedCount += 1
                },
              ),
          )
        }
      }
    }

    if (updates.length === 0) return result

    await Promise.all(updates)
    return result
  }

  const findDuplicates = async () => {
    if (!client) return
    duplicateCheckRef.current.controller?.abort()
    const requestId = duplicateCheckRef.current.requestId + 1
    const controller = new AbortController()
    duplicateCheckRef.current = { requestId, controller }
    setIsWorking(true)
    setErrorMessage(null)
    setStep('precheck', 'running')

    try {
      if (!form.dealName.trim()) {
        throw new Error(t('leads.convert.validation.dealNameRequired'))
      }

      if (mode === 'company_contact_deal' && !form.companyName.trim()) {
        throw new Error(t('leads.convert.validation.companyNameRequired'))
      }

      if (mode !== 'deal_only' && !form.contactName.trim()) {
        throw new Error(t('leads.convert.validation.contactNameRequired'))
      }

      const companyKeyword =
        sanitizeKeyword(form.companyName) ||
        normalizeDomain(form.companyWebsite)
      const contactKeyword =
        sanitizeKeyword(form.contactName) ||
        sanitizeKeyword(form.contactEmail) ||
        sanitizeKeyword(form.contactPhone)
      const [companies, contacts, deals] = await Promise.all([
        mode === 'company_contact_deal' && companyKeyword
          ? client.get(
              '/v1/apps/base/data-sources/organization/items',
              {
                columns: 'id,name,email,phone,website,country(id,name)',
                filterKeyword: companyKeyword,
                limit: 8,
              },
              { signal: controller.signal },
            )
          : Promise.resolve([]),
        mode !== 'deal_only' && contactKeyword
          ? client.get(
              '/v1/apps/base/data-sources/contact/items',
              {
                columns: 'id,name,email,mobile,organization(id,name)',
                filterKeyword: contactKeyword,
                limit: 8,
              },
              { signal: controller.signal },
            )
          : Promise.resolve([]),
        lead?.id
          ? client.get(
              '/v1/apps/base_crm/data-sources/deal/items',
              {
                columns:
                  'id,name,stage(id,name),organization(id,name),source_lead(id,name)',
                filters: {
                  rules: [
                    { field: 'source_lead', operator: '=', value: lead.id },
                  ],
                },
                limit: 8,
              },
              { signal: controller.signal },
            )
          : Promise.resolve([]),
      ])

      if (
        controller.signal.aborted ||
        duplicateCheckRef.current.requestId !== requestId
      ) {
        return
      }

      const companyMatches = unwrapItems(companies)
      const contactMatches = unwrapItems(contacts)
      const dealMatches = unwrapItems(deals)
      const companyDomain = normalizeDomain(form.companyWebsite)
      const companyName = normalize(form.companyName)
      const companyPhone = normalizePhone(form.companyPhone)
      const contactEmail = normalize(form.contactEmail)
      const contactPhone = normalizePhone(form.contactPhone)
      const exactCompany = companyMatches.find((candidate) => {
        const candidateDomain = normalizeDomain(String(candidate.website ?? ''))
        const candidatePhone = normalizePhone(String(candidate.phone ?? ''))
        const candidateName = normalize(String(candidate.name ?? ''))

        return (
          (companyDomain && candidateDomain === companyDomain) ||
          (companyName && candidateName === companyName) ||
          (companyPhone && candidatePhone === companyPhone)
        )
      })
      const exactContact = contactMatches.find((candidate) => {
        const candidateEmail = normalize(String(candidate.email ?? ''))
        const candidatePhone = normalizePhone(String(candidate.mobile ?? ''))

        return (
          (contactEmail && candidateEmail === contactEmail) ||
          (contactPhone && candidatePhone === contactPhone)
        )
      })

      setCompanyCandidates(companyMatches)
      setContactCandidates(contactMatches)
      setDealCandidates(dealMatches)
      setExactCompanyId(exactCompany?.id ?? null)
      setExactContactId(exactContact?.id ?? null)

      if (exactCompany?.id) setSelectedCompanyId(exactCompany.id)
      if (exactContact?.id) setSelectedContactId(exactContact.id)

      const precheckDetails: Array<StepDetail> = []
      precheckDetails.push(
        detail(
          'success',
          t('leads.convert.check.dealName', { value: form.dealName }),
        ),
      )
      if (mode === 'company_contact_deal') {
        precheckDetails.push(
          detail(
            'success',
            t('leads.convert.check.companyName', { value: form.companyName }),
          ),
        )
      }
      if (mode !== 'deal_only') {
        precheckDetails.push(
          detail(
            'success',
            t('leads.convert.check.contactName', { value: form.contactName }),
          ),
        )
      }
      if (mode === 'company_contact_deal') {
        if (companyMatches.length > 0) {
          precheckDetails.push(
            detail(
              exactCompany ? 'warn' : 'info',
              exactCompany
                ? t('leads.convert.check.similarCompaniesFound', {
                    count: companyMatches.length,
                    name: exactCompany.name,
                  })
                : t('leads.convert.check.similarCompaniesSuggested', {
                    count: companyMatches.length,
                  }),
            ),
          )
        } else {
          precheckDetails.push(
            detail('success', t('leads.convert.check.noCompanyConflict')),
          )
        }
      }
      if (mode !== 'deal_only') {
        if (contactMatches.length > 0) {
          precheckDetails.push(
            detail(
              exactContact ? 'warn' : 'info',
              exactContact
                ? t('leads.convert.check.similarContactsFound', {
                    count: contactMatches.length,
                    name: exactContact.name,
                  })
                : t('leads.convert.check.similarContactsSuggested', {
                    count: contactMatches.length,
                  }),
            ),
          )
        } else {
          precheckDetails.push(
            detail('success', t('leads.convert.check.noContactConflict')),
          )
        }
      }
      if (dealMatches.length > 0) {
        const first = dealMatches[0]
        precheckDetails.push(
          detail(
            'warn',
            t('leads.convert.check.previousDeals', {
              count: dealMatches.length,
              name: first?.name ?? t('common.unknown'),
            }),
          ),
        )
      } else {
        precheckDetails.push(
          detail('success', t('leads.convert.check.noDealConflict')),
        )
      }
      setStepDetail('precheck', precheckDetails)

      setPrecheckSummary({
        company:
          mode === 'company_contact_deal'
            ? {
                status:
                  companyMatches.length === 0
                    ? 'clean'
                    : exactCompany
                      ? 'exact'
                      : 'matches',
                count: companyMatches.length,
                exactName: exactCompany?.name,
              }
            : { status: 'unchecked', count: 0 },
        contact:
          mode !== 'deal_only'
            ? {
                status:
                  contactMatches.length === 0
                    ? 'clean'
                    : exactContact
                      ? 'exact'
                      : 'matches',
                count: contactMatches.length,
                exactName: exactContact?.name,
              }
            : { status: 'unchecked', count: 0 },
        deal: {
          status: dealMatches.length === 0 ? 'clean' : 'matches',
          count: dealMatches.length,
          exactName: dealMatches[0]?.name,
        },
      })

      setDuplicatesChecked(true)
      const hasAnyMatch =
        companyMatches.length > 0 ||
        contactMatches.length > 0 ||
        dealMatches.length > 0
      logLeadConvertEvent('info', 'precheck_completed', {
        leadId: lead?.id,
        mode,
        companyMatches: companyMatches.length,
        contactMatches: contactMatches.length,
        dealMatches: dealMatches.length,
        exactCompanyId: exactCompany?.id ?? null,
        exactContactId: exactContact?.id ?? null,
        hasAnyMatch,
      })
      setStep('precheck', hasAnyMatch ? 'warn' : 'done')
    } catch (error) {
      if (controller.signal.aborted || isAbortLikeError(error)) {
        return
      }
      setStep('precheck', 'failed')
      const errMsg = getErrorMessage(error, t)
      setStepDetail('precheck', [
        detail(
          'error',
          t('leads.convert.result.errorPrefix', { message: errMsg }),
        ),
      ])
      setErrorMessage(errMsg)
      logLeadConvertEvent('error', 'precheck_failed', {
        leadId: lead?.id,
        mode,
        message: errMsg,
      })
    } finally {
      if (duplicateCheckRef.current.requestId === requestId) {
        duplicateCheckRef.current.controller = null
        setIsWorking(false)
      }
    }
  }

  const focusMissingField = (
    tab: 'company' | 'contact' | 'deal',
    fieldKey: string,
  ) => {
    setActiveTab(tab)
    requestAnimationFrame(() => {
      const node = document.querySelector(`[data-field-key="${fieldKey}"]`)
      if (node instanceof HTMLElement) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
        node.classList.add('ring-2', 'ring-destructive/70')
        window.setTimeout(() => {
          node.classList.remove('ring-2', 'ring-destructive/70')
        }, 1800)
      }
    })
  }

  type MissingField = {
    tab: 'company' | 'contact' | 'deal'
    fieldKey: string
    label: string
  }

  const findMissingField = (): MissingField | null => {
    const checkRow = (
      tab: 'company' | 'contact' | 'deal',
      slug: string,
      label: string,
      value: string,
    ): MissingField | null => {
      if (value.trim()) return null
      return { tab, fieldKey: `${tab}:${slug}`, label }
    }

    if (mode === 'company_contact_deal' && selectedCompanyId === null) {
      const companyChecks: Array<MissingField | null> = [
        checkRow(
          'company',
          'name',
          t('leads.convert.field.companyName'),
          form.companyName,
        ),
        ...(leadCompanyIndustryName && !effectiveCompanyIndustryId
          ? [
              checkRow(
                'company',
                'industry',
                t('leads.convert.field.industry'),
                effectiveCompanyIndustryId,
              ),
            ]
          : []),
        ...(leadCompanySizeName &&
        companySizeSelectOptions.length > 0 &&
        !effectiveCompanySizeId
          ? [
              checkRow(
                'company',
                'company_size',
                t('leads.convert.field.companySize'),
                effectiveCompanySizeId,
              ),
            ]
          : []),
      ]
      const firstCompany = companyChecks.find(
        (c): c is MissingField => c !== null,
      )
      if (firstCompany) return firstCompany
    }

    if (mode !== 'deal_only' && selectedContactId === null) {
      const contactChecks: Array<MissingField | null> = [
        checkRow(
          'contact',
          'name',
          t('leads.convert.field.contactName'),
          form.contactName,
        ),
      ]
      const firstContact = contactChecks.find(
        (c): c is MissingField => c !== null,
      )
      if (firstContact) return firstContact
    }

    const dealChecks: Array<MissingField | null> = [
      checkRow(
        'deal',
        'name',
        t('leads.convert.field.dealName'),
        form.dealName,
      ),
      checkRow(
        'deal',
        'stage',
        t('leads.convert.field.stage'),
        effectiveStageId,
      ),
      ...(leadSourceName && !effectiveLeadSourceId
        ? [
            checkRow(
              'deal',
              'lead_source',
              t('leads.convert.field.leadSource'),
              effectiveLeadSourceId,
            ),
          ]
        : []),
      ...(leadTypeName && !effectiveCustomerTypeId
        ? [
            checkRow(
              'deal',
              'customer_type',
              t('leads.convert.field.customerType'),
              effectiveCustomerTypeId,
            ),
          ]
        : []),
    ]
    const firstDeal = dealChecks.find((c): c is MissingField => c !== null)
    if (firstDeal) return firstDeal

    return null
  }

  const lookupOptionLabel = (
    options: Array<SelectOption>,
    id: string,
  ): string => options.find((o) => o.value === id)?.label ?? ''

  const findChangedFromLead = () => {
    const changes: Array<LeadConvertPendingChange> = []
    const push = (
      tab: 'company' | 'contact' | 'deal',
      label: string,
      sourceText: string,
      targetText: string,
      restore: () => void,
    ) => {
      const src = (sourceText || '').trim()
      const tgt = (targetText || '').trim()
      if (src && src !== tgt) {
        changes.push({ tab, label, sourceText: src, targetText: tgt, restore })
      }
    }

    if (mode === 'company_contact_deal' && selectedCompanyId === null) {
      push(
        'company',
        t('leads.convert.field.companyName'),
        lead?.company_name_text || '',
        form.companyName,
        () => updateForm('companyName', lead?.company_name_text || ''),
      )
      push(
        'company',
        t('leads.convert.field.companyEmail'),
        lead?.company_email || '',
        form.companyEmail,
        () => updateForm('companyEmail', lead?.company_email || ''),
      )
      push(
        'company',
        t('leads.convert.field.companyPhone'),
        lead?.company_phone || '',
        form.companyPhone,
        () => updateForm('companyPhone', lead?.company_phone || ''),
      )
      push(
        'company',
        t('leads.convert.field.website'),
        lead?.website || '',
        form.companyWebsite,
        () => updateForm('companyWebsite', lead?.website || ''),
      )
      push(
        'company',
        t('leads.convert.field.address'),
        lead?.address || '',
        form.companyAddress,
        () => updateForm('companyAddress', lead?.address || ''),
      )
      push(
        'company',
        t('leads.convert.field.city'),
        lead?.city || '',
        form.companyCity,
        () => updateForm('companyCity', lead?.city || ''),
      )
      push(
        'company',
        t('leads.convert.field.industry'),
        leadCompanyIndustryName,
        lookupOptionLabel(industrySelectOptions, effectiveCompanyIndustryId),
        () => updateForm('companyIndustry', mappedCompanyIndustryId || ''),
      )
      if (companySizeSelectOptions.length > 0) {
        push(
          'company',
          t('leads.convert.field.companySize'),
          leadCompanySizeName,
          lookupOptionLabel(companySizeSelectOptions, effectiveCompanySizeId),
          () => updateForm('companySize', mappedCompanySizeId || ''),
        )
      }
    }
    if (mode !== 'deal_only' && selectedContactId === null) {
      push(
        'contact',
        t('leads.convert.field.contactName'),
        lead?.name || '',
        form.contactName,
        () => updateForm('contactName', lead?.name || ''),
      )
      push(
        'contact',
        t('leads.convert.field.jobTitle'),
        lead?.contact_job_title || '',
        form.contactJobTitle,
        () => updateForm('contactJobTitle', lead?.contact_job_title || ''),
      )
      push(
        'contact',
        t('leads.convert.field.email'),
        lead?.email || '',
        form.contactEmail,
        () => updateForm('contactEmail', lead?.email || ''),
      )
      push(
        'contact',
        t('leads.convert.field.phone'),
        lead?.phone || '',
        form.contactPhone,
        () => updateForm('contactPhone', lead?.phone || ''),
      )
    }
    push(
      'deal',
      t('leads.convert.field.estimatedValue'),
      lead?.deal_value ? String(lead.deal_value) : '',
      form.dealValue,
      () =>
        updateForm(
          'dealValue',
          lead?.deal_value ? String(lead.deal_value) : '',
        ),
    )
    push(
      'deal',
      t('leads.convert.field.description'),
      lead?.contact_message || '',
      form.notes,
      () => updateForm('notes', lead?.contact_message || ''),
    )
    push(
      'deal',
      t('leads.convert.field.leadSource'),
      leadSourceName,
      lookupOptionLabel(leadSourceSelectOptions, effectiveLeadSourceId),
      () => updateForm('dealLeadSourceId', mappedDealLeadSourceId || ''),
    )
    push(
      'deal',
      t('leads.convert.field.customerType'),
      leadTypeName,
      lookupOptionLabel(customerTypeSelectOptions, effectiveCustomerTypeId),
      () => updateForm('dealCustomerTypeId', mappedCustomerTypeId || ''),
    )
    return changes
  }

  const fetchLatestLeadConversion = async () => {
    if (!client || !lead?.id) return null

    return client
      .get(`/v1/apps/base_crm/data-sources/leads/items/${lead.id}`, {
        columns: [
          'id',
          'converted_organization(id,name)',
          'converted_contact(id,name)',
          'converted_deal(id,name)',
          'conversion_state',
          'conversion_mode',
          'conversion_error_message',
        ],
      })
      .catch(() => null)
  }

  const findExistingRecordFromLead = async (
    endpoint: string,
    columns: string,
  ) => {
    if (!client || !lead?.id) return undefined

    const response = await client
      .get(endpoint, {
        columns,
        filters: {
          rules: [{ field: 'source_lead', operator: '=', value: lead.id }],
        },
        limit: 1,
      })
      .catch(() => [])

    return firstItem(response)
  }

  const runConversion = async (options?: { skipChangeCheck?: boolean }) => {
    if (!client || !lead?.id) return

    if (!duplicatesChecked) {
      await findDuplicates()
      return
    }

    const missing = findMissingField()
    if (missing) {
      const message = t('leads.convert.validation.missingField', {
        label: missing.label,
      })
      setErrorMessage(message)
      toast.error(message)
      focusMissingField(missing.tab, missing.fieldKey)
      return
    }

    if (!options?.skipChangeCheck && !changesConfirmed) {
      const changes = findChangedFromLead()
      if (changes.length > 0) {
        setPendingChanges(changes)
        return
      }
    }

    progressSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })

    await new Promise((resolve) => window.setTimeout(resolve, 350))

    setIsWorking(true)
    setErrorMessage(null)

    let organizationId =
      getRelationId(lead.converted_organization) ??
      selectedCompanyId ??
      undefined
    let contactId =
      getRelationId(lead.converted_contact) ?? selectedContactId ?? undefined
    let dealId = getRelationId(lead.converted_deal)
    let activeStep = 'lead'
    const runStep = (step: string, state: StepState) => {
      activeStep = step
      setStep(step, state)
    }

    try {
      const latestLead = await fetchLatestLeadConversion()
      const latestDealId = getRelationId(latestLead?.converted_deal)
      const latestStateName = normalizeConversionKey(
        getRelationName(latestLead?.conversion_state),
      )

      if (latestLead && isLeadConvertedRecord(latestLead)) {
        setStep('lead', 'done')
        setStepDetail('lead', [
          detail('info', t('leads.convert.result.alreadyCompleted')),
        ])
        toast.info(t('leads.convert.result.alreadyCompleted'))
        onOpenChange(false)
        if (latestDealId) {
          void navigate({
            to: '/deals/$dealId',
            params: { dealId: latestDealId },
          })
        }
        return
      }

      const latestHasAnyCreated = Boolean(
        getRelationId(latestLead?.converted_organization) ||
        getRelationId(latestLead?.converted_contact) ||
        latestDealId,
      )

      if (
        latestStateName === normalizeConversionKey('in_progress') &&
        !latestHasAnyCreated
      ) {
        throw new Error(t('leads.convert.validation.alreadyInProgress'))
      }

      organizationId =
        getRelationId(latestLead?.converted_organization) ?? organizationId
      contactId = getRelationId(latestLead?.converted_contact) ?? contactId
      dealId = latestDealId ?? dealId

      runStep('precheck', 'running')
      const me = await client
        .get<CurrentUserResponse>('/v1/users/me')
        .catch(() => null)
      const convertedLeadStatusValue = requireEnumValue(
        leadStatusOptions,
        'Converted',
        t('leads.status', { defaultValue: 'Lead status' }),
      )
      await updateLead({
        conversion_state: conversionStateValue('in_progress'),
        conversion_mode: conversionModeValue(mode),
        conversion_error_message: null,
      })
      addStepDetail(
        'precheck',
        detail(
          'info',
          t('leads.convert.conversionMode', { mode: MODE_LABELS[mode] }),
        ),
      )
      addStepDetail('precheck', detail('info', t('leads.convert.leadStatus')))
      setStep('precheck', 'done')

      if (mode === 'company_contact_deal') {
        runStep('organization', 'running')
        if (!organizationId) {
          const existingOrganization = await findExistingRecordFromLead(
            '/v1/apps/base/data-sources/organization/items',
            'id,name',
          )
          organizationId = existingOrganization?.id
        }
        const isReusedOrg = Boolean(organizationId)
        if (!organizationId) {
          const orgExtras = Object.fromEntries(
            extraFields.company
              .filter((field) => field.value !== '')
              .map((field) => [field.slug, field.value]),
          )
          const organization = await client.post(
            '/v1/apps/base/data-sources/organization/items',
            {
              name: form.companyName || form.contactName,
              email: form.companyEmail || undefined,
              phone: form.companyPhone || undefined,
              website: form.companyWebsite || undefined,
              address: form.companyAddress || undefined,
              city: form.companyCity || undefined,
              industry: effectiveCompanyIndustryId || undefined,
              company_size: effectiveCompanySizeId || undefined,
              country: getRelationId(lead.countries),
              source_lead: lead.id,
              ...orgExtras,
            },
          )
          organizationId = organization?.id
        }
        await updateLead({ converted_organization: organizationId })
        setStepDetail('organization', [
          detail(
            'success',
            isReusedOrg
              ? t('leads.convert.result.reusedOrganization', {
                  name: form.companyName,
                })
              : t('leads.convert.result.newOrganization', {
                  name: form.companyName,
                }),
          ),
          ...(organizationId
            ? [detail('neutral', `ID: ${organizationId}`)]
            : []),
        ])
        setStep('organization', 'done')
      } else {
        setStepDetail('organization', [
          detail('neutral', t('leads.convert.result.skipped')),
        ])
        setStep('organization', 'skipped')
      }

      if (mode !== 'deal_only') {
        runStep('contact', 'running')
        if (!contactId) {
          const existingContact = await findExistingRecordFromLead(
            '/v1/apps/base/data-sources/contact/items',
            'id,name',
          )
          contactId = existingContact?.id
        }
        const isReusedContact = Boolean(contactId)
        if (!contactId) {
          const contactExtras = Object.fromEntries(
            extraFields.contact
              .filter((field) => field.value !== '')
              .map((field) => [field.slug, field.value]),
          )
          const contact = await client.post(
            '/v1/apps/base/data-sources/contact/items',
            {
              name: form.contactName,
              email: form.contactEmail || undefined,
              mobile: form.contactPhone || undefined,
              job_title: form.contactJobTitle || undefined,
              organization: organizationId,
              source_lead: lead.id,
              ...contactExtras,
            },
          )
          contactId = contact?.id
        }
        await updateLead({ converted_contact: contactId })
        setStepDetail('contact', [
          detail(
            'success',
            isReusedContact
              ? t('leads.convert.result.reusedContact', {
                  name: form.contactName,
                })
              : t('leads.convert.result.newContact', {
                  name: form.contactName,
                }),
          ),
          ...(contactId ? [detail('neutral', `ID: ${contactId}`)] : []),
        ])
        setStep('contact', 'done')
      } else {
        setStepDetail('contact', [
          detail('neutral', t('leads.convert.result.skipped')),
        ])
        setStep('contact', 'skipped')
      }

      runStep('deal', 'running')
      if (!dealId) {
        const existingDeal = await findExistingRecordFromLead(
          '/v1/apps/base_crm/data-sources/deal/items',
          'id,name,stage(id,name),organization(id,name),source_lead(id,name)',
        )
        dealId = existingDeal?.id
      }
      const isReusedDeal = Boolean(dealId)
      if (!dealId) {
        const dealExtras = Object.fromEntries(
          extraFields.deal
            .filter((field) => field.value !== '')
            .map((field) => [field.slug, field.value]),
        )
        const deal = await client.post(
          '/v1/apps/base_crm/data-sources/deal/items',
          {
            name: form.dealName,
            organization: organizationId,
            contact_person: contactId,
            stage: effectiveStageId || undefined,
            lead_source: effectiveLeadSourceId || undefined,
            customer_type: effectiveCustomerTypeId || undefined,
            country: getRelationId(lead.countries),
            record_owner: getRelationId(lead.record_owner),
            deal_value: form.dealValue ? Number(form.dealValue) : undefined,
            description: form.notes || undefined,
            source_lead: lead.id,
            ...dealExtras,
          },
        )
        dealId = deal?.id
      }
      await updateLead({ converted_deal: dealId })
      const dealDetails: Array<StepDetail> = [
        detail(
          'success',
          isReusedDeal
            ? t('leads.convert.result.reusedDeal', { name: form.dealName })
            : t('leads.convert.result.newDeal', { name: form.dealName }),
        ),
        detail('info', t('leads.convert.result.stage')),
      ]
      if (mappedDealLeadSourceId)
        dealDetails.push(
          detail('info', t('leads.convert.result.leadSourceMapped')),
        )
      if (mappedCustomerTypeId)
        dealDetails.push(
          detail('info', t('leads.convert.result.customerTypeMapped')),
        )
      if (form.dealValue)
        dealDetails.push(
          detail(
            'info',
            t('leads.convert.result.estimatedValue', { value: form.dealValue }),
          ),
        )
      setStepDetail('deal', dealDetails)
      setStep('deal', 'done')

      runStep('activity', 'running')
      const linkedWorkMigration = await migrateLinkedWork({
        organizationId,
        contactId,
        dealId,
      })
      const linkedWorkHasWarning =
        linkedWorkMigration.failedCount > 0 ||
        linkedWorkMigration.warningCount > 0
      const linkedWorkDetails: Array<StepDetail> = []
      if (linkedWorkMigration.updatedCount > 0) {
        linkedWorkDetails.push(
          detail('success', t('leads.convert.result.linkedWorkMoved')),
        )
      }
      if (linkedWorkHasWarning) {
        const warning = t('leads.convert.result.linkedWorkWarning', {
          count:
            linkedWorkMigration.failedCount + linkedWorkMigration.warningCount,
        })
        linkedWorkDetails.push(detail('warn', warning))
        toast.warning(warning)
        logLeadConvertEvent('warn', 'linked_work_migration_warning', {
          leadId: lead?.id,
          mode,
          attemptedCount: linkedWorkMigration.attemptedCount,
          updatedCount: linkedWorkMigration.updatedCount,
          failedCount: linkedWorkMigration.failedCount,
          warningCount: linkedWorkMigration.warningCount,
          organizationId,
          contactId,
          dealId,
        })
      }
      if (linkedWorkDetails.length === 0) {
        linkedWorkDetails.push(
          detail('neutral', t('leads.convert.result.noLinkedWork')),
        )
      }
      setStepDetail('activity', linkedWorkDetails)
      setStep(
        'activity',
        linkedWorkHasWarning
          ? 'warn'
          : linkedWorkMigration.updatedCount > 0
            ? 'done'
            : 'skipped',
      )

      runStep('lead', 'running')
      await updateLead({
        lead_status: convertedLeadStatusValue,
        converted_deal: dealId,
        converted_contact: contactId,
        converted_organization: organizationId,
        converted_on: new Date().toISOString(),
        converted_by: me?.id,
        conversion_state: conversionStateValue('completed'),
        conversion_mode: conversionModeValue(mode),
        conversion_error_message: null,
      })
      setStepDetail('lead', [
        detail('success', t('leads.convert.result.leadStatusConverted')),
        detail(
          'info',
          t('leads.convert.result.completedAt', {
            date: new Date().toLocaleString(),
          }),
        ),
      ])
      setStep('lead', 'done')

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
        queryClient.invalidateQueries({ queryKey: ['deals'] }),
        queryClient.invalidateQueries({ queryKey: ['contacts'] }),
        queryClient.invalidateQueries({ queryKey: ['companies'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
      ])

      logLeadConvertEvent('info', 'conversion_completed', {
        leadId: lead?.id,
        mode,
        organizationId,
        contactId,
        dealId,
        linkedWorkAttemptedCount: linkedWorkMigration.attemptedCount,
        linkedWorkUpdatedCount: linkedWorkMigration.updatedCount,
        linkedWorkFailedCount: linkedWorkMigration.failedCount,
        linkedWorkWarningCount: linkedWorkMigration.warningCount,
      })
      toast.success(t('leads.convert.successMessage'), {
        description: (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dealId ? (
              <button
                type="button"
                className="rounded border bg-background px-2 py-1 text-[11px] font-medium text-foreground shadow-sm hover:bg-accent"
                onClick={() =>
                  void navigate({ to: '/deals/$dealId', params: { dealId } })
                }
              >
                {t('leads.convert.successAction.openDeal')}
              </button>
            ) : null}
            {organizationId ? (
              <button
                type="button"
                className="rounded border bg-background px-2 py-1 text-[11px] font-medium text-foreground shadow-sm hover:bg-accent"
                onClick={() =>
                  void navigate({
                    to: '/companies/$companyId',
                    params: { companyId: organizationId },
                  })
                }
              >
                {t('leads.convert.successAction.openCompany')}
              </button>
            ) : null}
            {contactId ? (
              <button
                type="button"
                className="rounded border bg-background px-2 py-1 text-[11px] font-medium text-foreground shadow-sm hover:bg-accent"
                onClick={() =>
                  void navigate({
                    to: '/contacts/$contactId',
                    params: { contactId },
                  })
                }
              >
                {t('leads.convert.successAction.openContact')}
              </button>
            ) : null}
          </div>
        ),
      })
      onOpenChange(false)
      if (dealId) {
        void navigate({ to: '/deals/$dealId', params: { dealId } })
      }
    } catch (error) {
      const message = getErrorMessage(error, t)
      const partial = Boolean(organizationId || contactId || dealId)
      setErrorMessage(message)
      setStep(activeStep, 'failed')
      setStepDetail(activeStep, [
        detail('error', t('leads.convert.result.errorPrefix', { message })),
      ])
      logLeadConvertEvent('error', 'conversion_failed', {
        leadId: lead?.id,
        mode,
        activeStep,
        partial,
        message,
        organizationId,
        contactId,
        dealId,
      })
      await updateLead({
        converted_organization: organizationId,
        converted_contact: contactId,
        converted_deal: dealId,
        conversion_state: conversionStateValue(partial ? 'partial' : 'failed'),
        conversion_error_message: message,
      }).catch(() => undefined)
      toast.error(message)
    } finally {
      setIsWorking(false)
    }
  }

  const formDisabled = isWorking || isAlreadyCompleted
  const currentProgressStepKey = useMemo(() => {
    const entries = Object.entries(steps)
    return (
      entries.find(([, state]) => state === 'running')?.[0] ??
      entries.find(([, state]) => state === 'failed')?.[0] ??
      entries.find(([, state]) => state === 'warn')?.[0]
    )
  }, [steps])
  const skippedModeTargets = useMemo(() => {
    const skipped: Array<string> = []
    const hasCompanyDraft = Boolean(
      form.companyName.trim() ||
      form.companyEmail.trim() ||
      form.companyPhone.trim() ||
      form.companyWebsite.trim() ||
      form.companyAddress.trim() ||
      form.companyCity.trim() ||
      form.companyIndustryId ||
      form.companySizeId ||
      extraFields.company.length,
    )
    const hasContactDraft = Boolean(
      form.contactName.trim() ||
      form.contactEmail.trim() ||
      form.contactPhone.trim() ||
      form.contactJobTitle.trim() ||
      extraFields.contact.length,
    )

    if (mode !== 'company_contact_deal' && hasCompanyDraft) {
      skipped.push(TARGET_LABEL.company)
    }
    if (mode === 'deal_only' && hasContactDraft) {
      skipped.push(TARGET_LABEL.contact)
    }
    return skipped
  }, [
    TARGET_LABEL,
    extraFields.company.length,
    extraFields.contact.length,
    form,
    mode,
  ])

  const sourceDealName =
    [lead?.company_name_text, lead?.name].filter(Boolean).join(' - ') ||
    lead?.name ||
    t('leads.convert.dealDefaultName')

  const setExtraValue = (
    target: 'company' | 'contact' | 'deal',
    slug: string,
    value: string,
  ) => {
    setExtraFields((current) => ({
      ...current,
      [target]: current[target].map((field) =>
        field.slug === slug ? { ...field, value } : field,
      ),
    }))
  }

  const removeExtraField = (
    target: 'company' | 'contact' | 'deal',
    slug: string,
  ) => {
    setExtraFields((current) => ({
      ...current,
      [target]: current[target].filter((field) => field.slug !== slug),
    }))
  }

  const inferKindFromType = (type: string): FieldKind => {
    if (type === 'field-money' || type === 'field-number') return 'number'
    if (type === 'field-date' || type === 'field-dateTime') return 'date'
    if (type === 'field-textarea') return 'textarea'
    if (type === 'field-email') return 'email'
    if (type === 'field-phone') return 'phone'
    if (type === 'field-url') return 'url'
    return 'text'
  }

  const availableExtraFieldsByTarget = useMemo(() => {
    const build = (target: ConvertTarget) => {
      const known = new Set(KNOWN_FIELDS[target])
      const alreadyAdded = new Set(
        extraFields[target].map((field) => field.slug),
      )
      return targetFields[target].filter(
        (field) =>
          !known.has(field.slug) &&
          !SYSTEM_HIDDEN_FIELDS.has(field.slug) &&
          !alreadyAdded.has(field.slug),
      )
    }

    return {
      company: build('company'),
      contact: build('contact'),
      deal: build('deal'),
    }
  }, [extraFields, targetFields])

  const availableExtraFields = (target: ConvertTarget) =>
    availableExtraFieldsByTarget[target]

  const addExtraField = (
    target: ConvertTarget,
    field: { slug: string; name: string; type: string },
  ) => {
    setExtraFields((current) => ({
      ...current,
      [target]: [
        ...current[target],
        {
          slug: field.slug,
          label: field.name,
          kind: inferKindFromType(field.type),
          value: '',
        },
      ],
    }))
    requestAnimationFrame(() => {
      const node = document.querySelector(
        `[data-field-key="${target}:${field.slug}"]`,
      )
      if (node instanceof HTMLElement) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
        node.classList.add('ring-2', 'ring-primary/60')
        window.setTimeout(() => {
          node.classList.remove('ring-2', 'ring-primary/60')
        }, 1400)
      }
    })
  }

  return (
    <AwesomeDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isWorking) return
        onOpenChange(nextOpen)
      }}
      container="modal"
      size="xl"
    >
      <AwesomeDialogHeader
        title={t('leads.convert.title')}
        description={t('leads.convert.description')}
      />

      <AwesomeDialogBody>
        <div className="space-y-5">
          {isAlreadyCompleted && (
            <Alert>
              <CheckCircle2 />
              <AlertTitle>
                {t('leads.convert.alert.alreadyConvertedTitle')}
              </AlertTitle>
              <AlertDescription>
                {t('leads.convert.alert.alreadyConvertedDescription')}
              </AlertDescription>
            </Alert>
          )}

          {hasPartialState && (
            <Alert>
              <AlertCircle />
              <AlertTitle>{t('leads.convert.alert.partialTitle')}</AlertTitle>
              <AlertDescription>
                {t('leads.convert.alert.partialDescription')}
                {typeof lead?.conversion_error_message === 'string' &&
                lead.conversion_error_message ? (
                  <span className="mt-1 block text-xs">
                    {t('leads.convert.result.previousError', {
                      message: lead.conversion_error_message,
                    })}
                  </span>
                ) : null}
              </AlertDescription>
            </Alert>
          )}

          {hasFailedAttempt && (
            <Alert>
              <AlertCircle />
              <AlertTitle>{t('leads.convert.alert.failedTitle')}</AlertTitle>
              <AlertDescription>
                {t('leads.convert.alert.failedDescription')}
                {typeof lead?.conversion_error_message === 'string' &&
                lead.conversion_error_message ? (
                  <span className="mt-1 block text-xs">
                    {t('leads.convert.result.previousError', {
                      message: lead.conversion_error_message,
                    })}
                  </span>
                ) : null}
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>{t('leads.convert.alert.errorTitle')}</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <LeadConvertModeSelector
            mode={mode}
            disabled={isWorking || isAlreadyCompleted}
            skippedTargets={skippedModeTargets}
            onModeChange={(nextMode) => {
              setMode(nextMode)
              setDuplicatesChecked(false)
            }}
          />

          <div ref={progressSectionRef}>
            <LeadConvertProgress
              progress={progress}
              steps={steps}
              stepDetails={stepDetails}
              stepLabels={STEP_LABELS}
              currentStepKey={currentProgressStepKey}
              duplicatesChecked={duplicatesChecked}
              precheckSummary={precheckSummary}
            />
          </div>

          <LeadConvertTabs
            mode={mode}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            targetLabels={TARGET_LABEL}
            lead={lead}
            form={form}
            updateForm={updateForm}
            formDisabled={formDisabled}
            isWorking={isWorking}
            sourceDealName={sourceDealName}
            companyCandidates={companyCandidates}
            contactCandidates={contactCandidates}
            dealCandidates={dealCandidates}
            selectedCompanyId={selectedCompanyId}
            selectedContactId={selectedContactId}
            exactCompanyId={exactCompanyId}
            exactContactId={exactContactId}
            onSelectCompany={setSelectedCompanyId}
            onSelectContact={setSelectedContactId}
            industrySelectOptions={industrySelectOptions}
            companySizeSelectOptions={companySizeSelectOptions}
            stageSelectOptions={stageSelectOptions}
            leadSourceSelectOptions={leadSourceSelectOptions}
            customerTypeSelectOptions={customerTypeSelectOptions}
            effectiveCompanyIndustryId={effectiveCompanyIndustryId}
            mappedCompanyIndustryId={mappedCompanyIndustryId}
            effectiveCompanySizeId={effectiveCompanySizeId}
            mappedCompanySizeId={mappedCompanySizeId}
            effectiveStageId={effectiveStageId}
            newStageId={newStageId}
            effectiveLeadSourceId={effectiveLeadSourceId}
            mappedDealLeadSourceId={mappedDealLeadSourceId}
            effectiveCustomerTypeId={effectiveCustomerTypeId}
            mappedCustomerTypeId={mappedCustomerTypeId}
            leadCompanyIndustryName={leadCompanyIndustryName}
            leadCompanySizeName={leadCompanySizeName}
            leadSourceName={leadSourceName}
            leadTypeName={leadTypeName}
            extraFields={extraFields}
            availableExtraFields={availableExtraFields}
            addExtraField={addExtraField}
            setExtraValue={setExtraValue}
            removeExtraField={removeExtraField}
          />
        </div>
      </AwesomeDialogBody>

      <AwesomeDialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isWorking}
          onClick={() => onOpenChange(false)}
        >
          {t('leads.convert.footer.close')}
        </Button>
        {isAlreadyCompleted && getRelationId(lead?.converted_deal) ? (
          <Button
            type="button"
            onClick={() => {
              const dealId = getRelationId(lead.converted_deal)
              if (!dealId) return
              void navigate({ to: '/deals/$dealId', params: { dealId } })
            }}
          >
            {t('leads.convert.footer.openDeal')}
          </Button>
        ) : (
          <Button type="button" disabled={isWorking} onClick={runConversion}>
            {isWorking && <Loader2 className="mr-2 size-4 animate-spin" />}
            {duplicatesChecked
              ? t('leads.convert.footer.convert')
              : t('leads.convert.footer.check')}
          </Button>
        )}
      </AwesomeDialogFooter>

      <LeadConvertChangeConfirmDialog
        changes={pendingChanges}
        targetLabels={TARGET_LABEL}
        onClose={() => setPendingChanges(null)}
        onRestoreChange={(index) => {
          setPendingChanges((current) => {
            const nextChanges = (current ?? []).filter(
              (_, changeIndex) => changeIndex !== index,
            )
            return nextChanges.length > 0 ? nextChanges : null
          })
        }}
        onConfirm={() => {
          setPendingChanges(null)
          setChangesConfirmed(true)
          void runConversion({ skipChangeCheck: true })
        }}
      />
    </AwesomeDialog>
  )
}
