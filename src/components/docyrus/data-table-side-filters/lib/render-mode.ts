// @ts-nocheck
/* eslint-disable */
import {
  type ColumnConfig,
  type ColumnDataType,
} from '@/components/docyrus/data-table-filter/core/types'

import {
  type SideFilterColumnDefaults,
  type SideFilterRenderMode,
} from '../core/types'

export const DEFAULT_SHOW_MORE_THRESHOLD = 8

interface ResolveOptions {
  defaults?: SideFilterColumnDefaults
  optionsCount?: number
  /**
   * When `false`, single-value `option` columns prefer `dropdown-chips`
   * over `inline-checkbox` once the option list exceeds the threshold.
   */
  preferInlineForSelect?: boolean
}

export function resolveSideFilterRenderMode<TData>(
  column: ColumnConfig<TData, ColumnDataType>,
  { defaults, optionsCount, preferInlineForSelect = true }: ResolveOptions = {},
): SideFilterRenderMode {
  const explicit = defaults?.mode

  if (explicit && explicit !== 'auto') return explicit

  switch (column.type) {
    case 'text':
      return 'text-input'

    case 'number':
      return 'numeric-range'

    case 'date':
      return 'date-range'

    case 'boolean':
      return 'boolean'

    case 'option':

    case 'multiOption': {
      if (column.asyncOptions) return 'dropdown-chips'
      const count = optionsCount ?? column.options?.length ?? 0
      const threshold =
        defaults?.showMoreThreshold ?? DEFAULT_SHOW_MORE_THRESHOLD

      if (count <= threshold) return 'inline-checkbox'
      if (column.type === 'option' && !preferInlineForSelect)
        return 'dropdown-chips'

      return 'inline-checkbox'
    }

    default:
      return 'text-input'
  }
}
