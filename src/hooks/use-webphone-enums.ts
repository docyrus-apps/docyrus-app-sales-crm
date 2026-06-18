import { useMemo } from 'react'
import { useEnums } from '@/hooks/use-enums'
import {
  type EnumCatalog,
  type ResolveWebphoneEnum,
  createWebphoneEnumResolver,
} from '@/lib/webphone/enum-resolver'

/**
 * Resolver for `base_callcenter` enums (call + call_activity) used by the call
 * lifecycle and wrap-up persistence. Reuses the shared 1h-cached enum catalog.
 */
export function useWebphoneEnumResolver(): {
  resolveEnum: ResolveWebphoneEnum
  isLoading: boolean
} {
  const { data, isLoading } = useEnums({ enabled: true })

  const resolveEnum = useMemo(
    () => createWebphoneEnumResolver(data as EnumCatalog | undefined),
    [data],
  )

  return { resolveEnum, isLoading }
}
