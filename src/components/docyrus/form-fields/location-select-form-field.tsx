'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { type DocyrusFormFieldProps } from './types'

export function LocationSelectFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
}: DocyrusFormFieldProps) {
  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const value =
          (field.state.value as {
            latitude?: number | null
            longitude?: number | null
            address?: string | null
          } | null) ?? {}

        const updateValue = (updates: Record<string, unknown>) => {
          field.handleChange({ ...value, ...updates })
        }

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel>{fieldConfig.name}</FieldLabel>
            <div className="flex flex-col gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Address</Label>
                <Input
                  value={value.address ?? ''}
                  onChange={(e) => updateValue({ address: e.target.value })}
                  onBlur={field.handleBlur}
                  disabled={disabled || fieldConfig.readOnly === true}
                  placeholder="Address"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={value.latitude ?? ''}
                    onChange={(e) =>
                      updateValue({
                        latitude:
                          e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    onBlur={field.handleBlur}
                    disabled={disabled || fieldConfig.readOnly === true}
                    placeholder="Latitude"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">
                    Longitude
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={value.longitude ?? ''}
                    onChange={(e) =>
                      updateValue({
                        longitude:
                          e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    onBlur={field.handleBlur}
                    disabled={disabled || fieldConfig.readOnly === true}
                    placeholder="Longitude"
                  />
                </div>
              </div>
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}
