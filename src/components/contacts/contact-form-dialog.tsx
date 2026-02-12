/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { Loader2 } from 'lucide-react'
import type { ContactFormData } from '@/schemas/contact-schema'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { PhoneInput } from '@/components/ui/phone-input'
import { contactFormSchema } from '@/schemas/contact-schema'
import { useCreateContact, useUpdateContact } from '@/hooks/use-contacts'
import { useCompanies } from '@/hooks/use-companies'

interface ContactFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: any
  mode: 'create' | 'edit'
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  mode,
}: ContactFormDialogProps) {
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const { data: companies = [] } = useCompanies()

  const form = useForm<ContactFormData>({
    defaultValues: {
      name: contact?.name || '',
      job_title: contact?.job_title || '',
      email: contact?.email || '',
      mobile: contact?.mobile || '',
      organization:
        typeof contact?.organization === 'object'
          ? contact.organization.id
          : contact?.organization || '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: contactFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (mode === 'create') {
        await createContact.mutateAsync(value)
      } else if (contact?.id) {
        await updateContact.mutateAsync({ contactId: contact.id, data: value })
      }
      onOpenChange(false)
    },
  })

  const companyOptions = companies.map((company: any) => ({
    label: company.name,
    value: company.id,
  }))

  const isSubmitting = createContact.isPending || updateContact.isPending

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {mode === 'create' ? 'Create New Contact' : 'Edit Contact'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {mode === 'create'
              ? 'Enter the details for the new contact'
              : 'Update the contact information'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {/* Name Field */}
            <form.Field name="name">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter contact name..."
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Job Title Field */}
            <form.Field name="job_title">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Job Title</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter job title..."
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Email Field */}
            <form.Field name="email">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="email@example.com"
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Mobile Field */}
            <form.Field name="mobile">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Mobile</Label>
                  <PhoneInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    placeholder="Enter phone number..."
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Organization Field */}
            <form.Field name="organization">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Organization</Label>
                  <Combobox
                    options={companyOptions}
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    placeholder="Select organization..."
                    emptyText="No organization found"
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === 'create' ? 'Create Contact' : 'Update Contact'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
