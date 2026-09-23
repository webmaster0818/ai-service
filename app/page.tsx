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

  const ld = [
    websiteLd(),
    itemListLd('領域から探す', CATEGORIES.filter((c) => inCategory(c.slug).length > 0).map((c) => `/category/${c.slug}/`)),
  ]

  return (
    <article>
      <JsonLd data={ld} />
      <h1 style={{ marginTop: 44 }}>
        AIの発注先を、他社のおすすめ記事ではなく<br />公式サイトを1社ずつ見て比べる。
      </h1>
      <p style={{ fontSize: 17 }}>
        「LLMO対策会社おすすめ10選」のような記事を読んでも、その会社の本業がAI技術なのかWeb制作なのかは分かりません。
        当サイトは<strong>{all.length}社の公式サイトを1社ずつ確認</strong>し、何を掲げているか・料金を公開しているか・実績を公開しているかを揃えました。
        確認できなかったことは「未確認」と書いています。
      </p>

      <div className="verdict">
        <div className="tag">この調査でわかったこと</div>
        <p className="headline">
          料金を公開しているのは、判断できた<span className="num">{price.judged}</span>社のうち<span className="num">{price.yes}</span>社でした。
        </p>
        <div className="bar"><span style={{ width: `${Math.round((price.yes / price.judged) * 100)}%` }} /></div>
        <p className="note" style={{ margin: '4px 0 14px' }}>
          残り<span className="num">{price.unknown}</span>社は公式サイトで料金の記載を確認できませんでした（未確認として扱い、「非公開」とは書きません）。
        </p>
        <p style={{ margin: 0 }}>
          実績・事例を公開しているのは<span className="num">{cases.yes}</span>社です。
          <strong>発注先を絞るとき、まず効くのはこの2つ</strong>です。料金も事例も出していない会社は、
          問い合わせるまで判断材料がありません。
        </p>
      </div>

      <h2>掲げている領域から探す</h2>
      <p>
        各社が公式サイトで<strong>自ら掲げている</strong>領域で分類しています。当サイトの評価ではありません。
        1社が複数を掲げている場合は、そのすべてに登場します。
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
                このうち<strong className="num">{sp}</strong>社は、掲げている領域を{FOCUS_MAX}つ以内に絞っています
              </p>
            </a>
          )
        })}
      </div>

      <h2>「いくつ掲げているか」を見てほしい理由</h2>
      <p>
        複数の領域を掲げている会社は、AI開発もチャットボットもDXコンサルも受けます。
        それ自体は悪いことではありませんが、<strong>その会社の本業がどれなのかは、掲げている数からしか読めません</strong>。
        当サイトは各社が公式サイトで何を掲げているかをそのまま数えています。
      </p>
      <p>
        実際に数えると、{CATEGORIES.length}領域のうち<strong>1つだけ</strong>を掲げている会社は
        調査した{all.length}社中ほとんどいませんでした。そこで、
        <strong>{FOCUS_MAX}領域以内に絞っている会社</strong>を「絞っている側」として区別しています。
      </p>
      <div className="scroll-x">
        <table className="data">
          <thead><tr><th style={{ width: '34%' }}>掲げている領域の数</th><th>会社数</th></tr></thead>
          <tbody>
            {breadthHistogram().map(([n, v]) => (
              <tr key={n}>
                <td>{n === 0 ? '判定できず' : `${n}領域`}</td>
                <td className="num">{v}社</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="scroll-x">
        <table className="data">
          <thead><tr><th style={{ width: '34%' }}>領域</th><th>掲げている会社</th><th>うち{FOCUS_MAX}領域以内</th></tr></thead>
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

      <h2>掲載{all.length}社</h2>
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

      <h2>調べ方</h2>
      <p className="note">
        各社の公式サイトを巡回し、サービス紹介ページの記載から領域を判定しています。
        <strong>ブログ・コラム・ニュース記事は判定の根拠に使っていません。</strong>
        他社を比較した記事に「Web制作」と書いてあっても、それは他社の説明であってその会社の事業ではないためです。
        確認日は {checked[0]} 〜 {checked[checked.length - 1]} です。
      </p>
      <p className="note"><a href="/data/">調査データと集計方法の詳細を見る</a></p>
    </article>
  )
}
