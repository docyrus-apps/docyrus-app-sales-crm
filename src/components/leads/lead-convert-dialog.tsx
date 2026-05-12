/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useDocyrusClient } from '@docyrus/signin'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  CircleDashed,
  Info,
  Loader2,
  Plus,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { AwesomeDialog } from '@/components/docyrus/awesome-dialog/awesome-dialog'
import { AwesomeDialogBody } from '@/components/docyrus/awesome-dialog/awesome-dialog-body'
import { AwesomeDialogFooter } from '@/components/docyrus/awesome-dialog/awesome-dialog-footer'
import { AwesomeDialogHeader } from '@/components/docyrus/awesome-dialog/awesome-dialog-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  FieldMappingRow,
  type FieldKind,
  type SelectOption,
} from '@/components/leads/field-mapping-row'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { createDataSourceClient } from '@docyrus/app-utils'
import { useEnumEntities } from '@/hooks/use-enums'
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
type PendingChange = {
  tab: ConvertTarget
  label: string
  sourceText: string
  targetText: string
  restore: () => void
}
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

function optionByName(
  options: Array<{ id: string; name: string }>,
  name?: string,
): string | undefined {
  if (!name) return undefined
  const normalized = normalizeConversionKey(name)
  return options.find(
    (option) => normalizeConversionKey(option.name) === normalized,
  )?.id
}

function mapLeadTypeToCustomerType(
  options: Array<{ id: string; name: string }>,
  leadTypeName?: string,
): string | undefined {
  const normalized = normalize(leadTypeName)
  if (normalized.includes('existing'))
    return optionByName(options, 'Existing Business')
  if (normalized.includes('new')) return optionByName(options, 'New Business')

  return undefined
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

function renderDetailIcon(tone: DetailTone) {
  if (tone === 'success')
    return <CheckCircle2 className="mt-0.5 size-3.5 text-emerald-600" />
  if (tone === 'warn')
    return <Sparkles className="mt-0.5 size-3.5 text-amber-600" />
  if (tone === 'error')
    return <XCircle className="mt-0.5 size-3.5 text-destructive" />
  if (tone === 'info') return <Info className="mt-0.5 size-3.5 text-sky-600" />
  return <CircleDashed className="mt-0.5 size-3.5 text-muted-foreground" />
}

function getStepIcon(state: StepState) {
  if (state === 'done')
    return <CheckCircle2 className="size-4 text-emerald-600" />
  if (state === 'warn')
    return <AlertTriangle className="size-4 text-amber-500" />
  if (state === 'running')
    return <Loader2 className="size-4 animate-spin text-sky-600" />
  if (state === 'failed')
    return <AlertCircle className="size-4 text-destructive" />
  if (state === 'skipped')
    return <CircleDashed className="size-4 text-muted-foreground" />

  return <Circle className="size-4 text-muted-foreground" />
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
    useState<Array<PendingChange> | null>(null)
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

  const { data: stageOptions = [] } = useEnumEntities('stage', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal',
  })
  const { data: dealLeadSourceOptions = [] } = useEnumEntities('lead_source', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal',
  })
  const { data: customerTypeOptions = [] } = useEnumEntities('customer_type', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal',
  })
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
  const { data: orgIndustryOptions = [] } = useEnumEntities('industry', {
    appSlug: 'base',
    dataSourceSlug: 'organization',
  })
  const { data: orgTypeOptions = [] } = useEnumEntities('type', {
    appSlug: 'base',
    dataSourceSlug: 'organization',
  })
  const { data: orgCompanySizeOptions = [] } = useEnumEntities('company_size', {
    appSlug: 'base',
    dataSourceSlug: 'organization',
  })

  const newStageId = useMemo(
    () => optionByName(stageOptions, 'New'),
    [stageOptions],
  )
  const mappedDealLeadSourceId = useMemo(
    () =>
      optionByName(dealLeadSourceOptions, getRelationName(lead?.lead_source)),
    [dealLeadSourceOptions, lead?.lead_source],
  )
  const mappedCustomerTypeId = useMemo(
    () =>
      mapLeadTypeToCustomerType(
        customerTypeOptions,
        getRelationName(lead?.lead_type),
      ),
    [customerTypeOptions, lead?.lead_type],
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
    const changes: Array<PendingChange> = []
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

  const toEnumSelectOptions = (
    opts: Array<{ id?: string; name?: string }>,
  ): Array<SelectOption> =>
    opts
      .filter((o): o is { id: string; name: string } => Boolean(o.id && o.name))
      .map((o) => ({ value: o.id, label: o.name }))

  const stageSelectOptions = useMemo(
    () => toEnumSelectOptions(stageOptions),
    [stageOptions],
  )
  const leadSourceSelectOptions = useMemo(
    () => toEnumSelectOptions(dealLeadSourceOptions),
    [dealLeadSourceOptions],
  )
  const customerTypeSelectOptions = useMemo(
    () => toEnumSelectOptions(customerTypeOptions),
    [customerTypeOptions],
  )
  const industrySelectOptions = useMemo(
    () => toEnumSelectOptions(orgIndustryOptions),
    [orgIndustryOptions],
  )
  const companySizeSelectOptions = useMemo(
    () => toEnumSelectOptions(orgCompanySizeOptions),
    [orgCompanySizeOptions],
  )

  const leadCompanyIndustryName = getRelationName(lead?.company_industry) ?? ''
  const leadCompanySizeName = getRelationName(lead?.company_size) ?? ''
  const leadSourceName = getRelationName(lead?.lead_source) ?? ''
  const leadTypeName = getRelationName(lead?.lead_type) ?? ''

  const mappedCompanyIndustryId = useMemo(
    () => optionByName(orgIndustryOptions, leadCompanyIndustryName),
    [orgIndustryOptions, leadCompanyIndustryName],
  )
  const mappedCompanySizeId = useMemo(
    () => optionByName(orgCompanySizeOptions, leadCompanySizeName),
    [orgCompanySizeOptions, leadCompanySizeName],
  )

  const effectiveStageId = form.dealStageId || newStageId || ''
  const effectiveLeadSourceId =
    form.dealLeadSourceId || mappedDealLeadSourceId || ''
  const effectiveCustomerTypeId =
    form.dealCustomerTypeId || mappedCustomerTypeId || ''
  const effectiveCompanyIndustryId =
    form.companyIndustry || mappedCompanyIndustryId || ''
  const effectiveCompanySizeId = form.companySize || mappedCompanySizeId || ''
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

  const renderAddFieldPopover = (target: ConvertTarget) => {
    const targetLabel = TARGET_LABEL[target]
    const options = availableExtraFields(target)
    const addedCount = extraFields[target].length
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={formDisabled || options.length === 0}
            className="h-8"
          >
            <Plus className="mr-1 size-3.5" />
            {t('leads.convert.addField', { target: targetLabel })}
            {addedCount > 0 ? (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 px-1 text-[10px]"
              >
                +{addedCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <div className="max-h-64 overflow-y-auto p-1">
            {options.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                {t('leads.convert.noFieldsAvailable')}
              </p>
            ) : (
              options.map((option) => (
                <button
                  key={option.slug}
                  type="button"
                  onClick={() => addExtraField(target, option)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
                >
                  <span className="truncate">{option.name}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    {option.type.replace('field-', '')}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  const renderReuseBanner = (target: 'company' | 'contact') => {
    const candidates =
      target === 'company' ? companyCandidates : contactCandidates
    if (candidates.length === 0) return null
    const selectedId =
      target === 'company' ? selectedCompanyId : selectedContactId
    const setSelected =
      target === 'company' ? setSelectedCompanyId : setSelectedContactId
    const exactId = target === 'company' ? exactCompanyId : exactContactId
    const isReuse = selectedId !== null
    const entity =
      target === 'company'
        ? t('leads.convert.reuse.entityCompany', { defaultValue: 'company' })
        : t('leads.convert.reuse.entityContact', { defaultValue: 'contact' })
    const targetIcon =
      target === 'company' ? (
        <Building2 className="size-3.5 text-sky-600" />
      ) : (
        <UserRound className="size-3.5 text-emerald-600" />
      )

    return (
      <div className="space-y-3 rounded-lg border-2 border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600" />
          <p className="text-sm font-medium">
            {t('leads.convert.reuse.headline', {
              count: candidates.length,
              entity,
              defaultValue: '{{count}} existing {{entity}} found',
            })}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isWorking}
            aria-pressed={!isReuse}
            onClick={() => setSelected(null)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-md border bg-background p-2.5 text-left transition-colors',
              !isReuse
                ? 'border-primary ring-1 ring-primary'
                : 'border-border hover:border-primary/40',
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Plus className="size-3.5" />
              <span>
                {t('leads.convert.reuse.createOption', {
                  entity,
                  defaultValue: 'Create new {{entity}}',
                })}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t('leads.convert.reuse.createHelp', {
                defaultValue: 'A new record will be created from the lead data',
              })}
            </p>
          </button>
          <button
            type="button"
            disabled={isWorking}
            aria-pressed={isReuse}
            onClick={() => {
              const fallback = exactId ?? candidates[0]?.id ?? null
              setSelected(fallback)
            }}
            className={cn(
              'flex flex-col items-start gap-1 rounded-md border bg-background p-2.5 text-left transition-colors',
              isReuse
                ? 'border-primary ring-1 ring-primary'
                : 'border-border hover:border-primary/40',
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {targetIcon}
              <span>
                {t('leads.convert.reuse.reuseOption', {
                  entity,
                  defaultValue: 'Use existing {{entity}}',
                })}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t('leads.convert.reuse.reuseHelp', {
                defaultValue:
                  'No new record is created — the existing one will be linked',
              })}
            </p>
          </button>
        </div>
        {isReuse ? (
          <div className="space-y-1.5 border-t border-amber-200 pt-2 dark:border-amber-900/40">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
                {t('leads.convert.reuse.pickOne', {
                  defaultValue: 'Which one to use?',
                })}
              </p>
              {candidates.length > 4 ? (
                <span className="text-[10.5px] text-muted-foreground">
                  {t('leads.convert.reuse.candidateCount', {
                    count: candidates.length,
                    defaultValue: '{{count}} options',
                  })}
                </span>
              ) : null}
            </div>
            <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  disabled={isWorking}
                  onClick={() => setSelected(candidate.id ?? null)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-left text-xs transition-colors',
                    selectedId === candidate.id &&
                      'border-primary ring-1 ring-primary',
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium">
                        {candidate.name}
                      </span>
                      {exactId === candidate.id ? (
                        <Badge variant="secondary" className="h-4 text-[10px]">
                          {t('leads.convert.reuse.exactMatchBadge', {
                            defaultValue: 'Exact match',
                          })}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-muted-foreground">
                      {target === 'company'
                        ? candidate.website ||
                          candidate.email ||
                          candidate.phone
                        : candidate.email || candidate.mobile}
                    </p>
                  </div>
                  {selectedId === candidate.id ? (
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const renderPrecheckTooltip = () => {
    const TARGETS: Array<{
      key: 'company' | 'contact' | 'deal'
      icon: ReactNode
      label: string
    }> = [
      {
        key: 'company',
        icon: <Building2 className="size-3.5 text-sky-600" />,
        label: t('leads.convert.target.company', { defaultValue: 'Company' }),
      },
      {
        key: 'contact',
        icon: <UserRound className="size-3.5 text-emerald-600" />,
        label: t('leads.convert.target.contact', { defaultValue: 'Contact' }),
      },
      {
        key: 'deal',
        icon: <CheckCircle2 className="size-3.5 text-violet-600" />,
        label: t('leads.convert.target.deal', { defaultValue: 'Deal' }),
      },
    ]

    const renderTargetCell = (target: PrecheckTargetSummary) => {
      if (target.status === 'unchecked') {
        return (
          <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <CircleDashed className="size-3" />
            <span>
              {t('leads.convert.precheckStatus.unchecked', {
                defaultValue: 'Skipped',
              })}
            </span>
          </div>
        )
      }
      if (target.status === 'clean') {
        return (
          <div className="flex items-center gap-1 text-[10.5px] text-emerald-700">
            <CheckCircle2 className="size-3" />
            <span>
              {t('leads.convert.precheckStatus.clean', {
                defaultValue: 'Clean',
              })}
            </span>
          </div>
        )
      }
      if (target.status === 'exact') {
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[10.5px] text-amber-700">
              <AlertTriangle className="size-3" />
              <span>
                {t('leads.convert.precheckStatus.exact', {
                  count: target.count,
                  defaultValue: '{{count}} match(es)',
                })}
              </span>
            </div>
            {target.exactName ? (
              <p className="truncate text-[10.5px] font-medium text-foreground">
                {target.exactName}
              </p>
            ) : null}
          </div>
        )
      }
      return (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[10.5px] text-sky-700">
            <Info className="size-3" />
            <span>
              {t('leads.convert.precheckStatus.matches', {
                count: target.count,
                defaultValue: '{{count}} suggestion(s)',
              })}
            </span>
          </div>
          {target.exactName ? (
            <p className="truncate text-[10.5px] text-muted-foreground">
              {t('leads.convert.precheckStatus.exampleMatch', {
                name: target.exactName,
                defaultValue: 'e.g. {{name}}',
              })}
            </p>
          ) : null}
        </div>
      )
    }

    return (
      <div className="space-y-2" role="group">
        <ul className="space-y-1">
          <li className="flex items-start gap-1.5 text-xs leading-snug">
            <CheckCircle2 className="mt-0.5 size-3.5 text-emerald-600" />
            <span className="text-foreground/90">
              {t('leads.convert.precheckStatus.requiredFilled', {
                defaultValue: 'Required fields filled',
              })}
            </span>
          </li>
        </ul>
        <div
          className="grid grid-cols-1 gap-1.5 border-t pt-2 sm:grid-cols-3"
          role="list"
        >
          {TARGETS.map((targetMeta) => {
            const summary = precheckSummary[targetMeta.key]
            return (
              <div
                key={targetMeta.key}
                role="listitem"
                className="rounded-md border bg-background/50 p-2"
              >
                <div className="mb-1 flex items-center gap-1 text-[11px] font-medium">
                  {targetMeta.icon}
                  <span>{targetMeta.label}</span>
                </div>
                {renderTargetCell(summary)}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMappingTabs = () => {
    const tabsToShow: Array<'company' | 'contact' | 'deal'> = []
    if (mode === 'company_contact_deal') tabsToShow.push('company')
    if (mode !== 'deal_only') tabsToShow.push('contact')
    tabsToShow.push('deal')

    return (
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as 'company' | 'contact' | 'deal')
        }
        className="w-full"
      >
        <TabsList className="w-full justify-start">
          {tabsToShow.map((tab) => {
            const extraCount = extraFields[tab].length
            return (
              <TabsTrigger key={tab} value={tab} className="flex-1 gap-1.5">
                <span>{TARGET_LABEL[tab]}</span>
                {extraCount > 0 ? (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    +{extraCount}
                  </Badge>
                ) : null}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {tabsToShow.includes('company') && (
          <TabsContent value="company" className="space-y-3">
            {renderReuseBanner('company')}
            {selectedCompanyId !== null ? (
              <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                {t('leads.convert.reuse.noteCompany', {
                  defaultValue:
                    'The existing company will be linked at convert time. No new record will be created — go to the company page to edit its details.',
                })}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-end">
                  {renderAddFieldPopover('company')}
                </div>
                <FieldMappingRow
                  fieldKey="company:name"
                  label={t('leads.convert.field.companyName')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'company_name_text',
                  })}
                  targetLabel={t('leads.convert.targetLabel.organization', {
                    field: 'name',
                  })}
                  sourceValue={lead?.company_name_text ?? ''}
                  value={form.companyName}
                  onChange={(v) => updateForm('companyName', v)}
                  onRestoreSource={() =>
                    updateForm('companyName', lead?.company_name_text || '')
                  }
                  disabled={formDisabled}
                  highlight
                  required
                />
                <FieldMappingRow
                  label={t('leads.convert.field.companyEmail')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'company_email',
                  })}
                  targetLabel={t('leads.convert.targetLabel.organization', {
                    field: 'email',
                  })}
                  sourceValue={lead?.company_email ?? ''}
                  value={form.companyEmail}
                  kind="email"
                  onChange={(v) => updateForm('companyEmail', v)}
                  onRestoreSource={() =>
                    updateForm('companyEmail', lead?.company_email || '')
                  }
                  disabled={formDisabled}
                />
                <FieldMappingRow
                  label={t('leads.convert.field.companyPhone')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'company_phone',
                  })}
                  targetLabel={t('leads.convert.targetLabel.organization', {
                    field: 'phone',
                  })}
                  sourceValue={lead?.company_phone ?? ''}
                  value={form.companyPhone}
                  kind="phone"
                  onChange={(v) => updateForm('companyPhone', v)}
                  onRestoreSource={() =>
                    updateForm('companyPhone', lead?.company_phone || '')
                  }
                  disabled={formDisabled}
                />
                <FieldMappingRow
                  label={t('leads.convert.field.website')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'website',
                  })}
                  targetLabel={t('leads.convert.targetLabel.organization', {
                    field: 'website',
                  })}
                  sourceValue={lead?.website ?? ''}
                  value={form.companyWebsite}
                  kind="url"
                  onChange={(v) => updateForm('companyWebsite', v)}
                  onRestoreSource={() =>
                    updateForm('companyWebsite', lead?.website || '')
                  }
                  disabled={formDisabled}
                />
                <FieldMappingRow
                  label={t('leads.convert.field.address')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'address',
                  })}
                  targetLabel={t('leads.convert.targetLabel.organization', {
                    field: 'address',
                  })}
                  sourceValue={lead?.address ?? ''}
                  value={form.companyAddress}
                  kind="textarea"
                  onChange={(v) => updateForm('companyAddress', v)}
                  onRestoreSource={() =>
                    updateForm('companyAddress', lead?.address || '')
                  }
                  disabled={formDisabled}
                />
                <FieldMappingRow
                  label={t('leads.convert.field.city')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'city',
                  })}
                  targetLabel={t('leads.convert.targetLabel.organization', {
                    field: 'city',
                  })}
                  sourceValue={lead?.city ?? ''}
                  value={form.companyCity}
                  onChange={(v) => updateForm('companyCity', v)}
                  onRestoreSource={() =>
                    updateForm('companyCity', lead?.city || '')
                  }
                  disabled={formDisabled}
                />
                <FieldMappingRow
                  fieldKey="company:industry"
                  label={t('leads.convert.field.industry')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'company_industry',
                  })}
                  targetLabel={t('leads.convert.targetLabel.organization', {
                    field: 'industry',
                  })}
                  sourceValue={leadCompanyIndustryName}
                  value={effectiveCompanyIndustryId}
                  kind="select"
                  options={industrySelectOptions}
                  placeholder={t('leads.convert.placeholder.selectIndustry')}
                  onChange={(v) => updateForm('companyIndustry', v)}
                  onRestoreSource={() =>
                    updateForm('companyIndustry', mappedCompanyIndustryId || '')
                  }
                  disabled={formDisabled}
                />
                {companySizeSelectOptions.length > 0 ? (
                  <FieldMappingRow
                    fieldKey="company:company_size"
                    label={t('leads.convert.field.companySize')}
                    sourceLabel={t('leads.convert.sourceLabel.lead', {
                      field: 'company_size',
                    })}
                    targetLabel={t('leads.convert.targetLabel.organization', {
                      field: 'company_size',
                    })}
                    sourceValue={leadCompanySizeName}
                    value={effectiveCompanySizeId}
                    kind="select"
                    options={companySizeSelectOptions}
                    placeholder={t('leads.convert.placeholder.selectSize')}
                    onChange={(v) => updateForm('companySize', v)}
                    onRestoreSource={() =>
                      updateForm('companySize', mappedCompanySizeId || '')
                    }
                    disabled={formDisabled}
                  />
                ) : null}
                {extraFields.company.map((extra) => (
                  <FieldMappingRow
                    key={extra.slug}
                    fieldKey={`company:${extra.slug}`}
                    label={extra.label}
                    sourceLabel={t('leads.convert.sourceLabel.dialogOnly')}
                    targetLabel={t('leads.convert.targetLabel.organization', {
                      field: extra.slug,
                    })}
                    sourceValue=""
                    value={extra.value}
                    kind={extra.kind}
                    onChange={(v) => setExtraValue('company', extra.slug, v)}
                    onRemove={() => removeExtraField('company', extra.slug)}
                    disabled={formDisabled}
                  />
                ))}
              </>
            )}
          </TabsContent>
        )}

        {tabsToShow.includes('contact') && (
          <TabsContent value="contact" className="space-y-3">
            {renderReuseBanner('contact')}
            {selectedContactId !== null ? (
              <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                {t('leads.convert.reuse.noteContact', {
                  defaultValue:
                    'The existing contact will be linked at convert time. No new record will be created — go to the contact page to edit its details.',
                })}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-end">
                  {renderAddFieldPopover('contact')}
                </div>
                <FieldMappingRow
                  fieldKey="contact:name"
                  label={t('leads.convert.field.contactName')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'name',
                  })}
                  targetLabel={t('leads.convert.targetLabel.contact', {
                    field: 'name',
                  })}
                  sourceValue={lead?.name ?? ''}
                  value={form.contactName}
                  onChange={(v) => updateForm('contactName', v)}
                  onRestoreSource={() =>
                    updateForm('contactName', lead?.name || '')
                  }
                  disabled={formDisabled}
                  highlight
                  required
                />
                <FieldMappingRow
                  label={t('leads.convert.field.jobTitle')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'contact_job_title',
                  })}
                  targetLabel={t('leads.convert.targetLabel.contact', {
                    field: 'job_title',
                  })}
                  sourceValue={lead?.contact_job_title ?? ''}
                  value={form.contactJobTitle}
                  onChange={(v) => updateForm('contactJobTitle', v)}
                  onRestoreSource={() =>
                    updateForm('contactJobTitle', lead?.contact_job_title || '')
                  }
                  disabled={formDisabled}
                />
                <FieldMappingRow
                  label={t('leads.convert.field.email')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'email',
                  })}
                  targetLabel={t('leads.convert.targetLabel.contact', {
                    field: 'email',
                  })}
                  sourceValue={lead?.email ?? ''}
                  value={form.contactEmail}
                  kind="email"
                  onChange={(v) => updateForm('contactEmail', v)}
                  onRestoreSource={() =>
                    updateForm('contactEmail', lead?.email || '')
                  }
                  disabled={formDisabled}
                />
                <FieldMappingRow
                  label={t('leads.convert.field.phone')}
                  sourceLabel={t('leads.convert.sourceLabel.lead', {
                    field: 'phone',
                  })}
                  targetLabel={t('leads.convert.targetLabel.contact', {
                    field: 'mobile',
                  })}
                  sourceValue={lead?.phone ?? ''}
                  value={form.contactPhone}
                  kind="phone"
                  onChange={(v) => updateForm('contactPhone', v)}
                  onRestoreSource={() =>
                    updateForm('contactPhone', lead?.phone || '')
                  }
                  disabled={formDisabled}
                />
                {extraFields.contact.map((extra) => (
                  <FieldMappingRow
                    key={extra.slug}
                    fieldKey={`contact:${extra.slug}`}
                    label={extra.label}
                    sourceLabel={t('leads.convert.sourceLabel.dialogOnly')}
                    targetLabel={t('leads.convert.targetLabel.contact', {
                      field: extra.slug,
                    })}
                    sourceValue=""
                    value={extra.value}
                    kind={extra.kind}
                    onChange={(v) => setExtraValue('contact', extra.slug, v)}
                    onRemove={() => removeExtraField('contact', extra.slug)}
                    disabled={formDisabled}
                  />
                ))}
              </>
            )}
          </TabsContent>
        )}

        <TabsContent value="deal" className="space-y-3">
          {dealCandidates.length > 0 ? (
            <div className="space-y-2 rounded-lg border-2 border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" />
                <p className="text-sm font-medium">
                  {t('leads.convert.previousDealsTitle')}
                </p>
              </div>
              <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                {dealCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-md border bg-background px-3 py-2 text-xs"
                  >
                    <p className="font-medium">{candidate.name}</p>
                    <p className="text-muted-foreground">
                      {typeof candidate.stage === 'object'
                        ? candidate.stage?.name
                        : null}
                      {candidate.organization &&
                      typeof candidate.organization === 'object'
                        ? ` · ${candidate.organization.name}`
                        : ''}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('leads.convert.newDealWillBeCreated')}
              </p>
            </div>
          ) : null}
          <div className="flex items-center justify-end">
            {renderAddFieldPopover('deal')}
          </div>
          <FieldMappingRow
            fieldKey="deal:name"
            label={t('leads.convert.field.dealName')}
            sourceLabel={t('leads.convert.sourceLabel.auto')}
            targetLabel={t('leads.convert.targetLabel.deal', { field: 'name' })}
            sourceValue={
              [lead?.company_name_text, lead?.name]
                .filter(Boolean)
                .join(' - ') || ''
            }
            value={form.dealName}
            onChange={(v) => updateForm('dealName', v)}
            onRestoreSource={() => updateForm('dealName', sourceDealName)}
            disabled={formDisabled}
            highlight
            required
          />
          <FieldMappingRow
            label={t('leads.convert.field.estimatedValue')}
            sourceLabel={t('leads.convert.sourceLabel.lead', {
              field: 'deal_value',
            })}
            targetLabel={t('leads.convert.targetLabel.deal', {
              field: 'deal_value',
            })}
            sourceValue={lead?.deal_value ? String(lead.deal_value) : ''}
            value={form.dealValue}
            kind="money"
            onChange={(v) => updateForm('dealValue', v)}
            onRestoreSource={() =>
              updateForm(
                'dealValue',
                lead?.deal_value ? String(lead.deal_value) : '',
              )
            }
            disabled={formDisabled}
          />
          <FieldMappingRow
            label={t('leads.convert.field.description')}
            sourceLabel={t('leads.convert.sourceLabel.lead', {
              field: 'contact_message',
            })}
            targetLabel={t('leads.convert.targetLabel.deal', {
              field: 'description',
            })}
            sourceValue={lead?.contact_message ?? ''}
            value={form.notes}
            kind="textarea"
            onChange={(v) => updateForm('notes', v)}
            onRestoreSource={() =>
              updateForm('notes', lead?.contact_message || '')
            }
            disabled={formDisabled}
          />
          <FieldMappingRow
            label={t('leads.convert.field.stage')}
            sourceLabel={t('leads.convert.sourceLabel.fixed', { value: 'New' })}
            targetLabel={t('leads.convert.targetLabel.deal', {
              field: 'stage',
            })}
            sourceValue="New"
            value={effectiveStageId}
            kind="select"
            options={stageSelectOptions}
            placeholder={t('leads.convert.placeholder.selectStage')}
            onChange={(v) => updateForm('dealStageId', v)}
            onRestoreSource={() => updateForm('dealStageId', newStageId || '')}
            disabled={formDisabled}
          />
          <FieldMappingRow
            label={t('leads.convert.field.leadSource')}
            sourceLabel={t('leads.convert.sourceLabel.lead', {
              field: 'lead_source',
            })}
            targetLabel={t('leads.convert.targetLabel.deal', {
              field: 'lead_source',
            })}
            sourceValue={leadSourceName}
            value={effectiveLeadSourceId}
            kind="select"
            options={leadSourceSelectOptions}
            placeholder={t('leads.convert.placeholder.selectSource')}
            onChange={(v) => updateForm('dealLeadSourceId', v)}
            onRestoreSource={() =>
              updateForm('dealLeadSourceId', mappedDealLeadSourceId || '')
            }
            disabled={formDisabled}
          />
          <FieldMappingRow
            label={t('leads.convert.field.customerType')}
            sourceLabel={t('leads.convert.sourceLabel.lead', {
              field: 'lead_type',
            })}
            targetLabel={t('leads.convert.targetLabel.deal', {
              field: 'customer_type',
            })}
            sourceValue={leadTypeName}
            value={effectiveCustomerTypeId}
            kind="select"
            options={customerTypeSelectOptions}
            placeholder={t('leads.convert.placeholder.selectType')}
            onChange={(v) => updateForm('dealCustomerTypeId', v)}
            onRestoreSource={() =>
              updateForm('dealCustomerTypeId', mappedCustomerTypeId || '')
            }
            disabled={formDisabled}
          />
          {extraFields.deal.map((extra) => (
            <FieldMappingRow
              key={extra.slug}
              fieldKey={`deal:${extra.slug}`}
              label={extra.label}
              sourceLabel={t('leads.convert.sourceLabel.dialogOnly')}
              targetLabel={t('leads.convert.targetLabel.deal', {
                field: extra.slug,
              })}
              sourceValue=""
              value={extra.value}
              kind={extra.kind}
              onChange={(v) => setExtraValue('deal', extra.slug, v)}
              onRemove={() => removeExtraField('deal', extra.slug)}
              disabled={formDisabled}
            />
          ))}
        </TabsContent>
      </Tabs>
    )
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

          <div className="space-y-2 rounded-md border bg-card px-3 py-2">
            <p className="text-xs font-medium text-foreground">
              {t('leads.convert.modeLabel')}
            </p>
            <div
              className="grid gap-2 md:grid-cols-3"
              role="group"
              aria-label={t('leads.convert.modeLabel')}
            >
              {(
                [
                  {
                    value: 'company_contact_deal',
                    icons: (
                      <>
                        <Building2 className="size-3.5 text-sky-600" />
                        <UserRound className="size-3.5 text-emerald-600" />
                        <CheckCircle2 className="size-3.5 text-violet-600" />
                      </>
                    ),
                  },
                  {
                    value: 'contact_deal',
                    icons: (
                      <>
                        <UserRound className="size-3.5 text-emerald-600" />
                        <CheckCircle2 className="size-3.5 text-violet-600" />
                      </>
                    ),
                  },
                  {
                    value: 'deal_only',
                    icons: (
                      <CheckCircle2 className="size-3.5 text-violet-600" />
                    ),
                  },
                ] as Array<{
                  value: ConversionMode
                  icons: ReactNode
                }>
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={isWorking || isAlreadyCompleted}
                  aria-pressed={mode === option.value}
                  onClick={() => {
                    setMode(option.value)
                    setDuplicatesChecked(false)
                  }}
                  className={cn(
                    'flex min-h-12 items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    mode === option.value
                      ? 'border-primary ring-1 ring-primary'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <span className="min-w-0 truncate font-medium">
                    {MODE_LABELS[option.value]}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {option.icons}
                  </span>
                </button>
              ))}
            </div>
            {skippedModeTargets.length > 0 ? (
              <p className="flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                <span>
                  {t('leads.convert.modeSkipWarning', {
                    targets: skippedModeTargets.join(', '),
                    defaultValue:
                      'This mode skips {{targets}}. Hidden values are kept if you switch back.',
                  })}
                </span>
              </p>
            ) : null}
          </div>

          <div ref={progressSectionRef} className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('leads.convert.progress')}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress
              value={progress}
              className="bg-muted/60 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-sky-400 [&_[data-slot=progress-indicator]]:via-teal-400 [&_[data-slot=progress-indicator]]:to-emerald-500"
            />
            <TooltipProvider delayDuration={200}>
              <div
                className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6"
                role="list"
                aria-label={t('leads.convert.progress')}
              >
                {Object.entries(STEP_LABELS).map(([key, label]) => {
                  const state = steps[key] ?? 'pending'
                  const details = stepDetails[key] ?? []
                  const hasDetails = details.length > 0

                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <div
                          role="listitem"
                          tabIndex={0}
                          aria-current={
                            currentProgressStepKey === key ? 'step' : undefined
                          }
                          aria-label={`${label}: ${t(`leads.convert.stepState.${state}`, { defaultValue: state })}`}
                          className={cn(
                            'flex min-w-0 items-center gap-2 rounded-md border px-2 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            hasDetails && 'cursor-help',
                            currentProgressStepKey === key &&
                              'border-primary/60',
                          )}
                        >
                          {getStepIcon(state)}
                          <span className="truncate">{label}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        sideOffset={6}
                        className="min-w-[260px] max-w-md border border-border bg-popover p-3 text-popover-foreground shadow-lg [&_svg]:shrink-0"
                      >
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        {key === 'precheck' &&
                        duplicatesChecked &&
                        (state === 'warn' || state === 'done') ? (
                          renderPrecheckTooltip()
                        ) : hasDetails ? (
                          <ul className="space-y-1.5">
                            {details.map((d, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-1.5 text-xs leading-snug"
                              >
                                {renderDetailIcon(d.tone)}
                                <span className="text-foreground/90">
                                  {d.label}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {state === 'pending' ? (
                              <>
                                <Circle className="size-3" />
                                <span>
                                  {t('leads.convert.state.notStarted')}
                                </span>
                              </>
                            ) : state === 'running' ? (
                              <>
                                <Loader2 className="size-3 animate-spin text-sky-600" />
                                <span>
                                  {t('leads.convert.state.processing')}
                                </span>
                              </>
                            ) : (
                              <>
                                <Info className="size-3" />
                                <span>
                                  {t('leads.convert.state.noDetails')}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>
          </div>

          {renderMappingTabs()}
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

      <AlertDialog
        open={pendingChanges !== null}
        onOpenChange={(next) => {
          if (!next) setPendingChanges(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('leads.convert.changeConfirm.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('leads.convert.changeConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div
            className="max-h-72 space-y-2 overflow-y-auto"
            role="table"
            aria-label={t('leads.convert.changeConfirm.title')}
          >
            {(pendingChanges ?? []).map((change, index) => (
              <div
                key={index}
                role="row"
                className="rounded-md border bg-card p-3 text-xs"
              >
                <div className="mb-1 flex items-center gap-1.5" role="cell">
                  <Badge variant="outline" className="text-[10px]">
                    {TARGET_LABEL[change.tab]}
                  </Badge>
                  <span className="font-medium">{change.label}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto h-6 px-2 text-[10px]"
                    onClick={() => {
                      change.restore()
                      setPendingChanges((current) => {
                        const nextChanges = (current ?? []).filter(
                          (_, changeIndex) => changeIndex !== index,
                        )
                        return nextChanges.length > 0 ? nextChanges : null
                      })
                    }}
                  >
                    {t('leads.convert.changeConfirm.restoreButton', {
                      defaultValue: 'Restore',
                    })}
                  </Button>
                </div>
                <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  <div
                    className="rounded border border-dashed bg-muted/40 px-2 py-1 text-muted-foreground"
                    role="cell"
                  >
                    <p className="text-[10px] uppercase tracking-wide">
                      {t('leads.convert.changeConfirm.sourceLabel')}
                    </p>
                    <p className="truncate text-foreground/80">
                      {change.sourceText || '—'}
                    </p>
                  </div>
                  <ArrowRight
                    className="hidden size-3.5 text-muted-foreground sm:block"
                    aria-hidden
                  />
                  <div
                    className="rounded border bg-primary/[0.04] px-2 py-1"
                    role="cell"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-primary">
                      {t('leads.convert.changeConfirm.targetLabel')}
                    </p>
                    <p className="truncate font-medium">
                      {change.targetText || '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingChanges(null)}>
              {t('leads.convert.changeConfirm.cancelButton')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPendingChanges(null)
                setChangesConfirmed(true)
                void runConversion({ skipChangeCheck: true })
              }}
            >
              {t('leads.convert.changeConfirm.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AwesomeDialog>
  )
}
