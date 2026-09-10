'use client'

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react'

import { Eye, EyeOff } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'
import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

const MASK = '••••••••'

export function PasswordValue({ value, className }: DocyrusValueProps) {
  const { t } = useUiTranslation()
  const [revealed, setRevealed] = useState(false)

  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const display = revealed ? String(value) : MASK

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono truncate',
        className,
      )}
    >
      <span className="truncate select-none">{display}</span>
      <button
        type="button"
        onClick={() => setRevealed((prev) => !prev)}
        aria-label={
          revealed
            ? t('ui.formFields.passwordHide', 'Hide password')
            : t('ui.formFields.passwordShow', 'Show password')
        }
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {revealed ? (
          <EyeOff className="size-3.5" />
        ) : (
          <Eye className="size-3.5" />
        )}
      </button>
    </span>
  )
}
