import {
  type ColumnDataType,
  type FilterOperators,
} from '@/components/docyrus/data-table-filter/core/types'

/**
 * Default operator selected when a value is added through a side-panel
 * controller. Mirrors `DEFAULT_OPERATORS` from data-table-filter but
 * picks the variant that makes sense for the e-commerce side-panel UX
 * (e.g. multi-select defaults to `is any of`, not `is`).
 */
export const SIDE_FILTER_DEFAULT_OPERATORS: {
  [T in ColumnDataType]: FilterOperators[T]
} = {
  text: 'contains',
  number: 'is between',
  date: 'is between',
  option: 'is any of',
  multiOption: 'include any of',
  boolean: 'is',
}
