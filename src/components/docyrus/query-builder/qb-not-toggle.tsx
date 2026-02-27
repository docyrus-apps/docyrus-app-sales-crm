'use client'

import { memo, useId } from 'react'

import { type NotToggleProps } from 'react-querybuilder'

import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const QBNotToggle = memo(
  ({
    className,
    handleOnChange,
    title,
    label,
    checked,
    disabled,
    testID,
  }: NotToggleProps) => {
    const id = useId()

    return (
      <div
        className={cn('qb-control flex items-center gap-2', className)}
        title={title}
        data-testid={testID}
      >
        <Switch
          id={id}
          size="sm"
          checked={checked}
          disabled={disabled}
          aria-label={typeof label === 'string' ? label : undefined}
          onCheckedChange={handleOnChange}
        />
        <Label htmlFor={id} className="cursor-pointer text-xs font-medium">
          {label}
        </Label>
      </div>
    )
  },
)

QBNotToggle.displayName = 'QBNotToggle'

export { QBNotToggle }
