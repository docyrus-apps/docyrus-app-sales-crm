'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo, useState } from 'react'

import {
  ChevronRight,
  MoreVertical,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import {
  ChannelEditor,
  draftFromChannel,
  emptyDraft,
  type ChannelDraft,
} from './channel-editor'
import { ValidationStatusBadge, VerifiedBadge } from './channel-status-badges'
import { ConsentMatrix } from './consent-matrix'
import {
  channelDisplayValue,
  CHANNEL_KIND_ICONS,
  CHANNEL_KINDS,
  CHANNEL_TYPE_ICONS,
  flattenConsent,
  humanizeEnum,
  kindForType,
  newId,
  normalizeChannelValue,
} from './lib/contact-channels'
import {
  DEFAULT_CONSENT_KEY,
  type ChannelKind,
  type ConsentCache,
  type ContactBrand,
  type ContactChannel,
} from './types'

export interface ContactChannelsManagerProps {
  /** Controlled list of channels. */
  value: ContactChannel[]
  /** Emits the full next list on any add / edit / remove / reorder. */
  onChange: (next: ContactChannel[]) => void
  /** Optional brands for labelling / scoping consent (omit for organization-wide only). */
  brands?: ContactBrand[]
  /** Disable every interaction. */
  disabled?: boolean
  /** Render read-only (hides editors and action menus). */
  readOnly?: boolean
  /** Show the inline consent editor per channel. Default `true`. */
  enableConsent?: boolean
  /** Show validation status chips. Default `true`. */
  enableValidation?: boolean
  /** Group channels under kind headers. Default `true`. */
  groupByKind?: boolean
  /** Placeholder shown when there are no channels. */
  emptyText?: string
  className?: string
}

/**
 * Backend-agnostic, comprehensive editor for a record's contact channels, their
 * consent cache and validation status — add / edit / remove channels, promote a
 * primary per kind, and edit consent per brand / medium / purpose. Fully
 * controlled. Rendered inside the `ContactChannelsField` "Details" dialog, or
 * pair it with `ContactChannelsPanel` / `useDocyrusContactChannels` to persist
 * against the Docyrus API.
 */
export function ContactChannelsManager({
  value,
  onChange,
  brands,
  disabled,
  readOnly,
  enableConsent = true,
  enableValidation = true,
  groupByKind = true,
  emptyText = 'No contact channels yet.',
  className,
}: ContactChannelsManagerProps) {
  const [addOpen, setAddOpen] = useState(false)
  const isLocked = disabled || readOnly

  const groups = useMemo(() => {
    if (!groupByKind)
      return [{ kind: null as ChannelKind | null, channels: value }]

    return CHANNEL_KINDS.map((kind) => ({
      kind,
      channels: value.filter((channel) => channel.channel_kind === kind),
    })).filter((group) => group.channels.length > 0)
  }, [value, groupByKind])

  const commitDraft = (draft: ChannelDraft, existing?: ContactChannel) => {
    const normalized = normalizeChannelValue(draft.channel_type, draft.value)
    const kind = kindForType(draft.channel_type)

    const base: ContactChannel = existing
      ? { ...existing }
      : {
          id: newId(),
          channel_kind: kind,
          channel_type: draft.channel_type,
          value: normalized,
          consent: {
            [DEFAULT_CONSENT_KEY]: {
              [DEFAULT_CONSENT_KEY]: {
                transactional: { status: 'opted_in', source: 'default' },
              },
            },
          },
        }

    const updated: ContactChannel = {
      ...base,
      channel_kind: kind,
      channel_type: draft.channel_type,
      value: normalized,
      value_raw: draft.value.trim(),
      label: draft.label ?? null,
      country: draft.country ?? null,
      is_verified: draft.is_verified ?? false,
    }

    let next = existing
      ? value.map((channel) => (channel.id === existing.id ? updated : channel))
      : [...value, updated]

    if (draft.is_primary) {
      next = next.map((channel) =>
        channel.channel_kind === kind
          ? { ...channel, is_primary: channel.id === updated.id }
          : channel,
      )
    } else {
      next = next.map((channel) =>
        channel.id === updated.id ? { ...channel, is_primary: false } : channel,
      )
    }

    onChange(next)
  }

  const makePrimary = (channel: ContactChannel) => {
    onChange(
      value.map((other) =>
        other.channel_kind === channel.channel_kind
          ? { ...other, is_primary: other.id === channel.id }
          : other,
      ),
    )
  }

  const removeChannel = (id: string) => {
    onChange(value.filter((channel) => channel.id !== id))
  }

  const updateConsent = (id: string, consent: ConsentCache) => {
    onChange(
      value.map((channel) =>
        channel.id === id ? { ...channel, consent } : channel,
      ),
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const KindIcon = group.kind ? CHANNEL_KIND_ICONS[group.kind] : null

            return (
              <div key={group.kind ?? 'all'} className="flex flex-col gap-1.5">
                {group.kind && (
                  <div className="flex items-center gap-1.5 px-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {KindIcon && <KindIcon className="size-3.5" />}
                    {humanizeEnum(group.kind)}
                  </div>
                )}
                {group.channels.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    brands={brands}
                    isLocked={isLocked}
                    enableConsent={enableConsent}
                    enableValidation={enableValidation}
                    onEdit={(draft) => commitDraft(draft, channel)}
                    onMakePrimary={() => makePrimary(channel)}
                    onRemove={() => removeChannel(channel.id)}
                    onConsentChange={(consent) =>
                      updateConsent(channel.id, consent)
                    }
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {!isLocked && (
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="w-fit">
              <Plus className="mr-1 size-3.5" />
              Add channel
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <DraftForm
              title="Add channel"
              initial={emptyDraft()}
              onCancel={() => setAddOpen(false)}
              onSave={(draft) => {
                commitDraft(draft)
                setAddOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

function ChannelRow({
  channel,
  brands,
  isLocked,
  enableConsent,
  enableValidation,
  onEdit,
  onMakePrimary,
  onRemove,
  onConsentChange,
}: {
  channel: ContactChannel
  brands?: ContactBrand[]
  isLocked?: boolean
  enableConsent: boolean
  enableValidation: boolean
  onEdit: (draft: ChannelDraft) => void
  onMakePrimary: () => void
  onRemove: () => void
  onConsentChange: (consent: ConsentCache) => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const TypeIcon = CHANNEL_TYPE_ICONS[channel.channel_type]

  const consentSummary = useMemo(() => {
    const rows = flattenConsent(channel.consent).filter(
      (row) => row.status !== 'unknown',
    )
    const optedIn = rows.filter((row) => row.status === 'opted_in').length
    const optedOut = rows.filter((row) => row.status === 'opted_out').length

    return { optedIn, optedOut }
  }, [channel.consent])

  const showDetails = enableConsent || enableValidation

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <TypeIcon className="size-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {channelDisplayValue(channel)}
          </span>
          {channel.is_primary && (
            <Badge
              variant="secondary"
              className="gap-1 px-1.5 py-0 text-[10px]"
            >
              <Star className="size-2.5 fill-current" />
              Primary
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className="px-1.5 py-0 text-[10px] font-normal"
          >
            {humanizeEnum(channel.channel_type)}
          </Badge>
          {channel.label && (
            <span className="text-xs text-muted-foreground">
              {channel.label}
            </span>
          )}
          {channel.country && (
            <span className="text-xs text-muted-foreground">
              · {channel.country}
            </span>
          )}
          <VerifiedBadge
            verified={channel.is_verified}
            on={channel.verified_on}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {enableValidation && channel.validation_status && (
          <ValidationStatusBadge
            status={channel.validation_status}
            on={channel.validated_on}
          />
        )}
        {enableConsent &&
          (consentSummary.optedIn > 0 || consentSummary.optedOut > 0) && (
            <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              {consentSummary.optedIn} in
              {consentSummary.optedOut > 0
                ? ` · ${consentSummary.optedOut} out`
                : ''}
            </span>
          )}

        {showDetails && (
          <ChannelDetailsPopover
            channel={channel}
            brands={brands}
            isLocked={isLocked}
            enableConsent={enableConsent}
            enableValidation={enableValidation}
            onConsentChange={onConsentChange}
          />
        )}

        {!isLocked && (
          <>
            <Popover open={editOpen} onOpenChange={setEditOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Edit channel"
                >
                  <Pencil className="size-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <DraftForm
                  title="Edit channel"
                  initial={draftFromChannel(channel)}
                  isPrimary={channel.is_primary}
                  onCancel={() => setEditOpen(false)}
                  onSave={(draft) => {
                    onEdit(draft)
                    setEditOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="More actions"
                >
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={channel.is_primary}
                  onSelect={onMakePrimary}
                >
                  <Star className="mr-2 size-3.5" />
                  Make primary
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                  <Trash2 className="mr-2 size-3.5" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  )
}

/** Arrow trigger that opens a popover with this channel's consent + validation details. */
function ChannelDetailsPopover({
  channel,
  brands,
  isLocked,
  enableConsent,
  enableValidation,
  onConsentChange,
}: {
  channel: ContactChannel
  brands?: ContactBrand[]
  isLocked?: boolean
  enableConsent: boolean
  enableValidation: boolean
  onConsentChange: (consent: ConsentCache) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Consent & validation details"
        >
          <ChevronRight
            className={cn('size-4 transition-transform', open && 'rotate-90')}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[30rem] max-w-[calc(100vw-2rem)]"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium">
              {channelDisplayValue(channel)}
            </span>
            <span className="text-xs text-muted-foreground">
              {humanizeEnum(channel.channel_type)}
            </span>
          </div>

          {enableValidation && (
            <section className="flex flex-col gap-2">
              <h5 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Validation
              </h5>
              {channel.validation_status ? (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <ValidationStatusBadge
                    status={channel.validation_status}
                    on={channel.validated_on}
                  />
                  {channel.validation?.method && (
                    <span className="text-muted-foreground">
                      {humanizeEnum(channel.validation.method)}
                    </span>
                  )}
                  {channel.validated_on && (
                    <span className="ml-auto text-muted-foreground">
                      {new Date(channel.validated_on).toLocaleString()}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Not validated yet.
                </p>
              )}
            </section>
          )}

          {enableConsent && (
            <section className="flex flex-col gap-2">
              <h5 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Consent
              </h5>
              <ConsentMatrix
                channelType={channel.channel_type}
                consent={channel.consent}
                brands={brands}
                onChange={onConsentChange}
                disabled={isLocked}
              />
            </section>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DraftForm({
  title,
  initial,
  isPrimary,
  onSave,
  onCancel,
}: {
  title: string
  initial: ChannelDraft
  isPrimary?: boolean
  onSave: (draft: ChannelDraft) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<ChannelDraft>({
    ...initial,
    is_primary: initial.is_primary ?? isPrimary,
  })
  const canSave = draft.value.trim().length > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium">{title}</div>
      <ChannelEditor value={draft} onChange={setDraft} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canSave}
          onClick={() => onSave(draft)}
        >
          Save
        </Button>
      </div>
    </div>
  )
}
