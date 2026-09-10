// @ts-nocheck
/* eslint-disable */
/*
 * Master catalogue of every type discriminator the in-repo renderer
 * supports (AC 1.5 + AC 1.6 + Docyrus extensions). Used by a Monaco
 * completion provider that explicitly serves the full list whenever the
 * cursor sits inside a `"type": "..."` value — the schema's discriminated
 * `anyOf` union otherwise lets Monaco's JSON service prune the list down
 * to whichever branches happen to validate the partially-typed object,
 * which silently hides most types from autocomplete.
 */

export interface TypeCompletion {
  type: string
  description: string
  category: 'element' | 'input' | 'action' | 'root'
}

export const TYPE_COMPLETIONS: TypeCompletion[] = [
  {
    type: 'AdaptiveCard',
    description: 'Root Adaptive Card payload.',
    category: 'root',
  },

  {
    type: 'TextBlock',
    description: 'Displays text. Supports a markdown subset.',
    category: 'element',
  },
  {
    type: 'RichTextBlock',
    description: 'Mixed inline text runs with per-run formatting.',
    category: 'element',
  },
  { type: 'Image', description: 'Displays an image.', category: 'element' },
  {
    type: 'Media',
    description: 'Plays audio or video clips.',
    category: 'element',
  },
  {
    type: 'Container',
    description: 'Groups child elements vertically with optional style.',
    category: 'element',
  },
  {
    type: 'ColumnSet',
    description: 'Lays out columns horizontally.',
    category: 'element',
  },
  {
    type: 'FactSet',
    description: 'Renders a list of title / value fact pairs.',
    category: 'element',
  },
  {
    type: 'ImageSet',
    description: 'Lays out a gallery of images.',
    category: 'element',
  },
  {
    type: 'Table',
    description: 'Tabular layout with rows + cells.',
    category: 'element',
  },
  {
    type: 'ActionSet',
    description: 'Embedded set of action buttons in the body.',
    category: 'element',
  },

  {
    type: 'Badge',
    description: 'AC 1.6 badge / pill display element.',
    category: 'element',
  },
  {
    type: 'CodeBlock',
    description: 'AC 1.6 syntax-highlighted code block.',
    category: 'element',
  },
  {
    type: 'CompoundButton',
    description: 'AC 1.6 large action button with title + description.',
    category: 'element',
  },
  { type: 'Icon', description: 'AC 1.6 icon element.', category: 'element' },
  {
    type: 'ProgressBar',
    description: 'AC 1.6 linear progress indicator.',
    category: 'element',
  },
  {
    type: 'ProgressRing',
    description: 'AC 1.6 circular progress indicator.',
    category: 'element',
  },
  {
    type: 'Rating',
    description: 'AC 1.6 star rating display.',
    category: 'element',
  },
  {
    type: 'Carousel',
    description: 'AC 1.6 carousel of card pages.',
    category: 'element',
  },
  {
    type: 'Accordion',
    description: 'AC 1.6 accordion of collapsible panels.',
    category: 'element',
  },
  {
    type: 'TabSet',
    description: 'AC 1.6 tabbed content panels.',
    category: 'element',
  },
  {
    type: 'LoopComponent',
    description: 'AC 1.6 Microsoft Loop component reference.',
    category: 'element',
  },
  {
    type: 'Component',
    description: 'AC 1.6 host-registered custom component.',
    category: 'element',
  },

  {
    type: 'Chart.VerticalBar',
    description: 'Vertical bar chart.',
    category: 'element',
  },
  {
    type: 'Chart.HorizontalBar',
    description: 'Horizontal bar chart.',
    category: 'element',
  },
  { type: 'Chart.Pie', description: 'Pie chart.', category: 'element' },
  { type: 'Chart.Donut', description: 'Donut chart.', category: 'element' },
  { type: 'Chart.Line', description: 'Line chart.', category: 'element' },
  { type: 'Chart.Gauge', description: 'Gauge chart.', category: 'element' },

  {
    type: 'Input.Text',
    description: 'Single-line or multi-line text input.',
    category: 'input',
  },
  { type: 'Input.Number', description: 'Numeric input.', category: 'input' },
  { type: 'Input.Date', description: 'Date picker.', category: 'input' },
  { type: 'Input.Time', description: 'Time picker.', category: 'input' },
  { type: 'Input.Toggle', description: 'Boolean toggle.', category: 'input' },
  {
    type: 'Input.ChoiceSet',
    description: 'Single / multi-choice select.',
    category: 'input',
  },
  {
    type: 'Input.Rating',
    description: 'AC 1.6 user-editable star rating input.',
    category: 'input',
  },

  {
    type: 'Action.Submit',
    description: 'Collects inputs and submits to the host.',
    category: 'action',
  },
  {
    type: 'Action.Execute',
    description: 'AC 1.6 host-handled invoke action with verb + data.',
    category: 'action',
  },
  {
    type: 'Action.OpenUrl',
    description: 'Opens an external URL.',
    category: 'action',
  },
  {
    type: 'Action.ShowCard',
    description: 'Reveals an inline nested card.',
    category: 'action',
  },
  {
    type: 'Action.ToggleVisibility',
    description: 'Toggles visibility on named elements.',
    category: 'action',
  },
  {
    type: 'Action.ResetInputs',
    description: 'AC 1.6 action that resets named inputs.',
    category: 'action',
  },
]

const SORT_ORDER: Record<TypeCompletion['category'], string> = {
  root: '0',
  element: '1',
  input: '2',
  action: '3',
}

/** Sort key used by the Monaco completion provider so categories cluster. */
export function sortTextFor(item: TypeCompletion): string {
  return `${SORT_ORDER[item.category]}_${item.type}`
}
