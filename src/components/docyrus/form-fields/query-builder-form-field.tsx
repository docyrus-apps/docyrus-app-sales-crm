'use client'

import { useCallback, useMemo } from 'react'

import {
  QueryBuilderDocyrus,
  type RuleGroupType,
  type FullField,
} from '@/components/docyrus/query-builder'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'

import { type DocyrusFormFieldProps, type EnumOption } from './types'

const DEFAULT_QUERY: RuleGroupType = {
  combinator: 'and',
  rules: [],
}

const isRuleGroupType = (value: unknown): value is RuleGroupType =>
  typeof value === 'object' &&
  value !== null &&
  'combinator' in value &&
  'rules' in value &&
  Array.isArray((value as RuleGroupType).rules)

const parseQuery = (value: unknown): RuleGroupType => {
  if (isRuleGroupType(value)) return value

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown

      if (isRuleGroupType(parsed)) return parsed
    } catch {
      /* invalid JSON — fall through */
    }
  }

  return DEFAULT_QUERY
}

const DEFAULT_FIELDS: FullField[] = [
  {
    name: 'field',
    label: 'Field',
    value: 'field',
    inputType: 'text',
  },
]

export function QueryBuilderFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  enumOptions = [],
}: DocyrusFormFieldProps) {
  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => (
        <QueryBuilderInput
          field={field}
          fieldConfig={fieldConfig}
          disabled={disabled}
          className={className}
          enumOptions={enumOptions}
        />
      )}
    />
  )
}

function QueryBuilderInput({
  field,
  fieldConfig,
  disabled,
  className,
  enumOptions,
}: {
  field: any
  fieldConfig: DocyrusFormFieldProps['field']
  disabled?: boolean
  className?: string
  enumOptions: EnumOption[]
}) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isReadOnly = disabled || fieldConfig.readOnly === true

  const query = useMemo(
    () => parseQuery(field.state.value),
    [field.state.value],
  )

  const qbFields = useMemo<FullField[]>(
    () =>
      enumOptions.length > 0
        ? enumOptions.map((opt) => ({
            name: opt.id,
            label: opt.name,
            value: opt.id,
            inputType: 'text',
          }))
        : DEFAULT_FIELDS,
    [enumOptions],
  )

  const handleQueryChange = useCallback(
    (nextQuery: RuleGroupType) => {
      field.handleChange(nextQuery)
      field.handleBlur()
    },
    [field],
  )

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel>{fieldConfig.name}</FieldLabel>
      <QueryBuilderDocyrus
        fields={qbFields}
        query={query}
        onQueryChange={handleQueryChange}
        disabled={isReadOnly}
        variant="bordered"
      />
      <FieldDescription>
        Visual query builder. Define rules and groups to build filter
        expressions.
      </FieldDescription>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
