import React, { useMemo, useState } from 'react'
import { Demo, Stat } from './shared.jsx'

// Temsili sayılar — mekanizmayı göstermek için, gerçek fiyat listesi değil.
const WINDOW = 8000 // demo penceresi (gerçekte 200k+, mekanizma aynı)
const SYS = 1800 // system + tools + memory (her turda sabit)
const SUMMARY_TOK = 260
const PRICE_IN = 3 / 1e6 // $/token (temsili)
const PRICE_OUT = 15 / 1e6
const CACHE_READ = 0.3 / 1e6 // önbellekten okuma: girdinin ~%10'u

const SCRIPT = [
  { user: 70, asst: 280, label: 'soru' },
  { user: 55, asst: 340, label: 'takip sorusu' },
  { user: 90, asst: 520, label: 'dosya okutma (tool_result dahil)' },
  { user: 60, asst: 640, label: 'refactor isteği' },
  { user: 45, asst: 380, label: 'test çalıştırma' },
  { user: 80, asst: 700, label: 'çok dosyalı düzenleme' },
  { user: 50, asst: 420, label: 'hata ayıklama' },
  { user: 65, asst: 560, label: 'yeni özellik' },
  { user: 40, asst: 300, label: 'gözden geçirme' },
  { user: 55, asst: 480, label: 'dokümantasyon' },
]

function simulate(nTurns) {
  // her tur için: girdi (sys + geçmiş + yeni user), çıktı (asst)
  let turns = [] // pencere içindeki turlar {user, asst}
  let summary = 0
  let rows = []
  let cumNoCache = 0
  let cumCache = 0
  let cumTokensSent = 0
  let compactions = 0

  for (let i = 0; i < nTurns; i++) {
    const s = SCRIPT[i % SCRIPT.length]
    const histBefore = summary + turns.reduce((a, t) => a + t.user + t.asst, 0)
    const inputTok = SYS + histBefore + s.user
    // cache: önceki turun sonunda pencerede ne varsa prefix olarak cache'li
    const cachedPart = i === 0 ? 0 : SYS + histBefore
    const freshPart = inputTok - cachedPart
    const costNoCache = inputTok * PRICE_IN + s.asst * PRICE_OUT
    const costCache = cachedPart * CACHE_READ + freshPart * PRICE_IN + s.asst * PRICE_OUT

    cumNoCache += costNoCache
    cumCache += costCache
    cumTokensSent += inputTok
    turns.push({ user: s.user, asst: s.asst })

    // pencere doldu mu? → compaction: en eski turlar özete sıkışır (son 3 tur kalır)
    let compacted = false
    while (SYS + summary + turns.reduce((a, t) => a + t.user + t.asst, 0) > WINDOW && turns.length > 3) {
      const old = turns.splice(0, turns.length - 3)
      summary = SUMMARY_TOK + Math.round(summary * 0.5)
      compacted = true
      compactions++
      void old
    }

    rows.push({ turn: i + 1, inputTok, outTok: s.asst, cumNoCache, cumCache, cumTokensSent, compacted, label: s.label })
  }
  return { rows, turns, summary, compactions }
}

function Chart({ rows }) {
  const W = 560
  const H = 180
  const pad = 36
  const maxY = Math.max(...rows.map((r) => r.cumTokensSent), 1)
  const x = (i) => pad + (i / Math.max(rows.length - 1, 1)) * (W - pad - 10)
  const y = (v) => H - 24 - (v / maxY) * (H - 40)
  const pts = rows.map((r, i) => `${x(i)},${y(r.cumTokensSent)}`).join(' ')
  // lineer referans: ilk turun girdisi her turda aynı kalsaydı
  const lin = rows.map((r, i) => `${x(i)},${y(rows[0].inputTok * (i + 1))}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <line x1={pad} y1={H - 24} x2={W - 8} y2={H - 24} stroke="var(--border)" />
      <line x1={pad} y1={8} x2={pad} y2={H - 24} stroke="var(--border)" />
      {rows.length > 1 && <polyline points={lin} fill="none" stroke="#9198a1" strokeDasharray="4 4" strokeWidth="1.5" />}
      {rows.length > 1 && <polyline points={pts} fill="none" stroke="#f85149" strokeWidth="2.5" />}
      {rows.map((r, i) => (
        <circle key={i} cx={x(i)} cy={y(r.cumTokensSent)} r="3" fill="#f85149" />
      ))}
      <text x={pad + 4} y={16} fill="#f85149" fontSize="11">kümülatif gönderilen token (gerçek)</text>
      <text x={pad + 4} y={30} fill="#9198a1" fontSize="11">"her tur eşit olsaydı" (lineer referans)</text>
      <text x={W - 60} y={H - 8} fill="#9198a1" fontSize="10">tur →</text>
    </svg>
  )
}

export default function ContextWindowDemo() {
  const [n, setN] = useState(1)
  const [cacheOn, setCacheOn] = useState(true)
  const sim = useMemo(() => simulate(n), [n])
  const last = sim.rows[sim.rows.length - 1]
  const windowUsed = SYS + sim.summary + sim.turns.reduce((a, t) => a + t.user + t.asst, 0)

  return (
    <Demo tag="D5" name="Context Penceresi + Fatura Sayacı">
      <div className="btn-row" style={{ alignItems: 'center' }}>
        <button className="btn primary" onClick={() => setN(n + 1)}>💬 Mesaj gönder (tur {n + 1})</button>
        <button className="btn" onClick={() => setN(1)} disabled={n === 1}>↺ Sıfırla</button>
        <span className="dim" style={{ fontSize: 13 }}>
          son tur: {last.label}
          {last.compacted && <strong style={{ color: 'var(--yellow)' }}> — ⚠ compaction tetiklendi!</strong>}
        </span>
      </div>

      <p className="dim" style={{ fontSize: 13, margin: '10px 0 0' }}>
        Pencere doluluğu ({windowUsed.toLocaleString('tr-TR')} / {WINDOW.toLocaleString('tr-TR')} token
        — demo için küçültülmüş pencere):
      </p>
      <div className="buffer-track">
        <div className="buffer-seg sys" style={{ width: `${(SYS / WINDOW) * 100}%` }} title="system + tools" />
        {sim.summary > 0 && (
          <div className="buffer-seg summary" style={{ width: `${(sim.summary / WINDOW) * 100}%` }} title="özet (compaction)" />
        )}
        {sim.turns.map((t, i) => (
          <div
            key={i}
            className={`buffer-seg hist ${i % 2 ? 'odd' : ''}`}
            style={{ width: `${((t.user + t.asst) / WINDOW) * 100}%` }}
            title={`tur: ${t.user + t.asst} token`}
          />
        ))}
      </div>
      <div className="buffer-legend">
        <span><span className="sw" style={{ background: '#6e40c9' }} />system + tools (sabit)</span>
        <span><span className="sw" style={{ background: '#d29922' }} />özet — compaction sonrası kayıplı sıkıştırma</span>
        <span><span className="sw" style={{ background: '#1f6feb' }} />sohbet turları</span>
      </div>
      {sim.compactions > 0 && (
        <p style={{ fontSize: 13.5, color: 'var(--yellow)' }}>
          Pencere {sim.compactions} kez taştı: en eski turlar {SUMMARY_TOK}+ tokenlık bir özete
          sıkıştırıldı. Taşma yok — <strong>veri kaybı</strong> var. Model artık o turların özetini
          "hatırlıyor", kendisini değil.
        </p>
      )}

      <div className="stat-row">
        <Stat label="Bu turda gönderilen" value={last.inputTok.toLocaleString('tr-TR')} sub="girdi tokenı (sys + tüm geçmiş)" />
        <Stat label="Kümülatif gönderilen" value={last.cumTokensSent.toLocaleString('tr-TR')} hot sub={`${n} turda — tur sayısıyla kuadratik`} />
        <Stat
          label={cacheOn ? 'Fatura (cache AÇIK)' : 'Fatura (cache KAPALI)'}
          value={`$${(cacheOn ? last.cumCache : last.cumNoCache).toFixed(4)}`}
          sub="temsili birim fiyatlarla"
        />
      </div>

      <div className="toggle-row">
        <button className={`toggle ${cacheOn ? 'on' : ''}`} onClick={() => setCacheOn(!cacheOn)} aria-label="prompt cache">
          <span className="knob" />
        </button>
        <span>prompt caching {cacheOn ? 'açık' : 'kapalı'}</span>
        <span className="dim" style={{ fontSize: 13 }}>
          — iki fatura yan yana: <span className="mono">${last.cumNoCache.toFixed(4)}</span> (kapalı) vs{' '}
          <span className="mono" style={{ color: 'var(--green)' }}>${last.cumCache.toFixed(4)}</span> (açık)
          {n > 2 && <> → <strong style={{ color: 'var(--green)' }}>%{Math.round((1 - last.cumCache / last.cumNoCache) * 100)} tasarruf</strong></>}
        </span>
      </div>

      <div className="chart-box">
        <Chart rows={sim.rows} />
      </div>

      <p className="dim" style={{ fontSize: 13, marginTop: 10 }}>
        Fiyatlar temsilidir (girdi $3/M, çıktı $15/M, cache okuma $0.30/M oranları güncel modellerin
        tipik oranlarını yansıtır) — güncel rakamlar için sağlayıcının fiyat sayfasına bakın.
      </p>
    </Demo>
  )
}
