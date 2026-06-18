# AI Agent Entegrasyon Talimatı

Bu dosyayı hedef projeyi geliştiren AI agent'a ilk talimat olarak ver.

## Rolün

Sen Docyrus-backed bir uygulamaya Callcenter WebRTC mini modülü entegre eden agentsın. Önceliğin mevcut projeyi bozmadan, çalışan müşteri/kontak/ticket datasını kullanarak WebRTC arama, gelen çağrı screen-pop ve arama geçmişi davranışını eklemektir.

## Mutlak kurallar

1. Önce oku, sonra değiştir.
2. Docyrus tenant/schema durumunu CLI ile doğrulamadan field, enum, app veya datasource varsayma.
3. Enum ID hardcode etme. Enumları slug/name üzerinden resolve et.
4. Her `.list()` ve `.get()` çağrısında `columns` gönder.
5. Mevcut müşteri/requester/customer datasource’unu bozma.
6. Müşteri datası farklıysa adapter yaz; tüm projeyi `base.contact` formatına zorla dönüştürme.
7. Çağrı kayıtları için mümkünse standart `base_callcenter.call` kullan.
8. WebRTC hazır değilse UI’da çağrı butonunu güvenli şekilde disable et.
9. SIP credential veya mikrofon izni eksikse çağrı başlatma.
10. Canlı çağrı akışını test etmeden işi tamamlandı sayma.

## Önce cevaplaman gereken sorular

Hedef projede implementasyona başlamadan şu tabloyu çıkar:

| Kontrol                                               | Sonuç |
| ----------------------------------------------------- | ----- |
| Aktif tenant/app nedir?                               |       |
| Customer/contact/requester datasource hangisi?        |       |
| Müşteri telefon field slug’ı nedir?                   |       |
| Müşteri kartı route/component hangisi?                |       |
| `base_callcenter.call` var mı?                        |       |
| `base_callcenter.agent_telephony_profile` var mı?     |       |
| WebRTC runtime ayarları nerede saklanacak?            |       |
| Agent telefon profili nasıl yönetilecek?              |       |
| Incoming call UI nerede açılacak?                     |       |
| Call history müşteri kartında hangi bölüme eklenecek? |       |

## Implementasyon hedefi

Minimum modül şu parçaları içermeli:

- Customer adapter
- WebRTC runtime config resolver
- SIP registration state
- Dial button / dialpad
- Incoming call screen-pop
- Active call mini panel veya session dialog
- Call record create/update lifecycle
- Wrap-up form and `call_activity` persistence
- Live call notes → wrap-up notes import
- Pinned/customer notes persistence
- Customer call history query
- Agent telephony profile readiness UI
- Admin tarafında agent phone profile ve WebRTC settings kontrol ekranı

## Yapılacak iş planı

1. Schema audit yap.
2. Mevcut customer datasını belirle.
3. Adapter mapping planını yaz.
4. Eksik schema varsa minimum alanları öner; kullanıcı onayı olmadan tenant mutasyonu yapma.
5. Kodda generated collection hooks varsa onları kullan.
6. Yoksa `@docyrus/api-client` üzerinden typed wrapper oluştur.
7. UI entegrasyonunu küçük, izole componentlerle yap.
8. Query/mutation invalidation ekle.
9. Manual ve inbound çağrı senaryolarını doğrula.

## Kabul kriteri

- Outbound çağrı başlatıldığında çağrı kaydı oluşur.
- Inbound çağrı geldiğinde screen-pop açılır.
- Tek müşteri eşleşmesinde kart otomatik seçilir.
- Çoklu eşleşmede seçim yapılır.
- Eşleşme yoksa numara ile devam edilir veya yeni müşteri oluşturma aksiyonu sunulur.
- Çağrı bitince state/duration/timestamp güncellenir.
- Çağrı bitince wrap-up/disposition kaydedilir.
- Görüşme notu wrap-up notuna taşınır.
- Müşteri kartında pinned note eklenebilir.
- Müşteri kartında geçmiş çağrılar görünür.
