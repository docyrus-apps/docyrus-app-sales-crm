import { describe, expect, it } from 'vitest'

import { buildImportFileName, isTenantStorageToken } from './import-file-upload'

function tokenWithPayload(payload: Record<string, unknown>): string {
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `header.${body}.signature`
}

describe('buildImportFileName', () => {
  it('slugifies the base and keeps the extension lowercase', () => {
    expect(buildImportFileName('Lead List 2026.XLSX')).toBe(
      'lead-list-2026.xlsx'
    )
  })

  it('strips diacritics so the name survives a storage path', () => {
    expect(buildImportFileName('Müşteri Şirketleri.csv')).toBe(
      'musteri-sirketleri.csv'
    )
  })

  it('falls back to a usable name when nothing slugifiable is left', () => {
    expect(buildImportFileName('%%%.xlsx')).toBe('import.xlsx')
  })

  it('keeps a name that has no extension', () => {
    expect(buildImportFileName('organizations')).toBe('organizations')
  })
})

describe('isTenantStorageToken', () => {
  it('accepts a session token from the host shell', () => {
    expect(isTenantStorageToken(tokenWithPayload({ sub: 'user-1' }))).toBe(true)
  })

  it('rejects an OAuth2 API token, which storage cannot authorize', () => {
    expect(
      isTenantStorageToken(
        tokenWithPayload({ sub: 'user-1', cid: 'client-1', tid: 'tenant-1' })
      )
    ).toBe(false)
  })

  it('rejects a missing or unreadable token', () => {
    expect(isTenantStorageToken(null)).toBe(false)
    expect(isTenantStorageToken('')).toBe(false)
    expect(isTenantStorageToken('not-a-jwt')).toBe(false)
  })
})
