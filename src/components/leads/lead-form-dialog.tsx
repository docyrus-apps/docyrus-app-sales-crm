/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useMemo } from 'react'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { useBaseCountryCollection } from '@/collections'
import { DynamicFormField } from '@/components/docyrus/form-fields/dynamic-form-field'
import type { EnumOption, IField } from '@/components/docyrus/form-fields/types'
import type { LeadFormData } from '@/schemas/lead-schema'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { AwesomeDialog } from '@/components/docyrus/awesome-dialog/awesome-dialog'
import { AwesomeDialogHeader } from '@/components/docyrus/awesome-dialog/awesome-dialog-header'
import { AwesomeDialogBody } from '@/components/docyrus/awesome-dialog/awesome-dialog-body'
import { AwesomeDialogFooter } from '@/components/docyrus/awesome-dialog/awesome-dialog-footer'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox-simple'
import { PhoneInput } from '@/components/ui/phone-input'
import { leadFormSchema } from '@/schemas/lead-schema'
import { useCreateLead, useUpdateLead } from '@/hooks/use-leads'
import { useProducts } from '@/hooks/use-products'
import { useUsers } from '@/hooks/use-users'
import { useEnumOptions } from '@/hooks/use-enums'
import { isLeadConvertedRecord } from '@/lib/lead-conversion'

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: any
  mode: 'create' | 'edit'
  onSubmitSuccess?: () => void | Promise<void>
}

function getRelationId(value: unknown) {
  if (value && typeof value === 'object' && 'id' in value) {
    return String((value as { id?: string }).id ?? '')
  }

  return typeof value === 'string' ? value : ''
}

function numericDefault(value: unknown) {
  return typeof value === 'number' ? value : undefined
}

function multiRelationDefault(value: unknown): Array<string> {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
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
}

function buildLeadFormDefaults(lead: any): LeadFormData {
  return {
    name: lead?.name || '',
    contact_job_title: lead?.contact_job_title || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company_name_text: lead?.company_name_text || '',
    company_email: lead?.company_email || '',
    company_phone: lead?.company_phone || '',
    website: lead?.website || '',
    address: lead?.address || '',
    city: lead?.city || '',
    state: lead?.state || '',
    company_industry: getRelationId(lead?.company_industry),
    company_size: getRelationId(lead?.company_size),
    lead_source: getRelationId(lead?.lead_source),
    lead_status: getRelationId(lead?.lead_status),
    lead_type: getRelationId(lead?.lead_type),
    country: getRelationId(lead?.countries),
    record_owner: getRelationId(lead?.record_owner),
    contact_message: lead?.contact_message || '',
    lost_reason: getRelationId(lead?.lost_reason),
    deal_value: numericDefault(lead?.deal_value),
    leads_products_tags: multiRelationDefault(lead?.leads_products_tags),
  }
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  mode,
  onSubmitSuccess,
}: LeadFormDialogProps) {
  const { t } = useTranslation()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()
  const countriesCollection = useBaseCountryCollection()
  const { data: users = [] } = useUsers()
  const { options: leadStatusOptions = [] } = useEnumOptions('lead_status', {
    appSlug: 'base_crm',
    dataSourceSlug: 'leads',
  })
  const { options: leadSourceOptions = [] } = useEnumOptions('lead_source', {
    appSlug: 'base_crm',
    dataSourceSlug: 'leads',
  })
  const { options: leadTypeOptions = [] } = useEnumOptions('lead_type', {
    appSlug: 'base_crm',
    dataSourceSlug: 'leads',
  })
  const { options: companyIndustryOptions = [] } = useEnumOptions(
    'company_industry',
    {
      appSlug: 'base_crm',
      dataSourceSlug: 'leads',
    },
  )
  const { options: companySizeOptions = [] } = useEnumOptions('company_size', {
    appSlug: 'base_crm',
    dataSourceSlug: 'leads',
  })
  const { options: lostReasonOptions = [] } = useEnumOptions('lost_reason', {
    appSlug: 'base_crm',
    dataSourceSlug: 'leads',
  })
  const { data: products = [] } = useProducts({
    columns: ['id', 'name', 'product_code'],
    orderBy: 'product_code ASC',
    limit: 300,
  })
  const { data: countries = [] } = useQuery({
    queryKey: ['base-country-options'],
    queryFn: () =>
      countriesCollection.list({
        columns: ['id', 'name'],
        orderBy: 'name ASC',
        limit: 300,
      }),
  })

  const isConverted = isLeadConvertedRecord(lead)
  const initialValues = useMemo(() => buildLeadFormDefaults(lead), [lead])

  const form = useForm<LeadFormData>({
    formId: `lead-form-${mode}-${lead?.id ?? 'new'}`,
    defaultValues: initialValues,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: leadFormSchema,
    },
    onSubmit: async ({ value }) => {
      const { country, ...rest } = value
      const cleanedData = Object.fromEntries(
        Object.entries({ ...rest, countries: country }).map(([key, val]) => [
          key,
          val === '' ? undefined : val,
        ]),
      )

      if (mode === 'create') {
        await createLead.mutateAsync(cleanedData)
      } else if (lead?.id) {
        await updateLead.mutateAsync({ leadId: lead.id, data: cleanedData })
      }

      await onSubmitSuccess?.()
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(initialValues)
  }, [form, initialValues, open, mode])

  const userOptions = users.map((user: any) => ({
    label: `${user.firstname} ${user.lastname}`,
    value: user.id,
  }))
  const productTagField: IField = {
    id: 'leads_products_tags',
    name: t('leads.form.productsLabel', { defaultValue: 'Products' }),
    slug: 'leads_products_tags',
    type: 'field-tagSelect',
  }
  const productOptions: Array<EnumOption> = products.map((product) => ({
    id: product.id ?? '',
    name: product.name || product.product_code || product.id || '',
  }))
  const countryOptions = countries.map((country) => ({
    label: country.name,
    value: country.id ?? '',
  }))

  const isSubmitting = createLead.isPending || updateLead.isPending
  const isDisqualifiedStatus = (statusValue: string | undefined) => {
    const selectedLeadStatus = leadStatusOptions.find(
      (option: any) => option.value === statusValue,
    )?.label

    return selectedLeadStatus?.trim().toLowerCase() === 'disqualified'
  }

  return (
    <AwesomeDialog
      open={open}
      onOpenChange={onOpenChange}
      container="modal"
      size="lg"
    >
      <AwesomeDialogHeader
        title={
          mode === 'create'
            ? t('leads.form.createTitle')
            : t('leads.form.editTitle')
        }
        description={
          isConverted
            ? t('leads.convert.readOnlyDescription', {
                defaultValue:
                  'This lead has already been converted and can no longer be edited.',
              })
            : mode === 'create'
              ? t('leads.form.createDescription')
              : t('leads.form.editDescription')
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!isConverted) form.handleSubmit()
        }}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <AwesomeDialogBody>
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t('leads.form.contactSection', {
                  defaultValue: 'Contact information',
                })}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="name">
                  {(field) => (
                    <Field className="col-span-2">
                      <Label htmlFor={field.name}>
                        {t('leads.form.contactNameLabel', {
                          defaultValue: 'Contact name',
                        })}{' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        disabled={isConverted}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t('leads.form.contactNamePlaceholder', {
                          defaultValue: 'Enter contact name...',
                        })}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="contact_job_title">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.jobTitleLabel', {
                          defaultValue: 'Job title',
                        })}
                      </Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        disabled={isConverted}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="email">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.emailLabel')}
                      </Label>
                      <Input
                        id={field.name}
                        type="email"
                        value={field.state.value}
                        disabled={isConverted}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t('leads.form.emailPlaceholder')}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="phone">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.phoneLabel')}
                      </Label>
                      <PhoneInput
                        value={field.state.value}
                        disabled={isConverted}
                        onValueChange={field.handleChange}
                        placeholder={t('leads.form.phonePlaceholder')}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t('leads.form.companySection', {
                  defaultValue: 'Company information',
                })}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="company_name_text">
                  {(field) => (
                    <Field className="col-span-2">
                      <Label htmlFor={field.name}>
                        {t('leads.form.companyLabel')}
                      </Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        disabled={isConverted}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t('leads.form.companyPlaceholder', {
                          defaultValue: 'Enter company name...',
                        })}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="company_email">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.companyEmailLabel', {
                          defaultValue: 'Company email',
                        })}
                      </Label>
                      <Input
                        id={field.name}
                        type="email"
                        value={field.state.value}
                        disabled={isConverted}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="company_phone">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.companyPhoneLabel', {
                          defaultValue: 'Company phone',
                        })}
                      </Label>
                      <PhoneInput
                        value={field.state.value}
                        disabled={isConverted}
                        onValueChange={field.handleChange}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="website">
                  {(field) => (
                    <Field className="col-span-2">
                      <Label htmlFor={field.name}>
                        {t('leads.form.websiteLabel')}
                      </Label>
                      <Input
                        id={field.name}
                        type="url"
                        value={field.state.value}
                        disabled={isConverted}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t('leads.form.websitePlaceholder')}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="address">
                  {(field) => (
                    <Field className="col-span-2">
                      <Label htmlFor={field.name}>
                        {t('leads.form.addressLabel')}
                      </Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        disabled={isConverted}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t('leads.form.addressPlaceholder')}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="city">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.cityLabel')}
                      </Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        disabled={isConverted}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t('leads.form.cityPlaceholder')}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="state">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.stateLabel')}
                      </Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        disabled={isConverted}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t('leads.form.statePlaceholder')}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="company_industry">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.companyIndustryLabel', {
                          defaultValue: 'Company industry',
                        })}
                      </Label>
                      <Select
                        value={field.state.value}
                        disabled={isConverted}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'leads.form.companyIndustryPlaceholder',
                              {
                                defaultValue: 'Select industry...',
                              },
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {companyIndustryOptions.map((option: any) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="company_size">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.companySizeLabel', {
                          defaultValue: 'Company size',
                        })}
                      </Label>
                      <Select
                        value={field.state.value}
                        disabled={isConverted}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'leads.form.companySizePlaceholder',
                              {
                                defaultValue: 'Select size...',
                              },
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizeOptions.map((option: any) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="country">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.countryLabel')}
                      </Label>
                      <Select
                        value={field.state.value}
                        disabled={isConverted}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('leads.form.countryPlaceholder')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((option: any) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <div className="col-span-2">
                  <DynamicFormField
                    field={productTagField}
                    form={form}
                    disabled={isConverted}
                    enumOptions={productOptions}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t('leads.form.qualificationSection', {
                  defaultValue: 'Qualification',
                })}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="lead_status">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.leadStatusLabel')}
                      </Label>
                      <Select
                        value={field.state.value}
                        disabled={isConverted}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('leads.form.leadStatusPlaceholder')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {leadStatusOptions.map((option: any) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="lead_source">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.leadSourceLabel')}
                      </Label>
                      <Select
                        value={field.state.value}
                        disabled={isConverted}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('leads.form.leadSourcePlaceholder')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {leadSourceOptions.map((option: any) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="lead_type">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.leadTypeLabel')}
                      </Label>
                      <Select
                        value={field.state.value}
                        disabled={isConverted}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('leads.form.leadTypePlaceholder')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {leadTypeOptions.map((option: any) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="record_owner">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.recordOwnerLabel')}
                      </Label>
                      <Combobox
                        options={userOptions}
                        value={field.state.value}
                        disabled={isConverted}
                        onValueChange={(value) => field.handleChange(value)}
                        placeholder={t('leads.form.recordOwnerPlaceholder')}
                        emptyText={t('leads.form.recordOwnerEmpty')}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="deal_value">
                  {(field) => (
                    <Field>
                      <Label htmlFor={field.name}>
                        {t('leads.form.estimatedValueLabel', {
                          defaultValue: 'Estimated value',
                        })}
                      </Label>
                      <Input
                        id={field.name}
                        type="number"
                        value={field.state.value ?? ''}
                        disabled={isConverted}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Subscribe selector={(state) => state.values.lead_status}>
                  {(leadStatus) =>
                    isDisqualifiedStatus(leadStatus) ? (
                      <form.Field name="lost_reason">
                        {(field) => (
                          <Field className="col-span-2">
                            <Label htmlFor={field.name}>
                              {t('leads.form.lostReasonLabel', {
                                defaultValue: 'Lost reason',
                              })}
                            </Label>
                            <Select
                              value={field.state.value}
                              disabled={isConverted}
                              onValueChange={field.handleChange}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    'leads.form.lostReasonPlaceholder',
                                    {
                                      defaultValue: 'Select lost reason...',
                                    },
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {lostReasonOptions.map((option: any) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                      </form.Field>
                    ) : null
                  }
                </form.Subscribe>

                <form.Field name="contact_message">
                  {(field) => (
                    <Field className="col-span-2">
                      <Label htmlFor={field.name}>
                        {t('leads.form.qualificationNotesLabel', {
                          defaultValue: 'Qualification notes',
                        })}
                      </Label>
                      <Textarea
                        id={field.name}
                        value={field.state.value}
                        disabled={isConverted}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t(
                          'leads.form.qualificationNotesPlaceholder',
                          {
                            defaultValue: 'Add qualification notes...',
                          },
                        )}
                        rows={4}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>
            </section>
          </div>
        </AwesomeDialogBody>

        <AwesomeDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          {!isConverted && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === 'create'
                ? t('leads.form.createButton')
                : t('leads.form.updateButton')}
            </Button>
          )}
        </AwesomeDialogFooter>
      </form>
    </AwesomeDialog>
  )
}
