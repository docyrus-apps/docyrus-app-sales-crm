# Incoming Screen-Pop Flow Example

Bu dosya gelen çağrıda müşteri kartı açma akışını örnekler.

## Flow state

```ts
type ScreenPopMode = 'single' | 'multi' | 'none' | 'unknown'

interface ScreenPopState {
  id: string
  callId: string
  phone: string
  mode: ScreenPopMode
  matches: CustomerMatch[]
  createdAt: string
}
```

## Resolve akışı

```ts
export async function resolveIncomingScreenPop(args: {
  callId: string
  phone?: string
  customerAdapter: CustomerAdapter
}): Promise<ScreenPopState> {
  const phone = args.phone?.trim() ?? ''

  if (!phone) {
    return {
      id: `${args.callId}:unknown`,
      callId: args.callId,
      phone,
      mode: 'unknown',
      matches: [],
      createdAt: new Date().toISOString(),
    }
  }

  const matches = await args.customerAdapter.findByPhone(phone)
  const mode =
    matches.length === 0 ? 'none' : matches.length === 1 ? 'single' : 'multi'

  return {
    id: `${args.callId}:${phone}`,
    callId: args.callId,
    phone,
    mode,
    matches,
    createdAt: new Date().toISOString(),
  }
}
```

## UI kararları

```ts
function handleScreenPopResolved(
  state: ScreenPopState,
  adapter: CustomerAdapter,
) {
  if (state.mode === 'single') {
    adapter.openCustomerCard(state.matches[0])
    return
  }

  if (state.mode === 'multi') {
    // Match picker sheet/modal aç.
    return
  }

  if (state.mode === 'none') {
    // Unknown caller paneli aç; yeni müşteri oluşturma aksiyonu opsiyonel.
    return
  }

  // Unknown/phone missing: sadece incoming call paneli göster.
}
```

## Call relation patch koruması

```ts
function buildSingleMatchRelationPatch(args: {
  state: ScreenPopState
  existingContactId?: string
  existingLeadId?: string
}) {
  if (args.existingContactId || args.existingLeadId) return {}
  if (args.state.mode !== 'single') return {}

  const match = args.state.matches[0]
  if (!match?.id) return {}

  if (match.kind === 'contact') return { contact: match.id }
  if (match.kind === 'lead') return { lead: match.id }

  // Hedef proje custom customer kullanıyorsa base.contact mirror yoksa relation patch yapma.
  return {}
}
```

## Incoming call UI minimum aksiyonları

- Answer
- Reject
- Caller name/phone
- Match list, gerekiyorsa
- Open customer card
- Create customer, opsiyonel

## Önemli notlar

- Incoming screen-pop çağrı cevaplanmadan önce açılabilir.
- Screen-pop eşleşmesi gecikirse çağrı UI bekletilmemelidir.
- Eşleşme cache’i kısa süreli olabilir; örn. 30 saniye.
- 429/rate limit durumunda unknown caller fallback kullanılmalıdır.
- Kullanıcı seçimi olmadan çoklu eşleşmede call relation patch edilmemelidir.
