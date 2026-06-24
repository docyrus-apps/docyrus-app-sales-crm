'use client'

// @ts-nocheck
/* eslint-disable */
export { JsonataEditor } from './jsonata-editor'
export { JsonataCodeEditor } from './jsonata-code-editor'
export { useJsonata } from './use-jsonata'
export {
  type IUseApplyJsonataResult,
  useApplyJsonata,
} from './use-apply-jsonata'

export {
  evaluateJsonata,
  parseJsonInput,
  stringifyResult,
} from './lib/evaluate'
export type { ParsedJsonInput } from './lib/evaluate'

export {
  jsonataExtensions,
  jsonataLanguage,
  type JsonataExtensionOptions,
} from './lib/jsonata-language'

export {
  jsonSchemaToContextPaths,
  normalizeContextPaths,
  type ContextPath,
  type ContextPathInput,
  type JsonSchemaNode,
  type JsonSchemaToContextPathsOptions,
} from '@/lib/docyrus/context-paths'

export {
  JSONATA_FUNCTION_MAP,
  JSONATA_FUNCTION_NAMES,
  JSONATA_FUNCTIONS,
  JSONATA_KEYWORDS,
} from './jsonata-functions'

export { JSONATA_SAMPLES } from './jsonata-samples'

export type {
  JsonataAIAssistantConfig,
  JsonataAIMessageContext,
  JsonataChatMessage,
  JsonataCodeEditorProps,
  JsonataEditorOrientation,
  JsonataEditorProps,
  JsonataErrorPhase,
  JsonataEvaluateOptions,
  JsonataEvaluationError,
  JsonataEvaluationState,
  JsonataFunction,
  JsonataFunctionParam,
  JsonataSample,
  IJsonataAiAssistantRenderContext,
  UseJsonataOptions,
} from './jsonata-editor-types'
