'use client'

// @ts-nocheck
/* eslint-disable */
import { type ComponentProps } from 'react'

import { FieldLabel } from '@/components/ui/field'

interface FormFieldLabelProps extends ComponentProps<typeof FieldLabel> {
  required?: boolean
}

export function FormFieldLabel({
  required,
  children,
  ...props
}: FormFieldLabelProps) {
  return (
    <FieldLabel {...props}>
      {children}
      {required && <span className="text-destructive">*</span>}
    </FieldLabel>
  )
}
