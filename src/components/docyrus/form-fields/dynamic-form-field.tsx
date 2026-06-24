'use client'

// @ts-nocheck
/* eslint-disable */
import { createElement } from 'react'

import { useDocyrusFieldComponent } from '@/hooks/docyrus/use-docyrus-field-component'

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

  return createElement(Comp, props)
}
