// @ts-nocheck
/* eslint-disable */
/**
 * Keywords disallowed by OpenAI Structured Outputs strict mode. Source of
 * truth for both directions: emission strips them when `treeToSchema` runs
 * with `strict=true`, and validation rejects them when `collectStrictViolations`
 * walks an externally-supplied schema.
 */
export const STRICT_FORBIDDEN_KEYWORDS: ReadonlyArray<string> = [
  'default',
  'format',
  'pattern',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minItems',
  'maxItems',
  'uniqueItems',
  'patternProperties',
  'unevaluatedProperties',
  'unevaluatedItems',
  'propertyNames',
  'contains',
  'minContains',
  'maxContains',
  'dependencies',
  'dependentSchemas',
  'dependentRequired',
  'if',
  'then',
  'else',
  'not',
  'oneOf',
  'allOf',
]

const STRICT_FORBIDDEN_SET: ReadonlySet<string> = new Set(
  STRICT_FORBIDDEN_KEYWORDS,
)
const STRICT_MAX_VIOLATIONS = 20

/** True when the keyword is disallowed under strict mode. */
export function isForbiddenStrictKeyword(keyword: string): boolean {
  return STRICT_FORBIDDEN_SET.has(keyword)
}

/**
 * Walks a JSON Schema document and collects every strict-mode violation
 * with its JSON path. Stops after ~20 violations to keep tool responses
 * compact for the agent.
 */
export function collectStrictViolations(
  node: unknown,
  path: string = '',
  violations: Array<string> = [],
): Array<string> {
  if (violations.length >= STRICT_MAX_VIOLATIONS) return violations
  if (!node || typeof node !== 'object') return violations

  if (Array.isArray(node)) {
    node.forEach((item, idx) =>
      collectStrictViolations(item, `${path}[${idx}]`, violations),
    )

    return violations
  }

  const obj = node as Record<string, unknown>
  const where = path || '(root)'

  for (const keyword of STRICT_FORBIDDEN_KEYWORDS) {
    if (keyword in obj) {
      violations.push(`${where}: forbidden keyword "${keyword}" in strict mode`)
    }
  }

  const typeValue = obj.type
  let types: Array<string> = []

  if (Array.isArray(typeValue)) {
    types = (typeValue as Array<unknown>).filter(
      (t): t is string => typeof t === 'string',
    )
  } else if (typeof typeValue === 'string') {
    types = [typeValue]
  }

  const properties = obj.properties as Record<string, unknown> | undefined
  const isObject =
    types.includes('object') || (!!properties && typeof properties === 'object')

  if (isObject) {
    if (obj.additionalProperties !== false) {
      violations.push(`${where}: object must set "additionalProperties": false`)
    }

    if (properties) {
      const propKeys = Object.keys(properties)
      let required: Array<string> = []

      if (Array.isArray(obj.required)) {
        required = (obj.required as Array<unknown>).filter(
          (k): k is string => typeof k === 'string',
        )
      }

      const missing = propKeys.filter((k) => !required.includes(k))

      if (missing.length > 0) {
        violations.push(
          `${where}: every property must appear in "required" — missing: ${missing.join(', ')}. For optionality use a union with null (e.g. ["string", "null"]).`,
        )
      }

      for (const [key, child] of Object.entries(properties)) {
        collectStrictViolations(
          child,
          path ? `${path}.${key}` : key,
          violations,
        )
      }
    }
  }

  if (types.includes('array')) {
    if (Array.isArray(obj.items)) {
      violations.push(
        `${where}: array "items" must be a single schema, not a tuple array`,
      )
    } else if (obj.items) {
      collectStrictViolations(obj.items, `${path}.items[*]`, violations)
    }
  }

  if (Array.isArray(obj.anyOf)) {
    obj.anyOf.forEach((sub, idx) =>
      collectStrictViolations(sub, `${path}.anyOf[${idx}]`, violations),
    )
  }

  const defs = obj.$defs as Record<string, unknown> | undefined

  if (defs && typeof defs === 'object') {
    for (const [name, def] of Object.entries(defs)) {
      collectStrictViolations(def, `${path}.$defs.${name}`, violations)
    }
  }

  return violations
}

/**
 * Lightweight shape guard — refuses obvious garbage (primitives, arrays at
 * root, null) before passing to the designer or strict validator. Designer
 * inputs that aren't objects crash `schemaToTree`.
 */
export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Returns a shallow-clone of `target` with forbidden strict keywords stripped.
 * Used by `treeToSchema` to keep the designer's emission consistent with the
 * validation rules above.
 */
export function stripForbiddenStrictKeywords<T extends Record<string, unknown>>(
  target: T,
): T {
  for (const keyword of STRICT_FORBIDDEN_KEYWORDS) {
    if (keyword in target) {
      delete target[keyword]
    }
  }

  return target
}
