/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { Loader2 } from 'lucide-react'
import type { ProductFormData } from '@/schemas/product-schema'
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
import { productFormSchema } from '@/schemas/product-schema'
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products'
import { useEnumOptions } from '@/hooks/use-enums'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
  mode: 'create' | 'edit'
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  mode,
}: ProductFormDialogProps) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const { options: unitOptions = [] } = useEnumOptions('Unit')
  const { options: categoryOptions = [] } = useEnumOptions('category')

  const form = useForm<ProductFormData>({
    defaultValues: {
      product_code: product?.product_code || '',
      Unit: product?.Unit || '',
      unit_price: product?.unit_price || undefined,
      category:
        typeof product?.category === 'object'
          ? product.category.id
          : product?.category || '',
      tax: product?.tax || undefined,
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: productFormSchema,
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
        await createProduct.mutateAsync(cleanedData)
      } else if (product?.id) {
        await updateProduct.mutateAsync({ productId: product.id, data: cleanedData })
      }
      onOpenChange(false)
    },
  })

  const isSubmitting = createProduct.isPending || updateProduct.isPending

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {mode === 'create' ? 'Create New Product' : 'Edit Product'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {mode === 'create'
              ? 'Enter the details for the new product'
              : 'Update the product information'}
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
            {/* Product Code Field */}
            <form.Field name="product_code">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>
                    Product Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter product code..."
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Category Field */}
            <form.Field name="category">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Category</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option: any) => (
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

            {/* Unit Field */}
            <form.Field name="Unit">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Unit</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((option: any) => (
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

            {/* Unit Price Field */}
            <form.Field name="unit_price">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Unit Price</Label>
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
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Tax Field */}
            <form.Field name="tax">
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>Tax (%)</Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="0"
                    step="1"
                    min="0"
                    max="100"
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
              {mode === 'create' ? 'Create Product' : 'Update Product'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
