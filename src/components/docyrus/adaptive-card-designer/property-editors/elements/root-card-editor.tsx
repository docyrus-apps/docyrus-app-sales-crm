'use client'

// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardVerticalAlignment } from '@/components/docyrus/adaptive-card'

import { type DesignerNode } from '../../adaptive-card-designer-types'
import { VerticalAlignmentSelect } from '../shared/enum-presets'
import { BooleanSwitch, TextField } from '../shared/field-primitives'
import { PropSection } from '../shared/prop-section'
import { SelectActionInfo } from '../shared/select-action-info'
import { useNodeUpdater } from '../shared/use-node-updater'

export function RootCardEditor({ node }: { node: DesignerNode }) {
  const update = useNodeUpdater(node.__designerId)
  const { props } = node
  const { backgroundImage } = props
  const backgroundImageUrl =
    typeof backgroundImage === 'string'
      ? backgroundImage
      : (backgroundImage as { url?: string } | undefined)?.url

  return (
    <>
      <PropSection title="Card">
        <TextField
          label="Version"
          value={props.version as string | undefined}
          placeholder="1.5"
          helpText="Adaptive Cards schema version. Defaults to 1.5."
          onChange={(next) => update('version', next ?? '1.5')}
        />
        <TextField
          label="Schema URL"
          value={props.$schema as string | undefined}
          placeholder="http://adaptivecards.io/schemas/adaptive-card.json"
          onChange={(next) => update('$schema', next)}
        />
        <TextField
          label="Language"
          value={props.lang as string | undefined}
          placeholder="en"
          helpText="BCP 47 locale used for date / number formatting."
          onChange={(next) => update('lang', next)}
        />
        <TextField
          label="Speak"
          value={props.speak as string | undefined}
          placeholder="Speech Synthesis Markup Language"
          multiline
          onChange={(next) => update('speak', next)}
        />
        <TextField
          label="Fallback text"
          value={props.fallbackText as string | undefined}
          placeholder="Your client doesn't support this card."
          multiline
          onChange={(next) => update('fallbackText', next)}
        />
      </PropSection>

      <PropSection title="Appearance">
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
          label="Right-to-left"
          value={props.rtl as boolean | undefined}
          defaultValue={false}
          onChange={(next) => update('rtl', next)}
        />
        <TextField
          label="Min height"
          value={props.minHeight as string | undefined}
          placeholder="0px"
          onChange={(next) => update('minHeight', next)}
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
          helpText="Card-level action fired when the card body is clicked. Edit via the JSON panel for now."
        />
      </PropSection>
    </>
  )
}
