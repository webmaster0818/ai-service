import type { Metadata } from 'next'
import { companies, disclosure, CATEGORIES, inCategory, focused, FOCUS_MAX, breadthHistogram, slugOf, SITE } from '@/lib/data'
import { JsonLd, websiteLd, itemListLd } from '@/lib/seo'

// ⚠️ トップにも自己canonicalを置く。無いと pages.dev 側のURLが正規と判断されうる。
export const metadata: Metadata = {
  alternates: { canonical: `${SITE.origin}/` },
}

export default function Home() {
  const all = companies()
  const price = disclosure('priceDisclosed')
  const cases = disclosure('casesDisclosed')
  const checked = all.map((c) => c.checkedAt).sort()
  const single = all.filter((c) => (c.categories || []).length === 1).length

  const ld = [
    websiteLd(),
    itemListLd('領域から探す', CATEGORIES.filter((c) => inCategory(c.slug).length > 0).map((c) => `/category/${c.slug}/`)),
  ]

  return (
    <article>
      <JsonLd data={ld} />
      <h1 style={{ marginTop: 44 }}>
        AI開発・LLMO対策の発注先を、<br />各社の公式サイトの情報にもとづき比較します
      </h1>
      <p style={{ fontSize: 17 }}>
        「LLMO対策会社おすすめ10選」のような比較記事からは、各社の主力事業がAI技術かWeb制作かを判断することは困難です。
        当サイトでは<strong>{all.length}社の公式サイトを個別に確認</strong>し、掲げている領域、料金の公開有無、実績の公開有無を同じ基準で整理しています。
        確認できなかった項目は「未確認」と表示しています。
      </p>

      <div className="verdict">
        <div className="tag">調査結果</div>
        <p className="headline">
          料金の公開有無を判断できた<span className="num">{price.judged}</span>社のうち、料金を公開している企業は<span className="num">{price.yes}</span>社です。
        </p>
        <div className="bar"><span style={{ width: `${Math.round((price.yes / price.judged) * 100)}%` }} /></div>
        <p className="note" style={{ margin: '4px 0 14px' }}>
          残る<span className="num">{price.unknown}</span>社は、公式サイトの記載から料金の公開有無を判断できなかったため、「未確認」として扱っています（「非公開」とは表示していません）。
        </p>
        <p style={{ margin: 0 }}>
          実績・事例を公開している企業は<span className="num">{cases.yes}</span>社です。
          <strong>発注先を絞り込む際は、まずこの2点の確認をおすすめします</strong>。料金・事例のいずれも公開していない企業については、
          問い合わせを通じて判断材料を得る必要があります。
        </p>
      </div>

      <h2>掲げている領域から探す</h2>
      <p>
        各社が公式サイトで<strong>自ら掲げている</strong>領域にもとづき分類しています。当サイトによる評価ではありません。
        複数の領域を掲げている企業は、該当するすべての領域に掲載しています。
      </p>
      <div className="grid">
        {CATEGORIES.map((c) => {
          const n = inCategory(c.slug).length
          const sp = focused(c.slug).length
          return (
            <a className="card" key={c.slug} href={`/category/${c.slug}/`}>
              <p className="t">{c.label}　<span className="num">{n}</span>社</p>
              <p className="k">{c.blurb}</p>
              <p className="k" style={{ marginTop: 8 }}>
                このうち<strong className="num">{sp}</strong>社は、掲げている領域が{FOCUS_MAX}つ以内です
              </p>
            </a>
          )
        })}
      </div>

      <h2>掲げている領域の数について</h2>
      <p>
        複数の領域を掲げている企業は、AI開発、チャットボット、DXコンサルなどを幅広く受託しています。
        それ自体に問題はありませんが、<strong>公式サイトの記載から各社の主力事業を読み取る手がかりは、掲げている領域の数に限られます</strong>。
        当サイトでは、各社が公式サイトで掲げている領域をそのまま集計しています。
      </p>
      <p>
        集計の結果、{CATEGORIES.length}領域のうち<strong>1領域のみ</strong>を掲げている企業は、
        調査対象{all.length}社のうち{single}社でした。そのため当サイトでは、
        <strong>掲げている領域が{FOCUS_MAX}つ以内の企業</strong>を区別して表示しています。
      </p>
      <div className="scroll-x">
        <table className="data">
          <thead><tr><th style={{ width: '34%' }}>掲げている領域の数</th><th>企業数</th></tr></thead>
          <tbody>
            {breadthHistogram().map(([n, v]) => (
              <tr key={n}>
                <td>{n === 0 ? '判定不可' : `${n}領域`}</td>
                <td className="num">{v}社</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="scroll-x">
        <table className="data">
          <thead><tr><th style={{ width: '34%' }}>領域</th><th>掲げている企業</th><th>うち{FOCUS_MAX}領域以内</th></tr></thead>
          <tbody>
            {CATEGORIES.map((c) => (
              <tr key={c.slug}>
                <td><a href={`/category/${c.slug}/`}>{c.label}</a></td>
                <td className="num">{inCategory(c.slug).length}社</td>
                <td className="num">{focused(c.slug).length}社</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>掲載企業（{all.length}社）</h2>
      <div className="grid">
        {all.map((c) => (
          <a className="card" key={c.officialUrl} href={`/company/${slugOf(c)}/`}>
            <p className="t">{c.name}</p>
            <p className="k">
              料金 {c.priceDisclosed === true ? '公開' : c.priceDisclosed === false ? '記載なし' : '未確認'}
              　／　実績 {c.casesDisclosed === true ? '公開' : c.casesDisclosed === false ? '記載なし' : '未確認'}
            </p>
            <div className="tags">
              {(c.categories || []).map((k) => <span key={k}>{CATEGORIES.find((x) => x.slug === k)?.label ?? k}</span>)}
            </div>
          </a>
        ))}
      </div>

      <h2>調査方法</h2>
      <p className="note">
        各社の公式サイトを巡回し、サービス紹介ページの記載から領域を判定しています。
        <strong>ブログ・コラム・ニュース記事は判定の根拠としていません。</strong>
        他社を比較した記事に「Web制作」と記載されていても、それは記事内の説明であり、その企業の事業内容を示すものではないためです。
        確認日は {checked[0]} 〜 {checked[checked.length - 1]} です。
      </p>
      <p className="note"><a href="/data/">調査データと集計方法の詳細を見る</a></p>
    </article>
  )
}
