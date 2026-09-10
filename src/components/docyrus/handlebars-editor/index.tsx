'use client'

// @ts-nocheck
/* eslint-disable */
export { HandlebarsEditor } from './handlebars-editor'
export { HandlebarsCodeEditor } from './handlebars-code-editor'
export { useHandlebars } from './use-handlebars'
export {
  type IUseApplyHandlebarsResult,
  useApplyHandlebars,
} from './use-apply-handlebars'

export { renderHandlebars, parseJsonInput } from './lib/render'
export type { ParsedJsonInput } from './lib/render'

export {
  handlebarsExtensions,
  handlebarsLanguage,
  type HandlebarsExtensionOptions,
} from './lib/handlebars-language'

export {
  jsonSchemaToContextPaths,
  normalizeContextPaths,
  type ContextPath,
  type ContextPathInput,
  type JsonSchemaNode,
  type JsonSchemaToContextPathsOptions,
} from '@/lib/docyrus/context-paths'

export {
  HANDLEBARS_BLOCK_HELPERS,
  HANDLEBARS_DATA_VARIABLES,
  HANDLEBARS_HELPER_MAP,
  HANDLEBARS_HELPER_NAMES,
  HANDLEBARS_HELPERS,
  HANDLEBARS_KEYWORDS,
} from './handlebars-helpers'

export { HANDLEBARS_SAMPLES } from './handlebars-samples'

export type {
  HandlebarsAIAssistantConfig,
  HandlebarsAIMessageContext,
  HandlebarsChatMessage,
  HandlebarsCodeEditorProps,
  HandlebarsEditorOrientation,
  HandlebarsEditorProps,
  HandlebarsErrorPhase,
  HandlebarsEvaluationError,
  HandlebarsEvaluationState,
  HandlebarsHelper,
  HandlebarsHelperFn,
  HandlebarsHelperParam,
  HandlebarsOutputMode,
  IHandlebarsAiAssistantRenderContext,
  HandlebarsRenderOptions,
  HandlebarsSample,
  UseHandlebarsOptions,
} from './handlebars-editor-types'
