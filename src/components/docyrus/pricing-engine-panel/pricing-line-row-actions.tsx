'use client'

import { Copy, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { tUi } from '@/lib/ui-i18n'

import { usePricingEngine } from './contexts/pricing-context'

interface PricingLineRowActionsProps {
  lineId: string
}

export function PricingLineRowActions({ lineId }: PricingLineRowActionsProps) {
  const { removeLineItem, duplicateLineItem, readOnly, locale } =
    usePricingEngine()

  if (readOnly) return null

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => duplicateLineItem(lineId)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tUi(locale, 'pepDuplicateLine')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => removeLineItem(lineId)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tUi(locale, 'pepDeleteLine')}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
