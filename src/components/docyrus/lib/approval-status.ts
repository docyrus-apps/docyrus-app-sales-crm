'use client';

import { format } from 'date-fns';

export const APPROVAL_STATUS = {
  DRAFT: 'DRAFT',
  WAITING_FOR_APPROVAL: 'WAITING_FOR_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  WITHDRAWN: 'WITHDRAWN'
} as const;

export type ApprovalWorkflowStatus
  = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

export interface ApprovalUserSnapshot {
  userId?: string | null;
  id?: string | null;
  name?: string | null;
  displayName?: string | null;
  display_name?: string | null;
  firstName?: string | null;
  firstname?: string | null;
  lastName?: string | null;
  lastname?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
}

export interface ApprovalStepValue {
  id?: string | null;
  status?: string | null;
  respondedAt?: string | Date | null;
  respondedBy?: string | null;
  respondedByUser?: ApprovalUserSnapshot | null;
  comments?: string | null;
  metadata?: unknown;
  [key: string]: unknown;
}

export interface ApprovalValueObject {
  requestId?: string | null;
  status: string;
  respondedAt?: string | Date | null;
  respondedBy?: string | null;
  respondedByUser?: ApprovalUserSnapshot | null;
  comments?: string | null;
  metadata?: unknown;
  steps: Array<ApprovalStepValue>;
  [key: string]: unknown;
}

type ApprovalStatusMap = Record<string, ApprovalWorkflowStatus>;

const STATUS_ALIASES: ApprovalStatusMap = {
  draft: APPROVAL_STATUS.DRAFT,
  waiting_for_approval: APPROVAL_STATUS.WAITING_FOR_APPROVAL,
  pending: APPROVAL_STATUS.WAITING_FOR_APPROVAL,
  approved: APPROVAL_STATUS.APPROVED,
  rejected: APPROVAL_STATUS.REJECTED,
  revision_requested: APPROVAL_STATUS.REVISION_REQUESTED,
  withdrawn: APPROVAL_STATUS.WITHDRAWN
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  [APPROVAL_STATUS.DRAFT]:
    'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  [APPROVAL_STATUS.WAITING_FOR_APPROVAL]:
    'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  [APPROVAL_STATUS.APPROVED]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  [APPROVAL_STATUS.REJECTED]:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  [APPROVAL_STATUS.REVISION_REQUESTED]:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  [APPROVAL_STATUS.WITHDRAWN]:
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  return value;
}

export function toApprovalStatusCode(
  status: unknown,
  fallback: ApprovalWorkflowStatus = APPROVAL_STATUS.DRAFT
): string {
  if (typeof status !== 'string') return fallback;
  const trimmed = status.trim();

  if (!trimmed) return fallback;

  const canonical = STATUS_ALIASES[trimmed.toLowerCase()];

  return canonical ?? trimmed.toUpperCase();
}

export function createEmptyApprovalValue(): ApprovalValueObject {
  return {
    requestId: null,
    status: APPROVAL_STATUS.DRAFT,
    respondedAt: null,
    respondedBy: null,
    respondedByUser: null,
    comments: null,
    metadata: null,
    steps: []
  };
}

export function normalizeApprovalUserSnapshot(
  value: unknown
): ApprovalUserSnapshot | null {
  const record = asRecord(value);

  if (!record) return null;

  const userId = asString(record.userId) ?? asString(record.id);
  const explicitName
    = asString(record.name)
      ?? asString(record.displayName)
      ?? asString(record.display_name);
  const firstName
    = asString(record.firstName) ?? asString(record.firstname);
  const lastName = asString(record.lastName) ?? asString(record.lastname);
  const avatarUrl
    = asString(record.avatarUrl)
      ?? asString(record.avatar_url)
      ?? asString(record.profile_image_url);

  if (!userId && !explicitName && !firstName && !lastName && !avatarUrl) {
    return null;
  }

  return {
    userId,
    id: asString(record.id) ?? userId ?? null,
    name: explicitName,
    displayName: asString(record.displayName),
    display_name: asString(record.display_name),
    firstName,
    firstname: asString(record.firstname),
    lastName,
    lastname: asString(record.lastname),
    avatarUrl,
    avatar_url: asString(record.avatar_url),
    profile_image_url: asString(record.profile_image_url)
  };
}

function normalizeApprovalStepValue(value: unknown): ApprovalStepValue {
  const record = asRecord(value);

  if (!record) return {};

  return {
    ...record,
    id: asString(record.id),
    status: record.status != null ? toApprovalStatusCode(record.status, APPROVAL_STATUS.DRAFT) : null,
    respondedAt:
      typeof record.respondedAt === 'string' || record.respondedAt instanceof Date
        ? (record.respondedAt as string | Date)
        : null,
    respondedBy: asString(record.respondedBy),
    respondedByUser: normalizeApprovalUserSnapshot(record.respondedByUser),
    comments: asString(record.comments),
    metadata: record.metadata
  };
}

export function normalizeApprovalValue(value: unknown): ApprovalValueObject {
  if (typeof value === 'string') {
    return {
      ...createEmptyApprovalValue(),
      status: toApprovalStatusCode(value)
    };
  }

  const record = asRecord(value);

  if (!record) {
    return createEmptyApprovalValue();
  }

  const steps = Array.isArray(record.steps)
    ? record.steps.map(step => normalizeApprovalStepValue(step))
    : [];

  return {
    ...createEmptyApprovalValue(),
    ...record,
    status: toApprovalStatusCode(record.status),
    respondedAt:
      typeof record.respondedAt === 'string' || record.respondedAt instanceof Date
        ? (record.respondedAt as string | Date)
        : null,
    respondedBy: asString(record.respondedBy),
    respondedByUser: normalizeApprovalUserSnapshot(record.respondedByUser),
    comments: asString(record.comments),
    metadata: record.metadata,
    steps
  };
}

export function hasApprovalWorkflowShape(value: unknown): boolean {
  const record = asRecord(value);

  if (!record) return false;

  return (
    'status' in record
    || 'steps' in record
    || 'respondedAt' in record
    || 'respondedBy' in record
    || 'comments' in record
  );
}

export function getApprovalStatusBadgeClasses(status: unknown): string {
  const code = toApprovalStatusCode(status);

  return STATUS_BADGE_CLASSES[code] ?? STATUS_BADGE_CLASSES[APPROVAL_STATUS.DRAFT];
}

export function formatApprovalTimestamp(value: string | Date | null | undefined): string {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return format(date, 'yyyy-MM-dd HH:mm');
}

export function getApprovalUserId(user: ApprovalUserSnapshot | null | undefined): string | null {
  if (!user) return null;

  return user.userId ?? user.id ?? null;
}

export function getApprovalUserAvatarUrl(
  user: ApprovalUserSnapshot | null | undefined
): string | null {
  if (!user) return null;

  return user.avatarUrl ?? user.avatar_url ?? user.profile_image_url ?? null;
}

export function getApprovalUserName(
  user: ApprovalUserSnapshot | null | undefined,
  fallbackId?: string | null
): string {
  if (user) {
    const explicitName
      = user.name
        ?? user.displayName
        ?? user.display_name;

    if (explicitName?.trim()) {
      return explicitName.trim();
    }

    const first = user.firstName ?? user.firstname;
    const last = user.lastName ?? user.lastname;
    const full = [first, last].filter(Boolean).join(' ').trim();

    if (full) return full;

    const userId = getApprovalUserId(user);

    if (userId) return userId;
  }

  if (fallbackId?.trim()) return fallbackId.trim();

  return 'Unknown';
}

export function getApprovalUserInitials(nameOrId: string): string {
  const cleaned = nameOrId.trim();

  if (!cleaned) return '?';

  const parts = cleaned
    .split(/\s+/)
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  return (parts || cleaned.slice(0, 2)).toUpperCase();
}