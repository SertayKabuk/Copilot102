import React, { useMemo, useState } from 'react'
import { Demo, Stat, Term } from './shared.jsx'
import { tokenize, countTokens } from '../lib/tokenize.js'

const PRESETS = [
  {
    label: 'Kod bloğu',
    text: `def calculate_user_discount_percentage(user):\n    if user.is_premium_member:\n        return 0.25\n    return 0.05`,
  },
  {
    label: 'Türkçe cümle',
    text: 'Siparişiniz başarıyla oluşturuldu, kargoya verildiğinde bilgilendirileceksiniz.',
  },
  {
    label: 'Aynısı İngilizce',
    text: 'Your order has been created successfully, you will be notified when it ships.',
  },
  { label: 'Uzun tanımlayıcı', text: 'getUserAuthenticationTokenExpirationTimestamp' },
  { label: 'strawberry', text: 'How many r letters are there in strawberry?' },
  { label: 'Uzun sayı', text: 'Toplam tutar 4835721609 TL olarak hesaplandı.' },
]

const TR_SAMPLE = PRESETS[1].text
const EN_SAMPLE = PRESETS[2].text

export default function LiveTokenizer() {
  const [text, setText] = useState(PRESETS[1].text)
  const tokens = useMemo(() => tokenize(text), [text])
  const compare = useMemo(
    () => ({ tr: countTokens(TR_SAMPLE), en: countTokens(EN_SAMPLE) }),
    [],
  )
  const chars = text.length

  return (
    <Demo
      tag="D2"
      name={
        <>
          Canlı Tokenizer — gerçek <Term k="bpe">BPE</Term> (o200k_base), tarayıcıda çalışıyor
        </>
      }
    >
      <div className="btn-row">
        {PRESETS.map((p) => (
          <button key={p.label} className="btn small" onClick={() => setText(p.text)}>
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        className="input"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Bir şeyler yaz…"
      />

      <div className="token-strip">
        {tokens.map((t, i) => (
          <span key={i} className={`tok c${i % 6}`} title={`token id: ${t.id}`}>
            {t.piece.replace(/ /g, '·').replace(/\n/g, '⏎')}
            <span className="tok-id">{t.id}</span>
          </span>
        ))}
      </div>
      <p className="dim" style={{ fontSize: 12 }}>
        · = boşluk, ⏎ = satır sonu. Kutucuğun altındaki sayı token ID'si — modele giden şey bu tamsayı dizisi.
      </p>

      <div className="stat-row">
        <Stat label="Karakter" value={chars} />
        <Stat label="Token" value={tokens.length} sub={chars ? `${(chars / Math.max(tokens.length, 1)).toFixed(1)} karakter/token` : ''} />
        <Stat
          label="TR / EN karşılaştırma"
          value={`${compare.tr} / ${compare.en}`}
          hot
          sub={`aynı cümle: Türkçe ${(compare.tr / compare.en).toFixed(1)} kat token`}
        />
      </div>

      <p className="dim" style={{ fontSize: 13 }}>
        Aynı içeriğin Türkçesi daha çok token harcıyor → aynı iş için{' '}
        <strong>daha yüksek maliyet ve daha hızlı dolan context penceresi</strong>. Uzun sistem
        promptlarını İngilizce yazmanın operasyonel bir sebebi var.
      </p>
    </Demo>
  )
}
