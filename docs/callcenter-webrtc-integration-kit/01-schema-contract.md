# Schema Contract

Bu sözleşme, Callcenter WebRTC mini modülünün hedef projede çalışması için gereken minimum Docyrus datasource/field yapısını tanımlar.

## 1. Zorunlu datasource: müşteri kimliği

Öncelik sırası:

1. Hedef projedeki mevcut customer/contact/requester/client datasource’u kullan.
2. Eğer datasource telefon, ad ve id bilgisini sağlayabiliyorsa adapter yeterlidir.
3. Standartlaştırma gerekiyorsa `base.contact` ile mirror veya relation kur.
4. Yeni datasource yaratmak son seçenek olmalıdır.

### Minimum müşteri alanları

| Amaç       | Önerilen field                      | Tip           | Zorunlu mu? |
| ---------- | ----------------------------------- | ------------- | ----------- |
| Kayıt ID   | `id`                                | identity      | Evet        |
| Görünen ad | `name` / `title` / `full_name`      | text          | Evet        |
| Telefon    | `mobile` / `phone` / `phone_number` | phone/text    | Evet        |
| E-posta    | `email`                             | email/text    | Hayır       |
| Firma      | `organization` / `company`          | relation/text | Hayır       |
| Ünvan      | `job_title`                         | text          | Hayır       |

### Adapter çıktısı

Her hedef proje müşteri kaydını şu şekle map etmelidir:

```ts
type CustomerMatch = {
  kind: 'contact' | 'customer' | 'requester' | 'lead' | string
  id: string
  label: string
  phone?: string
  email?: string
  sourceAppSlug: string
  sourceDataSourceSlug: string
}
```

## 2. Zorunlu datasource: `base_callcenter.call`

Çağrı geçmişi ve canlı çağrı lifecycle için standart kayıt yeri.

### Minimum alanlar

| Field slug              | Tip      | Kullanım                          |
| ----------------------- | -------- | --------------------------------- |
| `id`                    | identity | UI/query key                      |
| `call_id`               | text     | SIP/app call correlation          |
| `provider_type`         | text     | Örn. `verimor-webrtc`             |
| `direction`             | select   | inbound/outbound                  |
| `call_type`             | select   | manual/campaign/callback/transfer |
| `agent_profile`         | relation | agent telefon profili             |
| `contact`               | relation | standart müşteri ilişkisi         |
| `lead`                  | relation | opsiyonel lead ilişkisi           |
| `customer_phone_e164`   | phone    | normalize numara                  |
| `state`                 | status   | ringing/answered/ended/missed     |
| `outcome`               | select   | completed/no_answer vb.           |
| `started_at`            | datetime | çağrı başlangıcı                  |
| `ringing_at`            | datetime | çalma zamanı                      |
| `answered_at`           | datetime | cevap zamanı                      |
| `ended_at`              | datetime | bitiş zamanı                      |
| `duration_seconds`      | number   | toplam süre                       |
| `talk_duration_seconds` | number   | konuşma süresi                    |
| `device_type`           | select   | webrtc                            |
| `is_missed`             | boolean  | kaçan çağrı                       |
| `recording_url`         | url      | opsiyonel kayıt linki             |
| `recording_status`      | status   | opsiyonel kayıt durumu            |

### Minimum enum slug/name seti

Enum ID hardcode edilmemelidir. Bu slug/name değerleri tenant üzerinde resolve edilmelidir.

#### `direction`

- `inbound` / Inbound
- `outbound` / Outbound

#### `state`

- `ringing` / Ringing
- `answered` / Answered
- `ended` / Ended
- `missed` / Missed
- `held` / Held
- `transferred` / Transferred

#### `call_type`

- `manual` / Manual
- `campaign` / Campaign
- `callback` / Callback
- `transfer` / Transfer

#### `device_type`

- `webrtc` / WebRTC
- `hardphone` / Hardphone
- `click_to_call` / Click-to-Call

## 3. Zorunlu datasource: `base_callcenter.agent_telephony_profile`

Agent’ın WebRTC kullanabilmesi için gereken telefon profili.

### Minimum alanlar

| Field slug                | Tip        | Kullanım                                        |
| ------------------------- | ---------- | ----------------------------------------------- |
| `id`                      | identity   | profil ID                                       |
| `user`                    | userSelect | Docyrus kullanıcısı                             |
| `enabled`                 | boolean    | profil aktif mi                                 |
| `extension`               | text       | dahili                                          |
| `pbx_user_id`             | text       | SIP username; yoksa extension fallback olabilir |
| `sip_password`            | text       | SIP password                                    |
| `display_name`            | text       | SIP display name                                |
| `preferred_device`        | select     | WebRTC/WebPhone seçimi                          |
| `webrtc_enabled`          | boolean    | WebRTC yetkisi                                  |
| `current_state`           | status     | available/offline vb.                           |
| `phone_settings_saved_at` | datetime   | ayar güncelliği                                 |

## 4. Opsiyonel datasource: `base_callcenter.call_event`

İlk faz için şart değil. Debug/audit/event stream için kullanılır.

Minimum alanlar:

- `call_id`
- `event_id`
- `provider_type`
- `event_type`
- `event_data`
- `direction`
- `agent_profile`
- `customer_phone`
- `state`
- `event_timestamp`
- `received_at`
- `processed`

## 5. Tam modül için zorunlu datasource: `base_callcenter.call_activity`

Wrap-up/disposition kaydını kalıcılaştırmak için kullanılır. Sadece arama geçmişi istenirse `call` yeterli olabilir; fakat bu entegrasyon kitinin tam senaryosunda wrap-up olduğu için `call_activity` zorunludur.

Minimum alanlar:

- `call`
- `contact`
- `lead`
- `phone_number`
- `direction`
- `outcome`
- `disposition`
- `disposition_notes`
- `disposition_at`
- `disposition_by`
- `followup_required`
- `created_callback`
- `recording_url`
- `recording_available`

## 6. Tam modül için zorunlu datasource: `base_callcenter.call_screen_note`

Müşteri kartındaki kalıcı/pinned görüşme notları için kullanılır. Hedef projede ayrı bir müşteri not sistemi varsa adapter yazılabilir; fakat tam kit davranışı için bu fonksiyonun karşılığı sağlanmalıdır.

Minimum alanlar:

- `note_text`
- `contact`
- `lead`
- `callback`
- `source_call`
- `created_on`
- `created_by`

## 7. Hedef projeye göre mapping kararları

### CRM ise

- Mevcut contact/customer datasource’unu adapter ile kullan.
- Eğer zaten `base.contact` kullanılıyorsa direkt `contact` relation kur.
- Lead akışı varsa `base_crm.leads` opsiyonel olarak eklenir.

### Ticket/support paneli ise

- Ticket requester/customer datasource’unu adapter ile kullan.
- Arama kaydı standart `base_callcenter.call` içinde tutulur.
- Ticket kartına çağrı geçmişi paneli eklenebilir.
- Gerekirse requester → `base.contact` mirror/upsert yapılır.

### Özel müşteri datasource’u varsa

- Datasource değiştirilmez.
- `CustomerAdapter` ile phone/name/id okunur.
- Call relation için iki seçenekten biri seçilir:
  1. `base.contact` mirror ilişki
  2. call kaydında `customer_phone_e164` üzerinden history fallback

## 8. Schema mutasyon güvenliği

- Eksik datasource/field varsa önce plan çıkar.
- Tenant schema değişikliği kullanıcı onayı olmadan yapılmaz.
- Yeni field eklemek gerekiyorsa mevcut field slug’larıyla çakışma kontrol edilir.
- Enum seçenekleri varsa tekrar oluşturulmaz; mevcut seçenek resolve edilir.
