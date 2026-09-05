import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CATEGORIES, inCategory, specialists, slugOf, labelOf, SITE } from '@/lib/data'

export function generateStaticParams() {
  return CATEGORIES.filter((c) => inCategory(c.slug).length > 0).map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = CATEGORIES.find((x) => x.slug === slug)
  if (!c) return {}
  const rows = inCategory(slug)
  return {
    title: `${c.label}を掲げている企業${rows.length}社の開示状況`,
    description: `${c.label}を公式サイトで掲げている${rows.length}社について、料金と実績の公開状況を1社ずつ確認しました。うち${specialists(slug).length}社はこの領域だけを掲げています。`,
    alternates: { canonical: `${SITE.origin}/category/${slug}/` },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = CATEGORIES.find((x) => x.slug === slug)
  if (!c) notFound()
  const rows = inCategory(slug)
  if (!rows.length) notFound()

  const sp = specialists(slug)
  const priceYes = rows.filter((x) => x.priceDisclosed === true).length
  const priceJudged = rows.filter((x) => x.priceDisclosed !== null && x.priceDisclosed !== undefined).length
  const casesYes = rows.filter((x) => x.casesDisclosed === true).length

  return (
    <article>
      <p className="note" style={{ marginTop: 28 }}><a href="/">トップ</a> ／ {c.label}</p>
      <h1>{c.label}を掲げている企業{rows.length}社</h1>

      <div className="verdict">
        <div className="tag">まず結論</div>
        <p className="headline">
          {rows.length}社のうち、{c.label}<strong>だけ</strong>を掲げているのは<span className="num">{sp.length}</span>社です。
        </p>
        <p style={{ margin: 0 }}>
          {sp.length === 0
            ? `この領域を専業として掲げている会社は、当サイトの調査範囲にはありませんでした。つまり${c.label}は、既存事業に足したメニューとして提供されているのが実情です。`
            : `残る${rows.length - sp.length}社は、他の領域と併せて${c.label}を提供しています。${c.label}を専門にしている会社なのか、既存事業に足したメニューなのかは、発注前に確認する価値があります。`}
        </p>
      </div>

      <p>
        料金を公開しているのは判断できた<span className="num">{priceJudged}</span>社のうち<span className="num">{priceYes}</span>社、
        実績を公開しているのは<span className="num">{casesYes}</span>社でした。
      </p>

      {sp.length > 0 && (
        <>
          <h2>{c.label}だけを掲げている会社</h2>
          <div className="grid">
            {sp.map((x) => (
              <a className="card" key={x.officialUrl} href={`/company/${slugOf(x)}/`}>
                <p className="t">{x.name}</p>
                <p className="k">
                  料金 {x.priceDisclosed === true ? '公開' : x.priceDisclosed === false ? '記載なし' : '未確認'}
                  　／　実績 {x.casesDisclosed === true ? '公開' : '未確認'}
                </p>
              </a>
            ))}
          </div>
        </>
      )}

      <h2>{c.label}を掲げている全{rows.length}社</h2>
      <div className="scroll-x">
        <table className="data">
          <thead>
            <tr><th style={{ width: '30%' }}>会社</th><th>料金</th><th>実績</th><th>掲げている領域</th><th>確認日</th></tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.officialUrl}>
                <td><a href={`/company/${slugOf(x)}/`}>{x.name}</a></td>
                <td>{x.priceDisclosed === true ? '公開' : x.priceDisclosed === false ? '記載なし' : <span className="unknown">未確認</span>}</td>
                <td>{x.casesDisclosed === true ? '公開' : <span className="unknown">未確認</span>}</td>
                <td>{(x.categories || []).map(labelOf).join('・')}</td>
                <td>{x.checkedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        ※「記載なし」は公式サイト上で確認できなかったという意味で、非公開と断定するものではありません。
        当サイトは各社から掲載料を受け取っておらず、順位づけもしていません。
      </p>

      <div className="chips" style={{ marginTop: 32 }}>
        {CATEGORIES.map((x) => <a key={x.slug} href={`/category/${x.slug}/`}>{x.label}</a>)}
      </div>
    </article>
  )
}
