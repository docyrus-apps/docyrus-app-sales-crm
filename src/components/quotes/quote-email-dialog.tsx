import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'

import { EmailComposer } from '@/components/docyrus/email-composer'
import { useDocyrusEmailComposer } from '@/hooks/docyrus/use-docyrus-email-composer'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'

export interface QuoteEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  to?: string;
  subject?: string;
  body?: string;
}

/**
 * Quote email composer — opens as a right-side sidebar (Sheet), not a modal.
 * Wraps the Docyrus `EmailComposer` driven by `useDocyrusEmailComposer`
 * (accounts via `GET /v1/messaging/email/accounts`, send via `…/{accountId}/send`).
 * Shared by the build screen's mail icon and the Quote Detail mail CTA.
 * Backend/account gaps surface inside the composer.
 *
 * @docyrus: [[features#Quotes (Teklif)]]
 */
export function QuoteEmailDialog({
  open,
  onOpenChange,
  to,
  subject,
  body
}: QuoteEmailDialogProps) {
  const { t } = useTranslation()
  const client = useDocyrusClient()

  const composer = useDocyrusEmailComposer({
    client: client!,
    initialTo: to ? [to] : [],
    initialSubject: subject ?? '',
    initialBody: body ?? '',
    enabled: open && !!client
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>
            {t('quotes.sendMail', { defaultValue: 'Send mail' })}
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {client && <EmailComposer {...composer.composerProps} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
