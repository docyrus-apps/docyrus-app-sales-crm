'use client'

// @ts-nocheck
/* eslint-disable */
export { AdaptiveCard } from './adaptive-card'
export { AdaptiveCardView } from './adaptive-card-view'
export { defaultHostConfig, mergeHostConfig } from './lib/default-host-config'
export {
  parseAdaptiveCard,
  isAdaptiveCard,
  isSafeBackgroundUrl,
} from './lib/parse-card'
export { validateInput, validateInputs } from './lib/validate-inputs'
export { collectInputs, buildSubmitData } from './lib/collect-inputs'
export { expandTemplate } from './lib/templating'
export {
  evaluateExpression,
  interpolateString,
  registerExpressionFunction,
} from './lib/expression'
export {
  registerElement,
  getElementRenderer,
  listElementTypes,
} from './element-registry'
export { registerDefaultElements } from './register-default-elements'
export {
  useAdaptiveCardContext,
  useAdaptiveCardInput,
} from './adaptive-card-context'
export { ElementNode, ElementList } from './element-node'
export { ActionBar } from './action-bar'

export type {
  AdaptiveCardSpacing,
  AdaptiveCardColor,
  AdaptiveCardFontSize,
  AdaptiveCardFontWeight,
  AdaptiveCardFontType,
  AdaptiveCardHorizontalAlignment,
  AdaptiveCardVerticalAlignment,
  AdaptiveCardContainerStyle,
  AdaptiveCardImageSize,
  AdaptiveCardImageStyle,
  AdaptiveCardHeight,
  AdaptiveCardActionStyle,
  AdaptiveCardActionMode,
  AdaptiveCardAssociatedInputs,
  AdaptiveCardTextBlockStyle,
  AdaptiveCardInputTextStyle,
  AdaptiveCardChoiceSetStyle,
  AdaptiveCardBackgroundImageFillMode,
  AdaptiveCardGridStyle,
  AdaptiveCardLabelPosition,
  AdaptiveCardBackgroundImage,
  AdaptiveCardPayload,
  AdaptiveCardElement,
  AdaptiveCardElementBase,
  AdaptiveCardAction,
  AdaptiveCardSelectAction,
  AdaptiveCardActionSubmit,
  AdaptiveCardActionExecute,
  AdaptiveCardActionOpenUrl,
  AdaptiveCardActionShowCard,
  AdaptiveCardActionToggleVisibility,
  AdaptiveCardInput,
  AdaptiveCardInputText,
  AdaptiveCardInputNumber,
  AdaptiveCardInputDate,
  AdaptiveCardInputTime,
  AdaptiveCardInputToggle,
  AdaptiveCardInputChoiceSet,
  AdaptiveCardContainer,
  AdaptiveCardColumnSet,
  AdaptiveCardColumn,
  AdaptiveCardFactSet,
  AdaptiveCardFact,
  AdaptiveCardImage,
  AdaptiveCardImageSet,
  AdaptiveCardTextBlock,
  AdaptiveCardRichTextBlock,
  AdaptiveCardTextRun,
  AdaptiveCardInline,
  AdaptiveCardMedia,
  AdaptiveCardMediaSource,
  AdaptiveCardCaptionSource,
  AdaptiveCardTable,
  AdaptiveCardTableRow,
  AdaptiveCardTableCell,
  AdaptiveCardTableColumn,
  AdaptiveCardActionSetElement,
  AdaptiveCardChoice,
  AdaptiveCardCustomElement,
  AdaptiveCardActionEvent,
  AdaptiveCardSubmitEvent,
  AdaptiveCardExecuteEvent,
  AdaptiveCardOpenUrlEvent,
  AdaptiveCardToggleVisibilityEvent,
  AdaptiveCardShowCardEvent,
  AdaptiveCardHostConfig,
  AdaptiveCardHostConfigOverride,
  AdaptiveCardInputValue,
  AdaptiveCardProps,
  ElementRenderer,
} from './adaptive-card-types'

export type { AdaptiveCardViewProps } from './adaptive-card-view'
