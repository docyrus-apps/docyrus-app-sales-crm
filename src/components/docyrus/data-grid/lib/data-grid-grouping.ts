import {
  type CellOpts,
  type CellSelectOption,
  type CellUserOption
} from '../types';

import {
  formatDateForDisplay,
  formatDateToString,
  parseLocalDate
} from './data-grid';

const GROUPABLE_VARIANTS = [
  'user',
  'relation',
  'enum',
  'date',
  'datetime'
] as const;

const IMAGE_FIELDS = [
  'avatar',
  'avatar_url',
  'avatarUrl',
  'profile_image',
  'profileImage',
  'image',
  'image_url',
  'imageUrl',
  'picture',
  'picture_url',
  'pictureUrl',
  'picture_path',
  'picturePath',
  'photo',
  'photo_url',
  'photoUrl'
] as const;

const LABEL_FIELDS = [
  'name',
  'label',
  'title',
  'display_name',
  'displayName',
  'email'
] as const;

export type GroupableCellVariant = (typeof GROUPABLE_VARIANTS)[number];

export interface GroupHeaderPresentation {
  label: string;
  avatarUrl?: string;
  imageUrl?: string;
  iconStr?: string;
  color?: string;
}

export function isGroupableCellVariant(
  variant: CellOpts['variant'] | undefined
): variant is GroupableCellVariant {
  return GROUPABLE_VARIANTS.includes(variant as GroupableCellVariant);
}

export function getGroupableCellVariant(
  cell: CellOpts | undefined
): GroupableCellVariant | null {
  const variant = cell?.variant;

  return isGroupableCellVariant(variant) ? variant : null;
}

export function normalizeGroupingValue(
  variant: GroupableCellVariant,
  value: unknown
): string {
  if (variant === 'date' || variant === 'datetime') {
    return toDateKey(value);
  }

  return toIdentifier(value);
}

export function resolveGroupHeaderPresentation(params: {
  variant: GroupableCellVariant;
  groupingValue: unknown;
  rawValue?: unknown;
  options?: Array<CellSelectOption | CellUserOption>;
}): GroupHeaderPresentation {
  const {
    variant, groupingValue, rawValue, options = []
  } = params;
  const key = toNonEmptyString(groupingValue);

  if (variant === 'date' || variant === 'datetime') {
    if (!key) {
      return { label: 'No date' };
    }

    return {
      label: formatDateForDisplay(key) || key
    };
  }

  if (!key) {
    return { label: 'Unassigned' };
  }

  const option = options.find(item => item.value === key);
  const rawRecord = toRecord(rawValue);
  const rawLabel = getRecordLabel(rawRecord);

  if (variant === 'user') {
    const userOption = option as CellUserOption | undefined;
    const label = option?.label ?? rawLabel ?? key;
    const avatarUrl = userOption?.avatarUrl ?? getRecordImage(rawRecord);

    return {
      label,
      avatarUrl
    };
  }

  if (variant === 'relation') {
    return {
      label: rawLabel ?? option?.label ?? key,
      imageUrl: getRecordImage(rawRecord),
      iconStr: getRecordString(rawRecord, ['icon', 'icon_str', 'iconStr']),
      color: getRecordString(rawRecord, ['color'])
    };
  }

  return {
    label: option?.label ?? rawLabel ?? key,
    iconStr:
      option?.iconStr
      ?? getRecordString(rawRecord, ['icon', 'icon_str', 'iconStr']),
    color: option?.color ?? getRecordString(rawRecord, ['color'])
  };
}

function toIdentifier(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  const record = toRecord(value);

  if (!record) return '';

  const { id } = record;

  if (typeof id === 'string') return id.trim();
  if (typeof id === 'number') return String(id);

  const valueField = record.value;

  if (typeof valueField === 'string') return valueField.trim();
  if (typeof valueField === 'number') return String(valueField);

  return getRecordLabel(record) ?? '';
}

function toDateKey(value: unknown): string {
  if (!value) return '';

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateToString(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) return '';

    const localDate = parseLocalDate(trimmed);

    if (localDate) {
      return formatDateToString(localDate);
    }

    const parsed = new Date(trimmed);

    if (!Number.isNaN(parsed.getTime())) {
      return formatDateToString(parsed);
    }
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return formatDateToString(parsed);
    }
  }

  return '';
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;

  return value as Record<string, unknown>;
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();

  return trimmed || undefined;
}

function getRecordString(
  record: Record<string, unknown> | null,
  fields: ReadonlyArray<string>
): string | undefined {
  if (!record) return undefined;

  for (const field of fields) {
    const value = record[field];

    if (typeof value !== 'string') continue;
    const trimmed = value.trim();

    if (trimmed) return trimmed;
  }

  return undefined;
}

function getRecordImage(
  record: Record<string, unknown> | null
): string | undefined {
  return getRecordString(record, IMAGE_FIELDS);
}

function getRecordLabel(
  record: Record<string, unknown> | undefined | null
): string | undefined {
  if (!record) return undefined;

  const firstName = toNonEmptyString(record.firstname);
  const lastName = toNonEmptyString(record.lastname);
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  if (fullName) return fullName;

  return getRecordString(record, LABEL_FIELDS);
}