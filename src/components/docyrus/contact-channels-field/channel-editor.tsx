'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  PhoneInput,
  PhoneInputCountrySelect,
  PhoneInputField,
} from '@/components/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import {
  CHANNEL_LABEL_SUGGESTIONS,
  CHANNEL_TYPE_ICONS,
  CHANNEL_TYPES,
  CHANNEL_TYPES_BY_KIND,
  humanizeEnum,
  kindForType,
  validateChannelValue,
} from './lib/contact-channels'
import { type ChannelType, type ContactChannel } from './types'

/** Editable subset of a channel used by the add / edit form. */
export interface ChannelDraft {
  channel_type: ChannelType
  value: string
  label?: string | null
  country?: string | null
  is_primary?: boolean
  is_verified?: boolean
}

export function emptyDraft(type: ChannelType = 'email'): ChannelDraft {
  return {
    channel_type: type,
    value: '',
    label: null,
    country: null,
    is_primary: false,
    is_verified: false,
  }
}

export function draftFromChannel(channel: ContactChannel): ChannelDraft {
  return {
    channel_type: channel.channel_type,
    value: channel.value_raw?.trim() || channel.value,
    label: channel.label ?? null,
    country: channel.country ?? null,
    is_primary: channel.is_primary ?? false,
    is_verified: channel.is_verified ?? false,
  }
}

export interface ChannelEditorProps {
  value: ChannelDraft
  onChange: (next: ChannelDraft) => void
  disabled?: boolean
  /** Show the primary toggle (hidden where a dedicated "Make primary" action exists). */
  showPrimary?: boolean
  /** Show the verified toggle (hidden in the panel where validation drives it). */
  showVerified?: boolean
  /** Show validation feedback for the value input. */
  showValidation?: boolean
}

const PHONE_TYPES: ChannelType[] = [
  'mobile',
  'landline',
  'sms',
  'fax',
  'whatsapp',
  'telegram',
  'signal',
]

/**
 * Backend-agnostic editor for a single channel's attributes. Selecting a type
 * keeps the implied {@link ChannelKind} in sync and reveals a country input for
 * phone-like types.
 */
export function ChannelEditor({
  value,
  onChange,
  disabled,
  showPrimary = true,
  showVerified = true,
  showValidation = true,
}: ChannelEditorProps) {
  const valueError = useMemo(
    () =>
      showValidation && value.value.trim()
        ? validateChannelValue(value.channel_type, value.value)
        : null,
    [showValidation, value.channel_type, value.value],
  )

  const isPhoneLike = PHONE_TYPES.includes(value.channel_type)
  const patch = (next: Partial<ChannelDraft>) => onChange({ ...value, ...next })

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Type</FieldLabel>
          <Select
            value={value.channel_type}
            onValueChange={(type: string) =>
              patch({ channel_type: type as ChannelType })
            }
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CHANNEL_TYPES_BY_KIND).map(([kind, types]) => (
                <SelectGroupForKind key={kind} kind={kind} types={types} />
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Label</FieldLabel>
          <Input
            list="contact-channel-label-suggestions"
            value={value.label ?? ''}
            onChange={(e) => patch({ label: e.target.value || null })}
            placeholder="work, personal…"
            disabled={disabled}
            className="h-9"
          />
          <datalist id="contact-channel-label-suggestions">
            {CHANNEL_LABEL_SUGGESTIONS.map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field data-invalid={Boolean(valueError)}>
        <FieldLabel>Value</FieldLabel>
        {value.channel_type === 'email' ? (
          <Input
            type="email"
            inputMode="email"
            value={value.value}
            onChange={(e) => patch({ value: e.target.value })}
            placeholder="name@example.com"
            disabled={disabled}
            aria-invalid={Boolean(valueError)}
            className="h-9"
          />
        ) : isPhoneLike ? (
          <PhoneInput
            value={value.value}
            onValueChange={(val) => patch({ value: val })}
            country={value.country ?? ''}
            onCountryChange={(code) => patch({ country: code || null })}
            disabled={disabled}
            invalid={Boolean(valueError)}
          >
            <PhoneInputCountrySelect />
            <PhoneInputField aria-invalid={Boolean(valueError)} />
          </PhoneInput>
        ) : (
          <Input
            value={value.value}
            onChange={(e) => patch({ value: e.target.value })}
            placeholder="Enter a value"
            disabled={disabled}
            className="h-9"
          />
        )}
        {valueError && <FieldError errors={[{ message: valueError }]} />}
      </Field>

      <div className="flex flex-wrap items-center gap-6 pt-1">
        {showPrimary && (
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={value.is_primary ?? false}
              onCheckedChange={(checked) => patch({ is_primary: checked })}
              disabled={disabled}
            />
            Primary
          </label>
        )}

        {showVerified && (
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={value.is_verified ?? false}
              onCheckedChange={(checked) => patch({ is_verified: checked })}
              disabled={disabled}
            />
            Verified
          </label>
        )}
      </div>
    </div>
  )
}

function SelectGroupForKind({
  kind,
  types,
}: {
  kind: string
  types: ChannelType[]
}) {
  const valid = types.filter((type) => CHANNEL_TYPES.includes(type))

  if (valid.length === 0) return null

  return (
    <>
      <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {humanizeEnum(kind)}
      </div>
      {valid.map((type) => {
        const Icon = CHANNEL_TYPE_ICONS[type]

        return (
          <SelectItem key={type} value={type}>
            <Icon className="size-3.5 text-muted-foreground" />
            {humanizeEnum(type)}
          </SelectItem>
        )
      })}
    </>
  )
}

/** Re-export so callers can derive a kind without importing the lib directly. */
export { kindForType }
