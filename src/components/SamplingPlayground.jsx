import React, { useMemo, useState } from 'react'
import { Demo, Term } from './shared.jsx'

// Sabit bir "logit" seti: prompt = "Hata mesajına bakınca sorunun kaynağı"
const BASE = [
  { t: ' büyük', logit: 4.1 },
  { t: ' muhtemelen', logit: 3.8 },
  { t: ' veritabanı', logit: 3.2 },
  { t: ' açık', logit: 2.9 },
  { t: ' bağlantı', logit: 2.5 },
  { t: ' net', logit: 2.2 },
  { t: ' şu', logit: 1.9 },
  { t: ' config', logit: 1.5 },
  { t: ' tam', logit: 1.1 },
  { t: ' kesinlikle', logit: 0.8 },
  { t: ' ilginç', logit: 0.4 },
  { t: ' kozmik', logit: -1.5 },
]

function softmax(items, temp) {
  const T = Math.max(temp, 0.01)
  const max = Math.max(...items.map((i) => i.logit))
  const exps = items.map((i) => Math.exp((i.logit - max) / T))
  const sum = exps.reduce((a, b) => a + b, 0)
  return items.map((it, i) => ({ ...it, p: exps[i] / sum }))
}

const EXAMPLES = [
  { label: 'temperature = 0 (greedy)', out: 'Hata mesajına bakınca sorunun kaynağı büyük ihtimalle veritabanı bağlantı havuzunun dolması.' },
  { label: 'temperature = 0.7', out: 'Hata mesajına bakınca sorunun kaynağı muhtemelen bağlantı havuzu — pool limitini kontrol et.' },
  { label: 'temperature = 1.5', out: 'Hata mesajına bakınca sorunun kaynağı ilginç: config dosyasındaki timeout kozmik derecede düşük seçilmiş olabilir mi?' },
]

export default function SamplingPlayground() {
  const [temp, setTemp] = useState(1.0)
  const [topK, setTopK] = useState(12)
  const [topP, setTopP] = useState(1.0)
  const [samples, setSamples] = useState([])

  const dist = useMemo(() => {
    let items = softmax(BASE, temp).sort((a, b) => b.p - a.p)
    // top-k: ilk k aday kalır
    items = items.map((it, i) => ({ ...it, cutK: i >= topK }))
    // top-p: kümülatif olasılık p'yi aşana kadar olanlar kalır (canlı adaylar üzerinden)
    let cum = 0
    items = items.map((it) => {
      if (it.cutK) return { ...it, cutP: false }
      const wasIn = cum < topP
      cum += it.p
      return { ...it, cutP: !wasIn }
    })
    // kalanları yeniden normalize et
    const alive = items.filter((it) => !it.cutK && !it.cutP)
    const aliveSum = alive.reduce((a, b) => a + b.p, 0)
    return items.map((it) => ({
      ...it,
      dead: it.cutK || it.cutP,
      pFinal: it.cutK || it.cutP ? 0 : it.p / aliveSum,
    }))
  }, [temp, topK, topP])

  const sample = () => {
    const alive = dist.filter((d) => !d.dead)
    let r = Math.random()
    let chosen = alive[alive.length - 1]
    for (const d of alive) {
      r -= d.pFinal
      if (r <= 0) {
        chosen = d
        break
      }
    }
    setSamples((s) => [chosen.t.trim(), ...s].slice(0, 12))
  }

  return (
    <Demo tag="D4" name="Örnekleme Parametreleri — aynı dağılım, farklı kırpma">
      <p className="dim" style={{ fontSize: 13.5 }}>
        Prompt: <code className="inline-code">"Hata mesajına bakınca sorunun kaynağı"</code> — model bu
        adaylar için ham skorlar (logits) üretti. Slider'lar bu dağılımı nasıl şekillendiriyor, izle.
      </p>

      <div className="slider-row">
        <label><Term k="temperature">temperature</Term></label>
        <input type="range" min="0" max="2" step="0.05" value={temp} onChange={(e) => setTemp(+e.target.value)} />
        <span className="val">{temp.toFixed(2)}</span>
      </div>
      <div className="slider-row">
        <label><Term k="topk">top_k</Term></label>
        <input type="range" min="1" max="12" step="1" value={topK} onChange={(e) => setTopK(+e.target.value)} />
        <span className="val">{topK}</span>
      </div>
      <div className="slider-row">
        <label><Term k="topp">top_p</Term></label>
        <input type="range" min="0.05" max="1" step="0.05" value={topP} onChange={(e) => setTopP(+e.target.value)} />
        <span className="val">{topP.toFixed(2)}</span>
      </div>

      <div className="cand-list">
        {dist.map((d) => (
          <div key={d.t} className={`cand ${d.dead ? 'dead' : ''}`} style={{ cursor: 'default' }}>
            <span className="cand-tok">"{d.t}"</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${(d.dead ? d.p : d.pFinal) * 100}%` }} />
            </span>
            <span className="cand-p">{d.dead ? 'kırpıldı' : `${(d.pFinal * 100).toFixed(1)}%`}</span>
          </div>
        ))}
      </div>

      <div className="btn-row" style={{ alignItems: 'center' }}>
        <button className="btn primary" onClick={sample}>🎲 Dağılımdan örnekle</button>
        {samples.length > 0 && (
          <span className="mono" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            çekilenler: {samples.join(', ')}
          </span>
        )}
      </div>

      <h3 style={{ marginTop: 24 }}>Aynı prompt, farklı ayarlar — örnek tam çıktılar</h3>
      {EXAMPLES.map((e) => (
        <div key={e.label} style={{ marginBottom: 10 }}>
          <span className="badge">{e.label}</span>
          <p className="dim" style={{ fontSize: 13.5, marginTop: 4 }}>{e.out}</p>
        </div>
      ))}
    </Demo>
  )
}
