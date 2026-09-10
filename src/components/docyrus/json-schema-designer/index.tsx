'use client'

// @ts-nocheck
/* eslint-disable */
export { JsonSchemaDesigner } from './json-schema-designer'
export type {
  IJsonSchemaAiAssistantRenderContext,
  JsonSchemaDesignerProps,
} from './json-schema-designer'

export {
  type IUseApplyJsonSchemaResult,
  useApplyJsonSchema,
} from './use-apply-json-schema'

export {
  DesignerProvider,
  useDesignerContext,
} from './json-schema-designer-context'
export type { DesignerProviderProps } from './json-schema-designer-context'

export {
  DEFAULT_SCHEMA_DIALECT,
  parseJsonToTree,
  schemaToTree,
  treeToJsonString,
  treeToSchema,
} from './lib/schema-conversion'

export { TOOLBOX_ITEMS, TOOLBOX_CATEGORIES } from './lib/toolbox-items'

export {
  STRICT_FORBIDDEN_KEYWORDS,
  collectStrictViolations,
  isForbiddenStrictKeyword,
  isPlainObject,
  stripForbiddenStrictKeywords,
} from './lib/strict-mode'

export type {
  DesignerView,
  JsonSchema,
  JsonSchemaType,
  SchemaNode,
  ToolboxItemDef,
} from './json-schema-designer-types'
