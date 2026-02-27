'use client'

import { memo, useMemo } from 'react'

import { type VersatileSelectorProps, toArray } from 'react-querybuilder'

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const QBValueSelector = memo(
  ({
    className,
    handleOnChange,
    options,
    value,
    title,
    disabled,
    multiple,
    listsAsArrays,
    testID,
  }: VersatileSelectorProps) => {
    const val = multiple
      ? Array.isArray(value)
        ? value.map(String).join(',')
        : String(value ?? '')
      : String(value ?? '')

    const flatOptions = useMemo(() => {
      const flat: { name: string; label: string }[] = []

      for (const opt of options) {
        if ('options' in opt && Array.isArray(opt.options)) {
          for (const subOpt of opt.options) {
            flat.push({
              name: String(subOpt.name ?? subOpt.value ?? subOpt.label),
              label: String(subOpt.label),
            })
          }
        } else {
          flat.push({
            name: String(
              (opt as { name?: string; value?: string }).name ??
                (opt as { value?: string }).value ??
                opt.label,
            ),
            label: String(opt.label),
          })
        }
      }

      return flat
    }, [options])

    if (multiple) {
      const selectedValues = toArray(value).map(String)

      const handleMultiChange = (newVal: string) => {
        const updated = selectedValues.includes(newVal)
          ? selectedValues.filter((v) => v !== newVal)
          : [...selectedValues, newVal]

        handleOnChange(listsAsArrays ? updated : updated.join(','))
      }

      return (
        <Select
          value={selectedValues[selectedValues.length - 1] || ''}
          disabled={disabled}
          onValueChange={handleMultiChange}
        >
          <SelectTrigger
            className={cn('qb-control h-8 min-w-[120px] text-xs', className)}
            title={title}
            aria-label={title}
            size="sm"
            data-testid={testID}
          >
            <SelectValue placeholder={title}>
              {selectedValues.length > 0
                ? `${selectedValues.length} selected`
                : title}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {flatOptions.map((opt) => (
              <SelectItem key={opt.name} value={opt.name}>
                {selectedValues.includes(opt.name)
                  ? `✓ ${opt.label}`
                  : opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Select value={val} disabled={disabled} onValueChange={handleOnChange}>
        <SelectTrigger
          className={cn('qb-control h-8 min-w-[120px] text-xs', className)}
          title={title}
          aria-label={title}
          size="sm"
          data-testid={testID}
        >
          <SelectValue placeholder={title} />
        </SelectTrigger>
        <SelectContent>
          {flatOptions.map((opt) => (
            <SelectItem key={opt.name} value={opt.name}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  },
)

QBValueSelector.displayName = 'QBValueSelector'

export { QBValueSelector }
