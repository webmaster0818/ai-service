import type { Metadata } from 'next'
import { companies, disclosure, CATEGORIES, inCategory, specialists, focused, FOCUS_MAX, SITE } from '@/lib/data'
import { JsonLd, breadcrumb } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'AI関連企業49社の開示状況調査（データ公開）',
  description:
    'AI開発・DXコンサル・LLMO対策などを掲げる49社の公式サイトを1社ずつ確認し、料金と実績の開示状況を集計しました。集計方法と限界を明記のうえ、JSONで公開しています。',
  alternates: { canonical: `${SITE.origin}/data/` },
}

export default function Page() {
  const all = companies()
  const price = disclosure('priceDisclosed')
  const cases = disclosure('casesDisclosed')
  const checked = all.map((c) => c.checkedAt).sort()

  const dataset = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'AI関連企業の料金・実績 開示状況調査',
    description:
      'AI開発・DXコンサル・内製化支援・LLMO/AEO対策・Web制作を公式サイトで掲げる企業49社について、料金と実績の開示状況を個別確認した調査データ。',
    creator: { '@type': 'Organization', name: SITE.name },
    url: `${SITE.origin}/data/`,
    dateModified: checked[checked.length - 1],
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    variableMeasured: [
      { '@type': 'PropertyValue', name: '調査対象企業数', value: all.length },
      { '@type': 'PropertyValue', name: '料金を公開している企業数', value: price.yes },
      { '@type': 'PropertyValue', name: '料金の判断ができた企業数', value: price.judged },
      { '@type': 'PropertyValue', name: '実績を公開している企業数', value: cases.yes },
    ],
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${SITE.origin}/opendata/ai-service-facts.json` },
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${SITE.origin}/opendata/ai-service-facts.csv` },
    ],
  }

  return (
    <article>
      <JsonLd data={[dataset, breadcrumb([{ name: 'トップ', url: '/' }, { name: '調査データの公開', url: '/data/' }])]} />
      <p className="note" style={{ marginTop: 28 }}><a href="/">トップ</a> ／ 調査データ</p>
      <h1>AI関連企業{all.length}社の開示状況調査</h1>

      <div className="verdict">
        <div className="tag">調査結果</div>
        <p className="headline">
          料金を公開しているのは判断できた<span className="num">{price.judged}</span>社中<span className="num">{price.yes}</span>社、
          実績は<span className="num">{cases.yes}</span>社でした。
        </p>
        <p style={{ margin: 0 }}>調査期間 {checked[0]} 〜 {checked[checked.length - 1]}／対象 {all.length}社</p>
      </div>

      <h2>領域別の内訳</h2>
      <div className="scroll-x">
        <table className="data">
          <thead><tr><th style={{ width: '30%' }}>領域</th><th>掲げている</th><th>うち3領域以内</th><th>うち専業</th><th>料金公開</th><th>実績公開</th></tr></thead>
          <tbody>
            {CATEGORIES.map((c) => {
              const rows = inCategory(c.slug)
              return (
                <tr key={c.slug}>
                  <td><a href={`/category/${c.slug}/`}>{c.label}</a></td>
                  <td className="num">{rows.length}社</td>
                  <td className="num">{focused(c.slug).length}社</td>
                  <td className="num">{specialists(c.slug).length}社</td>
                  <td className="num">{rows.filter((x) => x.priceDisclosed === true).length}社</td>
                  <td className="num">{rows.filter((x) => x.casesDisclosed === true).length}社</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h2>集計方法</h2>
      <p>
        各社の公式サイトを巡回し、<strong>サービス紹介ページの記載</strong>から、掲げている領域・料金の公開有無・実績の公開有無を判定しました。
      </p>
      <h3>根拠に使わなかったもの</h3>
      <p>
        ブログ・コラム・ニュース記事は判定に使っていません。他社を比較した記事に「Web制作」と書かれていても、
        それは<strong>他社の説明であって、その会社の事業ではない</strong>ためです。
        同様に、他社の「おすすめ○選」記事も情報源にしていません。あれは広告であり一次情報ではありません。
      </p>
      <h3>分母の取り方</h3>
      <p>
        料金の公開率は、<strong>「公開している」「記載を確認できなかった」の判断がついた{price.judged}社を分母</strong>にしています。
        確認そのものができなかった{price.unknown}社を「公開していない」側に入れると、事実と違う結論になるためです。
      </p>
      <h3>この調査でわからないこと</h3>
      <p>
        当サイトが見ているのは<strong>公式サイトに何が書かれているか</strong>だけです。
        技術力、納品物の質、担当者との相性、実際の価格は含まれていません。
        料金を公開していない会社が不誠実だという意味でもありません（個別見積もりが必要な業態は普通にあります）。
        <strong>発注先を絞り込む最初のふるいとしてお使いください。</strong>
      </p>

      <h2>データの公開</h2>
      <p>出典を明記していただければ引用・再利用は自由です（CC BY 4.0）。</p>
      <div className="chips">
        <a href="/opendata/ai-service-facts.json">JSONをダウンロード</a>
        <a href="/opendata/ai-service-facts.csv">CSVをダウンロード</a>
      </div>
      <p className="note" style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', padding: '14px 16px' }}>
        出典：{SITE.name}「AI関連企業{all.length}社の開示状況調査」（{checked[checked.length - 1]} 時点）{SITE.origin}/data/
      </p>
    </article>
  )
}
