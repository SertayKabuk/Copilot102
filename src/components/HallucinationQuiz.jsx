import React, { useState } from 'react'

const PAIRS = [
  {
    lang: 'Python / pandas',
    a: { code: "df.drop_duplicates(subset=['email'], keep='last')", real: true },
    b: { code: "df.remove_duplicates(columns=['email'], strategy='last')", real: false },
    note: "remove_duplicates hiç var olmadı — ama pandas'ın isimlendirme örüntüsüne istatistiksel olarak mükemmel uyuyor. Sinsi olan da bu.",
  },
  {
    lang: 'Python / requests',
    a: { code: 'requests.get(url, max_wait=5, retry_count=3)', real: false },
    b: { code: 'requests.get(url, timeout=5)', real: true },
    note: 'retry_count parametresi makul görünüyor; gerçekte retry için ayrı bir HTTPAdapter kurmak gerekir. Model "olması gerekeni" üretti, olanı değil.',
  },
  {
    lang: 'JavaScript / fetch',
    a: { code: 'const data = await response.json()', real: true },
    b: { code: 'const data = await response.parseBody({ as: "json" })', real: false },
    note: 'İki imza da aynı derecede akıcı okunuyor. Akıcılık bir doğruluk sinyali değil — model düşük olasılıklı dağılımdan da aynı özgüvenle yazar.',
  },
]

function Card({ item, revealed, onClick }) {
  const cls = revealed ? (item.real ? 'quiz-card revealed-real' : 'quiz-card revealed-fake') : 'quiz-card'
  return (
    <div className={cls} onClick={onClick}>
      <pre>{item.code}</pre>
      {revealed ? (
        <div className={`verdict ${item.real ? 'real' : 'fake'}`}>
          {item.real ? '✓ GERÇEK API' : '✗ UYDURMA — bu fonksiyon yok'}
        </div>
      ) : (
        <div className="verdict dim" style={{ color: 'var(--text-dim)' }}>Hangisi gerçek? Tıkla →</div>
      )}
    </div>
  )
}

export default function HallucinationQuiz() {
  const [revealed, setRevealed] = useState({})
  return (
    <div>
      {PAIRS.map((p, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <span className="badge">{p.lang}</span>
          <div className="quiz-grid">
            <Card item={p.a} revealed={revealed[i]} onClick={() => setRevealed({ ...revealed, [i]: true })} />
            <Card item={p.b} revealed={revealed[i]} onClick={() => setRevealed({ ...revealed, [i]: true })} />
          </div>
          {revealed[i] && <p className="dim" style={{ fontSize: 13.5 }}>{p.note}</p>}
        </div>
      ))}
    </div>
  )
}
