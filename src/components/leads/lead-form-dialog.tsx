/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { Loader2 } from 'lucide-react'
import type { LeadFormData } from '@/schemas/lead-schema'
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
        typeof lead?.company_name === 'object'
          ? lead.company_name.id
          : lead?.company_name || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      website: lead?.website || '',
      address: lead?.address || '',
      city: lead?.city || '',
      state: lead?.state || '',
      lead_source: lead?.lead_source || '',
      lead_status: lead?.lead_status || '',
      lead_type: lead?.lead_type || '',
      country: lead?.country || '',
      record_owner: lead?.record_owner || '',
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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {mode === 'create' ? 'Create New Lead' : 'Edit Lead'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {mode === 'create'
              ? 'Enter the details for the new lead'
              : 'Update the lead information'}
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
            <div className="grid grid-cols-2 gap-4">
              {/* Title Field */}
              <form.Field name="title">
                {(field) => (
                  <Field className="col-span-2">
                    <Label htmlFor={field.name}>
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter lead title..."
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Company Field */}
              <form.Field name="company_name">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Company</Label>
                    <Combobox
                      options={companyOptions}
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                      placeholder="Select company..."
                      emptyText="No company found"
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Lead Status Field */}
              <form.Field name="lead_status">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Lead Status</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
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
                            'Validation error'}
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
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Phone Field */}
              <form.Field name="phone">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Phone</Label>
                    <PhoneInput
                      value={field.state.value}
                      onChange={field.handleChange}
                      placeholder="Enter phone number..."
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Website Field */}
              <form.Field name="website">
                {(field) => (
                  <Field className="col-span-2">
                    <Label htmlFor={field.name}>Website</Label>
                    <Input
                      id={field.name}
                      type="url"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://example.com"
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Lead Source Field */}
              <form.Field name="lead_source">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Lead Source</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source..." />
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
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Lead Type Field */}
              <form.Field name="lead_type">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Lead Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
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
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Address Field */}
              <form.Field name="address">
                {(field) => (
                  <Field className="col-span-2">
                    <Label htmlFor={field.name}>Address</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter address..."
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* City Field */}
              <form.Field name="city">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>City</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter city..."
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* State Field */}
              <form.Field name="state">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>State</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter state..."
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Country Field */}
              <form.Field name="country">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Country</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country..." />
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
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Record Owner Field */}
              <form.Field name="record_owner">
                {(field) => (
                  <Field className="col-span-2">
                    <Label htmlFor={field.name}>Record Owner</Label>
                    <Combobox
                      options={userOptions}
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                      placeholder="Select record owner..."
                      emptyText="No user found"
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Contact Message Field */}
              <form.Field name="contact_message">
                {(field) => (
                  <Field className="col-span-2">
                    <Label htmlFor={field.name}>Message</Label>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter any notes or message..."
                      rows={4}
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>
            </div>
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
              {mode === 'create' ? 'Create Lead' : 'Update Lead'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
