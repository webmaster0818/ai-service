import type { Metadata } from 'next'
import { companies, disclosure, CATEGORIES, inCategory, specialists, focused, FOCUS_MAX, SITE } from '@/lib/data'
import { JsonLd, breadcrumb, ogFor } from '@/lib/seo'

// ⚠️ 社数を文字で書かない。会社を足すと title・description・構造化データだけ古い数字が残る
//    （2026-10-02、49社のまま66社になるところだった）。必ず companies().length から出す。
const N = companies().length

export const metadata: Metadata = {
  title: `AI関連企業${N}社の開示状況調査（データ公開）`,
  description:
    `AI開発・DXコンサル・LLMO対策などを掲げる${N}社の公式サイトを個別に確認し、料金と実績の開示状況を集計しています。集計方法と調査範囲を明記し、JSON・CSV形式で公開しています。`,
  alternates: { canonical: `${SITE.origin}/data/` },
    openGraph: ogFor(`${SITE.origin}/data/`),
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
      `AI開発・DXコンサル・内製化支援・LLMO/AEO対策・Web制作を公式サイトで掲げる企業${all.length}社について、料金と実績の開示状況を個別確認した調査データ。`,
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
          料金の公開有無を判断できた<span className="num">{price.judged}</span>社のうち、料金を公開している企業は<span className="num">{price.yes}</span>社、
          実績を公開している企業は<span className="num">{cases.yes}</span>社です。
        </p>
        <p style={{ margin: 0 }}>調査期間 {checked[0]} 〜 {checked[checked.length - 1]}／対象 {all.length}社</p>
      </div>

      <h2>領域別の内訳</h2>
      <div className="scroll-x">
        <table className="data">
          <thead><tr><th style={{ width: '30%' }}>領域</th><th>掲げている企業</th><th>うち{FOCUS_MAX}領域以内</th><th>うち専業</th><th>料金公開</th><th>実績公開</th></tr></thead>
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
        各社の公式サイトを巡回し、<strong>サービス紹介ページの記載</strong>から、掲げている領域、料金の公開有無、実績の公開有無を判定しています。
      </p>
      <h3>判定の根拠としない情報</h3>
      <p>
        ブログ・コラム・ニュース記事は判定に使用していません。他社を比較した記事に「Web制作」と記載されていても、
        それは<strong>記事内の説明であり、その企業の事業内容を示すものではない</strong>ためです。
        同様に、他社の「おすすめ○選」記事も、広告を含み一次情報ではないため、情報源としていません。
      </p>
      <h3>公開率の算出方法</h3>
      <p>
        料金の公開率は、<strong>「公開している」「記載を確認できなかった」のいずれかを判断できた{price.judged}社を分母</strong>としています。
        確認自体ができなかった{price.unknown}社を「公開していない」側に含めると、実態と異なる結果となるためです。
      </p>
      <h3>調査の範囲について</h3>
      <p>
        当サイトの調査対象は、<strong>公式サイトの記載内容</strong>に限られます。
        技術力、納品物の品質、担当者との相性、実際の取引価格は含まれていません。
        また、料金を公開していないことは、その企業の姿勢を評価するものではありません（個別見積もりを前提とする業態も多くあります）。
        <strong>発注先を絞り込む際の初期段階の参考情報としてご活用ください。</strong>
      </p>

      <h2>データの公開</h2>
      <p>出典を明記いただくことで、引用・再利用を自由に行っていただけます（CC BY 4.0）。</p>
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
