import React, { useState } from 'react'
import { Demo } from './shared.jsx'

const QUESTIONS = [
  {
    key: 'task',
    label: 'Görev tipi ne?',
    opts: [
      { v: 0, label: 'Mekanik (biçimlendirme, rename, tekrarlı düzenleme)' },
      { v: 1, label: 'Standart (bug fix, küçük özellik, test yazma)' },
      { v: 2, label: 'Karmaşık (mimari karar, kök sebep analizi, tasarım)' },
    ],
  },
  {
    key: 'ambiguity',
    label: 'Belirsizlik düzeyi?',
    opts: [
      { v: 0, label: 'Net tanımlı — ne yapılacağı belli' },
      { v: 1, label: 'Kısmen belirsiz — biraz keşif gerekiyor' },
      { v: 2, label: 'Açık uçlu — problemi de model bulacak' },
    ],
  },
  {
    key: 'scope',
    label: 'Kapsam büyüklüğü?',
    opts: [
      { v: 0, label: 'Tek dosya / tek fonksiyon' },
      { v: 1, label: 'Birkaç dosya' },
      { v: 2, label: 'Repo geneli / çok modüllü' },
    ],
  },
  {
    key: 'priority',
    label: 'Öncelik ne?',
    opts: [
      { v: 0, label: 'Hız ve maliyet' },
      { v: 1, label: 'Denge' },
      { v: 2, label: 'Kalite — maliyet ikincil' },
    ],
  },
]

const TIERS = [
  { name: 'Küçük model (Haiku sınıfı)', cost: '×1', note: 'düşük gecikme, düşük maliyet' },
  { name: 'Orta model (Sonnet sınıfı)', cost: '×3–5', note: 'çoğu günlük iş için doğru denge' },
  { name: 'Üst model (Opus sınıfı)', cost: '×15–25', note: 'belirsizliği çözme gücü asıl burada' },
]
const EFFORTS = ['düşük / varsayılan', 'orta', 'yüksek']

export default function DecisionTool() {
  const [ans, setAns] = useState({ task: null, ambiguity: null, scope: null, priority: null })
  const [skipping, setSkipping] = useState(false)
  const complete = Object.values(ans).every((v) => v !== null)

  let tier = 0
  let effort = 0
  if (complete) {
    const score = ans.task * 2 + ans.ambiguity * 2 + ans.scope + ans.priority
    tier = score >= 7 ? 2 : score >= 3 ? 1 : 0
    effort = ans.ambiguity === 2 || ans.scope === 2 ? 2 : ans.task === 2 ? 2 : score >= 3 ? 1 : 0
    if (skipping) effort = 2
  }

  return (
    <Demo tag="D7" name="Model / Efor Karar Aracı">
      {QUESTIONS.map((q) => (
        <div key={q.key} className="dt-q">
          <div className="dt-label">{q.label}</div>
          <div className="dt-opts">
            {q.opts.map((o) => (
              <button
                key={o.v}
                className={`dt-opt ${ans[q.key] === o.v ? 'sel' : ''}`}
                onClick={() => setAns({ ...ans, [q.key]: o.v })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="dt-q">
        <div className="dt-label">Mevcut kurulumda model dosya atlıyor / işi erken mi bitiriyor?</div>
        <div className="dt-opts">
          <button className={`dt-opt ${skipping ? 'sel' : ''}`} onClick={() => setSkipping(true)}>Evet, öyle bir sorun var</button>
          <button className={`dt-opt ${!skipping ? 'sel' : ''}`} onClick={() => setSkipping(false)}>Hayır</button>
        </div>
      </div>

      {complete ? (
        <div className="result-card">
          <div className="rc-title">Öneri</div>
          <div className="rc-model">{TIERS[tier].name}</div>
          <p style={{ margin: '6px 0' }}>
            Efor: <strong>{EFFORTS[effort]}</strong> · Göreli maliyet: <strong>{TIERS[tier].cost}</strong>
            <span className="dim"> ({TIERS[tier].note})</span>
          </p>
          {skipping && (
            <p style={{ fontSize: 14, color: 'var(--yellow)', marginBottom: 0 }}>
              ⚠ Atlama / erken bitirme sorunu için ilk hamle <strong>modeli büyütmek değil, efor
              seviyesini artırmak</strong>. Erken bitirme bir "durma politikası" davranışı (Bölüm 8) —
              daha fazla düşünme tokenına izin vermek onu doğrudan hedefler.
            </p>
          )}
          {tier === 0 && (
            <p className="dim" style={{ fontSize: 13.5, marginBottom: 0 }}>
              Bu iş için büyük model seçmek boşa token ve süre: mekanik görevlerde üst modellerin
              farkı ölçülemeyecek kadar küçük.
            </p>
          )}
          {tier === 2 && (
            <p className="dim" style={{ fontSize: 13.5, marginBottom: 0 }}>
              Belirsizlik yüksek: üst modellerin asıl farkı tam burada, belirsizliği çözme ve çok
              adımlı planlamada ortaya çıkıyor.
            </p>
          )}
        </div>
      ) : (
        <p className="dim">Öneri için dört soruyu da cevapla.</p>
      )}

      <h3>Hızlı referans</h3>
      <table className="ref-table">
        <thead>
          <tr><th>Görev</th><th>Model</th><th>Efor</th><th>Neden</th></tr>
        </thead>
        <tbody>
          <tr><td>Toplu rename, format, boilerplate</td><td>Küçük</td><td>Düşük</td><td>Belirsizlik yok; büyük model fark yaratmaz</td></tr>
          <tr><td>Bug fix, test yazımı, küçük özellik</td><td>Orta</td><td>Orta</td><td>Günlük işlerin dengesi</td></tr>
          <tr><td>Çok dosyalı refactor</td><td>Orta/Üst</td><td>Yüksek</td><td>Atlamayı önleyen şey efor</td></tr>
          <tr><td>Mimari karar, kök sebep analizi</td><td>Üst</td><td>Yüksek</td><td>Belirsizliği çözme kapasitesi</td></tr>
          <tr><td>Model dosya atlıyor / erken bitiriyor</td><td>Aynı kalsın</td><td>Artır</td><td>Durma politikası sorunu — efor sorunu</td></tr>
        </tbody>
      </table>
    </Demo>
  )
}
