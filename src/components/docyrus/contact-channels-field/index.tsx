'use client'

// @ts-nocheck
/* eslint-disable */
export {
  ContactChannelsField,
  type ContactChannelsFieldProps,
  type ContactChannelActionHandlers,
} from './contact-channels-field'
export {
  ContactChannelsManager,
  type ContactChannelsManagerProps,
} from './contact-channels-manager'
export {
  ChannelDetailPopover,
  type ChannelDetailPopoverProps,
} from './channel-detail'
export {
  ChannelEditor,
  draftFromChannel,
  emptyDraft,
  kindForType,
  type ChannelDraft,
  type ChannelEditorProps,
} from './channel-editor'
export { ConsentMatrix, type ConsentMatrixProps } from './consent-matrix'
export {
  ConsentStatusBadge,
  ConsentStatusIcon,
  ValidationStatusBadge,
  VerifiedBadge,
} from './channel-status-badges'

export {
  allowedMediums,
  channelDisplayValue,
  CHANNEL_KINDS,
  CHANNEL_KIND_ICONS,
  CHANNEL_LABEL_SUGGESTIONS,
  CHANNEL_TYPES,
  CHANNEL_TYPES_BY_KIND,
  CHANNEL_TYPE_ICONS,
  CONSENT_MEDIUM_ICONS,
  CONSENT_MEDIUMS,
  CONSENT_PURPOSES,
  CONSENT_STATUS_ALLOW_LABEL,
  CONSENT_STATUS_TONE,
  CONSENT_SUMMARY_MEDIUMS,
  flattenConsent,
  summarizeBrandConsent,
  humanizeEnum,
  iconForKind,
  iconForMedium,
  iconForType,
  isMediumAllowed,
  kindForType as channelKindForType,
  MEDIUMS_BY_CHANNEL_TYPE,
  newId,
  normalizeChannelValue,
  readConsent,
  STATUS_TONE_CLASSES,
  STATUS_TONE_TEXT_CLASSES,
  VALIDATION_STATUS_TONE,
  validateChannelValue,
  type FlatConsent,
  type StatusTone,
} from './lib/contact-channels'

export {
  DEFAULT_CONSENT_KEY,
  type ChannelCreateInput,
  type ChannelKind,
  type ChannelLabel,
  type ChannelType,
  type ChannelUpdateInput,
  type ConsentAction,
  type ConsentCache,
  type ConsentCacheEntry,
  type ConsentEntryInput,
  type ConsentMedium,
  type ConsentMediumMap,
  type ConsentPurpose,
  type ConsentPurposeMap,
  type ConsentRecord,
  type ConsentStatus,
  type ContactBrand,
  type ContactChannel,
  type ValidationCache,
  type ValidationEntryInput,
  type ValidationMethod,
  type ValidationRecord,
  type ValidationStatus,
} from './types'
