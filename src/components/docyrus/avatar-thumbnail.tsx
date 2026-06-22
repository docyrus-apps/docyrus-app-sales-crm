'use client';

// @ts-nocheck
/* eslint-disable */
import { type Ref } from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import {
  getTailwindColorLevel,
  isEmojiIcon,
  resolveColorCssValue
} from '@/lib/docyrus/avatar-utils';

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';
const avatarThumbnailVariants = cva(
  'inline-flex shrink-0 items-center justify-center overflow-hidden border bg-muted',
  {
    variants: {
      shape: {
        rounded: 'rounded-md',
        circle: 'rounded-full',
        square: 'rounded-none'
      }
    },
    defaultVariants: {
      shape: 'rounded'
    }
  }
);
const SIZE_CLASS_MAP: Record<number, string> = {
  4: 'size-4',
  5: 'size-5',
  6: 'size-6',
  7: 'size-7',
  8: 'size-8',
  9: 'size-9',
  10: 'size-10',
  11: 'size-11',
  12: 'size-12',
  14: 'size-14',
  16: 'size-16',
  20: 'size-20',
  24: 'size-24'
};

function resolveSizeStep(size: number): number {
  const minSize = Math.max(4, Math.round(size));

  if (SIZE_CLASS_MAP[minSize]) return minSize;
  if (minSize >= 24) return 24;
  if (minSize >= 20) return 20;
  if (minSize >= 16) return 16;
  if (minSize >= 14) return 14;
  if (minSize >= 12) return 12;
  if (minSize >= 10) return 10;
  if (minSize >= 8) return 8;

  return 6;
}

function resolveSizeClass(size: number): string {
  return SIZE_CLASS_MAP[resolveSizeStep(size)] ?? 'size-8';
}

function resolveInnerIconPixels(size: number): number {
  const wrapperStep = resolveSizeStep(size);

  return wrapperStep * 4 * 0.625;
}

function getReadableTextColor(hexColor?: string | null): string {
  if (!hexColor) return 'text-foreground';

  const tailwindLevel = getTailwindColorLevel(hexColor);

  if (tailwindLevel != null) {
    return tailwindLevel <= 300 ? 'text-black' : 'text-white';
  }

  const normalized = hexColor.replace('#', '');

  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) return 'text-foreground';

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.65 ? 'text-black' : 'text-white';
}

export interface AvatarThumbnailProps extends VariantProps<typeof avatarThumbnailVariants> {
  ref?: Ref<HTMLDivElement>;
  size?: number;
  icon?: string | null;
  color?: string | null;
  image?: { signed_url?: string | null; file_name?: string } | null;
  className?: string;
}

function AvatarThumbnail({
  size = 8, icon, color, image, shape, className, ref
}: AvatarThumbnailProps) {
  const sizeClass = resolveSizeClass(size);
  const innerIconPixels = resolveInnerIconPixels(size);
  const iconTextClass = getReadableTextColor(color);
  const trimmedIcon = icon?.trim() ?? '';
  const backgroundColor = color ? resolveColorCssValue(color) : undefined;

  return (
    <div
      ref={ref}
      className={cn(
        avatarThumbnailVariants({ shape }),
        sizeClass,
        className
      )}
      style={backgroundColor && !image?.signed_url ? { backgroundColor } : undefined}>
      {image?.signed_url ? (
        <img
          src={image.signed_url}
          alt={image.file_name ?? 'Avatar'}
          className="size-full object-cover" />
      ) : trimmedIcon ? (
        isEmojiIcon(trimmedIcon) ? (
          <span
            style={{ fontSize: `${innerIconPixels}px` }}
            className="leading-none">
            {trimmedIcon}
          </span>
        ) : (
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: `${innerIconPixels}px`,
              height: `${innerIconPixels}px`
            }}>
            <DocyrusIcon
              icon={trimmedIcon}
              className={cn('size-full', iconTextClass)} />
          </span>
        )
      ) : (
        <span
          className="text-muted-foreground leading-none"
          style={{ fontSize: `${innerIconPixels}px` }}>
          ?
        </span>
      )}
    </div>
  );
}

export { AvatarThumbnail };