# Risk Controls

Bu dosya entegrasyon sırasında çıkabilecek riskleri ve zorunlu önlemleri tanımlar.

## Risk 1: Hedef projede müşteri datasource’u farklı

Belirti:

- CRM değil, ticket/support paneli.
- Customer yerine requester/client/account/person gibi kayıt var.

Önlem:

- Mevcut datasource’u değiştirme.
- Customer adapter yaz.
- Call history relation çalışmıyorsa phone fallback query kullan.
- Standart `base.contact` mirror/upsert gerekiyorsa kullanıcı onayı al.

## Risk 2: Telefon alanı normalize değil

Belirti:

- Telefonlar `0544...`, `+90...`, boşluklu veya dahili formatta.

Önlem:

- Eşlemede sadece raw equality kullanma.
- Normalize digit matching kullan.
- Son 10 veya son 7 digit fallback uygula.
- Arama başlatırken E.164-benzeri `+digits` storage formatı kullan.

## Risk 3: Enum ID tenant’a göre değişiyor

Belirti:

- Hardcoded enum ID başka tenant’ta çalışmıyor.

Önlem:

- Enum resolver kullan.
- Slug/name üzerinden `inbound`, `outbound`, `ringing`, `answered`, `ended`, `missed`, `manual`, `webrtc` resolve et.
- Resolve edilemeyen enum varsa schema audit sonucunda kullanıcıya eksik olarak raporla.

## Risk 4: SIP credential eksik

Belirti:

- WebRTC register olmuyor.
- Kullanıcı çağrı başlatamıyor.

Önlem:

- `extension`, `pbx_user_id`, `sip_password`, `webrtc_enabled`, `preferred_device` kontrolünü tek readiness fonksiyonunda yap.
- Eksikse çağrı butonu disabled.
- Kullanıcıya telefon bilgilerinin eksik olduğunu söyle; teknik SIP detaylarını gösterme.

## Risk 5: Mikrofon veya HTTPS problemi

Belirti:

- Browser `getUserMedia` hata veriyor.
- WebRTC local dışında HTTP’de çalışmıyor.

Önlem:

- HTTPS/localhost kontrolü yap.
- Mikrofon iznini registration öncesi veya call öncesi doğrula.
- Permission denied durumunda tekrar izin yönlendirmesi göster.

## Risk 6: Call record create/update başarısız

Belirti:

- Schema farkı, enum eksikliği veya yetki sorunu nedeniyle backend hata döner.

Önlem:

- Çağrı UI akışını backend hatasına tamamen bağlama.
- Hata olduğunda çağrı devam edebilsin ama kullanıcıya sade uyarı verilsin.
- Teknik hata sadece error tracking/log içinde kalsın.
- Eksik field varsa audit sonucu olarak raporla.

## Risk 7: Aynı çağrı için birden fazla kayıt oluşuyor

Belirti:

- WebRTC snapshot eventleri tekrar geliyor.
- Incoming/outgoing eventler aynı call için ayrı kayıt açıyor.

Önlem:

- `call_id` correlation key olarak kullan.
- Existing call record map/cache tut.
- Create sadece ilk event’te; sonraki event’lerde update.
- Outbound WebRTC session’da app call ID korunmalı.

## Risk 8: Müşteri relation yanlış overwrite ediliyor

Belirti:

- Call zaten contact/lead bağlıyken screen-pop başka kayda patch ediyor.

Önlem:

- Relation sadece boşsa otomatik patch edilir.
- Çoklu eşleşmede kullanıcı seçimi beklenir.
- Seçim sonrası patch yapılır.

## Risk 9: Provider-specific varsayımlar

Belirti:

- Hedef proje Verimor dışında provider kullanmak istiyor.

Önlem:

- Bu kit Verimor WebRTC defaults ile gelir.
- Provider değişecekse runtime settings ve SIP header parsing ayrı provider adapter’a alınmalıdır.
- İlk fazda provider-agnostic refactor zorunlu değildir.

## Risk 10: UI son kullanıcı yerine geliştirici diliyle konuşuyor

Belirti:

- “Datasource hazır”, “Mock mode”, “Enum resolve failed” gibi metinler görünür.

Önlem:

- Son kullanıcı UI’ında sadece iş dili kullan.
- Teknik detaylar admin/debug alanında kalsın.
- Empty state: “Henüz arama yok” gibi sade olmalı.

## Güvenli fallback karar ağacı

```txt
WebRTC hazır mı?
  Hayır → Call button disabled, telefon ayarları eksik mesajı
  Evet → Arama aksiyonunu aç

Müşteri eşleşti mi?
  1 kayıt → kartı aç, call.contact patch et
  Çok kayıt → seçim göster
  Yok → unknown caller, phone-only history

Call datasource yazılabiliyor mu?
  Evet → standard history
  Hayır → UI-only session + audit raporu; kalıcı geçmiş tamamlandı sayılmaz

Enum resolve oldu mu?
  Evet → create/update
  Hayır → schema eksik raporu; hardcode yapma
```
