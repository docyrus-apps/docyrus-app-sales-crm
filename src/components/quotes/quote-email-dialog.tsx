import { useCallback, useEffect, useState } from 'react'

import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import { toast } from 'sonner'
import { Loader2, Paperclip } from 'lucide-react'

import { EmailComposer } from '@/components/docyrus/email-composer'
import { useDocyrusEmailComposer } from '@/hooks/docyrus/use-docyrus-email-composer'
import { uploadRecordFile } from '@/components/quotes/quote-pdf'
import { cn } from '@/lib/utils'
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
  /** Record the generated PDF is stored on before it is emailed. */
  recordId?: string;
  appSlug?: string;
  dataSource?: string;
  /**
   * Produces the quote PDF to attach. When omitted (or without `recordId`),
   * the mail is sent with no attachment.
   */
  getAttachment?: () => Promise<File | null>;
  /** Display name shown in the attachment row. */
  attachmentName?: string;
}

/**
 * Quote email composer — opens as a right-side sidebar (Sheet), not a modal.
 * Wraps the Docyrus `EmailComposer` driven by `useDocyrusEmailComposer`
 * (accounts via `GET /v1/messaging/email/accounts`, send via `…/{accountId}/send`).
 *
 * When `getAttachment` + `recordId` are supplied, pressing Send first compiles
 * the quote PDF, uploads it to the record's files (tenant bucket), then sends
 * the mail with that stored file as an attachment. Shared by the build screen's
 * Send button and the Quote Detail mail action.
 *
 * @docyrus: [[features#Quotes (Teklif)]]
 */
export function QuoteEmailDialog({
  open,
  onOpenChange,
  to,
  subject,
  body,
  recordId,
  appSlug = 'base_crm',
  dataSource = 'sales_order',
  getAttachment,
  attachmentName
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

  const attachmentEnabled = !!getAttachment && !!recordId
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset transient send state whenever the sheet closes.
  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  const handleSend = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      let attachments:
        | Array<{ filePath: string; fileName: string; mimeType: string }>
        | undefined

      if (attachmentEnabled && client && recordId) {
        const file = await getAttachment()

        if (file) {
          const uploaded = await uploadRecordFile(client, {
            appSlug,
            dataSource,
            recordId,
            file
          })

          attachments = [
            {
              filePath: uploaded.filePath,
              fileName: uploaded.fileName,
              mimeType: uploaded.mimeType
            }
          ]
        }
      }

      await composer.send(attachments ? { attachments } : undefined)
      toast.success(
        t('quotes.mailSent', { defaultValue: 'E-posta gönderildi' })
      )
      onOpenChange(false)
    } catch (e: any) {
      const message =
        e?.message ||
        t('quotes.mailFailed', { defaultValue: 'E-posta gönderilemedi' })

      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }, [
    submitting,
    attachmentEnabled,
    client,
    recordId,
    getAttachment,
    appSlug,
    dataSource,
    composer,
    onOpenChange,
    t
  ])

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
        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
          {client && (
            <EmailComposer
              {...composer.composerProps}
              onSend={handleSend}
              sending={composer.composerProps.sending || submitting} />
          )}

          {attachmentEnabled && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-md border px-3 py-2 text-xs',
                error
                  ? 'border-destructive/40 bg-destructive/5 text-destructive'
                  : 'bg-muted/30 text-muted-foreground'
              )}>
              {submitting ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" />
              ) : (
                <Paperclip className="size-3.5 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate text-foreground">
                {attachmentName ??
                  t('quotes.attachmentName', { defaultValue: 'Teklif.pdf' })}
              </span>
              <span className="shrink-0">
                {error
                  ? t('quotes.attachmentFailed', { defaultValue: 'Eklenemedi' })
                  : submitting
                    ? t('quotes.attachmentPreparing', {
                        defaultValue: 'Hazırlanıyor…'
                      })
                    : t('quotes.attachmentWillAttach', {
                        defaultValue: 'PDF olarak eklenecek'
                      })}
              </span>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}
