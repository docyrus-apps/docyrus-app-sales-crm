'use client'

// @ts-nocheck
/* eslint-disable */
import { type DesignerNode } from '../../adaptive-card-designer-types'
import { useNodeUpdater } from './use-node-updater'
import { BooleanSwitch, TextField } from './field-primitives'
import { HeightSelect, SpacingSelect } from './enum-presets'
import { PropSection } from './prop-section'

interface CommonPropertiesProps {
  node: DesignerNode
  /** Set to false for elements that don't accept `height` (e.g. Image uses `height` as a px/keyword string). */
  showHeight?: boolean
  /** Title for the section. Defaults to "Layout". */
  title?: string
  defaultOpen?: boolean
}

export function CommonProperties({
  node,
  showHeight = true,
  title = 'Layout',
  defaultOpen = false,
}: CommonPropertiesProps) {
  const update = useNodeUpdater(node.__designerId)
  const { props } = node

  return (
    <PropSection title={title} defaultOpen={defaultOpen}>
      <TextField
        label="ID"
        value={props.id as string | undefined}
        placeholder="my-element"
        helpText="Used to reference this element from actions (toggleVisibility, resetInputs)."
        onChange={(next) => update('id', next)}
      />
      <BooleanSwitch
        label="Is visible"
        value={props.isVisible as boolean | undefined}
        defaultValue
        onChange={(next) => update('isVisible', next)}
      />
      <SpacingSelect
        value={props.spacing as Parameters<typeof SpacingSelect>[0]['value']}
        onChange={(next) => update('spacing', next)}
      />
      <BooleanSwitch
        label="Separator"
        value={props.separator as boolean | undefined}
        defaultValue={false}
        onChange={(next) => update('separator', next)}
      />
      {showHeight ? (
        <HeightSelect
          value={props.height as Parameters<typeof HeightSelect>[0]['value']}
          onChange={(next) => update('height', next)}
        />
      ) : null}
    </PropSection>
  )
}
