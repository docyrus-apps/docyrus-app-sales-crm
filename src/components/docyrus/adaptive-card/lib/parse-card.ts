// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardPayload } from '../adaptive-card-types'

export function isAdaptiveCard(
  payload: unknown,
): payload is AdaptiveCardPayload {
  if (!payload || typeof payload !== 'object') return false
  if ((payload as { type?: string }).type !== 'AdaptiveCard') return false

  return true
}

/*
 * Background-image URL guard — refuses `javascript:` and `data:text/html` URIs
 * while still allowing `https:`, `http:`, and `data:image/*`.
 */
const SAFE_URL_RE = /^(?:https?:\/\/|data:image\/)/i

export function isSafeBackgroundUrl(url: string | undefined): url is string {
  if (!url) return false

  return SAFE_URL_RE.test(url)
}

/*
 * Normalizes a payload by ensuring `version` exists. Heavier normalization
 * (defaulting `isVisible`, gating `requires`, evaluating `fallback`) happens
 * inside the element-node renderer so it can pick the per-element fallback
 * at render time rather than mutating the tree up front.
 */
export function parseAdaptiveCard(
  payload: unknown,
): AdaptiveCardPayload | null {
  if (!isAdaptiveCard(payload)) return null

  const card = payload as AdaptiveCardPayload

  return {
    ...card,
    version: card.version ?? '1.0',
  }
}
