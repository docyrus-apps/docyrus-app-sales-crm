'use client'

// @ts-nocheck
/* eslint-disable */
import { useState, type ReactNode } from 'react'

import { SlidersHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import {
  type JsonSchemaType,
  type SchemaNode,
} from '../json-schema-designer-types'
import { useDesignerContext } from '../json-schema-designer-context'
import { findParent } from '../lib/schema-node'
import { STRING_FORMATS } from '../lib/toolbox-items'
import { EnumValuesEditor } from './enum-values-editor'

const TYPE_OPTIONS: JsonSchemaType[] = [
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'null',
]

const NO_FORMAT = '__none__'

function PropSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {title}
      </p>
      {children}
    </section>
  )
}

function FieldShell({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

/** Text input that commits on blur / Enter to avoid re-rendering the tree per keystroke. */
function CommitInput({
  value,
  onCommit,
  disabled,
  placeholder,
  mono,
}: {
  value: string
  onCommit: (value: string) => void
  disabled?: boolean
  placeholder?: string
  mono?: boolean
}) {
  const [local, setLocal] = useState(value)
  const [committed, setCommitted] = useState(value)

  if (value !== committed) {
    setCommitted(value)
    setLocal(value)
  }

  return (
    <Input
      value={local}
      onChange={(event) => setLocal(event.target.value)}
      onBlur={() => local !== value && onCommit(local)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      disabled={disabled}
      placeholder={placeholder}
      className={cn('h-8 text-xs', mono && 'font-mono')}
    />
  )
}

/** Number input that commits on blur; empty string clears the constraint. */
function CommitNumber({
  value,
  onCommit,
  disabled,
  placeholder,
}: {
  value: number | undefined
  onCommit: (value: number | undefined) => void
  disabled?: boolean
  placeholder?: string
}) {
  const text = value === undefined ? '' : String(value)
  const [local, setLocal] = useState(text)
  const [committed, setCommitted] = useState(text)

  if (text !== committed) {
    setCommitted(text)
    setLocal(text)
  }

  return (
    <Input
      type="number"
      value={local}
      onChange={(event) => setLocal(event.target.value)}
      onBlur={() => {
        if (local === text) return

        const next = local.trim() === '' ? undefined : Number(local)

        onCommit(next !== undefined && Number.isNaN(next) ? undefined : next)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      disabled={disabled}
      placeholder={placeholder}
      className="h-8 text-xs"
    />
  )
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-[10px] text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="scale-90"
      />
    </div>
  )
}

function DefaultValueField({
  node,
  disabled,
}: {
  node: SchemaNode
  disabled?: boolean
}) {
  const { t } = useUiTranslation()
  const { updateNode } = useDesignerContext()

  if (node.type === 'object' || node.type === 'array' || node.type === 'null')
    return null

  if (node.type === 'boolean') {
    const current =
      node.defaultValue === true
        ? 'true'
        : node.defaultValue === false
          ? 'false'
          : 'unset'

    return (
      <FieldShell
        label={t('ui.jsonSchemaDesigner.defaultValue', 'Default value')}
      >
        <Select
          value={current}
          disabled={disabled}
          onValueChange={(value) =>
            updateNode(node.id, {
              defaultValue: value === 'unset' ? undefined : value === 'true',
            })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">
              {t('ui.jsonSchemaDesigner.unset', 'Unset')}
            </SelectItem>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectContent>
        </Select>
      </FieldShell>
    )
  }

  const isNumeric = node.type === 'number' || node.type === 'integer'

  return (
    <FieldShell
      label={t('ui.jsonSchemaDesigner.defaultValue', 'Default value')}
    >
      {isNumeric ? (
        <CommitNumber
          value={
            typeof node.defaultValue === 'number'
              ? node.defaultValue
              : undefined
          }
          onCommit={(value) => updateNode(node.id, { defaultValue: value })}
          disabled={disabled}
        />
      ) : (
        <CommitInput
          value={
            node.defaultValue === undefined ? '' : String(node.defaultValue)
          }
          onCommit={(value) =>
            updateNode(node.id, {
              defaultValue: value === '' ? undefined : value,
            })
          }
          disabled={disabled}
        />
      )}
    </FieldShell>
  )
}

/** Right pane: edit every property of the selected schema node. */
export function NodeProperties() {
  const { t } = useUiTranslation()
  const { state, selectedNode, updateNode, readOnly } = useDesignerContext()

  if (!selectedNode) {
    return (
      <div className="flex h-full flex-col bg-card">
        <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('ui.jsonSchemaDesigner.properties', 'Item Properties')}
          </h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <SlidersHorizontal className="size-7 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            {t(
              'ui.jsonSchemaDesigner.noSelection',
              'Select a node to edit its properties',
            )}
          </p>
        </div>
      </div>
    )
  }

  const node = selectedNode
  const isRoot = node.id === state.root.id
  const parent = isRoot ? null : findParent(state.root, node.id)
  const inArray = parent?.type === 'array'
  const isNumeric = node.type === 'number' || node.type === 'integer'
  const strict = state.strictMode
  const update = (updates: Partial<SchemaNode>) => updateNode(node.id, updates)

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <h2 className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('ui.jsonSchemaDesigner.properties', 'Item Properties')}
        </h2>
        <span className="truncate text-xs font-semibold text-foreground">
          {isRoot ? node.title || 'schema' : inArray ? 'items' : node.key}
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-3">
          {/* ── Identity ─────────────────────────────────────── */}
          <PropSection title={t('ui.jsonSchemaDesigner.identity', 'Identity')}>
            {!isRoot && !inArray && (
              <FieldShell
                label={t('ui.jsonSchemaDesigner.key', 'Property key')}
              >
                <CommitInput
                  value={node.key}
                  onCommit={(value) => update({ key: value })}
                  disabled={readOnly}
                  placeholder="propertyName"
                  mono
                />
              </FieldShell>
            )}

            <FieldShell label={t('ui.jsonSchemaDesigner.type', 'Type')}>
              <Select
                value={node.type}
                disabled={readOnly}
                onValueChange={(value) =>
                  update({ type: value as JsonSchemaType })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>

            <FieldShell label={t('ui.jsonSchemaDesigner.title', 'Title')}>
              <CommitInput
                value={node.title ?? ''}
                onCommit={(value) => update({ title: value || undefined })}
                disabled={readOnly}
                placeholder={t(
                  'ui.jsonSchemaDesigner.titlePlaceholder',
                  'Human-readable title',
                )}
              />
            </FieldShell>

            <FieldShell
              label={t('ui.jsonSchemaDesigner.description', 'Description')}
            >
              <Textarea
                value={node.description ?? ''}
                onChange={(event) =>
                  update({ description: event.target.value || undefined })
                }
                disabled={readOnly}
                rows={2}
                placeholder={t(
                  'ui.jsonSchemaDesigner.descriptionPlaceholder',
                  'What is this for?',
                )}
                className="resize-none text-xs"
              />
            </FieldShell>
          </PropSection>

          {/* ── Behavior ─────────────────────────────────────── */}
          <PropSection title={t('ui.jsonSchemaDesigner.behavior', 'Behavior')}>
            {parent?.type === 'object' && (
              <SwitchRow
                label={t('ui.jsonSchemaDesigner.required', 'Required')}
                description={
                  strict
                    ? t(
                        'ui.jsonSchemaDesigner.requiredStrictHint',
                        'Strict Mode — every property is required',
                      )
                    : t(
                        'ui.jsonSchemaDesigner.requiredHint',
                        'Listed in the parent’s required array',
                      )
                }
                checked={strict || Boolean(node.required)}
                onChange={(checked) => update({ required: checked })}
                disabled={readOnly || strict}
              />
            )}
            <SwitchRow
              label={t('ui.jsonSchemaDesigner.nullable', 'Nullable')}
              description={
                strict
                  ? t(
                      'ui.jsonSchemaDesigner.nullableStrictHint',
                      'Strict Mode — use nullable for optional fields',
                    )
                  : t('ui.jsonSchemaDesigner.nullableHint', 'Also accepts null')
              }
              checked={Boolean(node.nullable)}
              onChange={(checked) => update({ nullable: checked })}
              disabled={readOnly}
            />
            <DefaultValueField node={node} disabled={readOnly} />
          </PropSection>

          {/* ── String ───────────────────────────────────────── */}
          {node.type === 'string' && (
            <PropSection
              title={t('ui.jsonSchemaDesigner.stringRules', 'String rules')}
            >
              <FieldShell label={t('ui.jsonSchemaDesigner.format', 'Format')}>
                <Select
                  value={node.format ?? NO_FORMAT}
                  disabled={readOnly}
                  onValueChange={(value) =>
                    update({ format: value === NO_FORMAT ? undefined : value })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRING_FORMATS.map((option) => (
                      <SelectItem
                        key={option.value || NO_FORMAT}
                        value={option.value || NO_FORMAT}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldShell>
              <div className="grid grid-cols-2 gap-2">
                <FieldShell
                  label={t('ui.jsonSchemaDesigner.minLength', 'Min length')}
                >
                  <CommitNumber
                    value={node.minLength}
                    onCommit={(value) => update({ minLength: value })}
                    disabled={readOnly}
                  />
                </FieldShell>
                <FieldShell
                  label={t('ui.jsonSchemaDesigner.maxLength', 'Max length')}
                >
                  <CommitNumber
                    value={node.maxLength}
                    onCommit={(value) => update({ maxLength: value })}
                    disabled={readOnly}
                  />
                </FieldShell>
              </div>
              <FieldShell
                label={t('ui.jsonSchemaDesigner.pattern', 'Pattern (regex)')}
              >
                <CommitInput
                  value={node.pattern ?? ''}
                  onCommit={(value) => update({ pattern: value || undefined })}
                  disabled={readOnly}
                  placeholder="^[a-z]+$"
                  mono
                />
              </FieldShell>
            </PropSection>
          )}

          {/* ── Number ───────────────────────────────────────── */}
          {isNumeric && (
            <PropSection
              title={t('ui.jsonSchemaDesigner.numberRules', 'Number rules')}
            >
              <div className="grid grid-cols-2 gap-2">
                <FieldShell
                  label={t('ui.jsonSchemaDesigner.minimum', 'Minimum')}
                >
                  <CommitNumber
                    value={node.minimum}
                    onCommit={(value) => update({ minimum: value })}
                    disabled={readOnly}
                  />
                </FieldShell>
                <FieldShell
                  label={t('ui.jsonSchemaDesigner.maximum', 'Maximum')}
                >
                  <CommitNumber
                    value={node.maximum}
                    onCommit={(value) => update({ maximum: value })}
                    disabled={readOnly}
                  />
                </FieldShell>
                <FieldShell
                  label={t(
                    'ui.jsonSchemaDesigner.exclusiveMin',
                    'Exclusive min',
                  )}
                >
                  <CommitNumber
                    value={node.exclusiveMinimum}
                    onCommit={(value) => update({ exclusiveMinimum: value })}
                    disabled={readOnly}
                  />
                </FieldShell>
                <FieldShell
                  label={t(
                    'ui.jsonSchemaDesigner.exclusiveMax',
                    'Exclusive max',
                  )}
                >
                  <CommitNumber
                    value={node.exclusiveMaximum}
                    onCommit={(value) => update({ exclusiveMaximum: value })}
                    disabled={readOnly}
                  />
                </FieldShell>
              </div>
              <FieldShell
                label={t('ui.jsonSchemaDesigner.multipleOf', 'Multiple of')}
              >
                <CommitNumber
                  value={node.multipleOf}
                  onCommit={(value) => update({ multipleOf: value })}
                  disabled={readOnly}
                />
              </FieldShell>
            </PropSection>
          )}

          {/* ── Array ────────────────────────────────────────── */}
          {node.type === 'array' && (
            <PropSection
              title={t('ui.jsonSchemaDesigner.arrayRules', 'Array rules')}
            >
              <div className="grid grid-cols-2 gap-2">
                <FieldShell
                  label={t('ui.jsonSchemaDesigner.minItems', 'Min items')}
                >
                  <CommitNumber
                    value={node.minItems}
                    onCommit={(value) => update({ minItems: value })}
                    disabled={readOnly}
                  />
                </FieldShell>
                <FieldShell
                  label={t('ui.jsonSchemaDesigner.maxItems', 'Max items')}
                >
                  <CommitNumber
                    value={node.maxItems}
                    onCommit={(value) => update({ maxItems: value })}
                    disabled={readOnly}
                  />
                </FieldShell>
              </div>
              <SwitchRow
                label={t('ui.jsonSchemaDesigner.uniqueItems', 'Unique items')}
                checked={Boolean(node.uniqueItems)}
                onChange={(checked) =>
                  update({ uniqueItems: checked || undefined })
                }
                disabled={readOnly}
              />
            </PropSection>
          )}

          {/* ── Object ───────────────────────────────────────── */}
          {node.type === 'object' && (
            <PropSection
              title={t('ui.jsonSchemaDesigner.objectRules', 'Object rules')}
            >
              <SwitchRow
                label={t(
                  'ui.jsonSchemaDesigner.additionalProperties',
                  'Allow extra properties',
                )}
                description={
                  strict
                    ? t(
                        'ui.jsonSchemaDesigner.additionalPropertiesStrictHint',
                        'Strict Mode — additionalProperties is forced to false',
                      )
                    : t(
                        'ui.jsonSchemaDesigner.additionalPropertiesHint',
                        'Permit properties beyond those defined',
                      )
                }
                checked={!strict && node.additionalProperties !== false}
                onChange={(checked) =>
                  update({ additionalProperties: checked ? undefined : false })
                }
                disabled={readOnly || strict}
              />
            </PropSection>
          )}

          {/* ── Enum ─────────────────────────────────────────── */}
          {(node.type === 'string' || isNumeric) && (
            <PropSection
              title={t(
                'ui.jsonSchemaDesigner.enumValues',
                'Allowed values (enum)',
              )}
            >
              <EnumValuesEditor node={node} />
            </PropSection>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
