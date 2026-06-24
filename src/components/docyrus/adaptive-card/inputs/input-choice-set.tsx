'use client'

// @ts-nocheck
/* eslint-disable */
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'

import { Check, ChevronsUpDown, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  type AdaptiveCardChoice,
  type AdaptiveCardInputChoiceSet,
} from '../adaptive-card-types'

import {
  useAdaptiveCardContext,
  useAdaptiveCardInput,
} from '../adaptive-card-context'
import { InputShell } from './input-shell'
import { useInputRegister } from './use-input-register'

function parseInitial(
  value: string | undefined,
  isMulti: boolean,
): string | Array<string> {
  if (value == null || value === '') return isMulti ? [] : ''
  if (isMulti)
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

  return value
}

function asMultiValue(value: unknown): Array<string> {
  if (Array.isArray(value)) return value as Array<string>
  if (typeof value === 'string' && value.length > 0)
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

  return []
}

function asSingleValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return (value[0] ?? '') as string

  return ''
}

function CompactSingle({
  element,
  inputId,
}: {
  element: AdaptiveCardInputChoiceSet
  inputId: string
}) {
  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const invalid = showError && validation?.isValid === false
  const current = asSingleValue(value ?? element.value)

  return (
    <Select
      value={current || undefined}
      onValueChange={(next) => setValue(next)}
    >
      <SelectTrigger
        id={inputId}
        aria-required={element.isRequired ? true : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${inputId}-error` : undefined}
        className={cn('w-full', invalid ? 'border-destructive' : '')}
      >
        <SelectValue placeholder={element.placeholder ?? 'Select an option'} />
      </SelectTrigger>
      <SelectContent>
        {element.choices.map((choice) => (
          <SelectItem key={choice.value} value={choice.value}>
            {choice.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ExpandedSingle({
  element,
  inputId,
}: {
  element: AdaptiveCardInputChoiceSet
  inputId: string
}) {
  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const invalid = showError && validation?.isValid === false
  const current = asSingleValue(value ?? element.value)

  return (
    <RadioGroup
      id={inputId}
      value={current}
      onValueChange={(next) => setValue(next)}
      aria-required={element.isRequired ? true : undefined}
      aria-invalid={invalid || undefined}
      className="flex flex-col gap-2"
    >
      {element.choices.map((choice, index) => {
        const itemId = `${inputId}-${index}`

        return (
          <div key={itemId} className="flex items-center gap-2">
            <RadioGroupItem id={itemId} value={choice.value} />
            <Label
              htmlFor={itemId}
              className={cn(
                'text-sm font-normal',
                element.wrap !== false
                  ? 'whitespace-normal break-words'
                  : 'truncate',
              )}
            >
              {choice.title}
            </Label>
          </div>
        )
      })}
    </RadioGroup>
  )
}

function ExpandedMulti({
  element,
  inputId,
}: {
  element: AdaptiveCardInputChoiceSet
  inputId: string
}) {
  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const invalid = showError && validation?.isValid === false
  const current = asMultiValue(value ?? element.value)

  const toggle = (choiceValue: string) => {
    const next = current.includes(choiceValue)
      ? current.filter((v) => v !== choiceValue)
      : [...current, choiceValue]

    setValue(next)
  }

  return (
    <div
      id={inputId}
      role="group"
      aria-required={element.isRequired ? true : undefined}
      aria-invalid={invalid || undefined}
      className="flex flex-col gap-2"
    >
      {element.choices.map((choice, index) => {
        const itemId = `${inputId}-${index}`
        const checked = current.includes(choice.value)

        return (
          <label
            key={itemId}
            htmlFor={itemId}
            className="flex items-start gap-2 cursor-pointer"
          >
            <input
              id={itemId}
              type="checkbox"
              checked={checked}
              onChange={() => toggle(choice.value)}
              className={cn(
                'mt-0.5 size-4 shrink-0 rounded-sm border border-input shadow-sm',
                'accent-primary',
              )}
            />
            <span
              className={cn(
                'text-sm',
                element.wrap !== false
                  ? 'whitespace-normal break-words'
                  : 'truncate',
              )}
            >
              {choice.title}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function CompactMulti({
  element,
  inputId,
}: {
  element: AdaptiveCardInputChoiceSet
  inputId: string
}) {
  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const [open, setOpen] = useState(false)
  const invalid = showError && validation?.isValid === false
  const current = asMultiValue(value ?? element.value)

  const labelText =
    current.length === 0
      ? (element.placeholder ?? 'Select options')
      : element.choices
          .filter((c) => current.includes(c.value))
          .map((c) => c.title)
          .join(', ')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={inputId}
          type="button"
          variant="outline"
          role="combobox"
          aria-required={element.isRequired ? true : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${inputId}-error` : undefined}
          className={cn(
            'w-full justify-between font-normal',
            current.length === 0 ? 'text-muted-foreground' : '',
            invalid ? 'border-destructive' : '',
          )}
        >
          <span className="truncate">{labelText}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-1"
        align="start"
      >
        <div className="flex flex-col">
          {element.choices.map((choice) => {
            const checked = current.includes(choice.value)

            return (
              <button
                key={choice.value}
                type="button"
                onClick={() => {
                  const next = checked
                    ? current.filter((v) => v !== choice.value)
                    : [...current, choice.value]

                  setValue(next)
                }}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded border">
                  {checked ? <Check className="size-3" /> : null}
                </span>
                <span className="text-left">{choice.title}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FilteredVariant({
  element,
  inputId,
}: {
  element: AdaptiveCardInputChoiceSet
  inputId: string
}) {
  const ctx = useAdaptiveCardContext()
  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dynamicChoices, setDynamicChoices] = useState<
    Array<AdaptiveCardChoice>
  >([])
  const [isQuerying, setIsQuerying] = useState(false)
  const invalid = showError && validation?.isValid === false
  const isMulti = element.isMultiSelect === true
  const current = isMulti
    ? asMultiValue(value ?? element.value)
    : asSingleValue(value ?? element.value)

  const dataQuery = element['choices.data']

  useEffect(() => {
    if (!dataQuery) return
    if (!open) return

    let cancelled = false
    const handle = window.setTimeout(() => {
      setIsQuerying(true)
      ctx
        .queryChoices({
          dataset: dataQuery.dataset,
          search,
          inputId: element.id,
        })
        .then((results) => {
          if (!cancelled) setDynamicChoices(results)
        })
        .finally(() => {
          if (!cancelled) setIsQuerying(false)
        })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [ctx, dataQuery, element.id, open, search])

  const mergedChoices = useMemo(() => {
    if (!dataQuery) return element.choices
    const map = new Map<string, AdaptiveCardChoice>()

    for (const choice of element.choices) map.set(choice.value, choice)
    for (const choice of dynamicChoices) map.set(choice.value, choice)

    return Array.from(map.values())
  }, [dataQuery, dynamicChoices, element.choices])

  const filtered = useMemo(() => {
    if (dataQuery) return mergedChoices

    const term = search.trim().toLowerCase()

    if (!term) return mergedChoices

    return mergedChoices.filter((c) => c.title.toLowerCase().includes(term))
  }, [dataQuery, mergedChoices, search])

  const labelText = !isMulti
    ? typeof current === 'string' && current
      ? (mergedChoices.find((c) => c.value === current)?.title ?? current)
      : (element.placeholder ?? 'Search...')
    : Array.isArray(current) && current.length > 0
      ? mergedChoices
          .filter((c) => current.includes(c.value))
          .map((c) => c.title)
          .join(', ')
      : (element.placeholder ?? 'Search...')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={inputId}
          type="button"
          variant="outline"
          role="combobox"
          aria-required={element.isRequired ? true : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${inputId}-error` : undefined}
          className={cn(
            'w-full justify-between font-normal',
            !current || (Array.isArray(current) && current.length === 0)
              ? 'text-muted-foreground'
              : '',
            invalid ? 'border-destructive' : '',
          )}
        >
          <span className="truncate">{labelText}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="flex items-center border-b px-2">
          <Search className="size-4 opacity-50" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="h-9 border-0 px-2 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex max-h-64 flex-col overflow-y-auto p-1">
          {isQuerying ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              Searching…
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              No results.
            </p>
          ) : null}
          {filtered.map((choice) => {
            const isSelected = isMulti
              ? Array.isArray(current) && current.includes(choice.value)
              : current === choice.value

            return (
              <button
                key={choice.value}
                type="button"
                onClick={() => {
                  if (isMulti) {
                    const arr = Array.isArray(current) ? current : []
                    const next = arr.includes(choice.value)
                      ? arr.filter((v) => v !== choice.value)
                      : [...arr, choice.value]

                    setValue(next)
                  } else {
                    setValue(choice.value)
                    setOpen(false)
                  }
                }}
                className={cn(
                  'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent',
                  isSelected ? 'bg-accent/50' : '',
                )}
              >
                <Check
                  className={cn(
                    'size-4',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span>{choice.title}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function InputChoiceSetElement({
  element,
}: {
  element: AdaptiveCardInputChoiceSet
}) {
  const isMulti = element.isMultiSelect === true
  const inputId = useId()
  const style = element.style ?? 'compact'

  useInputRegister(element.id, parseInitial(element.value, isMulti))

  let body: ReactNode

  if (style === 'filtered') {
    body = <FilteredVariant element={element} inputId={inputId} />
  } else if (style === 'expanded') {
    body = isMulti ? (
      <ExpandedMulti element={element} inputId={inputId} />
    ) : (
      <ExpandedSingle element={element} inputId={inputId} />
    )
  } else {
    body = isMulti ? (
      <CompactMulti element={element} inputId={inputId} />
    ) : (
      <CompactSingle element={element} inputId={inputId} />
    )
  }

  return (
    <InputShell input={element} inputId={inputId}>
      {body}
    </InputShell>
  )
}
