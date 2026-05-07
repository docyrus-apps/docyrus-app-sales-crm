'use client'

import { useDocyrusFieldComponent } from '@/hooks/use-docyrus-field-component'

import { type DocyrusValueProps } from './types'

/**
 * Dynamic value renderer dispatcher.
 * Renders the correct read-only display component based on the field's type,
 * using the centralized `VALUE_RENDERER_MAP` registry from `useDocyrusFieldComponent`.
 * Falls back to `TextValue` for unknown types.
 */
export function DynamicValue(props: DocyrusValueProps) {
  const Comp = useDocyrusFieldComponent(props.field.type, 'value-renderer')

  return <Comp {...props} />
}
