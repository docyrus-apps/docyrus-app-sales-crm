import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useBaseCallcenterAgentTelephonyProfileCollection } from '@/collections'
import { useMyInfo } from '@/hooks/use-users'
import type { WebphoneAgentProfile } from '@/lib/webphone/types'

// `sip_password` / `display_name` are requested explicitly because the
// generated entity type is stale (openapi.json not refreshed for them); the
// row is cast to WebphoneAgentProfile. `sip_password` is sensitive — it is
// only used to build the SIP registration config, never rendered or logged.
const PROFILE_COLUMNS = [
  'id',
  'enabled',
  'extension',
  'pbx_user_id',
  'sip_password',
  'display_name',
  'preferred_device(id,name)',
  'webrtc_enabled',
  'current_state(id,name)',
  'user',
] as Array<string>

/**
 * The current Docyrus user's agent telephony profile. Drives WebRTC readiness
 * and the SIP credentials. Returns null when the user has no profile (→ dial
 * stays disabled with a "phone settings missing" message).
 */
export function useMyAgentTelephonyProfile() {
  const collection = useBaseCallcenterAgentTelephonyProfileCollection()
  const { data: me } = useMyInfo()

  return useQuery({
    queryKey: ['webphone', 'agent-profile', me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const rows = await collection.list({
        columns: PROFILE_COLUMNS,
        filters: {
          combinator: 'and',
          rules: [{ field: 'user', operator: 'eq', value: me!.id }],
        },
        limit: 1,
      })

      const row = rows[0]
      return row ? (row as unknown as WebphoneAgentProfile) : null
    },
  })
}

export interface UpdateAgentExtensionInput {
  profileId: string
  extension?: string
  pbx_user_id?: string
  /** Only sent when the user re-enters it — never overwritten with a blank. */
  sip_password?: string
  display_name?: string
}

/**
 * Updates the current user's own agent telephony profile (extension + SIP
 * credentials) from the header "extension settings" panel. Invalidates the
 * profile query so the provider rebuilds its SIP config from the new values.
 */
export function useUpdateMyAgentTelephonyProfile() {
  const collection = useBaseCallcenterAgentTelephonyProfileCollection()
  const queryClient = useQueryClient()
  const { data: me } = useMyInfo()

  return useMutation({
    mutationFn: async ({ profileId, ...rest }: UpdateAgentExtensionInput) => {
      const payload = Object.fromEntries(
        Object.entries(rest).filter(
          ([, value]) => value !== undefined && value !== '',
        ),
      )
      return collection.update(profileId, payload)
    },
    onSuccess: async (_row, variables) => {
      queryClient.setQueryData<WebphoneAgentProfile | null>(
        ['webphone', 'agent-profile', me?.id],
        (current) => {
          if (!current || current.id !== variables.profileId) return current
          return {
            ...current,
            extension: variables.extension ?? current.extension,
            pbx_user_id: variables.pbx_user_id ?? current.pbx_user_id,
            display_name: variables.display_name ?? current.display_name,
            sip_password: variables.sip_password ?? current.sip_password,
          }
        },
      )
      await queryClient.invalidateQueries({
        queryKey: ['webphone', 'agent-profile', me?.id],
      })
      toast.success('Dahili ayarları kaydedildi')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Dahili ayarları kaydedilemedi')
    },
  })
}
