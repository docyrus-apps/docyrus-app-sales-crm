'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useState } from 'react'

import { ArrowUpRight, Building2, CircleCheck, Plus, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { resolveColorHex } from '@/lib/docyrus/tailwind-colors'

import { ChannelDetailPopover } from './channel-detail'
import { ChannelEditor, emptyDraft, type ChannelDraft } from './channel-editor'
import { ContactChannelsManager } from './contact-channels-manager'
import {
  channelDisplayValue,
  CHANNEL_KINDS,
  CONSENT_MEDIUM_ICONS,
  CONSENT_SUMMARY_MEDIUMS,
  humanizeEnum,
  kindForType,
  newId,
  normalizeChannelValue,
  summarizeBrandConsent,
} from './lib/contact-channels'
import {
  DEFAULT_CONSENT_KEY,
  type ConsentCache,
  type ConsentMedium,
  type ConsentPurpose,
  type ConsentStatus,
  type ContactBrand,
  type ContactChannel,
} from './types'

const CONSENT_DOT_CLASS: Record<ConsentStatus, string> = {
  opted_in: 'bg-emerald-500',
  opted_out: 'bg-red-500',
  unknown: 'bg-amber-500',
}

/**
 * Per-channel write handlers. Provide them to persist edits granularly (e.g.
 * against the Docyrus API); when omitted, edits fall back to mutating `value`
 * via `onChange`.
 */
export interface ContactChannelActionHandlers {
  /** Persist a newly added channel. The passed channel carries a temporary id. */
  onCreate?: (channel: ContactChannel) => void | Promise<unknown>
  /** Persist edited attributes for one channel. */
  onSave?: (channel: ContactChannel) => void | Promise<unknown>
  /** Promote one channel to primary for its kind. */
  onMakePrimary?: (channel: ContactChannel) => void | Promise<unknown>
  /** Remove / archive one channel. */
  onRemove?: (channel: ContactChannel) => void | Promise<unknown>
  /**
   * Record a single consent change (ledger-style). When provided, the per-channel
   * consent matrix calls this instead of mutating the cache via `onChange`.
   */
  onRecordConsent?: (
    channel: ContactChannel,
    brandKey: string,
    medium: ConsentMedium | null,
    purpose: ConsentPurpose,
    status: ConsentStatus,
  ) => void | Promise<unknown>
}

export interface ContactChannelsFieldProps {
  /** Controlled list of channels. */
  value: ContactChannel[]
  /** Emits the full next list when edited via the Details dialog. */
  onChange: (next: ContactChannel[]) => void
  /** Brands for the consent summary (one row each); omit for a single organization-wide row. */
  brands?: ContactBrand[]
  /** Granular per-channel write handlers (for backend persistence). */
  channelActions?: ContactChannelActionHandlers
  /** Show a per-channel details popover (edit + consent + validation) next to each value. Default `true`. */
  enableChannelDetails?: boolean
  /** Summary heading. Default `'Contact Points'`. */
  title?: string
  /** Hide the Details link. */
  hideDetails?: boolean
  /** Label for the Details link. Default `'Details'`. */
  detailsLabel?: string
  /**
   * Called when Details is clicked. When provided, the built-in management
   * dialog is NOT opened — wire it to your own dialog (e.g. `ContactChannelsPanel`)
   * for backend-backed management.
   */
  onDetailsClick?: () => void
  /** Show the consent summary section. Default `true`. */
  showConsent?: boolean
  /** Disable editing in the built-in management dialog. */
  disabled?: boolean
  /** Render the built-in management dialog read-only. */
  readOnly?: boolean
  /** Placeholder shown when there are no channels. */
  emptyText?: string
  className?: string
}

/**
 * Compact, read-at-a-glance summary of a record's contact channels and consent.
 * Shows the primary channel per kind (with a `+N` badge for the rest) and a
 * per-brand consent grid. The **Details** link opens a dialog with the full
 * {@link ContactChannelsManager} (or calls `onDetailsClick` so a Docyrus app can
 * open `ContactChannelsPanel` instead). Fully controlled, backend-agnostic.
 */
export function ContactChannelsField({
  value,
  onChange,
  brands,
  channelActions,
  enableChannelDetails = true,
  title = 'Contact Points',
  hideDetails,
  detailsLabel = 'Details',
  onDetailsClick,
  showConsent = true,
  disabled,
  readOnly,
  emptyText = 'No contact points yet.',
  className,
}: ContactChannelsFieldProps) {
  const [open, setOpen] = useState(false)
  const useBuiltInDialog = !onDetailsClick
  const locked = Boolean(disabled || readOnly)

  const saveChannel = (next: ContactChannel) => {
    if (channelActions?.onSave) void channelActions.onSave(next)
    else
      onChange(
        value.map((channel) => (channel.id === next.id ? next : channel)),
      )
  }

  const makeChannelPrimary = (next: ContactChannel) => {
    if (channelActions?.onMakePrimary) void channelActions.onMakePrimary(next)
    else {
      onChange(
        value.map((channel) =>
          channel.channel_kind === next.channel_kind
            ? { ...channel, is_primary: channel.id === next.id }
            : channel,
        ),
      )
    }
  }

  const removeChannel = (next: ContactChannel) => {
    if (channelActions?.onRemove) void channelActions.onRemove(next)
    else onChange(value.filter((channel) => channel.id !== next.id))
  }

  const updateConsentCache = (next: ContactChannel, consent: ConsentCache) => {
    onChange(
      value.map((channel) =>
        channel.id === next.id ? { ...channel, consent } : channel,
      ),
    )
  }

  const addChannel = (draft: ChannelDraft) => {
    const kind = kindForType(draft.channel_type)
    const built: ContactChannel = {
      id: newId(),
      channel_kind: kind,
      channel_type: draft.channel_type,
      value: normalizeChannelValue(draft.channel_type, draft.value),
      value_raw: draft.value.trim(),
      label: draft.label ?? null,
      country: draft.country ?? null,
      is_primary: draft.is_primary ?? false,
      is_verified: draft.is_verified ?? false,
      consent: {
        [DEFAULT_CONSENT_KEY]: {
          [DEFAULT_CONSENT_KEY]: {
            transactional: { status: 'opted_in', source: 'default' },
          },
        },
      },
    }

    if (channelActions?.onCreate) {
      void channelActions.onCreate(built)

      return
    }

    const next = [...value, built]

    onChange(
      built.is_primary
        ? next.map((channel) =>
            channel.channel_kind === kind
              ? { ...channel, is_primary: channel.id === built.id }
              : channel,
          )
        : next,
    )
  }

  const groups = CHANNEL_KINDS.map((kind) => ({
    kind,
    channels: value.filter((channel) => channel.channel_kind === kind),
  })).filter((group) => group.channels.length > 0)

  const brandRows =
    brands && brands.length > 0
      ? brands.map((brand) => ({ key: brand.id, brand }))
      : [{ key: DEFAULT_CONSENT_KEY, brand: null as ContactBrand | null }]

  const handleDetails = () => {
    if (onDetailsClick) onDetailsClick()
    else setOpen(true)
  }

  return (
    <div className={cn('flex flex-col gap-4 text-sm', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span className="font-semibold">{title}</span>
        </div>
        {!hideDetails && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-muted-foreground"
            onClick={handleDetails}
          >
            {detailsLabel}
            <ArrowUpRight className="size-3.5" />
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const primary =
              group.channels.find((channel) => channel.is_primary) ??
              group.channels[0]

            if (!primary) return null

            const extra = group.channels.length - 1
            const verified =
              Boolean(primary.is_verified) ||
              primary.validation_status === 'valid'

            return (
              <div key={group.kind} className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {humanizeEnum(group.kind)}
                </span>
                <div className="flex items-center gap-2">
                  <CircleCheck
                    className={cn(
                      'size-4 shrink-0',
                      verified
                        ? 'text-emerald-500'
                        : 'text-muted-foreground/40',
                    )}
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate font-medium">
                      {channelDisplayValue(primary)}
                    </span>
                    {primary.is_primary && (
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 text-[11px] font-medium"
                      >
                        Primary
                      </Badge>
                    )}
                    {extra > 0 && (
                      <Badge className="border-transparent bg-blue-50 px-1.5 py-0 text-[11px] font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        +{extra}
                      </Badge>
                    )}
                  </div>
                  {enableChannelDetails && (
                    <ChannelDetailPopover
                      channel={primary}
                      brands={brands}
                      locked={locked}
                      onSave={saveChannel}
                      onMakePrimary={makeChannelPrimary}
                      onRemove={removeChannel}
                      onConsentCache={
                        channelActions?.onRecordConsent
                          ? undefined
                          : updateConsentCache
                      }
                      onConsentCell={channelActions?.onRecordConsent}
                    />
                  )}
                </div>
              </div>
            )
          })}

          {showConsent && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Consent
              </span>
              {brandRows.map((row) => (
                <div key={row.key} className="flex items-center gap-3">
                  <BrandMark brand={row.brand} />
                  <ConsentSummaryRow channels={value} brandKey={row.key} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!locked && <AddChannelPopover onAdd={addChannel} />}

      {useBuiltInDialog && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Manage channels, mark a primary per kind, and edit consent &amp;
                validation.
              </DialogDescription>
            </DialogHeader>
            <div className="-mr-2 max-h-[70vh] overflow-y-auto pr-2">
              <ContactChannelsManager
                value={value}
                onChange={onChange}
                brands={brands}
                disabled={disabled}
                readOnly={readOnly}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function AddChannelPopover({
  onAdd,
}: {
  onAdd: (draft: ChannelDraft) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ChannelDraft>(emptyDraft)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setDraft(emptyDraft())
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-fit">
          <Plus className="size-3.5" />
          Add channel
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">Add channel</div>
          <ChannelEditor value={draft} onChange={setDraft} />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!draft.value.trim()}
              onClick={() => {
                onAdd(draft)
                setOpen(false)
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function BrandMark({ brand }: { brand: ContactBrand | null }) {
  const label = brand?.name ?? 'Organization-wide'

  let mark: ReactNode

  if (brand?.logo_url) {
    mark = (
      <img
        src={brand.logo_url}
        alt={brand.name}
        className="size-5 shrink-0 rounded object-cover"
      />
    )
  } else if (brand) {
    mark = (
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold text-white"
        style={{
          backgroundColor: resolveColorHex(brand.color_primary ?? 'indigo-500'),
        }}
      >
        {brand.name.charAt(0).toUpperCase()}
      </span>
    )
  } else {
    mark = (
      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
        <Building2 className="size-3" />
      </span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{mark}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ConsentSummaryRow({
  channels,
  brandKey,
}: {
  channels: ContactChannel[]
  brandKey: string
}) {
  const summary = summarizeBrandConsent(channels, brandKey)

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {CONSENT_SUMMARY_MEDIUMS.map(({ medium, label }) => {
        const MediumIcon = CONSENT_MEDIUM_ICONS[medium]

        return (
          <span
            key={medium}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <MediumIcon className="size-3.5" />
            {label}
            <span
              className={cn(
                'size-1.5 rounded-full',
                CONSENT_DOT_CLASS[summary[medium]],
              )}
            />
          </span>
        )
      })}
    </div>
  )
}
