'use client'

import { type ReactNode, useCallback, useEffect, useState } from 'react'

import { Loader2, ShieldAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

import { MorphPopover } from '@/components/docyrus/morph-popover'

const DEFAULT_COUNTDOWN_SECONDS = 6
const MIN_COUNTDOWN_SECONDS = 1
const COUNTDOWN_STEP_MS = 100
const DEFAULT_TRIGGER_WIDTH = 120

const BUTTON_HEIGHT_BY_SIZE: Record<ButtonSize, number> = {
  default: 36,
  xs: 24,
  sm: 32,
  lg: 40,
  icon: 36,
  'icon-xs': 24,
  'icon-sm': 32,
  'icon-lg': 40,
}

const ICON_BUTTON_SIZES: ButtonSize[] = [
  'icon',
  'icon-xs',
  'icon-sm',
  'icon-lg',
]

type ButtonVariant =
  | 'default'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'link'
type ButtonSize =
  | 'default'
  | 'xs'
  | 'sm'
  | 'lg'
  | 'icon'
  | 'icon-xs'
  | 'icon-sm'
  | 'icon-lg'

export interface ConfirmationButtonProps {
  children: ReactNode
  onConfirm: () => void | Promise<void>
  confirmationTitle?: ReactNode
  confirmationMessage?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  countdownSeconds?: number
  disabled?: boolean
  onCancel?: () => void
  onTimeout?: () => void
  className?: string
  triggerClassName?: string
  contentClassName?: string
  side?: 'top' | 'bottom'
  sideOffset?: number
  contentWidth?: number
  triggerSize?: number
  triggerWidth?: number
  triggerHeight?: number
  triggerRadius?: number
  speed?: number
  bgClassName?: string
  buttonVariant?: ButtonVariant
  buttonSize?: ButtonSize
}

function ConfirmationButton({
  children,
  onConfirm,
  confirmationTitle = 'Are you sure?',
  confirmationMessage = 'Please confirm before this action is executed.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  countdownSeconds = DEFAULT_COUNTDOWN_SECONDS,
  disabled = false,
  onCancel,
  onTimeout,
  className,
  triggerClassName,
  contentClassName,
  side = 'top',
  sideOffset,
  contentWidth = 320,
  triggerSize,
  triggerWidth,
  triggerHeight,
  triggerRadius,
  speed,
  bgClassName,
  buttonVariant = 'destructive',
  buttonSize = 'default',
}: ConfirmationButtonProps) {
  const safeCountdownSeconds = Math.max(MIN_COUNTDOWN_SECONDS, countdownSeconds)
  const totalMs = safeCountdownSeconds * 1000

  const [isOpen, setIsOpen] = useState(false)
  const [remainingMs, setRemainingMs] = useState(totalMs)
  const [isConfirming, setIsConfirming] = useState(false)

  const isWaitingForConfirmation = isOpen && !isConfirming
  const isBlocked = disabled || isWaitingForConfirmation || isConfirming
  const isIconButtonSize = ICON_BUTTON_SIZES.includes(buttonSize)
  const resolvedTriggerHeight =
    triggerHeight ?? triggerSize ?? BUTTON_HEIGHT_BY_SIZE[buttonSize]
  const resolvedTriggerWidth =
    triggerWidth ??
    triggerSize ??
    (isIconButtonSize ? resolvedTriggerHeight : DEFAULT_TRIGGER_WIDTH)
  const resolvedTriggerRadius =
    triggerRadius ??
    (isIconButtonSize ? Math.round(resolvedTriggerHeight / 2) : 6)
  const secondsLeft = Math.max(
    MIN_COUNTDOWN_SECONDS,
    Math.ceil(remainingMs / 1000),
  )
  const progressValue = Math.max(
    0,
    Math.min(100, (remainingMs / totalMs) * 100),
  )

  useEffect(() => {
    if (!isOpen) {
      setRemainingMs(totalMs)
    }
  }, [isOpen, totalMs])

  useEffect(() => {
    if (!isOpen || isConfirming) {
      return
    }

    const startedAt = Date.now()
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextRemaining = Math.max(totalMs - elapsed, 0)

      setRemainingMs(nextRemaining)

      if (nextRemaining === 0) {
        window.clearInterval(intervalId)
        setIsOpen(false)
        onCancel?.()
        onTimeout?.()
      }
    }, COUNTDOWN_STEP_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isOpen, isConfirming, onCancel, onTimeout, totalMs])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isConfirming) {
        return
      }

      if (nextOpen && disabled) {
        return
      }

      if (!nextOpen && isOpen) {
        onCancel?.()
      }

      setIsOpen(nextOpen)
    },
    [disabled, isConfirming, isOpen, onCancel],
  )

  const handleCancel = useCallback(() => {
    if (isConfirming) {
      return
    }

    setIsOpen(false)
    onCancel?.()
  }, [isConfirming, onCancel])

  const handleConfirm = useCallback(async () => {
    if (isConfirming) {
      return
    }

    setIsConfirming(true)

    try {
      await onConfirm()
      setIsOpen(false)
    } finally {
      setIsConfirming(false)
    }
  }, [isConfirming, onConfirm])

  return (
    <MorphPopover
      trigger={children}
      triggerWidth={resolvedTriggerWidth}
      triggerHeight={resolvedTriggerHeight}
      triggerRadius={resolvedTriggerRadius}
      triggerClassName={cn(
        buttonVariants({
          variant: buttonVariant,
          size: buttonSize,
        }),
        triggerClassName,
      )}
      disabled={isBlocked}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      side={side}
      sideOffset={sideOffset}
      contentWidth={contentWidth}
      speed={speed}
      bgClassName={bgClassName}
      contentClassName={cn('w-full text-sm', contentClassName)}
      className={className}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 opacity-85" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">{confirmationTitle}</p>
            <p className="text-xs text-white/80 dark:text-black/70">
              {confirmationMessage}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20 dark:bg-black/15">
            <div
              className="h-full bg-white transition-[width] duration-100 ease-linear dark:bg-black"
              style={{ width: `${String(progressValue)}%` }}
            />
          </div>
          <p className="text-[11px] text-white/80 dark:text-black/70">
            Auto-cancel in {secondsLeft}s
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isConfirming}
            className="rounded-md bg-white/15 px-2.5 py-1 text-xs transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-black/10 dark:hover:bg-black/20"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              void handleConfirm()
            }}
            disabled={isConfirming}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-black dark:text-white dark:hover:bg-black/90"
          >
            {isConfirming ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Confirming...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </MorphPopover>
  )
}

export { ConfirmationButton }
export default ConfirmationButton
