# LLM'ler Nasıl Çalışır — İnteraktif Eğitim Sitesi

Yazılımcılara yönelik, [plan.md](plan.md)'deki kurguyu izleyen tek sayfalık interaktif sunum.
Ana anlatı: **LLM stateless bir fonksiyondur** — `f(token[]) → sonraki token için olasılık dağılımı`.

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # statik çıktı: dist/
```

Site tamamen statiktir: backend yok, API anahtarı yok, çalışma zamanı LLM çağrısı yok.
`dist/` klasörü herhangi bir statik hosta (GitHub Pages, S3, nginx…) konabilir.

## GitHub Pages'e dağıtım

`.github/workflows/deploy.yml` her `main` push'unda siteyi build edip GitHub Pages'e yayınlar.
Tek seferlik kurulum:

1. Repoyu GitHub'a push'la.
2. GitHub'da **Settings → Pages → Build and deployment → Source** olarak **GitHub Actions** seç.
3. Sonraki push'ta site `https://<kullanıcı>.github.io/<repo>/` adresinde yayında olur
   (Vite `base: './'` kullandığı için alt dizinde sorunsuz çalışır).

## Bölümler ve demolar

| Bölüm | İçerik | Demo |
|---|---|---|
| 0 | Stateless fonksiyon (açılış) | — |
| 1 | İstek gövdesi, prompt paketleme | **D1** Payload İnceleyici (canlı token sayımı) |
| 2 | Tokenizasyon | **D2** Canlı tokenizer (gerçek BPE, `gpt-tokenizer` / o200k_base) |
| 3 | Çıkarım, örnekleme, streaming | **D3** Logit Gezgini + **D4** Sampling parametreleri |
| 4 | Ağırlıklar nereden geldi | statik pipeline görseli |
| 5 | Context penceresi, cache, maliyet | **D5** Pencere + fatura sayacı (compaction animasyonlu) |
| 6 | Araç döngüsü, structured output | **D6** Adım adım ajan döngüsü (gerçek JSON blokları) |
| 7 | Halüsinasyon | gerçek/uydurma API quiz'i |
| 8 | Model seviyeleri & efor | düşük/yüksek efor token akışı karşılaştırması |
| 9 | Seçim rehberi | **D7** Model/efor karar aracı |

## Teknik notlar

- **Tokenizer:** `gpt-tokenizer` (o200k_base) tarayıcıda çalışır; D1 ve D2'deki tüm token
  sayıları gerçek BPE ile canlı hesaplanır. Claude'un tokenizer'ı birebir aynı değildir;
  sitede bu, temsili olduğu notuyla belirtilir. BPE sözlüğü nedeniyle bundle ~1 MB gzip'tir.
- **D3/D4 logit verileri** elle hazırlanmış temsili dağılımlardır (plan.md §4 notu gereği —
  canlı model çağrısı bilinçli olarak yok).
- **D5 fiyatları** temsilidir; sitede de böyle etiketlenir.
- Sunum modu: sol menüden bölüme atlanabilir, serbest kaydırma (scroll-spy ile aktif bölüm izlenir).
