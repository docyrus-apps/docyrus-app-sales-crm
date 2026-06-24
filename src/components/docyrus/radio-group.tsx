'use client'

// @ts-nocheck
/* eslint-disable */
import { type ComponentPropsWithoutRef, type Ref } from 'react'

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { type VariantProps, cva } from 'class-variance-authority'
import { Check } from 'lucide-react'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { cn } from '@/lib/utils'

export interface RadioGroupOption {
  value: string
  label: string
  description?: string
  icon?: string
  color?: string
  disabled?: boolean
}
const radioGroupVariants = cva('w-full grid', {
  variants: {
    variant: {
      default: 'gap-3',
      card: 'gap-2',
    },
    columnCount: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    },
  },
  defaultVariants: {
    variant: 'default',
    columnCount: 1,
  },
})

export type RadioGroupProps = Omit<
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
  'children'
> &
  VariantProps<typeof radioGroupVariants> & {
    options: RadioGroupOption[]
    ref?: Ref<HTMLDivElement>
  }

function RadioGroup({
  options,
  variant = 'default',
  columnCount = 1,
  className,
  ref,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn(radioGroupVariants({ variant, columnCount }), className)}
      {...props}
    >
      {options.map((option) =>
        variant === 'card' ? (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors',
              'border-input bg-background hover:bg-accent/50',
              'data-[state=checked]:border-primary data-[state=checked]:bg-primary/5',
              'focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <span
              className={cn(
                'relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                'border-muted-foreground/30',
              )}
            >
              <RadioGroupPrimitive.Indicator className="absolute inset-0 flex items-center justify-center rounded-full bg-primary">
                <Check className="size-3 text-primary-foreground" />
              </RadioGroupPrimitive.Indicator>
            </span>
            <div className="flex min-w-0 flex-1 items-start gap-2">
              {option.icon ? (
                <span
                  className="mt-0.5 shrink-0"
                  style={option.color ? { color: option.color } : undefined}
                >
                  <DocyrusIcon icon={option.icon} className="size-4" />
                </span>
              ) : option.color ? (
                <span
                  className="mt-1 size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium leading-5">
                  {option.label}
                </span>
                {option.description && (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-4">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </RadioGroupPrimitive.Item>
        ) : (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              'flex cursor-pointer items-start gap-3 text-left',
              'focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <span
              className={cn(
                'relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                'border-input',
              )}
            >
              <RadioGroupPrimitive.Indicator className="absolute inset-0 flex items-center justify-center rounded-full bg-primary">
                <span className="size-2 rounded-full bg-primary-foreground" />
              </RadioGroupPrimitive.Indicator>
            </span>
            <div className="flex min-w-0 flex-1 items-start gap-1.5">
              {option.icon ? (
                <span
                  className="mt-0.5 shrink-0"
                  style={option.color ? { color: option.color } : undefined}
                >
                  <DocyrusIcon icon={option.icon} className="size-4" />
                </span>
              ) : option.color ? (
                <span
                  className="mt-1.5 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <span className="text-sm font-normal leading-5">
                  {option.label}
                </span>
                {option.description && (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-4">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </RadioGroupPrimitive.Item>
        ),
      )}
    </RadioGroupPrimitive.Root>
  )
}

export { RadioGroup }
