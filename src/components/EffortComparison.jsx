import React from 'react'

// Aynı görev ("bu testin neden flaky olduğunu bul ve düzelt") — iki efor seviyesi.
// Segment genişlikleri temsili token miktarları.
const LOW = [
  ['think', 30], ['tool', 14], ['answer', 46],
]
const HIGH = [
  ['think', 90], ['tool', 14], ['think', 34], ['tool', 18], ['tool', 12],
  ['think', 50], ['tool', 16], ['think', 26], ['tool', 14], ['answer', 52],
]

function Stream({ segs }) {
  return (
    <div className="stream">
      {segs.map(([kind, w], i) => (
        <span key={i} className={`seg ${kind}`} style={{ width: w * 2.4 }} title={kind} />
      ))}
    </div>
  )
}

export default function EffortComparison() {
  const sum = (a) => a.reduce((s, [, w]) => s + w, 0)
  return (
    <div>
      <div className="stream-legend">
        <span><span className="sw" style={{ background: '#6e40c9', display: 'inline-block', width: 11, height: 11, borderRadius: 3, marginRight: 5 }} />düşünme (reasoning) tokenları</span>
        <span><span className="sw" style={{ background: '#d29922', display: 'inline-block', width: 11, height: 11, borderRadius: 3, marginRight: 5 }} />araç çağrıları</span>
        <span><span className="sw" style={{ background: '#3fb950', display: 'inline-block', width: 11, height: 11, borderRadius: 3, marginRight: 5 }} />nihai cevap</span>
      </div>
      <div className="effort-grid">
        <div className="effort-col">
          <h4>Düşük efor <span className="dim" style={{ fontWeight: 400 }}>— ~{sum(LOW) * 10} çıktı tokenı</span></h4>
          <Stream segs={LOW} />
          <p className="dim" style={{ fontSize: 13, marginTop: 10 }}>
            Kısa plan → tek araç bakışı → cevap. Hızlı ve ucuz; ama ilk makul hipotezi doğru kabul
            etme riski yüksek.
          </p>
        </div>
        <div className="effort-col">
          <h4>Yüksek efor <span className="dim" style={{ fontWeight: 400 }}>— ~{sum(HIGH) * 10} çıktı tokenı</span></h4>
          <Stream segs={HIGH} />
          <p className="dim" style={{ fontSize: 13, marginTop: 10 }}>
            Uzun plan → birden çok araç turu → hipotez revizyonu → cevap. Aynı model, aynı
            ağırlıklar; tek fark durmadan önce <strong>daha fazla token üretmesi</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
