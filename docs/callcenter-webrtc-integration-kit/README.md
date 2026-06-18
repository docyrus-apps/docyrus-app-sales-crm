# Callcenter WebRTC Mini Module Integration Kit

Bu klasör, çalışan Callcenter WebRTC yapısını başka Docyrus-backed CRM, ticket/support paneli veya müşteri yönetimi projelerine **en az riskle** eklemek için hazırlanmış AI-agent entegrasyon kitidir.

Hedef: Projeye tüm çağrı merkezi ürününü taşımadan şu minimum yetenekleri eklemek:

- WebRTC ile gelen çağrıyı yakalama
- WebRTC ile dış arama başlatma
- Telefon numarasından müşteri/kontak eşleştirme
- Çağrı geldiğinde müşteri kartı / kayıt paneli açma
- Çağrı kaydını `base_callcenter.call` içinde tutma
- Çağrı sonrası wrap-up/disposition kaydını `base_callcenter.call_activity` içinde tutma
- Görüşme sırasında yazılan live note'u wrap-up notuna taşıma
- Müşteri kartında kalıcı/pinned notları `base_callcenter.call_screen_note` ile yönetme
- Müşteri kartında arama geçmişini gösterme
- Agent telefon profilini ve WebRTC ayarlarını kontrol etme

## Bu kiti kullanan AI agent için çalışma sırası

1. `00-agent-prompt.md` dosyasını oku ve talimatları görev bağlamına ekle.
2. `reference/schema-audit-cli.md` içindeki CLI kontrollerini çalıştır.
3. `01-schema-contract.md` ile mevcut datasource/field durumunu karşılaştır.
4. Müşteri datası için `reference/customer-adapter.example.md` sözleşmesine göre adapter tasarla.
5. WebRTC ayarlarını `02-runtime-settings.md` ile doğrula.
6. UI davranışlarını `03-ui-behavior-contract.md` ile birebir uygula.
7. Wrap-up ve not davranışlarını `07-wrapup-notes-contract.md` ile uygula.
8. Implementasyon sırasında `04-implementation-playbook.md` adımlarından sapma.
9. Bitti saymadan önce `05-verification-checklist.md` listesini tamamla.
10. Riskli bir fark varsa `06-risk-controls.md` içindeki fallback kararlarını kullan.

## En önemli mimari karar

Çağrı kayıtları mümkün olduğunca standart `base_callcenter.call` datasource’una yazılmalıdır. Hedef projede müşteri datası `contact`, `customer`, `requester`, `client`, `account_person` vb. farklı adlarda olabilir; bu fark **adapter** ile çözülmelidir.

Önerilen standart bağ:

```txt
Target customer/requester/client record
        ↓ adapter / mirror / mapping
base.contact compatible identity
        ↓ relation
base_callcenter.call.contact
```

## Bu kit neyi yapmaz?

- Mevcut müşteri datasource’unu izinsiz bozmaz.
- Enum ID hardcode ettirmez.
- Campaign, callback, complaint, SLA, supervisor raporlarını ilk faza zorunlu tutmaz.
- Provider-agnostic telephony refactor gerektirmez; temel hedef mevcut çalışan Verimor WebRTC mantığıdır.

## Referans alınan mevcut çalışma noktaları

Bu proje içinde incelenen ana dosyalar:

- `src/features/callcenter/agent/use-sip-lab-client.ts`
- `src/features/callcenter/agent/sip-lab.types.ts`
- `src/features/callcenter/agent/callcenter-session-provider.tsx`
- `src/features/callcenter/agent/callcenter-session-provider.helpers.ts`
- `src/features/callcenter/agent/use-screen-pop.ts`
- `src/features/callcenter/agent/use-outbound-dialer.ts`
- `src/features/callcenter/agent/use-agent-call-log.ts`
- `src/features/callcenter/agent/use-wrapup-lock.ts`
- `src/features/callcenter/agent/phone-widget.tsx`
- `src/features/callcenter/core/verimor-webrtc-runtime.ts`
- `src/features/callcenter/admin/telephony-settings.types.ts`
- `src/collections/base_callcenter-call.collection.ts`
- `src/collections/base_callcenter-agent_telephony_profile.collection.ts`
- `src/collections/base_callcenter-call_activity.collection.ts`
- `src/collections/base_callcenter-call_screen_note.collection.ts`
- `src/collections/base-contact.collection.ts`

## Başarı kriteri

Bir hedef projede şu akış çalışıyorsa entegrasyon tamamdır:

1. Agent WebPhone/WebRTC profilini görür.
2. SIP registration başarılı olur.
3. Müşteri kartındaki telefon butonu çağrıyı başlatır.
4. Gelen çağrıda numara eşleşirse müşteri kartı açılır.
5. Çağrı başladığında `base_callcenter.call` kaydı oluşur.
6. Çağrı cevaplandı/bitti durumunda aynı kayıt güncellenir.
7. Çağrı sonrası wrap-up disposition ve not kaydedilir.
8. Müşteri kartında kalıcı not eklenebilir.
9. Müşteri kartında çağrı geçmişi görünür.
