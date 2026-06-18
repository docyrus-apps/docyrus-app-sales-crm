# UI Behavior Contract

Bu dosya, Callcenter WebRTC mini modülünün hedef projede nasıl davranması gerektiğini tanımlar.

## Zorunlu ekran/parça listesi

### 1. Agent WebPhone durumu

Kullanıcı şunları görebilmeli:

- Telefon profili hazır mı?
- WebPhone/WebRTC seçili mi?
- SIP registration durumu nedir?
- Mikrofon izni var mı?
- Arama başlatılabilir mi?

Minimum durumlar:

- Hazır
- Bağlanıyor
- Kayıtlı
- Offline
- Eksik ayar
- Mikrofon izni yok

### 2. Dial button / Dialpad

Müşteri kartında veya üst bar içinde çağrı başlatma alanı olmalı.

Davranış:

1. Telefon normalize edilir.
2. `canDial=false` ise buton disable olur.
3. Butona basınca outbound WebRTC çağrı başlar.
4. `base_callcenter.call` içinde ringing state ile kayıt oluşturulur.
5. Active call panel açılır.

### 3. Incoming call screen-pop

Gelen çağrıda otomatik görünür.

Davranış:

1. Incoming SIP session yakalanır.
2. Remote URI/display name içinden telefon çıkarılır.
3. Customer adapter ile eşleşme aranır.
4. Tek eşleşme varsa kayıt otomatik seçilir.
5. Çok eşleşme varsa seçim listesi gösterilir.
6. Eşleşme yoksa numara ile devam edilir.
7. Kullanıcı Answer/Reject aksiyonlarını görür.
8. Cevaplanınca active call panel açılır.

### 4. Customer card / record panel

Hedef projeye göre şu alanlardan biri açılmalıdır:

- CRM contact detail sheet/page
- Ticket requester/customer panel
- Account/person detail panel
- Yeni contact oluşturma ekranı

Minimum gösterilecek alanlar:

- Ad
- Telefon
- Email
- Firma/organizasyon
- Son çağrılar

### 5. Active call panel

Minimum aksiyonlar:

- Hang up
- Mute/unmute
- Hold/resume
- DTMF keypad
- Müşteri kartına git

Tam kitte ayrıca bulunmalı:

- Live notes
- Wrap-up form
- Recording link, varsa

Opsiyonel gelişmiş aksiyonlar:

- Transfer
- Conference

### 6. Call history panel

Müşteri kartında veya ilgili kayıt detayında görünmelidir.

Minimum kolonlar:

- Direction
- State/outcome
- Started at
- Answered at
- Ended at
- Duration
- Agent
- Recording link, varsa

## Outbound senaryo

```txt
User clicks Call
  ↓
Normalize phone
  ↓
Check WebRTC readiness
  ↓
Create call record: state=ringing, direction=outbound, device_type=webrtc
  ↓
JsSIP UA call(target)
  ↓
Session active when accepted
  ↓
Update call record: state=answered, answered_at
  ↓
Call ended
  ↓
Update call record: state=ended, ended_at, duration_seconds
  ↓
Invalidate customer call history query
```

## Inbound senaryo

```txt
SIP newRTCSession incoming
  ↓
Extract caller phone
  ↓
Create/update call record: state=ringing, direction=inbound
  ↓
Customer adapter findByPhone(phone)
  ↓
0 match: show unknown caller panel
1 match: open customer card automatically
N match: show match picker
  ↓
Agent answers or rejects
  ↓
If answered: update call state=answered
If missed/rejected: update call state=missed/ended
  ↓
On ended: update ended_at/duration
```

## Çoklu eşleşme davranışı

- İlk eşleşme otomatik seçilebilir ama UI’da değiştirilebilir olmalı.
- Çağrı kaydı, kullanıcı seçim yaptıktan sonra relation ile patch edilmelidir.
- Eğer çağrı kaydında zaten `contact` veya `lead` varsa otomatik overwrite yapılmamalıdır.

## Eşleşme yok davranışı

Minimum güvenli seçenek:

- Numara ile çağrı devam eder.
- Call history phone fallback ile görünür.

İyi seçenek:

- “Yeni müşteri oluştur” aksiyonu sunulur.
- Oluşturulan müşteri ID’si call kaydına patch edilir.

## UI yerleşim önerileri

### CRM projesi

- Header’da küçük WebPhone durumu + dialpad
- Contact detail içinde Call button
- Contact detail içinde Call History sekmesi
- Incoming call için right sheet veya modal

### Ticket/support projesi

- Ticket detail içinde Requester phone yanında Call button
- Requester/customer panel içinde Call History
- Incoming call geldiğinde requester paneli veya ticket arama/oluşturma paneli

## Query invalidation kuralları

Şu aksiyonlardan sonra ilgili query’ler invalidate edilmelidir:

- Call create
- Call update state/timestamps
- Customer relation patch
- New customer create
- Recording URL update

Önerilen query key parçaları:

```txt
['callcenter', 'calls']
['callcenter', 'customer-call-history', customerId]
['contact', contactId]
['ticket', ticketId]
```

## Kullanıcıya gösterilmemesi gerekenler

- SIP raw trace
- Provider debug headerları
- Enum ID’leri
- Datasource teknik açıklamaları
- “Mock/real backend” gibi geliştirici notları

Bunlar sadece admin/debug ekranında ve yetkili kullanıcıya gösterilmelidir.
