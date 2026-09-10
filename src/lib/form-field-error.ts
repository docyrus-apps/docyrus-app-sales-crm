type Translate = (key: string, options?: Record<string, unknown>) => string

/*
 * Zod messages set in `src/schemas/*` are i18n keys ("validation.invalidEmail"),
 * not prose: the schemas are module-level constants and cannot call `t()`. Field
 * error slots therefore have to resolve the key at render time — printing the
 * raw message showed English ("Invalid email address") inside an otherwise
 * Turkish form.
 */
const KEY_PATTERN = /^[a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+$/

export function resolveValidationMessage(
  message: string | undefined,
  t: Translate
): string {
  const trimmed = message?.trim()

  if (!trimmed) return t('common.validationError')

  if (!KEY_PATTERN.test(trimmed)) return trimmed

  const translated = t(trimmed)

  /*
   * i18next echoes an unknown key back. Never surface a bare key to the user —
   * fall back to the generic validation message instead.
   */
  return translated === trimmed ? t('common.validationError') : translated
}

export function resolveFieldErrorMessage(error: unknown, t: Translate): string {
  if (typeof error === 'string') return resolveValidationMessage(error, t)

  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message?: unknown }

    if (typeof message === 'string') return resolveValidationMessage(message, t)
  }

  return t('common.validationError')
}
