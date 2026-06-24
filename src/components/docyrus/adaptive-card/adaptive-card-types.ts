// @ts-nocheck
/* eslint-disable */
/*
 * Type definitions mirror the Adaptive Cards 1.5.0 schema:
 * https://adaptivecards.io/schemas/1.5.0/adaptive-card.json
 */

import { type ReactNode } from 'react'

export type AdaptiveCardSpacing =
  | 'none'
  | 'small'
  | 'default'
  | 'medium'
  | 'large'
  | 'extraLarge'
  | 'padding'

export type AdaptiveCardColor =
  | 'default'
  | 'dark'
  | 'light'
  | 'accent'
  | 'good'
  | 'warning'
  | 'attention'

export type AdaptiveCardFontSize =
  | 'default'
  | 'small'
  | 'medium'
  | 'large'
  | 'extraLarge'
export type AdaptiveCardFontWeight = 'default' | 'lighter' | 'bolder'
export type AdaptiveCardFontType = 'default' | 'monospace'
export type AdaptiveCardHorizontalAlignment = 'left' | 'center' | 'right'
export type AdaptiveCardVerticalAlignment = 'top' | 'center' | 'bottom'
export type AdaptiveCardContainerStyle =
  | 'default'
  | 'emphasis'
  | 'good'
  | 'attention'
  | 'warning'
  | 'accent'
export type AdaptiveCardImageSize =
  | 'auto'
  | 'stretch'
  | 'small'
  | 'medium'
  | 'large'
export type AdaptiveCardImageStyle = 'default' | 'person'
export type AdaptiveCardHeight = 'auto' | 'stretch'
export type AdaptiveCardActionStyle = 'default' | 'positive' | 'destructive'
export type AdaptiveCardActionMode = 'primary' | 'secondary'
export type AdaptiveCardAssociatedInputs = 'auto' | 'none'
export type AdaptiveCardTextBlockStyle = 'default' | 'heading'
export type AdaptiveCardInputTextStyle =
  | 'text'
  | 'tel'
  | 'url'
  | 'email'
  | 'password'
export type AdaptiveCardChoiceSetStyle = 'compact' | 'expanded' | 'filtered'
export type AdaptiveCardBackgroundImageFillMode =
  | 'cover'
  | 'repeatHorizontally'
  | 'repeatVertically'
  | 'repeat'
export type AdaptiveCardGridStyle = 'default' | 'accent'
export type AdaptiveCardLabelPosition = 'inline' | 'above'

export interface AdaptiveCardBackgroundImage {
  url: string
  fillMode?: AdaptiveCardBackgroundImageFillMode
  horizontalAlignment?: AdaptiveCardHorizontalAlignment
  verticalAlignment?: AdaptiveCardVerticalAlignment
}

export interface AdaptiveCardRefresh {
  action?: AdaptiveCardActionExecute | AdaptiveCardActionSubmit
  expires?: string
  userIds?: Array<string>
}

export interface AdaptiveCardTokenExchangeResource {
  id: string
  uri: string
  providerId: string
}

export interface AdaptiveCardAuthCardButton {
  type: string
  title?: string
  value?: string
  image?: string
}

export interface AdaptiveCardAuthentication {
  text?: string
  connectionName?: string
  tokenExchangeResource?: AdaptiveCardTokenExchangeResource
  buttons?: Array<AdaptiveCardAuthCardButton>
}

export interface AdaptiveCardElementBase {
  id?: string
  isVisible?: boolean
  requires?: Record<string, string>
  fallback?: AdaptiveCardElement | 'drop'
  spacing?: AdaptiveCardSpacing
  separator?: boolean
  height?: AdaptiveCardHeight
}

export interface AdaptiveCardTextBlock extends AdaptiveCardElementBase {
  type: 'TextBlock'
  text: string
  size?: AdaptiveCardFontSize
  weight?: AdaptiveCardFontWeight
  color?: AdaptiveCardColor
  isSubtle?: boolean
  wrap?: boolean
  maxLines?: number
  horizontalAlignment?: AdaptiveCardHorizontalAlignment
  fontType?: AdaptiveCardFontType
  style?: AdaptiveCardTextBlockStyle
}

export interface AdaptiveCardTextRun {
  type: 'TextRun'
  text: string
  size?: AdaptiveCardFontSize
  weight?: AdaptiveCardFontWeight
  color?: AdaptiveCardColor
  isSubtle?: boolean
  fontType?: AdaptiveCardFontType
  highlight?: boolean
  italic?: boolean
  strikethrough?: boolean
  underline?: boolean
  selectAction?: AdaptiveCardSelectAction
}

export interface AdaptiveCardImageRun {
  type: 'ImageRun'
  url: string
  size?: AdaptiveCardImageSize
  style?: AdaptiveCardImageStyle
  themedUrls?: Record<string, string>
  selectAction?: AdaptiveCardSelectAction
}

export interface AdaptiveCardIconRun {
  type: 'IconRun'
  name: string
  size?: AdaptiveCardIconSize
  style?: AdaptiveCardIconStyle
  color?: AdaptiveCardColor
  selectAction?: AdaptiveCardSelectAction
}

export interface AdaptiveCardCitationRun {
  type: 'CitationRun'
  referenceIndex?: number
}

export type AdaptiveCardInline =
  | string
  | AdaptiveCardTextRun
  | AdaptiveCardImageRun
  | AdaptiveCardIconRun
  | AdaptiveCardCitationRun

export interface AdaptiveCardRichTextBlock extends AdaptiveCardElementBase {
  type: 'RichTextBlock'
  inlines: Array<AdaptiveCardInline>
  horizontalAlignment?: AdaptiveCardHorizontalAlignment
}

export interface AdaptiveCardImage extends Omit<
  AdaptiveCardElementBase,
  'height'
> {
  type: 'Image'
  url: string
  altText?: string
  size?: AdaptiveCardImageSize
  style?: AdaptiveCardImageStyle
  horizontalAlignment?: AdaptiveCardHorizontalAlignment
  backgroundColor?: string
  width?: string
  height?: string
  selectAction?: AdaptiveCardSelectAction
}

export interface AdaptiveCardMediaSource {
  url: string
  mimeType?: string
}

export interface AdaptiveCardCaptionSource {
  url: string
  mimeType?: string
  label?: string
}

export interface AdaptiveCardMedia extends AdaptiveCardElementBase {
  type: 'Media'
  sources: Array<AdaptiveCardMediaSource>
  poster?: string
  altText?: string
  captionSources?: Array<AdaptiveCardCaptionSource>
}

export interface AdaptiveCardContainer extends AdaptiveCardElementBase {
  type: 'Container'
  items?: Array<AdaptiveCardElement>
  style?: AdaptiveCardContainerStyle
  verticalContentAlignment?: AdaptiveCardVerticalAlignment
  bleed?: boolean
  backgroundImage?: string | AdaptiveCardBackgroundImage
  rtl?: boolean
  minHeight?: string
  roundedCorners?: boolean
  showBorder?: boolean
  selectAction?: AdaptiveCardSelectAction
}

export interface AdaptiveCardColumn extends AdaptiveCardElementBase {
  type: 'Column'
  items?: Array<AdaptiveCardElement>
  width?: string | number
  style?: AdaptiveCardContainerStyle
  bleed?: boolean
  selectAction?: AdaptiveCardSelectAction
  verticalContentAlignment?: AdaptiveCardVerticalAlignment
  rtl?: boolean
  minHeight?: string
  backgroundImage?: string | AdaptiveCardBackgroundImage
}

export interface AdaptiveCardColumnSet extends AdaptiveCardElementBase {
  type: 'ColumnSet'
  columns?: Array<AdaptiveCardColumn>
  style?: AdaptiveCardContainerStyle
  bleed?: boolean
  horizontalAlignment?: AdaptiveCardHorizontalAlignment
  selectAction?: AdaptiveCardSelectAction
  minHeight?: string
}

export interface AdaptiveCardFact {
  title: string
  value: string
}

export interface AdaptiveCardFactSet extends AdaptiveCardElementBase {
  type: 'FactSet'
  facts: Array<AdaptiveCardFact>
}

export interface AdaptiveCardImageSet extends AdaptiveCardElementBase {
  type: 'ImageSet'
  images: Array<AdaptiveCardImage>
  imageSize?: AdaptiveCardImageSize
}

export interface AdaptiveCardTableColumn {
  width?: number | string
  horizontalCellContentAlignment?: AdaptiveCardHorizontalAlignment
  verticalCellContentAlignment?: AdaptiveCardVerticalAlignment
}

export interface AdaptiveCardTableCell {
  type?: 'TableCell'
  items?: Array<AdaptiveCardElement>
  verticalContentAlignment?: AdaptiveCardVerticalAlignment
  style?: AdaptiveCardContainerStyle
  selectAction?: AdaptiveCardSelectAction
}

export interface AdaptiveCardTableRow {
  type?: 'TableRow'
  cells: Array<AdaptiveCardTableCell>
  style?: AdaptiveCardContainerStyle
  horizontalCellContentAlignment?: AdaptiveCardHorizontalAlignment
  verticalCellContentAlignment?: AdaptiveCardVerticalAlignment
}

export interface AdaptiveCardTable extends AdaptiveCardElementBase {
  type: 'Table'
  columns?: Array<AdaptiveCardTableColumn>
  rows?: Array<AdaptiveCardTableRow>
  firstRowAsHeader?: boolean
  showGridLines?: boolean
  gridStyle?: AdaptiveCardGridStyle
  horizontalCellContentAlignment?: AdaptiveCardHorizontalAlignment
  verticalCellContentAlignment?: AdaptiveCardVerticalAlignment
}

export interface AdaptiveCardActionSetElement extends AdaptiveCardElementBase {
  type: 'ActionSet'
  actions: Array<AdaptiveCardAction>
}

export interface AdaptiveCardInputBase extends AdaptiveCardElementBase {
  label?: string
  labelPosition?: AdaptiveCardLabelPosition
  errorMessage?: string
  isRequired?: boolean
  inputStyle?: 'default' | 'revealOnHover'
}

export interface AdaptiveCardInputText extends AdaptiveCardInputBase {
  type: 'Input.Text'
  id: string
  value?: string
  placeholder?: string
  isMultiline?: boolean
  maxLength?: number
  regex?: string
  style?: AdaptiveCardInputTextStyle
  inlineAction?: AdaptiveCardAction
}

export interface AdaptiveCardInputNumber extends AdaptiveCardInputBase {
  type: 'Input.Number'
  id: string
  value?: number
  placeholder?: string
  min?: number
  max?: number
}

export interface AdaptiveCardInputDate extends AdaptiveCardInputBase {
  type: 'Input.Date'
  id: string
  value?: string
  placeholder?: string
  min?: string
  max?: string
}

export interface AdaptiveCardInputTime extends AdaptiveCardInputBase {
  type: 'Input.Time'
  id: string
  value?: string
  placeholder?: string
  min?: string
  max?: string
}

export interface AdaptiveCardInputToggle extends AdaptiveCardInputBase {
  type: 'Input.Toggle'
  id: string
  title?: string
  value?: string
  valueOn?: string
  valueOff?: string
  wrap?: boolean
}

export interface AdaptiveCardChoice {
  title: string
  value: string
}

export interface AdaptiveCardDataQuery {
  type: 'Data.Query'
  dataset: string
  /*
   * Optional value the host can use to seed the initial query. AC 1.5 schema
   * also defines `count` and `skip` for pagination — we surface them but do
   * not enforce them; the host's resolver gets the full request.
   */
  value?: string
  count?: number
  skip?: number
}

export interface AdaptiveCardInputChoiceSet extends AdaptiveCardInputBase {
  type: 'Input.ChoiceSet'
  id: string
  choices: Array<AdaptiveCardChoice>
  /*
   * AC 1.5 `choices.data` (literal key with a dot). When present and `style:
   * 'filtered'`, the renderer calls the host-supplied `onChoiceQuery` async
   * resolver with the dataset name + current search text and renders the
   * results alongside the static `choices`.
   */
  'choices.data'?: AdaptiveCardDataQuery
  isMultiSelect?: boolean
  style?: AdaptiveCardChoiceSetStyle
  placeholder?: string
  value?: string
  wrap?: boolean
}

export interface AdaptiveCardInputRating extends AdaptiveCardInputBase {
  type: 'Input.Rating'
  id: string
  value?: number
  max?: number
  size?: 'medium' | 'large'
  color?: 'marigold' | 'neutral'
}

export type AdaptiveCardInput =
  | AdaptiveCardInputText
  | AdaptiveCardInputNumber
  | AdaptiveCardInputDate
  | AdaptiveCardInputTime
  | AdaptiveCardInputToggle
  | AdaptiveCardInputChoiceSet
  | AdaptiveCardInputRating

export type AdaptiveCardBadgeAppearance = 'filled' | 'tint'
export type AdaptiveCardBadgeShape = 'rounded' | 'square' | 'circular'
export type AdaptiveCardBadgeSize =
  | 'extraSmall'
  | 'small'
  | 'medium'
  | 'large'
  | 'extraLarge'
export type AdaptiveCardBadgeStyle =
  | 'default'
  | 'subtle'
  | 'informative'
  | 'accent'
  | 'good'
  | 'attention'
  | 'warning'

export interface AdaptiveCardBadge extends AdaptiveCardElementBase {
  type: 'Badge'
  text?: string
  icon?: string
  appearance?: AdaptiveCardBadgeAppearance
  shape?: AdaptiveCardBadgeShape
  size?: AdaptiveCardBadgeSize
  style?: AdaptiveCardBadgeStyle
  tooltip?: string
}

export interface AdaptiveCardCodeBlock extends AdaptiveCardElementBase {
  type: 'CodeBlock'
  codeSnippet?: string
  language?: string
  startLineNumber?: number
}

export interface AdaptiveCardCompoundButton extends AdaptiveCardElementBase {
  type: 'CompoundButton'
  title: string
  description?: string
  icon?: string
  badge?: string
  selectAction?: AdaptiveCardSelectAction
}

export type AdaptiveCardIconStyle = 'regular' | 'filled'
export type AdaptiveCardIconSize =
  | 'xxSmall'
  | 'xSmall'
  | 'small'
  | 'standard'
  | 'medium'
  | 'large'
  | 'xLarge'
  | 'xxLarge'

export interface AdaptiveCardIcon extends AdaptiveCardElementBase {
  type: 'Icon'
  name: string
  size?: AdaptiveCardIconSize
  style?: AdaptiveCardIconStyle
  color?: AdaptiveCardColor
  selectAction?: AdaptiveCardSelectAction
}

export type AdaptiveCardProgressColor =
  | 'default'
  | 'accent'
  | 'good'
  | 'warning'
  | 'attention'

export interface AdaptiveCardProgressBar extends AdaptiveCardElementBase {
  type: 'ProgressBar'
  value?: number
  max?: number
  color?: AdaptiveCardProgressColor
}

export type AdaptiveCardProgressRingSize =
  | 'tiny'
  | 'extraSmall'
  | 'small'
  | 'medium'
  | 'large'
  | 'extraLarge'
  | 'huge'

export interface AdaptiveCardProgressRing extends AdaptiveCardElementBase {
  type: 'ProgressRing'
  value?: number
  max?: number
  size?: AdaptiveCardProgressRingSize
  label?: string
  color?: AdaptiveCardProgressColor
}

export interface AdaptiveCardRating extends AdaptiveCardElementBase {
  type: 'Rating'
  value: number
  max?: number
  size?: 'medium' | 'large'
  style?: 'default' | 'compact'
  color?: 'marigold' | 'neutral'
  count?: number
}

export interface AdaptiveCardCarouselPage extends AdaptiveCardElementBase {
  type: 'CarouselPage'
  items?: Array<AdaptiveCardElement>
  style?: AdaptiveCardContainerStyle
  verticalContentAlignment?: AdaptiveCardVerticalAlignment
  backgroundImage?: string | AdaptiveCardBackgroundImage
  minHeight?: string
}

export interface AdaptiveCardCarousel extends AdaptiveCardElementBase {
  type: 'Carousel'
  pages: Array<AdaptiveCardCarouselPage>
  timer?: number
  initialPage?: number
  loop?: boolean
  orientation?: 'horizontal' | 'vertical'
  heightInPixels?: number
}

export interface AdaptiveCardChartDataPoint {
  x?: string | number
  y: number
  color?: string
  legend?: string
}

export interface AdaptiveCardChartSegment {
  value: number
  color?: string
  legend?: string
}

export type AdaptiveCardChartColorSet =
  | 'categorical'
  | 'sequential'
  | 'divergent'

export type AdaptiveCardChartColor =
  | 'categoricalBlue'
  | 'categoricalGreen'
  | 'categoricalOrange'
  | 'categoricalPurple'
  | 'categoricalRed'
  | 'categoricalTeal'
  | 'categoricalYellow'
  | 'good'
  | 'warning'
  | 'attention'
  | 'neutral'
  | string

interface AdaptiveCardChartBase extends AdaptiveCardElementBase {
  data: Array<AdaptiveCardChartDataPoint>
  title?: string
  showTitle?: boolean
  showLegend?: boolean
  colorSet?: AdaptiveCardChartColorSet
  color?: AdaptiveCardChartColor
  valueFormat?: 'short' | 'long' | 'percentage'
  displayMode?: 'absolute' | 'percentage'
  maxWidth?: number
}

export interface AdaptiveCardChartVerticalBar extends AdaptiveCardChartBase {
  type: 'Chart.VerticalBar'
  showBarValues?: boolean
  stacked?: boolean
}

export interface AdaptiveCardChartHorizontalBar extends AdaptiveCardChartBase {
  type: 'Chart.HorizontalBar'
  showBarValues?: boolean
  stacked?: boolean
}

export interface AdaptiveCardChartPie extends AdaptiveCardChartBase {
  type: 'Chart.Pie'
}

export interface AdaptiveCardChartDonut extends AdaptiveCardChartBase {
  type: 'Chart.Donut'
  thickness?: 'thin' | 'medium' | 'thick'
}

export interface AdaptiveCardChartLine extends AdaptiveCardChartBase {
  type: 'Chart.Line'
  showOutlines?: boolean
}

export interface AdaptiveCardChartGauge extends AdaptiveCardElementBase {
  type: 'Chart.Gauge'
  value: number
  min?: number
  max?: number
  title?: string
  showTitle?: boolean
  showMinMax?: boolean
  showNeedle?: boolean
  subLabel?: string
  valueColor?: AdaptiveCardChartColor
  valueFormat?: 'short' | 'long' | 'percentage'
  segments?: Array<AdaptiveCardChartSegment>
}

export type AdaptiveCardChart =
  | AdaptiveCardChartVerticalBar
  | AdaptiveCardChartHorizontalBar
  | AdaptiveCardChartPie
  | AdaptiveCardChartDonut
  | AdaptiveCardChartLine
  | AdaptiveCardChartGauge

export interface AdaptiveCardAccordionPage extends AdaptiveCardElementBase {
  type: 'AccordionPage'
  items?: Array<AdaptiveCardElement>
  headerTitle?: string
  headerIconName?: string
  headerSize?: AdaptiveCardFontSize
  headerWrap?: boolean
  isExpanded?: boolean
  expandIconPosition?: 'leading' | 'trailing'
  style?: AdaptiveCardContainerStyle
}

export interface AdaptiveCardAccordion extends AdaptiveCardElementBase {
  type: 'Accordion'
  items?: Array<AdaptiveCardAccordionPage>
  allowCollapseAllPages?: boolean
  allowMultipleExpandedPages?: boolean
}

export interface AdaptiveCardTabPage extends AdaptiveCardElementBase {
  type: 'TabPage'
  title?: string
  icon?: string
  items?: Array<AdaptiveCardElement>
}

export interface AdaptiveCardTabSet extends AdaptiveCardElementBase {
  type: 'TabSet'
  tabs?: Array<AdaptiveCardTabPage>
  size?: 'small' | 'medium' | 'large'
}

/*
 * `componentUrl` points to a Microsoft Loop component. Real rendering would
 * require host iframe + auth — we surface a placeholder card with the URL so
 * the payload round-trips losslessly.
 */
export interface AdaptiveCardLoopComponent extends AdaptiveCardElementBase {
  type: 'LoopComponent'
  componentUrl: string
}

/*
 * Generic Component (AC 1.6 preview) — references a host-registered custom
 * component by name with arbitrary `properties`. We surface a placeholder
 * card with the component name and serialized properties so unknown
 * components round-trip losslessly. Hosts can hand a real renderer via the
 * `customElements` extension map keyed by `'Component'` (or by the value of
 * `name` for finer-grained routing).
 */
export interface AdaptiveCardComponent extends AdaptiveCardElementBase {
  type: 'Component'
  name?: string
  componentName?: string
  componentUrl?: string
  properties?: Record<string, unknown>
}

export interface AdaptiveCardActionBase {
  id?: string
  title?: string
  iconUrl?: string
  tooltip?: string
  isEnabled?: boolean
  style?: AdaptiveCardActionStyle
  mode?: AdaptiveCardActionMode
  requires?: Record<string, string>
  fallback?: AdaptiveCardAction | 'drop'
}

export interface AdaptiveCardActionSubmit extends AdaptiveCardActionBase {
  type: 'Action.Submit'
  data?: unknown
  associatedInputs?: AdaptiveCardAssociatedInputs
}

export interface AdaptiveCardActionExecute extends AdaptiveCardActionBase {
  type: 'Action.Execute'
  verb?: string
  data?: unknown
  associatedInputs?: AdaptiveCardAssociatedInputs
}

export interface AdaptiveCardActionOpenUrl extends AdaptiveCardActionBase {
  type: 'Action.OpenUrl'
  url: string
}

export interface AdaptiveCardActionShowCard extends AdaptiveCardActionBase {
  type: 'Action.ShowCard'
  card: AdaptiveCardPayload
}

export interface AdaptiveCardToggleVisibilityTarget {
  elementId: string
  isVisible?: boolean
}

export interface AdaptiveCardActionToggleVisibility extends AdaptiveCardActionBase {
  type: 'Action.ToggleVisibility'
  targetElements: Array<string | AdaptiveCardToggleVisibilityTarget>
}

/*
 * Action.ResetInputs (AC 1.6) — clears the named inputs (or all inputs in
 * scope when `targetInputIds` is omitted) without dispatching a submit.
 */
export interface AdaptiveCardActionResetInputs extends AdaptiveCardActionBase {
  type: 'Action.ResetInputs'
  targetInputIds?: Array<string>
}

export type AdaptiveCardAction =
  | AdaptiveCardActionSubmit
  | AdaptiveCardActionExecute
  | AdaptiveCardActionOpenUrl
  | AdaptiveCardActionShowCard
  | AdaptiveCardActionToggleVisibility
  | AdaptiveCardActionResetInputs

export type AdaptiveCardSelectAction =
  | AdaptiveCardActionSubmit
  | AdaptiveCardActionExecute
  | AdaptiveCardActionOpenUrl
  | AdaptiveCardActionToggleVisibility
  | AdaptiveCardActionResetInputs

/*
 * The known element union. `AdaptiveCardCustomElement` is intentionally NOT
 * in this discriminated union because its open `type: string` would prevent
 * TypeScript from narrowing on the literal discriminants (`'Container'`,
 * `'TextBlock'`, ...). Custom elements are handled at runtime through the
 * `customElements` extension map.
 */
export type AdaptiveCardElement =
  | AdaptiveCardTextBlock
  | AdaptiveCardRichTextBlock
  | AdaptiveCardImage
  | AdaptiveCardMedia
  | AdaptiveCardContainer
  | AdaptiveCardColumnSet
  | AdaptiveCardFactSet
  | AdaptiveCardImageSet
  | AdaptiveCardTable
  | AdaptiveCardActionSetElement
  | AdaptiveCardInput
  | AdaptiveCardBadge
  | AdaptiveCardCodeBlock
  | AdaptiveCardCompoundButton
  | AdaptiveCardIcon
  | AdaptiveCardProgressBar
  | AdaptiveCardProgressRing
  | AdaptiveCardRating
  | AdaptiveCardCarousel
  | AdaptiveCardChartVerticalBar
  | AdaptiveCardChartHorizontalBar
  | AdaptiveCardChartPie
  | AdaptiveCardChartDonut
  | AdaptiveCardChartLine
  | AdaptiveCardChartGauge
  | AdaptiveCardAccordion
  | AdaptiveCardTabSet
  | AdaptiveCardLoopComponent
  | AdaptiveCardComponent

export interface AdaptiveCardCustomElement extends AdaptiveCardElementBase {
  type: string
  [key: string]: unknown
}

/*
 * Payloads received from the host may contain custom elements; this is what
 * `<ElementNode />` actually sees at runtime.
 */
export type AdaptiveCardElementOrCustom =
  | AdaptiveCardElement
  | AdaptiveCardCustomElement

export interface AdaptiveCardPayload {
  type: 'AdaptiveCard'
  $schema?: string
  version: string
  refresh?: AdaptiveCardRefresh
  authentication?: AdaptiveCardAuthentication
  body?: Array<AdaptiveCardElement>
  actions?: Array<AdaptiveCardAction>
  selectAction?: AdaptiveCardSelectAction
  fallbackText?: string
  backgroundImage?: string | AdaptiveCardBackgroundImage
  minHeight?: string
  rtl?: boolean
  speak?: string
  lang?: string
  verticalContentAlignment?: AdaptiveCardVerticalAlignment
  requires?: Record<string, string>
}

export interface AdaptiveCardColorPair {
  default: string
  subtle: string
}

export interface AdaptiveCardContainerStyleTokens {
  bg: string
  fg: string
  borderColor: string
}

export interface AdaptiveCardHostConfigColors {
  default: AdaptiveCardColorPair
  accent: AdaptiveCardColorPair
  good: AdaptiveCardColorPair
  warning: AdaptiveCardColorPair
  attention: AdaptiveCardColorPair
  dark: AdaptiveCardColorPair
  light: AdaptiveCardColorPair
}

export interface AdaptiveCardHostConfigSpacing {
  none: number
  small: number
  default: number
  medium: number
  large: number
  extraLarge: number
  padding: number
}

export interface AdaptiveCardHostConfigImageSizes {
  small: number
  medium: number
  large: number
}

export interface AdaptiveCardHostConfigFontSizes {
  small: number
  default: number
  medium: number
  large: number
  extraLarge: number
}

export interface AdaptiveCardHostConfigFontWeights {
  lighter: number
  default: number
  bolder: number
}

export interface AdaptiveCardHostConfigActions {
  maxActions: number
  actionsOrientation: 'horizontal' | 'vertical'
  buttonSpacing: number
  showCard: {
    actionMode: 'inline' | 'popup'
    inlineTopMargin: number
    style: AdaptiveCardContainerStyle
  }
}

export interface AdaptiveCardHostConfig {
  supportsInteractivity: boolean
  hostCapabilities?: Record<string, string>
  colors: AdaptiveCardHostConfigColors
  spacing: AdaptiveCardHostConfigSpacing
  imageSizes: AdaptiveCardHostConfigImageSizes
  fontSizes: AdaptiveCardHostConfigFontSizes
  fontWeights: AdaptiveCardHostConfigFontWeights
  containerStyles: Record<
    AdaptiveCardContainerStyle,
    AdaptiveCardContainerStyleTokens
  >
  actions: AdaptiveCardHostConfigActions
}

export type AdaptiveCardHostConfigOverride = DeepPartial<AdaptiveCardHostConfig>

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type AdaptiveCardInputValue =
  | string
  | Array<string>
  | boolean
  | number
  | null

export interface AdaptiveCardSubmitEvent {
  type: 'submit'
  data: Record<string, AdaptiveCardInputValue> | unknown
  action: AdaptiveCardActionSubmit
  card: AdaptiveCardPayload
}

export interface AdaptiveCardExecuteEvent {
  type: 'execute'
  verb?: string
  data: Record<string, AdaptiveCardInputValue> | unknown
  action: AdaptiveCardActionExecute
  card: AdaptiveCardPayload
}

export interface AdaptiveCardOpenUrlEvent {
  type: 'openUrl'
  url: string
  action: AdaptiveCardActionOpenUrl
  card: AdaptiveCardPayload
}

export interface AdaptiveCardToggleVisibilityEvent {
  type: 'toggleVisibility'
  action: AdaptiveCardActionToggleVisibility
  card: AdaptiveCardPayload
}

export interface AdaptiveCardShowCardEvent {
  type: 'showCard'
  isOpen: boolean
  action: AdaptiveCardActionShowCard
  card: AdaptiveCardPayload
}

export interface AdaptiveCardResetInputsEvent {
  type: 'resetInputs'
  action: AdaptiveCardActionResetInputs
  card: AdaptiveCardPayload
}

export type AdaptiveCardActionEvent =
  | AdaptiveCardSubmitEvent
  | AdaptiveCardExecuteEvent
  | AdaptiveCardOpenUrlEvent
  | AdaptiveCardToggleVisibilityEvent
  | AdaptiveCardShowCardEvent
  | AdaptiveCardResetInputsEvent

export type ElementRenderer<
  T extends AdaptiveCardElement = AdaptiveCardElement,
> = (props: { element: T }) => ReactNode

export interface AdaptiveCardChoiceQueryRequestPayload {
  dataset: string
  search: string
  inputId: string
}

export interface AdaptiveCardProps {
  /*
   * The card template. May contain Adaptive Cards Templating expressions
   * (`${path}`, `$data`, `$when`, …). When `data` is also provided, the
   * template is expanded against that data before rendering.
   */
  payload: AdaptiveCardPayload
  /*
   * Data context for template expansion. The expander mirrors the official
   * `adaptivecards-templating` semantics: `${path}` interpolation, `$data`
   * scoping and array repeats, `$when` conditional drops, plus the built-in
   * function library (`if`, `equals`, `formatNumber`, `formatDateTime`, …).
   */
  data?: unknown
  onAction?: (event: AdaptiveCardActionEvent) => void | Promise<void>
  hostConfig?: AdaptiveCardHostConfigOverride
  customElements?: Record<string, ElementRenderer>
  /*
   * Async resolver for `Input.ChoiceSet.choices.data` (`Data.Query`). Fires
   * when a filtered ChoiceSet declares a dataset; debounced search text is
   * passed in `request.search`. Return the matching choices to render.
   */
  onChoiceQuery?: (
    request: AdaptiveCardChoiceQueryRequestPayload,
  ) => Promise<Array<AdaptiveCardChoice>>
  className?: string
}

/*
 * Concrete `AdaptiveCardViewProps` is exported from `adaptive-card-view.tsx`
 * because it references `AdaptiveCardContextValue` from the context module,
 * which would create a circular dep if declared here.
 */
