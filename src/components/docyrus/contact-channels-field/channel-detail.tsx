'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useState } from 'react'

import { ChevronRight, Star, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import {
  ChannelEditor,
  draftFromChannel,
  type ChannelDraft,
} from './channel-editor'
import { ValidationStatusBadge, VerifiedBadge } from './channel-status-badges'
import { ConsentMatrix } from './consent-matrix'
import {
  channelDisplayValue,
  humanizeEnum,
  kindForType,
  normalizeChannelValue,
} from './lib/contact-channels'
import {
  type ConsentCache,
  type ConsentMedium,
  type ConsentPurpose,
  type ConsentStatus,
  type ContactBrand,
  type ContactChannel,
} from './types'

/** Build an updated channel from an edited draft (keeps consent / validation / primary intact). */
function applyDraft(
  channel: ContactChannel,
  draft: ChannelDraft,
): ContactChannel {
  return {
    ...channel,
    channel_kind: kindForType(draft.channel_type),
    channel_type: draft.channel_type,
    value: normalizeChannelValue(draft.channel_type, draft.value),
    value_raw: draft.value.trim(),
    label: draft.label ?? null,
    country: draft.country ?? null,
    is_verified: draft.is_verified ?? false,
  }
}

export interface ChannelDetailPopoverProps {
  channel: ContactChannel
  brands?: ContactBrand[]
  /** Read-only — hides the attribute editor, consent edits and actions. */
  locked?: boolean
  /** Save edited attributes. */
  onSave: (channel: ContactChannel) => void
  /** Promote this channel to primary for its kind. */
  onMakePrimary: (channel: ContactChannel) => void
  /** Remove / archive this channel. */
  onRemove: (channel: ContactChannel) => void
  /** Cache-based consent edit (backend-agnostic). When set, consent is editable via the matrix. */
  onConsentCache?: (channel: ContactChannel, next: ConsentCache) => void
  /** Per-cell consent edit (backend ledger). Takes precedence over `onConsentCache`. */
  onConsentCell?: (
    channel: ContactChannel,
    brandKey: string,
    medium: ConsentMedium | null,
    purpose: ConsentPurpose,
    status: ConsentStatus,
  ) => void
  /** Custom trigger. Defaults to a small chevron details button. */
  trigger?: ReactNode
}

/**
 * Per-channel details popover: edit the channel's attributes, view its
 * validation, and edit consent (cache-based or via the ledger) — the full
 * single-channel detail surfaced as a popover instead of an inline expansion.
 */
export function ChannelDetailPopover({
  channel,
  brands,
  locked,
  onSave,
  onMakePrimary,
  onRemove,
  onConsentCache,
  onConsentCell,
  trigger,
}: ChannelDetailPopoverProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ChannelDraft>(() =>
    draftFromChannel(channel),
  )

  const consentEditable = Boolean(onConsentCell ?? onConsentCache) && !locked

  const startEdit = () => {
    setDraft(draftFromChannel(channel))
    setEditing(true)
  }

  const saveEdit = () => {
    onSave(applyDraft(channel, draft))
    setEditing(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setEditing(false)
      }}
    >
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Channel details"
          >
            <ChevronRight
              className={cn('size-4 transition-transform', open && 'rotate-90')}
            />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[30rem] max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto p-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium">
                {channelDisplayValue(channel)}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="px-1.5 py-0 text-[10px] font-normal"
                >
                  {humanizeEnum(channel.channel_type)}
                </Badge>
                {channel.is_primary && (
                  <Badge
                    variant="secondary"
                    className="gap-1 px-1.5 py-0 text-[10px]"
                  >
                    <Star className="size-2.5 fill-current" />
                    Primary
                  </Badge>
                )}
                <VerifiedBadge
                  verified={channel.is_verified}
                  on={channel.verified_on}
                />
              </div>
            </div>
            {!locked && !editing && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={startEdit}
              >
                Edit
              </Button>
            )}
          </div>

          {/* Attribute editor */}
          {editing && (
            <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-2.5">
              <ChannelEditor
                value={draft}
                onChange={setDraft}
                showPrimary={false}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!draft.value.trim()}
                  onClick={saveEdit}
                >
                  Save
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Validation */}
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

          <Separator />

          {/* Consent */}
          <section className="flex flex-col gap-2">
            <h5 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Consent
            </h5>
            <ConsentMatrix
              channelType={channel.channel_type}
              consent={channel.consent}
              brands={brands}
              disabled={!consentEditable}
              onChange={
                onConsentCell
                  ? undefined
                  : onConsentCache
                    ? (next) => onConsentCache(channel, next)
                    : undefined
              }
              onCellChange={
                onConsentCell
                  ? (brandKey, medium, purpose, status) =>
                      onConsentCell(channel, brandKey, medium, purpose, status)
                  : undefined
              }
            />
          </section>

          {/* Actions */}
          {!locked && (
            <>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={channel.is_primary}
                  onClick={() => onMakePrimary(channel)}
                >
                  <Star className="size-3.5" />
                  Make primary
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    onRemove(channel)
                    setOpen(false)
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
