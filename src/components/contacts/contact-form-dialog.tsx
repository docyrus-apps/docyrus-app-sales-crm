import { useEffect, useMemo } from 'react'

import type { ContactFormData } from '@/schemas/contact-schema'

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/animate-ui/components/buttons/button'
import { AwesomeDialog } from '@/components/docyrus/awesome-dialog'
import { AwesomeDialogHeader } from '@/components/docyrus/awesome-dialog/awesome-dialog-header'
import { AwesomeDialogBody } from '@/components/docyrus/awesome-dialog/awesome-dialog-body'
import { AwesomeDialogFooter } from '@/components/docyrus/awesome-dialog/awesome-dialog-footer'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox-simple'
import { PhoneInput } from '@/components/ui/phone-input'
import { contactFormSchema } from '@/schemas/contact-schema'
import { useCreateContact, useUpdateContact } from '@/hooks/use-contacts'
import { useCompanies } from '@/hooks/use-companies'

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: any;
  mode: 'create' | 'edit';
  onSubmitSuccess?: () => void | Promise<void>;
}

function getRelationValue(value: any): string {
  if (value && typeof value === 'object') return value.id || ''

  return value || ''
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  mode,
  onSubmitSuccess
}: ContactFormDialogProps) {
  const { t } = useTranslation()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const { data: companies = [] } = useCompanies()
  const initialValues = useMemo<ContactFormData>(
    () => ({
      name: contact?.name || '',
      job_title: contact?.job_title || '',
      email: contact?.email || '',
      mobile: contact?.mobile || '',
      organization: getRelationValue(contact?.organization)
    }),
    [contact]
  )

  const form = useForm<ContactFormData>({
    formId: `contact-form-${mode}-${contact?.id ?? 'new'}`,
    defaultValues: initialValues,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: contactFormSchema
    },
    onSubmit: async ({ value }) => {
      // Clean up empty strings (convert to undefined for UUID fields)
      const cleanedData = Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, val === '' ? undefined : val])
      )

      if (mode === 'create') {
        await createContact.mutateAsync(cleanedData)
      } else if (contact?.id) {
        await updateContact.mutateAsync({
          contactId: contact.id,
          data: cleanedData
        })
      }

      await onSubmitSuccess?.()
      onOpenChange(false)
    }
  })

  useEffect(() => {
    if (!open) return
    form.reset(initialValues)
  }, [
form,
initialValues,
open,
mode
])

  const companyOptions = companies.map((company: any) => ({
    label: company.name,
    value: company.id
  }))

  const isSubmitting = createContact.isPending || updateContact.isPending

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
          form.handleSubmit()
        }}
        className="flex flex-col flex-1 overflow-hidden">
        <AwesomeDialogHeader
          title={
            mode === 'create'
              ? t('contacts.form.createTitle')
              : t('contacts.form.editTitle')
          }
          description={
            mode === 'create'
              ? t('contacts.form.createDescription')
              : t('contacts.form.editDescription')
          } />

        <AwesomeDialogBody>
          <div className="space-y-4">
            {/* Name Field */}
            <form.Field name="name">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('contacts.form.nameLabel')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t('contacts.form.namePlaceholder')} />
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

            {/* Job Title Field */}
            <form.Field name="job_title">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('contacts.form.jobTitleLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t('contacts.form.jobTitlePlaceholder')} />
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
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('contacts.form.emailLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    type="email"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t('contacts.form.emailPlaceholder')} />
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

            {/* Mobile Field */}
            <form.Field name="mobile">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('contacts.form.mobileLabel')}
                  </Label>
                  <PhoneInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    placeholder={t('contacts.form.mobilePlaceholder')} />
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

            {/* Organization Field */}
            <form.Field name="organization">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('contacts.form.organizationLabel')}
                  </Label>
                  <Combobox
                    options={companyOptions}
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    placeholder={t('contacts.form.organizationPlaceholder')}
                    emptyText={t('contacts.form.organizationEmpty')} />
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create'
              ? t('contacts.form.createButton')
              : t('contacts.form.updateButton')}
          </Button>
        </AwesomeDialogFooter>
      </form>
    </AwesomeDialog>
  )
}
