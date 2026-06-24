// @ts-nocheck
/* eslint-disable */
/*
 * The schema served by adaptivecards.io reflects AC 1.5 — it lacks
 * definitions for the AC 1.6 elements / actions / inputs the in-repo
 * renderer supports (Badge, CodeBlock, CompoundButton, Icon, ProgressBar,
 * ProgressRing, Rating, Carousel, Accordion, TabSet, Chart.*,
 * Action.Execute, Action.ResetInputs, Input.Rating, plus the AC 1.6
 * `version` value). Without these the editor's type-completion only offers
 * the AC 1.5 subset.
 *
 * This module adds the missing definitions and merges them into
 * `ImplementationsOf.Element` / `ImplementationsOf.Action` so Monaco's JSON
 * service surfaces them in completions and stops marking them as "unknown
 * type".
 */
import baseSchema from './adaptive-card.schema.json'

const AC16_ELEMENTS: Array<{ type: string; description?: string }> = [
  { type: 'Badge', description: 'AC 1.6 badge / pill display element.' },
  { type: 'CodeBlock', description: 'AC 1.6 syntax-highlighted code block.' },
  {
    type: 'CompoundButton',
    description: 'AC 1.6 large action button with title + description.',
  },
  { type: 'Icon', description: 'AC 1.6 icon element.' },
  { type: 'ProgressBar', description: 'AC 1.6 linear progress indicator.' },
  { type: 'ProgressRing', description: 'AC 1.6 circular progress indicator.' },
  { type: 'Rating', description: 'AC 1.6 star rating display.' },
  { type: 'Carousel', description: 'AC 1.6 carousel of card pages.' },
  { type: 'Accordion', description: 'AC 1.6 accordion of collapsible panels.' },
  { type: 'TabSet', description: 'AC 1.6 set of tabbed content panels.' },
  {
    type: 'LoopComponent',
    description: 'AC 1.6 Microsoft Loop component reference.',
  },
  {
    type: 'Component',
    description: 'AC 1.6 host-registered custom component.',
  },
  { type: 'Chart.VerticalBar', description: 'AC 1.6 vertical bar chart.' },
  { type: 'Chart.HorizontalBar', description: 'AC 1.6 horizontal bar chart.' },
  { type: 'Chart.Pie', description: 'AC 1.6 pie chart.' },
  { type: 'Chart.Donut', description: 'AC 1.6 donut chart.' },
  { type: 'Chart.Line', description: 'AC 1.6 line chart.' },
  { type: 'Chart.Gauge', description: 'AC 1.6 gauge chart.' },
]

const AC16_INPUTS: Array<{ type: string; description?: string }> = [
  {
    type: 'Input.Rating',
    description: 'AC 1.6 user-editable star rating input.',
  },
]

const AC16_ACTIONS: Array<{ type: string; description?: string }> = [
  {
    type: 'Action.Execute',
    description: 'AC 1.6 host-handled invoke action with verb + data.',
  },
  {
    type: 'Action.ResetInputs',
    description: 'AC 1.6 action that resets named inputs.',
  },
]

function definition(name: string, description?: string) {
  return {
    type: 'object',
    description,
    required: ['type'],
    properties: {
      type: { enum: [name], description: `Must be \`${name}\`` },
      id: {
        type: 'string',
        description: 'A unique identifier for the element.',
      },
      isVisible: {
        type: 'boolean',
        description: 'Whether this element is visible.',
      },
      spacing: { $ref: '#/definitions/Spacing' },
      separator: {
        type: 'boolean',
        description: 'Render a separator line above this element.',
      },
      height: { $ref: '#/definitions/BlockElementHeight' },
      requires: { $ref: '#/definitions/Requires' },
      fallback: { $ref: '#/definitions/Extendable.Element' },
    },
    additionalProperties: true,
  }
}

function branch(refName: string) {
  return {
    required: ['type'],
    allOf: [{ $ref: `#/definitions/${refName}` }],
  }
}

/*
 * Type names that, when present as a sibling field on an element, would cause
 * the strict AC 1.5 schema to reject most branches and hide their `type` value
 * from autocomplete. The list is built by scanning every element definition's
 * own property keys — anything we relax `additionalProperties` on can still be
 * validated against its own schema, but unrelated branches won't be eliminated
 * just because an extra field is present.
 */

/** Patched schema with AC 1.6 element / action / input types merged in. */
export function buildAugmentedSchema(): object {
  const schema = JSON.parse(JSON.stringify(baseSchema)) as {
    definitions: Record<string, unknown>
    properties?: Record<string, unknown>
  }
  const defs = schema.definitions

  /*
   * Relax `additionalProperties: false` on every existing element / action /
   * input definition. The strict default causes Monaco's JSON service to
   * filter the `type` enum suggestions down to only the branches whose
   * fields the current incomplete object happens to be compatible with — so
   * typing a Media's sources field would hide TextBlock, Container, etc.
   * from autocomplete. Relaxing this here keeps deep field validation
   * intact (each branch still validates its own properties) while letting
   * Monaco surface every valid `type` value at the `type:` position.
   */
  for (const def of Object.values(defs)) {
    if (def && typeof def === 'object' && 'properties' in def) {
      ;(def as { additionalProperties?: unknown }).additionalProperties = true
    }
  }

  for (const { type, description } of AC16_ELEMENTS) {
    if (!defs[type]) defs[type] = definition(type, description)
  }

  for (const { type, description } of AC16_INPUTS) {
    if (!defs[type]) defs[type] = definition(type, description)
  }

  for (const { type, description } of AC16_ACTIONS) {
    if (!defs[type]) defs[type] = definition(type, description)
  }

  /*
   * Extend the element / action implementation unions so the new types
   * show up in body[*].type and actions[*].type autocomplete.
   */
  const elementImpl = defs['ImplementationsOf.Element'] as
    | { anyOf?: unknown[] }
    | undefined
  const actionImpl = defs['ImplementationsOf.Action'] as
    | { anyOf?: unknown[] }
    | undefined

  if (elementImpl?.anyOf) {
    for (const { type } of [...AC16_ELEMENTS, ...AC16_INPUTS]) {
      elementImpl.anyOf.push(branch(type))
    }
  }

  if (actionImpl?.anyOf) {
    for (const { type } of AC16_ACTIONS) {
      actionImpl.anyOf.push(branch(type))
    }
  }

  const adaptiveCard = defs.AdaptiveCard as
    | { properties?: { version?: { enum?: string[] } } }
    | undefined
  const versionDef = adaptiveCard?.properties?.version

  if (versionDef?.enum && !versionDef.enum.includes('1.6')) {
    versionDef.enum.push('1.6')
  }

  return schema
}
