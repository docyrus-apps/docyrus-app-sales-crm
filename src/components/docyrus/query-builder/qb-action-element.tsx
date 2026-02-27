'use client'

import { memo } from 'react'

import { type ActionProps } from 'react-querybuilder'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const QBActionElement = memo(
  ({
    className,
    handleOnClick,
    label,
    title,
    disabled,
    disabledTranslation,
    testID,
    validation,
  }: ActionProps) => {
    const resolvedTitle =
      disabledTranslation && disabled ? disabledTranslation.title : title
    const resolvedLabel =
      disabledTranslation && disabled ? disabledTranslation.label : label

    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          'qb-control h-8 gap-1 text-xs',
          validation === false && 'border-destructive text-destructive',
          className,
        )}
        title={resolvedTitle}
        aria-label={resolvedTitle}
        disabled={disabled}
        onClick={(e) => handleOnClick(e)}
        data-testid={testID}
      >
        {resolvedLabel}
      </Button>
    )
  },
)

QBActionElement.displayName = 'QBActionElement'

export { QBActionElement }
