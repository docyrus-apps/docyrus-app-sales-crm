/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useTranslation } from 'react-i18next'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { Loader2 } from 'lucide-react'
import type { CompanyFormData } from '@/schemas/company-schema'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { AwesomeDialog } from '@/components/docyrus/awesome-dialog'
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
  const { t } = useTranslation()
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()
  const { options: industryOptions = [] } = useEnumOptions('industry')
  const { options: statusOptions = [] } = useEnumOptions('status')
  const { options: typeOptions = [] } = useEnumOptions('type')
  const { options: countryOptions = [] } = useEnumOptions('country')

  const form = useForm<CompanyFormData>({
    defaultValues: {
      name: company?.name || '',
      industry:
        company?.industry && typeof company.industry === 'object'
          ? company.industry.id
          : company?.industry || '',
      phone: company?.phone || '',
      email: company?.email || '',
      website: company?.website || '',
      country:
        company?.country && typeof company.country === 'object'
          ? company.country.id
          : company?.country || '',
      city:
        company?.city && typeof company.city === 'object'
          ? company.city.id
          : company?.city || '',
      status:
        company?.status && typeof company.status === 'object'
          ? company.status.id
          : company?.status || '',
      type:
        company?.type && typeof company.type === 'object'
          ? company.type.id
          : company?.type || '',
      address: company?.address || '',
      tax_number: company?.tax_number || '',
      district: company?.district || '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: companyFormSchema,
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
        await createCompany.mutateAsync(cleanedData)
      } else if (company?.id) {
        await updateCompany.mutateAsync({
          companyId: company.id,
          data: cleanedData,
        })
      }
      onOpenChange(false)
    },
  })

  const isSubmitting = createCompany.isPending || updateCompany.isPending

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
              ? t('companies.form.createTitle')
              : t('companies.form.editTitle')
          }
          description={
            mode === 'create'
              ? t('companies.form.createDescription')
              : t('companies.form.editDescription')
          }
        />

        <AwesomeDialogBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name Field */}
            <form.Field name="name">
              {(field) => (
                <Field className="col-span-2">
                  <Label htmlFor={field.name}>
                    {t('companies.form.companyNameLabel')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('companies.form.companyNamePlaceholder')}
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

            {/* Industry Field */}
            <form.Field name="industry">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('companies.form.industryLabel')}
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('companies.form.industryPlaceholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {industryOptions.map((option: any) => (
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

            {/* Type Field */}
            <form.Field name="type">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('companies.form.typeLabel')}
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('companies.form.typePlaceholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option: any) => (
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

            {/* Status Field */}
            <form.Field name="status">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('companies.form.statusLabel')}
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('companies.form.statusPlaceholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option: any) => (
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
                    {t('companies.form.emailLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('companies.form.emailPlaceholder')}
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
                    {t('companies.form.phoneLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('companies.form.phonePlaceholder')}
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
                    {t('companies.form.websiteLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    type="url"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('companies.form.websitePlaceholder')}
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

            {/* Address Field */}
            <form.Field name="address">
              {(field) => (
                <Field className="col-span-2">
                  <Label htmlFor={field.name}>
                    {t('companies.form.addressLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('companies.form.addressPlaceholder')}
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
                    {t('companies.form.countryLabel')}
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('companies.form.countryPlaceholder')}
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

            {/* City Field */}
            <form.Field name="city">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('companies.form.cityLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('companies.form.cityPlaceholder')}
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

            {/* District Field */}
            <form.Field name="district">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('companies.form.districtLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('companies.form.districtPlaceholder')}
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

            {/* Tax Number Field */}
            <form.Field name="tax_number">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('companies.form.taxNumberLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('companies.form.taxNumberPlaceholder')}
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
              ? t('companies.form.createButton')
              : t('companies.form.updateButton')}
          </Button>
        </AwesomeDialogFooter>
      </form>
    </AwesomeDialog>
  )
}
