# Call History Query Example

Bu örnek müşteri kartında çağrı geçmişi göstermek için kullanılacak query yaklaşımını verir.

## Relation-first query

Önce standart relation üzerinden sorgula.

```tsx
import { useQuery } from '@tanstack/react-query'
import { useBaseCallcenterCallCollection } from '@/collections/base_callcenter-call.collection'

const CALL_HISTORY_COLUMNS = [
  'id',
  'call_id',
  'contact(name)',
  'lead(name)',
  'customer_phone_e164',
  'direction(name)',
  'agent_profile(name)',
  'state(name)',
  'outcome(name)',
  'started_at',
  'ringing_at',
  'answered_at',
  'ended_at',
  'duration_seconds',
  'talk_duration_seconds',
  'is_missed',
  'recording_status(name)',
  'recording_url',
]

export function useCustomerCallHistory(args: {
  contactId?: string
  leadId?: string
  phone?: string
  enabled?: boolean
}) {
  const calls = useBaseCallcenterCallCollection()

  return useQuery({
    queryKey: [
      'callcenter',
      'customer-call-history',
      args.contactId ?? args.leadId ?? args.phone ?? 'none',
    ],
    enabled:
      args.enabled !== false && !!(args.contactId || args.leadId || args.phone),
    queryFn: async () => {
      const rows = new Map<string, unknown>()

      if (args.contactId || args.leadId) {
        const relationField = args.contactId ? 'contact' : 'lead'
        const relationValue = args.contactId ?? args.leadId

        const relationRows = await calls.list({
          columns: CALL_HISTORY_COLUMNS,
          filters: {
            combinator: 'and',
            rules: [
              { field: relationField, operator: 'eq', value: relationValue },
            ],
          },
          orderBy: { field: 'created_on', direction: 'desc' },
          limit: 120,
        })

        for (const row of relationRows) {
          if (row.id) rows.set(row.id, row)
        }
      }

      if (args.phone) {
        const normalized = args.phone.replace(/\D/g, '')

        if (normalized.length >= 7) {
          const phoneRows = await calls.list({
            columns: CALL_HISTORY_COLUMNS,
            filters: {
              combinator: 'or',
              rules: [
                {
                  field: 'customer_phone_e164',
                  operator: 'eq',
                  value: `+${normalized}`,
                },
                {
                  field: 'customer_phone_e164',
                  operator: 'like',
                  value: normalized.slice(-10),
                },
              ],
            },
            orderBy: { field: 'created_on', direction: 'desc' },
            limit: 120,
          })

          for (const row of phoneRows) {
            if (row.id) rows.set(row.id, row)
          }
        }
      }

      return [...rows.values()].sort((a, b) => {
        const left = a as { started_at?: string; created_on?: string }
        const right = b as { started_at?: string; created_on?: string }
        return (
          Date.parse(right.started_at ?? right.created_on ?? '') -
          Date.parse(left.started_at ?? left.created_on ?? '')
        )
      })
    },
  })
}
```

## Empty state metni

Son kullanıcı UI’ı için öneri:

```txt
Henüz arama yok
```

Teknik açıklama gösterme:

```txt
Datasource bağlı değil
Call query fallback çalışmadı
```

## Fallback kuralları

1. Contact/lead relation varsa relation query kullan.
2. Relation query boş veya hata verirse phone query kullan.
3. Telefon da yoksa empty state göster.
4. Query her zaman `columns` ile çalışmalı.
5. `created_on` fallback sıralama alanı olarak kullanılabilir.

## Görsel kolon önerisi

- Yön: Gelen/Giden
- Durum: Cevaplandı/Cevapsız/Bitti
- Tarih
- Süre
- Agent
- Kayıt linki

## Query invalidation

Şu aksiyonlardan sonra invalidate et:

```ts
queryClient.invalidateQueries({
  queryKey: ['callcenter', 'customer-call-history'],
})
queryClient.invalidateQueries({ queryKey: ['callcenter', 'calls'] })
```

Eğer hedef proje müşteri kartı query key’i kullanıyorsa onu da invalidate et.
