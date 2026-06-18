# Implementation Playbook

Bu playbook hedef projede AI agent'ın izleyeceği uygulama sırasıdır.

## A. Hazırlık

1. Repo yapısını incele.
2. Auth provider var mı kontrol et: `@docyrus/signin` tercih edilir.
3. Generated collections var mı kontrol et.
4. TanStack Query kullanımı ve query key düzenini öğren.
5. Mevcut customer/contact/ticket detail komponentini bul.
6. Mevcut app config/persisted settings yapısını bul.

## B. Schema audit

`reference/schema-audit-cli.md` içindeki komutları çalıştır.

Audit sonucunda üç karar ver:

1. Customer adapter hangi datasource’u kullanacak?
2. Call kayıtları `base_callcenter.call` içine yazılabiliyor mu?
3. Agent profile ve WebRTC ayarları hazır mı?

## C. Customer adapter ekle

Adapter hedef projedeki müşteri datasını bu operasyonlara çevirmelidir:

- `findByPhone(phone)`
- `getById(id)`
- `openRecord(match)` veya route callback
- `getDialablePhone(record)`
- `createFromPhone(phone)` opsiyonel

Adapter mevcut datasource’u değiştirmez.

## D. Enum resolver ekle/kullan

Kural:

```txt
field + slug/name -> enum id
```

Asla doğrudan enum ID yazma.

Resolve edilecek değerler:

- `direction`: inbound/outbound
- `state`: ringing/answered/ended/missed
- `call_type`: manual
- `device_type`: webrtc
- `outcome`: completed/no_answer, varsa

## E. WebRTC runtime resolver ekle

Runtime config şu kaynaklardan birleşmeli:

1. Uygulama config değerleri
2. Verimor WebRTC defaults
3. Agent profile username/password/displayName

Hazır olma kontrolü tek yerde toplanmalı.

## F. SIP client hook/component ekle

Mevcut projedeki kod yapısına göre:

- Eğer bu projedeki callcenter kodu taşınabiliyorsa `use-sip-lab-client` mantığını küçült.
- Sadece contract gerekiyorsa `reference/webrtc-runtime-contract.example.md` içindeki interface’i uygula.

Minimum hook çıktısı:

```ts
type WebrtcController = {
  registrationStatus:
    | 'idle'
    | 'registering'
    | 'registered'
    | 'failed'
    | 'unregistered'
  microphoneStatus: 'idle' | 'requesting' | 'granted' | 'denied' | 'error'
  activeSession: WebrtcSessionSnapshot | null
  incomingSession: WebrtcSessionSnapshot | null
  register: () => Promise<void>
  unregister: () => void
  call: (target: string) => Promise<void>
  answer: () => Promise<void>
  reject: () => void
  hangup: () => void
  mute: () => void
  unmute: () => void
  hold: () => void
  unhold: () => void
  sendDtmf: (tone: string) => void
}
```

## G. Call lifecycle persistence ekle

Her çağrı için tek canonical call record tutulmalıdır.

1. İlk ringing/dialing event’inde create.
2. Aynı `call_id` için sonraki event’lerde update.
3. Contact/lead relation önce boşsa screen-pop sonucu ile patch.
4. Ended event’inde duration hesapla.

Payload mantığı için `reference/call-record-lifecycle.example.md` dosyasını kullan.

## H. UI parçalarını ekle

Önerilen sırayla:

1. WebPhone readiness badge
2. Call button / dialpad
3. Incoming call dialog/sheet
4. Active call panel
5. Customer card relation/open behavior
6. Wrap-up form and call activity persistence
7. Live call notes and pinned customer notes
8. Call history panel
9. Admin WebRTC settings ekranı
10. Admin agent phone profile ekranı

## I. Hedef projeye göre route entegrasyonu

### CRM

- Contact detail içine `CallButton` ve `CustomerCallHistory` ekle.
- Header’a compact WebPhone status ekle.
- Incoming call dialog global layout altında mount edilir.

### Ticket/support

- Ticket requester bilgisi yanında call button.
- Requester/customer drawer içinde call history.
- Incoming call geldiğinde requester eşleşirse requester paneli açılır; ticket bulunamazsa yeni ticket aksiyonu opsiyoneldir.

## J. Verification

`05-verification-checklist.md` tamamlanmadan işi bitirme.

## K. Rollback / güvenli fallback

- WebRTC hazır değilse call UI görünür olabilir ama dial disabled olmalı.
- Call create başarısızsa çağrı UI bloklanmamalı; kullanıcıya sessiz/temiz hata gösterilmeli ve teknik detay loglanmalı.
- Customer match başarısızsa unknown caller olarak devam edilmeli.
- Call history query relation filtresi hata verirse phone fallback query denenmeli.
- Wrap-up activity kaydı yazılamazsa pending wrap-up kapanmamalı.
- Pinned note için contact/lead/callback ilişkisi yoksa kullanıcıdan önce kayıt seçmesi istenmeli.
