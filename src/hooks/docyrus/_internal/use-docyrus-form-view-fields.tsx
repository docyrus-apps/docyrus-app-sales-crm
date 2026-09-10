'use client'

// @ts-nocheck
/* eslint-disable */
import {
  createElement,
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field'
import { cn } from '@/lib/utils'

import { useDocyrusFieldComponent } from '@/hooks/docyrus/use-docyrus-field-component'

import {
  type DocyrusFormViewField,
  type LocalFormShape,
} from '../use-docyrus-form-view'

interface MacroFormFieldProps {
  slug: string
  valuesRef: RefObject<Record<string, unknown>>
  resetSignal: number
  onFieldChange: RefObject<(slug: string, value: unknown) => void>
  validationErrors: RefObject<Map<string, string>>
  valuesVersion: number
  children: (field: any) => ReactNode
}

export function MacroFormField({
  slug,
  valuesRef,
  resetSignal,
  onFieldChange,
  validationErrors,
  valuesVersion,
  children,
}: MacroFormFieldProps) {
  const [localValue, setLocalValue] = useState<unknown>(
    () => valuesRef.current[slug],
  )
  const [touched, setTouched] = useState(false)
  const lastResetRef = useRef(resetSignal)

  if (lastResetRef.current !== resetSignal) {
    lastResetRef.current = resetSignal
    setLocalValue(valuesRef.current[slug])
    setTouched(false)
  }

  const handleChange = useCallback(
    (value: unknown) => {
      setLocalValue(value)
      setTouched(true)
      valuesRef.current[slug] = value
      onFieldChange.current(slug, value)
    },
    [onFieldChange, slug, valuesRef],
  )

  const handleBlur = useCallback(() => {
    setTouched(true)
  }, [])

  void valuesVersion
  const error = validationErrors.current.get(slug)
  const hasError = error != null

  return (
    <>
      {children({
        name: slug,
        state: {
          value: localValue,
          meta: {
            isTouched: touched || hasError,
            isValid: !hasError,
            errors: hasError ? [{ message: error }] : [],
          },
        },
        handleChange,
        handleBlur,
      })}
    </>
  )
}

interface DocyrusFormViewMappedFormFieldProps {
  resolvedField: DocyrusFormViewField
  form: LocalFormShape
  appSlug: string
  dataSourceSlug: string
  className?: string
}

export function DocyrusFormViewMappedFormField({
  resolvedField,
  form,
  appSlug,
  dataSourceSlug,
  className,
}: DocyrusFormViewMappedFormFieldProps) {
  const Component = useDocyrusFieldComponent(
    resolvedField.field.type,
    'form-field',
  )

  if (!Component) {
    return null
  }

  /*
   * When computedLabel (or fieldLayout.label) is a plain string, override field.name
   * so every field component (which reads the label from field.name) shows the dynamic value.
   */
  const field =
    typeof resolvedField.label === 'string'
      ? { ...resolvedField.field, name: resolvedField.label }
      : resolvedField.field

  const fieldNode = createElement(Component, {
    ...resolvedField.fieldProps,
    field,
    form,
    disabled: resolvedField.disabled,
    required: resolvedField.required,
    enumOptions: resolvedField.enumOptions,
    appSlug,
    dataSourceSlug,
    className: cn(
      resolvedField.className,
      resolvedField.fieldProps?.className,
      className,
    ),
  })

  if (!resolvedField.description) {
    return fieldNode
  }

  return (
    <>
      {fieldNode}
      <FieldDescription>{resolvedField.description}</FieldDescription>
    </>
  )
}

interface DocyrusFormViewMappedValueFieldProps {
  resolvedField: DocyrusFormViewField
  values: Record<string, unknown>
  wrapperClassName?: string
  className?: string
  label?: ReactNode
  description?: ReactNode
}

export function DocyrusFormViewMappedValueField({
  resolvedField,
  values,
  wrapperClassName,
  className,
  label,
  description,
}: DocyrusFormViewMappedValueFieldProps) {
  const Component = useDocyrusFieldComponent(
    resolvedField.field.type,
    'value-renderer',
  )

  return (
    <Field className={cn(wrapperClassName, resolvedField.className)}>
      <FieldLabel>
        {label ?? resolvedField.label ?? resolvedField.field.name}
        {resolvedField.required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <FieldContent>
        <div className="min-h-9 rounded-md border bg-muted/20 px-3 py-2">
          {createElement(Component, {
            ...resolvedField.valueProps,
            field: resolvedField.field,
            value: values[resolvedField.slug],
            record: values,
            enumOptions: resolvedField.enumOptions,
            className: cn(resolvedField.valueProps?.className, className),
          })}
        </div>
        {(description ?? resolvedField.description) && (
          <FieldDescription>
            {description ?? resolvedField.description}
          </FieldDescription>
        )}
      </FieldContent>
    </Field>
  )
}
