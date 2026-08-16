// Teknik terim sözlüğü — Term bileşeni tooltip içeriğini buradan alır.
export const GLOSSARY = {
  lexer: {
    term: 'Lexer',
    def: 'Derleyicinin ilk aşaması: kaynak metni anlamlı en küçük parçalara (token) bölen bileşen. Tokenizer da aynı işi yapar, ama gramer kurallarıyla değil frekans istatistiğiyle.',
  },
  bpe: {
    term: 'BPE (Byte Pair Encoding)',
    def: 'En sık geçen bayt/karakter çiftlerini yinelemeli olarak birleştirip sözlük oluşturan sıkıştırma algoritması. Modern LLM tokenizer\'larının temeli: sık geçen parça tek token olur.',
  },
  token: {
    term: 'Token',
    def: 'Modelin işlediği en küçük birim. Kelime değil, istatistiksel parça — İngilizce\'de ortalama ~4 karakter, Türkçe\'de daha kısa parçalara bölünür.',
  },
  stateless: {
    term: 'Stateless',
    def: 'Çağrılar arasında hiçbir durum (state) tutmayan. Her çağrının sonucu yalnızca o an verilen girdiye bağlıdır — HTTP\'nin kendisi gibi.',
  },
  embedding: {
    term: 'Embedding',
    def: 'Bir tokeni yüksek boyutlu sayısal vektöre çeviren öğrenilmiş tablo; modelin giriş katmanı. (RAG\'deki "embedding" ile karıştırma — o, cümleyi arama vektörüne çeviren ayrı bir kavram.)',
  },
  attention: {
    term: 'Attention',
    def: 'Her tokenin, dizideki diğer tokenlarla ilişkisini ağırlıklandıran mekanizma — Transformer mimarisinin çekirdeği. "Bağlamı anlama" fiziksel olarak burada gerçekleşir.',
  },
  logits: {
    term: 'Logits',
    def: 'Modelin son katmanının ürettiği ham skorlar: sözlükteki her token için bir sayı. Henüz olasılık değil — softmax\'ten sonra olasılığa dönüşür.',
  },
  softmax: {
    term: 'Softmax',
    def: 'Ham skorları (logits) toplamı 1 olan bir olasılık dağılımına çeviren fonksiyon. Büyük skorlar arasındaki farkı üstel olarak abartır.',
  },
  autoregressive: {
    term: 'Otoregresif üretim',
    def: 'Her üretilen tokenin girdi dizisine eklenip fonksiyonun baştan çağrılması. Cevabın token token akmasının (streaming) mimari sebebi.',
  },
  temperature: {
    term: 'temperature',
    def: 'Örnekleme öncesi logit\'lerin bölündüğü katsayı. Düşük değer dağılımı keskinleştirir (hep en olası), yüksek değer düzleştirir (daha çeşitli / riskli çıktı).',
  },
  topp: {
    term: 'top_p (nucleus sampling)',
    def: 'Adayları olasılığa göre sıralayıp kümülatif toplamı p\'ye ulaşan en küçük kümeyi tutar, gerisini eler. Dağılım ne kadar yayvansa aday kümesi o kadar büyür.',
  },
  topk: {
    term: 'top_k',
    def: 'Yalnızca en olası k aday arasından örnekleme yapılır; gerisi doğrudan elenir.',
  },
  moe: {
    term: 'MoE (Mixture of Experts)',
    def: 'Her token için ağın tamamının değil, yönlendiriciyle seçilen bir alt kümesinin ("uzmanların") çalıştırıldığı mimari. Aynı girdide farklı uzman seçimi, çıktıyı değiştirebilir.',
  },
  ttft: {
    term: 'TTFT (Time To First Token)',
    def: 'İsteğin gönderilmesiyle ilk çıktı tokeninin gelmesi arasındaki süre. Girdinin tamamının işlenmesi (prefill) bitmeden ilk token üretilemez.',
  },
  prefill: {
    term: 'Prefill',
    def: 'Girdi dizisinin tamamının tek geçişte işlendiği aşama. Paralelleştirilebilir ama girdi uzunluğuyla büyür — TTFT\'nin ana kaynağı.',
  },
  decode: {
    term: 'Decode',
    def: 'Çıktı tokenlarının teker teker üretildiği aşama. Her token bir önceki tamamlanmadan üretilemez — toplam sürenin ana kaynağı.',
  },
  kvcache: {
    term: 'KV cache',
    def: 'Attention\'ın her token için hesapladığı key/value ara sonuçlarının saklanması. Aynı önek (prefix) tekrar geldiğinde yeniden hesaplanmaz — memoization\'ın donanımdaki karşılığı.',
  },
  memoization: {
    term: 'Memoization',
    def: 'Saf bir fonksiyonun sonucunu girdisiyle birlikte saklayıp, aynı girdi tekrar geldiğinde hesaplamadan döndürme tekniği.',
  },
  compaction: {
    term: 'Compaction',
    def: 'Context penceresi dolduğunda eski turların bir özete sıkıştırılması. Kayıplı bir işlemdir: model artık o turların kendisini değil, özetini görür.',
  },
  pretraining: {
    term: 'Pretraining (ön eğitim)',
    def: 'Devasa metin yığını üzerinde tek görevle (sonraki tokeni tahmin et) yapılan ilk ve en pahalı eğitim aşaması. Modelin tüm "bilgisi" buradan gelir.',
  },
  sft: {
    term: 'SFT (Supervised Fine-Tuning)',
    def: 'Elle hazırlanmış talimat→cevap örnekleriyle yapılan denetimli ince ayar. Ham metin tamamlayıcıyı talimat izleyen asistana çevirir.',
  },
  rlhf: {
    term: 'RLHF',
    def: 'Reinforcement Learning from Human Feedback — insanların çıktı tercihleri üzerinden modelin üslup ve davranışının pekiştirmeli öğrenmeyle hizalanması.',
  },
  finetuning: {
    term: 'Fine-tuning',
    def: 'Mevcut ağırlıklardan başlayarak kendi verinle yapılan ek eğitim. Çalışma zamanı davranışı değil, ayrı bir "derleme" adımı: sonuçta yeni bir ağırlık seti çıkar.',
  },
  cutoff: {
    term: 'Knowledge cutoff (kesme tarihi)',
    def: 'Eğitim verisinin toplandığı son tarih. Ondan sonra çıkan kütüphane, sürüm veya olay ağırlıklarda yoktur — ancak araçlarla context\'e getirilebilir.',
  },
  harness: {
    term: 'Harness',
    def: 'Modeli API üzerinden çağıran, araçları gerçekten çalıştıran, izinleri soran ve döngüyü yöneten dış program — Claude Code, Copilot, kendi yazdığın agent script\'i.',
  },
  constrained: {
    term: 'Constrained decoding',
    def: 'Örnekleme sırasında, o an gramere/şemaya uymayan tokenların olasılığının sıfırlanması (maskelenmesi). Geçerli JSON\'u "umut" değil, kısıt garanti eder.',
  },
  jsonschema: {
    term: 'JSON Schema',
    def: 'JSON verinin yapısını — alan adları, tipler, zorunlu alanlar — tanımlayan standart şema dili. Araç tanımlarının parametre sözleşmesi bununla yazılır.',
  },
  streaming: {
    term: 'Streaming',
    def: 'Cevabın tamamlanması beklenmeden, üretilen her tokenin anında istemciye iletilmesi (SSE ile). Otoregresif üretimin doğal görünümü.',
  },
  contextwindow: {
    term: 'Context window',
    def: 'Modelin tek çağrıda işleyebileceği en fazla token sayısı — sabit boyutlu bir buffer. Girdi + çıktı bu sınırın içine sığmak zorunda.',
  },
  reasoningtoken: {
    term: 'Düşünme (reasoning) tokenları',
    def: 'Modelin nihai cevaptan önce ürettiği, planlama/analiz içeren ara tokenlar. Kullanıcıya gösterilmese de üretilir ve çıktı tokenı olarak faturalanır.',
  },
}
