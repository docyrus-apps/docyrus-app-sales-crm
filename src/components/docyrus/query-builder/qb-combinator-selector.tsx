'use client'

import { memo, useMemo } from 'react'

import { type CombinatorSelectorProps } from 'react-querybuilder'

import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const QBCombinatorSelector = memo(
  ({
    className,
    handleOnChange,
    options,
    value,
    title,
    disabled,
    testID,
  }: CombinatorSelectorProps) => {
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

    return (
      <ToggleGroup
        type="single"
        variant="outline"
        value={String(value)}
        disabled={disabled}
        onValueChange={(val) => {
          if (val) handleOnChange(val)
        }}
        className={cn('qb-control', className)}
        title={title}
        aria-label="Combinator"
        data-testid={testID}
      >
        {flatOptions.map((opt) => (
          <ToggleGroupItem
            key={opt.name}
            value={opt.name}
            size="sm"
            className="h-7 px-2.5 text-xs font-medium"
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    )
  },
)

QBCombinatorSelector.displayName = 'QBCombinatorSelector'

export { QBCombinatorSelector }
