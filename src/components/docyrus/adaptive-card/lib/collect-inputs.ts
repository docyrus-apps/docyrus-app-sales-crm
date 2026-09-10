// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardActionExecute,
  type AdaptiveCardActionSubmit,
  type AdaptiveCardElement,
  type AdaptiveCardInput,
  type AdaptiveCardInputValue,
  type AdaptiveCardPayload,
} from '../adaptive-card-types'

import { interpolateData } from './interpolate'

/*
 * Walks an element tree and collects every Input.* node it encounters, in
 * DOM (depth-first) order. Hidden elements (`isVisible === false`) are
 * excluded so `associatedInputs: 'auto'` matches what the user actually sees.
 */
export function collectInputs(
  elements: Array<AdaptiveCardElement> | undefined,
  visibilityOverrides: Record<string, boolean>,
): Array<AdaptiveCardInput> {
  if (!elements) return []

  const acc: Array<AdaptiveCardInput> = []

  for (const element of elements) {
    if (isHidden(element, visibilityOverrides)) continue
    walk(element, acc, visibilityOverrides)
  }

  return acc
}

function isHidden(
  element: AdaptiveCardElement | { id?: string; isVisible?: boolean },
  visibilityOverrides: Record<string, boolean>,
): boolean {
  const { id } = element as { id?: string }

  if (id && id in visibilityOverrides) {
    return !visibilityOverrides[id]
  }

  return (element as { isVisible?: boolean }).isVisible === false
}

function walk(
  element: AdaptiveCardElement,
  acc: Array<AdaptiveCardInput>,
  overrides: Record<string, boolean>,
): void {
  switch (element.type) {
    case 'Input.Text':

    case 'Input.Number':

    case 'Input.Date':

    case 'Input.Time':

    case 'Input.Toggle':

    case 'Input.ChoiceSet':

    case 'Input.Rating':
      acc.push(element)

      return

    case 'Container':
      if (element.items) {
        for (const child of element.items) {
          if (!isHidden(child, overrides)) walk(child, acc, overrides)
        }
      }

      return

    case 'ColumnSet':
      if (element.columns) {
        for (const col of element.columns) {
          if (isHidden(col, overrides)) continue

          if (col.items) {
            for (const child of col.items) {
              if (!isHidden(child, overrides)) walk(child, acc, overrides)
            }
          }
        }
      }

      return

    case 'Table':
      if (element.rows) {
        for (const row of element.rows) {
          for (const cell of row.cells ?? []) {
            if (cell.items) {
              for (const child of cell.items) {
                if (!isHidden(child, overrides)) walk(child, acc, overrides)
              }
            }
          }
        }
      }

      return

    default:
      return
  }
}

export function buildSubmitData(
  action: AdaptiveCardActionSubmit | AdaptiveCardActionExecute,
  card: AdaptiveCardPayload,
  values: Record<string, AdaptiveCardInputValue>,
  visibilityOverrides: Record<string, boolean>,
): Record<string, AdaptiveCardInputValue> | unknown {
  const associated = action.associatedInputs ?? 'auto'
  const inputs =
    associated === 'auto' ? collectInputs(card.body, visibilityOverrides) : []

  const payload: Record<string, AdaptiveCardInputValue> = {}

  for (const input of inputs) {
    payload[input.id] = values[input.id] ?? null
  }

  const rawData = action.data

  if (rawData == null) return payload

  /*
   * `${input.<id>}` placeholders inside `data` resolve against the full
   * `values` map so `associatedInputs: 'none'` actions can still cherry-pick
   * specific input values into their custom payload.
   */
  const data = interpolateData(rawData, values)

  if (typeof data === 'object' && !Array.isArray(data)) {
    return { ...payload, ...(data as Record<string, AdaptiveCardInputValue>) }
  }

  return { ...payload, data }
}
