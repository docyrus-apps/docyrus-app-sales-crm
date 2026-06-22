'use client';

// @ts-nocheck
/* eslint-disable */
import {
  useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type HTMLAttributes, type KeyboardEvent, type ReactNode, type Ref
} from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import {
  Bold,
  ChevronDown,
  FileSignature,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Mail,
  Paperclip,
  Send,
  Strikethrough,
  Underline,
  X
} from 'lucide-react';

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';
const emailComposerVariants = cva(
  'flex flex-col overflow-hidden rounded-lg border bg-background',
  {
    variants: {
      variant: {
        default: 'border-input shadow-sm',
        outline: 'border-border',
        minimal: 'border-transparent shadow-none'
      },
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export type EmailComposerVariant = 'default' | 'outline' | 'minimal';
export type EmailComposerSize = 'sm' | 'default' | 'lg';

export interface EmailAttachment {
  name: string;
  size: number;
}

export interface EmailComposerAccount {
  /** Stable account id (used by `selectedAccountId`). */
  id: string;
  /** Account display name (e.g. "Sales Outbound" or provider name for user mailboxes). */
  name: string | null;
  /** Sender address shown in the From row. */
  senderEmail: string | null;
  /** Sender display name (falls back to `name` when omitted). */
  senderName?: string | null;
  /** Shared tenant account vs. the caller's own connected mailbox. */
  kind?: 'tenant' | 'user';
  /**
   * Sending provider (e.g. `gmail`, `microsoft-graph`, `aws`, `smtp`). Drives the
   * brand icon shown in the From list — Google / Microsoft / AWS get their brand
   * mark, every other provider falls back to a generic mail icon.
   */
  provider?: string | null;
  /** When `false`, the account is hidden from the From list. */
  isUserAccessible?: boolean;
}

export interface EmailComposerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>,
  VariantProps<typeof emailComposerVariants> {
  ref?: Ref<HTMLDivElement>;
  /** Sender accounts the user can pick between. When omitted, the From row is hidden. */
  accounts?: EmailComposerAccount[];
  /** Currently selected account id. */
  selectedAccountId?: string | null;
  /** Called when the user picks an account from the From dropdown. */
  onSelectedAccountChange?: (accountId: string) => void;
  /** Recipient email addresses in the "To" field. */
  to: string[];
  /** Called when the "To" recipients change. */
  onToChange: (to: string[]) => void;
  /** Recipient email addresses in the "Cc" field. */
  cc?: string[];
  /** Called when the "Cc" recipients change. */
  onCcChange?: (cc: string[]) => void;
  /** Recipient email addresses in the "Bcc" field. */
  bcc?: string[];
  /** Called when the "Bcc" recipients change. */
  onBccChange?: (bcc: string[]) => void;
  /** Email subject line. */
  subject: string;
  /** Called when the subject line changes. */
  onSubjectChange: (subject: string) => void;
  /** Email body text. */
  body: string;
  /** Called when the body text changes. */
  onBodyChange: (body: string) => void;
  /** Called when the user clicks send. */
  onSend?: () => void;
  /** Called when the user clicks attach. */
  onAttach?: () => void;
  /** Called when the user clicks discard. */
  onDiscard?: () => void;
  /** Whether the email is currently being sent. */
  sending?: boolean;
  /** Disables all interactions. */
  disabled?: boolean;
  /** List of attached files to display. */
  attachments?: EmailAttachment[];
  /** Called when an attachment is removed. */
  onRemoveAttachment?: (index: number) => void;
  /** Whether to show the formatting toolbar. */
  showToolbar?: boolean;
  /** HTML content of the email signature. */
  signature?: string;
  /** Called when the signature content changes. When provided, the signature area becomes editable. */
  onSignatureChange?: (signature: string) => void;
  /** Whether the signature is visible. Defaults to true when signature is provided. */
  signatureVisible?: boolean;
  /** Called when the user toggles signature visibility. */
  onSignatureVisibleChange?: (visible: boolean) => void;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAccountInitials(account: EmailComposerAccount): string {
  const source = account.senderName?.trim() || account.name?.trim() || account.senderEmail?.trim() || '';

  if (!source) return '?';

  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? source;
  const last = parts.length > 1 ? parts[parts.length - 1] ?? '' : '';

  if (!last) return first.slice(0, 2).toUpperCase();

  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

/** Maps known sending providers to their Font Awesome brand icon. */
const PROVIDER_BRAND_ICONS: Record<string, string> = {
  gmail: 'fab google',
  google: 'fab google',
  'microsoft-graph': 'fab microsoft',
  microsoft: 'fab microsoft',
  outlook: 'fab microsoft',
  aws: 'fab aws',
  ses: 'fab aws'
};

function AccountProviderIcon({ provider, className }: { provider?: string | null; className?: string }) {
  const brand = provider ? PROVIDER_BRAND_ICONS[provider.toLowerCase().trim()] : undefined;

  if (brand) {
    return <DocyrusIcon icon={brand} size="xs" className={cn('shrink-0', className)} />;
  }

  return <Mail className={cn('size-3 shrink-0 text-muted-foreground', className)} />;
}

interface FromFieldProps {
  label: string;
  accounts: EmailComposerAccount[];
  selectedAccountId: string | null | undefined;
  onSelectedAccountChange: ((accountId: string) => void) | undefined;
  placeholder: string;
  disabled: boolean;
  size: EmailComposerSize | null | undefined;
}

function FromField({
  label,
  accounts,
  selectedAccountId,
  onSelectedAccountChange,
  placeholder,
  disabled,
  size
}: FromFieldProps) {
  const selectedAccount = accounts.find(account => account.id === selectedAccountId) ?? null;
  const inputSizeClass
    = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const hasMultipleAccounts = accounts.length > 1;
  const isInteractive = !disabled && hasMultipleAccounts && Boolean(onSelectedAccountChange);

  const trigger = (
    <button
      type="button"
      disabled={!isInteractive}
      className={cn(
        'group flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-0.5 outline-none transition-colors',
        isInteractive && 'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
        !isInteractive && 'cursor-default'
      )}>
      {selectedAccount ? (
        <>
          <Avatar size="sm" className="size-5">
            <AvatarFallback className="text-[10px]">
              {getAccountInitials(selectedAccount)}
            </AvatarFallback>
          </Avatar>
          <AccountProviderIcon provider={selectedAccount.provider} />
          <span className={cn('min-w-0 truncate font-medium', inputSizeClass)}>
            {selectedAccount.senderName || selectedAccount.name || selectedAccount.senderEmail || '—'}
          </span>
          {selectedAccount.senderEmail && (
            <span className={cn('min-w-0 truncate text-muted-foreground', inputSizeClass)}>
              {`<${selectedAccount.senderEmail}>`}
            </span>
          )}
        </>
      ) : (
        <span className={cn('text-muted-foreground', inputSizeClass)}>{placeholder}</span>
      )}
      {hasMultipleAccounts && (
        <ChevronDown
          className={cn(
            'ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform',
            isInteractive && 'group-data-[state=open]:rotate-180'
          )} />
      )}
    </button>
  );

  return (
    <div className="flex min-h-9 items-start gap-2 px-3 py-1.5">
      <span className="shrink-0 pt-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center pt-0.5">
        {isInteractive ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[280px]">
              {accounts.map(account => (
                <DropdownMenuItem
                  key={account.id}
                  onSelect={() => onSelectedAccountChange?.(account.id)}
                  className="flex items-start gap-2 py-2">
                  <Avatar size="sm" className="mt-0.5 size-6">
                    <AvatarFallback className="text-[10px]">
                      {getAccountInitials(account)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-1.5">
                      <AccountProviderIcon provider={account.provider} />
                      <span className="truncate text-sm font-medium">
                        {account.senderName || account.name || account.senderEmail || '—'}
                      </span>
                    </div>
                    {account.senderEmail && (
                      <span className="truncate text-xs text-muted-foreground">
                        {account.senderEmail}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          trigger
        )}
      </div>
    </div>
  );
}

interface RecipientFieldProps {
  label: string;
  recipients: string[];
  onRecipientsChange: (recipients: string[]) => void;
  placeholder: string;
  disabled: boolean;
  size: EmailComposerSize | null | undefined;
  suffix?: ReactNode;
}

function RecipientField({
  label,
  recipients,
  onRecipientsChange,
  placeholder,
  disabled,
  size,
  suffix
}: RecipientFieldProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addRecipient = useCallback(
    (value: string) => {
      const trimmed = value.trim();

      if (trimmed && !recipients.includes(trimmed)) {
        onRecipientsChange([...recipients, trimmed]);
      }
    },
    [recipients, onRecipientsChange]
  );

  const removeRecipient = useCallback(
    (index: number) => {
      onRecipientsChange(recipients.filter((_, i) => i !== index));
    },
    [recipients, onRecipientsChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (
        (e.key === 'Enter' || e.key === 'Tab' || e.key === ',')
        && inputValue.trim()
      ) {
        e.preventDefault();
        addRecipient(inputValue);
        setInputValue('');
      }

      if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
        removeRecipient(recipients.length - 1);
      }
    },
    [
      inputValue,
      recipients,
      addRecipient,
      removeRecipient
    ]
  );

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      addRecipient(inputValue);
      setInputValue('');
    }
  }, [inputValue, addRecipient]);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData('text');
      const emails = pasted.split(/[,;\s]+/).filter(Boolean);

      if (emails.length > 1) {
        e.preventDefault();
        const unique = emails.filter(email => !recipients.includes(email.trim()));

        onRecipientsChange([...recipients, ...unique.map(addr => addr.trim())]);
      }
    },
    [recipients, onRecipientsChange]
  );

  const inputSizeClass
    = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div
      className="group flex min-h-9 items-start gap-2 px-3 py-1.5"
      onClick={() => inputRef.current?.focus()}>
      <span className="shrink-0 pt-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {recipients.map((recipient, index) => (
          <Badge
            key={recipient}
            variant={isValidEmail(recipient) ? 'secondary' : 'destructive'}
            className="gap-1 pl-2 pr-1">
            <span className="max-w-45 truncate">{recipient}</span>
            {!disabled && (
              <button
                type="button"
                className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecipient(index);
                }}>
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={recipients.length === 0 ? placeholder : ''}
          disabled={disabled}
          className={cn(
            'min-w-30 flex-1 bg-transparent py-0.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
            inputSizeClass
          )} />
      </div>
      {suffix}
    </div>
  );
}

function EmailComposer({
  className,
  variant,
  size,
  accounts,
  selectedAccountId,
  onSelectedAccountChange,
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
  signature,
  onSignatureChange,
  signatureVisible,
  onSignatureVisibleChange, ref, ...props
}: EmailComposerProps) {
  const { t } = useUiTranslation();
  const [showCc, setShowCc] = useState(() => (cc?.length ?? 0) > 0);
  const [showBcc, setShowBcc] = useState(() => (bcc?.length ?? 0) > 0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef(body);
  const lastSignatureHtmlRef = useRef(signature ?? '');
  const lastActiveEditorRef = useRef<HTMLDivElement | null>(null);
  const signatureImageInputRef = useRef<HTMLInputElement>(null);
  const savedSignatureRangeRef = useRef<Range | null>(null);

  const isDisabled = disabled || sending;
  const isSignatureVisible = signatureVisible !== false;

  const visibleAccounts = useMemo(
    () => accounts?.filter(account => account.isUserAccessible !== false) ?? [],
    [accounts]
  );

  const [activeFormats, setActiveFormats] = useState<Set<string>>(() => new Set());

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();

    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('strikeThrough')) formats.add('strikeThrough');
    if (document.queryCommandState('insertUnorderedList')) formats.add('insertUnorderedList');
    if (document.queryCommandState('insertOrderedList')) formats.add('insertOrderedList');

    setActiveFormats(formats);
  }, []);

  const execFormat = useCallback((command: string, value?: string) => {
    const target = lastActiveEditorRef.current ?? bodyRef.current;

    target?.focus();
    document.execCommand(command, false, value);
    updateActiveFormats();
  }, [updateActiveFormats]);

  const savedRangeRef = useRef<Range | null>(null);
  const [linkInputVisible, setLinkInputVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const handleInsertLink = useCallback(() => {
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }

    setLinkUrl('https://');
    setLinkInputVisible(true);
  }, []);

  const confirmLink = useCallback(() => {
    if (!linkUrl.trim()) {
      setLinkInputVisible(false);

      return;
    }

    const target = lastActiveEditorRef.current ?? bodyRef.current;

    target?.focus();

    if (savedRangeRef.current) {
      const selection = window.getSelection();

      selection?.removeAllRanges();
      selection?.addRange(savedRangeRef.current);
    }

    document.execCommand('createLink', false, linkUrl);
    setLinkInputVisible(false);
    setLinkUrl('');
    savedRangeRef.current = null;
  }, [linkUrl]);

  const handleBodyInput = useCallback(() => {
    const currentHtml = bodyRef.current?.innerHTML ?? '';

    if (currentHtml !== lastHtmlRef.current) {
      lastHtmlRef.current = currentHtml;
      onBodyChange(currentHtml);
    }

    updateActiveFormats();
  }, [onBodyChange, updateActiveFormats]);

  useEffect(() => {
    if (!bodyRef.current || body === lastHtmlRef.current) return;

    lastHtmlRef.current = body;
    bodyRef.current.textContent = '';

    const doc = new DOMParser().parseFromString(body, 'text/html');
    const fragment = document.createDocumentFragment();

    while (doc.body.firstChild) {
      fragment.appendChild(doc.body.firstChild);
    }

    bodyRef.current.appendChild(fragment);
  }, [body]);

  useEffect(() => {
    if (!signatureRef.current || (signature ?? '') === lastSignatureHtmlRef.current) return;

    lastSignatureHtmlRef.current = signature ?? '';
    signatureRef.current.textContent = '';

    if (signature) {
      const doc = new DOMParser().parseFromString(signature, 'text/html');
      const fragment = document.createDocumentFragment();

      while (doc.body.firstChild) {
        fragment.appendChild(doc.body.firstChild);
      }

      signatureRef.current.appendChild(fragment);
    }
  }, [signature]);

  const handleSignatureInput = useCallback(() => {
    if (!onSignatureChange) return;

    const currentHtml = signatureRef.current?.innerHTML ?? '';

    if (currentHtml !== lastSignatureHtmlRef.current) {
      lastSignatureHtmlRef.current = currentHtml;
      onSignatureChange(currentHtml);
    }
  }, [onSignatureChange]);

  const saveSignatureSelection = useCallback(() => {
    const sel = window.getSelection();

    if (sel && sel.rangeCount > 0 && signatureRef.current?.contains(sel.getRangeAt(0).startContainer)) {
      savedSignatureRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const handleSignatureImage = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || !signatureRef.current) return;

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = document.createElement('img');

      img.src = dataUrl;
      img.alt = file.name;

      signatureRef.current?.focus();

      if (savedSignatureRangeRef.current) {
        const selection = window.getSelection();

        selection?.removeAllRanges();
        selection?.addRange(savedSignatureRangeRef.current);

        const range = savedSignatureRangeRef.current;

        range.deleteContents();
        range.insertNode(img);
        range.collapse(false);
        savedSignatureRangeRef.current = null;
      } else {
        signatureRef.current?.appendChild(img);
      }

      handleSignatureInput();
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  }, [handleSignatureInput]);

  const handleSend = useCallback(() => {
    if (!isDisabled && onSend) {
      onSend();
    }
  }, [isDisabled, onSend]);

  const canSend = useMemo(
    () => to.length > 0 && subject.trim().length > 0,
    [to, subject]
  );

  const inputSizeClass
    = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  const bodySizeClass
    = size === 'sm' ? 'min-h-25 text-xs' : size === 'lg' ? 'min-h-50 text-base' : 'min-h-[150px] text-sm';

  const buttonSize = size === 'sm' ? 'xs' as const : size === 'lg' ? 'default' as const : 'sm' as const;

  return (
    <div
      ref={ref}
      className={cn(emailComposerVariants({ variant, size }), className)}
      {...props}>
      {/* From field */}
      {visibleAccounts.length > 0 && (
        <>
          <FromField
            label={t('ui.emailComposer.from', 'From')}
            accounts={visibleAccounts}
            selectedAccountId={selectedAccountId}
            onSelectedAccountChange={onSelectedAccountChange}
            placeholder={t('ui.emailComposer.selectAccount', 'Select an account...')}
            disabled={isDisabled}
            size={size} />
          <Separator />
        </>
      )}

      {/* To field */}
      <RecipientField
        label={t('ui.emailComposer.to', 'To')}
        recipients={to}
        onRecipientsChange={onToChange}
        placeholder={t('ui.emailComposer.recipientPlaceholder', 'Add recipients...')}
        disabled={isDisabled}
        size={size}
        suffix={
          (!showCc || !showBcc) ? (
            <div className="flex shrink-0 items-center gap-1 pt-0.5">
              {!showCc && onCcChange && (
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCc(true)}
                  disabled={isDisabled}>
                  {t('ui.emailComposer.cc', 'Cc')}
                </button>
              )}
              {!showBcc && onBccChange && (
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setShowBcc(true)}
                  disabled={isDisabled}>
                  {t('ui.emailComposer.bcc', 'Bcc')}
                </button>
              )}
            </div>
          ) : undefined
        } />

      {/* Cc field */}
      {showCc && cc && onCcChange && (
        <RecipientField
          label={t('ui.emailComposer.cc', 'Cc')}
          recipients={cc}
          onRecipientsChange={onCcChange}
          placeholder={t('ui.emailComposer.recipientPlaceholder', 'Add recipients...')}
          disabled={isDisabled}
          size={size} />
      )}

      {/* Bcc field */}
      {showBcc && bcc && onBccChange && (
        <RecipientField
          label={t('ui.emailComposer.bcc', 'Bcc')}
          recipients={bcc}
          onRecipientsChange={onBccChange}
          placeholder={t('ui.emailComposer.recipientPlaceholder', 'Add recipients...')}
          disabled={isDisabled}
          size={size} />
      )}

      <Separator />

      {/* Subject line */}
      <div className="px-3 py-1.5">
        <input
          type="text"
          value={subject}
          onChange={e => onSubjectChange(e.target.value)}
          placeholder={t('ui.emailComposer.subjectPlaceholder', 'Enter subject...')}
          disabled={isDisabled}
          className={cn(
            'w-full bg-transparent font-medium outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
            inputSizeClass
          )} />
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
                    aria-label={t('ui.emailComposer.bold', 'Bold')}
                    disabled={isDisabled}
                    pressed={activeFormats.has('bold')}
                    onPressedChange={() => execFormat('bold')}>
                    <Bold className="size-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>{t('ui.emailComposer.bold', 'Bold')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    aria-label={t('ui.emailComposer.italic', 'Italic')}
                    disabled={isDisabled}
                    pressed={activeFormats.has('italic')}
                    onPressedChange={() => execFormat('italic')}>
                    <Italic className="size-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>{t('ui.emailComposer.italic', 'Italic')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    aria-label={t('ui.emailComposer.underline', 'Underline')}
                    disabled={isDisabled}
                    pressed={activeFormats.has('underline')}
                    onPressedChange={() => execFormat('underline')}>
                    <Underline className="size-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>{t('ui.emailComposer.underline', 'Underline')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    aria-label={t('ui.emailComposer.strikethrough', 'Strikethrough')}
                    disabled={isDisabled}
                    pressed={activeFormats.has('strikeThrough')}
                    onPressedChange={() => execFormat('strikeThrough')}>
                    <Strikethrough className="size-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>{t('ui.emailComposer.strikethrough', 'Strikethrough')}</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="mx-1 h-5" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    aria-label={t('ui.emailComposer.bulletedList', 'Bulleted list')}
                    disabled={isDisabled}
                    pressed={activeFormats.has('insertUnorderedList')}
                    onPressedChange={() => execFormat('insertUnorderedList')}>
                    <List className="size-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>{t('ui.emailComposer.bulletedList', 'Bulleted list')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    aria-label={t('ui.emailComposer.orderedList', 'Numbered list')}
                    disabled={isDisabled}
                    pressed={activeFormats.has('insertOrderedList')}
                    onPressedChange={() => execFormat('insertOrderedList')}>
                    <ListOrdered className="size-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>{t('ui.emailComposer.orderedList', 'Numbered list')}</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="mx-1 h-5" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    aria-label={t('ui.emailComposer.insertLink', 'Insert link')}
                    disabled={isDisabled}
                    pressed={linkInputVisible}
                    onPressedChange={handleInsertLink}>
                    <Link2 className="size-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>{t('ui.emailComposer.insertLink', 'Insert link')}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          {linkInputVisible && (
            <div className="flex items-center gap-1.5 border-t px-2 py-1">
              <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmLink();
                  }
                  if (e.key === 'Escape') {
                    setLinkInputVisible(false);
                    setLinkUrl('');
                  }
                }}
                placeholder="https://example.com"
                className={cn(
                  'min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground',
                  inputSizeClass
                )} />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={confirmLink}>
                <Send className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setLinkInputVisible(false);
                  setLinkUrl('');
                }}>
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
          aria-placeholder={t('ui.emailComposer.bodyPlaceholder', 'Compose your email...')}
          onInput={handleBodyInput}
          onFocus={() => { lastActiveEditorRef.current = bodyRef.current; }}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          data-placeholder={t('ui.emailComposer.bodyPlaceholder', 'Compose your email...')}
          className={cn(
            'w-full bg-transparent outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:text-primary [&_a]:underline',
            isDisabled && 'cursor-not-allowed opacity-50',
            bodySizeClass
          )} />
      </div>

      {/* Signature */}
      {isSignatureVisible && (signature || onSignatureChange) && (
        <div className="px-3 pb-2">
          <div className="mb-2 border-t border-dashed border-muted-foreground/25" />
          <div
            ref={signatureRef}
            contentEditable={!isDisabled && !!onSignatureChange}
            suppressContentEditableWarning
            onInput={handleSignatureInput}
            onFocus={() => { lastActiveEditorRef.current = signatureRef.current; }}
            onBlur={saveSignatureSelection}
            onKeyUp={saveSignatureSelection}
            onMouseUp={saveSignatureSelection}
            data-placeholder={t('ui.emailComposer.signaturePlaceholder', 'Write your signature...')}
            className={cn(
              'min-h-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_img]:my-1 [&_img]:max-h-20 [&_img]:max-w-60',
              onSignatureChange && 'empty:before:text-muted-foreground/50 empty:before:content-[attr(data-placeholder)]',
              isDisabled && 'cursor-not-allowed opacity-50',
              inputSizeClass
            )} />
          {onSignatureChange && !isDisabled && (
            <div className="mt-1.5 flex items-center gap-1">
              <input
                ref={signatureImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleSignatureImage}
                className="hidden" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onMouseDown={saveSignatureSelection}
                      onClick={() => signatureImageInputRef.current?.click()}
                      className="size-6 text-muted-foreground hover:text-foreground">
                      <ImagePlus className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('ui.emailComposer.insertImage', 'Insert image')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      )}

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-2 px-3 py-2">
            {attachments.map((attachment, index) => (
              <Badge
                key={`${attachment.name}-${attachment.size}`}
                variant="outline"
                className="gap-1.5 py-1 pl-2 pr-1">
                <Paperclip className="size-3 shrink-0" />
                <span className="max-w-[150px] truncate">{attachment.name}</span>
                <span className="text-muted-foreground">
                  ({formatFileSize(attachment.size)})
                </span>
                {!isDisabled && onRemoveAttachment && (
                  <button
                    type="button"
                    className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100"
                    onClick={() => onRemoveAttachment(index)}>
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
                    aria-label={t('ui.emailComposer.attach', 'Attach file')}>
                    <Paperclip className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('ui.emailComposer.attach', 'Attach file')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {(signature || onSignatureChange) && onSignatureVisibleChange && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isSignatureVisible ? 'secondary' : 'ghost'}
                    size="icon-sm"
                    onClick={() => onSignatureVisibleChange(!isSignatureVisible)}
                    disabled={isDisabled}
                    aria-label={t('ui.emailComposer.toggleSignature', 'Toggle signature')}>
                    <FileSignature className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSignatureVisible ? t('ui.emailComposer.removeSignature', 'Remove signature') : t('ui.emailComposer.insertSignature', 'Insert signature')}
                </TooltipContent>
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
              disabled={isDisabled}>
              {t('ui.emailComposer.cancel', 'Cancel')}
            </Button>
          )}
          <Button
            size={buttonSize}
            onClick={handleSend}
            disabled={isDisabled || !canSend}>
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {sending ? t('ui.emailComposer.sending', 'Sending...') : t('ui.emailComposer.send', 'Send')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { EmailComposer };