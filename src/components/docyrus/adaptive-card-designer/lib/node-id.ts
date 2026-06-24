// @ts-nocheck
/* eslint-disable */
/**
 * Stable internal node id used by the designer for selection + drag-and-drop.
 * Never written to output JSON.
 */
export function createDesignerId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `acd-${Math.random().toString(36).slice(2, 11)}`
}
