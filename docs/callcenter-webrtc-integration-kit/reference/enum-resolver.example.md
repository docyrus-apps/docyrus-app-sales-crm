# Enum Resolver Example

Callcenter WebRTC entegrasyonunda enum ID hardcode edilmemelidir. Bu örnek slug/name tabanlı resolver yaklaşımını gösterir.

## Resolver contract

```ts
type EnumOption = {
  id: string
  name?: string
  slug?: string
}

export type ResolveEnum = (
  dataSourceSlug: string,
  fieldSlug: string,
  token: string | undefined,
) => string | undefined
```

## Basit resolver örneği

```ts
function normalizeToken(value: string | undefined): string {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_') ?? ''
  )
}

export function createEnumResolver(
  catalog: Record<string, Record<string, EnumOption[]>>,
) {
  return function resolveEnum(
    dataSourceSlug: string,
    fieldSlug: string,
    token: string | undefined,
  ) {
    const expected = normalizeToken(token)
    if (!expected) return undefined

    const options = catalog[dataSourceSlug]?.[fieldSlug] ?? []

    const found = options.find((option) => {
      const slug = normalizeToken(option.slug)
      const name = normalizeToken(option.name)
      const id = normalizeToken(option.id)

      return slug === expected || name === expected || id === expected
    })

    return found?.id
  }
}
```

## Resolve edilmesi gereken call enumları

```txt
call.direction: inbound, outbound
call.state: ringing, answered, ended, missed, held, transferred
call.call_type: manual, campaign, callback, transfer
call.device_type: webrtc, hardphone, click_to_call
call.outcome: completed, no_answer
```

## Failure davranışı

Resolver `undefined` döndürürse:

- Hardcode fallback yapma.
- Call create/update yapmadan önce schema eksik raporu üret.
- UI’da son kullanıcıya teknik enum mesajı gösterme.
- Admin/developer log’da hangi field/token eksik yaz.

## CLI ile enum audit

```bash
docyrus ds get base_callcenter call --json
# field id'leri bul

docyrus studio list-enums \
  --app-id <base_callcenter_app_id> \
  --data-source-id <call_data_source_id> \
  --field-id <field_id> \
  --json
```
