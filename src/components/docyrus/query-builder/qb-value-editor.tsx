'use client'

// @ts-nocheck
/* eslint-disable */
import { memo, useId, useMemo, useState } from 'react'

import { type ValueEditorProps, useValueEditor } from 'react-querybuilder'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'

import {
  BETWEEN_OPERATORS,
  JSON_KEY_OPERATORS,
  JSON_KEY_NO_VALUE_OPERATORS,
  NO_VALUE_OPERATORS,
  NUMBER_VALUE_OPERATORS,
  TIME_VALUE_OPERATORS,
  WEEKDAYS_OPERATORS,
  WEEKDAY_OPTIONS,
} from './query-operators'

interface FlatOption {
  name: string
  label: string
  icon?: string
  color?: string
}

function flattenValues(values: ValueEditorProps['values']): FlatOption[] {
  const flat: FlatOption[] = []

  for (const opt of values ?? []) {
    if ('options' in opt && Array.isArray(opt.options)) {
      for (const subOpt of opt.options) {
        const o = subOpt as Record<string, unknown>

        flat.push({
          name: String(o.name ?? o.value ?? o.label),
          label: String(o.label),
          icon: typeof o.icon === 'string' ? o.icon : undefined,
          color: typeof o.color === 'string' ? o.color : undefined,
        })
      }
    } else {
      const o = opt as Record<string, unknown>

      flat.push({
        name: String(o.name ?? o.value ?? o.label),
        label: String(o.label),
        icon: typeof o.icon === 'string' ? o.icon : undefined,
        color: typeof o.color === 'string' ? o.color : undefined,
      })
    }
  }

  return flat
}

function resolveOperatorValues(
  operator: string,
  fieldData: ValueEditorProps['fieldData'],
  values: ValueEditorProps['values'],
): ValueEditorProps['values'] {
  const operatorValues = (
    fieldData as ValueEditorProps['fieldData'] & {
      operatorValues?: Record<string, ValueEditorProps['values']>
    }
  )?.operatorValues

  return operatorValues?.[operator] ?? values
}

const QBValueEditor = memo((allProps: ValueEditorProps) => {
  const {
    className,
    handleOnChange,
    inputType,
    operator,
    value,
    title,
    disabled,
    type,
    values = [],
    fieldData,
    testID,
  } = allProps

  useValueEditor(allProps)

  const id = useId()
  const ariaLabel = title || fieldData?.label || 'Value'

  const effectiveValues = useMemo(
    () => resolveOperatorValues(operator, fieldData, values),
    [fieldData, operator, values],
  )
  const flatValues = useMemo(
    () => flattenValues(effectiveValues),
    [effectiveValues],
  )

  if (
    NO_VALUE_OPERATORS.has(operator) ||
    operator === 'null' ||
    operator === 'notNull'
  ) {
    return null
  }

  if (BETWEEN_OPERATORS.has(operator)) {
    const arr = Array.isArray(value)
      ? value.map(String)
      : String(value ?? '').split(',')
    const v0 = arr[0] ?? ''
    const v1 = arr[1] ?? ''

    const updateAt = (index: 0 | 1, next: string) => {
      const draft = [v0, v1]

      draft[index] = next
      handleOnChange(draft)
    }

    return (
      <div
        className={cn('qb-control flex items-center gap-1.5', className)}
        data-testid={testID}
      >
        <Input
          type={inputType || 'text'}
          value={v0}
          title={title}
          aria-label={`${ariaLabel} (from)`}
          disabled={disabled}
          className="qb-control h-8 w-32 text-xs"
          onChange={(e) => updateAt(0, e.target.value)}
        />
        <span className="text-xs text-muted-foreground">and</span>
        <Input
          type={inputType || 'text'}
          value={v1}
          title={title}
          aria-label={`${ariaLabel} (to)`}
          disabled={disabled}
          className="qb-control h-8 w-32 text-xs"
          onChange={(e) => updateAt(1, e.target.value)}
        />
      </div>
    )
  }

  if (WEEKDAYS_OPERATORS.has(operator)) {
    return (
      <MultiSelectChips
        id={id}
        options={WEEKDAY_OPTIONS}
        value={value}
        disabled={disabled}
        title={title}
        ariaLabel={ariaLabel}
        className={className}
        testID={testID}
        onChange={handleOnChange}
      />
    )
  }

  /*
   * JSON key + value editor: "json_key_is" / "json_key_is_not" use two inputs
   * (a key name and a value).  "json_key_is_empty" / "json_key_is_not_empty"
   * only need a key.
   */
  if (
    JSON_KEY_OPERATORS.has(operator) ||
    JSON_KEY_NO_VALUE_OPERATORS.has(operator)
  ) {
    const arr = Array.isArray(value)
      ? value.map(String)
      : String(value ?? '').split(':')
    const keyVal = arr[0] ?? ''
    const valVal = arr[1] ?? ''
    const isKeyOnly = JSON_KEY_NO_VALUE_OPERATORS.has(operator)

    const updateKey = (next: string) => {
      handleOnChange(isKeyOnly ? next : [next, valVal])
    }

    const updateVal = (next: string) => {
      handleOnChange([keyVal, next])
    }

    return (
      <div
        className={cn('qb-control flex items-center gap-1.5', className)}
        data-testid={testID}
      >
        <Input
          type="text"
          value={keyVal}
          title={title}
          aria-label={`${ariaLabel} (key)`}
          placeholder="key"
          disabled={disabled}
          className="qb-control h-8 w-32 text-xs"
          onChange={(e) => updateKey(e.target.value)}
        />
        {!isKeyOnly && (
          <>
            <span className="text-xs text-muted-foreground">:</span>
            <Input
              type="text"
              value={valVal}
              title={title}
              aria-label={`${ariaLabel} (value)`}
              placeholder="value"
              disabled={disabled}
              className="qb-control h-8 w-32 text-xs"
              onChange={(e) => updateVal(e.target.value)}
            />
          </>
        )}
      </div>
    )
  }

  if (NUMBER_VALUE_OPERATORS.has(operator)) {
    return (
      <Input
        type="number"
        value={String(value ?? '')}
        title={title}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn('qb-control h-8 min-w-25 text-xs', className)}
        onChange={(e) => handleOnChange(e.target.value)}
        data-testid={testID}
      />
    )
  }

  if (TIME_VALUE_OPERATORS.has(operator)) {
    return (
      <Input
        type="time"
        value={String(value ?? '')}
        title={title}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn('qb-control h-8 min-w-25 text-xs', className)}
        onChange={(e) => handleOnChange(e.target.value)}
        data-testid={testID}
      />
    )
  }

  switch (type) {
    case 'select':
      return (
        <Select
          value={
            value === null || value === undefined || value === ''
              ? undefined
              : String(value)
          }
          disabled={disabled}
          onValueChange={handleOnChange}
        >
          <SelectTrigger
            className={cn('qb-control h-8 min-w-30 text-xs', className)}
            title={title}
            aria-label={ariaLabel}
            size="sm"
            data-testid={testID}
          >
            <SelectValue placeholder={title || 'Select…'} />
          </SelectTrigger>
          <SelectContent>
            {flatValues.length > 0 ? (
              flatValues.map((opt) => (
                <SelectItem key={opt.name} value={opt.name}>
                  {opt.label}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No options available.
              </div>
            )}
          </SelectContent>
        </Select>
      )

    case 'multiselect':
      return (
        <MultiSelectChips
          id={id}
          options={flatValues}
          value={value}
          disabled={disabled}
          title={title}
          ariaLabel={ariaLabel}
          className={className}
          testID={testID}
          onChange={handleOnChange}
        />
      )

    case 'checkbox':
      return (
        <div
          className={cn('qb-control flex items-center gap-2', className)}
          data-testid={testID}
        >
          <Checkbox
            id={id}
            checked={!!value}
            disabled={disabled}
            onCheckedChange={(v) => handleOnChange(v)}
            title={title}
            aria-label={ariaLabel}
          />
          <Label htmlFor={id} className="text-xs">
            {fieldData?.label ?? title}
          </Label>
        </div>
      )

    case 'switch':
      return (
        <div
          className={cn('qb-control flex items-center gap-2', className)}
          data-testid={testID}
        >
          <Switch
            id={id}
            size="sm"
            checked={!!value}
            disabled={disabled}
            onCheckedChange={(v) => handleOnChange(v)}
            title={title}
            aria-label={ariaLabel}
          />
          <Label htmlFor={id} className="text-xs">
            {fieldData?.label ?? title}
          </Label>
        </div>
      )

    case 'radio':
      return (
        <RadioGroup
          value={String(value ?? '')}
          disabled={disabled}
          onValueChange={handleOnChange}
          className={cn('qb-control flex flex-row gap-3', className)}
          title={title}
          aria-label={ariaLabel}
          data-testid={testID}
        >
          {flatValues.map((opt) => (
            <div key={opt.name} className="flex items-center gap-1.5">
              <RadioGroupItem value={opt.name} id={`${id}-${opt.name}`} />
              <Label htmlFor={`${id}-${opt.name}`} className="text-xs">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )

    case 'textarea':
      return (
        <Textarea
          value={String(value ?? '')}
          title={title}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn('qb-control h-8 min-h-8 min-w-45 text-xs', className)}
          onChange={(e) => handleOnChange(e.target.value)}
          data-testid={testID}
        />
      )

    default:
      return (
        <Input
          type={inputType || 'text'}
          value={String(value ?? '')}
          title={title}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn('qb-control h-8 min-w-35 text-xs', className)}
          onChange={(e) => handleOnChange(e.target.value)}
          data-testid={testID}
        />
      )
  }
})

QBValueEditor.displayName = 'QBValueEditor'

interface MultiSelectChipsProps {
  id: string
  options: FlatOption[]
  value: unknown
  disabled?: boolean
  title?: string
  ariaLabel?: string
  className?: string
  testID?: string
  onChange: (value: unknown) => void
}

function valueToArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)

  if (value === null || value === undefined || value === '') return []

  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function MultiSelectChips({
  id,
  options,
  value,
  disabled,
  title,
  ariaLabel,
  className,
  testID,
  onChange,
}: MultiSelectChipsProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => valueToArray(value), [value])

  const toggle = (name: string) => {
    const next = selected.includes(name)
      ? selected.filter((s) => s !== name)
      : [...selected, name]

    onChange(next)
  }

  const remove = (name: string) => {
    onChange(selected.filter((s) => s !== name))
  }

  const optionByName = useMemo(() => {
    const map: Record<string, FlatOption> = {}

    for (const opt of options) map[opt.name] = opt

    return map
  }, [options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          size="sm"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          title={title}
          disabled={disabled}
          data-testid={testID}
          className={cn(
            'qb-control h-auto min-h-8 min-w-40 justify-between gap-2 px-2 py-1 text-xs font-normal',
            className,
          )}
        >
          <span className="flex flex-1 flex-wrap gap-1">
            {selected.length === 0 && (
              <span className="text-muted-foreground">
                {title || 'Select…'}
              </span>
            )}
            {selected.map((name) => {
              const opt = optionByName[name]
              const label = opt?.label ?? name

              return (
                <Badge
                  key={name}
                  variant="outline"
                  className="gap-1 py-0.5 text-[11px]"
                >
                  {opt?.icon ? (
                    <DocyrusIcon icon={opt.icon} className="size-3 shrink-0" />
                  ) : opt?.color ? (
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                  ) : null}
                  {label}
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${label}`}
                    className="ml-0.5 cursor-pointer rounded-full outline-none hover:opacity-70"
                    onPointerDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      remove(name)
                    }}
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              )
            })}
          </span>
          <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-56 p-0"
      >
        <Command>
          <CommandInput placeholder="Search…" className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const checked = selected.includes(opt.name)

                return (
                  <CommandItem
                    key={opt.name}
                    value={opt.label}
                    onSelect={() => toggle(opt.name)}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        'mr-2 size-3.5',
                        checked ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {opt.icon ? (
                      <DocyrusIcon
                        icon={opt.icon}
                        className="mr-1.5 size-3.5 shrink-0"
                      />
                    ) : opt.color ? (
                      <span
                        className="mr-1.5 size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                    ) : null}
                    {opt.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { QBValueEditor }
