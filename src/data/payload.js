// D1 — Payload İnceleyici için temsili istek gövdesi.
// Gerçek bir kodlama asistanının (Claude Code benzeri) gönderdiği payload'ın
// kısaltılmış ama yapısal olarak birebir versiyonu.

export const SYSTEM_PROMPT = `Sen bir yazılım geliştirme asistanısın ve kullanıcının terminalinde çalışıyorsun.

# Görev
Kullanıcının yazılım mühendisliği görevlerinde yardımcı ol: bug çözme, yeni özellik ekleme, refactoring, kod açıklama.

# Kurallar
- Dosyaları değiştirmeden önce mutlaka oku.
- Yıkıcı komutlar (rm, drop, force push) için kullanıcıdan onay iste.
- Kod stilini mevcut dosyalarla tutarlı tut; gereksiz yorum satırı ekleme.
- Cevaplarını kısa tut; kullanıcı terminalde okuyor.
- Test çalıştırmadan "bitti" deme; başarısız testleri olduğu gibi raporla.

# Ortam
- Çalışma dizini: C:\\Users\\serta\\source\\repos\\Copilot102
- Platform: win32
- Bugünün tarihi: 2026-08-16
- Git reposu: evet, branch: main`

export const TOOLS = [
  {
    name: 'read_file',
    description:
      'Dosya sisteminden bir dosya okur. file_path mutlak yol olmalıdır. Büyük dosyalar için offset ve limit ile sayfalama yapılabilir.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Okunacak dosyanın mutlak yolu' },
        offset: { type: 'number', description: 'Başlangıç satırı (opsiyonel)' },
        limit: { type: 'number', description: 'Okunacak satır sayısı (opsiyonel)' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'edit_file',
    description:
      'Bir dosyada birebir metin değişikliği yapar. old_string dosyada benzersiz olmalıdır; birden fazla eşleşme hatadır.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        old_string: { type: 'string', description: 'Değiştirilecek mevcut metin' },
        new_string: { type: 'string', description: 'Yeni metin' },
      },
      required: ['file_path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'bash',
    description:
      'Bir shell komutu çalıştırır ve çıktısını döndürür. Uzun süren komutlar için timeout milisaniye cinsinden verilebilir.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Çalıştırılacak komut' },
        timeout: { type: 'number', description: 'Zaman aşımı (ms)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'grep',
    description: 'Dosya içeriklerinde regex ile arama yapar. Ripgrep sözdizimi kullanılır.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Aranacak düzenli ifade' },
        path: { type: 'string', description: 'Arama yapılacak dizin' },
        glob: { type: 'string', description: 'Dosya filtresi, örn. *.ts' },
      },
      required: ['pattern'],
    },
  },
]

export const MEMORY = `# CLAUDE.md — Proje Notları

## Proje
Sipariş yönetim API'si. Node.js 22 + Fastify + PostgreSQL (Prisma).

## Konvansiyonlar
- Tüm route'lar src/routes/ altında, her kaynak kendi dosyasında
- Hata yönetimi: AppError sınıfı fırlat, global handler yakalar
- Test: vitest, her route için en az bir entegrasyon testi
- Commit mesajları İngilizce, imperative mood

## Bilinen tuzaklar
- prisma migrate dev yerine migrate deploy kullan (CI kırılıyor)
- Decimal alanlarda toNumber() çağırmayı unutma`

export const TURN1_MESSAGES = [{ role: 'user', content: 'merhaba' }]

export const TURN3_MESSAGES = [
  { role: 'user', content: 'merhaba' },
  {
    role: 'assistant',
    content: 'Merhaba! Sipariş API projesinde ne üzerinde çalışmak istersin?',
  },
  { role: 'user', content: 'siparis iptalinde stok geri eklenmiyor, bakar misin' },
  {
    role: 'assistant',
    content: [
      { type: 'text', text: 'İptal akışına bakıyorum.' },
      {
        type: 'tool_use',
        id: 'toolu_01A3xK9mPq',
        name: 'grep',
        input: { pattern: 'cancelOrder', path: 'src/' },
      },
    ],
  },
  {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: 'toolu_01A3xK9mPq',
        content: 'src/routes/orders.js:142: async function cancelOrder(req, reply) {\nsrc/services/orderService.js:87: export async function cancelOrder(orderId) {',
      },
    ],
  },
  {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_02B7yL4nRs',
        name: 'read_file',
        input: { file_path: 'C:\\repo\\src\\services\\orderService.js', offset: 80, limit: 40 },
      },
    ],
  },
  {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: 'toolu_02B7yL4nRs',
        content:
          "export async function cancelOrder(orderId) {\n  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })\n  if (!order) throw new AppError('ORDER_NOT_FOUND', 404)\n  if (order.status === 'SHIPPED') throw new AppError('ALREADY_SHIPPED', 409)\n  await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } })\n  // TODO: restock items\n  return order\n}",
      },
    ],
  },
  { role: 'user', content: 'evet o TODO hic yapilmamis galiba, duzeltir misin' },
]
