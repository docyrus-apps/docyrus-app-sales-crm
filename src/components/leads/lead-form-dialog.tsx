/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import type { LeadFormData } from '@/schemas/lead-schema'
import { Button } from '@/components/ui/button'
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
import { useCompanies } from '@/hooks/use-companies'
import { useUsers } from '@/hooks/use-users'
import { useEnumOptions } from '@/hooks/use-enums'

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: any
  mode: 'create' | 'edit'
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  mode,
}: LeadFormDialogProps) {
  const { t } = useTranslation()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()
  const { data: companies = [] } = useCompanies()
  const { data: users = [] } = useUsers()
  const { options: leadStatusOptions = [] } = useEnumOptions('lead_status')
  const { options: leadSourceOptions = [] } = useEnumOptions('lead_source')
  const { options: leadTypeOptions = [] } = useEnumOptions('lead_type')
  const { options: countryOptions = [] } = useEnumOptions('country')

  const form = useForm<LeadFormData>({
    defaultValues: {
      title: lead?.title || '',
      company_name:
        lead?.company_name && typeof lead.company_name === 'object'
          ? lead.company_name.id
          : lead?.company_name || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      website: lead?.website || '',
      address: lead?.address || '',
      city:
        lead?.city && typeof lead.city === 'object'
          ? lead.city.id
          : lead?.city || '',
      state:
        lead?.state && typeof lead.state === 'object'
          ? lead.state.id
          : lead?.state || '',
      lead_source:
        lead?.lead_source && typeof lead.lead_source === 'object'
          ? lead.lead_source.id
          : lead?.lead_source || '',
      lead_status:
        lead?.lead_status && typeof lead.lead_status === 'object'
          ? lead.lead_status.id
          : lead?.lead_status || '',
      lead_type:
        lead?.lead_type && typeof lead.lead_type === 'object'
          ? lead.lead_type.id
          : lead?.lead_type || '',
      country:
        lead?.country && typeof lead.country === 'object'
          ? lead.country.id
          : lead?.country || '',
      record_owner:
        lead?.record_owner && typeof lead.record_owner === 'object'
          ? lead.record_owner.id
          : lead?.record_owner || '',
      contact_message: lead?.contact_message || '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: leadFormSchema,
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
        await createLead.mutateAsync(cleanedData)
      } else if (lead?.id) {
        await updateLead.mutateAsync({ leadId: lead.id, data: cleanedData })
      }
      onOpenChange(false)
    },
  })

  const companyOptions = companies.map((company: any) => ({
    label: company.name,
    value: company.id,
  }))

  const userOptions = users.map((user: any) => ({
    label: `${user.firstname} ${user.lastname}`,
    value: user.id,
  }))

  const isSubmitting = createLead.isPending || updateLead.isPending

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
          mode === 'create'
            ? t('leads.form.createDescription')
            : t('leads.form.editDescription')
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <AwesomeDialogBody>
          <div className="grid grid-cols-2 gap-4">
            {/* Title Field */}
            <form.Field name="title">
              {(field) => (
                <Field className="col-span-2">
                  <Label htmlFor={field.name}>
                    {t('leads.form.titleLabel')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('leads.form.titlePlaceholder')}
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

            {/* Company Field */}
            <form.Field name="company_name">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('leads.form.companyLabel')}
                  </Label>
                  <Combobox
                    options={companyOptions}
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    placeholder={t('leads.form.companyPlaceholder')}
                    emptyText={t('leads.form.companyEmpty')}
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

            {/* Lead Status Field */}
            <form.Field name="lead_status">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('leads.form.leadStatusLabel')}
                  </Label>
                  <Select
                    value={field.state.value}
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

            {/* Email Field */}
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
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('leads.form.emailPlaceholder')}
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

            {/* Phone Field */}
            <form.Field name="phone">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('leads.form.phoneLabel')}
                  </Label>
                  <PhoneInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    placeholder={t('leads.form.phonePlaceholder')}
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

            {/* Website Field */}
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
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('leads.form.websitePlaceholder')}
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

            {/* Lead Source Field */}
            <form.Field name="lead_source">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('leads.form.leadSourceLabel')}
                  </Label>
                  <Select
                    value={field.state.value}
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

            {/* Lead Type Field */}
            <form.Field name="lead_type">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('leads.form.leadTypeLabel')}
                  </Label>
                  <Select
                    value={field.state.value}
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

            {/* Address Field */}
            <form.Field name="address">
              {(field) => (
                <Field className="col-span-2">
                  <Label htmlFor={field.name}>
                    {t('leads.form.addressLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('leads.form.addressPlaceholder')}
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

            {/* City Field */}
            <form.Field name="city">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('leads.form.cityLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('leads.form.cityPlaceholder')}
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

            {/* State Field */}
            <form.Field name="state">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('leads.form.stateLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('leads.form.statePlaceholder')}
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

            {/* Country Field */}
            <form.Field name="country">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('leads.form.countryLabel')}
                  </Label>
                  <Select
                    value={field.state.value}
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
                <Field className="col-span-2">
                  <Label htmlFor={field.name}>
                    {t('leads.form.recordOwnerLabel')}
                  </Label>
                  <Combobox
                    options={userOptions}
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    placeholder={t('leads.form.recordOwnerPlaceholder')}
                    emptyText={t('leads.form.recordOwnerEmpty')}
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

            {/* Contact Message Field */}
            <form.Field name="contact_message">
              {(field) => (
                <Field className="col-span-2">
                  <Label htmlFor={field.name}>
                    {t('leads.form.messageLabel')}
                  </Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('leads.form.messagePlaceholder')}
                    rows={4}
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create'
              ? t('leads.form.createButton')
              : t('leads.form.updateButton')}
          </Button>
        </AwesomeDialogFooter>
      </form>
    </AwesomeDialog>
  )
}
