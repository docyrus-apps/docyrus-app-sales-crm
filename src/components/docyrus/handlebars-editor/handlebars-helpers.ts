// @ts-nocheck
/* eslint-disable */
import { type HandlebarsHelper } from './handlebars-editor-types'

const DOCS = 'https://handlebarsjs.com/guide/builtin-helpers.html'

/**
 * Catalog of Handlebars built-in helpers, used to power autocomplete, hover
 * tooltips and signature help. Adapted from the official Handlebars docs.
 */
export const HANDLEBARS_HELPERS: HandlebarsHelper[] = [
  {
    name: 'if',
    signature: '{{#if condition}}…{{else}}…{{/if}}',
    category: 'Built-in',
    description:
      'Conditionally renders a block. The block is rendered when the argument is truthy (not undefined, null, false, 0, "" or []).',
    params: [
      {
        name: 'condition',
        type: 'any',
        description: 'Value to evaluate for truthiness',
      },
    ],
    returns: 'block',
    block: true,
    examples: ['{{#if author}}<h1>{{firstName}} {{lastName}}</h1>{{/if}}'],
    docsUrl: `${DOCS}#if`,
  },
  {
    name: 'unless',
    signature: '{{#unless condition}}…{{/unless}}',
    category: 'Built-in',
    description:
      'Renders the block when the argument is falsy — the inverse of `#if`.',
    params: [
      { name: 'condition', type: 'any', description: 'Value to evaluate' },
    ],
    returns: 'block',
    block: true,
    examples: [
      '{{#unless license}}<p class="warning">No license</p>{{/unless}}',
    ],
    docsUrl: `${DOCS}#unless`,
  },
  {
    name: 'each',
    signature: '{{#each list}}…{{/each}}',
    category: 'Built-in',
    description:
      'Iterates over an array or object. Inside the block, `this` refers to the current item; `@index` / `@key` / `@first` / `@last` are available on `@data`.',
    params: [
      {
        name: 'list',
        type: 'array | object',
        description: 'Collection to iterate over',
      },
    ],
    returns: 'block',
    block: true,
    examples: ['{{#each people}}<li>{{name}} ({{@index}})</li>{{/each}}'],
    docsUrl: `${DOCS}#each`,
  },
  {
    name: 'with',
    signature: '{{#with context}}…{{/with}}',
    category: 'Built-in',
    description:
      'Shifts the rendering context to the supplied value for the block.',
    params: [
      {
        name: 'context',
        type: 'any',
        description: 'New context for the block',
      },
    ],
    returns: 'block',
    block: true,
    examples: ['{{#with address}}<p>{{street}}, {{city}}</p>{{/with}}'],
    docsUrl: `${DOCS}#with`,
  },

  {
    name: 'lookup',
    signature: '{{lookup object key}}',
    category: 'Built-in',
    description:
      'Dynamically resolves a property on an object using a runtime key.',
    params: [
      {
        name: 'object',
        type: 'object | array',
        description: 'Object or array to look into',
      },
      {
        name: 'key',
        type: 'string | number',
        description: 'Property key or array index',
      },
    ],
    returns: 'any',
    examples: ['{{lookup ../users @index}}'],
    docsUrl: `${DOCS}#lookup`,
  },
  {
    name: 'log',
    signature: '{{log value [level]}}',
    category: 'Built-in',
    description:
      'Writes a value to the console at the given log level (default `info`). Useful for debugging templates.',
    params: [
      { name: 'value', type: 'any', description: 'Value to log' },
      {
        name: 'level',
        type: 'string',
        optional: true,
        description: 'Log level (debug | info | warn | error)',
      },
    ],
    returns: 'void',
    examples: ['{{log "current user" user level="warn"}}'],
    docsUrl: `${DOCS}#log`,
  },

  {
    name: 'eq',
    signature: '{{#if (eq a b)}}…{{/if}}',
    category: 'Comparison',
    description:
      'Returns true when `a` strictly equals `b`. Common sub-expression helper — register with `Handlebars.registerHelper("eq", (a, b) => a === b)`.',
    params: [
      { name: 'a', type: 'any', description: 'Left operand' },
      { name: 'b', type: 'any', description: 'Right operand' },
    ],
    returns: 'boolean',
    examples: ['{{#if (eq status "active")}}Active{{/if}}'],
  },
  {
    name: 'ne',
    signature: '{{#if (ne a b)}}…{{/if}}',
    category: 'Comparison',
    description:
      'Returns true when `a` is not strictly equal to `b`. Common sub-expression helper.',
    params: [
      { name: 'a', type: 'any', description: 'Left operand' },
      { name: 'b', type: 'any', description: 'Right operand' },
    ],
    returns: 'boolean',
    examples: ['{{#if (ne status "draft")}}Published{{/if}}'],
  },
  {
    name: 'gt',
    signature: '{{#if (gt a b)}}…{{/if}}',
    category: 'Comparison',
    description: 'Returns true when `a` is greater than `b`.',
    params: [
      { name: 'a', type: 'number', description: 'Left operand' },
      { name: 'b', type: 'number', description: 'Right operand' },
    ],
    returns: 'boolean',
    examples: ['{{#if (gt total 100)}}Premium{{/if}}'],
  },
  {
    name: 'gte',
    signature: '{{#if (gte a b)}}…{{/if}}',
    category: 'Comparison',
    description: 'Returns true when `a` is greater than or equal to `b`.',
    params: [
      { name: 'a', type: 'number', description: 'Left operand' },
      { name: 'b', type: 'number', description: 'Right operand' },
    ],
    returns: 'boolean',
  },
  {
    name: 'lt',
    signature: '{{#if (lt a b)}}…{{/if}}',
    category: 'Comparison',
    description: 'Returns true when `a` is less than `b`.',
    params: [
      { name: 'a', type: 'number', description: 'Left operand' },
      { name: 'b', type: 'number', description: 'Right operand' },
    ],
    returns: 'boolean',
  },
  {
    name: 'lte',
    signature: '{{#if (lte a b)}}…{{/if}}',
    category: 'Comparison',
    description: 'Returns true when `a` is less than or equal to `b`.',
    params: [
      { name: 'a', type: 'number', description: 'Left operand' },
      { name: 'b', type: 'number', description: 'Right operand' },
    ],
    returns: 'boolean',
  },
  {
    name: 'and',
    signature: '{{#if (and a b …)}}…{{/if}}',
    category: 'Comparison',
    description: 'Returns true when every argument is truthy.',
    params: [{ name: 'args', type: 'any', description: 'Two or more values' }],
    returns: 'boolean',
    examples: ['{{#if (and active verified)}}OK{{/if}}'],
  },
  {
    name: 'or',
    signature: '{{#if (or a b …)}}…{{/if}}',
    category: 'Comparison',
    description: 'Returns true when at least one argument is truthy.',
    params: [{ name: 'args', type: 'any', description: 'Two or more values' }],
    returns: 'boolean',
  },
  {
    name: 'not',
    signature: '{{#if (not a)}}…{{/if}}',
    category: 'Comparison',
    description: 'Returns the logical NOT of the argument.',
    params: [{ name: 'a', type: 'any', description: 'Value to negate' }],
    returns: 'boolean',
  },

  {
    name: 'add',
    signature: '{{add a b}}',
    category: 'Math',
    description: 'Returns the sum of all numeric arguments.',
    params: [
      { name: 'args', type: 'number', description: 'Two or more numbers' },
    ],
    returns: 'number',
    examples: ['{{add price tax}}'],
  },
  {
    name: 'subtract',
    signature: '{{subtract a b}}',
    category: 'Math',
    description: 'Returns `a` minus `b`.',
    params: [
      { name: 'a', type: 'number', description: 'Minuend' },
      { name: 'b', type: 'number', description: 'Subtrahend' },
    ],
    returns: 'number',
  },
  {
    name: 'multiply',
    signature: '{{multiply a b}}',
    category: 'Math',
    description: 'Returns the product of all numeric arguments.',
    params: [
      { name: 'args', type: 'number', description: 'Two or more numbers' },
    ],
    returns: 'number',
    examples: ['{{multiply qty unitPrice}}'],
  },
  {
    name: 'divide',
    signature: '{{divide a b}}',
    category: 'Math',
    description: 'Returns `a` divided by `b`.',
    params: [
      { name: 'a', type: 'number', description: 'Dividend' },
      { name: 'b', type: 'number', description: 'Divisor' },
    ],
    returns: 'number',
  },

  {
    name: 'formatNumber',
    signature: '{{formatNumber value locale digits}}',
    category: 'Formatting',
    description:
      'Formats a number with `Intl.NumberFormat`. Defaults: locale `en-US`, 2 fraction digits.',
    params: [
      { name: 'value', type: 'number', description: 'Number to format' },
      {
        name: 'locale',
        type: 'string',
        optional: true,
        description: 'BCP 47 locale (default en-US)',
      },
      {
        name: 'digits',
        type: 'number',
        optional: true,
        description: 'Fraction digits (default 2)',
      },
    ],
    returns: 'string',
    examples: ['{{formatNumber total "en-US" 2}}'],
  },
  {
    name: 'formatCurrency',
    signature: '{{formatCurrency value currency locale}}',
    category: 'Formatting',
    description:
      'Formats a number as currency. Defaults: currency `USD`, locale derived from currency (TRY → tr-TR, otherwise en-US).',
    params: [
      { name: 'value', type: 'number', description: 'Amount to format' },
      {
        name: 'currency',
        type: 'string',
        optional: true,
        description: 'ISO 4217 currency code',
      },
      {
        name: 'locale',
        type: 'string',
        optional: true,
        description: 'BCP 47 locale',
      },
    ],
    returns: 'string',
    examples: ['{{formatCurrency price "USD"}}'],
  },
  {
    name: 'formatDate',
    signature: '{{formatDate value format locale}}',
    category: 'Formatting',
    description:
      'Formats a date. Supports tokens `YYYY`, `MM`, `DD`, `MMM`, `MMMM`. Defaults: format `DD.MM.YYYY`, locale `en-US`.',
    params: [
      {
        name: 'value',
        type: 'string | number | Date',
        description: 'ISO string, millis, or Date',
      },
      {
        name: 'format',
        type: 'string',
        optional: true,
        description: 'Format string',
      },
      {
        name: 'locale',
        type: 'string',
        optional: true,
        description: 'BCP 47 locale',
      },
    ],
    returns: 'string',
    examples: ['{{formatDate createdAt "DD MMM YYYY"}}'],
  },
  {
    name: 'uppercase',
    signature: '{{uppercase value}}',
    category: 'Formatting',
    description: 'Returns the value uppercased.',
    params: [{ name: 'value', type: 'string', description: 'Input string' }],
    returns: 'string',
  },
  {
    name: 'lowercase',
    signature: '{{lowercase value}}',
    category: 'Formatting',
    description: 'Returns the value lowercased.',
    params: [{ name: 'value', type: 'string', description: 'Input string' }],
    returns: 'string',
  },
  {
    name: 'capitalize',
    signature: '{{capitalize value}}',
    category: 'Formatting',
    description: 'Returns the value with the first character uppercased.',
    params: [{ name: 'value', type: 'string', description: 'Input string' }],
    returns: 'string',
  },
  {
    name: 'json',
    signature: '{{json value}}',
    category: 'Formatting',
    description:
      'Renders the value as JSON. Useful for debugging — typically used inside `{{{ }}}` so the JSON is not HTML-escaped.',
    params: [{ name: 'value', type: 'any', description: 'Value to stringify' }],
    returns: 'string',
    examples: ['{{{json user}}}'],
  },
]

/** Map of helper name → definition for O(1) lookups. */
export const HANDLEBARS_HELPER_MAP: Map<string, HandlebarsHelper> = new Map(
  HANDLEBARS_HELPERS.map((helper) => [helper.name, helper]),
)

/** Set of every built-in helper name. */
export const HANDLEBARS_HELPER_NAMES: Set<string> = new Set(
  HANDLEBARS_HELPERS.map((helper) => helper.name),
)

/** Block helper names (used by the linter to detect missing closing tags). */
export const HANDLEBARS_BLOCK_HELPERS: Set<string> = new Set(
  HANDLEBARS_HELPERS.filter((helper) => helper.block).map(
    (helper) => helper.name,
  ),
)

/** Reserved Handlebars context keywords (used inside `{{ }}`). */
export const HANDLEBARS_KEYWORDS = [
  'this',
  'true',
  'false',
  'null',
  'undefined',
  'as',
  'else',
]

/** `@data` variables exposed inside `{{#each}}` and friends. */
export const HANDLEBARS_DATA_VARIABLES = [
  '@index',
  '@key',
  '@first',
  '@last',
  '@root',
  '@../index',
  '@../key',
]
