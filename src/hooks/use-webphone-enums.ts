import { useMemo } from 'react'

import type {
  EnumCatalog,
  ResolveWebphoneEnum
} from '@/lib/webphone/enum-resolver'

import { useEnums } from '@/hooks/use-enums'
import { createWebphoneEnumResolver } from '@/lib/webphone/enum-resolver'

/**
 * Resolver for `base_callcenter` enums (call + call_activity) used by the call
 * lifecycle and wrap-up persistence. Reuses the shared 1h-cached enum catalog.
 */
export function useWebphoneEnumResolver(): {
  resolveEnum: ResolveWebphoneEnum;
  isLoading: boolean;
} {
  const { data, isLoading } = useEnums({ enabled: true })

  const resolveEnum = useMemo(() => createWebphoneEnumResolver(data), [data])

  return { resolveEnum, isLoading }
}
