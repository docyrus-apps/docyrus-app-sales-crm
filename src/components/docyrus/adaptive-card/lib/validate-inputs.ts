// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardInput,
  type AdaptiveCardInputValue,
} from '../adaptive-card-types'

export interface ValidationResult {
  isValid: boolean
  errorMessage?: string
}

function isEmpty(value: AdaptiveCardInputValue): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.length === 0
  if (Array.isArray(value)) return value.length === 0

  return false
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

function isoCompare(a: string, b: string): number {
  if (a === b) return 0

  return a < b ? -1 : 1
}

export function validateInput(
  input: AdaptiveCardInput,
  value: AdaptiveCardInputValue,
): ValidationResult {
  const required = input.isRequired === true
  const message = input.errorMessage

  if (required && isEmpty(value)) {
    return {
      isValid: false,
      errorMessage: message ?? 'This field is required.',
    }
  }

  if (isEmpty(value)) return { isValid: true }

  switch (input.type) {
    case 'Input.Text': {
      const str = String(value)

      if (
        typeof input.maxLength === 'number' &&
        input.maxLength > 0 &&
        str.length > input.maxLength
      ) {
        return {
          isValid: false,
          errorMessage: message ?? `Maximum length is ${input.maxLength}.`,
        }
      }

      if (input.regex) {
        try {
          if (!new RegExp(input.regex).test(str)) {
            return {
              isValid: false,
              errorMessage:
                message ?? 'Value does not match the expected format.',
            }
          }
        } catch {}
      }

      return { isValid: true }
    }

    case 'Input.Number': {
      const num = typeof value === 'number' ? value : Number(value)

      if (!Number.isFinite(num)) {
        return {
          isValid: false,
          errorMessage: message ?? 'Value must be a number.',
        }
      }

      if (typeof input.min === 'number' && num < input.min) {
        return {
          isValid: false,
          errorMessage: message ?? `Minimum is ${input.min}.`,
        }
      }

      if (typeof input.max === 'number' && num > input.max) {
        return {
          isValid: false,
          errorMessage: message ?? `Maximum is ${input.max}.`,
        }
      }

      return { isValid: true }
    }

    case 'Input.Date': {
      const str = String(value)

      if (!DATE_RE.test(str)) {
        return { isValid: false, errorMessage: message ?? 'Use YYYY-MM-DD.' }
      }

      if (input.min && isoCompare(str, input.min) < 0) {
        return {
          isValid: false,
          errorMessage: message ?? `Earliest date is ${input.min}.`,
        }
      }

      if (input.max && isoCompare(str, input.max) > 0) {
        return {
          isValid: false,
          errorMessage: message ?? `Latest date is ${input.max}.`,
        }
      }

      return { isValid: true }
    }

    case 'Input.Time': {
      const str = String(value)

      if (!TIME_RE.test(str)) {
        return { isValid: false, errorMessage: message ?? 'Use HH:MM.' }
      }

      if (input.min && isoCompare(str, input.min) < 0) {
        return {
          isValid: false,
          errorMessage: message ?? `Earliest time is ${input.min}.`,
        }
      }

      if (input.max && isoCompare(str, input.max) > 0) {
        return {
          isValid: false,
          errorMessage: message ?? `Latest time is ${input.max}.`,
        }
      }

      return { isValid: true }
    }

    case 'Input.Rating': {
      const num = typeof value === 'number' ? value : Number(value)
      const max = input.max ?? 5

      if (!Number.isFinite(num) || num < 0 || num > max) {
        return {
          isValid: false,
          errorMessage: message ?? `Rating must be between 0 and ${max}.`,
        }
      }

      return { isValid: true }
    }

    default:
      return { isValid: true }
  }
}

export function validateInputs(
  inputs: Array<AdaptiveCardInput>,
  values: Record<string, AdaptiveCardInputValue>,
): Record<string, ValidationResult> {
  const result: Record<string, ValidationResult> = {}

  for (const input of inputs) {
    result[input.id] = validateInput(input, values[input.id] ?? null)
  }

  return result
}
