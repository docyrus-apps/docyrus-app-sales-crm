# Customer Adapter Example

Bu örnek hedef projedeki contact/customer/requester datasını Callcenter WebRTC modülüne bağlamak için kullanılacak adapter sözleşmesini gösterir.

> Bu dosyadaki kod örnektir; hedef projede generated collection adları ve route açma davranışı mevcut mimariye göre uyarlanmalıdır.

## Tip sözleşmesi

```ts
export type CustomerKind =
  | 'contact'
  | 'customer'
  | 'requester'
  | 'lead'
  | string

export interface CustomerMatch {
  kind: CustomerKind
  id: string
  label: string
  phone?: string
  email?: string
  sourceAppSlug: string
  sourceDataSourceSlug: string
}

export interface CustomerAdapter {
  findByPhone(phone: string): Promise<CustomerMatch[]>
  getById(id: string): Promise<CustomerMatch | null>
  getDialablePhone(record: unknown): string | null
  openCustomerCard(match: CustomerMatch): void
  createFromPhone?: (phone: string) => Promise<CustomerMatch>
}
```

## Telefon normalize helper

```ts
export function normalizePhoneForMatch(value: string | undefined): string {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

export function samePhone(
  left: string | undefined,
  right: string | undefined,
): boolean {
  const l = normalizePhoneForMatch(left)
  const r = normalizePhoneForMatch(right)

  if (!l || !r) return false
  if (l === r) return true

  const ll = l.slice(-10)
  const rr = r.slice(-10)

  return ll.length >= 7 && ll === rr
}
```

## `base.contact` adapter örneği

```tsx
import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useBaseContactCollection } from '@/collections/base-contact.collection'

export function useBaseContactCustomerAdapter(): CustomerAdapter {
  const contacts = useBaseContactCollection()
  const navigate = useNavigate()

  const findByPhone = useCallback(
    async (phone: string) => {
      const normalized = normalizePhoneForMatch(phone)
      if (!normalized) return []

      const rows = await contacts.list({
        columns: ['id', 'name', 'email', 'mobile'],
        filters: {
          combinator: 'or',
          rules: [
            { field: 'mobile', operator: 'eq', value: phone },
            { field: 'mobile', operator: 'eq', value: normalized },
            { field: 'mobile', operator: 'eq', value: `+${normalized}` },
            { field: 'mobile', operator: 'like', value: normalized.slice(-10) },
          ],
        },
        limit: 10,
      })

      return rows
        .filter((row) => row.id)
        .map((row) => ({
          kind: 'contact',
          id: row.id!,
          label: row.name ?? row.email ?? row.mobile ?? row.id!,
          phone: row.mobile,
          email: row.email,
          sourceAppSlug: 'base',
          sourceDataSourceSlug: 'contact',
        }))
    },
    [contacts],
  )

  return {
    findByPhone,
    async getById(id) {
      const row = await contacts.get(id, {
        columns: ['id', 'name', 'email', 'mobile'],
      })
      if (!row.id) return null

      return {
        kind: 'contact',
        id: row.id,
        label: row.name ?? row.email ?? row.mobile ?? row.id,
        phone: row.mobile,
        email: row.email,
        sourceAppSlug: 'base',
        sourceDataSourceSlug: 'contact',
      }
    },
    getDialablePhone(record) {
      if (!record || typeof record !== 'object') return null
      const value =
        (record as { mobile?: unknown; phone?: unknown }).mobile ??
        (record as { phone?: unknown }).phone

      return typeof value === 'string' && value.trim() ? value : null
    },
    openCustomerCard(match) {
      navigate({ to: '/contacts/$contactId', params: { contactId: match.id } })
    },
  }
}
```

## Ticket requester adapter notu

Ticket/support projelerinde adapter aynı kalır; sadece collection ve route değişir.

Örnek mapping:

```txt
requester.id -> CustomerMatch.id
requester.full_name -> CustomerMatch.label
requester.phone_number -> CustomerMatch.phone
requester.email -> CustomerMatch.email
app slug -> hedef ticket/support app slug
source data source -> requester/customer datasource slug
```

## Mirror/upsert kararı

Eğer call kaydını `base_callcenter.call.contact` relation ile bağlamak istiyorsan ama hedef proje `base.contact` kullanmıyorsa iki seçenek var:

1. Sadece `customer_phone_e164` ile geçmiş göster: en az schema değişikliği.
2. Hedef müşteri kaydını `base.contact` içine mirror/upsert et ve call.contact bağla: daha standart geçmiş.

Mirror/upsert kullanıcı onayı gerektirir.
