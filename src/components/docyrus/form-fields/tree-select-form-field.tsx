'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { Field, FieldError } from '@/components/ui/field'

import {
  TreeSelect,
  type TreeSelectDefaultExpanded,
  type TreeSelectValue,
} from '@/components/docyrus/tree-select'
import { type TreeViewItem } from '@/components/docyrus/tree-view'

import { FormFieldLabel } from './form-field-label'
import { EnumOptionDisplay } from './lib/enum-option-display'
import { type DocyrusFormFieldProps, type EnumOption } from './types'

const EMPTY_ENUM_OPTIONS: never[] = []
const ENUM_ITEM_TYPE = 'enum-option'

interface EnumTreeItem extends TreeViewItem {
  type: typeof ENUM_ITEM_TYPE
  option: EnumOption
  children?: EnumTreeItem[]
}

/**
 * Convert a flat list of EnumOption (with parent references) into a TreeViewItem tree.
 * Options whose `nestedByProp` value points outside the option set are treated as roots.
 */
function enumOptionsToTreeItems(
  options: ReadonlyArray<EnumOption>,
  nestedByProp: string,
): EnumTreeItem[] {
  if (options.length === 0) return []

  const optionIds = new Set(options.map((option) => option.id))
  const childrenMap = new Map<string, EnumOption[]>()
  const roots: EnumOption[] = []

  for (const option of options) {
    const parentId = (option as unknown as Record<string, unknown>)[
      nestedByProp
    ] as string | undefined

    if (parentId && optionIds.has(parentId)) {
      const list = childrenMap.get(parentId)

      if (list) list.push(option)
      else childrenMap.set(parentId, [option])
    } else {
      roots.push(option)
    }
  }

  const build = (option: EnumOption): EnumTreeItem => {
    const children = childrenMap.get(option.id)
    const node: EnumTreeItem = {
      id: option.id,
      name: option.name,
      type: ENUM_ITEM_TYPE,
      option,
    }

    if (children && children.length > 0) {
      node.children = children.map(build)
    }

    return node
  }

  return roots.map(build)
}

const isEnumTreeItem = (item: TreeViewItem): item is EnumTreeItem =>
  item.type === ENUM_ITEM_TYPE

const renderEnumIcon = (item: TreeViewItem) => {
  if (!isEnumTreeItem(item)) return null
  const { option } = item

  if (!option.icon && !option.color) return null

  return (
    <EnumOptionDisplay
      option={{ ...option, name: '' }}
      variant="inline"
      nameClassName="hidden"
    />
  )
}

const renderEnumSelected = (item: TreeViewItem) => {
  if (!isEnumTreeItem(item))
    return <span className="truncate">{item.name}</span>

  return <EnumOptionDisplay option={item.option} />
}

const EXPAND_KEYWORDS = new Set<TreeSelectDefaultExpanded>([
  'none',
  'all',
  'selected',
])

/** Coerce a free-form `field.options.defaultExpanded` value into a valid TreeSelectDefaultExpanded. */
function readDefaultExpanded(
  raw: unknown,
): TreeSelectDefaultExpanded | undefined {
  if (
    typeof raw === 'string' &&
    EXPAND_KEYWORDS.has(raw as TreeSelectDefaultExpanded)
  ) {
    return raw as TreeSelectDefaultExpanded
  }
  if (Array.isArray(raw) && raw.every((value) => typeof value === 'string')) {
    return raw as string[]
  }

  return undefined
}

export function TreeSelectFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  enumOptions = EMPTY_ENUM_OPTIONS,
}: DocyrusFormFieldProps) {
  const nestedByProp = fieldConfig.nestedByProp ?? 'parent'
  const options = (fieldConfig.options ?? null) as Record<
    string,
    unknown
  > | null
  const multiple = Boolean(options?.multiple)
  const leafOnly = Boolean(options?.leafOnly)
  const showBreadcrumb = Boolean(options?.showBreadcrumb)
  const defaultExpanded = readDefaultExpanded(options?.defaultExpanded)

  const treeData = useMemo(
    () => enumOptionsToTreeItems(enumOptions, nestedByProp),
    [enumOptions, nestedByProp],
  )

  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        const value: TreeSelectValue = multiple
          ? Array.isArray(field.state.value)
            ? field.state.value
            : []
          : typeof field.state.value === 'string'
            ? field.state.value
            : null

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <TreeSelect
              id={field.name}
              name={field.name}
              data={treeData}
              value={value}
              multiple={multiple}
              leafOnly={leafOnly}
              showBreadcrumb={showBreadcrumb}
              defaultExpanded={defaultExpanded}
              disabled={disabled || fieldConfig.readOnly === true}
              aria-invalid={isInvalid}
              onBlur={field.handleBlur}
              getIcon={renderEnumIcon}
              renderSelected={showBreadcrumb ? undefined : renderEnumSelected}
              onValueChange={(next) => {
                if (multiple) {
                  field.handleChange(Array.isArray(next) ? next : [])

                  return
                }
                field.handleChange(typeof next === 'string' ? next : null)
              }}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
