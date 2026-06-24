// @ts-nocheck
/* eslint-disable */
import { type ElementRenderer } from './adaptive-card-types'

/*
 * Single switch on `type`. Element renderers are registered by their schema
 * `type` string and consumed by `<ElementNode />` recursion. Custom element
 * types from the renderer's `customElements` prop take precedence at render
 * time — they don't mutate this registry.
 */
const registry = new Map<string, ElementRenderer>()

export function registerElement(type: string, renderer: ElementRenderer): void {
  registry.set(type, renderer)
}

export function getElementRenderer(type: string): ElementRenderer | undefined {
  return registry.get(type)
}

export function listElementTypes(): Array<string> {
  return Array.from(registry.keys())
}
