# WebRTC Runtime Settings

Bu dosya, browser WebRTC/SIP çağrı yapısının çalışması için gereken ayarları tanımlar.

## Runtime hedefi

Mevcut çalışan varsayılan model Verimor/WebPhone uyumludur. Hedef projede provider değiştirilmediği sürece bu runtime korunmalıdır.

## Zorunlu runtime ayarları

| Ayar                         | Açıklama                      | Örnek / mevcut varsayılan                        |
| ---------------------------- | ----------------------------- | ------------------------------------------------ |
| `websocketUrl` / `wssUrl`    | SIP WebSocket endpoint        | `wss://api.bulutsantralim.com:7443`              |
| `pbxHost`                    | SIP/PBX domain                | `kivateknoloji.bulutsantralim.com`               |
| `realm`                      | SIP realm                     | `kivateknoloji.bulutsantralim.com`               |
| `registrarServer`            | opsiyonel registrar host      | boş olabilir                                     |
| `usePreloadedRoute`          | Verimor route davranışı       | `true`                                           |
| `registerExpires`            | SIP register expiry           | `600`                                            |
| `noAnswerTimeout`            | cevapsız çağrı süresi         | `60`                                             |
| `sessionTimers`              | SIP session timer             | `false`                                          |
| `sessionTimersRefreshMethod` | `UPDATE` veya `INVITE`        | `UPDATE`                                         |
| `sessionTimersExpires`       | session timer expiry          | `90`                                             |
| `iceServersJson`             | ICE/STUN config               | `[ { "urls": "stun:stun.l.google.com:19302" } ]` |
| `extraRegisterHeaders`       | opsiyonel SIP register header | boş                                              |
| `extraInviteHeaders`         | opsiyonel SIP invite header   | boş                                              |
| `preferredAudioCodecs`       | codec sırası                  | `PCMU,PCMA`                                      |

## Agent profilinden gelen ayarlar

| Kaynak field                               | Kullanım                   |
| ------------------------------------------ | -------------------------- |
| `agent_telephony_profile.extension`        | dahili / fallback username |
| `agent_telephony_profile.pbx_user_id`      | SIP username               |
| `agent_telephony_profile.sip_password`     | SIP password               |
| `agent_telephony_profile.display_name`     | SIP display name           |
| `agent_telephony_profile.webrtc_enabled`   | WebRTC kullanılabilir mi   |
| `agent_telephony_profile.preferred_device` | WebPhone/WebRTC seçili mi  |

SIP username çözümü:

```txt
username = pbx_user_id varsa pbx_user_id, yoksa extension
```

## WebRTC hazır olma koşulu

Aşağıdaki koşullar sağlanmadan çağrı başlatma butonu aktif olmamalıdır:

- Authenticated Docyrus client var.
- Agent profile var ve `enabled !== false`.
- `webrtc_enabled !== false`.
- Preferred device WebRTC/WebPhone olarak çözülüyor.
- `extension` dolu.
- `pbx_user_id` veya `extension` ile username üretilebiliyor.
- `sip_password` dolu.
- `websocketUrl`, `pbxHost`, `realm`, `iceServersJson` geçerli.
- Browser HTTPS veya localhost üzerinde çalışıyor.
- Mikrofon izni alınabiliyor.
- SIP registration status `registered`.

## SIP registration akışı

1. Runtime config ve agent profile okunur.
2. Config validate edilir.
3. Mikrofon izni istenir.
4. JsSIP UA oluşturulur.
5. WebSocket interface bağlanır.
6. `register()` çağrılır.
7. Status `registered` olunca outbound dial aktif olur.
8. `newRTCSession` ile incoming/outgoing session snapshot üretilir.

## Session state modeli

Minimum session snapshot:

```ts
type WebrtcSessionSnapshot = {
  id: string
  providerCallUuid?: string
  direction: 'incoming' | 'outgoing'
  remoteUri: string
  remoteDisplayName?: string
  state: 'ringing' | 'dialing' | 'active'
  startedAt: string
  answeredAt?: string
  isMuted: boolean
  isOnHold: boolean
}
```

## Çağrı lifecycle → call kaydı mapping

| SIP/WebRTC event             | `base_callcenter.call.state` | Timestamp                    |
| ---------------------------- | ---------------------------- | ---------------------------- |
| incoming ringing             | `ringing`                    | `ringing_at`, `started_at`   |
| outbound dialing/ringing     | `ringing`                    | `ringing_at`, `started_at`   |
| answered/accepted            | `answered`                   | `answered_at`                |
| ended after answer           | `ended`                      | `ended_at`                   |
| incoming ended before answer | `missed`                     | `ended_at`, `is_missed=true` |
| rejected                     | `ended` veya `missed`        | `ended_at`                   |

## Browser ve ortam gereksinimleri

- Production’da HTTPS zorunludur.
- Localhost geliştirme istisnadır.
- Mikrofon izni olmadan WebRTC çağrı başlatılmamalıdır.
- Safari/Firefox farkları test edilmelidir; ana hedef Chrome/Chromium olmalıdır.
- WSS endpoint CORS/proxy değil, doğrudan SIP WebSocket endpoint olmalıdır.

## Saklama yeri

Hedef projede runtime ayarları için önerilen sıra:

1. Mevcut app config sistemi varsa onu kullan.
2. Docyrus app config yoksa küçük bir app-level config wrapper ekle.
3. Ayarlar `.env` içinde tutulacaksa sadece non-secret runtime endpointleri konulmalı.
4. SIP kullanıcı şifreleri `.env` veya frontend static config içinde tutulmamalı; agent profile’dan gelmeli.

## Güvenlik notları

- `sip_password` UI’da maskelenmelidir.
- Secret değerler loglanmamalıdır.
- SIP trace/debug sadece admin veya geliştirme modunda gösterilmelidir.
- Incoming INVITE header’ları kullanıcı UI’ında ham şekilde basılmamalıdır.
