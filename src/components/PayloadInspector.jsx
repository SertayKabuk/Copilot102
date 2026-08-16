import React, { useMemo, useState } from 'react'
import { Demo, JsonBlock, Stat, Term } from './shared.jsx'
import { countTokens } from '../lib/tokenize.js'
import { SYSTEM_PROMPT, TOOLS, MEMORY, TURN1_MESSAGES, TURN3_MESSAGES } from '../data/payload.js'

export default function PayloadInspector() {
  const [tab, setTab] = useState(0)

  const data = useMemo(() => {
    const sysTok = countTokens(SYSTEM_PROMPT)
    const toolTok = countTokens(TOOLS)
    const memTok = countTokens(MEMORY)
    const t1 = countTokens(TURN1_MESSAGES)
    const t3 = countTokens(TURN3_MESSAGES)
    const userTok = countTokens('merhaba')
    return { sysTok, toolTok, memTok, t1, t3, userTok }
  }, [])

  const messages = tab === 0 ? TURN1_MESSAGES : TURN3_MESSAGES
  const msgTok = tab === 0 ? data.t1 : data.t3
  const total = data.sysTok + data.toolTok + data.memTok + msgTok

  return (
    <Demo tag="D1" name="Payload İnceleyici — endpoint'e giden gerçek istek gövdesi">
      <p className="dim">
        Kullanıcı sadece <code className="inline-code">merhaba</code> yazdı. Aşağıda API'ye{' '}
        <em>gerçekten</em> POST edilen gövdenin katmanları var — blokları açıp inceleyin.{' '}
        <Term k="token">Token</Term> sayıları gerçek bir <Term k="bpe">BPE</Term> tokenizer ile
        canlı hesaplanıyor.
      </p>

      <div className="tabs">
        <button className={tab === 0 ? 'active' : ''} onClick={() => setTab(0)}>
          1. tur: "merhaba"
        </button>
        <button className={tab === 1 ? 'active' : ''} onClick={() => setTab(1)}>
          3 tur sonra (aynı sohbet)
        </button>
      </div>

      <JsonBlock
        name="system"
        desc="Sistem istemi — kimlik, kurallar, ortam bilgisi"
        tokens={data.sysTok}
        value={SYSTEM_PROMPT}
      />
      <JsonBlock
        name="tools"
        desc="Araç tanımları — her biri bir JSON şeması"
        tokens={data.toolTok}
        value={TOOLS}
      />
      <JsonBlock
        name="(memory) CLAUDE.md"
        desc="Bellek dosyası — system'in sonuna eklenir"
        tokens={data.memTok}
        value={MEMORY}
      />
      <JsonBlock
        name="messages[]"
        desc={tab === 0 ? 'Sohbet geçmişi — henüz tek mesaj' : 'Sohbet geçmişi — TÜM turlar, araç sonuçları dahil'}
        tokens={msgTok}
        value={messages}
        defaultOpen={true}
        badgeClass={tab === 1 ? 'warn' : ''}
      />

      <div className="total-bar">
        <div>
          <strong>{data.userTok} token yazdın</strong>
          <span className="dim"> ("merhaba") </span>→ <span className="big">{total.toLocaleString('tr-TR')} token gönderildi</span>
        </div>
        <div className="dim" style={{ fontSize: 13 }}>
          {tab === 0
            ? `girdinin ~${Math.round(total / data.userTok)} katı — henüz 1. turdayız`
            : 'geçmiş + araç sonuçları her turda yeniden gönderiliyor'}
        </div>
      </div>

      <div className="stat-row" style={{ marginTop: 14 }}>
        <Stat label="system + tools + memory" value={(data.sysTok + data.toolTok + data.memTok).toLocaleString('tr-TR')} sub="her turda sabit tekrar" />
        <Stat label="messages[] (1. tur)" value={data.t1.toLocaleString('tr-TR')} />
        <Stat label="messages[] (3 tur sonra)" value={data.t3.toLocaleString('tr-TR')} hot sub={`${(data.t3 / Math.max(data.t1, 1)).toFixed(0)} kat büyüdü`} />
      </div>

      <p className="dim" style={{ fontSize: 13, marginTop: 10 }}>
        Not: Bu, kısaltılmış temsili bir payload. Gerçek bir kodlama ajanında (Claude Code vb.)
        system + tools bloğu tek başına ~10–20 bin tokendir.
      </p>
    </Demo>
  )
}
