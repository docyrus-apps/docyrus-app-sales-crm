'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardContainerStyle,
  type AdaptiveCardVerticalAlignment,
} from '@/components/docyrus/adaptive-card'

import { type DesignerNode } from '../../adaptive-card-designer-types'
import { CommonProperties } from '../shared/common-properties'
import {
  ContainerStyleSelect,
  VerticalAlignmentSelect,
} from '../shared/enum-presets'
import { BooleanSwitch, TextField } from '../shared/field-primitives'
import { PropSection } from '../shared/prop-section'
import { SelectActionInfo } from '../shared/select-action-info'
import { useNodeUpdater } from '../shared/use-node-updater'

export function ContainerEditor({ node }: { node: DesignerNode }) {
  const update = useNodeUpdater(node.__designerId)
  const { props } = node
  const { backgroundImage } = props
  const backgroundImageUrl =
    typeof backgroundImage === 'string'
      ? backgroundImage
      : (backgroundImage as { url?: string } | undefined)?.url

  return (
    <>
      <PropSection title="Appearance">
        <ContainerStyleSelect
          value={props.style as AdaptiveCardContainerStyle | undefined}
          onChange={(next) => update('style', next)}
        />
        <VerticalAlignmentSelect
          label="Vertical content alignment"
          value={
            props.verticalContentAlignment as
              | AdaptiveCardVerticalAlignment
              | undefined
          }
          onChange={(next) => update('verticalContentAlignment', next)}
        />
        <BooleanSwitch
          label="Bleed"
          value={props.bleed as boolean | undefined}
          defaultValue={false}
          helpText="Extend the container to the edges of its parent."
          onChange={(next) => update('bleed', next)}
        />
        <BooleanSwitch
          label="Show border"
          value={props.showBorder as boolean | undefined}
          defaultValue={false}
          onChange={(next) => update('showBorder', next)}
        />
        <BooleanSwitch
          label="Rounded corners"
          value={props.roundedCorners as boolean | undefined}
          defaultValue={false}
          onChange={(next) => update('roundedCorners', next)}
        />
        <BooleanSwitch
          label="Right-to-left"
          value={props.rtl as boolean | undefined}
          defaultValue={false}
          onChange={(next) => update('rtl', next)}
        />
        <TextField
          label="Min height"
          value={props.minHeight as string | undefined}
          placeholder="0px"
          helpText="CSS length, e.g. 120px."
          onChange={(next) => update('minHeight', next)}
        />
      </PropSection>

      <PropSection title="Background image" defaultOpen={false}>
        <TextField
          label="URL"
          value={backgroundImageUrl}
          placeholder="https://example.com/bg.png"
          helpText="Set fillMode / alignment via the JSON panel for advanced control."
          onChange={(next) => {
            if (!next) {
              update('backgroundImage', undefined)

              return
            }

            if (
              typeof backgroundImage === 'object' &&
              backgroundImage !== null
            ) {
              update('backgroundImage', { ...backgroundImage, url: next })

              return
            }

            update('backgroundImage', next)
          }}
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
