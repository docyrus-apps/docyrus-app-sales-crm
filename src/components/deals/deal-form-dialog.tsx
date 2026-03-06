/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { useTranslation } from 'react-i18next'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { DealFormData } from '@/schemas/deal-schema'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { AwesomeDialog } from '@/components/docyrus/awesome-dialog'
import { AwesomeDialogHeader } from '@/components/docyrus/awesome-dialog/awesome-dialog-header'
import { AwesomeDialogBody } from '@/components/docyrus/awesome-dialog/awesome-dialog-body'
import { AwesomeDialogFooter } from '@/components/docyrus/awesome-dialog/awesome-dialog-footer'
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
  PopoverTrigger,
} from '@/components/ui/popover'
import { dealFormSchema } from '@/schemas/deal-schema'
import { useCreateDeal, useUpdateDeal } from '@/hooks/use-deals'
import { useCompanies } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import { useUsers } from '@/hooks/use-users'
import { useEnumOptions } from '@/hooks/use-enums'
import { cn } from '@/lib/utils'

interface DealFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deal?: any
  mode: 'create' | 'edit'
}

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  mode,
}: DealFormDialogProps) {
  const { t } = useTranslation()
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()
  const { data: companies = [] } = useCompanies()
  const { data: contacts = [] } = useContacts()
  const { data: users = [] } = useUsers()
  const { options: stageOptions = [] } = useEnumOptions('stage')
  const { options: leadSourceOptions = [] } = useEnumOptions('lead_source')
  const { options: customerTypeOptions = [] } = useEnumOptions('customer_type')
  const { options: countryOptions = [] } = useEnumOptions('country')

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    deal?.expected_closing_date
      ? new Date(deal.expected_closing_date)
      : undefined,
  )

  const form = useForm<DealFormData>({
    defaultValues: {
      organization:
        deal?.organization && typeof deal.organization === 'object'
          ? deal.organization.id
          : deal?.organization || '',
      contact_person:
        deal?.contact_person && typeof deal.contact_person === 'object'
          ? deal.contact_person.id
          : deal?.contact_person || '',
      stage:
        deal?.stage && typeof deal.stage === 'object'
          ? deal.stage.id
          : deal?.stage || '',
      deal_value: deal?.deal_value || undefined,
      expected_revenue: deal?.expected_revenue || undefined,
      close_probability: deal?.close_probability || undefined,
      expected_closing_date: deal?.expected_closing_date || undefined,
      lead_source:
        deal?.lead_source && typeof deal.lead_source === 'object'
          ? deal.lead_source.id
          : deal?.lead_source || '',
      customer_type:
        deal?.customer_type && typeof deal.customer_type === 'object'
          ? deal.customer_type.id
          : deal?.customer_type || '',
      country:
        deal?.country && typeof deal.country === 'object'
          ? deal.country.id
          : deal?.country || '',
      hot_prospect: deal?.hot_prospect || false,
      record_owner:
        deal?.record_owner && typeof deal.record_owner === 'object'
          ? deal.record_owner.id
          : deal?.record_owner || '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: dealFormSchema,
    },
    onSubmit: async ({ value }) => {
      // Clean up empty strings (convert to undefined for UUID fields)
      const cleanedData = Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
          key,
          val === '' ? undefined : val,
        ]),
      )

      if (mode === 'create') {
        await createDeal.mutateAsync(cleanedData)
      } else if (deal?.id) {
        await updateDeal.mutateAsync({ dealId: deal.id, data: cleanedData })
      }
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (selectedDate) {
      form.setFieldValue('expected_closing_date', selectedDate.toISOString())
    }
  }, [selectedDate, form])

  const companyOptions = companies.map((company: any) => ({
    label: company.name,
    value: company.id,
  }))

  const contactOptions = contacts.map((contact: any) => ({
    label: contact.name,
    value: contact.id,
  }))

  const userOptions = users.map((user: any) => ({
    label: `${user.firstname} ${user.lastname}`,
    value: user.id,
  }))

  const isSubmitting = createDeal.isPending || updateDeal.isPending

  return (
    <AwesomeDialog
      open={open}
      onOpenChange={onOpenChange}
      container="modal"
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="flex flex-col flex-1 overflow-hidden"
      >
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
          }
        />

        <AwesomeDialogBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Organization Field */}
            <form.Field name="organization">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.organizationLabel')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Combobox
                    options={companyOptions}
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    placeholder={t('deals.form.organizationPlaceholder')}
                    emptyText={t('deals.form.organizationEmpty')}
                  />
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
              field={{
                slug: 'stage',
                name: t('deals.form.stageLabel'),
                readOnly: false,
              }}
              form={form}
              enumOptions={stageOptions.map((opt: any) => ({
                id: opt.value,
                name: opt.label,
                color: opt.color,
                icon: opt.icon,
              }))}
            />

            {/* Deal Value Field */}
            <form.Field name="deal_value">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.dealValueLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="0.00"
                    step="0.01"
                  />
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
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.expectedRevenueLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="0.00"
                    step="0.01"
                  />
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
              {(field) => (
                <Field className="col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.name}>
                      {t('deals.form.closeProbabilityLabel')}:{' '}
                      {field.state.value || 0}%
                    </Label>
                  </div>
                  <Slider
                    value={[field.state.value || 0]}
                    onValueChange={(value) => field.handleChange(value[0])}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
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
              {(field) => (
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
                          !selectedDate && 'text-muted-foreground',
                        )}
                      >
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
                        initialFocus
                      />
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
            <SelectFormField
              field={{
                slug: 'lead_source',
                name: t('deals.form.leadSourceLabel'),
                readOnly: false,
              }}
              form={form}
              enumOptions={leadSourceOptions.map((opt: any) => ({
                id: opt.value,
                name: opt.label,
                color: opt.color,
                icon: opt.icon,
              }))}
            />

            {/* Customer Type Field */}
            <SelectFormField
              field={{
                slug: 'customer_type',
                name: t('deals.form.customerTypeLabel'),
                readOnly: false,
              }}
              form={form}
              enumOptions={customerTypeOptions.map((opt: any) => ({
                id: opt.value,
                name: opt.label,
                color: opt.color,
                icon: opt.icon,
              }))}
            />

            {/* Country Field */}
            <SelectFormField
              field={{
                slug: 'country',
                name: t('deals.form.countryLabel'),
                readOnly: false,
              }}
              form={form}
              enumOptions={countryOptions.map((opt: any) => ({
                id: opt.value,
                name: opt.label,
                color: opt.color,
                icon: opt.icon,
              }))}
            />

            {/* Contact Person Field */}
            <form.Field name="contact_person">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.contactPersonLabel')}
                  </Label>
                  <Combobox
                    options={contactOptions}
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    placeholder={t('deals.form.contactPersonPlaceholder')}
                    emptyText={t('deals.form.contactPersonEmpty')}
                  />
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
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('deals.form.recordOwnerLabel')}
                  </Label>
                  <Combobox
                    options={userOptions}
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    placeholder={t('deals.form.recordOwnerPlaceholder')}
                    emptyText={t('deals.form.recordOwnerEmpty')}
                  />
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
              {(field) => (
                <Field className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
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
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className="cursor-pointer"
            type="submit"
            disabled={isSubmitting}
          >
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
