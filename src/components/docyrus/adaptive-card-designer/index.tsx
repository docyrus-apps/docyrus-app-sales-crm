'use client'

// @ts-nocheck
/* eslint-disable */
export { AdaptiveCardDesigner } from './adaptive-card-designer'
export type { AdaptiveCardDesignerProps } from './adaptive-card-designer'
export {
  type IUseApplyAdaptiveCardResult,
  useApplyAdaptiveCard,
} from './use-apply-adaptive-card'

export {
  DesignerProvider,
  useDesignerContext,
} from './adaptive-card-designer-context'
export type { DesignerProviderProps } from './adaptive-card-designer-context'

export {
  cardToTree,
  normalizeForRoundTrip,
  slotsFor,
  isLeafType,
  treeToCard,
  SLOT_MAP,
} from './lib/node-tree'
export { createDefaultNode, defaultChildType } from './lib/node-factories'
export { createDesignerId } from './lib/node-id'
export {
  collectIds,
  countNodes,
  findLocation,
  findNode,
  insertNode,
  isAncestor,
  moveNode,
  removeNode,
  updateNode,
} from './lib/node-traversal'
export {
  TOOLBOX_GROUP_ORDER,
  TOOLBOX_ITEMS,
  buildToolbox,
} from './lib/element-catalog'

export {
  DesignerDndProvider,
  useDesignerDnd,
  slotDropId,
  parseSlotDropId,
} from './dnd/designer-dnd'
export { canAccept } from './dnd/drop-rules'

export type {
  DesignerAction,
  DesignerDiagnostic,
  DesignerFocus,
  DesignerNode,
  DesignerRootType,
  DesignerState,
  DesignerTheme,
  DesignerWidth,
  HistorySnapshot,
  IAdaptiveCardAiAssistantRenderContext,
  ToolbarButtonKey,
  ToolboxGroup,
  ToolboxItem,
} from './adaptive-card-designer-types'
