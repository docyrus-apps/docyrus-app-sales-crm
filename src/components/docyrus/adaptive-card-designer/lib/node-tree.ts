// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardPayload } from '@/components/docyrus/adaptive-card'

import { type DesignerNode } from '../adaptive-card-designer-types'
import { createDesignerId } from './node-id'

/*
 * SLOT_MAP declares which named child arrays each element type owns. Keys not
 * listed here are preserved verbatim in `node.props` and round-trip through
 * `treeToCard` unchanged. Synthetic types (`Fact`, `Choice`, `StringInline`,
 * `TableRow`, `TableCell`) bridge schema shapes that lack a `type`
 * discriminant — they exist only inside the designer tree, never in the
 * emitted JSON.
 */
export const SLOT_MAP: Record<string, readonly string[]> = {
  __root: ['body', 'actions'],
  Container: ['items'],
  ColumnSet: ['columns'],
  Column: ['items'],
  ActionSet: ['actions'],
  ImageSet: ['images'],
  FactSet: ['facts'],
  RichTextBlock: ['inlines'],
  Table: ['rows'],
  TableRow: ['cells'],
  TableCell: ['items'],
  TabSet: ['tabs'],
  TabPage: ['items'],
  Accordion: ['items'],
  AccordionPage: ['items'],
  Carousel: ['pages'],
  CarouselPage: ['items'],
  'Input.ChoiceSet': ['choices'],
}

const ROOT_TYPE = '__root'

/** Slot names the parent owns. Empty for leaf elements. */
export function slotsFor(type: string): readonly string[] {
  return SLOT_MAP[type] ?? []
}

export function isLeafType(type: string): boolean {
  return slotsFor(type).length === 0
}

/*
 * Slots that are required by the Adaptive Cards schema and must be emitted
 * even when empty — otherwise the renderer would crash on `undefined.map(...)`
 * (RichTextBlock.inlines, FactSet.facts, ImageSet.images, ActionSet.actions,
 * TableRow.cells, Carousel.pages, Input.ChoiceSet.choices).
 */
const REQUIRED_SLOTS: Record<string, readonly string[]> = {
  RichTextBlock: ['inlines'],
  FactSet: ['facts'],
  ImageSet: ['images'],
  ActionSet: ['actions'],
  TableRow: ['cells'],
  Carousel: ['pages'],
  'Input.ChoiceSet': ['choices'],
}

function isRequiredSlot(type: string, slot: string): boolean {
  return REQUIRED_SLOTS[type]?.includes(slot) ?? false
}

function emptySlots(type: string): Record<string, DesignerNode[]> {
  const slots: Record<string, DesignerNode[]> = {}

  for (const name of slotsFor(type)) slots[name] = []

  return slots
}

/* ─── Synthetic-child detection ────────────────────────────────── */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readType(raw: unknown, fallback: string): string {
  if (isPlainObject(raw) && typeof raw.type === 'string') return raw.type

  return fallback
}

/* ─── card → tree ──────────────────────────────────────────────── */

/**
 * Convert an `AdaptiveCardPayload` into a designer tree. Unknown fields are
 * preserved on `node.props` so forward-compat extension elements round-trip
 * losslessly.
 */
export function cardToTree(card: AdaptiveCardPayload): DesignerNode {
  const slots = emptySlots(ROOT_TYPE)
  const props: Record<string, unknown> = {}
  const raw = card as unknown as Record<string, unknown>
  const slotNames = new Set<string>(slotsFor(ROOT_TYPE))

  for (const [key, value] of Object.entries(raw)) {
    if (key === 'type') continue

    if (slotNames.has(key) && Array.isArray(value)) {
      slots[key] = value.map((child, index) => elementToNode(child, key, index))
      continue
    }

    props[key] = value
  }

  return {
    __designerId: createDesignerId(),
    type: ROOT_TYPE,
    props,
    slots,
  }
}

function elementToNode(
  raw: unknown,
  parentSlot: string,
  _index: number,
): DesignerNode {
  if (typeof raw === 'string' && parentSlot === 'inlines') {
    return {
      __designerId: createDesignerId(),
      type: 'StringInline',
      props: { text: raw },
      slots: {},
    }
  }

  if (parentSlot === 'facts' && isPlainObject(raw)) {
    return {
      __designerId: createDesignerId(),
      type: 'Fact',
      props: { ...raw },
      slots: {},
    }
  }

  if (parentSlot === 'choices' && isPlainObject(raw)) {
    return {
      __designerId: createDesignerId(),
      type: 'Choice',
      props: { ...raw },
      slots: {},
    }
  }

  if (parentSlot === 'rows' && isPlainObject(raw)) {
    return splitNode(raw, readType(raw, 'TableRow'))
  }

  if (parentSlot === 'cells' && isPlainObject(raw)) {
    return splitNode(raw, readType(raw, 'TableCell'))
  }

  if (
    parentSlot === 'columns' &&
    isPlainObject(raw) &&
    readType(raw, '') === 'Column'
  ) {
    return splitNode(raw, 'Column')
  }

  if (parentSlot === 'columns' && isPlainObject(raw)) {
    return splitNode(raw, 'Column')
  }

  if (parentSlot === 'tabs' && isPlainObject(raw)) {
    return splitNode(raw, readType(raw, 'TabPage'))
  }

  if (parentSlot === 'pages' && isPlainObject(raw)) {
    return splitNode(raw, readType(raw, 'CarouselPage'))
  }

  if (isPlainObject(raw)) {
    const t = readType(raw, 'Unknown')

    return splitNode(raw, t)
  }

  return {
    __designerId: createDesignerId(),
    type: 'Unknown',
    props: { value: raw },
    slots: {},
  }
}

function splitNode(raw: Record<string, unknown>, type: string): DesignerNode {
  const slots = emptySlots(type)
  const props: Record<string, unknown> = {}
  const slotNames = new Set<string>(slotsFor(type))

  for (const [key, value] of Object.entries(raw)) {
    if (key === 'type') continue

    if (slotNames.has(key) && Array.isArray(value)) {
      slots[key] = value.map((child, idx) => elementToNode(child, key, idx))
      continue
    }

    props[key] = value
  }

  return {
    __designerId: createDesignerId(),
    type,
    props,
    slots,
  }
}

/* ─── tree → card ──────────────────────────────────────────────── */

/**
 * Emit a clean `AdaptiveCardPayload` from a designer tree. Empty slot arrays
 * are dropped, `undefined` props are stripped, and synthetic types
 * (`StringInline`, `Fact`, `Choice`) collapse back to their schema-native
 * shape.
 */
export interface TreeToCardOptions {
  /**
   * When `true`, every emitted element carries a non-schema `_designerId`
   * field equal to the source node's `__designerId`. The Adaptive Card
   * renderer surfaces this as `data-ac-designer-id` on the rendered DOM so
   * the designer's canvas overlay can map clicks and drop targets back to
   * tree nodes. Default: `false` (clean output for `onChange`).
   */
  includeDesignerIds?: boolean
}

export function treeToCard(
  root: DesignerNode,
  options: TreeToCardOptions = {},
): AdaptiveCardPayload {
  if (root.type !== ROOT_TYPE) {
    throw new Error(`treeToCard expected root node, received type=${root.type}`)
  }

  const out = nodeToValue(root, options) as Record<string, unknown>

  return {
    type: 'AdaptiveCard',
    version: typeof out.version === 'string' ? out.version : '1.5',
    ...out,
  } as AdaptiveCardPayload
}

function nodeToValue(node: DesignerNode, options: TreeToCardOptions): unknown {
  /*
   * Synthetic types fold back into their schema-native shape — they do not
   * round-trip a `_designerId` because Fact / Choice / StringInline have no
   * schema-allowed extension surface.
   */
  if (node.type === 'StringInline') {
    const { text } = node.props

    return typeof text === 'string' ? text : ''
  }

  if (node.type === 'Fact' || node.type === 'Choice') {
    return stripUndefined(node.props)
  }

  const out: Record<string, unknown> = {}

  if (node.type !== ROOT_TYPE) {
    out.type = node.type
  }

  if (options.includeDesignerIds && node.type !== ROOT_TYPE) {
    out._designerId = node.__designerId
  }

  for (const [key, value] of Object.entries(node.props)) {
    if (value === undefined) continue

    out[key] = value
  }

  for (const slot of slotsFor(node.type)) {
    const children = node.slots[slot] ?? []

    if (children.length === 0 && !isRequiredSlot(node.type, slot)) continue

    out[slot] = children.map((child) => nodeToValue(child, options))
  }

  return out
}

function stripUndefined(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue

    out[key] = value
  }

  return out
}

/* ─── Round-trip normalization (for testing) ───────────────────── */

/**
 * Normalize a card payload for round-trip equality assertions. Strips empty
 * arrays, `undefined` values, and optional `type` fields on `TableRow` /
 * `TableCell` so `treeToCard(cardToTree(sample))` can be deep-compared to
 * the original sample.
 */
export function normalizeForRoundTrip(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForRoundTrip)
  }

  if (!isPlainObject(value)) return value

  const isTableSubrow = value.type === 'TableRow' || value.type === 'TableCell'
  const out: Record<string, unknown> = {}

  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined) continue
    if (isTableSubrow && key === 'type') continue

    const normalized = normalizeForRoundTrip(raw)

    if (Array.isArray(normalized) && normalized.length === 0) continue

    out[key] = normalized
  }

  return out
}
