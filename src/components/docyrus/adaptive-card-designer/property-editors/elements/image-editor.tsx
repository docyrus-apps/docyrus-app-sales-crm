'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardHorizontalAlignment,
  type AdaptiveCardImageSize,
  type AdaptiveCardImageStyle,
} from '@/components/docyrus/adaptive-card'

import { type DesignerNode } from '../../adaptive-card-designer-types'
import { CommonProperties } from '../shared/common-properties'
import {
  HorizontalAlignmentSelect,
  ImageSizeSelect,
  ImageStyleSelect,
} from '../shared/enum-presets'
import { TextField } from '../shared/field-primitives'
import { PropSection } from '../shared/prop-section'
import { SelectActionInfo } from '../shared/select-action-info'
import { useNodeUpdater } from '../shared/use-node-updater'

export function ImageEditor({ node }: { node: DesignerNode }) {
  const update = useNodeUpdater(node.__designerId)
  const { props } = node

  return (
    <>
      <PropSection title="Source">
        <TextField
          label="URL"
          value={props.url as string | undefined}
          placeholder="https://example.com/image.png"
          onChange={(next) => update('url', next ?? '')}
        />
        <TextField
          label="Alt text"
          value={props.altText as string | undefined}
          placeholder="Description of the image"
          onChange={(next) => update('altText', next)}
        />
      </PropSection>

      <PropSection title="Appearance">
        <ImageSizeSelect
          value={props.size as AdaptiveCardImageSize | undefined}
          onChange={(next) => update('size', next)}
        />
        <ImageStyleSelect
          value={props.style as AdaptiveCardImageStyle | undefined}
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
        <TextField
          label="Width"
          value={props.width as string | undefined}
          placeholder="120px or auto"
          helpText="Pixel value (e.g. 120px) overrides Size."
          onChange={(next) => update('width', next)}
        />
        <TextField
          label="Height"
          value={props.height as string | undefined}
          placeholder="120px or auto"
          helpText="Pixel value (e.g. 120px) overrides Size."
          onChange={(next) => update('height', next)}
        />
        <TextField
          label="Background color"
          value={props.backgroundColor as string | undefined}
          placeholder="#RRGGBB or #AARRGGBB"
          onChange={(next) => update('backgroundColor', next)}
        />
      </PropSection>

      <PropSection title="Interaction" defaultOpen={false}>
        <SelectActionInfo
          value={props.selectAction}
          slot="selectAction"
          helpText="Edit the embedded action via the JSON panel — full editor coming in Phase 3d."
        />
      </PropSection>

      <CommonProperties node={node} showHeight={false} />
    </>
  )
}
