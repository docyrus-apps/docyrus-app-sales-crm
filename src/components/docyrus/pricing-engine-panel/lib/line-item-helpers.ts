import { type ILineItem, type IPricingConfig } from '../interfaces'

let nextId = 1

function generateId(): string {
  return `line-${Date.now()}-${nextId++}`
}

/**
 * Create a new blank line item with defaults.
 */
export function createLineItem(
  defaults: Pick<IPricingConfig, 'defaultVatRate'>,
  overrides?: Partial<ILineItem>,
): ILineItem {
  return {
    id: generateId(),
    position: 0,
    productId: null,
    categoryId: null,
    name: '',
    category: '',
    quantity: 1,
    unitPrice: 0,
    vatRate: defaults.defaultVatRate,
    discountPercent: 0,
    ...overrides,
  }
}

/**
 * Insert a new item at the end, updating positions.
 */
export function addLineItemToList(
  items: ILineItem[],
  newItem: ILineItem,
): ILineItem[] {
  const withPosition = { ...newItem, position: items.length }

  return [...items, withPosition]
}

/**
 * Remove an item by id and recompute positions.
 */
export function removeLineItemFromList(
  items: ILineItem[],
  id: string,
): ILineItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item, index) => ({ ...item, position: index }))
}

/**
 * Update specific fields of a line item by id.
 */
export function updateLineItemInList(
  items: ILineItem[],
  id: string,
  updates: Partial<ILineItem>,
): ILineItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...updates } : item))
}

/**
 * Duplicate a line item (new id, position at end).
 */
export function duplicateLineItemInList(
  items: ILineItem[],
  id: string,
): ILineItem[] {
  const source = items.find((item) => item.id === id)

  if (!source) return items

  const duplicate: ILineItem = {
    ...source,
    id: generateId(),
    position: items.length,
    productId: null,
  }

  return [...items, duplicate]
}

/**
 * Reorder: move item from one position to another.
 */
export function reorderLineItemList(
  items: ILineItem[],
  fromIndex: number,
  toIndex: number,
): ILineItem[] {
  const result = [...items]
  const [moved] = result.splice(fromIndex, 1) as [ILineItem]

  result.splice(toIndex, 0, moved)

  return result.map((item, index) => ({ ...item, position: index }))
}
