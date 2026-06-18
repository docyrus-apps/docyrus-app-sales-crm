# Verification Checklist

Bu liste tamamlanmadan Callcenter WebRTC mini modülü tamamlandı sayılmamalıdır.

## 1. Schema doğrulama

- [ ] Aktif tenant ve environment CLI ile doğrulandı.
- [ ] Hedef customer/contact/requester datasource belirlendi.
- [ ] Telefon field slug’ı doğrulandı.
- [ ] `base_callcenter.call` datasource varlığı doğrulandı.
- [ ] `base_callcenter.agent_telephony_profile` datasource varlığı doğrulandı.
- [ ] Gerekli call field’ları doğrulandı.
- [ ] Enum seçenekleri slug/name ile resolve ediliyor.
- [ ] Hiçbir enum ID hardcode edilmedi.

## 2. Agent profile doğrulama

- [ ] Current user için agent telephony profile bulunuyor.
- [ ] `enabled` false değil.
- [ ] `webrtc_enabled` false değil.
- [ ] `extension` dolu.
- [ ] `pbx_user_id` veya extension ile username üretilebiliyor.
- [ ] `sip_password` dolu.
- [ ] Preferred device WebRTC/WebPhone olarak çözülüyor.

## 3. Runtime config doğrulama

- [ ] WSS URL geçerli `ws://` veya `wss://` URL.
- [ ] PBX host dolu.
- [ ] Realm dolu.
- [ ] ICE JSON parse ediliyor.
- [ ] Preferred audio codec listesi boş değil.
- [ ] HTTPS/localhost koşulu sağlanıyor.
- [ ] Mikrofon izni akışı test edildi.

## 4. Outbound çağrı testi

- [ ] Müşteri kartındaki telefon normalize ediliyor.
- [ ] WebRTC registered değilken çağrı butonu disabled.
- [ ] WebRTC registered iken çağrı butonu enabled.
- [ ] Çağrı başlatınca `base_callcenter.call` kaydı oluşuyor.
- [ ] Oluşan kayıtta `direction=outbound`.
- [ ] Oluşan kayıtta `device_type=webrtc`.
- [ ] Oluşan kayıtta `contact` relation varsa set ediliyor.
- [ ] Çağrı cevaplanınca `answered_at` güncelleniyor.
- [ ] Çağrı bitince `ended_at` ve duration güncelleniyor.
- [ ] Müşteri call history paneli yenileniyor.

## 5. Inbound çağrı testi

- [ ] Incoming SIP session yakalanıyor.
- [ ] Arayan numara normalize ediliyor.
- [ ] Call kaydı `direction=inbound`, `state=ringing` ile oluşuyor.
- [ ] Tek müşteri eşleşmesinde kart/panel otomatik açılıyor.
- [ ] Çoklu eşleşmede seçim UI çıkıyor.
- [ ] Eşleşme yoksa unknown caller UI çıkıyor.
- [ ] Answer aksiyonu çağrıyı cevaplıyor.
- [ ] Reject aksiyonu çağrıyı reddediyor.
- [ ] Cevaplanan çağrı bitince state/duration güncelleniyor.
- [ ] Cevapsız çağrı `is_missed=true` olarak işaretleniyor.

## 6. Wrap-up ve not doğrulama

- [ ] Çağrı bitince wrap-up formu açılıyor.
- [ ] Live call notes wrap-up notes alanına otomatik taşınıyor.
- [ ] Disposition seçmeden submit engelleniyor.
- [ ] Contact/lead link gerekiyorsa submit öncesi uyarı veriliyor.
- [ ] Submit sonrası `base_callcenter.call_activity` create/update ediliyor.
- [ ] `disposition_notes` doğru kaydediliyor.
- [ ] `base_callcenter.call` outcome/state/relation alanları patch ediliyor.
- [ ] Callback seçildiyse follow-up/callback davranışı çalışıyor veya güvenli şekilde gizleniyor.
- [ ] Pinned note eklenebiliyor.
- [ ] Pinned note `note_text`, relation ve `source_call` ile kaydediliyor.
- [ ] Wrap-up persistence başarısızsa pending wrap-up kapanmıyor.

## 7. Call history doğrulama

- [ ] Customer relation üzerinden geçmiş çağrılar geliyor.
- [ ] Relation query başarısızsa phone fallback çalışıyor.
- [ ] Liste `columns` ile sorgulanıyor.
- [ ] Tarih sıralaması doğru.
- [ ] Empty state kullanıcı dostu.
- [ ] Kayıt linki varsa gösteriliyor.
- [ ] Wrap-up notes geçmiş kartlarında görünür veya detail içinde erişilebilir.

## 8. UI kalite kontrol

- [ ] Kullanıcıya teknik datasource/debug mesajı gösterilmiyor.
- [ ] SIP password maskeleniyor.
- [ ] Hata mesajları son kullanıcı diliyle yazıldı.
- [ ] Loading ve empty state var.
- [ ] Arama sırasında çift tıklama / çift call create engellendi.
- [ ] Active call varken yeni call başlatma engellendi.

## 9. Güvenlik ve dayanıklılık

- [ ] Secret değerler console log’a yazılmıyor.
- [ ] Raw SIP trace normal kullanıcıya gösterilmiyor.
- [ ] Call create/update hata verirse UI kilitlenmiyor.
- [ ] Network kopması durumunda registration state güncelleniyor.
- [ ] Browser refresh sonrası güvenli idle/restore davranışı var.

## 10. Kod kalite kontrol

- [ ] TypeScript build geçiyor.
- [ ] Lint/prettier geçiyor.
- [ ] Kritik helper’lar için test eklendi veya mevcut testler güncellendi.
- [ ] Query invalidation doğru.
- [ ] Kullanılmayan import/variable yok.

## 11. Son kabul senaryosu

- [ ] Bir müşteri kartından dış arama yapıldı.
- [ ] Çağrı bitince wrap-up girildi.
- [ ] Wrap-up notu ve disposition kaydedildi.
- [ ] Müşteri kartına pinned note eklendi.
- [ ] Çağrı geçmişe düştü.
- [ ] Gelen çağrıda aynı müşteri kartı açıldı.
- [ ] Cevapsız gelen çağrı geçmişte göründü.
- [ ] WebRTC ayarı eksik bir kullanıcıda UI güvenli şekilde disabled kaldı.
