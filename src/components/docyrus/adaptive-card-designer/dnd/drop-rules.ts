// @ts-nocheck
/* eslint-disable */
/*
 * Drop-target acceptance rules. The matrix is keyed by `parentType` →
 * `slotName` → predicate over the child type. Returning `true` means the drop
 * is allowed; the DnD layer uses this to filter drop zones and to gate the
 * `INSERT_NODE` / `MOVE_NODE` dispatch in `handleDragEnd`.
 */

const ACTION_TYPES = new Set([
  'Action.Submit',
  'Action.Execute',
  'Action.OpenUrl',
  'Action.ShowCard',
  'Action.ToggleVisibility',
  'Action.ResetInputs',
])

/** Types that may NEVER appear inside a generic `items` / `body` array. */
const STRUCTURAL_TYPES = new Set([
  'Column',
  'TableRow',
  'TableCell',
  'TabPage',
  'AccordionPage',
  'CarouselPage',
  'Fact',
  'Choice',
  'StringInline',
])

const INLINE_TYPES = new Set([
  'TextRun',
  'ImageRun',
  'IconRun',
  'CitationRun',
  'StringInline',
])

function isAction(type: string): boolean {
  return ACTION_TYPES.has(type)
}

function isBodyElement(type: string): boolean {
  if (isAction(type)) return false
  if (STRUCTURAL_TYPES.has(type)) return false

  return true
}

interface SlotRule {
  (childType: string): boolean
}

const SLOT_RULES: Record<string, Record<string, SlotRule>> = {
  __root: {
    body: isBodyElement,
    actions: isAction,
  },
  Container: {
    items: isBodyElement,
  },
  Column: {
    items: isBodyElement,
  },
  ColumnSet: {
    columns: (t) => t === 'Column',
  },
  ActionSet: {
    actions: isAction,
  },
  ImageSet: {
    images: (t) => t === 'Image',
  },
  FactSet: {
    facts: (t) => t === 'Fact',
  },
  RichTextBlock: {
    inlines: (t) => INLINE_TYPES.has(t),
  },
  Table: {
    rows: (t) => t === 'TableRow',
  },
  TableRow: {
    cells: (t) => t === 'TableCell',
  },
  TableCell: {
    items: isBodyElement,
  },
  TabSet: {
    tabs: (t) => t === 'TabPage',
  },
  TabPage: {
    items: isBodyElement,
  },
  Accordion: {
    items: (t) => t === 'AccordionPage',
  },
  AccordionPage: {
    items: isBodyElement,
  },
  Carousel: {
    pages: (t) => t === 'CarouselPage',
  },
  CarouselPage: {
    items: isBodyElement,
  },
  'Input.ChoiceSet': {
    choices: (t) => t === 'Choice',
  },
}

/** True when `childType` is a permitted child of `parentType`'s named slot. */
export function canAccept(
  parentType: string,
  slot: string,
  childType: string,
): boolean {
  const rule = SLOT_RULES[parentType]?.[slot]

  return rule ? rule(childType) : false
}
