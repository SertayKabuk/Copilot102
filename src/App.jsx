import React, { useEffect, useState } from 'react'
import { Section, Callout, DeepDive, Demo, Term } from './components/shared.jsx'
import PayloadInspector from './components/PayloadInspector.jsx'
import LiveTokenizer from './components/LiveTokenizer.jsx'
import LogitExplorer from './components/LogitExplorer.jsx'
import SamplingPlayground from './components/SamplingPlayground.jsx'
import ContextWindowDemo from './components/ContextWindowDemo.jsx'
import AgentLoopDemo from './components/AgentLoopDemo.jsx'
import HallucinationQuiz from './components/HallucinationQuiz.jsx'
import EffortComparison from './components/EffortComparison.jsx'
import DecisionTool from './components/DecisionTool.jsx'

// Her bölümün imza rengi — kicker, başlık çizgisi, callout, demo etiketi,
// hayalet numara ve kenar menü noktası hep bu renkten beslenir.
export const ACCENTS = {
  s0: '#58a6ff',
  s1: '#3fb950',
  s2: '#ffa657',
  s3: '#d2a8ff',
  s4: '#f778ba',
  s5: '#d29922',
  s6: '#39c5cf',
  s7: '#f85149',
  s8: '#a371f7',
  s9: '#56d364',
}

const NAV = [
  ['s0', '0', 'Stateless fonksiyon'],
  ['s1', '1', 'İstek gövdesi'],
  ['s2', '2', 'Tokenizasyon'],
  ['s3', '3', 'Çıkarım & örnekleme'],
  ['s4', '4', 'Ağırlıklar'],
  ['s5', '5', 'Context & maliyet'],
  ['s6', '6', 'Araç döngüsü'],
  ['s7', '7', 'Halüsinasyon'],
  ['s8', '8', 'Modeller & efor'],
  ['s9', '9', 'Seçim rehberi'],
]

function useScrollSpy() {
  const [active, setActive] = useState('s0')
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    NAV.forEach(([id]) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])
  return active
}

export default function App() {
  const active = useScrollSpy()

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="nav-title">LLM'ler Nasıl Çalışır</div>
        {NAV.map(([id, num, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className={active === id ? 'active' : ''}
            style={active === id ? { color: ACCENTS[id], borderLeftColor: ACCENTS[id] } : undefined}
          >
            <span className="dot" style={{ background: ACCENTS[id], color: ACCENTS[id] }} />
            <span className="num">{num}</span>
            {label}
          </a>
        ))}
      </nav>

      <main>
        {/* ---------- BÖLÜM 0 ---------- */}
        <section className="chapter hero" id="s0" style={{ '--sec': ACCENTS.s0 }}>
          <div className="chapter-inner">
          <div className="kicker">Yazılımcılar için LLM iç mekaniği</div>
          <h1>LLM <Term k="stateless">Stateless</Term> Bir Fonksiyondur</h1>
          <div className="sig">
            <span className="fn">f</span>(token[]) <span className="arr">→</span>{' '}
            <span className="ret">sonraki token için olasılık dağılımı</span>
          </div>
          <div className="hero-props">
            <div className="hero-prop"><b>hafıza yok</b>çağrılar arasında hiçbir şey tutmaz</div>
            <div className="hero-prop"><b>yan etki yok</b>dosyaya, ağa, diske dokunmaz</div>
            <div className="hero-prop"><b>ağırlıklar sabit</b>her çağrıda aynı salt-okunur binary</div>
          </div>
          <p style={{ maxWidth: 640, margin: '0 auto 14px' }}>
            Sohbet, hafıza, araç kullanımı, ajan davranışı — bunların hiçbiri fonksiyonun içinde
            değil. Hepsi bu saf fonksiyonun <strong>etrafına yazılmış bir döngü</strong>.
          </p>
          <p className="dim" style={{ maxWidth: 640, margin: '0 auto' }}>
            Bu imzadaki her parça aşağıda bir bölüm: girdi nasıl paketleniyor (1), token[] ne (2),
            dağılım nasıl üretiliyor ve nasıl tokene dönüyor (3), fonksiyonun içindeki sabitler
            nereden geldi (4), girdinin sınırı ve faturası (5), döngünün kendisi (6)…
          </p>
          </div>
        </section>

        {/* ---------- BÖLÜM 1 ---------- */}
        <Section id="s1" num="1" accent={ACCENTS.s1} title="İstek Gövdesi: Yazdığın Şeye Ne Ekleniyor?">
          <p>
            Yazdığın komut modele tek başına gitmez. Endpoint'e POST edilmeden önce 5 katmanla
            birleştirilir: <strong>sistem istemi</strong> (kimlik + kurallar),{' '}
            <strong>araç tanımları</strong> (<Term k="jsonschema">JSON şemaları</Term>),{' '}
            <strong>bellek dosyaları</strong>{' '}
            (CLAUDE.md vb.), <strong>tüm sohbet geçmişi</strong> ve <strong>eklediğin dosyalar</strong>.
          </p>
          <Callout>
            <p>
              Sunucu tarafında "oturum" diye bir şey yok. Her turda <strong>tüm sohbet geçmişi
              baştan gönderilir</strong>. "Sohbet", istemcinin ürettiği bir kurgudur:{' '}
              <code className="inline-code">messages[]</code> dizisine bir eleman ekleyip aynı
              endpoint'e yeniden POST etmekten ibaret.
            </p>
          </Callout>
          <Callout label="Can alıcı nokta #2 — Düzleşme">
            <p>
              Bu 5 katman modele varmadan önce <strong>tek bir token dizisine düzleşir</strong>.
              Modelin gördüğü yerde "sistem promptu" ile "kullanıcı mesajı" arasında yapısal bir
              ayrım yok — sadece konum ve etiket farkı var. Prompt injection'ın mimari bir problem
              olmasının sebebi de bu: talimat ile veri aynı kanaldan akıyor.
            </p>
          </Callout>
          <PayloadInspector />
        </Section>

        {/* ---------- BÖLÜM 2 ---------- */}
        <Section id="s2" num="2" accent={ACCENTS.s2} title="Tokenizasyon: Metin Sayıya Nasıl Dönüyor?">
          <p>
            Tokenizer bir <strong><Term k="lexer">lexer</Term></strong>'dır — ama dilin gramerine
            göre değil, istatistiksel sıkıştırmaya (<Term k="bpe">BPE</Term>) göre çalışır. Sınırlar
            senin sezgine göre değil, eğitim verisindeki frekansa göre çizilir: sık geçen parçalar
            tek <Term k="token">token</Term> olur, nadir olanlar kırpılır.
          </p>
          <ul className="list">
            <li>
              <strong>Türkçe, aynı içerik için İngilizce'den belirgin fazla token harcar</strong>{' '}
              (tokenizer'a göre ~1.5–3 kat; aşağıda canlı ölç). Aynı içerik = o oranda maliyet, o
              oranda hızlı dolan pencere.
            </li>
            <li>
              <strong>Kodda:</strong> sık anahtar kelimeler (<code className="inline-code">def</code>,{' '}
              <code className="inline-code">return</code>) tek token; uzun tanımlayıcılar ve
              girintiler parçalanır. <code className="inline-code">snake_case</code> ile{' '}
              <code className="inline-code">camelCase</code> farklı bölünür.
            </li>
            <li>
              <strong>Model karakter görmez, token görür.</strong> "strawberry'de kaç r var"
              hatalarının, string ters çevirememenin, karakter sayamamanın kökü bu — string
              manipülasyonu için LLM yanlış araç.
            </li>
            <li>Sayılar tutarsız bölünür → aritmetik hatalarının bir kaynağı da bu.</li>
          </ul>
          <LiveTokenizer />
        </Section>

        {/* ---------- BÖLÜM 3 ---------- */}
        <Section id="s3" num="3" accent={ACCENTS.s3} title="Çıkarım, Örnekleme ve Streaming">
          <h3>Forward pass — dağılım nasıl üretiliyor?</h3>
          <ul className="list">
            <li>
              Token dizisi <strong><Term k="embedding">embedding</Term></strong> vektörlerine
              dönüşür (modelin giriş katmanı).
            </li>
            <li>
              <strong><Term k="attention">Attention</Term></strong>, her token üretilirken dizideki
              diğer tokenlara ne kadar bakılacağını hesaplar — "bağlam" fiziksel olarak burada
              işlenir.
            </li>
            <li>
              Çıktı: kelime dağarcığındaki <em>her</em> token için bir skor (
              <strong><Term k="logits">logits</Term></strong>);{' '}
              <Term k="softmax">softmax</Term> bunları olasılığa çevirir.
            </li>
            <li>
              Seçilen token diziye eklenir, fonksiyon baştan çalışır —{' '}
              <strong><Term k="autoregressive">otoregresif üretim</Term></strong>.{' '}
              <Term k="streaming">Streaming</Term> bir UI süslemesi değil, bu döngünün doğrudan
              görünümü.
            </li>
          </ul>
          <Callout warn label="Terim tuzağı">
            <p>
              Buradaki "embedding" (token → vektör, modelin giriş katmanı) ile RAG/vektör veritabanı
              embedding'i (cümle → arama vektörü) <strong>farklı şeyler</strong>. Aynı kelime, iki
              ayrı kavram — bu kitlede en sık karışan terim.
            </p>
          </Callout>
          <LogitExplorer />
          <h3>Örnekleme: model "en olası"yı seçmez</h3>
          <Callout>
            <p>
              Model en olası tokeni seçmez, <strong>dağılımdan örnekler</strong>. Ve{' '}
              <Term k="temperature"><code className="inline-code">temperature=0</code></Term> bile
              tam determinizm vermez: kayan nokta toplama sırası, GPU çekirdek seçimi, batch'teki
              diğer istekler, <Term k="moe">MoE</Term> yönlendirmesi… "Aynı input → aynı output"
              varsayımıyla LLM testi yazıyorsan bu varsayım <strong>yanlış</strong>.
            </p>
          </Callout>
          <SamplingPlayground />
          <h3>Prefill vs decode — iki farklı performans profili</h3>
          <p>
            İlk token gecikmesi (<Term k="ttft">TTFT</Term>), girdinin <em>tamamının</em> bir kerede
            işlenmesinden gelir (<Term k="prefill">prefill</Term>); sonraki tokenlar tek tek
            üretilir (<Term k="decode">decode</Term>). Uzun prompt → yavaş ilk token;
            uzun cevap → uzun toplam süre. İki ayrı optimizasyon hedefi — prefill tarafının ilacı
            Bölüm 5'teki cache.
          </p>
          <DeepDive title="matris boyutları, multi-head attention, positional encoding">
            <p>
              Her token d boyutlu bir vektör (tipik olarak 4k–16k). Attention, Q·Kᵀ çarpımıyla n×n
              bir ilgi matrisi üretir (n = dizi uzunluğu) — maliyetin dizi uzunluğuyla karesel
              büyümesinin kaynağı bu çarpım. "Multi-head" aynı işlemin farklı öğrenilmiş
              projeksiyonlarla paralel yapılması; positional encoding ise dizide sıra bilgisinin
              vektörlere işlenme biçimi (aksi hâlde attention için dizi bir küme olurdu).
            </p>
          </DeepDive>
        </Section>

        {/* ---------- BÖLÜM 4 ---------- */}
        <Section id="s4" num="4" accent={ACCENTS.s4} title="Ağırlıklar Nereden Geldi?">
          <div className="pipeline">
            <div className="pipe-stage">
              <h4>1 · Ön eğitim</h4>
              <div className="pipe-sub"><Term k="pretraining">pretraining</Term> — aylar, binlerce GPU</div>
              <p>
                Devasa metin yığını üzerinde tek görev: sonraki tokeni tahmin et. Modelin tüm
                "bilgisi" — diller, API'ler, kod kalıpları — buradan.
              </p>
            </div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-stage">
              <h4>2 · Talimat ayarı</h4>
              <div className="pipe-sub"><Term k="sft">SFT</Term> — supervised fine-tuning</div>
              <p>
                Ham "metin tamamlayıcı"dan talimat izleyen asistana geçiş. Soru–cevap örnekleriyle
                davranış şekillendirilir.
              </p>
            </div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-stage">
              <h4>3 · <Term k="rlhf">RLHF</Term> / tercih opt.</h4>
              <div className="pipe-sub">insan tercihiyle hizalama</div>
              <p>
                Üslup, reddetme davranışı, "yardımsever asistan" karakteri burada şekillenir.
              </p>
            </div>
          </div>
          <Callout>
            <p>
              Ağırlıkları <strong>derlenmiş bir binary</strong> gibi düşün: çıkarım anında{' '}
              <strong>salt okunur</strong>. Sohbette söylediklerin ağırlıkları değiştirmez — sadece
              bir sonraki çağrının girdisine eklenir.
            </p>
          </Callout>
          <p>Bundan iki doğrudan sonuç çıkar:</p>
          <ul className="list">
            <li>
              <strong>"Modele öğretmek" ile "context'e koymak" bambaşka şeyler.</strong> İkincisi o
              çağrı bitince buharlaşır.
            </li>
            <li>
              <strong><Term k="finetuning">Fine-tuning</Term> ayrı bir derleme adımıdır</strong>,
              çalışma zamanı davranışı değil
              — yeni bir binary üretirsin.
            </li>
          </ul>
          <p>
            Eğitim verisinin toplandığı son tarih ={' '}
            <strong><Term k="cutoff">kesme tarihi (knowledge cutoff)</Term></strong>.
            O tarihten sonra çıkan kütüphane sürümünü model "bilmez" — sonuçlarını Bölüm 7'de
            göreceğiz.
          </p>
        </Section>

        {/* ---------- BÖLÜM 5 ---------- */}
        <Section id="s5" num="5" accent={ACCENTS.s5} title="Context Penceresi, Cache ve Maliyet">
          <p>
            <Term k="contextwindow">Context penceresi</Term>{' '}
            <strong>sabit boyutlu bir buffer</strong>. Dolduğunda taşma olmaz —{' '}
            <strong>veri kaybı</strong> olur: özetleme (<Term k="compaction">compaction</Term>),
            eski turların düşürülmesi, kırpma. Uzun sohbetlerde "model aptallaştı" hissinin büyük kısmı budur: model
            değişmedi, <em>girdisi kayıplı sıkıştırıldı</em>.
          </p>
          <ul className="list">
            <li>
              <strong>"Ortada kaybolma" (lost in the middle):</strong> uzun bağlamda baş ve son daha
              güvenilir işlenir. Kritik talimatı 40k tokenlık yığının ortasına gömme.
            </li>
            <li>Pencere büyüklüğü ≠ etkin kullanılabilir alan.</li>
            <li>
              Statelessness'ın faturası: her tur tüm geçmişi yeniden gönderir → toplam token tüketimi
              tur sayısıyla <strong>kuadratik</strong> büyür. Girdi ve çıktı ayrı fiyatlanır (çıktı
              belirgin pahalı); <Term k="reasoningtoken">düşünme tokenları</Term> <em>çıktı</em>{' '}
              tarafında sayılır.
            </li>
          </ul>
          <Callout>
            <p>
              <Term k="kvcache">KV cache</Term> ={' '}
              <strong><Term k="memoization">memoization</Term></strong>: attention'ın ara sonuçları
              (key/value) saklanır. Ama cache <strong>önek (prefix) bazlıdır</strong> — payload'ın
              başındaki ilk fark, o noktadan sonraki her şeyi geçersiz kılar. Pratik kural:{' '}
              <strong>sabit içerik başa, değişken içerik sona.</strong> Sistem promptunun ortasına
              timestamp koymak tüm cache'i çöpe atar. Cache okuması hem ucuz hem hızlı —{' '}
              <Term k="ttft">TTFT</Term>'yi doğrudan düşürür.
            </p>
          </Callout>
          <ContextWindowDemo />
        </Section>

        {/* ---------- BÖLÜM 6 ---------- */}
        <Section id="s6" num="6" accent={ACCENTS.s6} title="Araç Döngüsü ve Yapılandırılmış Çıktı">
          <p>
            Model üç tür token üretir: <strong><Term k="reasoningtoken">düşünme</Term></strong>{' '}
            (reasoning), <strong>araç çağrısı</strong> (tool_use) ve <strong>nihai cevap</strong>. Üçü de aynı
            mekanizmanın çıktısı — sonraki token tahmini.
          </p>
          <Callout>
            <p>
              Model aracı <strong>çalıştırmaz</strong>. Araç şemasına uyan yapılandırılmış bir metin{' '}
              <strong>üretir</strong> — o kadar. Çalıştıran, dış program (
              <strong><Term k="harness">harness</Term></strong>):
              sonucu alır, <code className="inline-code">tool_result</code> olarak{' '}
              <code className="inline-code">messages[]</code>'e ekler ve fonksiyonu{' '}
              <strong>baştan çağırır</strong>. Ajan mimarisinin tamamı:{' '}
              <code className="inline-code">while</code> döngüsü. Sihir yok.
            </p>
          </Callout>
          <p>Bu tek kavrayış dört soruyu birden cevaplar:</p>
          <ul className="list">
            <li>Model dosyayı neden "göremiyor"? → Harness okuyup context'e koyana kadar dosya diye bir şey yok.</li>
            <li>İzni neden harness soruyor? → Çünkü yan etkiyi üreten taraf o; model sadece niyet metni yazdı.</li>
            <li>Araç sonuçları neden pencereyi yiyor? → Her tool_result, messages[]'e eklenen düz tokendır.</li>
            <li>Model internete "bakabiliyor" ama bilgisi neden güncellenmiyor? → Arama sonucu context'e girer, ağırlıklara değil (Bölüm 4).</li>
          </ul>
          <AgentLoopDemo />
          <h3>Yapılandırılmış çıktı (structured output)</h3>
          <p>
            Araç şemaları <Term k="jsonschema">JSON Schema</Term>'dır; model şemaya{' '}
            <em>uymaya çalışır</em> — garantiyi veren şey, uygulanıyorsa{' '}
            <strong><Term k="constrained">kısıtlı çözümleme</Term></strong> (constrained decoding):
            örnekleme sırasında şemaya uymayan tokenların maskelenmesi.
          </p>
          <Callout label="Doğrudan uygulanabilir tasarım kuralı">
            <p>
              Şemadaki <code className="inline-code">description</code> alanları prompt'un
              parçasıdır. Kötü yazılmış bir açıklama, doğrudan yanlış araç seçimine yol açar — araç
              tanımı yazmak API tasarımı değil, <strong>prompt mühendisliğidir</strong>.
            </p>
          </Callout>
        </Section>

        {/* ---------- BÖLÜM 7 ---------- */}
        <Section id="s7" num="7" accent={ACCENTS.s7} title="Halüsinasyon: Neden API Uyduruyor?">
          <Callout>
            <p>
              Model her zaman <strong>istatistiksel olarak makul devamı</strong> üretir. Boru
              hattında "doğruluk kontrolü" diye bir aşama <strong>yok</strong>. Halüsinasyon bir bug
              değil — işe yarayan davranışın ta kendisi, sadece gerçekle örtüşmediği durumdaki adı.
            </p>
          </Callout>
          <p>
            Yazılımcı için asıl örnek: <strong>uydurulmuş API'ler</strong>. Model var olmayan bir
            fonksiyon üretir, çünkü o isim kütüphanenin isimlendirme örüntüsüne istatistiksel olarak
            uyar. Bilgi "eskimiş" değil — o fonksiyon <em>hiç var olmadı</em>. İsim ne kadar makul
            görünüyorsa o kadar sinsi. Kendin dene:
          </p>
          <Demo tag="🎯" name="Hangisi gerçek API? — ikisi de aynı derecede makul görünüyor">
            <HallucinationQuiz />
          </Demo>
          <ul className="list">
            <li>
              <strong>Yüksek riskli alanlar:</strong> API imzaları, sürüm numaraları, config
              anahtarları, tam alıntılar, az kullanılan kütüphaneler.
            </li>
            <li>
              Kesme tarihi (Bölüm 4) tetikleyicilerden sadece biri; arama/doküman araçları (Bölüm 6)
              riski <em>azaltır</em>, sıfırlamaz — kök sebep mekanizmanın kendisi.
            </li>
            <li>
              <strong>Özgüven bir doğruluk sinyali değil.</strong> Model, dağılım zayıfken de aynı
              akıcılıkla yazar.
            </li>
          </ul>
        </Section>

        {/* ---------- BÖLÜM 8 ---------- */}
        <Section id="s8" num="8" accent={ACCENTS.s8} title="Model Seviyeleri ve Efor (Reasoning)">
          <p>
            Farklı modeller (Opus, Sonnet, Haiku…) farklı parametre sayısı, eğitim hacmi ve mimari
            demek. Kaba karşılık: <strong>kapasite ↔ gecikme ↔ maliyet</strong> üçgeni.
          </p>
          <Callout>
            <p>
              Efor seviyesini yükselttiğinde fiziksel olarak olan tek şey: model durma noktasına
              gelmeden önce{' '}
              <strong><Term k="reasoningtoken">daha fazla düşünme tokenı üretir</Term></strong>. Daha detaylı plan,
              daha çok araç denemesi, daha derin analiz — hepsi bunun türevi. Doğrudan sonuç: daha
              çok çıktı tokenı → daha uzun süre → daha yüksek maliyet.
            </p>
          </Callout>
          <EffortComparison />
          <p>
            <strong>Durma politikası:</strong> modelin "iş bitti" kararı da bir token tahmini.
            "Erken bitirme" ve "dosya atlama" davranışının kaynağı bu — ve tam da bu yüzden efor
            ayarıyla düzeltilebiliyor (Bölüm 9'un en değerli maddesi).
          </p>
        </Section>

        {/* ---------- BÖLÜM 9 ---------- */}
        <Section id="s9" num="9" accent={ACCENTS.s9} title="Doğru Model ve Efor Seçimi">
          <p>
            Sıfır teori — cevapları işaretle, öneriyi al. (Mekanizmanın <em>nedeni</em> için Bölüm 8.)
          </p>
          <DecisionTool />
        </Section>

        <div className="footer-note">
          Eğitim amaçlı interaktif demo · React + Vite · Tokenizer: gpt-tokenizer (o200k_base, tarayıcıda) ·
          Tüm demolar statik — API çağrısı yapılmıyor
        </div>
      </main>
    </div>
  )
}
