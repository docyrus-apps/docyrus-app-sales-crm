'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { tUi } from '@/lib/ui-i18n'

import { usePricingEngine } from './contexts/pricing-context'

interface PricingActionsBarProps {
  showActions?: boolean
}

export function PricingActionsBar({
  showActions = true,
}: PricingActionsBarProps) {
  const { save, saveDraft, readOnly, locale } = usePricingEngine()

  if (!showActions || readOnly) return null

  return (
    <>
      <Separator />
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <Button variant="outline" onClick={saveDraft}>
          {tUi(locale, 'pepSaveDraft')}
        </Button>
        <Button onClick={save}>{tUi(locale, 'pepSave')}</Button>
      </div>
    </>
  )
}
