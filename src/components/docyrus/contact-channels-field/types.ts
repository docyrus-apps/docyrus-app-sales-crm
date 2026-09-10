// @ts-nocheck
/* eslint-disable */
/**
 * Canonical contact-channel model — mirrors the snake_case response shape of the
 * Contact Channels & Consent REST API so the same object round-trips between the
 * Docyrus-backed panel and the backend-agnostic form field with no mapping layer.
 */

export type ChannelKind = 'email' | 'phone' | 'messaging' | 'social' | 'web'

export type ChannelType =
  | 'email'
  | 'mobile'
  | 'landline'
  | 'sms'
  | 'fax'
  | 'whatsapp'
  | 'telegram'
  | 'signal'
  | 'linkedin'
  | 'x'
  | 'instagram'
  | 'facebook'
  | 'website'
  | 'other'

export type ConsentPurpose = 'marketing' | 'transactional' | 'newsletter'

/** Communication medium a consent applies to. */
export type ConsentMedium =
  | 'email'
  | 'sms'
  | 'call'
  | 'whatsapp'
  | 'telegram'
  | 'other'

export type ConsentAction =
  | 'opt_in'
  | 'opt_out'
  | 'withdraw'
  | 'confirm'
  | 'update'

export type ConsentStatus = 'opted_in' | 'opted_out' | 'unknown'

export type ValidationMethod = 'millionverifier' | 'regex' | 'manual' | 'api'

export type ValidationStatus =
  | 'valid'
  | 'invalid'
  | 'risky'
  | 'unknown'
  | 'disposable'
  | 'catch_all'
  | 'pending'

/** Free-form but suggested channel labels. */
export type ChannelLabel = 'work' | 'personal' | 'home' | 'billing' | 'other'

/** Latest known state for one (brand, medium, purpose) triple. */
export interface ConsentCacheEntry {
  status: ConsentStatus
  on?: string | null
  source?: string | null
  last_consent_id?: string | null
}

/** purpose → entry */
export type ConsentPurposeMap = Partial<
  Record<ConsentPurpose, ConsentCacheEntry>
>

/** medium key (`_default` for medium-agnostic) → purpose map */
export type ConsentMediumMap = Record<string, ConsentPurposeMap>

/**
 * Three-level cache keyed by brand (`_default` for organization-wide) → medium
 * (`_default` for medium-agnostic) → purpose. Maintained server-side by a DB
 * trigger; treat as read-only.
 */
export type ConsentCache = Record<string, ConsentMediumMap>

/** Sentinel brand/medium keys used inside {@link ConsentCache}. */
export const DEFAULT_CONSENT_KEY = '_default'

export interface ValidationCache {
  method?: ValidationMethod | null
  status?: ValidationStatus | null
  on?: string | null
  result?: Record<string, unknown> | null
  last_validation_id?: string | null
}

export interface ContactChannel {
  id: string
  channel_kind: ChannelKind
  channel_type: ChannelType
  value: string
  value_raw?: string | null
  country?: string | null
  label?: string | null
  is_primary?: boolean
  sort_order?: number | null
  is_verified?: boolean
  verified_on?: string | null
  validation_status?: ValidationStatus | null
  validated_on?: string | null
  validation?: ValidationCache | null
  consent?: ConsentCache
  meta?: Record<string, unknown> | null
  archived_on?: string | null
  archived_by?: string | null
  archive_reason?: string | null
  tenant_record_id?: string | null
  tenant_data_source_id?: string | null
  tenant_app_id?: string | null
  created_on?: string
  created_by?: string | null
  last_modified_on?: string | null
  last_modified_by?: string | null
}

export interface ConsentRecord {
  id: string
  contact_channel_id?: string | null
  tenant_brand_id?: string | null
  consent_channel?: ConsentMedium | null
  purpose: ConsentPurpose
  action: ConsentAction
  consent_status: ConsentStatus
  source?: string | null
  note?: string | null
  effective_on: string
  expires_on?: string | null
  proof?: Record<string, unknown> | null
  channel_type?: ChannelType | null
  channel_value?: string | null
  created_on?: string
  created_by?: string | null
}

export interface ValidationRecord {
  id: string
  contact_channel_id?: string | null
  method: ValidationMethod
  status: ValidationStatus
  result?: Record<string, unknown> | null
  source?: string | null
  note?: string | null
  checked_on: string
  channel_type?: ChannelType | null
  channel_value?: string | null
  provider_key?: string
  provider_name?: string
  provider_icon_url?: string | null
  created_on?: string
  created_by?: string | null
}

export interface ContactBrand {
  id: string
  name: string
  logo_url?: string | null
  color_primary?: string | null
}

export interface ChannelCreateInput {
  channelKind: ChannelKind
  channelType: ChannelType
  value: string
  valueRaw?: string | null
  country?: string | null
  label?: string | null
  isPrimary?: boolean
  sortOrder?: number | null
  isVerified?: boolean
  meta?: Record<string, unknown> | null
}

export type ChannelUpdateInput = Partial<ChannelCreateInput>

export interface ConsentEntryInput {
  purpose: ConsentPurpose
  action: ConsentAction
  consentStatus: ConsentStatus
  consentChannel?: ConsentMedium | null
  tenantBrandId?: string | null
  source?: string | null
  note?: string | null
  effectiveOn?: string
  expiresOn?: string | null
  proof?: Record<string, unknown> | null
}

export interface ValidationEntryInput {
  method: ValidationMethod
  status: ValidationStatus
  result?: Record<string, unknown> | null
  source?: string | null
  note?: string | null
  checkedOn?: string
}
