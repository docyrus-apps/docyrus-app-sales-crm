import { useEffect, useMemo, useRef, useState } from 'react'

import type {
  LeadConvertStepDetail,
  LeadConvertStepState
} from '@/components/leads/lead-convert-utils'

import {
  type FieldKind,
  type SelectOption
} from '@/components/leads/field-mapping-row'

import { useNavigate } from '@tanstack/react-router'
import { useDocyrusClient } from '@docyrus/signin'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

import { createDataSourceClient } from '@docyrus/app-utils'

import { Button } from '@/components/animate-ui/components/buttons/button'
import { AwesomeDialog } from '@/components/docyrus/awesome-dialog/awesome-dialog'
import { AwesomeDialogBody } from '@/components/docyrus/awesome-dialog/awesome-dialog-body'
import { AwesomeDialogFooter } from '@/components/docyrus/awesome-dialog/awesome-dialog-footer'
import { AwesomeDialogHeader } from '@/components/docyrus/awesome-dialog/awesome-dialog-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LeadConvertModeSelector } from '@/components/leads/lead-convert-mode-selector'
import { LeadConvertChangeConfirmDialog } from '@/components/leads/lead-convert-change-confirm-dialog'
import type { LeadConvertPendingChange } from '@/components/leads/lead-convert-change-confirm-dialog'
import { LeadConvertProgress } from '@/components/leads/lead-convert-progress'
import { LeadConvertTabs } from '@/components/leads/lead-convert-tabs'
import { useLeadConvertEnumMappings } from '@/components/leads/use-lead-convert-enum-mappings'
import { useLeadConvertForm } from '@/components/leads/use-lead-convert-form'
import { useLeadConvertDuplicates } from '@/components/leads/use-lead-convert-duplicates'
import { useLeadConvertConversion } from '@/components/leads/use-lead-convert-conversion'
import {
  getRelationId,
  getRelationName,
  isLeadConvertedRecord,
  normalizeConversionKey
} from '@/lib/lead-conversion'

type ConversionMode = 'company_contact_deal' | 'contact_deal'
type StepState = LeadConvertStepState
type StepDetail = LeadConvertStepDetail
type ConvertTarget = 'company' | 'contact' | 'deal'

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
    'record_owner'
  ],
  contact: [
    'name',
    'job_title',
    'email',
    'mobile',
    'organization',
    'source_lead',
    'record_owner'
  ],
  deal: [
    'name',
    'deal_value',
    'qualification_notes',
    'stage',
    'lead_source',
    'customer_type',
    'country',
    'record_owner',
    'organization',
    'contact_person',
    'source_lead'
  ]
}

const SYSTEM_HIDDEN_FIELDS = new Set([
  'id',
  'autonumber_id',
  'created_by',
  'created_on',
  'last_modified_by',
  'last_modified_on',
  'followers',
  'status'
])

interface LeadConvertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
}

function useModeLabels(
  t: (key: string) => string
): Record<ConversionMode, string> {
  return {
    company_contact_deal: t('leads.convert.mode.company_contact_deal'),
    contact_deal: t('leads.convert.mode.contact_deal')
  }
}

function useTargetLabels(
  t: (key: string) => string
): Record<'company' | 'contact' | 'deal', string> {
  return {
    company: t('leads.convert.target.company'),
    contact: t('leads.convert.target.contact'),
    deal: t('leads.convert.target.deal')
  }
}

function useStepLabels(t: (key: string) => string): Record<string, string> {
  return {
    precheck: t('leads.convert.step.precheck'),
    organization: t('leads.convert.step.organization'),
    contact: t('leads.convert.step.contact'),
    deal: t('leads.convert.step.deal'),
    activity: t('leads.convert.step.activity'),
    lead: t('leads.convert.step.lead')
  }
}

export function LeadConvertDialog({
  open,
  onOpenChange,
  lead
}: LeadConvertDialogProps) {
  const { t } = useTranslation()
  const client = useDocyrusClient()
  const navigate = useNavigate()
  const MODE_LABELS = useModeLabels(key => t(key))
  const TARGET_LABEL = useTargetLabels(key => t(key))
  const STEP_LABELS = useStepLabels(key => t(key))
  const [isWorking, setIsWorking] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    getRelationId(lead?.converted_organization) ?? null
  )
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    getRelationId(lead?.converted_contact) ?? null
  )
  const [pendingChanges, setPendingChanges] =
    useState<Array<LeadConvertPendingChange> | null>(null)
  const [changesConfirmed, setChangesConfirmed] = useState(false)
  const progressSectionRef = useRef<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<ConversionMode>(() => {
    const savedMode = getRelationName(lead?.conversion_mode)

    if (savedMode === 'contact_deal') {
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
      lead: isCompleted ? 'done' : 'pending'
    }

    const hasAny = hasOrg || hasContact || hasDeal

    if (isFailedOrPartial && hasAny) {
      const sequence: Array<keyof typeof steps> = [
        'precheck',
        'organization',
        'contact',
        'deal'
      ]
      const firstPending = sequence.find(key => steps[key] === 'pending')

      if (firstPending) steps[firstPending] = 'failed'
    }
    const details: Record<string, Array<StepDetail>> = {
      precheck: [],
      organization: hasOrg
        ? [
            {
              tone: 'success',
              label: t('leads.convert.result.existing', {
                name: getRelationName(lead?.converted_organization) ?? '—'
              })
            },
            { tone: 'info', label: t('leads.convert.result.willSkip') }
          ]
        : [],
      contact: hasContact
        ? [
            {
              tone: 'success',
              label: t('leads.convert.result.existing', {
                name: getRelationName(lead?.converted_contact) ?? '—'
              })
            },
            { tone: 'info', label: t('leads.convert.result.willSkip') }
          ]
        : [],
      deal: hasDeal
        ? [
            {
              tone: 'success',
              label: t('leads.convert.result.existing', {
                name: getRelationName(lead?.converted_deal) ?? '—'
              })
            },
            { tone: 'info', label: t('leads.convert.result.willSkip') }
          ]
        : [],
      activity: [],
      lead: []
    }

    if (isFailedOrPartial) {
      const errorMessage =
        typeof lead?.conversion_error_message === 'string' &&
        lead.conversion_error_message
          ? lead.conversion_error_message
          : null
      const failedKey = Object.keys(steps).find(
        key => steps[key] === 'failed'
      )

      if (failedKey && errorMessage) {
        details[failedKey] = [
          {
            tone: 'error',
            label: t('leads.convert.result.previousError', {
              message: errorMessage
            })
          },
          { tone: 'info', label: t('leads.convert.result.willRetry') }
        ]
      }
    }

    return { steps, details }
  }, [lead, t])

  const [steps, setSteps] = useState<Record<string, StepState>>(
    () => initialStepState.steps
  )
  const [stepDetails, setStepDetails] = useState<
    Record<string, Array<StepDetail>>
  >(() => initialStepState.details)
  const {
    companyCandidates,
    contactCandidates,
    dealCandidates,
    exactCompanyId,
    exactContactId,
    precheckSummary,
    duplicatesChecked,
    setDuplicatesChecked,
    findDuplicates
  } = useLeadConvertDuplicates({
    client,
    lead,
    t,
    setIsWorking,
    setStep: (key, state) => setSteps(current => ({ ...current, [key]: state })),
    setStepDetail: (key, details) => setStepDetails(current => ({ ...current, [key]: details })),
    setErrorMessage,
    onExactCompanyMatch: setSelectedCompanyId,
    onExactContactMatch: setSelectedContactId
  })
  const { form, updateForm, sourceDealName } = useLeadConvertForm({
    lead,
    t,
    open,
    onSearchRelevantChange: () => setDuplicatesChecked(false)
  })
  const [extraFields, setExtraFields] = useState<{
    company: Array<{
      slug: string;
      label: string;
      kind: FieldKind;
      value: string;
    }>;
    contact: Array<{
      slug: string;
      label: string;
      kind: FieldKind;
      value: string;
    }>;
    deal: Array<{
      slug: string;
      label: string;
      kind: FieldKind;
      value: string;
    }>;
  }>({ company: [], contact: [], deal: [] })
  const [targetFields, setTargetFields] = useState<{
    company: Array<{ slug: string; name: string; type: string }>;
    contact: Array<{ slug: string; name: string; type: string }>;
    deal: Array<{ slug: string; name: string; type: string }>;
  }>({ company: [], contact: [], deal: [] })
  const [activeTab, setActiveTab] = useState<'company' | 'contact' | 'deal'>(
    'deal'
  )

  const {
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
    effectiveCompanySizeId
  } = useLeadConvertEnumMappings(lead, form)

  useEffect(() => {
    if (mode === 'contact_deal') {
      setActiveTab('contact')
    } else {
      setActiveTab('company')
    }
  }, [mode])

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
          .catch(() => null)
      ])

      if (cancelled) return
      const mapFields = (
        ds: {
          fields?: Array<{ slug?: string; name?: string; type?: string }>;
        } | null
      ) => (ds?.fields ?? [])
          .filter((f): f is { slug: string; name: string; type: string } => Boolean(f?.slug && f?.name && f?.type))
          .map(f => ({ slug: f.slug, name: f.name, type: f.type }))

      setTargetFields({
        company: mapFields(org),
        contact: mapFields(contact),
        deal: mapFields(deal)
      })
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [open, client])

  const visibleProgressStepKeys = useMemo(
    () => [
      'precheck',
      ...(mode === 'company_contact_deal' ? ['organization'] : []),
      'contact',
      'deal'
    ],
    [mode]
  )
  const visibleStepLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    const stepLabelsByKey = STEP_LABELS

    for (const key of visibleProgressStepKeys) {
      labels[key] = stepLabelsByKey[key] ?? key
    }

    return labels
  }, [STEP_LABELS, visibleProgressStepKeys])
  const isAlreadyCompleted = isLeadConvertedRecord(lead)
  const hasAnyCreated = Boolean(
    lead?.converted_organization ||
    lead?.converted_contact ||
    lead?.converted_deal
  )
  const conversionStateName = normalizeConversionKey(
    getRelationName(lead?.conversion_state)
  )
  const hasPartialState = !isAlreadyCompleted && hasAnyCreated
  const hasFailedAttempt =
    !isAlreadyCompleted &&
    !hasAnyCreated &&
    conversionStateName === normalizeConversionKey('failed')

  const setStep = (key: string, state: StepState) => {
    setSteps(current => ({ ...current, [key]: state }))
  }

  const setStepDetail = (key: string, details: Array<StepDetail>) => {
    setStepDetails(current => ({ ...current, [key]: details }))
  }

  const addStepDetail = (key: string, detail: StepDetail) => {
    setStepDetails(current => ({
      ...current,
      [key]: [...(current[key] ?? []), detail]
    }))
  }

  const focusMissingField = (
    tab: 'company' | 'contact' | 'deal',
    fieldKey: string
  ) => {
    setActiveTab(tab)
    window.setTimeout(() => {
      const node = document.querySelector(`[data-field-key="${fieldKey}"]`)

      if (node instanceof HTMLElement) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
        node.classList.add('lead-convert-field-attention')
        window.setTimeout(() => {
          node.classList.remove('lead-convert-field-attention')
        }, 2200)
      }
    }, 80)
  }

  type MissingField = {
    tab: 'company' | 'contact' | 'deal';
    fieldKey: string;
    label: string;
  }

  const findMissingField = (): MissingField | null => {
    const checkRow = (
      tab: 'company' | 'contact' | 'deal',
      slug: string,
      label: string,
      value: string
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
          form.companyName
        ),
        ...(leadCompanyIndustryName && !effectiveCompanyIndustryId
          ? [
              checkRow(
                'company',
                'industry',
                t('leads.convert.field.industry'),
                effectiveCompanyIndustryId
              )
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
                effectiveCompanySizeId
              )
            ]
          : [])
      ]
      const firstCompany = companyChecks.find(
        (c): c is MissingField => c !== null
      )

      if (firstCompany) return firstCompany
    }

    if (selectedContactId === null) {
      const contactChecks: Array<MissingField | null> = [
        checkRow(
          'contact',
          'name',
          t('leads.convert.field.contactName'),
          form.contactName
        )
      ]
      const firstContact = contactChecks.find(
        (c): c is MissingField => c !== null
      )

      if (firstContact) return firstContact
    }

    const dealChecks: Array<MissingField | null> = [
      checkRow(
        'deal',
        'name',
        t('leads.convert.field.dealName'),
        form.dealName
      ),
      checkRow(
        'deal',
        'stage',
        t('leads.convert.field.stage'),
        effectiveStageId
      ),
      ...(leadSourceName && !effectiveLeadSourceId
        ? [
            checkRow(
              'deal',
              'lead_source',
              t('leads.convert.field.leadSource'),
              effectiveLeadSourceId
            )
          ]
        : []),
      ...(leadTypeName && !effectiveCustomerTypeId
        ? [
            checkRow(
              'deal',
              'customer_type',
              t('leads.convert.field.customerType'),
              effectiveCustomerTypeId
            )
          ]
        : [])
    ]
    const firstDeal = dealChecks.find((c): c is MissingField => c !== null)

    if (firstDeal) return firstDeal

    return null
  }

  const lookupOptionLabel = (
    options: Array<SelectOption>,
    id: string
  ): string => options.find(o => o.value === id)?.label ?? ''

  const findChangedFromLead = () => {
    const changes: Array<LeadConvertPendingChange> = []
    const push = (
      tab: 'company' | 'contact' | 'deal',
      label: string,
      sourceText: string,
      targetText: string,
      restore: () => void
    ) => {
      const src = (sourceText || '').trim()
      const tgt = (targetText || '').trim()

      if (src && src !== tgt) {
        changes.push({
          tab,
          label,
          sourceText: src,
          targetText: tgt,
          restore
        })
      }
    }

    if (mode === 'company_contact_deal' && selectedCompanyId === null) {
      push(
        'company',
        t('leads.convert.field.companyName'),
        lead?.company_name_text || '',
        form.companyName,
        () => updateForm('companyName', lead?.company_name_text || '')
      )
      push(
        'company',
        t('leads.convert.field.companyEmail'),
        lead?.company_email || '',
        form.companyEmail,
        () => updateForm('companyEmail', lead?.company_email || '')
      )
      push(
        'company',
        t('leads.convert.field.companyPhone'),
        lead?.company_phone || '',
        form.companyPhone,
        () => updateForm('companyPhone', lead?.company_phone || '')
      )
      push(
        'company',
        t('leads.convert.field.website'),
        lead?.website || '',
        form.companyWebsite,
        () => updateForm('companyWebsite', lead?.website || '')
      )
      push(
        'company',
        t('leads.convert.field.address'),
        lead?.address || '',
        form.companyAddress,
        () => updateForm('companyAddress', lead?.address || '')
      )
      push(
        'company',
        t('leads.convert.field.city'),
        lead?.city || '',
        form.companyCity,
        () => updateForm('companyCity', lead?.city || '')
      )
      push(
        'company',
        t('leads.convert.field.industry'),
        leadCompanyIndustryName,
        lookupOptionLabel(industrySelectOptions, effectiveCompanyIndustryId),
        () => updateForm('companyIndustry', mappedCompanyIndustryId || '')
      )
      if (companySizeSelectOptions.length > 0) {
        push(
          'company',
          t('leads.convert.field.companySize'),
          leadCompanySizeName,
          lookupOptionLabel(companySizeSelectOptions, effectiveCompanySizeId),
          () => updateForm('companySize', mappedCompanySizeId || '')
        )
      }
    }
    if (selectedContactId === null) {
      push(
        'contact',
        t('leads.convert.field.contactName'),
        lead?.name || '',
        form.contactName,
        () => updateForm('contactName', lead?.name || '')
      )
      push(
        'contact',
        t('leads.convert.field.jobTitle'),
        lead?.contact_job_title || '',
        form.contactJobTitle,
        () => updateForm('contactJobTitle', lead?.contact_job_title || '')
      )
      push(
        'contact',
        t('leads.convert.field.email'),
        lead?.email || '',
        form.contactEmail,
        () => updateForm('contactEmail', lead?.email || '')
      )
      push(
        'contact',
        t('leads.convert.field.phone'),
        lead?.phone || '',
        form.contactPhone,
        () => updateForm('contactPhone', lead?.phone || '')
      )
    }
    push(
      'deal',
      t('leads.convert.field.estimatedValue'),
      lead?.deal_value ? String(lead.deal_value) : '',
      form.dealValue,
      () => updateForm(
          'dealValue',
          lead?.deal_value ? String(lead.deal_value) : ''
        )
    )
    push(
      'deal',
      t('leads.convert.field.description'),
      lead?.contact_message || '',
      form.notes,
      () => updateForm('notes', lead?.contact_message || '')
    )
    push(
      'deal',
      t('leads.convert.field.leadSource'),
      leadSourceName,
      lookupOptionLabel(leadSourceSelectOptions, effectiveLeadSourceId),
      () => updateForm('dealLeadSourceId', mappedDealLeadSourceId || '')
    )

    return changes
  }

  const { runConversion } = useLeadConvertConversion({
    client,
    lead,
    t,
    navigate,
    onClose: () => onOpenChange(false),
    form,
    mode,
    extraFields,
    selectedCompanyId,
    selectedContactId,
    duplicatesChecked,
    changesConfirmed,
    modeLabels: MODE_LABELS,
    effectiveCompanyIndustryId,
    effectiveCompanySizeId,
    effectiveStageId,
    effectiveLeadSourceId,
    effectiveCustomerTypeId,
    mappedDealLeadSourceId,
    mappedCustomerTypeId,
    setIsWorking,
    setErrorMessage,
    setStep,
    setStepDetail,
    addStepDetail,
    setPendingChanges,
    findDuplicates,
    findMissingField,
    focusMissingField,
    findChangedFromLead,
    scrollProgressIntoView: () => progressSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      }),
    createDataSourceClient
  })

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
      form.companyIndustry ||
      form.companySize ||
      extraFields.company.length
    )

    if (mode !== 'company_contact_deal' && hasCompanyDraft) {
      skipped.push(TARGET_LABEL.company)
    }

    return skipped
  }, [
TARGET_LABEL,
extraFields.company.length,
form,
mode
])

  const setExtraValue = (
    target: 'company' | 'contact' | 'deal',
    slug: string,
    value: string
  ) => {
    setExtraFields(current => ({
      ...current,
      [target]: current[target].map(field => field.slug === slug ? { ...field, value } : field)
    }))
  }

  const removeExtraField = (
    target: 'company' | 'contact' | 'deal',
    slug: string
  ) => {
    setExtraFields(current => ({
      ...current,
      [target]: current[target].filter(field => field.slug !== slug)
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
        extraFields[target].map(field => field.slug)
      )

      return targetFields[target].filter(
        field => !known.has(field.slug) &&
          !SYSTEM_HIDDEN_FIELDS.has(field.slug) &&
          !alreadyAdded.has(field.slug)
      )
    }

    return {
      company: build('company'),
      contact: build('contact'),
      deal: build('deal')
    }
  }, [extraFields, targetFields])

  const availableExtraFields = (target: ConvertTarget) => availableExtraFieldsByTarget[target]

  const addExtraField = (
    target: ConvertTarget,
    field: { slug: string; name: string; type: string }
  ) => {
    setExtraFields(current => ({
      ...current,
      [target]: [
        ...current[target],
        {
          slug: field.slug,
          label: field.name,
          kind: inferKindFromType(field.type),
          value: ''
        }
      ]
    }))
    requestAnimationFrame(() => {
      const node = document.querySelector(
        `[data-field-key="${target}:${field.slug}"]`
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
      size="xl">
      <AwesomeDialogHeader
        title={t('leads.convert.title')}
        description={t('leads.convert.description')} />

      <AwesomeDialogBody className="pt-0">
        <div className="space-y-5 pt-4">
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
                      message: lead.conversion_error_message
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
                      message: lead.conversion_error_message
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
            }} />

          <div ref={progressSectionRef}>
            <LeadConvertProgress
              steps={steps}
              stepDetails={stepDetails}
              stepLabels={visibleStepLabels}
              currentStepKey={currentProgressStepKey}
              duplicatesChecked={duplicatesChecked}
              precheckSummary={precheckSummary} />
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
            removeExtraField={removeExtraField} />
        </div>
      </AwesomeDialogBody>

      <AwesomeDialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isWorking}
          onClick={() => onOpenChange(false)}>
          {t('leads.convert.footer.close')}
        </Button>
        {isAlreadyCompleted && getRelationId(lead?.converted_deal) ? (
          <Button
            type="button"
            onClick={() => {
              const dealId = getRelationId(lead.converted_deal)

              if (!dealId) return
              void navigate({ to: '/deals/$dealId', params: { dealId } })
            }}>
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
        onClose={() => setPendingChanges(null)}
        onRestoreChange={(index) => {
          setPendingChanges((current) => {
            const nextChanges = (current ?? []).filter(
              (_, changeIndex) => changeIndex !== index
            )

            return nextChanges.length > 0 ? nextChanges : null
          })
        }}
        onConfirm={() => {
          setPendingChanges(null)
          setChangesConfirmed(true)
          void runConversion({ skipChangeCheck: true })
        }} />
    </AwesomeDialog>
  )
}
