'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Paperclip,
  Send,
  Strikethrough,
  Underline,
  X,
} from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n'

const emailComposerVariants = cva(
  'flex flex-col overflow-hidden rounded-lg border bg-background',
  {
    variants: {
      variant: {
        default: 'border-input shadow-sm',
        outline: 'border-border',
        minimal: 'border-transparent shadow-none',
      },
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type EmailComposerVariant = 'default' | 'outline' | 'minimal'
export type EmailComposerSize = 'sm' | 'default' | 'lg'

export interface EmailAttachment {
  name: string
  size: number
}

export interface EmailComposerProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof emailComposerVariants> {
  /** Recipient email addresses in the "To" field. */
  to: string[]
  /** Called when the "To" recipients change. */
  onToChange: (to: string[]) => void
  /** Recipient email addresses in the "Cc" field. */
  cc?: string[]
  /** Called when the "Cc" recipients change. */
  onCcChange?: (cc: string[]) => void
  /** Recipient email addresses in the "Bcc" field. */
  bcc?: string[]
  /** Called when the "Bcc" recipients change. */
  onBccChange?: (bcc: string[]) => void
  /** Email subject line. */
  subject: string
  /** Called when the subject line changes. */
  onSubjectChange: (subject: string) => void
  /** Email body text. */
  body: string
  /** Called when the body text changes. */
  onBodyChange: (body: string) => void
  /** Called when the user clicks send. */
  onSend?: () => void
  /** Called when the user clicks attach. */
  onAttach?: () => void
  /** Called when the user clicks discard. */
  onDiscard?: () => void
  /** Whether the email is currently being sent. */
  sending?: boolean
  /** Disables all interactions. */
  disabled?: boolean
  /** List of attached files to display. */
  attachments?: EmailAttachment[]
  /** Called when an attachment is removed. */
  onRemoveAttachment?: (index: number) => void
  /** Whether to show the formatting toolbar. */
  showToolbar?: boolean
  /** Locale for i18n labels. */
  locale?: UiI18nLocale
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface RecipientFieldProps {
  label: string
  recipients: string[]
  onRecipientsChange: (recipients: string[]) => void
  placeholder: string
  disabled: boolean
  size: EmailComposerSize | null | undefined
  suffix?: ReactNode
}

function RecipientField({
  label,
  recipients,
  onRecipientsChange,
  placeholder,
  disabled,
  size,
  suffix,
}: RecipientFieldProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addRecipient = useCallback(
    (value: string) => {
      const trimmed = value.trim()

      if (trimmed && !recipients.includes(trimmed)) {
        onRecipientsChange([...recipients, trimmed])
      }
    },
    [recipients, onRecipientsChange],
  )

  const removeRecipient = useCallback(
    (index: number) => {
      onRecipientsChange(recipients.filter((_, i) => i !== index))
    },
    [recipients, onRecipientsChange],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (
        (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') &&
        inputValue.trim()
      ) {
        e.preventDefault()
        addRecipient(inputValue)
        setInputValue('')
      }

      if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
        removeRecipient(recipients.length - 1)
      }
    },
    [inputValue, recipients, addRecipient, removeRecipient],
  )

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      addRecipient(inputValue)
      setInputValue('')
    }
  }, [inputValue, addRecipient])

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData('text')
      const emails = pasted.split(/[,;\s]+/).filter(Boolean)

      if (emails.length > 1) {
        e.preventDefault()
        const unique = emails.filter(
          (email) => !recipients.includes(email.trim()),
        )

        onRecipientsChange([
          ...recipients,
          ...unique.map((addr) => addr.trim()),
        ])
      }
    },
    [recipients, onRecipientsChange],
  )

  const inputSizeClass =
    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

  return (
    <div
      className="group flex min-h-9 items-start gap-2 px-3 py-1.5"
      onClick={() => inputRef.current?.focus()}
    >
      <span className="shrink-0 pt-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {recipients.map((recipient, index) => (
          <Badge
            key={`${recipient}-${index}`}
            variant={isValidEmail(recipient) ? 'secondary' : 'destructive'}
            className="gap-1 pl-2 pr-1"
          >
            <span className="max-w-45 truncate">{recipient}</span>
            {!disabled && (
              <button
                type="button"
                className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  removeRecipient(index)
                }}
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={recipients.length === 0 ? placeholder : ''}
          disabled={disabled}
          className={cn(
            'min-w-30 flex-1 bg-transparent py-0.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
            inputSizeClass,
          )}
        />
      </div>
      {suffix}
    </div>
  )
}

const EmailComposer = forwardRef<HTMLDivElement, EmailComposerProps>(
  (
    {
      className,
      variant,
      size,
      to,
      onToChange,
      cc,
      onCcChange,
      bcc,
      onBccChange,
      subject,
      onSubjectChange,
      body,
      onBodyChange,
      onSend,
      onAttach,
      onDiscard,
      sending = false,
      disabled = false,
      attachments,
      onRemoveAttachment,
      showToolbar = true,
      locale = 'en',
      ...props
    },
    ref,
  ) => {
    const [showCc, setShowCc] = useState(() => (cc?.length ?? 0) > 0)
    const [showBcc, setShowBcc] = useState(() => (bcc?.length ?? 0) > 0)
    const bodyRef = useRef<HTMLDivElement>(null)
    const lastHtmlRef = useRef(body)

    const isDisabled = disabled || sending

    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())

    const updateActiveFormats = useCallback(() => {
      const formats = new Set<string>()

      if (document.queryCommandState('bold')) formats.add('bold')
      if (document.queryCommandState('italic')) formats.add('italic')
      if (document.queryCommandState('underline')) formats.add('underline')
      if (document.queryCommandState('strikeThrough'))
        formats.add('strikeThrough')
      if (document.queryCommandState('insertUnorderedList'))
        formats.add('insertUnorderedList')
      if (document.queryCommandState('insertOrderedList'))
        formats.add('insertOrderedList')

      setActiveFormats(formats)
    }, [])

    const execFormat = useCallback(
      (command: string, value?: string) => {
        bodyRef.current?.focus()
        document.execCommand(command, false, value)
        updateActiveFormats()
      },
      [updateActiveFormats],
    )

    const savedRangeRef = useRef<Range | null>(null)
    const [linkInputVisible, setLinkInputVisible] = useState(false)
    const [linkUrl, setLinkUrl] = useState('')

    const handleInsertLink = useCallback(() => {
      const selection = window.getSelection()

      if (selection && selection.rangeCount > 0) {
        savedRangeRef.current = selection.getRangeAt(0).cloneRange()
      }

      setLinkUrl('https://')
      setLinkInputVisible(true)
    }, [])

    const confirmLink = useCallback(() => {
      if (!linkUrl.trim()) {
        setLinkInputVisible(false)

        return
      }

      bodyRef.current?.focus()

      if (savedRangeRef.current) {
        const selection = window.getSelection()

        selection?.removeAllRanges()
        selection?.addRange(savedRangeRef.current)
      }

      document.execCommand('createLink', false, linkUrl)
      setLinkInputVisible(false)
      setLinkUrl('')
      savedRangeRef.current = null
    }, [linkUrl])

    const handleBodyInput = useCallback(() => {
      const currentHtml = bodyRef.current?.innerHTML ?? ''

      if (currentHtml !== lastHtmlRef.current) {
        lastHtmlRef.current = currentHtml
        onBodyChange(currentHtml)
      }

      updateActiveFormats()
    }, [onBodyChange, updateActiveFormats])

    useEffect(() => {
      if (!bodyRef.current || body === lastHtmlRef.current) return

      lastHtmlRef.current = body
      bodyRef.current.textContent = ''

      const doc = new DOMParser().parseFromString(body, 'text/html')
      const fragment = document.createDocumentFragment()

      while (doc.body.firstChild) {
        fragment.appendChild(doc.body.firstChild)
      }

      bodyRef.current.appendChild(fragment)
    }, [body])

    const handleSend = useCallback(() => {
      if (!isDisabled && onSend) {
        onSend()
      }
    }, [isDisabled, onSend])

    const canSend = useMemo(
      () => to.length > 0 && subject.trim().length > 0,
      [to, subject],
    )

    const inputSizeClass =
      size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

    const bodySizeClass =
      size === 'sm'
        ? 'min-h-25 text-xs'
        : size === 'lg'
          ? 'min-h-50 text-base'
          : 'min-h-[150px] text-sm'

    const buttonSize =
      size === 'sm'
        ? ('xs' as const)
        : size === 'lg'
          ? ('default' as const)
          : ('sm' as const)

    return (
      <div
        ref={ref}
        className={cn(emailComposerVariants({ variant, size }), className)}
        {...props}
      >
        {/* To field */}
        <RecipientField
          label={tUi(locale, 'ecTo')}
          recipients={to}
          onRecipientsChange={onToChange}
          placeholder={tUi(locale, 'ecRecipientPlaceholder')}
          disabled={isDisabled}
          size={size}
          suffix={
            !showCc || !showBcc ? (
              <div className="flex shrink-0 items-center gap-1 pt-0.5">
                {!showCc && onCcChange && (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCc(true)}
                    disabled={isDisabled}
                  >
                    {tUi(locale, 'ecCc')}
                  </button>
                )}
                {!showBcc && onBccChange && (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setShowBcc(true)}
                    disabled={isDisabled}
                  >
                    {tUi(locale, 'ecBcc')}
                  </button>
                )}
              </div>
            ) : undefined
          }
        />

        {/* Cc field */}
        {showCc && cc && onCcChange && (
          <RecipientField
            label={tUi(locale, 'ecCc')}
            recipients={cc}
            onRecipientsChange={onCcChange}
            placeholder={tUi(locale, 'ecRecipientPlaceholder')}
            disabled={isDisabled}
            size={size}
          />
        )}

        {/* Bcc field */}
        {showBcc && bcc && onBccChange && (
          <RecipientField
            label={tUi(locale, 'ecBcc')}
            recipients={bcc}
            onRecipientsChange={onBccChange}
            placeholder={tUi(locale, 'ecRecipientPlaceholder')}
            disabled={isDisabled}
            size={size}
          />
        )}

        <Separator />

        {/* Subject line */}
        <div className="px-3 py-1.5">
          <input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder={tUi(locale, 'ecSubjectPlaceholder')}
            disabled={isDisabled}
            className={cn(
              'w-full bg-transparent font-medium outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
              inputSizeClass,
            )}
          />
        </div>

        <Separator />

        {/* Formatting toolbar */}
        {showToolbar && (
          <>
            <TooltipProvider>
              <div className="flex items-center gap-0.5 px-2 py-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle
                      size="sm"
                      aria-label={tUi(locale, 'ecBold')}
                      disabled={isDisabled}
                      pressed={activeFormats.has('bold')}
                      onPressedChange={() => execFormat('bold')}
                    >
                      <Bold className="size-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>{tUi(locale, 'ecBold')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle
                      size="sm"
                      aria-label={tUi(locale, 'ecItalic')}
                      disabled={isDisabled}
                      pressed={activeFormats.has('italic')}
                      onPressedChange={() => execFormat('italic')}
                    >
                      <Italic className="size-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>{tUi(locale, 'ecItalic')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle
                      size="sm"
                      aria-label={tUi(locale, 'ecUnderline')}
                      disabled={isDisabled}
                      pressed={activeFormats.has('underline')}
                      onPressedChange={() => execFormat('underline')}
                    >
                      <Underline className="size-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>{tUi(locale, 'ecUnderline')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle
                      size="sm"
                      aria-label={tUi(locale, 'ecStrikethrough')}
                      disabled={isDisabled}
                      pressed={activeFormats.has('strikeThrough')}
                      onPressedChange={() => execFormat('strikeThrough')}
                    >
                      <Strikethrough className="size-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>
                    {tUi(locale, 'ecStrikethrough')}
                  </TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-5" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle
                      size="sm"
                      aria-label={tUi(locale, 'ecBulletedList')}
                      disabled={isDisabled}
                      pressed={activeFormats.has('insertUnorderedList')}
                      onPressedChange={() => execFormat('insertUnorderedList')}
                    >
                      <List className="size-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>
                    {tUi(locale, 'ecBulletedList')}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle
                      size="sm"
                      aria-label={tUi(locale, 'ecOrderedList')}
                      disabled={isDisabled}
                      pressed={activeFormats.has('insertOrderedList')}
                      onPressedChange={() => execFormat('insertOrderedList')}
                    >
                      <ListOrdered className="size-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>
                    {tUi(locale, 'ecOrderedList')}
                  </TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-5" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle
                      size="sm"
                      aria-label={tUi(locale, 'ecInsertLink')}
                      disabled={isDisabled}
                      pressed={linkInputVisible}
                      onPressedChange={handleInsertLink}
                    >
                      <Link2 className="size-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>{tUi(locale, 'ecInsertLink')}</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            {linkInputVisible && (
              <div className="flex items-center gap-1.5 border-t px-2 py-1">
                <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      confirmLink()
                    }
                    if (e.key === 'Escape') {
                      setLinkInputVisible(false)
                      setLinkUrl('')
                    }
                  }}
                  placeholder="https://example.com"
                  autoFocus
                  className={cn(
                    'min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground',
                    inputSizeClass,
                  )}
                />
                <Button variant="ghost" size="icon-sm" onClick={confirmLink}>
                  <Send className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setLinkInputVisible(false)
                    setLinkUrl('')
                  }}
                >
                  <X className="size-3" />
                </Button>
              </div>
            )}
            <Separator />
          </>
        )}

        {/* Email body */}
        <div className="flex-1 px-3 py-2">
          <div
            ref={bodyRef}
            contentEditable={!isDisabled}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-placeholder={tUi(locale, 'ecBodyPlaceholder')}
            onInput={handleBodyInput}
            onKeyUp={updateActiveFormats}
            onMouseUp={updateActiveFormats}
            data-placeholder={tUi(locale, 'ecBodyPlaceholder')}
            className={cn(
              'w-full bg-transparent outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:text-primary [&_a]:underline',
              isDisabled && 'cursor-not-allowed opacity-50',
              bodySizeClass,
            )}
          />
        </div>

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2 px-3 py-2">
              {attachments.map((attachment, index) => (
                <Badge
                  key={`${attachment.name}-${index}`}
                  variant="outline"
                  className="gap-1.5 py-1 pl-2 pr-1"
                >
                  <Paperclip className="size-3 shrink-0" />
                  <span className="max-w-[150px] truncate">
                    {attachment.name}
                  </span>
                  <span className="text-muted-foreground">
                    ({formatFileSize(attachment.size)})
                  </span>
                  {!isDisabled && onRemoveAttachment && (
                    <button
                      type="button"
                      className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100"
                      onClick={() => onRemoveAttachment(index)}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </>
        )}

        <Separator />

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-1">
            {onAttach && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onAttach}
                      disabled={isDisabled}
                      aria-label={tUi(locale, 'ecAttach')}
                    >
                      <Paperclip className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{tUi(locale, 'ecAttach')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onDiscard && (
              <Button
                variant="ghost"
                size={buttonSize}
                onClick={onDiscard}
                disabled={isDisabled}
              >
                {tUi(locale, 'ecCancel')}
              </Button>
            )}
            <Button
              size={buttonSize}
              onClick={handleSend}
              disabled={isDisabled || !canSend}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {sending ? tUi(locale, 'ecSending') : tUi(locale, 'ecSend')}
            </Button>
          </div>
        </div>
      </div>
    )
  },
)

EmailComposer.displayName = 'EmailComposer'

export { EmailComposer, emailComposerVariants }
