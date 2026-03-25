'use client';

import {
  forwardRef, useCallback, useImperativeHandle, useRef, useState,
  type ClipboardEvent, type KeyboardEvent, type ReactNode
} from 'react';

import { Paperclip, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import {
  type EmailAttachment,
  type LogActivityPayload,
  type SectionHandle
} from '../types';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface RecipientFieldProps {
  label: string;
  recipients: Array<string>;
  onRecipientsChange: (recipients: Array<string>) => void;
  placeholder: string;
  disabled: boolean;
  suffix?: ReactNode;
}

function RecipientField({
  label,
  recipients,
  onRecipientsChange,
  placeholder,
  disabled,
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

  return (
    <div
      className="group flex min-h-8 items-start gap-2"
      onClick={() => inputRef.current?.focus()}>
      <span className="shrink-0 pt-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {recipients.map((recipient, index) => (
          <Badge
            key={`${recipient}-${index}`}
            variant={isValidEmail(recipient) ? 'secondary' : 'destructive'}
            className="gap-1 pl-2 pr-1 text-xs">
            <span className="max-w-40 truncate">{recipient}</span>
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
          className="min-w-25 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed" />
      </div>
      {suffix}
    </div>
  );
}

interface EmailSectionProps {
  disabled: boolean;
  attachments?: Array<EmailAttachment>;
  onAttach?: () => void;
  onRemoveAttachment?: (index: number) => void;
}

export const EmailSection = forwardRef<SectionHandle, EmailSectionProps>(
  ({
    disabled, attachments = [], onAttach, onRemoveAttachment
  }, ref) => {
    const [to, setTo] = useState<Array<string>>([]);
    const [cc, setCc] = useState<Array<string>>([]);
    const [bcc, setBcc] = useState<Array<string>>([]);
    const [subject, setSubject] = useState('');
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);

    useImperativeHandle(ref, () => ({
      getData: (): Partial<LogActivityPayload> => ({
        subject,
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      }),
      reset: () => {
        setTo([]);
        setCc([]);
        setBcc([]);
        setSubject('');
        setShowCc(false);
        setShowBcc(false);
      },
      isEmpty: () => to.length === 0 && subject.trim().length === 0
    }));

    return (
      <div className="flex flex-col gap-1">
        {/* To field */}
        <RecipientField
          label="To:"
          recipients={to}
          onRecipientsChange={setTo}
          placeholder="Add recipients..."
          disabled={disabled}
          suffix={
            (!showCc || !showBcc) ? (
              <div className="flex shrink-0 items-center gap-1 pt-0.5">
                {!showCc && (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCc(true)}
                    disabled={disabled}>
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setShowBcc(true)}
                    disabled={disabled}>
                    Bcc
                  </button>
                )}
              </div>
            ) : undefined
          } />

        {/* Cc field */}
        {showCc && (
          <RecipientField
            label="Cc:"
            recipients={cc}
            onRecipientsChange={setCc}
            placeholder="Add Cc recipients..."
            disabled={disabled} />
        )}

        {/* Bcc field */}
        {showBcc && (
          <RecipientField
            label="Bcc:"
            recipients={bcc}
            onRecipientsChange={setBcc}
            placeholder="Add Bcc recipients..."
            disabled={disabled} />
        )}

        {/* Subject */}
        <Input
          placeholder="Subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          disabled={disabled}
          className="h-8 text-sm" />

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachments.map((attachment, index) => (
              <Badge
                key={`${attachment.name}-${index}`}
                variant="outline"
                className="gap-1 py-0.5 pl-1.5 pr-1 text-xs">
                <Paperclip className="size-3 shrink-0" />
                <span className="max-w-30 truncate">{attachment.name}</span>
                <span className="text-muted-foreground">
                  ({formatFileSize(attachment.size)})
                </span>
                {!disabled && onRemoveAttachment && (
                  <button
                    type="button"
                    className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100"
                    onClick={() => onRemoveAttachment(index)}>
                    <X className="size-3" />
                  </button>
                )}
              </Badge>
            ))}
            {onAttach && (
              <button
                type="button"
                onClick={onAttach}
                disabled={disabled}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground',
                  disabled && 'pointer-events-none opacity-50'
                )}>
                <Paperclip className="size-3" />
                Attach
              </button>
            )}
          </div>
        )}

        {/* Attach button when no attachments */}
        {attachments.length === 0 && onAttach && (
          <button
            type="button"
            onClick={onAttach}
            disabled={disabled}
            className={cn(
              'inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground',
              disabled && 'pointer-events-none opacity-50'
            )}>
            <Paperclip className="size-3" />
            Attach file
          </button>
        )}
      </div>
    );
  }
);

EmailSection.displayName = 'EmailSection';