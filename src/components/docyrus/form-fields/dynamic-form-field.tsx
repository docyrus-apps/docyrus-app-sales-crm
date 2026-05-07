'use client'

import { useDocyrusFieldComponent } from '@/hooks/use-docyrus-field-component'

import { type DocyrusFormFieldProps } from './types'

/**
 * Dynamic form field dispatcher.
 * Renders the correct form field component based on the field's type, using
 * the centralized `FORM_FIELD_MAP` registry from `useDocyrusFieldComponent`.
 */
export function DynamicFormField(props: DocyrusFormFieldProps) {
  const Comp = useDocyrusFieldComponent(props.field.type, 'form-field')

  if (!Comp) {
    return null
  }

  return <Comp {...props} />
}
