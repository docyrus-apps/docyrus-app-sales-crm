/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { Loader2 } from 'lucide-react'
import type { CompanyFormData } from '@/schemas/company-schema'
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
import { companyFormSchema } from '@/schemas/company-schema'
import { useCreateCompany, useUpdateCompany } from '@/hooks/use-companies'
import { useEnumOptions } from '@/hooks/use-enums'

interface CompanyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: any
  mode: 'create' | 'edit'
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  mode,
}: CompanyFormDialogProps) {
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()
  const { options: industryOptions = [] } = useEnumOptions('industry')
  const { options: statusOptions = [] } = useEnumOptions('status')
  const { options: typeOptions = [] } = useEnumOptions('type')
  const { options: countryOptions = [] } = useEnumOptions('country')

  const form = useForm<CompanyFormData>({
    defaultValues: {
      name: company?.name || '',
      industry: company?.industry || '',
      phone: company?.phone || '',
      email: company?.email || '',
      website: company?.website || '',
      country:
        typeof company?.country === 'object'
          ? company.country.id
          : company?.country || '',
      city:
        typeof company?.city === 'object'
          ? company.city.id
          : company?.city || '',
      status: company?.status || '',
      type: company?.type || '',
      address: company?.address || '',
      tax_number: company?.tax_number || '',
      district: company?.district || '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: companyFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (mode === 'create') {
        await createCompany.mutateAsync(value)
      } else if (company?.id) {
        await updateCompany.mutateAsync({ companyId: company.id, data: value })
      }
      onOpenChange(false)
    },
  })

  const isSubmitting = createCompany.isPending || updateCompany.isPending

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {mode === 'create' ? 'Create New Company' : 'Edit Company'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {mode === 'create'
              ? 'Enter the details for the new company'
              : 'Update the company information'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Name Field */}
            <form.Field name="name">
              {(field) => (
                <Field className="col-span-2">
                  <Label htmlFor={field.name}>
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter company name..."
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Industry Field */}
            <form.Field name="industry">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Industry</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry..." />
                    </SelectTrigger>
                    <SelectContent>
                      {industryOptions.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Type Field */}
            <form.Field name="type">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Type</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Status Field */}
            <form.Field name="status">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Status</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            {/* Phone Field */}
            <form.Field name="phone">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Phone</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
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
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
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
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
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
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
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
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* District Field */}
            <form.Field name="district">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>District</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter district..."
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Tax Number Field */}
            <form.Field name="tax_number">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Tax Number</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter tax number..."
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
              {mode === 'create' ? 'Create Company' : 'Update Company'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
