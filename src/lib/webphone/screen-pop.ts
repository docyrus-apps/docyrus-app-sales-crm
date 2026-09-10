import type { CustomerAdapter, CustomerMatch } from './types'

/*
 * Incoming caller → customer matching. 0 matches = unknown caller, 1 = open the
 * card automatically, N = let the agent pick. The call's customer relation is
 * only patched for an unambiguous single match and only when still empty.
 * @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]
 */

export type ScreenPopMode = 'single' | 'multi' | 'none' | 'unknown'

export interface ScreenPopState {
  id: string;
  callId: string;
  phone: string;
  mode: ScreenPopMode;
  matches: Array<CustomerMatch>;
}

export async function resolveIncomingScreenPop(args: {
  callId: string;
  phone: string | undefined;
  adapter: CustomerAdapter;
}): Promise<ScreenPopState> {
  const phone = args.phone?.trim() ?? ''

  if (!phone) {
    return {
      id: `${args.callId}:unknown`,
      callId: args.callId,
      phone,
      mode: 'unknown',
      matches: []
    }
  }

  let matches: Array<CustomerMatch> = []

  try {
    matches = await args.adapter.findByPhone(phone)
  } catch {
    // Rate limit / lookup failure → treat as unknown caller, never block the call.
    matches = []
  }

  const mode: ScreenPopMode =
    matches.length === 0 ? 'none' : matches.length === 1 ? 'single' : 'multi'

  return {
    id: `${args.callId}:${phone}`,
    callId: args.callId,
    phone,
    mode,
    matches
  }
}

/** Returns the relation ids to patch for an unambiguous single match, else `{}`. */
export function buildSingleMatchRelationPatch(args: {
  state: ScreenPopState;
  existingContactId?: string;
  existingLeadId?: string;
}): { contactId?: string; leadId?: string } {
  if (args.existingContactId || args.existingLeadId) return {}
  if (args.state.mode !== 'single') return {}

  const match = args.state.matches[0]

  if (!match?.id) return {}

  if (match.kind === 'contact') return { contactId: match.id }
  if (match.kind === 'lead') return { leadId: match.id }

  return {}
}
