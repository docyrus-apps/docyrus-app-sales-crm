# Wrap-up and Notes Contract

Bu dosya, WebRTC çağrı bittikten sonra yapılacak wrap-up, görüşme notları ve müşteri kartında kalıcı not davranışını tanımlar.

## Kapsam

Bu contract üç farklı not/aktivite tipini ayırır:

1. **Live call notes**: Çağrı sırasında yazılan geçici not.
2. **Wrap-up notes**: Çağrı bitince disposition ile birlikte `call_activity.disposition_notes` alanına yazılan sonuç notu.
3. **Pinned/customer notes**: Müşteri kartında kalıcı görünen `call_screen_note.note_text` kaydı.

Bu üçü karıştırılmamalıdır.

## Zorunlu datasource: `base_callcenter.call_activity`

Wrap-up sonucunu kalıcılaştırmak için kullanılır.

### Minimum alanlar

| Field slug            | Tip           | Kullanım                            |
| --------------------- | ------------- | ----------------------------------- |
| `id`                  | identity      | kayıt ID                            |
| `call`                | relation      | `base_callcenter.call` kaydı        |
| `direction`           | select        | inbound/outbound                    |
| `contact`             | relation      | contact ilişkisi                    |
| `lead`                | relation      | lead ilişkisi, opsiyonel            |
| `phone_number`        | phone/text    | aranan/aranan numara                |
| `duration_seconds`    | number        | toplam süre, opsiyonel              |
| `outcome`             | select        | answered/no answer/wrong number vb. |
| `disposition`         | select        | wrap-up sonucu                      |
| `disposition_notes`   | textarea/text | agent notu                          |
| `disposition_at`      | datetime      | wrap-up zamanı                      |
| `disposition_by`      | user          | wrap-up yapan kullanıcı             |
| `followup_required`   | boolean       | callback/follow-up var mı           |
| `created_callback`    | relation      | oluşturulan callback, opsiyonel     |
| `recording_url`       | url           | kayıt linki, opsiyonel              |
| `recording_available` | boolean       | kayıt var mı                        |

## Tam modül için zorunlu datasource: `base_callcenter.call_screen_note`

Müşteri kartında kalıcı/pinned not göstermek için kullanılır. Eğer hedef projede mevcut ve daha güçlü bir müşteri not sistemi varsa adapter ile bu davranış karşılanabilir; aksi halde tam kit için `call_screen_note` kullanılmalıdır.

### Minimum alanlar

| Field slug    | Tip           | Kullanım                     |
| ------------- | ------------- | ---------------------------- |
| `id`          | identity      | kayıt ID                     |
| `note_text`   | text/textarea | not metni                    |
| `contact`     | relation      | contact ilişkisi             |
| `lead`        | relation      | lead ilişkisi                |
| `callback`    | relation      | callback ilişkisi, opsiyonel |
| `source_call` | relation      | kaynak çağrı                 |
| `created_on`  | datetime      | sıralama                     |
| `created_by`  | user          | yazar                        |

## Wrap-up zorunlu olma kuralı

Minimum kural:

- Cevaplanan çağrılarda wrap-up istenir.
- Agent tarafından reddedilen veya agent’a düşüp kapanan çağrılarda wrap-up istenebilir.
- Outbound cevapsız denemelerde disposition istenebilir.
- Sistem kaynaklı kısa/hiç bağlanmamış teknik eventlerde wrap-up zorunlu olmayabilir.

Önerilen trigger eventleri:

```txt
ended
missed
rejected
```

## Wrap-up input contract

```ts
type WrapupSubmitInput = {
  disposition: string
  notes?: string
  scheduleCallback?: boolean
  callbackDueDate?: string
  callbackDueTime?: string
  callbackPriority?: string
  callbackInstructions?: string
  contactId?: string
  leadId?: string
}
```

## Disposition mapping

Hedef projede enum ID hardcode edilmez; şu token/label seti resolve edilir.

| UI disposition       | Activity disposition    | Call outcome   |
| -------------------- | ----------------------- | -------------- |
| `completed`          | `Reached - Success`     | `Answered`     |
| `interested`         | `Reached - Success`     | `Answered`     |
| `callback_requested` | `Callback Scheduled`    | `Answered`     |
| `not_interested`     | `Reached - No Interest` | `Answered`     |
| `wrong_number`       | `Wrong Number`          | `Wrong Number` |
| `no_answer`          | `No Answer`             | `No Answer`    |
| `voicemail`          | `Voicemail`             | `Voicemail`    |

## Live notes → wrap-up notes

Çağrı sırasında yazılan live note, wrap-up formu açıldığında `notes` alanına otomatik kopyalanmalıdır.

Kurallar:

- Agent daha önce wrap-up notes yazdıysa live note üzerine yazmamalıdır.
- Boş live note hiçbir şey yapmaz.
- Live note kalıcı kayıt değildir; kalıcılık wrap-up submit ile başlar.

## Wrap-up submit davranışı

Submit sırasında:

1. `call_id` ile `base_callcenter.call` kaydı bulunur.
2. Contact/lead relation doğrulanır.
3. Gerekli ise callback oluşturulur veya dedupe ile güncellenir.
4. `base_callcenter.call_activity` create/update edilir.
5. `base_callcenter.call` state/outcome/relation/talk_duration alanları patch edilir.
6. Query’ler invalidate edilir.
7. Pending wrap-up kapatılır.

## Customer link zorunluluğu

Telefon varsa ve çağrı bir kişiye bağlanabilecek durumdaysa wrap-up tamamlanmadan önce contact/lead seçimi istenmelidir.

Fallback:

- Hedef proje customer adapter custom ise ve `base.contact` mirror yoksa call activity sadece `phone_number` ile saklanabilir.
- Bu durumda müşteri kartı geçmişi phone fallback ile çalışmalıdır.

## Callback oluşturma davranışı

`input.scheduleCallback=true` ise:

- `callbackDueDate` zorunlu.
- `callbackDueTime` zorunlu.
- Telefon zorunlu.
- Contact/lead relation mümkünse callback payload’a eklenir.
- Yakın zamanda aynı kişi/telefon için callback varsa dedupe uygulanır.

Callback datasource hedef projede yoksa:

- `followup_required=true` yazılır.
- Callback oluşturma UI’ı gizlenir veya hedef proje görev/ticket follow-up sistemine adapter yazılır.

## Pinned/customer notes davranışı

Müşteri kartında kalıcı not için ayrı aksiyon kullanılmalıdır:

```txt
note_text + contact/lead + source_call
```

Kurallar:

- Boş not kaydedilmez.
- Contact/lead/callback relation yoksa kullanıcıdan önce kayıt seçmesi istenir.
- `source_call` varsa not çağrı geçmişi ile ilişkilendirilir.
- Pinned note wrap-up disposition yerine geçmez.

## Query invalidation

Wrap-up veya pinned note sonrası önerilen invalidation:

```txt
['callcenter', 'calls']
['callcenter', 'customer-call-history']
['callcenter', 'call-activity']
['call-session-workspace', 'pinned-notes']
['contact', contactId]
['ticket', ticketId]
```

## UI davranışı

Wrap-up formunda minimum alanlar:

- Disposition
- Notes
- Schedule callback checkbox, opsiyonel
- Callback date/time, opsiyonel
- Contact/lead link uyarısı, gerekiyorsa

Pinned notes alanında minimum davranış:

- Mevcut notları listele
- Yeni not ekle
- Empty state göster

## Güvenlik ve kalite

- Wrap-up submit çift tıklamaya karşı loading/disabled olmalı.
- Call activity create/update başarısızsa pending wrap-up kapanmamalı.
- Callback create başarısızsa kullanıcıya açık hata verilmeli.
- Teknik enum/datasource hataları son kullanıcıya gösterilmemeli.
