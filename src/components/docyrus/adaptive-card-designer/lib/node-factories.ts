// @ts-nocheck
/* eslint-disable */
import { type DesignerNode } from '../adaptive-card-designer-types'
import { createDesignerId } from './node-id'
import { slotsFor } from './node-tree'

function emptySlots(type: string): Record<string, DesignerNode[]> {
  const slots: Record<string, DesignerNode[]> = {}

  for (const name of slotsFor(type)) slots[name] = []

  return slots
}

/** Create a fresh designer node with sensible defaults for the given type. */
export function createDefaultNode(type: string): DesignerNode {
  const node: DesignerNode = {
    __designerId: createDesignerId(),
    type,
    props: { ...DEFAULT_PROPS[type] },
    slots: emptySlots(type),
  }

  const seed = DEFAULT_SLOT_SEEDS[type]

  if (seed) {
    for (const [slot, count] of Object.entries(seed)) {
      const childType = SLOT_CHILD_TYPE[type]?.[slot]

      if (!childType) continue

      node.slots[slot] = Array.from({ length: count }, () =>
        createDefaultNode(childType),
      )
    }
  }

  return node
}

/**
 * Per-type default property bag. Only fields whose default differs from
 * "omitted" appear here — anything not listed stays undefined / unset.
 */
const DEFAULT_PROPS: Record<string, Record<string, unknown>> = {
  __root: { version: '1.5' },

  TextBlock: { text: 'New text block', wrap: true },
  RichTextBlock: {},
  Image: { url: 'https://adaptivecards.io/content/cats/1.png' },
  Media: { sources: [{ url: '', mimeType: 'video/mp4' }] },
  Container: {},
  ColumnSet: {},
  Column: { width: 'stretch' },
  ActionSet: {},
  ImageSet: {},
  FactSet: {},
  Table: { firstRowAsHeader: true, showGridLines: true },
  TableRow: {},
  TableCell: {},
  Badge: { text: 'Badge', appearance: 'filled' },
  CodeBlock: { codeSnippet: '// code', language: 'TypeScript' },
  CompoundButton: { title: 'Action', description: 'Description' },
  Icon: { name: 'Star', size: 'standard' },
  ProgressBar: { value: 50, max: 100 },
  ProgressRing: { value: 50, max: 100, size: 'medium' },
  Rating: { value: 3, max: 5 },

  'Input.Text': { id: 'text', placeholder: 'Enter text' },
  'Input.Number': { id: 'number', placeholder: '0' },
  'Input.Date': { id: 'date' },
  'Input.Time': { id: 'time' },
  'Input.Toggle': { id: 'toggle', title: 'Toggle' },
  'Input.ChoiceSet': { id: 'choice', style: 'compact' },
  'Input.Rating': { id: 'rating', max: 5 },

  'Action.Submit': { title: 'Submit' },
  'Action.Execute': { title: 'Execute', verb: 'doIt' },
  'Action.OpenUrl': { title: 'Open URL', url: 'https://example.com' },
  'Action.ShowCard': {
    title: 'Show card',
    card: { type: 'AdaptiveCard', version: '1.5', body: [] },
  },
  'Action.ToggleVisibility': { title: 'Toggle', targetElements: [] },
  'Action.ResetInputs': { title: 'Reset', targetInputIds: [] },

  Accordion: {},
  AccordionPage: { headerTitle: 'Section' },
  TabSet: {},
  TabPage: { title: 'Tab' },
  Carousel: {},
  CarouselPage: {},
  LoopComponent: { componentUrl: '' },
  Component: { name: 'CustomComponent', properties: {} },
  'Chart.VerticalBar': {
    data: [
      { x: 'A', y: 10 },
      { x: 'B', y: 20 },
      { x: 'C', y: 15 },
    ],
  },
  'Chart.HorizontalBar': {
    data: [
      { x: 'A', y: 10 },
      { x: 'B', y: 20 },
    ],
  },
  'Chart.Pie': {
    data: [
      { x: 'A', y: 30 },
      { x: 'B', y: 70 },
    ],
  },
  'Chart.Donut': {
    data: [
      { x: 'A', y: 30 },
      { x: 'B', y: 70 },
    ],
    thickness: 'medium',
  },
  'Chart.Line': {
    data: [
      { x: 1, y: 10 },
      { x: 2, y: 18 },
      { x: 3, y: 12 },
    ],
  },
  'Chart.Gauge': { value: 60, min: 0, max: 100 },

  Fact: { title: 'Fact', value: 'Value' },
  Choice: { title: 'Choice', value: 'choice' },
  StringInline: { text: 'inline' },
}

/**
 * Slot-name → seed-count mapping. When a node is created, each listed slot
 * gets `count` default children of the type in {@link SLOT_CHILD_TYPE}.
 */
const DEFAULT_SLOT_SEEDS: Record<string, Record<string, number>> = {
  ColumnSet: { columns: 2 },
  Table: { rows: 1 },
  TableRow: { cells: 2 },
  FactSet: { facts: 2 },
  ImageSet: { images: 1 },
  ActionSet: { actions: 1 },
  RichTextBlock: { inlines: 1 },
  'Input.ChoiceSet': { choices: 2 },
  TabSet: { tabs: 2 },
  Accordion: { items: 1 },
  Carousel: { pages: 2 },
}

/** Child element type for each parent + slot combination. */
const SLOT_CHILD_TYPE: Record<string, Record<string, string>> = {
  __root: { body: 'TextBlock', actions: 'Action.Submit' },
  Container: { items: 'TextBlock' },
  Column: { items: 'TextBlock' },
  ColumnSet: { columns: 'Column' },
  ActionSet: { actions: 'Action.Submit' },
  ImageSet: { images: 'Image' },
  FactSet: { facts: 'Fact' },
  RichTextBlock: { inlines: 'StringInline' },
  Table: { rows: 'TableRow' },
  TableRow: { cells: 'TableCell' },
  TableCell: { items: 'TextBlock' },
  TabSet: { tabs: 'TabPage' },
  TabPage: { items: 'TextBlock' },
  Accordion: { items: 'AccordionPage' },
  AccordionPage: { items: 'TextBlock' },
  Carousel: { pages: 'CarouselPage' },
  CarouselPage: { items: 'TextBlock' },
  'Input.ChoiceSet': { choices: 'Choice' },
}

/** Default child type a parent's slot should accept. Used by DnD insertion. */
export function defaultChildType(
  parentType: string,
  slot: string,
): string | undefined {
  return SLOT_CHILD_TYPE[parentType]?.[slot]
}
