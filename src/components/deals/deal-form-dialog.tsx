import { useEffect, useMemo, useState } from 'react'

import type { DealFormData } from '@/schemas/deal-schema'

import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { useTranslation } from 'react-i18next'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/animate-ui/components/buttons/button'
import { AwesomeDialog } from '@/components/docyrus/awesome-dialog'
import { AwesomeDialogHeader } from '@/components/docyrus/awesome-dialog/awesome-dialog-header'
import { AwesomeDialogBody } from '@/components/docyrus/awesome-dialog/awesome-dialog-body'
import { AwesomeDialogFooter } from '@/components/docyrus/awesome-dialog/awesome-dialog-footer'
import { FormSubmitAlert } from '@/components/crm/form-submit-alert'
import { SelectFormField } from '@/components/docyrus/form-fields/select-form-field'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox-simple'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { dealFormSchema } from '@/schemas/deal-schema'
import { useBaseCountryCollection } from '@/collections'
import { useCreateDeal, useUpdateDeal } from '@/hooks/use-deals'
import { useCompanies } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import { useUsers } from '@/hooks/use-users'
import { useEnumOptions } from '@/hooks/use-enums'
import { cn } from '@/lib/utils'
import {
  getSubmitFailureMessage,
  validateSubmitValues
} from '@/lib/form-submit-feedback'

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: any;
  mode: 'create' | 'edit';
  onSubmitSuccess?: () => void | Promise<void>;
}

function getRelationValue(value: any): string {
  if (value && typeof value === 'object') return value.id || ''

  return value || ''
}

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  mode,
  onSubmitSuccess
}: DealFormDialogProps) {
  const { t } = useTranslation()
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()
  const { data: companies = [] } = useCompanies()
  const { data: contacts = [] } = useContacts()
  const { data: users = [] } = useUsers()
  const enumOptions = { appSlug: 'base_crm', dataSourceSlug: 'deal' }
  const { options: stageOptions = [] } = useEnumOptions('stage', enumOptions)
  const { options: leadSourceOptions = [] } = useEnumOptions(
    'lead_source',
    enumOptions
  )
  const { options: customerTypeOptions = [] } = useEnumOptions(
    'customer_type',
    enumOptions
  )
  const countriesCollection = useBaseCountryCollection()
  const { data: countries = [] } = useQuery({
    queryKey: ['base-country-options'],
    queryFn: () => countriesCollection.list({
        columns: ['id', 'name'],
        orderBy: 'name ASC',
        limit: 300
      })
  })
  const countryOptions = countries.map(country => ({
    label: country.name,
    value: country.id ?? ''
  }))
  const leadSourceComboboxOptions = leadSourceOptions.map((option: any) => ({
    label: option.label,
    value: option.value
  }))
  const customerTypeComboboxOptions = customerTypeOptions.map(
    (option: any) => ({
      label: option.label,
      value: option.value
    })
  )
  const initialValues = useMemo<DealFormData>(
    () => ({
      organization: getRelationValue(deal?.organization),
      contact_person: getRelationValue(deal?.contact_person),
      stage: getRelationValue(deal?.stage),
      deal_value: deal?.deal_value || undefined,
      expected_revenue: deal?.expected_revenue || undefined,
      close_probability: deal?.close_probability || undefined,
      expected_closing_date: deal?.expected_closing_date || undefined,
      lead_source: getRelationValue(deal?.lead_source),
      customer_type: getRelationValue(deal?.customer_type),
      country: getRelationValue(deal?.country),
      hot_prospect: deal?.hot_prospect || false,
      record_owner: getRelationValue(deal?.record_owner)
    }),
    [deal]
  )

  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<DealFormData>({
    formId: `deal-form-${mode}-${deal?.id ?? 'new'}`,
    defaultValues: initialValues,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: dealFormSchema,
      onSubmit: dealFormSchema
    },
    onSubmit: async ({ value }) => {
      try {
        setSubmitError(null)
        // Clean up empty strings (convert to undefined for UUID fields)
        const cleanedData = Object.fromEntries(
          Object.entries(value).map(([key, val]) => [key, val === '' ? undefined : val])
        )

        if (mode === 'create') {
          await createDeal.mutateAsync(cleanedData)
        } else if (deal?.id) {
          await updateDeal.mutateAsync({ dealId: deal.id, data: cleanedData })
        }

        await onSubmitSuccess?.()
        onOpenChange(false)
      } catch (error) {
        setSubmitError(getSubmitFailureMessage(error, t))
      }
    }
  })

  useEffect(() => {
    if (!open) return

    form.reset(initialValues)
    setSelectedDate(
      initialValues.expected_closing_date
        ? new Date(initialValues.expected_closing_date)
        : undefined
    )
    setSubmitError(null)
  }, [
form,
initialValues,
open,
mode
])

  useEffect(() => {
    form.setFieldValue(
      'expected_closing_date',
      selectedDate ? selectedDate.toISOString() : undefined
    )
  }, [selectedDate, form])

  const companyOptions = companies.map((company: any) => ({
    label: company.name,
    value: company.id
  }))

  const contactOptions = contacts.map((contact: any) => ({
    label: contact.name,
    value: contact.id
  }))

  const userOptions = users.map((user: any) => ({
    label: `${user.firstname} ${user.lastname}`,
    value: user.id
  }))

  const isSubmitting = createDeal.isPending || updateDeal.isPending
  const fieldLabels = {
    organization: t('deals.form.organizationLabel'),
    stage: t('deals.form.stageLabel')
  }
  const handleFormSubmit = () => {
    const validationMessage = validateSubmitValues(
      dealFormSchema,
      form.state.values,
      fieldLabels,
      t
    )

    if (validationMessage) {
      setSubmitError(validationMessage)
      toast.error(validationMessage)

      return
    }

    setSubmitError(null)
    void form.handleSubmit()
  }

  return (
    <AwesomeDialog
      open={open}
      onOpenChange={onOpenChange}
      container="modal"
      size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleFormSubmit()
        }}
        className="flex flex-col flex-1 overflow-hidden">
        <AwesomeDialogHeader
          title={
            mode === 'create'
              ? t('deals.form.createTitle')
              : t('deals.form.editTitle')
          }
          description={
            mode === 'create'
              ? t('deals.form.createDescription')
              : t('deals.form.editDescription')
          } />

        <AwesomeDialogBody className="space-y-4">
          <FormSubmitAlert
            title={t('common.validationError')}
            message={submitError} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Organization Field */}
            <form.Field name="organization">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.organizationLabel')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Combobox
                    options={companyOptions}
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    placeholder={t('deals.form.organizationPlaceholder')}
                    emptyText={t('deals.form.organizationEmpty')} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Stage Field */}
            <SelectFormField
              required
              field={{
                id: 'stage',
                slug: 'stage',
                name: t('deals.form.stageLabel'),
                type: 'field-status',
                readOnly: false
              }}
              form={form}
              enumOptions={stageOptions.map((opt: any) => ({
                id: opt.value,
                name: opt.label,
                color: opt.color,
                icon: opt.icon
              }))} />

            {/* Deal Value Field */}
            <form.Field name="deal_value">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.dealValueLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value ?? ''}
                    onChange={e => field.handleChange(
                        e.target.value ? Number(e.target.value) : undefined
                      )}
                    placeholder="0.00"
                    step="0.01" />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Expected Revenue Field */}
            <form.Field name="expected_revenue">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.expectedRevenueLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value ?? ''}
                    onChange={e => field.handleChange(
                        e.target.value ? Number(e.target.value) : undefined
                      )}
                    placeholder="0.00"
                    step="0.01" />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Close Probability Field */}
            <form.Field name="close_probability">
              {field => (
                <Field className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.name}>
                      {t('deals.form.closeProbabilityLabel')}:{' '}
                      {field.state.value || 0}%
                    </Label>
                  </div>
                  <Slider
                    value={[field.state.value || 0]}
                    onValueChange={value => field.handleChange(value[0])}
                    max={100}
                    step={5}
                    className="mt-2" />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Expected Closing Date Field */}
            <form.Field name="expected_closing_date">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.expectedClosingDateLabel')}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !selectedDate && 'text-muted-foreground'
                        )}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, 'PPP')
                        ) : (
                          <span>{t('common.pickADate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus />
                    </PopoverContent>
                  </Popover>
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Lead Source Field */}
            <form.Field name="lead_source">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.leadSourceLabel')}
                  </Label>
                  <Combobox
                    options={leadSourceComboboxOptions}
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    placeholder={t('deals.form.leadSourceLabel')}
                    emptyText={t('common.noResults', {
                      defaultValue: 'No results'
                    })} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Customer Type Field */}
            <form.Field name="customer_type">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.customerTypeLabel')}
                  </Label>
                  <Combobox
                    options={customerTypeComboboxOptions}
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    placeholder={t('deals.form.customerTypeLabel')}
                    emptyText={t('common.noResults', {
                      defaultValue: 'No results'
                    })} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Country Field */}
            <form.Field name="country">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.countryLabel')}
                  </Label>
                  <Combobox
                    options={countryOptions}
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    placeholder={t('deals.form.countryLabel')}
                    emptyText={t('common.noResults', {
                      defaultValue: 'No results'
                    })} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Contact Person Field */}
            <form.Field name="contact_person">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.contactPersonLabel')}
                  </Label>
                  <Combobox
                    options={contactOptions}
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    placeholder={t('deals.form.contactPersonPlaceholder')}
                    emptyText={t('deals.form.contactPersonEmpty')} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Record Owner Field */}
            <form.Field name="record_owner">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.recordOwnerLabel')}
                  </Label>
                  <Combobox
                    options={userOptions}
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    placeholder={t('deals.form.recordOwnerPlaceholder')}
                    emptyText={t('deals.form.recordOwnerEmpty')} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Hot Prospect Field */}
            <form.Field name="hot_prospect">
              {field => (
                <Field className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange} />
                    <Label htmlFor={field.name} className="cursor-pointer">
                      {t('deals.form.hotProspectLabel')}
                    </Label>
                  </div>
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>
          </div>
        </AwesomeDialogBody>

        <AwesomeDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            className="cursor-pointer"
            type="submit"
            disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="cursor-pointer mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === 'create'
              ? t('deals.form.createButton')
              : t('deals.form.updateButton')}
          </Button>
        </AwesomeDialogFooter>
      </form>
    </AwesomeDialog>
  )
}
