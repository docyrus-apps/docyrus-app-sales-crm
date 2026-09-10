'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardColor,
  type AdaptiveCardContainerStyle,
  type AdaptiveCardFontSize,
  type AdaptiveCardFontType,
  type AdaptiveCardFontWeight,
  type AdaptiveCardHeight,
  type AdaptiveCardHorizontalAlignment,
  type AdaptiveCardImageSize,
  type AdaptiveCardImageStyle,
  type AdaptiveCardSpacing,
  type AdaptiveCardTextBlockStyle,
  type AdaptiveCardVerticalAlignment,
} from '@/components/docyrus/adaptive-card'

import { type EnumOption, EnumSelect } from './field-primitives'

const SIZE_OPTIONS: ReadonlyArray<EnumOption<AdaptiveCardFontSize>> = [
  { value: 'small', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extraLarge', label: 'Extra Large' },
]

export function SizeSelect({
  label = 'Size',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardFontSize | undefined
  onChange: (next: AdaptiveCardFontSize | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="default"
      options={SIZE_OPTIONS}
      onChange={onChange}
    />
  )
}

const WEIGHT_OPTIONS: ReadonlyArray<EnumOption<AdaptiveCardFontWeight>> = [
  { value: 'lighter', label: 'Lighter' },
  { value: 'default', label: 'Default' },
  { value: 'bolder', label: 'Bolder' },
]

export function WeightSelect({
  label = 'Weight',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardFontWeight | undefined
  onChange: (next: AdaptiveCardFontWeight | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="default"
      options={WEIGHT_OPTIONS}
      onChange={onChange}
    />
  )
}

const COLOR_OPTIONS: ReadonlyArray<EnumOption<AdaptiveCardColor>> = [
  { value: 'default', label: 'Default' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'accent', label: 'Accent' },
  { value: 'good', label: 'Good' },
  { value: 'warning', label: 'Warning' },
  { value: 'attention', label: 'Attention' },
]

export function ColorSelect({
  label = 'Color',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardColor | undefined
  onChange: (next: AdaptiveCardColor | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="default"
      options={COLOR_OPTIONS}
      onChange={onChange}
    />
  )
}

const HORIZONTAL_ALIGNMENT_OPTIONS: ReadonlyArray<
  EnumOption<AdaptiveCardHorizontalAlignment>
> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

export function HorizontalAlignmentSelect({
  label = 'Horizontal alignment',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardHorizontalAlignment | undefined
  onChange: (next: AdaptiveCardHorizontalAlignment | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="left"
      options={HORIZONTAL_ALIGNMENT_OPTIONS}
      onChange={onChange}
    />
  )
}

const VERTICAL_ALIGNMENT_OPTIONS: ReadonlyArray<
  EnumOption<AdaptiveCardVerticalAlignment>
> = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' },
]

export function VerticalAlignmentSelect({
  label = 'Vertical alignment',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardVerticalAlignment | undefined
  onChange: (next: AdaptiveCardVerticalAlignment | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="top"
      options={VERTICAL_ALIGNMENT_OPTIONS}
      onChange={onChange}
    />
  )
}

const CONTAINER_STYLE_OPTIONS: ReadonlyArray<
  EnumOption<AdaptiveCardContainerStyle>
> = [
  { value: 'default', label: 'Default' },
  { value: 'emphasis', label: 'Emphasis' },
  { value: 'good', label: 'Good' },
  { value: 'attention', label: 'Attention' },
  { value: 'warning', label: 'Warning' },
  { value: 'accent', label: 'Accent' },
]

export function ContainerStyleSelect({
  label = 'Style',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardContainerStyle | undefined
  onChange: (next: AdaptiveCardContainerStyle | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="default"
      options={CONTAINER_STYLE_OPTIONS}
      onChange={onChange}
    />
  )
}

const SPACING_OPTIONS: ReadonlyArray<EnumOption<AdaptiveCardSpacing>> = [
  { value: 'none', label: 'None' },
  { value: 'small', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extraLarge', label: 'Extra Large' },
  { value: 'padding', label: 'Padding' },
]

export function SpacingSelect({
  label = 'Spacing',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardSpacing | undefined
  onChange: (next: AdaptiveCardSpacing | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="default"
      options={SPACING_OPTIONS}
      onChange={onChange}
    />
  )
}

const HEIGHT_OPTIONS: ReadonlyArray<EnumOption<AdaptiveCardHeight>> = [
  { value: 'auto', label: 'Auto' },
  { value: 'stretch', label: 'Stretch' },
]

export function HeightSelect({
  label = 'Height',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardHeight | undefined
  onChange: (next: AdaptiveCardHeight | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="auto"
      options={HEIGHT_OPTIONS}
      onChange={onChange}
    />
  )
}

const FONT_TYPE_OPTIONS: ReadonlyArray<EnumOption<AdaptiveCardFontType>> = [
  { value: 'default', label: 'Default' },
  { value: 'monospace', label: 'Monospace' },
]

export function FontTypeSelect({
  label = 'Font type',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardFontType | undefined
  onChange: (next: AdaptiveCardFontType | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="default"
      options={FONT_TYPE_OPTIONS}
      onChange={onChange}
    />
  )
}

const TEXT_BLOCK_STYLE_OPTIONS: ReadonlyArray<
  EnumOption<AdaptiveCardTextBlockStyle>
> = [
  { value: 'default', label: 'Default' },
  { value: 'heading', label: 'Heading' },
]

export function TextBlockStyleSelect({
  label = 'Style',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardTextBlockStyle | undefined
  onChange: (next: AdaptiveCardTextBlockStyle | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="default"
      options={TEXT_BLOCK_STYLE_OPTIONS}
      onChange={onChange}
    />
  )
}

const IMAGE_SIZE_OPTIONS: ReadonlyArray<EnumOption<AdaptiveCardImageSize>> = [
  { value: 'auto', label: 'Auto' },
  { value: 'stretch', label: 'Stretch' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

export function ImageSizeSelect({
  label = 'Size',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardImageSize | undefined
  onChange: (next: AdaptiveCardImageSize | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="auto"
      options={IMAGE_SIZE_OPTIONS}
      onChange={onChange}
    />
  )
}

const IMAGE_STYLE_OPTIONS: ReadonlyArray<EnumOption<AdaptiveCardImageStyle>> = [
  { value: 'default', label: 'Default' },
  { value: 'person', label: 'Person' },
]

export function ImageStyleSelect({
  label = 'Style',
  value,
  onChange,
}: {
  label?: string
  value: AdaptiveCardImageStyle | undefined
  onChange: (next: AdaptiveCardImageStyle | undefined) => void
}) {
  return (
    <EnumSelect
      label={label}
      value={value}
      defaultValue="default"
      options={IMAGE_STYLE_OPTIONS}
      onChange={onChange}
    />
  )
}
