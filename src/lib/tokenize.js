// o200k_base: GPT-4o / o1 ailesinin gerçek BPE tokenizer'ı (tarayıcıda, saf JS).
// Claude'un tokenizer'ı birebir aynı değil ama davranış (BPE, birleştirme mantığı,
// Türkçe/İngilizce farkı) aynı sınıftadır — eğitim amaçlı temsili olarak kullanılıyor.
import { encode, decode } from 'gpt-tokenizer/encoding/o200k_base'

export function tokenize(text) {
  if (!text) return []
  const ids = encode(text)
  return ids.map((id) => {
    let piece
    try {
      piece = decode([id])
    } catch {
      piece = '�'
    }
    return { id, piece }
  })
}

export function countTokens(textOrObj) {
  const text = typeof textOrObj === 'string' ? textOrObj : JSON.stringify(textOrObj)
  if (!text) return 0
  return encode(text).length
}
