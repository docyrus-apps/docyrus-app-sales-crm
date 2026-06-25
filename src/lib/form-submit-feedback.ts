type Translate = (key: string, options?: Record<string, unknown>) => string

type ValidationIssue = {
  path?: Array<string | number>;
  message?: string;
}

type SafeParseResult =
  | { success: true }
  | { success: false; error?: { issues?: Array<ValidationIssue> } }

type SafeParseSchema<TValue> = {
  safeParse: (value: TValue) => SafeParseResult;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function getNestedString(
  value: Record<string, unknown>,
  path: Array<string>
): string | null {
  let current: unknown = value

  for (const segment of path) {
    if (!isRecord(current)) return null
    current = current[segment]
  }

  return typeof current === 'string' && current.trim() ? current.trim() : null
}

function extractErrorMessage(error: unknown): string | null {
  if (typeof error === 'string' && error.trim()) return error.trim()
  if (error instanceof Error && error.message.trim())
    return error.message.trim()
  if (!isRecord(error)) return null

  const directMessage =
    getNestedString(error, ['message']) ||
    getNestedString(error, ['error']) ||
    getNestedString(error, ['response', 'data', 'message']) ||
    getNestedString(error, ['response', 'data', 'error']) ||
    getNestedString(error, ['data', 'message']) ||
    getNestedString(error, ['body', 'message'])

  if (directMessage) return directMessage

  const { errors } = error

  if (Array.isArray(errors)) {
    const first = errors.find((item) => {
      if (typeof item === 'string') return item.trim()
      if (isRecord(item)) return getNestedString(item, ['message'])

      return false
    })

    if (typeof first === 'string') return first.trim()
    if (isRecord(first)) return getNestedString(first, ['message'])
  }

  return null
}

function normalizeIssueMessage(message: string | undefined, t: Translate) {
  if (!message?.trim()) {
    return t('common.formInvalidMessage', {
      defaultValue: 'Please fix the highlighted fields before saving.'
    })
  }

  if (/required/i.test(message)) {
    return t('common.requiredFieldMessage', {
      defaultValue: 'This field is required.'
    })
  }

  return message
}

export function getValidationSubmitMessage(
  error: { issues?: Array<ValidationIssue> } | undefined,
  fieldLabels: Record<string, string>,
  t: Translate
): string {
  const issue = error?.issues?.[0]
  const fallback = t('common.formInvalidMessage', {
    defaultValue: 'Please fix the highlighted fields before saving.'
  })

  if (!issue) return fallback

  const fieldKey = issue.path?.[0] ? String(issue.path[0]) : ''
  const fieldLabel = fieldKey ? fieldLabels[fieldKey] : ''
  const issueMessage = normalizeIssueMessage(issue.message, t)

  if (!fieldLabel) return issueMessage || fallback

  return t('common.formInvalidFieldMessage', {
    defaultValue: '{{field}}: {{message}}',
    field: fieldLabel,
    message: issueMessage
  })
}

export function validateSubmitValues<TValue>(
  schema: SafeParseSchema<TValue>,
  values: TValue,
  fieldLabels: Record<string, string>,
  t: Translate
): string | null {
  const result = schema.safeParse(values)

  if (result.success) return null

  return getValidationSubmitMessage(result.error, fieldLabels, t)
}

export function getSubmitFailureMessage(error: unknown, t: Translate): string {
  return (
    extractErrorMessage(error) ||
    t('common.formSaveFailed', {
      defaultValue: 'Could not save this record. Please check the form.'
    })
  )
}
