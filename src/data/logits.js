// D3 — Logit Gezgini için önceden hazırlanmış senaryolar.
// Olasılıklar temsilidir (gerçek bir modelin logit'lerinden ilham alınarak elle yazıldı).
// Yapı: her düğüm { t: token metni, p: olasılık, next: sonraki adayların listesi }
// next tanımlı değilse üretim o dalda biter (EOS).

const EOS = null

export const SCENARIOS = [
  {
    label: 'Türkçe cümle',
    prompt: "Türkiye'nin en kalabalık şehri",
    candidates: [
      {
        t: ' İstanbul',
        p: 0.83,
        next: [
          {
            t: "'dur",
            p: 0.64,
            next: [
              { t: '.', p: 0.9, next: EOS },
              { t: ' ve', p: 0.05, next: EOS },
              { t: ';', p: 0.03, next: EOS },
            ],
          },
          { t: ' olup', p: 0.11, next: EOS },
          { t: "'du", p: 0.08, next: EOS },
          { t: ',', p: 0.07, next: EOS },
          { t: ' olarak', p: 0.04, next: EOS },
        ],
      },
      {
        t: ' Ankara',
        p: 0.06,
        next: [
          { t: ' değil', p: 0.71, next: [{ t: ', İstanbul', p: 0.85, next: EOS }] },
          { t: "'dır", p: 0.12, next: EOS },
          { t: ' sanılsa', p: 0.09, next: EOS },
        ],
      },
      { t: ' hangisidir', p: 0.04, next: EOS },
      { t: ' tartışmasız', p: 0.03, next: EOS },
      { t: ' İzmir', p: 0.01, next: EOS },
    ],
  },
  {
    label: 'Kod tamamlama',
    prompt: 'def is_even(n):\n    return n',
    candidates: [
      {
        t: ' %',
        p: 0.87,
        next: [
          {
            t: ' 2',
            p: 0.97,
            next: [
              { t: ' ==', p: 0.94, next: [{ t: ' 0', p: 0.99, next: EOS }] },
              { t: ' is', p: 0.03, next: EOS },
            ],
          },
        ],
      },
      { t: ' &', p: 0.06, next: [{ t: ' 1', p: 0.92, next: [{ t: ' ==', p: 0.88, next: [{ t: ' 0', p: 0.97, next: EOS }] }] }] },
      { t: '.', p: 0.03, next: EOS },
      { t: ' //', p: 0.02, next: EOS },
      { t: ' if', p: 0.01, next: EOS },
    ],
  },
]
