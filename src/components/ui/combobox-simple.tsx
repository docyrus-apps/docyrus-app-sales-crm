import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EnumOptionDisplay } from '@/components/docyrus/form-fields/lib/enum-option-display'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface ComboboxOption {
  /**
   * Display text. Typed as required, but callers map it straight off
   * `any`-shaped records, so a record with an empty name can still deliver
   * null — hence the runtime guards below.
   */
  label: string
  value: string
  color?: string | null
  icon?: string | null
}

interface ComboboxProps {
  options: Array<ComboboxOption>
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  contentClassName?: string
  disabled?: boolean
  disabledValues?: Array<string>
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select option...',
  searchPlaceholder,
  emptyText = 'No option found.',
  className,
  contentClassName,
  disabled,
  disabledValues = [],
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const disabledValueSet = React.useMemo(
    () => new Set(disabledValues),
    [disabledValues],
  )

  const selectedOption = options.find((option) => option.value === value)

  /*
   * cmdk calls `.trim()` on every entry it receives through `keywords`, so a
   * null label crashed the whole form the moment the dropdown opened
   * ("Cannot read properties of null (reading 'trim')"). Normalize the label
   * once and only pass keywords when there is real text to match on.
   */
  const optionLabel = (option: ComboboxOption): string => option.label ?? ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
          disabled={disabled}
        >
          {selectedOption ? (
            <EnumOptionDisplay
              option={{
                id: selectedOption.value,
                name: optionLabel(selectedOption),
                color: selectedOption.color ?? undefined,
                icon: selectedOption.icon ?? undefined,
              }}
              variant={
                selectedOption.color || selectedOption.icon ? 'chip' : 'inline'
              }
              className="min-w-0 max-w-full"
            />
          ) : (
            <span className="min-w-0 truncate text-muted-foreground">
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-(--radix-popover-trigger-width) min-w-[16rem] max-h-[min(22rem,var(--radix-popover-content-available-height))] overflow-hidden p-0',
          contentClassName,
        )}
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={
              searchPlaceholder || `Search ${placeholder.toLowerCase()}...`
            }
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isOptionDisabled = disabledValueSet.has(option.value)
                const label = optionLabel(option)

                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={label ? [label] : undefined}
                    disabled={isOptionDisabled}
                    onSelect={(currentValue) => {
                      if (isOptionDisabled) return
                      onValueChange?.(
                        currentValue === value ? '' : currentValue,
                      )
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <EnumOptionDisplay
                      option={{
                        id: option.value,
                        name: label,
                        color: option.color ?? undefined,
                        icon: option.icon ?? undefined,
                      }}
                      variant={option.color || option.icon ? 'chip' : 'inline'}
                      className="min-w-0 max-w-full"
                    />
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
