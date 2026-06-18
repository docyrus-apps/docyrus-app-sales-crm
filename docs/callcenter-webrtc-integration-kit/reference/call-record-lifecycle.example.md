# Call Record Lifecycle Example

Bu örnek WebRTC session eventlerini `base_callcenter.call` kayıtlarına çevirmek için kullanılacak temel mantığı gösterir.

## Event tipi

```ts
type CallLifecycleEvent =
  | 'ringing'
  | 'answered'
  | 'ended'
  | 'missed'
  | 'rejected'

type LiveCallSession = {
  callId: string
  direction: 'inbound' | 'outbound'
  phone?: string
  source?: 'manual' | 'callback' | 'campaign_item' | 'inbound'
  startedAt?: string
  answeredAt?: string
  endedAt?: string
  providerType?: string
  queueLabel?: string
}
```

## Payload builder

```ts
function normalizePhoneForStorage(
  value: string | undefined,
): string | undefined {
  const digits = value?.replace(/\D/g, '') ?? ''
  if (digits.length >= 7) return `+${digits}`
  return value?.trim() || undefined
}

function callTypeForSource(source: string | undefined): string {
  if (source === 'callback') return 'callback'
  if (source === 'campaign_item') return 'campaign'
  return 'manual'
}

function stateTokenForEvent(event: CallLifecycleEvent): string {
  if (event === 'answered') return 'answered'
  if (event === 'missed') return 'missed'
  if (event === 'ringing') return 'ringing'
  return 'ended'
}

function outcomeTokenForEvent(event: CallLifecycleEvent): string | undefined {
  if (event === 'ended') return 'completed'
  if (event === 'missed') return 'no_answer'
  return undefined
}

export function buildCallRecordPayload(args: {
  session: LiveCallSession
  event: CallLifecycleEvent
  includeStaticFields: boolean
  agentProfileId?: string
  contactId?: string
  leadId?: string
  resolveEnum: (fieldSlug: string, token: string | undefined) => unknown
}) {
  const { session, event, includeStaticFields, resolveEnum } = args
  const payload: Record<string, unknown> = {}
  const phone = normalizePhoneForStorage(session.phone)

  if (includeStaticFields) {
    payload.call_id = session.callId
    payload.provider_type = session.providerType ?? 'verimor-webrtc'
    payload.direction = resolveEnum('direction', session.direction)
    payload.call_type = resolveEnum(
      'call_type',
      callTypeForSource(session.source),
    )
    payload.device_type = resolveEnum('device_type', 'webrtc')
    payload.customer_phone_e164 = phone
    payload.started_at = session.startedAt

    if (args.agentProfileId) payload.agent_profile = args.agentProfileId
  }

  payload.state = resolveEnum('state', stateTokenForEvent(event))

  const outcome = outcomeTokenForEvent(event)
  if (outcome) payload.outcome = resolveEnum('outcome', outcome)

  if (phone) payload.customer_phone_e164 = phone
  if (args.contactId) payload.contact = args.contactId
  else if (args.leadId) payload.lead = args.leadId
  if (session.queueLabel) payload.queue_name = session.queueLabel

  if (event === 'ringing') payload.ringing_at = session.startedAt
  if (event === 'answered') {
    payload.answered_at = session.answeredAt ?? session.startedAt
    payload.is_missed = false
  }
  if (event === 'missed') payload.is_missed = true
  if (event === 'ended' || event === 'missed' || event === 'rejected') {
    payload.ended_at = session.endedAt
  }

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  )
}
```

## Create/update akışı

```ts
async function persistLifecycleEvent(args: {
  callCollection: {
    create(data: Record<string, unknown>): Promise<{ id?: string }>
    update(id: string, data: Record<string, unknown>): Promise<unknown>
  }
  existingRecordId?: string
  session: LiveCallSession
  event: CallLifecycleEvent
  agentProfileId?: string
  contactId?: string
  leadId?: string
  resolveEnum: (field: string, token: string | undefined) => unknown
}) {
  const includeStaticFields = !args.existingRecordId
  const payload = buildCallRecordPayload({
    session: args.session,
    event: args.event,
    includeStaticFields,
    agentProfileId: args.agentProfileId,
    contactId: args.contactId,
    leadId: args.leadId,
    resolveEnum: args.resolveEnum,
  })

  if (args.existingRecordId) {
    await args.callCollection.update(args.existingRecordId, payload)
    return args.existingRecordId
  }

  const created = await args.callCollection.create(payload)
  return created.id
}
```

## Önemli korumalar

- `call_id` aynı çağrının correlation anahtarıdır.
- İlk event create, sonraki event update yapmalıdır.
- Contact/lead relation doluysa otomatik overwrite yapılmamalıdır.
- Enum resolve edilemiyorsa create/update yapılmamalı; schema eksik raporlanmalıdır.
- Call create hata verirse WebRTC çağrısı durdurulmamalıdır; UI güvenli fallback ile devam etmelidir.
