# LLM'ler Nasıl Çalışır — İnteraktif Sunum / Handoff Dokümanı

**Durum:** Planlama tamamlandı, geliştirme başlamadı (proje klasörü boş)
**Tarih:** 2026-08-16
**Format:** İnteraktif web sitesi (tek sayfa, bölüm bölüm ilerleyen)
**Hedef kitle:** Yazılımcılar

---

## 1. Amaç ve Kapsam

### Hedef
LLM'i **bir sistem bileşeni olarak** anlatan interaktif bir site. İzleyici zaten kod yazıyor ve muhtemelen LLM araçları (Claude Code, Copilot, API) kullanıyor; eksik olan şey içerideki mekanizmanın zihinsel modeli.

### Ana anlatı (tek cümle)
> LLM **stateless bir fonksiyondur**: `f(token dizisi) → sonraki token için olasılık dağılımı`. Geri kalan her şey — sohbet, hafıza, araçlar, ajanlar — bu fonksiyonun etrafına yazılmış bir döngüdür.

Bu cümle sitenin omurgası. Her bölüm ya fonksiyonun içini ya da etrafındaki döngüyü açar.

### Hedef kitle profili ve bunun sonuçları
Yazılımcı kitle → anlatım seviyesi buna göre kalibre edilmeli:

**Yapılacaklar**
- **Analojiler yazılım dünyasından seçilecek:** tokenizer ≈ lexer, context window ≈ sabit boyutlu buffer, KV cache ≈ memoization, agent loop ≈ request/response döngüsü, sistem promptu ≈ config + middleware
- **Gerçek payload'lar gösterilecek:** `messages[]` dizisi, `tool_use` / `tool_result` blokları, JSON şemaları. Yazılımcı soyut kutucuktan değil, gerçek istek gövdesinden öğrenir.
- **Sayılar verilecek:** token maliyetleri, pencere boyutları, gecikme kaynakları
- **Mimari seviyede matematik ana akışta kalabilir:** embedding, attention, logits, softmax — *ne yaptıkları* anlatılacak

**Yapılmayacaklar**
- Satır satır türev, backprop matematiği, transformer katmanlarının tam çözümü → katlanır "derinlemesine" kutusuna
- "Yapay zeka insan gibi düşünür" tarzı metaforlar → kitle bunlardan rahatsız olur
- Bilinen şeylerin tekrarı: JSON'un ne olduğu, HTTP'nin ne olduğu

### Başarı kriteri
Sunum sonunda izleyici şu soruları cevaplayabilmeli:
- Model **stateless** ise "sohbet" nasıl oluyor?
- `temperature=0` neden deterministik değil?
- Uzun sohbetlerde kalite neden düşüyor, maliyet neden katlanarak artıyor?
- Model neden var olmayan bir kütüphane fonksiyonu uyduruyor?
- Model dosyayı gerçekten okuyor mu, aracı kim çalıştırıyor?
- Prompt'un başını sabit tutmak neden faturayı düşürüyor?
- Ne zaman büyük model, ne zaman yüksek efor seçmeliyim?

---

## 2. Bölüm Yapısı

| # | Bölüm | İzleyicinin sorusu | Demo |
|---|---|---|---|
| 0 | Stateless fonksiyon | Bu şey aslında ne? | — |
| 1 | İstek gövdesi: prompt paketleme | Yazdığım şeye ne ekleniyor? | Payload inceleyici |
| 2 | Tokenizasyon | Metin sayıya nasıl dönüyor? | Canlı tokenizer |
| 3 | Çıkarım, örnekleme, streaming | Cevap nasıl üretiliyor? | Logit gezgini + sampling |
| 4 | Ağırlıklar nereden geldi | Model bunu nasıl "biliyor"? | — (statik görsel) |
| 5 | Context penceresi, cache, maliyet | Sohbet uzayınca ne oluyor? | Pencere + fatura sayacı |
| 6 | Araç döngüsü & yapılandırılmış çıktı | Aracı kim çalıştırıyor? | Agent döngüsü |
| 7 | Halüsinasyon | Neden API uyduruyor? | — (örnek vitrini) |
| 8 | Model seviyeleri & efor | Modeller arası fark ne? | — (karşılaştırma) |
| 9 | Seçim rehberi | Ben ne seçmeliyim? | Karar aracı |

---

## 3. Bölüm Detayları

### Bölüm 0 — LLM Stateless Bir Fonksiyondur

Açılış ekranı. Yazılımcı kitle için doğru giriş noktası burası — "yapay zeka" değil, **imza**:

```
f(token[]) → olasılık dağılımı
```

Vurgulanacak: fonksiyonun **hafızası yok**, **yan etkisi yok**, **her çağrıda ağırlıklar aynı**. Sohbet, hafıza, ajan davranışı — hepsi bu saf fonksiyonun etrafına yazılmış uygulama katmanı.

Sonra: "bu imzadaki her parça bir bölüm" diyerek aşağı yönlendir.

---

### Bölüm 1 — İstek Gövdesi: Prompt İşleme ve Arka Planda Eklenen Katmanlar

**İçerik**
Kullanıcının girdiği komut doğrudan işlenmez. 5 temel bileşenle birleştirilip tek bir istek gövdesine dönüşür:

1. **Sistem istemi (system prompt)** — modelin kimliği, kuralları, davranış talimatları
2. **Araç tanımları (tool definitions)** — JSON şeması olarak: isim, açıklama, parametreler
3. **Bellek / hafıza dosyaları** — kalıcı notlar, proje bağlamı (`CLAUDE.md` vb.)
4. **Sohbet geçmişi** — önceki tüm mesajlar, `messages[]` dizisi olarak
5. **Yüklenen ek dosyalar** — kullanıcının eklediği içerik

**Can alıcı nokta #1 — Statelessness**
> Sunucu tarafında "oturum" diye bir şey yok. Her turda **tüm sohbet geçmişi baştan gönderilir.** "Sohbet" istemcinin ürettiği bir kurgudur — `messages[]` dizisine bir eleman daha ekleyip endpoint'e yeniden POST etmekten ibaret.

Bu, yazılımcı kitle için bölümün en değerli bilgisi. Bölüm 5'teki maliyet matematiğinin de temeli.

**Can alıcı nokta #2 — Düzleşme**
> Bu 5 katman modele varmadan önce **tek bir token dizisine** düzleşir. Modelin gördüğü yerde "sistem promptu" ile "kullanıcı mesajı" arasında yapısal bir ayrım yok — sadece konum ve etiket farkı var.

Bu, prompt injection'ın neden mimari bir problem olduğunu da açıklıyor: talimat ile veri aynı kanaldan akıyor. (Bir cümleyle değinilsin, ayrı bölüm açılmasın.)

**Demo D1: Payload İnceleyici**
- Üstte kısa bir kullanıcı girdisi (örn. `merhaba`)
- Altta **gerçek istek gövdesi** JSON olarak, katlanır bloklar hâlinde: `system`, `tools`, `messages[]`
- Her bloğun yanında token sayısı; en altta toplam
- Vurgu: `2 token yazdın → ~15.000 token gönderildi`
- İkinci sekme: "3 tur sonra" — aynı payload'ın nasıl şiştiğini göster (statelessness'ın somut sonucu)

---

### Bölüm 2 — Tokenizasyon

**Çerçeve:** Tokenizer bir **lexer**'dır — ama kaynak kodun grameriyle değil, istatistiksel sıkıştırmayla (BPE) çalışır. Sınırları senin sezgine göre değil, eğitim verisinin frekansına göre çizilir.

**Mutlaka işlenecek noktalar**
- **Türkçe, İngilizce'den yaklaşık 2-3 kat fazla token harcar.** Aynı içerik = 2-3 kat maliyet, 2-3 kat daha hızlı dolan pencere. Türk yazılımcı kitle için doğrudan operasyonel bir sonuç.
- **Kod tokenizasyonu:** girintiler, `snake_case` vs `camelCase`, uzun tanımlayıcıların parçalanması, sık kullanılan anahtar kelimelerin tek token olması
- **Karakter seviyesi kördür:** "strawberry'de kaç r var" hatası, ters çevirme, karakter sayma. Model harfleri değil token'ları görüyor — bu yüzden string manipülasyonu görevleri için LLM yanlış araç.
- Sayıların tutarsız bölünmesi ve bunun aritmetik hatalarıyla ilişkisi

**Demo D2: Canlı Tokenizer**
- Metin gir → renkli kutucuklara ayrılsın, altında token ID'leri
- Hazır örnek butonları: bir kod bloğu (girintili), aynı cümlenin TR ve EN hâli, uzun bir tanımlayıcı, `strawberry`, uzun bir sayı
- Yan panel: TR/EN token sayısı ve maliyet karşılaştırması

---

### Bölüm 3 — Çıkarım, Örnekleme ve Streaming

**İçerik**

*Forward pass:*
- Token dizisi embedding vektörlerine dönüşür
- **Attention** her token'ın, üretim sırasında diğer token'lara ne kadar bakacağını belirler — bağlamın "hesaplandığı" yer burası
- Çıktı: kelime dağarcığındaki her token için bir skor (**logits**), softmax ile olasılığa çevrilir
- Seçilen token diziye eklenir, döngü baştan çalışır (**otoregresif üretim**)

*Örnekleme (sampling) — kritik bölüm:*
> Model "en olası"yı seçmez, **dağılımdan örnekler.**

- `temperature` — dağılımı yayar/keskinleştirir
- `top-p` / `top-k` — aday havuzunu kırpar
- **`temperature=0` bile tam determinizm vermez.** Sebepler: kayan nokta işlemlerinin toplanma sırası, GPU çekirdek seçimi, batch içindeki diğer isteklerin etkisi, MoE yönlendirmesi. Yazılımcı kitle için önemli bir tuzak — "aynı input, aynı output" varsayımıyla test yazan çok kişi var.

*Streaming:*
- Üretimin token token akmasının sebebi otoregresyonun kendisi — bu bir UI süslemesi değil, mimarinin doğrudan sonucu
- **Prefill vs decode:** ilk token gecikmesi (TTFT) girdinin tamamının işlenmesinden gelir, sonraki tokenlar tek tek üretilir. İki farklı performans profili, iki farklı optimizasyon hedefi. (Bölüm 5'te cache'e bağlanacak.)

**Derinlemesine kutusu (katlanır)**
Matris çarpımlarının boyutları, multi-head attention'ın yapısı, positional encoding. Ana akışta değil ama yazılımcı kitle için erişilebilir olsun — merak eden açar.

> ⚠️ **Terim tuzağı:** Buradaki "embedding" (token → vektör, modelin giriş katmanı) ile RAG/vektör veritabanı embedding'i (cümle → arama vektörü) farklı şeyler. Bir cümlelik ayrım koy; bu kitlede en sık karışan terim bu.

**Demo D3: Logit Gezgini**
- Yarım cümle yaz → ilk 5-10 aday token, olasılıklarıyla bar chart
- Kullanıcı birini tıklar → diziye eklenir → döngü yeniden çalışır (**döngüyü elle çeviriyor**)
- Sağda dizi büyürken canlı görünür

**Demo D4: Sampling Parametreleri**
- `temperature`, `top-p`, `top-k` slider'ları aynı dağılım üzerinde
- Kırpılan/ezilen adaylar görsel olarak sönümlensin
- Altta: aynı promptun farklı ayarlardaki örnek çıktıları

---

### Bölüm 4 — Ağırlıklar Nereden Geldi

**EKLENDİ.** Orijinal planda "çıkarım anında ağırlıklar sabittir" vardı ama ağırlıkların kaynağı hiç anlatılmıyordu.

**İçerik**
- **Ön eğitim (pretraining)** — devasa metin yığını üzerinde sonraki token tahmini. Modelin "bilgisi" buradan gelir.
- **Talimat ayarı (SFT)** — ham tamamlayıcıdan talimat izleyen asistana geçiş
- **RLHF / tercih optimizasyonu** — üslubun, reddetme davranışının ve "yardımsever asistan" karakterinin şekillendiği aşama

**Yazılımcı kitle için bağlanacak nokta**
> Ağırlıklar **derlenmiş bir binary** gibi düşünülebilir: çıkarım anında salt okunur. Sohbette söylediklerin ağırlıkları değiştirmez, sadece bir sonraki çağrının girdisine eklenir.

Buradan iki sonuç: (1) "modele öğretmek" ile "context'e koymak" bambaşka şeyler, (2) fine-tuning ayrı bir derleme adımıdır, çalışma zamanı davranışı değil.

**Kesme tarihi (knowledge cutoff)** burada tanımlanır, Bölüm 7'de sonuçları işlenir.

---

### Bölüm 5 — Context Penceresi, Cache ve Maliyet

**EKLENDİ.** Orijinal planın en büyük boşluğuydu ve yazılımcı kitle için en yüksek pratik değere sahip bölüm bu.

**İçerik**

*Context window:*
- Sabit boyutlu bir buffer. Doldu mu — taşma yok, **veri kaybı** var: özetleme (compaction), eski turların düşürülmesi, kırpma
- **"Ortada kaybolma" (lost in the middle):** uzun bağlamda baş ve son daha güvenilir işlenir. Kritik talimatı 40.000 token'lık bir yığının ortasına gömme.
- Pencere büyüklüğü ≠ etkin kullanılabilir alan

*Maliyet matematiği:*
- Statelessness'ın faturası: her tur **tüm geçmişi** yeniden gönderiyor → token tüketimi tur sayısıyla **kuadratik** büyür
- **Girdi ve çıktı token'ları farklı fiyatlandırılır** (çıktı belirgin şekilde pahalı)
- Düşünme (reasoning) tokenları çıktı tarafında sayılır — efor ayarının maliyete etkisi buradan geliyor (Bölüm 8'e bağlanacak)

*KV cache / prompt caching:*
- Attention'ın ara sonuçları (key/value) cache'lenebilir → **memoization**
- Cache **önek (prefix) bazlıdır:** payload'un başındaki ilk fark, o noktadan sonraki her şeyi geçersiz kılar
- Pratik sonuç: **sabit içerik başa, değişken içerik sona.** Sistem promptunun ortasına timestamp koymak tüm cache'i çöpe atar.
- Cache okuması hem ucuz hem hızlı — TTFT'yi doğrudan düşürür

**Demo D5: Pencere + Fatura Sayacı**
- Simüle sohbet; mesaj ekledikçe dolan buffer barı
- Bar dolunca compaction devreye girsin, eski turlar sıkışsın (animasyon)
- Yanda iki sayaç: **turdaki token** ve **kümülatif maliyet** — kuadratik büyüme grafikte görünsün
- Toggle: "prompt cache açık/kapalı" → aynı senaryonun iki faturası yan yana

---

### Bölüm 6 — Araç Çağırma Döngüsü ve Yapılandırılmış Çıktı

**GENİŞLETİLDİ.** Orijinal planda tek satırdı; kendi bölümünü hak ediyor.

**Çıktı token türleri**
Model üç tür token üretir: **düşünme (reasoning)**, **araç çağırma**, **nihai cevap**.

**Can alıcı nokta**
> Model aracı **çalıştırmaz.** Sadece araç şemasına uyan yapılandırılmış bir çıktı **üretir** — hâlâ token tahmini yapıyor, başka bir şey değil. Onu çalıştıran dış program (harness); sonucu alır, `tool_result` olarak `messages[]`'e ekler, **fonksiyonu baştan çağırır.**

Ajan döngüsünün tamamı bu: `çağır → çalıştır → sonucu ekle → tekrar çağır`. Sihir yok, `while` var.

Bu tek kavrayış şunları aynı anda çözüyor:
- Model dosyayı neden "göremiyor" (harness okuyup context'e koyana kadar)
- Neden izin soruyor (çalıştıran taraf harness, model değil)
- Araç sonuçları neden pencereyi yiyor
- Model neden internete "bakabiliyor" ama bilgisi güncellenmiyor (Bölüm 4'e bağlan)

**Yapılandırılmış çıktı (structured output)**
- Araç şemaları JSON Schema; model şemaya *uymaya çalışır*, garanti eden şey kısıtlı çözümleme (constrained decoding) uygulanıyorsa odur
- Şema açıklamaları prompt'un parçasıdır — kötü yazılmış bir `description` doğrudan yanlış araç seçimine yol açar. Yazılımcı kitle için doğrudan uygulanabilir bir tasarım kuralı.

**Demo D6: Agent Döngüsü**
- Next butonlu adım adım akış, her adımda **gerçek JSON blokları** görünür:
  `assistant: tool_use` → `harness çalıştırır` → `user: tool_result` → `assistant: ...`
- Sağ panelde `messages[]` dizisi her adımda büyüsün, token sayacı artsın
- Vurgu: model hiçbir adımda dış dünyaya dokunmuyor, sadece metin üretiyor

---

### Bölüm 7 — Halüsinasyon

**Çerçeve düzeltildi.** Orijinal planda halüsinasyon yalnızca "bilgi kesme tarihi" sorununa bağlanmıştı. Asıl mekanik sebep daha derin:

> Model her zaman **istatistiksel olarak makul devamı** üretir. Boru hattında "doğruluk kontrolü" diye bir aşama yok. Halüsinasyon bir bug değil, aynı mekanizmanın işe yaradığı durumla **aynı davranışın** başka bir görünümü.

Kesme tarihi bunun sadece bir tetikleyicisi.

**Yazılımcı kitle için asıl örnek: uydurulmuş API'ler**
Model var olmayan bir kütüphane fonksiyonu üretir — çünkü o isim, o kütüphanenin isimlendirme örüntüsüne **istatistiksel olarak uyuyor**. Bilgi "eskimiş" değil; o fonksiyon hiç var olmadı. İsim ne kadar makul görünüyorsa, uydurulmuş olma ihtimali o kadar sinsi.

**İçerik**
- Kesme tarihi sonrası için arama/dokümantasyon araçlarının rolü (Bölüm 6'ya bağlan)
- Araç kullanımı riski azaltır, sıfırlamaz — kök sebep mekanizmanın kendisi
- Yüksek riskli alanlar: API imzaları, sürüm numaraları, konfigürasyon anahtarları, tam alıntılar, az kullanılan kütüphaneler
- **Özgüven bir doğruluk sinyali değil.** Model olasılık dağılımı düşükken de aynı akıcılıkla yazar.

**Görsel: Örnek vitrini**
Yan yana iki kod bloğu — biri gerçek API, diğeri uydurma; ikisi de eşit derecede makul görünüyor. Cevap gizli, tıklayınca açılıyor.

---

### Bölüm 8 — Model Seviyeleri ve Efor (Reasoning Level)

**Kapsam daraltıldı: bu bölüm yalnızca MEKANİZMA anlatır.** Tavsiye tamamen Bölüm 9'a taşındı — orijinal planda 3. ve 4. bölümler birbirini tekrarlıyordu.

**İçerik**
- Farklı modeller (Opus, Sonnet, Haiku vb.) farklı parametre sayısı, eğitim verisi hacmi ve mimariye sahip. Kaba karşılık: kapasite ↔ gecikme ↔ maliyet üçgeni.
- **Efor seviyesi yükseltildiğinde fiziksel olarak olan tek şey:** model durma noktasına ulaşmadan önce **daha fazla düşünme tokenı** üretir. Daha detaylı plan, daha çok araç denemesi, daha derin analiz — hepsi bunun sonucu.
- Doğrudan sonuç: daha fazla çıktı tokenı → daha fazla süre → daha fazla maliyet
- **Durma politikası:** modelin "iş bitti" kararı da bir token tahmini. Erken bitirme davranışının kaynağı burada — ve bu yüzden efor ayarıyla düzeltilebiliyor (Bölüm 9).

**Görsel**
Aynı görevin düşük ve yüksek eforda ürettiği token akışının yan yana karşılaştırması: düşünme tokenları, araç çağrıları, nihai cevap — üçü ayrı renkte.

---

### Bölüm 9 — Doğru Model ve Efor Seçim Rehberi

**Kapsam: sıfır teori, tamamen karar aracı.**

**İçerik**
- **Basit ve mekanik görevler** (biçimlendirme, tekrarlı düzenleme, dar kapsamlı dönüşüm): düşük seviyeli model + varsayılan/düşük efor yeterli. Yüksek model veya efor seçmek boşa token ve süre.
- **Karmaşık ve belirsiz görevler** (mimari kararlar, kök sebep analizi, çok dosyalı refactor): üst seviye model + yüksek efor. Gelişmiş modellerin asıl farkı belirsizliği çözmede ortaya çıkıyor.
- **Atlama / eksik inceleme hataları:** model bir dosyayı gözden kaçırıyor veya işi erken bitiriyorsa — **modeli değiştirmek yerine efor seviyesini artırmak daha etkili.** Bu, rehberin en değerli maddesi; Bölüm 8'deki durma politikasına doğrudan bağlanıyor ve ayrı vurgulanmalı.

**Demo D7: Karar Aracı**
- Birkaç soru: görev tipi, belirsizlik düzeyi, dosya/kapsam büyüklüğü, gecikme vs kalite önceliği
- Çıktı: önerilen model + efor + tahmini token/maliyet karşılaştırması
- Yanında hızlı bakış için statik referans tablosu

---

## 4. Demo Envanteri (Geliştirme Listesi)

| # | Demo | Bölüm | Öncelik | Not |
|---|---|---|---|---|
| D1 | Payload inceleyici (gerçek JSON) | 1 | **Yüksek** | Sitenin vitrini; görsel yatırımın çoğu buraya |
| D2 | Canlı tokenizer + TR/EN + kod | 2 | **Yüksek** | Gerçek BPE tokenizer kütüphanesi gerekli |
| D3 | Logit gezgini | 3 | **Yüksek** | Önceden hesaplanmış örnek veri yeterli |
| D4 | Sampling parametreleri | 3 | Orta | D3 ile aynı veri setini paylaşır |
| D5 | Context penceresi + fatura sayacı | 5 | **Yüksek** | Cache açık/kapalı karşılaştırması dahil |
| D6 | Agent döngüsü (gerçek JSON blokları) | 6 | **Yüksek** | Next butonlu, `messages[]` büyümesi görünür |
| D7 | Model/efor karar aracı | 9 | Orta | Form + sonuç kartı |

**Not:** D3/D4 için canlı model çağrısı gerekmiyor — birkaç hazır senaryonun logit dağılımı önceden gömülebilir. Böylece site tamamen statik kalır: backend yok, API anahtarı yok, çalışma zamanı maliyeti yok.

---

## 5. Açık Kararlar

| Konu | Durum | Not |
|---|---|---|
| **Teknoloji seçimi** | ❓ **Karar bekliyor** | Tek dosya HTML/JS mi, React/Vite mi? |
| Tokenizer kaynağı | Açık | Gerçek BPE kütüphanesi (tarayıcıda WASM) mi, yaklaşık simülasyon mu? D2'nin inandırıcılığı buna bağlı |
| Dil | Türkçe | Teknik terimler İngilizce karşılıklarıyla birlikte |
| Sunum modu | Açık | Serbest kaydırma mı, bölüm bölüm ilerleme mi? |
| Kod bloğu vurgulama | Açık | JSON payload'lar için syntax highlighting gerekecek |
| Barındırma | Açık | Tamamen statik olacağı için her yerde çalışır |

**Öneri:** 7 demo ve 10 bölüm için bileşen yapısı (React/Vite) bakımı belirgin şekilde kolaylaştırır. Tek dosya HTML/JS teknik olarak mümkün ama D1/D5/D6'nın durum yönetimi tek dosyada hızla dağılır.

---

## 6. Anlatım İlkeleri (Geliştiriciye Notlar)

1. **Kitle yazılımcı — soyut kutucuk değil, gerçek payload göster.** D1 ve D6'da uydurma diyagram yerine gerçek JSON yapıları kullanılacak.
2. **Analojiler yazılım dünyasından:** lexer, buffer, memoization, salt okunur binary, request/response döngüsü. "İnsan gibi düşünüyor" tarzı metaforlardan kaçın — bu kitlede ters teper.
3. **Matematik mimari seviyede kalsın.** Embedding/attention/logits *ne yapar* ana akışta; türev ve katman detayı katlanır kutuda.
4. **Her bölümde çalışan bir demo var.** Anlatıp demo vermemek veya demo verip anlatmamak olmaz.
5. **Her bölümün bir "can alıcı noktası" var** (yukarıda işaretli). Görsel hiyerarşi onu öne çıkarmalı.
6. **Terim tuzaklarına dikkat:** "embedding" iki farklı anlamda kullanılıyor (Bölüm 3 notu).
7. **Mekanizmadan pratiğe bağla.** Her teknik açıklama, kullanıcının gerçekten yaşadığı bir duruma bağlanmalı: şişen fatura, düşen kalite, uydurulan API, atlanan dosya.

---

## 7. Kapsam Dışı (Bilinçli Olarak Çıkarıldı)

- Transformer mimarisinin katman katman çözümü, backprop matematiği
- Çoklu modalite (görsel/ses token'ları) — istenirse ayrı bölüm eklenebilir
- RAG / vektör veritabanları — sadece Bölüm 3'teki terim ayrımı kadar geçiyor
- Fine-tuning ve kendi modelini eğitme — Bölüm 4'te bir cümleyle konumlandırılıyor, açılmıyor
- Model benchmark karşılaştırmaları — hızla eskiyor, siteyi bakım yüküne sokar
- Prompt injection / güvenlik — Bölüm 1'de bir cümleyle değiniliyor; ayrı bir sunum konusu
