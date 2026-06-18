import { useCallback, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useBaseContactCollection } from '@/collections'
import type { BaseContactEntity } from '@/collections/base-contact.collection'
import { normalizePhoneForMatch } from '@/lib/webphone/phone'
import type { CustomerAdapter, CustomerMatch } from '@/lib/webphone/types'

const CONTACT_COLUMNS = ['id', 'name', 'email', 'mobile'] as Array<string>

function contactToMatch(row: BaseContactEntity): CustomerMatch {
  return {
    kind: 'contact',
    id: row.id!,
    label: row.name ?? row.email ?? row.mobile ?? row.id!,
    phone: row.mobile ?? undefined,
    email: row.email ?? undefined,
    sourceAppSlug: 'base',
    sourceDataSourceSlug: 'contact',
  }
}

/**
 * Maps the CRM's `base.contact` records into the webphone {@link CustomerAdapter}.
 * Matching is digit-based with a last-10 fallback; the customer card is the
 * existing `/contacts/$contactId` route. The target datasource is never mutated.
 */
export function useWebphoneCustomerAdapter(): CustomerAdapter {
  const contacts = useBaseContactCollection()
  const navigate = useNavigate()

  const findByPhone = useCallback(
    async (phone: string) => {
      const normalized = normalizePhoneForMatch(phone)
      if (!normalized) return []

      const rows = await contacts.list({
        columns: CONTACT_COLUMNS,
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

      return rows.filter((row) => row.id).map(contactToMatch)
    },
    [contacts],
  )

  return useMemo<CustomerAdapter>(
    () => ({
      findByPhone,
      async getById(id: string) {
        const row = await contacts.get(id, { columns: CONTACT_COLUMNS })
        return row.id ? contactToMatch(row) : null
      },
      getDialablePhone(record: unknown) {
        if (!record || typeof record !== 'object') return null
        const value =
          (record as { mobile?: unknown }).mobile ??
          (record as { phone?: unknown }).phone
        return typeof value === 'string' && value.trim() ? value : null
      },
      openCustomerCard(match: CustomerMatch) {
        navigate({
          to: '/contacts/$contactId',
          params: { contactId: match.id },
        })
      },
    }),
    [findByPhone, contacts, navigate],
  )
}
