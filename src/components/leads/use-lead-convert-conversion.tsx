import type {
  LeadConvertStepDetail,
  LeadConvertStepState
} from '@/components/leads/lead-convert-utils'

import { useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'

import { useEnumEntities } from '@/hooks/use-enums'

import {
  getRelationId,
  getRelationName,
  isLeadConvertedRecord,
  normalizeConversionKey
} from '@/lib/lead-conversion'
import { optionByName } from '@/components/leads/use-lead-convert-enum-mappings'
import {
  firstItem,
  getErrorMessage,
  logLeadConvertEvent,
  unwrapItems
} from '@/components/leads/lead-convert-utils'

import { type LeadConvertPendingChange } from '@/components/leads/lead-convert-change-confirm-dialog'
import {
  type LeadConvertConversionMode,
  type LeadConvertExtraFieldsState,
  type LeadConvertForm
} from '@/components/leads/lead-convert-tabs'

type ConvertTarget = 'company' | 'contact' | 'deal'
type FieldMeta = { slug?: string }
type DataSourceMeta = { fields?: Array<FieldMeta> }
type CurrentUserResponse = { id?: string }
type LinkedWorkMigrationResult = {
  attemptedCount: number;
  updatedCount: number;
  failedCount: number;
  warningCount: number;
}

export type LeadConvertMissingField = {
  tab: ConvertTarget;
  fieldKey: string;
  label: string;
}

type DocyrusClient = any
type DocyrusDataSourceClient = {
  getBySlug: (
    app: string,
    slug: string,
    options?: { expand?: string }
  ) => Promise<DataSourceMeta | null>;
}
type NavigateFn = (args: any) => unknown

function getFieldSlugs(dataSource?: DataSourceMeta | null) {
  return new Set(
    (dataSource?.fields ?? []).map(field => field.slug).filter(Boolean)
  )
}

function hasAllFields(slugs: Set<string | undefined>, fields: Array<string>) {
  return fields.every(field => slugs.has(field))
}

function pickDefined(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  )
}

function getMultiRelationIds(value: unknown): Array<string> | undefined {
  if (!Array.isArray(value)) return undefined

  const ids = value.flatMap((item) => {
    if (typeof item === 'string') return [item]
    if (
      item &&
      typeof item === 'object' &&
      'id' in item &&
      typeof item.id === 'string'
    ) {
      return [item.id]
    }

    return []
  })

  return ids.length > 0 ? ids : undefined
}

export interface UseLeadConvertConversionOptions {
  client: DocyrusClient | null;
  lead: any;
  t: (key: string, params?: Record<string, unknown>) => string;
  navigate: NavigateFn;
  onClose: () => void;

  form: LeadConvertForm;
  mode: LeadConvertConversionMode;
  extraFields: LeadConvertExtraFieldsState;
  selectedCompanyId: string | null;
  selectedContactId: string | null;
  duplicatesChecked: boolean;
  changesConfirmed: boolean;
  modeLabels: Record<LeadConvertConversionMode, string>;

  effectiveCompanyIndustryId: string;
  effectiveCompanySizeId: string;
  effectiveStageId: string;
  effectiveLeadSourceId: string;
  effectiveCustomerTypeId: string;
  mappedDealLeadSourceId: string | undefined;
  mappedCustomerTypeId: string | undefined;

  setIsWorking: (working: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setStep: (key: string, state: LeadConvertStepState) => void;
  setStepDetail: (key: string, details: Array<LeadConvertStepDetail>) => void;
  addStepDetail: (key: string, detail: LeadConvertStepDetail) => void;
  setPendingChanges: (changes: Array<LeadConvertPendingChange> | null) => void;

  findDuplicates: (args: {
    form: LeadConvertForm;
    mode: LeadConvertConversionMode;
  }) => Promise<void>;
  findMissingField: () => LeadConvertMissingField | null;
  focusMissingField: (tab: ConvertTarget, fieldKey: string) => void;
  findChangedFromLead: () => Array<LeadConvertPendingChange>;
  scrollProgressIntoView: () => void;

  createDataSourceClient: (client: DocyrusClient) => DocyrusDataSourceClient;
}

export interface UseLeadConvertConversionResult {
  runConversion: (options?: { skipChangeCheck?: boolean }) => Promise<void>;
}

function detail(
  tone: LeadConvertStepDetail['tone'],
  label: string
): LeadConvertStepDetail {
  return { tone, label }
}

export function useLeadConvertConversion(
  opts: UseLeadConvertConversionOptions
): UseLeadConvertConversionResult {
  const {
    client,
    lead,
    t,
    navigate,
    onClose,
    form,
    mode,
    extraFields,
    selectedCompanyId,
    selectedContactId,
    duplicatesChecked,
    changesConfirmed,
    modeLabels,
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
    scrollProgressIntoView,
    createDataSourceClient
  } = opts

  const queryClient = useQueryClient()

  const { data: leadStatusOptions = [] } = useEnumEntities('lead_status', {
    appSlug: 'base_crm',
    dataSourceSlug: 'leads'
  })
  const { data: conversionStateOptions = [] } = useEnumEntities(
    'conversion_state',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'leads'
    }
  )
  const { data: conversionModeOptions = [] } = useEnumEntities(
    'conversion_mode',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'leads'
    }
  )
  const { data: leadFieldLeadSourceOptions = [] } = useEnumEntities(
    'lead_source',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'leads'
    }
  )
  const { data: dealFieldLeadSourceOptions = [] } = useEnumEntities(
    'lead_source',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'deal'
    }
  )
  const { data: leadCompanyIndustryOptions = [] } = useEnumEntities(
    'company_industry',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'leads'
    }
  )
  const { data: organizationIndustryOptions = [] } = useEnumEntities(
    'industry',
    {
      appSlug: 'base',
      dataSourceSlug: 'organization'
    }
  )
  const { data: leadCompanySizeOptions = [] } = useEnumEntities(
    'company_size',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'leads'
    }
  )
  const { data: organizationCompanySizeOptions = [] } = useEnumEntities(
    'company_size',
    {
      appSlug: 'base',
      dataSourceSlug: 'organization'
    }
  )

  const optionalEnumValue = (
    options: Array<{ id: string; name: string }>,
    name: string
  ) => optionByName(options, name)

  const conversionStateValue = (state: string) => optionalEnumValue(conversionStateOptions, state)

  const conversionModeValue = (selectedMode: LeadConvertConversionMode) => optionalEnumValue(conversionModeOptions, selectedMode)

  const updateLead = async (data: Record<string, unknown>) => {
    if (!client || !lead?.id) throw new Error(t('leads.failedToLoad'))
    await client.patch(
      `/v1/apps/base_crm/data-sources/leads/items/${lead.id}`,
      pickDefined(data)
    )
  }

  const mapEnumBetweenDataSources = (
    sourceId: string,
    sourceOptions: Array<{ id?: string; name?: string }>,
    targetOptions: Array<{ id?: string; name?: string }>
  ) => {
    const sourceName = sourceOptions.find(
      option => option.id === sourceId
    )?.name

    return sourceName ? optionByName(targetOptions, sourceName) : undefined
  }

  const buildLeadFieldSyncPatch = () => pickDefined({
      name: selectedContactId === null ? form.contactName : undefined,
      email: selectedContactId === null ? form.contactEmail : undefined,
      phone: selectedContactId === null ? form.contactPhone : undefined,
      contact_job_title:
        selectedContactId === null ? form.contactJobTitle : undefined,
      company_name_text:
        mode === 'company_contact_deal' && selectedCompanyId === null
          ? form.companyName
          : undefined,
      company_email:
        mode === 'company_contact_deal' && selectedCompanyId === null
          ? form.companyEmail
          : undefined,
      company_phone:
        mode === 'company_contact_deal' && selectedCompanyId === null
          ? form.companyPhone
          : undefined,
      website:
        mode === 'company_contact_deal' && selectedCompanyId === null
          ? form.companyWebsite
          : undefined,
      address:
        mode === 'company_contact_deal' && selectedCompanyId === null
          ? form.companyAddress
          : undefined,
      city:
        mode === 'company_contact_deal' && selectedCompanyId === null
          ? form.companyCity
          : undefined,
      company_industry:
        mode === 'company_contact_deal' &&
        selectedCompanyId === null &&
        form.companyIndustry
          ? mapEnumBetweenDataSources(
              form.companyIndustry,
              organizationIndustryOptions,
              leadCompanyIndustryOptions
            )
          : undefined,
      company_size:
        mode === 'company_contact_deal' &&
        selectedCompanyId === null &&
        form.companySize
          ? mapEnumBetweenDataSources(
              form.companySize,
              organizationCompanySizeOptions,
              leadCompanySizeOptions
            )
          : undefined,
      lead_source: form.dealLeadSourceId
        ? mapEnumBetweenDataSources(
            form.dealLeadSourceId,
            dealFieldLeadSourceOptions,
            leadFieldLeadSourceOptions
          )
        : undefined,
      deal_value: form.dealValue ? Number(form.dealValue) : undefined,
      contact_message: form.notes
    })

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
          'conversion_error_message'
        ]
      })
      .catch(() => null)
  }

  const findExistingRecordFromLead = async (
    endpoint: string,
    columns: string
  ) => {
    if (!client || !lead?.id) return undefined

    const response = await client
      .get(endpoint, {
        columns,
        filters: {
          rules: [{ field: 'source_lead', operator: '=', value: lead.id }]
        },
        limit: 1
      })
      .catch(() => [])

    return firstItem(response)
  }

  const migrateLinkedWork = async ({
    organizationId,
    contactId,
    dealId
  }: {
    organizationId?: string;
    contactId?: string;
    dealId?: string;
  }) => {
    const result: LinkedWorkMigrationResult = {
      attemptedCount: 0,
      updatedCount: 0,
      failedCount: 0,
      warningCount: 0
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
      })
    ])

    const updates: Array<Promise<unknown>> = []
    const taskFields = getFieldSlugs(taskDataSource)
    const eventFields = getFieldSlugs(eventDataSource)

    if (hasAllFields(taskFields, ['lead'])) {
      const response = await client
        .get('/v1/apps/base/data-sources/task/items', {
          columns: 'id',
          filters: {
            rules: [{ field: 'lead', operator: '=', value: lead.id }]
          },
          limit: 200
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
        deal: taskFields.has('deal') ? dealId : undefined
      })

      if (Object.keys(taskPatch).length > 0) {
        for (const item of unwrapItems(response)) {
          if (!item.id) continue
          result.attemptedCount += 1
          updates.push(
            client
              .patch(
                `/v1/apps/base/data-sources/task/items/${item.id}`,
                taskPatch
              )
              .then(
                () => {
                  result.updatedCount += 1
                },
                () => {
                  result.failedCount += 1
                }
              )
          )
        }
      }
    }

    if (hasAllFields(eventFields, ['lead'])) {
      const response = await client
        .get('/v1/apps/base/data-sources/event/items', {
          columns: 'id',
          filters: {
            rules: [{ field: 'lead', operator: '=', value: lead.id }]
          },
          limit: 200
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
        deal: eventFields.has('deal') ? dealId : undefined
      })

      if (Object.keys(eventPatch).length > 0) {
        for (const item of unwrapItems(response)) {
          if (!item.id) continue
          result.attemptedCount += 1
          updates.push(
            client
              .patch(
                `/v1/apps/base/data-sources/event/items/${item.id}`,
                eventPatch
              )
              .then(
                () => {
                  result.updatedCount += 1
                },
                () => {
                  result.failedCount += 1
                }
              )
          )
        }
      }
    }

    if (updates.length === 0) return result

    await Promise.all(updates)

    return result
  }

  const runConversion = async (options?: { skipChangeCheck?: boolean }) => {
    if (!client || !lead?.id) return

    const warnMissingField = (missing: LeadConvertMissingField) => {
      const message = t('leads.convert.validation.missingField', {
        label: missing.label
      })

      setErrorMessage(null)
      setStep('precheck', 'warn')
      setStepDetail('precheck', [detail('warn', message), detail('info', t('leads.convert.validation.completeHighlightedField'))])
      toast.warning(message)
      focusMissingField(missing.tab, missing.fieldKey)
    }

    const missingBeforePrecheck = findMissingField()

    if (missingBeforePrecheck) {
      warnMissingField(missingBeforePrecheck)

      return
    }

    if (!duplicatesChecked) {
      await findDuplicates({ form, mode })

      return
    }

    const missing = findMissingField()

    if (missing) {
      warnMissingField(missing)

      return
    }

    if (!options?.skipChangeCheck && !changesConfirmed) {
      const changes = findChangedFromLead()

      if (changes.length > 0) {
        setPendingChanges(changes)

        return
      }
    }

    scrollProgressIntoView()

    await new Promise(resolve => window.setTimeout(resolve, 350))

    setIsWorking(true)
    setErrorMessage(null)

    type ConversionStateValues = {
      organizationId?: string;
      contactId?: string;
      dealId?: string;
      me: CurrentUserResponse | null;
      convertedLeadStatusValue?: string;
      linkedWork: LinkedWorkMigrationResult | null;
    }

    const state: ConversionStateValues = {
      organizationId:
        getRelationId(lead.converted_organization) ??
        selectedCompanyId ??
        undefined,
      contactId:
        getRelationId(lead.converted_contact) ?? selectedContactId ?? undefined,
      dealId: getRelationId(lead.converted_deal),
      me: null,
      convertedLeadStatusValue: undefined,
      linkedWork: null
    }

    type StepKey =
      | 'precheck'
      | 'organization'
      | 'contact'
      | 'deal'
      | 'activity'
      | 'lead'

    type StepDefinition = {
      key: StepKey;
      shouldRun: () => boolean;
      onSkip?: () => void;
      run: () => Promise<void>;
    }

    let activeStep: StepKey = 'lead'

    const steps: Array<StepDefinition> = [
      {
        key: 'precheck',
        shouldRun: () => true,
        run: async () => {
          state.me = await client.get('/v1/users/me').catch(() => null)
          state.convertedLeadStatusValue = optionalEnumValue(
            leadStatusOptions,
            'Converted'
          )
          await updateLead({
            conversion_state: conversionStateValue('in_progress'),
            conversion_mode: conversionModeValue(mode),
            conversion_error_message: null
          })
          addStepDetail(
            'precheck',
            detail(
              'info',
              t('leads.convert.conversionMode', { mode: modeLabels[mode] })
            )
          )
          addStepDetail(
            'precheck',
            detail('info', t('leads.convert.leadStatus'))
          )
          setStep('precheck', 'done')
        }
      },
      {
        key: 'organization',
        shouldRun: () => mode === 'company_contact_deal',
        onSkip: () => {
          setStepDetail('organization', [detail('neutral', t('leads.convert.result.skipped'))])
          setStep('organization', 'skipped')
        },
        run: async () => {
          if (!state.organizationId) {
            const existingOrganization = await findExistingRecordFromLead(
              '/v1/apps/base/data-sources/organization/items',
              'id,name'
            )

            state.organizationId = existingOrganization?.id
          }
          const isReusedOrg = Boolean(state.organizationId)

          if (!state.organizationId) {
            const orgExtras = Object.fromEntries(
              extraFields.company
                .filter(field => field.value !== '')
                .map(field => [field.slug, field.value])
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
                record_owner: getRelationId(lead.record_owner),
                source_lead: lead.id,
                ...orgExtras
              }
            )

            state.organizationId = organization?.id
          }
          await updateLead({ converted_organization: state.organizationId })
          setStepDetail('organization', [
            detail(
              'success',
              isReusedOrg
                ? t('leads.convert.result.reusedOrganization', {
                    name: form.companyName
                  })
                : t('leads.convert.result.newOrganization', {
                    name: form.companyName
                  })
            ),
            ...(state.organizationId
              ? [detail('neutral', `ID: ${state.organizationId}`)]
              : [])
          ])
          setStep('organization', 'done')
        }
      },
      {
        key: 'contact',
        shouldRun: () => true,
        onSkip: () => {
          setStepDetail('contact', [detail('neutral', t('leads.convert.result.skipped'))])
          setStep('contact', 'skipped')
        },
        run: async () => {
          if (!state.contactId) {
            const existingContact = await findExistingRecordFromLead(
              '/v1/apps/base/data-sources/contact/items',
              'id,name'
            )

            state.contactId = existingContact?.id
          }
          const isReusedContact = Boolean(state.contactId)

          if (!state.contactId) {
            const contactExtras = Object.fromEntries(
              extraFields.contact
                .filter(field => field.value !== '')
                .map(field => [field.slug, field.value])
            )
            const contact = await client.post(
              '/v1/apps/base/data-sources/contact/items',
              {
                name: form.contactName,
                email: form.contactEmail || undefined,
                mobile: form.contactPhone || undefined,
                job_title: form.contactJobTitle || undefined,
                organization: state.organizationId,
                record_owner: getRelationId(lead.record_owner),
                source_lead: lead.id,
                ...contactExtras
              }
            )

            state.contactId = contact?.id
          }
          await updateLead({ converted_contact: state.contactId })
          setStepDetail('contact', [
            detail(
              'success',
              isReusedContact
                ? t('leads.convert.result.reusedContact', {
                    name: form.contactName
                  })
                : t('leads.convert.result.newContact', {
                    name: form.contactName
                  })
            ),
            ...(state.contactId
              ? [detail('neutral', `ID: ${state.contactId}`)]
              : [])
          ])
          setStep('contact', 'done')
        }
      },
      {
        key: 'deal',
        shouldRun: () => true,
        run: async () => {
          if (!state.dealId) {
            const existingDeal = await findExistingRecordFromLead(
              '/v1/apps/base_crm/data-sources/deal/items',
              'id,name,stage(id,name),organization(id,name),source_lead(id,name)'
            )

            state.dealId = existingDeal?.id
          }
          const isReusedDeal = Boolean(state.dealId)

          if (!state.dealId) {
            const leadProductTagIds = getMultiRelationIds(
              lead?.leads_products_tags
            )
            const dealExtras = Object.fromEntries(
              extraFields.deal
                .filter(field => field.value !== '')
                .map(field => [field.slug, field.value])
            )
            const deal = await client.post(
              '/v1/apps/base_crm/data-sources/deal/items',
              {
                name: form.dealName,
                organization: state.organizationId,
                contact_person: state.contactId,
                stage: effectiveStageId || undefined,
                lead_source: effectiveLeadSourceId || undefined,
                customer_type: effectiveCustomerTypeId || undefined,
                country: getRelationId(lead.countries),
                record_owner: getRelationId(lead.record_owner),
                deal_value: form.dealValue ? Number(form.dealValue) : undefined,
                qualification_notes: form.notes || undefined,
                source_lead: lead.id,
                deals_products_tags: leadProductTagIds,
                ...dealExtras
              }
            )

            state.dealId = deal?.id
          }
          await updateLead({ converted_deal: state.dealId })
          const dealDetails: Array<LeadConvertStepDetail> = [
            detail(
              'success',
              isReusedDeal
                ? t('leads.convert.result.reusedDeal', { name: form.dealName })
                : t('leads.convert.result.newDeal', { name: form.dealName })
            ),
            detail('info', t('leads.convert.result.stage'))
          ]

          if (mappedDealLeadSourceId)
            dealDetails.push(
              detail('info', t('leads.convert.result.leadSourceMapped'))
            )
          if (mappedCustomerTypeId)
            dealDetails.push(
              detail('info', t('leads.convert.result.customerTypeMapped'))
            )
          if (form.dealValue)
            dealDetails.push(
              detail(
                'info',
                t('leads.convert.result.estimatedValue', {
                  value: form.dealValue
                })
              )
            )
          setStepDetail('deal', dealDetails)
          setStep('deal', 'done')
        }
      },
      {
        key: 'activity',
        shouldRun: () => true,
        run: async () => {
          const linkedWorkMigration = await migrateLinkedWork({
            organizationId: state.organizationId,
            contactId: state.contactId,
            dealId: state.dealId
          })

          state.linkedWork = linkedWorkMigration
          const linkedWorkHasWarning =
            linkedWorkMigration.failedCount > 0 ||
            linkedWorkMigration.warningCount > 0
          const linkedWorkDetails: Array<LeadConvertStepDetail> = []

          if (linkedWorkMigration.updatedCount > 0) {
            linkedWorkDetails.push(
              detail('success', t('leads.convert.result.linkedWorkMoved'))
            )
          }
          if (linkedWorkHasWarning) {
            const warning = t('leads.convert.result.linkedWorkWarning', {
              count:
                linkedWorkMigration.failedCount +
                linkedWorkMigration.warningCount
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
              organizationId: state.organizationId,
              contactId: state.contactId,
              dealId: state.dealId
            })
          }
          if (linkedWorkDetails.length === 0) {
            linkedWorkDetails.push(
              detail('neutral', t('leads.convert.result.noLinkedWork'))
            )
          }
          setStepDetail('activity', linkedWorkDetails)
          setStep(
            'activity',
            linkedWorkHasWarning
              ? 'warn'
              : linkedWorkMigration.updatedCount > 0
                ? 'done'
                : 'skipped'
          )
        }
      },
      {
        key: 'lead',
        shouldRun: () => true,
        run: async () => {
          await updateLead({
            ...buildLeadFieldSyncPatch(),
            lead_status: state.convertedLeadStatusValue,
            converted_deal: state.dealId,
            converted_contact: state.contactId,
            converted_organization: state.organizationId,
            converted_on: new Date().toISOString(),
            converted_by: state.me?.id,
            conversion_state: conversionStateValue('completed'),
            conversion_mode: conversionModeValue(mode),
            conversion_error_message: null
          })
          setStepDetail('lead', [
            detail('success', t('leads.convert.result.leadStatusConverted')),
            detail(
              'info',
              t('leads.convert.result.completedAt', {
                date: new Date().toLocaleString()
              })
            )
          ])
          setStep('lead', 'done')
        }
      }
    ]

    try {
      const latestLead = await fetchLatestLeadConversion()
      const latestDealId = getRelationId(latestLead?.converted_deal)
      const latestStateName = normalizeConversionKey(
        getRelationName(latestLead?.conversion_state)
      )

      if (latestLead && isLeadConvertedRecord(latestLead)) {
        setStep('lead', 'done')
        setStepDetail('lead', [detail('info', t('leads.convert.result.alreadyCompleted'))])
        toast.info(t('leads.convert.result.alreadyCompleted'))
        onClose()
        if (latestDealId) {
          void navigate({
            to: '/deals/$dealId',
            params: { dealId: latestDealId }
          })
        }

        return
      }

      const latestHasAnyCreated = Boolean(
        getRelationId(latestLead?.converted_organization) ||
        getRelationId(latestLead?.converted_contact) ||
        latestDealId
      )

      if (
        latestStateName === normalizeConversionKey('in_progress') &&
        !latestHasAnyCreated
      ) {
        throw new Error(t('leads.convert.validation.alreadyInProgress'))
      }

      state.organizationId =
        getRelationId(latestLead?.converted_organization) ??
        state.organizationId
      state.contactId =
        getRelationId(latestLead?.converted_contact) ?? state.contactId
      state.dealId = latestDealId ?? state.dealId

      for (const step of steps) {
        if (!step.shouldRun()) {
          step.onSkip?.()
          continue
        }
        activeStep = step.key
        setStep(step.key, 'running')
        await step.run()
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
        queryClient.invalidateQueries({ queryKey: ['deals'] }),
        queryClient.invalidateQueries({ queryKey: ['contacts'] }),
        queryClient.invalidateQueries({ queryKey: ['companies'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['events'] })
      ])

      logLeadConvertEvent('info', 'conversion_completed', {
        leadId: lead?.id,
        mode,
        organizationId: state.organizationId,
        contactId: state.contactId,
        dealId: state.dealId,
        linkedWorkAttemptedCount: state.linkedWork?.attemptedCount ?? 0,
        linkedWorkUpdatedCount: state.linkedWork?.updatedCount ?? 0,
        linkedWorkFailedCount: state.linkedWork?.failedCount ?? 0,
        linkedWorkWarningCount: state.linkedWork?.warningCount ?? 0
      })

      const successDealId = state.dealId
      const successOrganizationId = state.organizationId
      const successContactId = state.contactId

      toast.success(t('leads.convert.successMessage'), {
        description: (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {successDealId ? (
              <button
                type="button"
                className="rounded border bg-background px-2 py-1 text-[11px] font-medium text-foreground shadow-sm hover:bg-accent"
                onClick={() => void navigate({
                    to: '/deals/$dealId',
                    params: { dealId: successDealId }
                  })}>
                {t('leads.convert.successAction.openDeal')}
              </button>
            ) : null}
            {successOrganizationId ? (
              <button
                type="button"
                className="rounded border bg-background px-2 py-1 text-[11px] font-medium text-foreground shadow-sm hover:bg-accent"
                onClick={() => void navigate({
                    to: '/companies/$companyId',
                    params: { companyId: successOrganizationId }
                  })}>
                {t('leads.convert.successAction.openCompany')}
              </button>
            ) : null}
            {successContactId ? (
              <button
                type="button"
                className="rounded border bg-background px-2 py-1 text-[11px] font-medium text-foreground shadow-sm hover:bg-accent"
                onClick={() => void navigate({
                    to: '/contacts/$contactId',
                    params: { contactId: successContactId }
                  })}>
                {t('leads.convert.successAction.openContact')}
              </button>
            ) : null}
          </div>
        )
      })
      onClose()
      if (state.dealId) {
        void navigate({
          to: '/deals/$dealId',
          params: { dealId: state.dealId }
        })
      }
    } catch (error) {
      const message = getErrorMessage(error, t)
      const partial = Boolean(
        state.organizationId || state.contactId || state.dealId
      )

      setErrorMessage(message)
      setStep(activeStep, 'failed')
      setStepDetail(activeStep, [detail('error', t('leads.convert.result.errorPrefix', { message }))])
      logLeadConvertEvent('error', 'conversion_failed', {
        leadId: lead?.id,
        mode,
        activeStep,
        partial,
        message,
        organizationId: state.organizationId,
        contactId: state.contactId,
        dealId: state.dealId
      })
      await updateLead({
        converted_organization: state.organizationId,
        converted_contact: state.contactId,
        converted_deal: state.dealId,
        conversion_state: conversionStateValue(partial ? 'partial' : 'failed'),
        conversion_error_message: message
      }).catch(() => undefined)
      toast.error(message)
    } finally {
      setIsWorking(false)
    }
  }

  return { runConversion }
}
