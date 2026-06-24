'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardColor,
  type AdaptiveCardFontSize,
  type AdaptiveCardFontType,
  type AdaptiveCardFontWeight,
  type AdaptiveCardHorizontalAlignment,
  type AdaptiveCardTextBlockStyle,
} from '@/components/docyrus/adaptive-card'

import { type DesignerNode } from '../../adaptive-card-designer-types'
import { CommonProperties } from '../shared/common-properties'
import {
  ColorSelect,
  FontTypeSelect,
  HorizontalAlignmentSelect,
  SizeSelect,
  TextBlockStyleSelect,
  WeightSelect,
} from '../shared/enum-presets'
import {
  BooleanSwitch,
  NumberField,
  TextField,
} from '../shared/field-primitives'
import { PropSection } from '../shared/prop-section'
import { useNodeUpdater } from '../shared/use-node-updater'

export function TextBlockEditor({ node }: { node: DesignerNode }) {
  const update = useNodeUpdater(node.__designerId)
  const { props } = node

  return (
    <>
      <PropSection title="Content">
        <TextField
          label="Text"
          value={props.text as string | undefined}
          placeholder="Lorem ipsum"
          multiline
          helpText="Supports Markdown and ${...} templating expressions."
          onChange={(next) => update('text', next ?? '')}
        />
      </PropSection>

      <PropSection title="Appearance">
        <SizeSelect
          value={props.size as AdaptiveCardFontSize | undefined}
          onChange={(next) => update('size', next)}
        />
        <WeightSelect
          value={props.weight as AdaptiveCardFontWeight | undefined}
          onChange={(next) => update('weight', next)}
        />
        <ColorSelect
          value={props.color as AdaptiveCardColor | undefined}
          onChange={(next) => update('color', next)}
        />
        <BooleanSwitch
          label="Subtle"
          value={props.isSubtle as boolean | undefined}
          defaultValue={false}
          onChange={(next) => update('isSubtle', next)}
        />
        <BooleanSwitch
          label="Wrap"
          value={props.wrap as boolean | undefined}
          defaultValue={false}
          onChange={(next) => update('wrap', next)}
        />
        <NumberField
          label="Max lines"
          value={props.maxLines as number | undefined}
          min={0}
          helpText="0 or empty for no limit."
          onChange={(next) => update('maxLines', next)}
        />
        <HorizontalAlignmentSelect
          value={
            props.horizontalAlignment as
              | AdaptiveCardHorizontalAlignment
              | undefined
          }
          onChange={(next) => update('horizontalAlignment', next)}
        />
        <FontTypeSelect
          value={props.fontType as AdaptiveCardFontType | undefined}
          onChange={(next) => update('fontType', next)}
        />
        <TextBlockStyleSelect
          value={props.style as AdaptiveCardTextBlockStyle | undefined}
          onChange={(next) => update('style', next)}
        />
      </PropSection>

      <CommonProperties node={node} />
    </>
  )
}
