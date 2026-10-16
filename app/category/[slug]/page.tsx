import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CATEGORIES, inCategory, focused, FOCUS_MAX, slugOf, labelOf, SITE } from '@/lib/data'
import { JsonLd, breadcrumb, itemListLd } from '@/lib/seo'

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
    description: `${c.label}を公式サイトで掲げている${rows.length}社について、料金と実績の公開状況を個別に確認し、掲載しています。このうち${focused(slug).length}社は、掲げている領域が${FOCUS_MAX}つ以内です。`,
    alternates: { canonical: `${SITE.origin}/category/${slug}/` },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = CATEGORIES.find((x) => x.slug === slug)
  if (!c) notFound()
  const rows = inCategory(slug)
  if (!rows.length) notFound()

  const sp = focused(slug)
  const priceYes = rows.filter((x) => x.priceDisclosed === true).length
  const priceJudged = rows.filter((x) => x.priceDisclosed !== null && x.priceDisclosed !== undefined).length
  const casesYes = rows.filter((x) => x.casesDisclosed === true).length

  const ld = [
    breadcrumb([{ name: 'トップ', url: '/' }, { name: c.label, url: `/category/${slug}/` }]),
    itemListLd(`${c.label}を掲げている企業`, rows.map((x) => `/company/${slugOf(x)}/`)),
  ]

  return (
    <article>
      <JsonLd data={ld} />
      <p className="note" style={{ marginTop: 28 }}><a href="/">トップ</a> ／ {c.label}</p>
      <h1>{c.label}を掲げている企業{rows.length}社</h1>

      <div className="verdict">
        <div className="tag">掲載状況</div>
        <p className="headline">
          {rows.length}社のうち、掲げている領域が<strong>{FOCUS_MAX}つ以内</strong>の企業は<span className="num">{sp.length}</span>社です。
        </p>
        <p style={{ margin: 0 }}>
          {sp.length === 0
            ? `${c.label}を掲げている企業は、いずれも${c.label}以外に多くの領域をあわせて掲げています。${c.label}は単独の事業としてではなく、既存事業に付加するサービスとして提供される傾向があります。`
            : `残る${rows.length - sp.length}社は、${c.label}を含めて${FOCUS_MAX + 1}つ以上の領域を掲げています。${c.label}を主力とする企業か、提供サービスの一つとして扱う企業かは、発注前にご確認いただくことをおすすめします。`}
        </p>
      </div>

      <p>
        料金の公開有無を判断できた<span className="num">{priceJudged}</span>社のうち、料金を公開している企業は<span className="num">{priceYes}</span>社です。
        実績を公開している企業は<span className="num">{casesYes}</span>社です。
      </p>

      {sp.length > 0 && (
        <>
          <h2>{c.label}を含め、掲げている領域が{FOCUS_MAX}つ以内の企業</h2>
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

      <h2>{c.label}を掲げている企業の一覧（{rows.length}社）</h2>
      <div className="scroll-x">
        <table className="data">
          <thead>
            <tr><th style={{ width: '30%' }}>企業名</th><th>料金</th><th>実績</th><th>掲げている領域</th><th>確認日</th></tr>
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
        ※「記載なし」は、公式サイト上で記載を確認できなかったことを示すもので、非公開であると断定するものではありません。
        当サイトは各社から掲載料を受け取っておらず、順位付けは行っていません。
      </p>

      <div className="chips" style={{ marginTop: 32 }}>
        {CATEGORIES.map((x) => <a key={x.slug} href={`/category/${x.slug}/`}>{x.label}</a>)}
      </div>
    </article>
  )
}
