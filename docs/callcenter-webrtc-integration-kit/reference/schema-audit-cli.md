# Schema Audit CLI Reference

Bu komutlar hedef projede hiçbir şey değiştirmeden mevcut Docyrus durumunu okumak için kullanılır.

## 1. Ortam ve kimlik

```bash
docyrus env which --json
docyrus auth who --json
docyrus auth tenant --json
```

## 2. App keşfi

```bash
docyrus apps list --json
```

Aşağıdaki app slug’ları özellikle aranır:

- `base`
- `base_callcenter`
- `base_crm`
- hedef proje app slug’ı

## 3. Standart contact schema

```bash
docyrus ds get base contact --json
```

Beklenen minimum field’lar:

- `id`
- `name`
- `mobile`
- `email`
- `organization`
- `job_title`

Örnek data kontrolü:

```bash
docyrus ds list base contact \
  --columns "id,name,mobile,email,organization(name)" \
  --limit 5 \
  --json
```

## 4. Callcenter call schema

```bash
docyrus ds get base_callcenter call --json
```

Örnek data kontrolü:

```bash
docyrus ds list base_callcenter call \
  --columns "id,call_id,contact(name),lead(name),customer_phone_e164,direction,state,started_at,duration_seconds" \
  --orderBy '{"field":"created_on","direction":"desc"}' \
  --limit 5 \
  --json
```

## 5. Agent telephony profile schema

```bash
docyrus ds get base_callcenter agent_telephony_profile --json
```

Örnek profil kontrolü:

```bash
docyrus ds list base_callcenter agent_telephony_profile \
  --columns "id,user(name),enabled,extension,pbx_user_id,preferred_device,webrtc_enabled,current_state,phone_settings_saved_at" \
  --limit 20 \
  --json
```

Not: `sip_password` hassas kabul edilmeli; listelerde maskelenmeden çekilmemelidir. Sadece readiness kontrolü için gerekirse dar kapsamlı ve güvenli şekilde kullanılmalıdır.

## 6. Wrap-up and notes schema

```bash
docyrus ds get base_callcenter call_activity --json
docyrus ds get base_callcenter call_screen_note --json
```

Örnek activity kontrolü:

```bash
docyrus ds list base_callcenter call_activity \
  --columns "id,call,contact(name),lead(name),phone_number,outcome,disposition,disposition_notes,disposition_at" \
  --orderBy '{"field":"created_on","direction":"desc"}' \
  --limit 5 \
  --json
```

Örnek pinned note kontrolü:

```bash
docyrus ds list base_callcenter call_screen_note \
  --columns "id,note_text,contact(name),lead(name),source_call,created_on,created_by" \
  --orderBy '{"field":"created_on","direction":"desc"}' \
  --limit 5 \
  --json
```

## 7. Enum kontrolü

CLI sürümüne göre enumlar `studio list-enums` ile field ID üzerinden okunabilir. Önce data source field ID’lerini `docyrus ds get` veya studio metadata ile bul.

Örnek:

```bash
docyrus studio list-enums \
  --app-id <base_callcenter_app_id> \
  --data-source-id <call_data_source_id> \
  --field-id <direction_field_id> \
  --json
```

Kontrol edilmesi gereken field’lar:

- `call.direction`
- `call.state`
- `call.call_type`
- `call.device_type`
- `call.outcome`
- `agent_telephony_profile.preferred_device`
- `agent_telephony_profile.current_state`
- `call_activity.direction`
- `call_activity.outcome`
- `call_activity.disposition`

## 8. Hedef proje customer datasource keşfi

Önce hedef app datasource’larını listele:

```bash
docyrus studio list-data-sources --app-slug <target_app_slug> --expand fields --json
```

Customer adaylarını ara:

- contact
- customer
- client
- requester
- person
- account_contact
- user/contact bridge

Telefon field adayları:

- `mobile`
- `phone`
- `phone_number`
- `telephone`
- `requester_phone`

## 9. Discover / API kontrolü

Generated collection yoksa OpenAPI kontrolü yap:

```bash
docyrus discover api --json
docyrus discover search data-sources --json
docyrus discover path /v1/apps/base_callcenter/data-sources/call/items --json
```

## 10. Audit çıktısı formatı

AI agent implementasyondan önce şu özet tabloyu üretmelidir:

```md
## Callcenter WebRTC Audit

- Environment: ...
- Tenant: ...
- Target app: ...
- Customer datasource: app_slug/data_source_slug
- Phone field: ...
- Customer card route/component: ...
- base_callcenter.call: found/missing
- agent_telephony_profile: found/missing
- WebRTC runtime config source: ...
- call_activity: found/missing
- call_screen_note: found/missing
- Missing schema: ...
- Required user approval before mutation: yes/no
```
