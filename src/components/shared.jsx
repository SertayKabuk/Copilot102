import React, { useState } from 'react'
import { GLOSSARY } from '../data/glossary.js'

// Teknik terim: noktalı alt çizgi + hover/focus tooltip. <Term k="bpe">BPE</Term>
export function Term({ k, children }) {
  const g = GLOSSARY[k]
  if (!g) return children ?? null
  return (
    <span className="term" tabIndex={0}>
      {children ?? g.term}
      <span className="tip" role="tooltip">
        <b>{g.term}</b> — {g.def}
      </span>
    </span>
  )
}

export function Section({ id, num, title, accent, children }) {
  return (
    <section className="chapter" id={id} style={accent ? { '--sec': accent } : undefined}>
      <div className="chapter-inner">
        <div className="sec-ghost" aria-hidden="true">{num}</div>
        <div className="kicker">Bölüm {num}</div>
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  )
}

export function Callout({ label = 'Can alıcı nokta', warn = false, children }) {
  return (
    <div className={warn ? 'callout warn' : 'callout'}>
      <div className="callout-label">{label}</div>
      {children}
    </div>
  )
}

export function DeepDive({ title, children }) {
  return (
    <details className="deep">
      <summary>🔬 Derinlemesine: {title}</summary>
      <div className="deep-body">{children}</div>
    </details>
  )
}

export function Demo({ tag, name, children }) {
  return (
    <div className="demo">
      <div className="demo-head">
        <span className="demo-tag">{tag}</span>
        <span className="demo-name">{name}</span>
      </div>
      <div className="demo-body">{children}</div>
    </div>
  )
}

// JSON'u basit syntax highlighting ile render eder
export function JsonPre({ value }) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  const html = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
      (match, str, colon, bool) => {
        if (str) return colon ? `<span class="j-key">${str}</span>${colon}` : `<span class="j-str">${str}</span>`
        if (bool) return `<span class="j-bool">${bool}</span>`
        return `<span class="j-num">${match}</span>`
      },
    )
  return <pre className="json" dangerouslySetInnerHTML={{ __html: html }} />
}

export function JsonBlock({ name, desc, tokens, value, defaultOpen = false, badgeClass = '' }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="json-block">
      <div className="json-block-head" onClick={() => setOpen(!open)}>
        <span className="chev">{open ? '▾' : '▸'}</span>
        <span className="jb-name">{name}</span>
        <span className="jb-desc">{desc}</span>
        <span className={`badge ${badgeClass}`}>{tokens.toLocaleString('tr-TR')} token</span>
      </div>
      {open && <JsonPre value={value} />}
    </div>
  )
}

export function Stat({ label, value, sub, hot = false }) {
  return (
    <div className={hot ? 'stat hot' : 'stat'}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
