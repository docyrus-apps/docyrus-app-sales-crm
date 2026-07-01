import { type MouseEvent as ReactMouseEvent, useMemo, useState } from 'react'

import {
  CalendarPlus,
  EllipsisVertical,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  Users
} from 'lucide-react'

import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/animate-ui/components/radix/dropdown-menu'

export interface RelatedContact {
  id?: string;
  name?: string;
  email?: string;
  mobile?: string;
  job_title?: string;
}

export interface RelatedContactsTableProps {
  contacts: Array<RelatedContact>;
  isLoading?: boolean;
  addLabel?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  onAddContact: () => void;
  onOpenContact: (id: string) => void;
  onEmail: (contact: RelatedContact) => void;
  onCall: (contact: RelatedContact) => void;
  onSms?: (contact: RelatedContact) => void;
  onMeeting?: (contact: RelatedContact) => void;
  onRemoveContact?: (contact: RelatedContact) => void;
}

const GRID_COLS =
  'grid grid-cols-[2rem_minmax(0,1.7fr)_minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[2rem_minmax(0,1.7fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]'

function getInitials(name?: string): string {
  if (!name) return '#'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

function stop(event: ReactMouseEvent) {
  event.stopPropagation()
}

export function RelatedContactsTable({
  contacts,
  isLoading,
  addLabel,
  searchPlaceholder,
  emptyLabel,
  onAddContact,
  onOpenContact,
  onEmail,
  onCall,
  onSms,
  onMeeting,
  onRemoveContact
}: RelatedContactsTableProps) {
  const { t } = useTranslation()
  const resolvedAddLabel = addLabel ?? t('relatedTables.contacts.add')
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? t('relatedTables.contacts.search')
  const resolvedEmptyLabel = emptyLabel ?? t('relatedTables.contacts.empty')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return contacts

    return contacts.filter((c) => {
      const haystack = [
c.name,
c.email,
c.mobile,
c.job_title
]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [contacts, query])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar — search + add */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={resolvedSearchPlaceholder}
            className="h-8 border-none bg-muted/50 pl-8 text-[13px] shadow-none focus-visible:ring-1" />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0 gap-1.5"
          onClick={onAddContact}>
          <Plus className="size-3.5" />
          {resolvedAddLabel}
        </Button>
      </div>

      {/* Header */}
      <div
        className={cn(
          GRID_COLS,
          'px-4 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70'
        )}>
        <span />
        <span>{t('relatedTables.contacts.name')}</span>
        <span>{t('relatedTables.contacts.email')}</span>
        <span className="max-sm:hidden">
          {t('relatedTables.contacts.phone')}
        </span>
        <span>{t('relatedTables.contacts.title')}</span>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
        {isLoading ? (
          <div className="space-y-1 px-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-11 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <p className="text-[13px] text-muted-foreground">
              {query ? t('relatedTables.contacts.noMatch') : resolvedEmptyLabel}
            </p>
            {!query && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={onAddContact}>
                <Plus className="size-3.5" />
                {resolvedAddLabel}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map(contact => (
              <div
                key={contact.id}
                role="button"
                tabIndex={0}
                onClick={() => contact.id && onOpenContact(contact.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && contact.id)
                    onOpenContact(contact.id)
                }}
                className={cn(
                  GRID_COLS,
                  'group cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60'
                )}>
                {/* Action menu — leading */}
                <div
                  onClick={stop}
                  className="flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={stop}
                        aria-label={t('relatedTables.contacts.actions')}
                        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-background hover:text-foreground hover:shadow-sm data-[state=open]:bg-background data-[state=open]:text-foreground data-[state=open]:shadow-sm">
                        <EllipsisVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-44"
                      onClick={stop}>
                      <DropdownMenuItem onClick={() => onEmail(contact)}>
                        <Mail className="size-4 text-blue-500" />
                        {t('relatedTables.contacts.sendEmail')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCall(contact)}>
                        <Phone className="size-4 text-emerald-600" />
                        {t('relatedTables.contacts.call')}
                      </DropdownMenuItem>
                      {onSms && (
                        <DropdownMenuItem onClick={() => onSms(contact)}>
                          <MessageSquare className="size-4 text-violet-500" />
                          {t('relatedTables.contacts.sendSms')}
                        </DropdownMenuItem>
                      )}
                      {onMeeting && (
                        <DropdownMenuItem onClick={() => onMeeting(contact)}>
                          <CalendarPlus className="size-4 text-amber-500" />
                          {t('relatedTables.contacts.scheduleMeeting')}
                        </DropdownMenuItem>
                      )}
                      {onRemoveContact && (
                        <DropdownMenuItem
                          onClick={() => onRemoveContact(contact)}>
                          <Trash2 className="size-4 text-red-500" />
                          {t('relatedTables.contacts.remove', {
                            defaultValue: 'Remove from list'
                          })}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground/70">
                    {getInitials(contact.name)}
                  </span>
                  <span className="truncate font-medium">
                    {contact.name ?? '—'}
                  </span>
                </div>
                <span className="truncate text-muted-foreground">
                  {contact.email ?? '—'}
                </span>
                <span className="truncate text-muted-foreground max-sm:hidden">
                  {contact.mobile ?? '—'}
                </span>
                <span className="truncate text-muted-foreground">
                  {contact.job_title ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
