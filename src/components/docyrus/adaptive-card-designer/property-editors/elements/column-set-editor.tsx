'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardContainerStyle,
  type AdaptiveCardHorizontalAlignment,
} from '@/components/docyrus/adaptive-card'

import { type DesignerNode } from '../../adaptive-card-designer-types'
import { CommonProperties } from '../shared/common-properties'
import {
  ContainerStyleSelect,
  HorizontalAlignmentSelect,
} from '../shared/enum-presets'
import { BooleanSwitch, TextField } from '../shared/field-primitives'
import { PropSection } from '../shared/prop-section'
import { SelectActionInfo } from '../shared/select-action-info'
import { useNodeUpdater } from '../shared/use-node-updater'

export function ColumnSetEditor({ node }: { node: DesignerNode }) {
  const update = useNodeUpdater(node.__designerId)
  const { props } = node

  return (
    <>
      <PropSection title="Appearance">
        <ContainerStyleSelect
          value={props.style as AdaptiveCardContainerStyle | undefined}
          onChange={(next) => update('style', next)}
        />
        <HorizontalAlignmentSelect
          value={
            props.horizontalAlignment as
              | AdaptiveCardHorizontalAlignment
              | undefined
          }
          onChange={(next) => update('horizontalAlignment', next)}
        />
        <BooleanSwitch
          label="Bleed"
          value={props.bleed as boolean | undefined}
          defaultValue={false}
          onChange={(next) => update('bleed', next)}
        />
        <TextField
          label="Min height"
          value={props.minHeight as string | undefined}
          placeholder="0px"
          onChange={(next) => update('minHeight', next)}
        />
      </PropSection>

      <PropSection title="Interaction" defaultOpen={false}>
        <SelectActionInfo
          value={props.selectAction}
          slot="selectAction"
          helpText="Edit the embedded action via the JSON panel — full editor coming in Phase 3d."
        />
      </PropSection>

      <CommonProperties node={node} />
    </>
  )
}
