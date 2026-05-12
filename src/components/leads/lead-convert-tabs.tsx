import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowRight, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  FieldMappingRow,
  type FieldKind,
  type SelectOption,
} from '@/components/leads/field-mapping-row'
import { LeadConvertReuseBanner } from '@/components/leads/lead-convert-reuse-banner'

export type LeadConvertConversionMode = 'company_contact_deal' | 'contact_deal'
export type LeadConvertTarget = 'company' | 'contact' | 'deal'
export type LeadConvertEntityCandidate = Record<string, any> & {
  id?: string
  name?: string
}
export type LeadConvertExtraField = {
  slug: string
  label: string
  kind: FieldKind
  value: string
}
export type LeadConvertExtraFieldsState = Record<
  LeadConvertTarget,
  Array<LeadConvertExtraField>
>
export type LeadConvertTargetFieldOption = {
  slug: string
  name: string
  type: string
}

export type LeadConvertForm = {
  companyName: string
  companyWebsite: string
  companyEmail: string
  companyPhone: string
  companyAddress: string
  companyCity: string
  companyIndustry: string
  companySize: string
  companyCountry: string
  contactName: string
  contactEmail: string
  contactPhone: string
  contactJobTitle: string
  dealName: string
  dealValue: string
  notes: string
  dealStageId: string
  dealLeadSourceId: string
  dealCustomerTypeId: string
  dealCountry: string
  dealOwner: string
}

export interface LeadConvertTabsProps {
  mode: LeadConvertConversionMode
  activeTab: LeadConvertTarget
  onActiveTabChange: (tab: LeadConvertTarget) => void
  targetLabels: Record<LeadConvertTarget, string>

  lead: any
  form: LeadConvertForm
  updateForm: (key: keyof LeadConvertForm, value: string) => void
  formDisabled: boolean
  isWorking: boolean
  sourceDealName: string

  companyCandidates: Array<LeadConvertEntityCandidate>
  contactCandidates: Array<LeadConvertEntityCandidate>
  dealCandidates: Array<LeadConvertEntityCandidate>
  selectedCompanyId: string | null
  selectedContactId: string | null
  exactCompanyId: string | null
  exactContactId: string | null
  onSelectCompany: (id: string | null) => void
  onSelectContact: (id: string | null) => void

  industrySelectOptions: Array<SelectOption>
  companySizeSelectOptions: Array<SelectOption>
  stageSelectOptions: Array<SelectOption>
  leadSourceSelectOptions: Array<SelectOption>
  customerTypeSelectOptions: Array<SelectOption>

  effectiveCompanyIndustryId: string
  mappedCompanyIndustryId: string | undefined
  effectiveCompanySizeId: string
  mappedCompanySizeId: string | undefined
  effectiveStageId: string
  newStageId: string | undefined
  effectiveLeadSourceId: string
  mappedDealLeadSourceId: string | undefined
  effectiveCustomerTypeId: string
  mappedCustomerTypeId: string | undefined

  leadCompanyIndustryName: string
  leadCompanySizeName: string
  leadSourceName: string
  leadTypeName: string

  extraFields: LeadConvertExtraFieldsState
  availableExtraFields: (
    target: LeadConvertTarget,
  ) => Array<LeadConvertTargetFieldOption>
  addExtraField: (
    target: LeadConvertTarget,
    field: LeadConvertTargetFieldOption,
  ) => void
  setExtraValue: (
    target: LeadConvertTarget,
    slug: string,
    value: string,
  ) => void
  removeExtraField: (target: LeadConvertTarget, slug: string) => void
}

export function LeadConvertTabs(props: LeadConvertTabsProps) {
  const {
    mode,
    activeTab,
    onActiveTabChange,
    targetLabels,
    lead,
    form,
    updateForm,
    formDisabled,
    isWorking,
    sourceDealName,
    companyCandidates,
    contactCandidates,
    dealCandidates,
    selectedCompanyId,
    selectedContactId,
    exactCompanyId,
    exactContactId,
    onSelectCompany,
    onSelectContact,
    industrySelectOptions,
    companySizeSelectOptions,
    stageSelectOptions,
    leadSourceSelectOptions,
    customerTypeSelectOptions,
    effectiveCompanyIndustryId,
    mappedCompanyIndustryId,
    effectiveCompanySizeId,
    mappedCompanySizeId,
    effectiveStageId,
    newStageId,
    effectiveLeadSourceId,
    mappedDealLeadSourceId,
    effectiveCustomerTypeId,
    mappedCustomerTypeId,
    leadCompanyIndustryName,
    leadCompanySizeName,
    leadSourceName,
    leadTypeName,
    extraFields,
    availableExtraFields,
    addExtraField,
    setExtraValue,
    removeExtraField,
  } = props
  const { t } = useTranslation()

  const tabsToShow: Array<LeadConvertTarget> = []
  if (mode === 'company_contact_deal') tabsToShow.push('company')
  tabsToShow.push('contact')
  tabsToShow.push('deal')

  const renderMappingHeader = (target: LeadConvertTarget) => (
    <div className="grid items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.3fr)]">
      <div className="rounded-xl border border-sky-200/70 bg-sky-50/70 px-3 py-2 text-sky-800/80 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200/80">
        {t('leads.convert.mappingHeader.source')}
      </div>
      <ArrowRight
        className="hidden size-3.5 text-muted-foreground/50 sm:block"
        aria-hidden
      />
      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-emerald-800/80 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200/80">
        {targetLabels[target]}
      </div>
    </div>
  )

  const renderAddFieldPopover = (target: LeadConvertTarget) => {
    const targetLabel = targetLabels[target]
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
            className="h-8 rounded-xl"
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

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onActiveTabChange(value as LeadConvertTarget)}
      className="w-full"
    >
      <TabsList className="w-full justify-start rounded-2xl border border-slate-200 bg-muted/30 p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-slate-700/80">
        {tabsToShow.map((tab) => {
          const extraCount = extraFields[tab].length
          return (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <span>{targetLabels[tab]}</span>
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
          <LeadConvertReuseBanner
            target="company"
            candidates={companyCandidates}
            selectedId={selectedCompanyId}
            exactId={exactCompanyId}
            isWorking={isWorking}
            onSelect={onSelectCompany}
          />
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
              {renderMappingHeader('company')}
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
          <LeadConvertReuseBanner
            target="contact"
            candidates={contactCandidates}
            selectedId={selectedContactId}
            exactId={exactContactId}
            isWorking={isWorking}
            onSelect={onSelectContact}
          />
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
              {renderMappingHeader('contact')}
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
        {renderMappingHeader('deal')}
        <FieldMappingRow
          fieldKey="deal:name"
          label={t('leads.convert.field.dealName')}
          sourceLabel={t('leads.convert.sourceLabel.auto')}
          targetLabel={t('leads.convert.targetLabel.deal', { field: 'name' })}
          sourceValue={
            [lead?.company_name_text, lead?.name].filter(Boolean).join(' - ') ||
            ''
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
