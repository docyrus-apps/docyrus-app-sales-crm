import { useEffect, useMemo, useState } from 'react'

import type { ProductFormData } from '@/schemas/product-schema'

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogFooter,
  AwesomeDialogHeader
} from '@/components/docyrus/awesome-dialog'
import { FormSubmitAlert } from '@/components/crm/form-submit-alert'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox-simple'
import { productFormSchema } from '@/schemas/product-schema'
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products'
import { useEnumOptions } from '@/hooks/use-enums'
import {
  getSubmitFailureMessage,
  validateSubmitValues
} from '@/lib/form-submit-feedback'

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  mode: 'create' | 'edit';
  onSubmitSuccess?: () => void | Promise<void>;
}

function getRelationValue(value: any): string {
  if (value && typeof value === 'object') return value.id || ''

  return value || ''
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  mode,
  onSubmitSuccess
}: ProductFormDialogProps) {
  const { t } = useTranslation()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const enumOptions = { appSlug: 'base_crm', dataSourceSlug: 'product' }
  const { options: unitOptions = [] } = useEnumOptions('Unit', enumOptions)
  const { options: categoryOptions = [] } = useEnumOptions(
    'category',
    enumOptions
  )
  const initialValues = useMemo<ProductFormData>(
    () => ({
      product_code: product?.product_code || '',
      Unit: getRelationValue(product?.Unit),
      unit_price: product?.unit_price || undefined,
      category: getRelationValue(product?.category),
      tax: product?.tax || undefined
    }),
    [product]
  )
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<ProductFormData>({
    formId: `product-form-${mode}-${product?.id ?? 'new'}`,
    defaultValues: initialValues,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: productFormSchema,
      onSubmit: productFormSchema
    },
    onSubmit: async ({ value }) => {
      try {
        setSubmitError(null)
        // Clean up empty strings (convert to undefined for UUID fields)
        const cleanedData = Object.fromEntries(
          Object.entries(value).map(([key, val]) => [key, val === '' ? undefined : val])
        )

        if (mode === 'create') {
          await createProduct.mutateAsync(cleanedData)
        } else if (product?.id) {
          await updateProduct.mutateAsync({
            productId: product.id,
            data: cleanedData
          })
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
    setSubmitError(null)
  }, [
form,
initialValues,
open,
mode
])

  const isSubmitting = createProduct.isPending || updateProduct.isPending
  const categoryComboboxOptions = categoryOptions.map((option: any) => ({
    label: option.label,
    value: option.value
  }))
  const unitComboboxOptions = unitOptions.map((option: any) => ({
    label: option.label,
    value: option.value
  }))
  const fieldLabels = {
    product_code: t('products.form.productCodeLabel')
  }
  const handleFormSubmit = () => {
    const validationMessage = validateSubmitValues(
      productFormSchema,
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
              ? t('products.form.createTitle')
              : t('products.form.editTitle')
          }
          description={
            mode === 'create'
              ? t('products.form.createDescription')
              : t('products.form.editDescription')
          } />
        <AwesomeDialogBody className="space-y-4">
          <FormSubmitAlert
            title={t('common.validationError')}
            message={submitError} />
          <div className="grid grid-cols-2 gap-4">
            {/* Product Code Field */}
            <form.Field name="product_code">
              {field => (
                <Field className="col-span-2">
                  <Label htmlFor={field.name}>
                    {t('products.form.productCodeLabel')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t('products.form.productCodePlaceholder')} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : (field.state.meta.errors[0] as any)?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Category Field */}
            <form.Field name="category">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('products.form.categoryLabel')}
                  </Label>
                  <Combobox
                    options={categoryComboboxOptions}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    placeholder={t('products.form.categoryPlaceholder')}
                    emptyText={t('common.noResults', {
                      defaultValue: 'No results'
                    })} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : (field.state.meta.errors[0] as any)?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Unit Field */}
            <form.Field name="Unit">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('products.form.unitLabel')}
                  </Label>
                  <Combobox
                    options={unitComboboxOptions}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    placeholder={t('products.form.unitPlaceholder')}
                    emptyText={t('common.noResults', {
                      defaultValue: 'No results'
                    })} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : (field.state.meta.errors[0] as any)?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Unit Price Field */}
            <form.Field name="unit_price">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('products.form.unitPriceLabel')}
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
                        : (field.state.meta.errors[0] as any)?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Tax Field */}
            <form.Field name="tax">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('products.form.taxLabel')}
                  </Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value ?? ''}
                    onChange={e => field.handleChange(
                        e.target.value ? Number(e.target.value) : undefined
                      )}
                    placeholder="0"
                    step="1"
                    min="0"
                    max="100" />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : (field.state.meta.errors[0] as any)?.message ||
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
              ? t('products.form.createButton')
              : t('products.form.updateButton')}
          </Button>
        </AwesomeDialogFooter>
      </form>
    </AwesomeDialog>
  )
}
