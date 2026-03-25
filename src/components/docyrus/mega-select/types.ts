'use client';

import { type ReactNode } from 'react';

export interface MegaSelectItem<T = unknown> {
  /** Unique identifier for this item. */
  id: string;
  /** Display label shown on the card. */
  label: string;
  /** Optional secondary text below the label. */
  description?: string;
  /** DocyrusIcon identifier (e.g. "fal star"). */
  icon?: string;
  /** Image URL — takes precedence over icon when provided. */
  image?: string;
  /** Tailwind color name for accent styling (e.g. "blue", "emerald"). */
  color?: string;
  /** Category ID for filtering. */
  categoryId?: string;
  /** Rich content rendered in the detail panel. */
  content?: ReactNode;
  /** Whether this item is disabled. */
  disabled?: boolean;
  /** Original data passthrough for external use. */
  data?: T;
}

export interface MegaSelectCategory {
  /** Unique identifier for this category. */
  id: string;
  /** Display label for the category tab. */
  label: string;
  /** Optional icon identifier. */
  icon?: string;
}

export interface MapToMegaSelectItemsConfig<R> {
  id: keyof R;
  label: keyof R;
  description?: keyof R;
  icon?: keyof R;
  image?: keyof R;
  color?: keyof R;
  categoryId?: keyof R;
}

/**
 * Maps an array of raw objects to MegaSelectItem[] using field-name mappings.
 * Useful when working with dynamic API data.
 */
export function mapToMegaSelectItems<R extends Record<string, unknown>>(
  data: R[],
  config: MapToMegaSelectItemsConfig<R>
): MegaSelectItem<R>[] {
  return data.map(row => ({
    id: String(row[config.id]),
    label: String(row[config.label]),
    description: config.description ? String(row[config.description] ?? '') : undefined,
    icon: config.icon ? String(row[config.icon] ?? '') || undefined : undefined,
    image: config.image ? String(row[config.image] ?? '') || undefined : undefined,
    color: config.color ? String(row[config.color] ?? '') || undefined : undefined,
    categoryId: config.categoryId ? String(row[config.categoryId] ?? '') || undefined : undefined,
    data: row
  }));
}