# 08 — Referans Uygulama: Bir Sales CRM'e Gerçek Entegrasyon (As-Built)

> **Bu dosya nedir?**
> `00`–`07` dosyaları **sözleşme** (ne yapılmalı). Bu dosya o sözleşmelerin **gerçekleşmiş** halidir: bu kit kullanılarak çalışan bir Docyrus Sales CRM uygulamasına fiilen eklenen, shipped olmuş minimal WebRTC softphone modülünün as-built kaydı. Yani bir kural değil, **çalışan bir örnek** ve entegrasyonu yapan ajanın saha notlarıdır.
>
> **Neden ayrı bir dosya?** README'nin "Referans alınan mevcut çalışma noktaları" bölümü, kitin türetildiği **ağır** call-center ürününe (`src/features/callcenter/...`) işaret eder. Bu dosya ise tam tersi yönü gösterir: o ağır üründen **minimal** bir modül nasıl çıkarıldı, hedef bir CRM'in içine hangi dosya yapısıyla, hangi UI/UX kararlarıyla ve hangi tuzaklara takılarak yerleştirildi. Kendi CRM'inize taşırken kopyalayacağınız gerçek iskelet budur.
>
> **Kaynak proje:** React 19 + Vite + TanStack (Router/Query) + Tailwind v4 tabanlı, `@docyrus/signin` ile auth olan bir Sales CRM. Backend `base_callcenter` + `base.contact` Docyrus datasource'ları. SIP sağlayıcı Verimor / bulutsantralim (JsSIP üzerinden WebRTC).

---

## 1. 30 saniyede sonuç

Modül `App Config → Webphone` switch'i ile açıldığında uçtan uca şunlar **çalışır durumda**:

- Agent header'da WebPhone durumunu görür, tek tıkla Online/Offline olur, kendi dahili/şifresini girer.
- Header dialpad'inden veya herhangi bir CRM kayıt kartındaki "Ara" butonundan dış arama başlatılır.
- Gelen çağrıda numara `base.contact` ile eşleşirse müşteri kartı otomatik açılır (screen-pop); 0/1/N eşleşme ele alınır.
- Her çağrı `base_callcenter.call` içinde **tek bir kanonik kayıt** olarak tutulur (ringing'de create, answer/end'de update, süre hesabı).
- Çağrı bitince wrap-up formu açılır → `call_activity` + `call` patch. Görüşme sırasındaki live note wrap-up'a taşınır.
- Müşteri kartında çağrı geçmişi + kalıcı (pinned) notlar görünür.
- `/calls` sayfasında tenant geneli çağrı log'u (DataGrid + Gelen/Giden görünümleri).

Şemaya tek bir mutasyon yapılmadı, tek bir enum ID hardcode edilmedi. Modül kapalıyken hiçbir yüzey render olmaz (tam no-op).

**Kanıtlanmamış olan:** Canlı SIP register / gerçek gelen çağrı, dolu bir agent profili ve gerçek PBX'e karşı test edilmedi — bu son adım operasyona/kullanıcıya bırakıldı. Kod yolu hazır, ama "yeşil tik" gerçek hat testi sonrası gelir.

---

## 2. Aldığım büyük mimari kararlar (ve nedenleri)

1. **Önce kapı, sonra özellik.** Her şey tenant düzeyinde bir modül switch'inin (`data.modules.webphone`, **default kapalı**) arkasında. Sebep: yarım/canlıya hazır olmayan telefon yüzeyini kazara kullanıcıya açmamak ve diğer modüllerle (Field Sales) aynı App Config altyapısını paylaşmak. Kapalıyken provider, widget, badge, dialpad, buton — hepsi erken `return null`.

2. **Tek provider kompozisyonu.** Tüm parçalar (ayarlar + profil + readiness + JsSIP controller + call-log + adapter + screen-pop + wrap-up) tek bir `WebphoneProvider` içinde birleşiyor, `useWebphone()` ile tüketiliyor. UI bileşenleri SIP'in iç detaylarını hiç görmüyor — sadece context'i okuyor. Bu, UI'ı test edilebilir ve değiştirilebilir tutuyor.

3. **Mevcut backend'i aynen kullan, şema değiştirme.** Bir schema audit ile `base_callcenter` (`call`, `agent_telephony_profile`, `call_activity`, `call_screen_note`, `callback`) ve `base.contact` üzerinde gerekli tüm field/enum'ların zaten var olduğu doğrulandı. Hiçbir field/enum oluşturulmadı.

4. **Credential ile runtime'ı ayır.** SIP kullanıcı adı/şifre/display name **yalnızca** agent telephony profile'dan gelir; asla tenant config'de, asla `.env`'de değil. Credential içermeyen runtime ayarları (WSS, PBX host, realm, ICE, codec…) tenant App Config kaydında `data.webrtc` altında durur — `data.fieldSales` / `data.modules` ile aynı kayıt.

5. **Müşteri datası için adapter.** CRM'in `base.contact` kaydını kit'in `CustomerAdapter` arayüzüne çeviren ince bir hook yazıldı. Müşteri datasource'u **asla mutate edilmez**; sadece okunur ve `/contacts/$contactId` rotası "müşteri kartı" olarak kullanılır. Başka bir projede burası requester/account/client olabilir — değişen tek yer adapter'dır.

6. **Saf çekirdek / React kabuğu ayrımı.** `src/lib/webphone/` altındaki her şey React'ten bağımsız saf fonksiyonlar (readiness, enum çözümü, payload kurucular, telefon normalizasyonu, screen-pop kararı). React/TanStack/JsSIP bağımlılıkları yalnızca `hooks/` ve `components/` katmanında. Bu sayede karar mantığı tek başına okunabilir ve taşınabilir.

---

## 3. Dosya haritası (sözleşme → gerçek dosya)

Kopyalarken bu tablo en faydalı kısımdır. Sol sütun kit sözleşmesindeki kavram, sağ sütun bu CRM'de o kavramı karşılayan gerçek dosya(lar).

### Saf çekirdek — `src/lib/webphone/` (React yok)

| Kavram                                 | Dosya                                                         | Ne yapar                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Tipler / controller arayüzü            | [types.ts](../../src/lib/webphone/types.ts)                   | `WebphoneController`, session snapshot, lifecycle event, `CustomerAdapter`, lokal `WebphoneAgentProfile` tipi        |
| Telefon normalizasyonu (Risk 2)        | [phone.ts](../../src/lib/webphone/phone.ts)                   | `normalizePhoneForMatch`, `samePhone` (son-10 fallback), `normalizePhoneForStorage` (E.164-vari), `toDialableTarget` |
| Runtime + **tek readiness** (Risk 4/5) | [runtime.ts](../../src/lib/webphone/runtime.ts)               | Verimor defaults, `buildWebrtcRuntimeConfig`, `resolveWebphoneReadiness` (tüm dial gating'in tek kaynağı)            |
| Enum çözümü (Risk 3)                   | [enum-resolver.ts](../../src/lib/webphone/enum-resolver.ts)   | slug/name normalize edip enum id bulur; çözülemezse `undefined` döner (tahmin yok)                                   |
| Screen-pop kararı                      | [screen-pop.ts](../../src/lib/webphone/screen-pop.ts)         | 0/1/N mode, tek eşleşmede boş-ise-patch kararı (Risk 8)                                                              |
| Call kaydı payload'u (Risk 6/7)        | [call-lifecycle.ts](../../src/lib/webphone/call-lifecycle.ts) | event → `base_callcenter.call` payload; `call_id` başına tek kayıt, süre hesabı                                      |
| Wrap-up payload'u                      | [wrapup.ts](../../src/lib/webphone/wrapup.ts)                 | disposition UI token → tenant enum **adı** → id; live note import kuralı                                             |

### Veri hook'ları — `src/hooks/use-webphone-*`

| Kavram                     | Dosya                                                                                | Ne yapar                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Tenant runtime ayarları    | [use-webphone-config.ts](../../src/hooks/use-webphone-config.ts)                     | `data.webrtc`'i okur/yazar (credential-free)                                                                         |
| Agent profili + credential | [use-webphone-profile.ts](../../src/hooks/use-webphone-profile.ts)                   | mevcut kullanıcının `agent_telephony_profile`'ı; kendi dahili/şifre güncellemesi                                     |
| Müşteri adapter'ı          | [use-webphone-customer-adapter.ts](../../src/hooks/use-webphone-customer-adapter.ts) | `base.contact` → `CustomerAdapter`; kart = `/contacts/$contactId`                                                    |
| Enum resolver hook'u       | [use-webphone-enums.ts](../../src/hooks/use-webphone-enums.ts)                       | paylaşılan 1s cache'li enum kataloğunu resolver'a bağlar                                                             |
| Call lifecycle persistence | [use-webphone-call-log.ts](../../src/hooks/use-webphone-call-log.ts)                 | controller event'lerini `call` kaydına yazar; relation patch; **canlı çağrıyı asla bloklamaz**                       |
| Wrap-up + pinned note      | [use-webphone-wrapup.ts](../../src/hooks/use-webphone-wrapup.ts)                     | `call_activity` upsert + `call` patch + `call_screen_note` create                                                    |
| Çağrı geçmişi sorguları    | [use-webphone-call-history.ts](../../src/hooks/use-webphone-call-history.ts)         | müşteri geçmişi (relation-first + phone fallback), tenant log, pinned notlar                                         |
| **SIP controller**         | [use-webphone-sip.ts](../../src/hooks/use-webphone-sip.ts)                           | tek JsSIP UA; register/call/answer/hangup/mute/hold/DTMF; mic izni; remote audio; ringback; lifecycle event emisyonu |

### React kompozisyonu + UI — `src/components/webphone/`

| Yüzey                      | Dosya                                                                                        | Ne yapar                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Provider + `useWebphone()` | [webphone-context.tsx](../../src/components/webphone/webphone-context.tsx)                   | her şeyi birleştirir; auto-connect; screen-pop effect'i; pending wrap-up      |
| Header durum chip'i        | [webphone-status-badge.tsx](../../src/components/webphone/webphone-status-badge.tsx)         | nokta-renk durumu, Online/Offline menüsü, hata toast'ı, dahili ayar girişi    |
| Per-user dahili ayarı      | [webphone-extension-dialog.tsx](../../src/components/webphone/webphone-extension-dialog.tsx) | kullanıcının kendi SIP credential'ı; "Kaydet & bağlan"                        |
| Header dialpad             | [webphone-dialpad.tsx](../../src/components/webphone/webphone-dialpad.tsx)                   | dış arama; ≥7 hane yazılınca contact araması; tek tıkla ara+bağla             |
| Global çağrı widget'ı      | [webphone-widget.tsx](../../src/components/webphone/webphone-widget.tsx)                     | gelen screen-pop → aktif çağrı → wrap-up (öncelik sırasıyla)                  |
| Click-to-call butonu       | [webphone-call-button.tsx](../../src/components/webphone/webphone-call-button.tsx)           | kayıt kartlarındaki "Ara" aksiyonu (gated)                                    |
| Müşteri çağrıları paneli   | [webphone-customer-calls.tsx](../../src/components/webphone/webphone-customer-calls.tsx)     | geçmiş + pinned notlar (contact kartındaki "Çağrılar" sekmesi)                |
| Tenant ayar formu          | [webphone-settings-form.tsx](../../src/components/webphone/webphone-settings-form.tsx)       | `data.webrtc` runtime ayarları + readiness özeti (read-only + onayla-düzenle) |

### Bağlama (wiring) noktaları

| Yer                     | Dosya                                                                                                                                                                                                                          | Ne eklendi                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Modül flag tanımı       | [app-config.ts](../../src/lib/app-config.ts)                                                                                                                                                                                   | `webphone: boolean` (default `false`), `isModuleEnabled`       |
| Modül oku/yaz           | [use-app-config.ts](../../src/hooks/use-app-config.ts)                                                                                                                                                                         | `useAppModules` / `useUpdateAppModules`                        |
| Rota guard              | [module-guard.tsx](../../src/components/shared/module-guard.tsx)                                                                                                                                                               | kapalı modül rotası `/`'a redirect                             |
| Provider + widget mount | [App.tsx](../../src/App.tsx)                                                                                                                                                                                                   | `<WebphoneProvider>` + `<WebphoneWidget />`                    |
| Header aksiyonları      | [app-header-actions.tsx](../../src/components/layout/app-header-actions.tsx)                                                                                                                                                   | durum badge + dialpad (modül açıksa)                           |
| Sidebar grubu           | [app-sidebar.tsx](../../src/components/layout/app-sidebar.tsx)                                                                                                                                                                 | `/calls` öğesi (modül açıksa)                                  |
| App Config ekranı       | [app-config.tsx](../../src/routes/app-config.tsx)                                                                                                                                                                              | modül satırı + tamam/eksik rozeti + ayar modalı                |
| Tenant çağrı log'u      | [calls.tsx](../../src/routes/calls.tsx)                                                                                                                                                                                        | `/calls` DataGrid sayfası                                      |
| CRM kart entegrasyonu   | [contact-detail.tsx](../../src/routes/contact-detail.tsx), [company-detail.tsx](../../src/routes/company-detail.tsx), [lead-detail.tsx](../../src/routes/lead-detail.tsx), [deal-detail.tsx](../../src/routes/deal-detail.tsx) | "Ara" butonu / doğrudan dial; contact'ta ek "Çağrılar" sekmesi |

---

## 4. Katman katman nasıl çalışıyor

### 4.1 Readiness — tek doğruluk kaynağı

`resolveWebphoneReadiness()` (runtime.ts) **tek** fonksiyon; "bu agent arama yapabilir mi?" sorusunu o yanıtlar ve tüm UI gating bunu okur. Girdileri: authenticated mı, secure context mi (HTTPS/localhost), tenant ayarları, agent profili. Çıktısı `{ ready, reasons[] }`. Her UI yüzeyi sadece `ready`'e bakar; eksik nedenleri (`missing_password`, `non_webrtc_device`, `insecure_context`…) yalnızca ayar/debug ekranlarında insan-diliyle gösterir. Bu sayede "neden arayamıyorum" sorusunun cevabı her yerde aynı.

### 4.2 SIP controller — `use-webphone-sip.ts` (kalp)

Tek bir JsSIP `UA` örneği bir hook içinde yaşıyor (`uaRef`), unmount'ta yok ediliyor. Dışarıya kesin tipli bir `WebphoneController` veriyor; içeride JsSIP'in gevşek tipli event'lerini `any` sınırında tutuyor. Önemli davranışlar:

- **Lifecycle event emisyonu:** `ringing / answered / ended / missed / rejected` event'leri `onCallEvent` ile yukarı akıyor. Persistence (call-log) bu event'lere tepki veriyor — controller persistence'ı bilmiyor (temiz ayrım).
- **Mic izni register'dan önce:** `getUserMedia({audio:true})` çağrılır, track hemen kapatılır; reddedilirse `microphoneStatus='denied'` ve register iptal.
- **Remote audio:** gizli bir `<audio autoplay>` elementi DOM'a eklenir; `track` / `peerconnection` / `getReceivers` üzerinden gelen stream ona bağlanır. Autoplay engellenebileceği için `play()` best-effort.
- **Outbound ringback tonu:** Verimor erken-medyası güvenilir olmadığından, dışarı ararken WebAudio ile **425 Hz** (Avrupa ringback frekansı) bir ton üretilir; pulse cadence ile çalar, remote audio gelince / cevaplanınca / hata / hangup'ta susar.
- **İkinci çağrıyı 486 ile reddet:** zaten bir session varken gelen ikinci `newRTCSession` `486 Busy Here` ile terminate edilir.

### 4.3 Kompozisyon — `webphone-context.tsx`

Provider, ayarlar + profil → `buildWebrtcRuntimeConfig` → controller zincirini kurar ve şunları yönetir:

- **Auto-connect:** modül açık + readiness `ready` + status `idle` ise **bir kez** otomatik register (`triedRegisterRef` ile tek atış).
- **Outbound relation doldurma:** `dial(phone, {contactId/leadId})` ile başlatılan çağrıda, session aktif olunca call kaydının müşteri relation'ı doldurulur.
- **Inbound screen-pop effect'i:** gelen session yakalanınca adapter ile eşleşme aranır; tek eşleşmede kart açılır ve relation **boşsa** patch edilir.
- **Pending wrap-up:** cevaplanan ya da outbound olan bir çağrı bitince wrap-up formu state'i set edilir; live note temizlenir.

---

## 5. UI yüzeyleri ve tam davranışları

Hepsi modül kapalıyken `return null`. Hiçbiri kullanıcıya teknik dil göstermez (Risk 10); tüm string'ler `webphone.*` i18n anahtarlarında (en + tr).

- **Header durum chip'i** — Renkli nokta canlı sistem durumunu gösterir: yeşil `Hazır`, sarı `Bağlanıyor`/mic reddi, kırmızı `Başarısız`, gri `Offline`/eksik ayar. Tıklanınca küçük menü: **Online** (register) / **Offline** (unregister) + "Dahili ayarları". Registration veya transport hatasında sessizce offline'a düşmek yerine **toast + menüde uyarı** gösterir (her hata bir kez toast'lanır).

- **Dahili ayar dialog'u** — Kullanıcı kendi `extension` / SIP username / şifre / display name'ini kendi `agent_telephony_profile`'ına yazar. **Şifre asla prefill edilmez**; boş bırakılırsa kayıtlı şifre korunur. "Kaydet & bağlan" sonrası, profil refetch'ini beklemeden **birleştirilmiş profil snapshot'ı** `requestConnect`'e geçilir — böylece register yeni girilen credential ile yapılır (eski değerle yarışmaz).

- **Header dialpad** — Numara girişi + tuş takımı. ≥7 hane yazılınca `base.contact`'ta arama yapar; bilinen müşteri çıkarsa tek tıkla **arar ve bağlar**. Çağrı butonu yalnızca `ready && registered && aktif çağrı yok` iken aktif.

- **Global widget** (sağ-alt, sabit) — Tek seferde tek panel, öncelik sırası: **gelen çağrı → aktif çağrı → wrap-up**.
  - _Gelen:_ arayan adı/numarası, çoklu eşleşmede seçim listesi, Cevapla/Reddet.
  - _Aktif:_ canlı geçen süre, Mute/Hold/Keypad (DTMF), live not alanı, Kapat.
  - _Wrap-up:_ disposition (7 seçenek), not (live not'tan prefill), follow-up switch'i, Kaydet/Atla. Disposition seçilmeden Kaydet kapalı; kayıt başarısızsa form **açık kalır**.

- **Click-to-call butonu** — CRM kart kartlarına gömülü "Ara" aksiyonu. Modül açıkken contact/company/lead/deal'deki çağrı aksiyonları **gerçek WebPhone'a** yönlenir; modül kapalıyken eski görsel mock dialer'a düşer (eski `DialerProvider` bilinçli olarak dokunulmadan bırakıldı).

- **Müşteri "Çağrılar" sekmesi** (yalnız contact kartında) — Çağrı geçmişi (relation-first, telefon fallback) + pinned not ekleme/listeleme. Company/lead/deal'de şu an sadece arama aksiyonu var, tam panel yok.

- **`/calls` tenant log'u** — Paylaşılan `useDocyrusDataGrid` + seed'lenmiş "All / Gelen / Giden" görünümleri (read-only, 25/sayfa). Önemli: Gelen/Giden filtreleri `direction` enum **id**'si ile çalışır (slug server-side eşleşmiyor — doğrulandı), bu yüzden sayfa id'leri resolver ile çözene kadar grid'i mount etmez.

- **App Config satırı** — Modül açıldığında satırda tamam/eksik rozeti (hover ne eksik olduğunu söyler — readiness'tan beslenir) ve dişli buton → ayar modalı (`WebphoneSettingsForm`). Form **read-only açılır**; "yetkili düzenleme" onayından sonra düzenleme açılır (onay kalıcı değil, sadece kazara değişikliğe karşı).

---

## 6. Gerçek entegrasyonda takıldığım tuzaklar ve verdiğim kararlar

Bu, kitin "saha notları" kısmı — başka bir CRM'e taşırken büyük ihtimalle aynılarına çarpacaksınız.

1. **Generated entity type bayat çıktı.** `agent_telephony_profile.sip_password` ve `display_name` canlı şemada var ama generate edilmiş tipte yok (openapi.json o iki field için güncellenmemiş). 114 collection'ı yeniden generate etmek yerine bu iki alanı `columns` ile **açıkça** istedim ve sonucu lokal `WebphoneAgentProfile` tipine cast ettim. → Kendi projenizde profil alanlarınız generated tipte görünmüyorsa önce `columns`'a güvenin, sonra tip ekleyin.

2. **Enum slug'ı server-side filtrede eşleşmiyor.** `/calls` Gelen/Giden görünümlerinde `direction` slug'ı ile filtrelemek çalışmadı; enum **id**'sine resolve edip öyle filtreledim ve id'ler bilinene kadar grid'i mount etmedim. → Saved-view filtrelerinde enum'u id ile kurun.

3. **Kaydet-sonrası credential yarışı.** Kullanıcı yeni şifre girip "Kaydet & bağlan" deyince, profil query'si invalidate olup yeniden gelene kadar register **eski** credential'la yarışıyordu. Çözüm: dialog, kaydedilen değerlerle birleştirilmiş bir profil snapshot'ını doğrudan `register(configOverride)`'a geçiriyor.

4. **Durmuş UA'dan geç gelen event'ler.** Eski bir UA'nın gecikmeli `registered`/`disconnected` event'i aktif registration durumunu eziyordu. Her handler'da `isCurrentUa()` guard'ı var: `uaRef` artık o UA değilse event yok sayılır.

5. **Re-register sessiz no-op oluyordu.** Başarısız/kopmuş bir registration listener'ları `uaRef`'i set bırakınca tekrar register hiçbir şey yapmıyordu. `register()` artık her seferinde eski UA'yı `stop()` edip **sıfırdan** kuruyor.

6. **`call.outcome`'da `completed` yok.** Tenant'ta başarı değeri `answered`. Hardcode etmek yerine token mapping'i buna göre kurdum (`callOutcomeToken`, wrap-up `WRAPUP_TO_OUTCOME`). → Enum _değerlerinizi_ audit etmeden mapping yazmayın.

7. **Wrap-up disposition iki adımlı çözülüyor.** UI token (`callback_requested`) → tenant enum **adı** (`Callback Scheduled`) → enum **id**. Hiçbir yerde id elle yazılmıyor; ad çözülemezse field düşürülüyor.

8. **Persistence canlı çağrıyı asla bloklamaz.** Call create/update hataları `console.warn` ile loglanır, UI akışı sürer (Risk 6). Tek istisna: wrap-up `call_activity` upsert'ü hata fırlatır ki form retry için **açık kalsın** — call patch yine best-effort.

9. **Relation asla ezilmez (Risk 8).** Screen-pop ya da seçim sonrası `contact`/`lead` patch'i yalnızca kayıt **boşsa** uygulanır; dolu relation'a dokunulmaz.

10. **Modül gerçekten no-op.** Default kapalı; provider'dan butona kadar her parça kapalıyken erken döner. Açma/kapama tenant düzeyinde, rota guard'ı kapalı modülün deep-link'ini `/`'a atar.

---

## 7. Başka bir CRM'e taşıma — kısa playbook

Sıra önemli. Detaylı sözleşmeler için `04-implementation-playbook.md`'ye, bu somut örnek için yukarıdaki dosya haritasına bakın.

1. **Schema audit** (`reference/schema-audit-cli.md`): `base_callcenter` collection'ları, agent profil alanları ve enum'ları doğrulayın. Eksikse raporlayın — varsaymayın.
2. **Saf çekirdeği kopyalayın:** `src/lib/webphone/` (yedi dosya). Burada hedefe özgü hiçbir şey yok; `runtime.ts` içindeki Verimor defaults'unu kendi PBX'inize göre güncelleyin (ya da tenant ayarından besleyin).
3. **Veri hook'larını kopyalayın:** `src/hooks/use-webphone-*`. Profil sorgusundaki `columns`'ı kendi alan adlarınıza göre ayarlayın.
4. **Adapter'ı kendi müşteri datasource'unuza yöneltin:** `use-webphone-customer-adapter.ts` içindeki collection'ı (`base.contact`), `CONTACT_COLUMNS`'u ve `openCustomerCard` rotasını değiştirin. Müşteri kaydınız contact değilse `kind`'i ona göre verin. Datasource'u **mutate etmeyin** (Risk 1).
5. **UI bileşenlerini kopyalayın** ve i18n anahtarlarını (`webphone.*`) projenize taşıyın.
6. **Bağlayın:** `App.tsx`'e `<WebphoneProvider>` + `<WebphoneWidget />`; header'a status badge + dialpad; kart kartlarına `WebphoneCallButton`; contact kartına `WebphoneCustomerCalls`.
7. **Gating:** Modül switch'iniz varsa `isModuleEnabled(..., 'webphone')` ile geçin; yoksa bileşenlerdeki `enabled` kontrolünü her zaman-açık yapın. Settings için bir app-config kaydı kullanın (`02-runtime-settings.md`'deki saklama önceliği).
8. **Doğrulayın:** Agent profilini doldurun (extension + sip_password + webrtc_enabled + WebRTC device), HTTPS/localhost'ta açın, `05-verification-checklist.md`'yi tamamlayın. **Canlı gelen/giden çağrı testi yapılmadan bitmiş saymayın.**

**Ticket/support paneline taşıyorsanız:** müşteri kartı yerine requester panelini açın; eşleşme yoksa "yeni ticket" aksiyonu sunabilirsiniz (`03-ui-behavior-contract.md`).

---

## 8. Doğrulama durumu (dürüst tablo)

| Alan                                                       | Durum                                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Outbound dial → call kaydı → answer/end → süre             | Kod yolu tam, akış simüle edildi                                                 |
| Inbound screen-pop (0/1/N), kart açma, relation patch      | Kod yolu tam                                                                     |
| Wrap-up (`call_activity` + `call` patch) + live not import | Kod yolu tam                                                                     |
| Pinned note (`call_screen_note`)                           | Kod yolu tam                                                                     |
| Müşteri geçmişi + tenant `/calls` log'u                    | Çalışır                                                                          |
| Module gating (default off, guard, no-op)                  | Çalışır                                                                          |
| TypeScript build / lint                                    | Geçiyor                                                                          |
| **Saf helper'lar için birim test**                         | **Yok** — `lib/webphone/` fonksiyonları test edilebilir ama henüz test eklenmedi |
| **Canlı SIP register / gerçek PBX'e gelen çağrı**          | **Test edilmedi** — dolu profil + gerçek hat ile operasyona bırakıldı            |

> Not: `runtime.ts`, `phone.ts`, `enum-resolver.ts`, `call-lifecycle.ts`, `wrapup.ts`, `screen-pop.ts` saf ve yan etkisiz — taşıdığınız projede ilk test yazacağınız yerler bunlar olmalı (verification checklist madde 10).

---

## 9. Bir cümlede özet

Ağır call-center ürününden, tek bir modül switch'i arkasında yaşayan, şemaya dokunmayan, credential'ı agent profilinden alan, saf-çekirdek + ince-React-kabuğu mimarisiyle kurulmuş, gating'i tek `resolveWebphoneReadiness`'ten okuyan ve canlı çağrıyı backend hatasına bağlamayan **minimal ama uçtan-uca çalışan** bir Verimor WebRTC softphone çıkarıldı; başka bir CRM'e taşımak için değiştirilmesi gereken tek asıl yer **müşteri adapter'ı**.
