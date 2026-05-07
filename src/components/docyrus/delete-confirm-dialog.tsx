'use client'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n'

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectName: string
  count: number
  onConfirm: () => void | Promise<void>
  isPending?: boolean
  locale?: UiI18nLocale
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  objectName,
  count,
  onConfirm,
  isPending,
  locale = 'en',
}: DeleteConfirmDialogProps) {
  const pluralSuffix = count === 1 ? '' : 's'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {objectName}
            {pluralSuffix}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {count} {objectName}
            {pluralSuffix}. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tUi(locale, 'cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? tUi(locale, 'deleting') : tUi(locale, 'delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
