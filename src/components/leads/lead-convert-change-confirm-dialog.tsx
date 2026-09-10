import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

type ConvertTarget = 'company' | 'contact' | 'deal'

export type LeadConvertPendingChange = {
  tab: ConvertTarget;
  label: string;
  sourceText: string;
  targetText: string;
  restore: () => void;
}

interface LeadConvertChangeConfirmDialogProps {
  changes: Array<LeadConvertPendingChange> | null;
  onClose: () => void;
  onRestoreChange: (index: number) => void;
  onConfirm: () => void;
}

export function LeadConvertChangeConfirmDialog({
  changes,
  onClose,
  onRestoreChange,
  onConfirm
}: LeadConvertChangeConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog
      open={changes !== null}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}>
      <AlertDialogContent className="border-border/70 bg-linear-to-br from-background via-background to-muted/30">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('leads.convert.changeConfirm.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('leads.convert.changeConfirm.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div
          className="max-h-72 space-y-2 overflow-y-auto"
          role="list"
          aria-label={t('leads.convert.changeConfirm.title')}>
          <div className="grid items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-md border border-sky-200/70 bg-sky-50/70 px-3 py-2 text-sky-800/80 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200/80">
              {t('leads.convert.mappingHeader.source')}
            </div>
            <ArrowRight
              className="hidden size-3.5 text-muted-foreground/50 sm:block"
              aria-hidden />
            <div className="rounded-md border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-emerald-800/80 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200/80">
              {t('leads.convert.changeConfirm.targetLabel')}
            </div>
          </div>
          {(changes ?? []).map((change, index) => (
            <div
              key={index}
              role="listitem"
              className="rounded-lg border border-border/70 bg-card/85 p-3 text-xs">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="font-medium">{change.label}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto h-6 px-2 text-[10px]"
                  onClick={() => {
                    change.restore()
                    onRestoreChange(index)
                  }}>
                  {t('leads.convert.changeConfirm.restoreButton', {
                    defaultValue: 'Restore'
                  })}
                </Button>
              </div>
              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-md border border-sky-200/70 bg-sky-50/75 px-3 py-2 text-muted-foreground dark:border-sky-900/50 dark:bg-sky-950/20">
                  <p className="truncate text-foreground/80">
                    {change.sourceText || '—'}
                  </p>
                </div>
                <ArrowRight
                  className="hidden size-3.5 text-muted-foreground sm:block"
                  aria-hidden />
                <div className="rounded-md border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <p className="truncate font-medium">
                    {change.targetText || '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {t('leads.convert.changeConfirm.cancelButton')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t('leads.convert.changeConfirm.confirmButton')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
