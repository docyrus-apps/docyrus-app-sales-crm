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

export function ColumnEditor({ node }: { node: DesignerNode }) {
  const update = useNodeUpdater(node.__designerId)
  const { props } = node
  const widthRaw = props.width
  const widthString =
    typeof widthRaw === 'number'
      ? String(widthRaw)
      : (widthRaw as string | undefined)
  const { backgroundImage } = props
  const backgroundImageUrl =
    typeof backgroundImage === 'string'
      ? backgroundImage
      : (backgroundImage as { url?: string } | undefined)?.url

  return (
    <>
      <PropSection title="Sizing">
        <TextField
          label="Width"
          value={widthString}
          placeholder="stretch"
          helpText='"auto", "stretch", "120px", or a weight number (e.g. 1, 2).'
          onChange={(next) => {
            if (next === undefined || next === '') {
              update('width', undefined)

              return
            }

            const asNumber = Number(next)

            if (!Number.isNaN(asNumber) && /^[0-9]+(?:\.[0-9]+)?$/.test(next)) {
              update('width', asNumber)

              return
            }

            update('width', next)
          }}
        />
        <TextField
          label="Min height"
          value={props.minHeight as string | undefined}
          placeholder="0px"
          onChange={(next) => update('minHeight', next)}
        />
      </PropSection>

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
          onChange={(next) => update('bleed', next)}
        />
        <BooleanSwitch
          label="Right-to-left"
          value={props.rtl as boolean | undefined}
          defaultValue={false}
          onChange={(next) => update('rtl', next)}
        />
      </PropSection>

      <PropSection title="Background image" defaultOpen={false}>
        <TextField
          label="URL"
          value={backgroundImageUrl}
          placeholder="https://example.com/bg.png"
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
