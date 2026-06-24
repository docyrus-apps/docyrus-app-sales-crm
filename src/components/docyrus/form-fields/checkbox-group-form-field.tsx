'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { type VariantProps, cva } from 'class-variance-authority'
import { Check } from 'lucide-react'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Field, FieldError } from '@/components/ui/field'
import { cn } from '@/lib/utils'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

const EMPTY_ENUM_OPTIONS: never[] = []

export type CheckboxGroupVariant = VariantProps<typeof checkboxGroupVariants>

export function CheckboxGroupFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  enumOptions = EMPTY_ENUM_OPTIONS,
  variant,
  columnCount = 1,
}: DocyrusFormFieldProps) {
  const layout: 'default' | 'card' = variant === 'card' ? 'card' : 'default'
  const options = useMemo(
    () =>
      enumOptions.map((o) => ({
        value: o.id,
        label: o.name,
        description: o.description,
        icon: o.icon,
        color: o.color,
      })),
    [enumOptions],
  )

  const isReadOnly = disabled || fieldConfig.readOnly === true

  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const selected: Array<string> = Array.isArray(field.state.value)
          ? field.state.value
          : []

        const toggleOption = (optionValue: string) => {
          const next = selected.includes(optionValue)
            ? selected.filter((v) => v !== optionValue)
            : [...selected, optionValue]

          field.handleChange(next)
        }

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <div
              role="group"
              aria-invalid={isInvalid}
              className={cn(
                checkboxGroupVariants({ variant: layout, columnCount }),
              )}
            >
              {options.map((option) => {
                const isChecked = selected.includes(option.value)

                return layout === 'card' ? (
                  <button
                    key={option.value}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    data-state={isChecked ? 'checked' : 'unchecked'}
                    disabled={isReadOnly}
                    onBlur={field.handleBlur}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                      'border-input bg-background hover:bg-accent/50',
                      'data-[state=checked]:border-primary data-[state=checked]:bg-primary/5',
                      'focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    <span
                      className={cn(
                        'relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
                        isChecked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30',
                      )}
                    >
                      {isChecked && <Check className="size-3.5" />}
                    </span>
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      {option.icon ? (
                        <span
                          className="mt-0.5 shrink-0"
                          style={
                            option.color ? { color: option.color } : undefined
                          }
                        >
                          <DocyrusIcon icon={option.icon} className="size-4" />
                        </span>
                      ) : option.color ? (
                        <span
                          className="mt-1 size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium leading-5">
                          {option.label}
                        </span>
                        {option.description && (
                          <p className="text-muted-foreground mt-0.5 text-xs leading-4">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ) : (
                  <button
                    key={option.value}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    data-state={isChecked ? 'checked' : 'unchecked'}
                    disabled={isReadOnly}
                    onBlur={field.handleBlur}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 text-left',
                      'focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    <span
                      className={cn(
                        'relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
                        isChecked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input',
                      )}
                    >
                      {isChecked && <Check className="size-3" />}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {option.icon ? (
                        <span
                          className="shrink-0"
                          style={
                            option.color ? { color: option.color } : undefined
                          }
                        >
                          <DocyrusIcon icon={option.icon} className="size-4" />
                        </span>
                      ) : option.color ? (
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                      ) : null}
                      <span className="text-sm font-normal leading-5">
                        {option.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}

export const checkboxGroupVariants = cva('w-full grid', {
  variants: {
    variant: {
      default: 'gap-3',
      card: 'gap-2',
    },
    columnCount: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    },
  },
  defaultVariants: {
    variant: 'default',
    columnCount: 1,
  },
})
