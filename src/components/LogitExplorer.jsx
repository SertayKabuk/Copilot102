import React, { useState } from 'react'
import { Demo } from './shared.jsx'
import { SCENARIOS } from '../data/logits.js'

export default function LogitExplorer() {
  const [scenIdx, setScenIdx] = useState(0)
  const [picked, setPicked] = useState([]) // seçilen düğümlerin listesi

  const scenario = SCENARIOS[scenIdx]
  const current = picked.length ? picked[picked.length - 1].next : scenario.candidates
  const done = current === null
  const seq = scenario.prompt + picked.map((n) => n.t).join('')
  const lastPick = picked.length ? picked[picked.length - 1].t : null

  const reset = (idx = scenIdx) => {
    setScenIdx(idx)
    setPicked([])
  }

  return (
    <Demo tag="D3" name="Logit Gezgini — otoregresif döngüyü elle çevir">
      <div className="btn-row">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.label}
            className={`btn small ${i === scenIdx ? 'primary' : ''}`}
            onClick={() => reset(i)}
          >
            {s.label}
          </button>
        ))}
        <button className="btn small" onClick={() => reset()} disabled={!picked.length}>
          ↺ Sıfırla
        </button>
      </div>

      <p className="dim" style={{ fontSize: 13.5 }}>
        Aşağıdaki dizi modele gidiyor, model her token için bir olasılık dağılımı döndürüyor. Bir
        adaya tıkla → diziye eklenir → <strong>fonksiyon aynı diziyle baştan çağrılır</strong>.
        Normalde bu seçimi örnekleme (sampling) yapar; burada örnekleyici sensin.
      </p>

      <div className="seq-view">
        {scenario.prompt}
        {picked.slice(0, -1).map((n, i) => (
          <span key={i}>{n.t}</span>
        ))}
        {lastPick && <span className="seq-new">{lastPick}</span>}
        {!done && <span className="cursor" />}
        {done && <span className="dim">  ⟵ [EOS] üretim bitti</span>}
      </div>

      {!done && (
        <>
          <p style={{ margin: '14px 0 4px', fontSize: 13.5 }} className="dim">
            f(dizi) → sonraki token adayları ({picked.length + 1}. çağrı):
          </p>
          <div className="cand-list">
            {current.map((c) => (
              <button key={c.t} className="cand" onClick={() => setPicked([...picked, c])}>
                <span className="cand-tok">"{c.t.replace(/\n/g, '⏎')}"</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${c.p * 100}%` }} />
                </span>
                <span className="cand-p">{(c.p * 100).toFixed(0)}%</span>
              </button>
            ))}
          </div>
        </>
      )}

      {done && (
        <p style={{ marginTop: 14 }}>
          Dizi bitti — model "durma" kararını da bir token olarak <em>tahmin etti</em>. Farklı
          adaylara tıklayarak aynı prompttan farklı çıktılar üretebileceğini gör: model "cevabı"
          değil, <strong>her adımda bir dağılımı</strong> hesaplıyor.
        </p>
      )}
    </Demo>
  )
}
