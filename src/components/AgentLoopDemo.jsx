import React, { useMemo, useState } from 'react'
import { Demo, JsonPre } from './shared.jsx'
import { countTokens } from '../lib/tokenize.js'

const STEPS = [
  {
    actor: 'user',
    title: 'Kullanıcı mesaj yazar',
    desc: 'Harness bunu messages[] dizisine ekler ve API\'yi çağırır. Model henüz sahnede yok.',
    msg: { role: 'user', content: "orderService.js'te iptal edilen siparişin stoğu geri eklenmiyor, düzeltir misin?" },
  },
  {
    actor: 'model',
    title: 'API çağrısı #1 — model tool_use ÜRETİR',
    desc: 'Model dosyayı okumuyor. Sadece read_file şemasına uyan token dizisi üretiyor — hâlâ sonraki token tahmini, başka bir şey değil.',
    msg: {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Önce iptal fonksiyonuna bakayım.' },
        { type: 'tool_use', id: 'toolu_01', name: 'read_file', input: { file_path: 'src/services/orderService.js' } },
      ],
    },
  },
  {
    actor: 'harness',
    title: 'HARNESS aracı çalıştırır',
    desc: 'Diske dokunan taraf model değil, dış program (harness). İzin soran da o. Sonucu tool_result olarak messages[]\'e ekler ve fonksiyonu BAŞTAN çağırır.',
    msg: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01',
          content: "export async function cancelOrder(orderId) {\n  ...\n  await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } })\n  // TODO: restock items\n  return order\n}",
        },
      ],
    },
  },
  {
    actor: 'model',
    title: 'API çağrısı #2 — model edit_file ÜRETİR',
    desc: 'Model artık dosya içeriğini "görüyor" — çünkü harness onu context\'e koydu. Şimdi düzeltmeyi yine metin olarak üretiyor.',
    msg: {
      role: 'assistant',
      content: [
        { type: 'text', text: 'TODO hiç yapılmamış; stok iadesini ekliyorum.' },
        {
          type: 'tool_use',
          id: 'toolu_02',
          name: 'edit_file',
          input: {
            file_path: 'src/services/orderService.js',
            old_string: '  // TODO: restock items\n  return order',
            new_string:
              '  await Promise.all(order.items.map((item) =>\n    prisma.product.update({\n      where: { id: item.productId },\n      data: { stock: { increment: item.quantity } },\n    })\n  ))\n  return order',
          },
        },
      ],
    },
  },
  {
    actor: 'harness',
    title: 'HARNESS düzenlemeyi uygular',
    desc: 'Dosyayı değiştiren yine harness. Sonuç messages[]\'e eklenir, fonksiyon bir kez daha çağrılır.',
    msg: {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'toolu_02', content: 'OK — dosya güncellendi (orderService.js, 6 satır eklendi)' }],
    },
  },
  {
    actor: 'model',
    title: 'API çağrısı #3 — nihai cevap',
    desc: 'Model bu kez tool_use değil, düz metin üretmeyi "seçti" (o da bir token tahmini). Döngü burada durur. Tüm hikâye: while döngüsü içinde 3 stateless fonksiyon çağrısı.',
    msg: {
      role: 'assistant',
      content:
        'Düzeltildi: cancelOrder artık iptal edilen siparişin kalemlerini dolaşıp her ürünün stoğunu geri artırıyor. Testleri çalıştırmamı ister misin?',
    },
  },
]

const ACTOR_LABEL = { user: 'KULLANICI', model: 'MODEL (sadece token üretir)', harness: 'HARNESS (dış program — çalıştıran bu)' }

export default function AgentLoopDemo() {
  const [step, setStep] = useState(0) // kaç adım oynatıldı
  const played = STEPS.slice(0, step)
  const messages = played.map((s) => s.msg)
  const tokens = useMemo(() => countTokens(messages) + 1400, [step]) // +1400: sabit system+tools
  const current = step > 0 ? STEPS[step - 1] : null

  return (
    <Demo tag="D6" name="Ajan Döngüsü — çağır → çalıştır → ekle → tekrar çağır">
      <div className="btn-row">
        <button className="btn primary" onClick={() => setStep(Math.min(step + 1, STEPS.length))} disabled={step >= STEPS.length}>
          {step === 0 ? '▶ Başlat' : 'İleri →'}
        </button>
        <button className="btn" onClick={() => setStep(0)} disabled={step === 0}>↺ Sıfırla</button>
        <span className="dim" style={{ fontSize: 13, alignSelf: 'center' }}>
          adım {step}/{STEPS.length} · API çağrısı: {played.filter((s) => s.actor === 'model').length}
        </span>
      </div>

      <div className="agent-grid">
        <div className="agent-stage">
          <h4>Sahne — şimdi ne oluyor?</h4>
          {!current && <p className="dim">▶ Başlat'a bas. Her adımda döngünün bir turu oynar.</p>}
          {current && (
            <>
              <span className={`actor ${current.actor}`}>{ACTOR_LABEL[current.actor]}</span>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>{current.title}</p>
              <p className="dim" style={{ fontSize: 13.5 }}>{current.desc}</p>
            </>
          )}
          {step >= STEPS.length && (
            <p style={{ fontSize: 13.5, color: 'var(--green)', marginTop: 10 }}>
              ✓ Döngü bitti. Model hiçbir adımda diske, ağa veya terminale dokunmadı — sadece 3 kez
              metin üretti. Geri kalan her şeyi harness yaptı.
            </p>
          )}
        </div>

        <div className="msg-panel">
          <h4>
            messages[] — her API çağrısında TAMAMI gönderilir · ~{tokens.toLocaleString('tr-TR')} token
            <span className="dim"> (system+tools dahil)</span>
          </h4>
          {messages.length === 0 && <p className="dim" style={{ fontSize: 13 }}>[ ] — henüz boş</p>}
          {messages.map((m, i) => (
            <div key={i} className={`msg-item role-${m.role}`}>
              <div className="msg-role">
                {i}: role: {m.role}
                {Array.isArray(m.content) && m.content.some((c) => c.type === 'tool_use') && ' · tool_use'}
                {Array.isArray(m.content) && m.content.some((c) => c.type === 'tool_result') && ' · tool_result'}
              </div>
              <JsonPre value={m.content} />
            </div>
          ))}
        </div>
      </div>
    </Demo>
  )
}
