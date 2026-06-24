'use client'

// @ts-nocheck
/* eslint-disable */
import { useState, useCallback, useMemo, type ReactNode } from 'react'

import { ChevronsUpDown } from 'lucide-react'

import {
  HANDLEBARS_SAMPLES,
  HandlebarsEditor,
  type IHandlebarsAiAssistantRenderContext,
} from '@/components/docyrus/handlebars-editor'
import {
  JSONATA_SAMPLES,
  JsonataEditor,
  type IJsonataAiAssistantRenderContext,
} from '@/components/docyrus/jsonata-editor'
import { type ContextPath } from '@/lib/docyrus/context-paths'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Field, FieldError } from '@/components/ui/field'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import { type IField } from './types'

import { FormFieldLabel } from './form-field-label'

/*
 * ---------------------------------------------------------------------------
 * Public types
 * ---------------------------------------------------------------------------
 */

export interface AvailableField {
  /** Slug / identifier used in the encoded value */
  name: string
  /** Human-readable label shown in dropdowns */
  label: string
  type: string
  icon?: string
}

/**
 * Recursive schema node. Drives both the Field Mapping tree-select and the
 * autocomplete variables surfaced inside the Template (Handlebars) and
 * Formula (JSONata) editors.
 */
export interface FieldMappingSchema {
  /** Local slug — concatenated with the parent's path via `.` to form a dotted path. */
  name: string
  /** Human-readable label shown in the tree. */
  label: string
  /** Field type (e.g. `'string'`, `'object'`, `'array'`, ...). */
  type: string
  /** Optional icon string rendered next to the label. */
  icon?: string
  /** Optional description. */
  description?: string
  /** Nested fields for object / array types. Omit or leave empty for leaves. */
  fields?: FieldMappingSchema[]
}

/**
 * Persisted shape produced by `FieldMappingFormField`. The `type` field
 * distinguishes the resolver strategy at evaluation time:
 *
 * - `static`   — `value` is the raw value the user typed in the Fixed Value tab
 * - `template` — `value` is a Handlebars template string
 * - `formula`  — `value` is a JSONata expression; the Field Mapping tab is a
 *                UI variant that only writes single-path expressions
 */
export type FieldMappingValue =
  | { type: 'static'; value: unknown }
  | { type: 'template'; value: string }
  | { type: 'formula'; value: string }

export interface FieldMappingFormFieldProps {
  field: IField
  form: any
  disabled?: boolean
  required?: boolean
  className?: string
  /**
   * Recursive schema describing the available fields. Drives the Field
   * Mapping tree-select and the autocomplete variables in both Template
   * (Handlebars) and Formula (JSONata) editors.
   */
  schema?: FieldMappingSchema[]
  /**
   * Flat list of selectable fields — used as a fallback schema when `schema`
   * is not provided. Each entry becomes a top-level leaf node.
   */
  availableFields?: AvailableField[]
  /**
   * Which tabs are shown. Defaults to all four.
   * The first enabled tab is used as the fallback when the current value
   * doesn't match any of the enabled modes.
   */
  modes?: MappingTab[]
  /**
   * Mount a custom AI agent (e.g. `DocyrusAgent`) inside the **Template**
   * (Handlebars) editor's assistant drawer. Forwarded verbatim to
   * `HandlebarsEditor.renderAiAssistant` — the toolbar agent button only
   * appears when this is supplied. The context carries the live `template`
   * and sample `input` strings.
   *
   * Independent from {@link renderFormulaAgent} so both editors can host an
   * agent simultaneously (e.g. in the tabbed view).
   */
  renderTemplateAgent?: (ctx: IHandlebarsAiAssistantRenderContext) => ReactNode
  /**
   * Mount a custom AI agent (e.g. `DocyrusAgent`) inside the **Formula**
   * (JSONata) editor's assistant drawer. Forwarded verbatim to
   * `JsonataEditor.renderAiAssistant`. The context carries the live
   * `expression` and sample `input` strings.
   *
   * Independent from {@link renderTemplateAgent} so both editors can host an
   * agent simultaneously.
   */
  renderFormulaAgent?: (ctx: IJsonataAiAssistantRenderContext) => ReactNode
  /**
   * Render function for the Fixed Value tab. Receives an adapter form whose
   * `Field` subscription transparently unwraps and re-wraps the inner static
   * value around the persisted `{ type: 'static', value }` envelope, so the
   * wrapped child can be authored as if it owned the slug directly.
   *
   * ```tsx
   * <FieldMappingFormField field={...} form={form} schema={...}>
   *   {(adapted) => <TextFormField field={field} form={adapted} />}
   * </FieldMappingFormField>
   * ```
   */
  children: (adaptedForm: any) => ReactNode
}

export type MappingTab = 'fixed' | 'field-mapping' | 'template' | 'formula'

/*
 * ---------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------
 */

const EMPTY_ARRAY: never[] = []

function isMappingValue(value: unknown): value is FieldMappingValue {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { type?: unknown }

  return (
    candidate.type === 'static' ||
    candidate.type === 'template' ||
    candidate.type === 'formula'
  )
}

function detectTab(value: unknown, schemaPaths: Set<string>): MappingTab {
  if (!isMappingValue(value)) return 'fixed'

  if (value.type === 'template') return 'template'
  if (value.type === 'formula') {
    if (typeof value.value === 'string' && schemaPaths.has(value.value))
      return 'field-mapping'

    return 'formula'
  }

  return 'fixed'
}

function tabToInitialValue(tab: MappingTab): FieldMappingValue {
  if (tab === 'template') return { type: 'template', value: '' }
  if (tab === 'formula' || tab === 'field-mapping')
    return { type: 'formula', value: '' }

  return { type: 'static', value: null }
}

function logicalType(tab: MappingTab): 'static' | 'template' | 'formula' {
  if (tab === 'template') return 'template'
  if (tab === 'formula' || tab === 'field-mapping') return 'formula'

  return 'static'
}

function availableFieldsToSchema(
  fields: AvailableField[],
): FieldMappingSchema[] {
  return fields.map((f) => ({
    name: f.name,
    label: f.label,
    type: f.type,
    icon: f.icon,
  }))
}

/**
 * Build a nested JSON sample from a schema, used as preview `defaultInput`
 * for the Handlebars and JSONata editors. Leaf fields become `'<Label>'`
 * placeholders, arrays become a single-element array of their child shape.
 */
export function schemaToSampleData(
  schema: FieldMappingSchema[],
): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  for (const node of schema) data[node.name] = nodeToSample(node)

  return data
}

function nodeToSample(node: FieldMappingSchema): unknown {
  const children = node.fields

  if (!children || children.length === 0) return `<${node.label}>`

  const childData: Record<string, unknown> = {}

  for (const child of children) childData[child.name] = nodeToSample(child)

  return node.type === 'array' ? [childData] : childData
}

/**
 * Walk the schema and return every dotted path it describes. Includes parent
 * paths so editors can autocomplete to either a leaf or an intermediate
 * object/array.
 */
export function flattenSchemaPaths(
  schema: FieldMappingSchema[],
  prefix = '',
  out: string[] = [],
): string[] {
  for (const node of schema) {
    const path = prefix ? `${prefix}.${node.name}` : node.name

    out.push(path)

    if (node.fields && node.fields.length > 0)
      flattenSchemaPaths(node.fields, path, out)
  }

  return out
}

/**
 * Like {@link flattenSchemaPaths} but returns rich {@link ContextPath}
 * descriptors carrying each field's `type`, `label`, and `description` so the
 * Handlebars / JSONata editors surface them in the autocomplete dropdown and
 * variable picker.
 */
export function flattenSchemaContextPaths(
  schema: FieldMappingSchema[],
  prefix = '',
  out: ContextPath[] = [],
): ContextPath[] {
  for (const node of schema) {
    const path = prefix ? `${prefix}.${node.name}` : node.name

    out.push({
      path,
      type: node.type,
      label: node.label,
      description: node.description,
    })

    if (node.fields && node.fields.length > 0)
      flattenSchemaContextPaths(node.fields, path, out)
  }

  return out
}

/*
 * ---------------------------------------------------------------------------
 * Adapted form for the Fixed Value tab
 * ---------------------------------------------------------------------------
 *
 * The wrapped child expects to read / write the raw inner value at the
 * field's slug, but the persisted form value is the `FieldMappingValue`
 * envelope. The adapter intercepts `form.Field` (and `getFieldValue` /
 * `setFieldValue`) for the wrapper's slug only, transparently unwrapping
 * `{ type: 'static', value: X }` into `X` and wrapping writes back.
 */

function makeStaticAdaptedForm(realForm: any, slug: string): any {
  const RealField = realForm.Field

  function AdaptedField({
    name,
    children,
  }: {
    name: string
    children: (field: any) => ReactNode
  }) {
    if (name !== slug) {
      return <RealField name={name}>{children}</RealField>
    }

    return (
      <RealField name={name}>
        {(field: any) => {
          const wrapped = field.state.value
          const innerValue = isMappingValue(wrapped)
            ? wrapped.type === 'static'
              ? wrapped.value
              : null
            : wrapped

          const adaptedField = {
            ...field,
            state: { ...field.state, value: innerValue },
            handleChange: (next: unknown) =>
              field.handleChange({ type: 'static', value: next }),
          }

          return children(adaptedField)
        }}
      </RealField>
    )
  }

  return new Proxy(realForm, {
    get(target, prop, receiver) {
      if (prop === 'Field') return AdaptedField

      if (prop === 'getFieldValue') {
        return (name: string) => {
          const value = target.getFieldValue?.(name)

          if (name === slug && isMappingValue(value) && value.type === 'static')
            return value.value

          return value
        }
      }

      if (prop === 'setFieldValue') {
        return (name: string, value: unknown) => {
          if (name === slug) {
            target.setFieldValue?.(name, { type: 'static', value })

            return
          }

          target.setFieldValue?.(name, value)
        }
      }

      const result = Reflect.get(target, prop, receiver)

      return typeof result === 'function' ? result.bind(target) : result
    },
  })
}

/*
 * ---------------------------------------------------------------------------
 * Per-tab fields
 * ---------------------------------------------------------------------------
 */

interface FieldMappingSelectorProps {
  fieldConfig: IField
  field: any
  schema: FieldMappingSchema[]
  required?: boolean
  disabled?: boolean
}

function FieldMappingSelector({
  fieldConfig,
  field,
  schema,
  required,
  disabled,
}: FieldMappingSelectorProps) {
  const [open, setOpen] = useState(false)
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const wrapped = field.state.value
  const selectedPath =
    isMappingValue(wrapped) &&
    wrapped.type === 'formula' &&
    typeof wrapped.value === 'string'
      ? wrapped.value
      : ''

  const paths = useMemo(() => flattenSchemaPaths(schema), [schema])
  const hasPaths = paths.length > 0

  return (
    <Field data-invalid={isInvalid}>
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || !hasPaths}
            className={cn(
              'h-auto w-full justify-between gap-2 py-2 font-normal',
              !selectedPath && 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'truncate text-left text-sm',
                selectedPath && 'font-mono text-foreground',
              )}
            >
              {selectedPath ||
                (hasPaths ? 'Select a field…' : 'No available fields')}
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <Command>
            <CommandInput placeholder="Search fields…" />
            <CommandList>
              <CommandEmpty>No fields found.</CommandEmpty>
              <CommandGroup>
                {paths.map((path) => (
                  <CommandItem
                    key={path}
                    value={path}
                    onSelect={() => {
                      field.handleChange({
                        type: 'formula',
                        value: path,
                      } satisfies FieldMappingValue)
                      setOpen(false)
                    }}
                  >
                    <span className="truncate font-mono text-xs">{path}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

interface TemplateEditorFieldProps {
  fieldConfig: IField
  field: any
  schema: FieldMappingSchema[]
  required?: boolean
  disabled?: boolean
  renderAgent?: (ctx: IHandlebarsAiAssistantRenderContext) => ReactNode
}

function TemplateEditorField({
  fieldConfig,
  field,
  schema,
  required,
  disabled,
  renderAgent,
}: TemplateEditorFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const wrapped = field.state.value
  const template =
    isMappingValue(wrapped) &&
    wrapped.type === 'template' &&
    typeof wrapped.value === 'string'
      ? wrapped.value
      : ''

  const sampleInput = useMemo(() => schemaToSampleData(schema), [schema])
  const contextPaths = useMemo(
    () => flattenSchemaContextPaths(schema),
    [schema],
  )

  return (
    <Field data-invalid={isInvalid}>
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>
      <HandlebarsEditor
        compactMode
        template={template}
        onTemplateChange={(value) =>
          field.handleChange({
            type: 'template',
            value,
          } satisfies FieldMappingValue)
        }
        defaultInput={sampleInput}
        contextPaths={contextPaths}
        samples={HANDLEBARS_SAMPLES}
        renderAiAssistant={renderAgent}
        readOnly={disabled}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

interface FormulaEditorFieldProps {
  fieldConfig: IField
  field: any
  schema: FieldMappingSchema[]
  required?: boolean
  disabled?: boolean
  renderAgent?: (ctx: IJsonataAiAssistantRenderContext) => ReactNode
}

function FormulaEditorField({
  fieldConfig,
  field,
  schema,
  required,
  disabled,
  renderAgent,
}: FormulaEditorFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const wrapped = field.state.value
  const expression =
    isMappingValue(wrapped) &&
    wrapped.type === 'formula' &&
    typeof wrapped.value === 'string'
      ? wrapped.value
      : ''

  const sampleInput = useMemo(() => schemaToSampleData(schema), [schema])
  const contextPaths = useMemo(
    () => flattenSchemaContextPaths(schema),
    [schema],
  )

  return (
    <Field data-invalid={isInvalid}>
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>
      <JsonataEditor
        compactMode
        expression={expression}
        onExpressionChange={(value) =>
          field.handleChange({
            type: 'formula',
            value,
          } satisfies FieldMappingValue)
        }
        defaultInput={sampleInput}
        contextPaths={contextPaths}
        samples={JSONATA_SAMPLES}
        renderAiAssistant={renderAgent}
        readOnly={disabled}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

/*
 * ---------------------------------------------------------------------------
 * FieldMappingFormField — main export
 * ---------------------------------------------------------------------------
 */

const ALL_TABS: { value: MappingTab; label: string }[] = [
  { value: 'fixed', label: 'Fixed Value' },
  { value: 'field-mapping', label: 'Field Mapping' },
  { value: 'template', label: 'Template' },
  { value: 'formula', label: 'Formula' },
]

export function FieldMappingFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  availableFields = EMPTY_ARRAY,
  schema,
  modes,
  renderTemplateAgent,
  renderFormulaAgent,
  children,
}: FieldMappingFormFieldProps) {
  const enabledTabs = modes
    ? ALL_TABS.filter((t) => modes.includes(t.value))
    : ALL_TABS

  const effectiveSchema = useMemo<FieldMappingSchema[]>(() => {
    if (schema && schema.length > 0) return schema

    return availableFieldsToSchema(availableFields)
  }, [schema, availableFields])

  const schemaPathSet = useMemo<Set<string>>(
    () => new Set(flattenSchemaPaths(effectiveSchema)),
    [effectiveSchema],
  )

  const adaptedForm = useMemo(
    () => makeStaticAdaptedForm(form, fieldConfig.slug),
    [form, fieldConfig.slug],
  )

  const [tab, setTab] = useState<MappingTab>(() => {
    const detected = detectTab(
      form.getFieldValue?.(fieldConfig.slug),
      schemaPathSet,
    )

    return enabledTabs.some((t) => t.value === detected)
      ? detected
      : (enabledTabs[0]?.value ?? 'fixed')
  })

  const handleTabChange = useCallback(
    (newTab: string) => {
      const next = newTab as MappingTab
      const currentValue = form.getFieldValue?.(fieldConfig.slug)
      const currentLogical = isMappingValue(currentValue)
        ? currentValue.type
        : 'static'
      const nextLogical = logicalType(next)

      /*
       * Preserve the value when the underlying logical type stays the same —
       * switching between Field Mapping and Formula doesn't need a reset since
       * both persist as `{ type: 'formula', value }`. Reset on every other
       * transition so the new tab starts from a known-good empty state.
       */
      if (currentLogical !== nextLogical) {
        form.setFieldValue?.(fieldConfig.slug, tabToInitialValue(next))
      }

      setTab(next)
    },
    [form, fieldConfig.slug],
  )

  if (enabledTabs.length === 1 && enabledTabs[0]) {
    const only = enabledTabs[0].value

    if (only === 'fixed') return <>{children(adaptedForm)}</>
    if (only === 'field-mapping') {
      return (
        <form.Field name={fieldConfig.slug}>
          {(field: any) => (
            <FieldMappingSelector
              fieldConfig={fieldConfig}
              field={field}
              schema={effectiveSchema}
              required={required}
              disabled={disabled}
            />
          )}
        </form.Field>
      )
    }
    if (only === 'template') {
      return (
        <form.Field name={fieldConfig.slug}>
          {(field: any) => (
            <TemplateEditorField
              fieldConfig={fieldConfig}
              field={field}
              schema={effectiveSchema}
              required={required}
              disabled={disabled}
              renderAgent={renderTemplateAgent}
            />
          )}
        </form.Field>
      )
    }
    if (only === 'formula') {
      return (
        <form.Field name={fieldConfig.slug}>
          {(field: any) => (
            <FormulaEditorField
              fieldConfig={fieldConfig}
              field={field}
              schema={effectiveSchema}
              required={required}
              disabled={disabled}
              renderAgent={renderFormulaAgent}
            />
          )}
        </form.Field>
      )
    }
  }

  return (
    <div className={className}>
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList
          variant="line"
          className="mb-1 h-7 w-full justify-start gap-0 rounded-none border-b border-input bg-transparent p-0"
        >
          {enabledTabs.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-7 rounded-none px-2.5 text-[11px]"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Fixed Value — render via the static adapter form */}
        {enabledTabs.some((t) => t.value === 'fixed') && (
          <TabsContent value="fixed" className="mt-0">
            {children(adaptedForm)}
          </TabsContent>
        )}

        {/* Field Mapping — recursive tree-select over the schema */}
        {enabledTabs.some((t) => t.value === 'field-mapping') && (
          <TabsContent value="field-mapping" className="mt-0">
            <form.Field name={fieldConfig.slug}>
              {(field: any) => (
                <FieldMappingSelector
                  fieldConfig={fieldConfig}
                  field={field}
                  schema={effectiveSchema}
                  required={required}
                  disabled={disabled}
                />
              )}
            </form.Field>
          </TabsContent>
        )}

        {/* Template — Handlebars editor in compact mode */}
        {enabledTabs.some((t) => t.value === 'template') && (
          <TabsContent value="template" className="mt-0">
            <form.Field name={fieldConfig.slug}>
              {(field: any) => (
                <TemplateEditorField
                  fieldConfig={fieldConfig}
                  field={field}
                  schema={effectiveSchema}
                  required={required}
                  disabled={disabled}
                  renderAgent={renderTemplateAgent}
                />
              )}
            </form.Field>
          </TabsContent>
        )}

        {/* Formula — JSONata editor in compact mode */}
        {enabledTabs.some((t) => t.value === 'formula') && (
          <TabsContent value="formula" className="mt-0">
            <form.Field name={fieldConfig.slug}>
              {(field: any) => (
                <FormulaEditorField
                  fieldConfig={fieldConfig}
                  field={field}
                  schema={effectiveSchema}
                  required={required}
                  disabled={disabled}
                  renderAgent={renderFormulaAgent}
                />
              )}
            </form.Field>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
