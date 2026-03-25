'use client';

import { type AvatarFieldValue } from '@/lib/avatar-utils';

import { AvatarThumbnail } from '@/components/docyrus/avatar-thumbnail';
import { extractAvatarValue, normalizeAvatarValue } from '@/lib/avatar-utils';
import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

function parseValue(value: unknown): AvatarFieldValue {
  if (!value || typeof value !== 'object') {
    return normalizeAvatarValue({
      icon: typeof value === 'string' ? value : null
    });
  }

  return normalizeAvatarValue(value as Partial<AvatarFieldValue>);
}

export function AvatarValue({
  field,
  value,
  record,
  className
}: DocyrusValueProps) {
  const avatar
    = record && typeof record === 'object' ? extractAvatarValue(record, field.avatarMapping) : parseValue(value);

  return (
    <span className={cn('inline-flex items-center', className)}>
      <AvatarThumbnail
        size={7}
        icon={avatar.icon}
        color={avatar.color}
        image={avatar.image} />
    </span>
  );
}