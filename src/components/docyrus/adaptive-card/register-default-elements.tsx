// @ts-nocheck
/* eslint-disable */
import { AccordionElement } from './elements/accordion-element'
import { ActionSetElement } from './elements/action-set'
import { BadgeElement } from './elements/badge-element'
import { CarouselElement } from './elements/carousel-element'
import { ComponentElement } from './elements/component-element'
import {
  ChartDonutElement,
  ChartGaugeElement,
  ChartHorizontalBarElement,
  ChartLineElement,
  ChartPieElement,
  ChartVerticalBarElement,
} from './elements/chart-elements'
import { CodeBlockElement } from './elements/code-block-element'
import { ColumnSetElement } from './elements/column-set'
import { CompoundButtonElement } from './elements/compound-button-element'
import { ContainerElement } from './elements/container'
import { FactSetElement } from './elements/fact-set'
import { IconElement } from './elements/icon-element'
import { ImageElement } from './elements/image-element'
import { ImageSetElement } from './elements/image-set'
import { LoopComponentElement } from './elements/loop-component-element'
import { MediaElement } from './elements/media-element'
import { ProgressBarElement } from './elements/progress-bar-element'
import { ProgressRingElement } from './elements/progress-ring-element'
import { RatingElement } from './elements/rating-element'
import { RichTextBlockElement } from './elements/rich-text-block'
import { TableElement } from './elements/table-element'
import { TabSetElement } from './elements/tab-set-element'
import { TextBlockElement } from './elements/text-block'
import { InputChoiceSetElement } from './inputs/input-choice-set'
import { InputDateElement } from './inputs/input-date'
import { InputNumberElement } from './inputs/input-number'
import { InputRatingElement } from './inputs/input-rating'
import { InputTextElement } from './inputs/input-text'
import { InputTimeElement } from './inputs/input-time'
import { InputToggleElement } from './inputs/input-toggle'
import { registerElement } from './element-registry'

let registered = false

export function registerDefaultElements(): void {
  if (registered) return
  registered = true

  registerElement('TextBlock', ({ element }) => (
    <TextBlockElement element={element as never} />
  ))
  registerElement('RichTextBlock', ({ element }) => (
    <RichTextBlockElement element={element as never} />
  ))
  registerElement('Image', ({ element }) => (
    <ImageElement element={element as never} />
  ))
  registerElement('Media', ({ element }) => (
    <MediaElement element={element as never} />
  ))
  registerElement('Container', ({ element }) => (
    <ContainerElement element={element as never} />
  ))
  registerElement('ColumnSet', ({ element }) => (
    <ColumnSetElement element={element as never} />
  ))
  registerElement('FactSet', ({ element }) => (
    <FactSetElement element={element as never} />
  ))
  registerElement('ImageSet', ({ element }) => (
    <ImageSetElement element={element as never} />
  ))
  registerElement('Table', ({ element }) => (
    <TableElement element={element as never} />
  ))
  registerElement('ActionSet', ({ element }) => (
    <ActionSetElement element={element as never} />
  ))
  registerElement('Input.Text', ({ element }) => (
    <InputTextElement element={element as never} />
  ))
  registerElement('Input.Number', ({ element }) => (
    <InputNumberElement element={element as never} />
  ))
  registerElement('Input.Date', ({ element }) => (
    <InputDateElement element={element as never} />
  ))
  registerElement('Input.Time', ({ element }) => (
    <InputTimeElement element={element as never} />
  ))
  registerElement('Input.Toggle', ({ element }) => (
    <InputToggleElement element={element as never} />
  ))
  registerElement('Input.ChoiceSet', ({ element }) => (
    <InputChoiceSetElement element={element as never} />
  ))

  registerElement('Badge', ({ element }) => (
    <BadgeElement element={element as never} />
  ))
  registerElement('CodeBlock', ({ element }) => (
    <CodeBlockElement element={element as never} />
  ))
  registerElement('CompoundButton', ({ element }) => (
    <CompoundButtonElement element={element as never} />
  ))
  registerElement('Icon', ({ element }) => (
    <IconElement element={element as never} />
  ))
  registerElement('ProgressBar', ({ element }) => (
    <ProgressBarElement element={element as never} />
  ))
  registerElement('ProgressRing', ({ element }) => (
    <ProgressRingElement element={element as never} />
  ))
  registerElement('Rating', ({ element }) => (
    <RatingElement element={element as never} />
  ))
  registerElement('Input.Rating', ({ element }) => (
    <InputRatingElement element={element as never} />
  ))
  registerElement('Carousel', ({ element }) => (
    <CarouselElement element={element as never} />
  ))
  registerElement('Chart.VerticalBar', ({ element }) => (
    <ChartVerticalBarElement element={element as never} />
  ))
  registerElement('Chart.HorizontalBar', ({ element }) => (
    <ChartHorizontalBarElement element={element as never} />
  ))
  registerElement('Chart.Pie', ({ element }) => (
    <ChartPieElement element={element as never} />
  ))
  registerElement('Chart.Donut', ({ element }) => (
    <ChartDonutElement element={element as never} />
  ))
  registerElement('Chart.Line', ({ element }) => (
    <ChartLineElement element={element as never} />
  ))
  registerElement('Chart.Gauge', ({ element }) => (
    <ChartGaugeElement element={element as never} />
  ))
  registerElement('Accordion', ({ element }) => (
    <AccordionElement element={element as never} />
  ))
  registerElement('TabSet', ({ element }) => (
    <TabSetElement element={element as never} />
  ))
  registerElement('LoopComponent', ({ element }) => (
    <LoopComponentElement element={element as never} />
  ))
  registerElement('Component', ({ element }) => (
    <ComponentElement element={element as never} />
  ))
}
