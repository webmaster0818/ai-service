import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { companies, findBySlug, slugOf, profileOf, CATEGORIES, labelOf, inCategory, SITE } from '@/lib/data'

export function generateStaticParams() {
  return companies().map((c) => ({ slug: slugOf(c) }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = findBySlug(slug)
  if (!c) return {}
  const cats = (c.categories || []).map(labelOf).join('・')
  return {
    title: `${c.name}が公式サイトで掲げている領域と開示状況`,
    description: `${c.name}が公式サイトで掲げているのは${cats}です。料金の公開状況・実績の公開状況を、確認日と出典URLつきで掲載しています。`,
    alternates: { canonical: `${SITE.origin}/company/${slug}/` },
  }
}

function Mark({ v }: { v: boolean | null | undefined }) {
  if (v === true) return <strong>公開されている</strong>
  if (v === false) return <>公式サイトに記載を確認できなかった</>
  return <span className="unknown">未確認</span>
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = findBySlug(slug)
  if (!c) notFound()
  const p = profileOf(c.name)
  const cats = c.categories || []
  const isSpecialist = cats.length === 1

  return (
    <article>
      <p className="note" style={{ marginTop: 28 }}><a href="/">トップ</a> ／ {c.name}</p>
      <h1>{c.name}が公式サイトで掲げている領域</h1>

      <div className="verdict">
        <div className="tag">確認できたこと</div>
        <p className="headline">
          {c.name}は<span className="num">{cats.length}</span>つの領域を掲げています：{cats.map(labelOf).join('・')}
        </p>
        <p style={{ margin: 0 }}>
          {isSpecialist
            ? `掲げているのはこの1領域だけです。当サイトでは、この状態を「専業」として区別しています。`
            : `複数の領域を掲げています。どれが本業なのかは公式サイトの記載からは判断できないため、当サイトでは順位づけをしていません。`}
          　料金は<Mark v={c.priceDisclosed} />、実績は<Mark v={c.casesDisclosed} />状態です。
        </p>
      </div>

      <h2>開示状況</h2>
      <div className="scroll-x">
        <table className="data">
          <tbody>
            <tr>
              <th>料金の公開</th>
              <td>
                <Mark v={c.priceDisclosed} />
                {c.priceNote && <div style={{ marginTop: 6 }}>{c.priceNote}</div>}
                {c.priceSource && (
                  <div className="src">出典：<a href={c.priceSource} rel="noopener noreferrer nofollow" target="_blank">公式ページ</a></div>
                )}
              </td>
            </tr>
            <tr>
              <th>実績・事例の公開</th>
              <td>
                <Mark v={c.casesDisclosed} />
                {c.casesCount && <div style={{ marginTop: 6 }}>公式サイトの記載：{c.casesCount}</div>}
                {c.casesSource && (
                  <div className="src">出典：<a href={c.casesSource} rel="noopener noreferrer nofollow" target="_blank">公式ページ</a></div>
                )}
              </td>
            </tr>
            <tr><th>公式サイト</th><td><a href={c.officialUrl} rel="noopener noreferrer nofollow" target="_blank">{c.officialUrl}</a></td></tr>
            {p?.founded && <tr><th>設立</th><td>{p.founded}</td></tr>}
            {p?.employees && <tr><th>従業員数</th><td>{p.employees}</td></tr>}
            {p?.listing && <tr><th>上場</th><td>{p.listing}</td></tr>}
            {p?.representative && <tr><th>代表者</th><td>{p.representative}</td></tr>}
            <tr><th>確認日</th><td>{c.checkedAt}{c.pagesChecked ? `（公式サイト内${c.pagesChecked}ページを確認）` : ''}</td></tr>
          </tbody>
        </table>
      </div>
      {p?.infoPageUrl && (
        <p className="src">会社情報の出典：<a href={p.infoPageUrl} rel="noopener noreferrer nofollow" target="_blank">{p.infoPageUrl}</a></p>
      )}
      <p className="note">
        ※空欄・未確認は「公開していない」という意味ではありません。当サイトが公式サイト上で確認できなかった、という意味です。
      </p>

      <h2>掲げている領域の根拠</h2>
      <p className="note">
        判定はサービス紹介ページの記載に基づきます。ブログ・コラム・ニュース記事は根拠に使っていません
        （他社を比較した記事の内容は、その会社の事業ではないためです）。
      </p>
      <div className="scroll-x">
        <table className="data">
          <thead><tr><th style={{ width: '34%' }}>領域</th><th>根拠にした公式ページ</th></tr></thead>
          <tbody>
            {cats.map((k) => (
              <tr key={k}>
                <td><a href={`/category/${k}/`}>{labelOf(k)}</a></td>
                <td>
                  {c.categorySource?.[k]
                    ? <a href={c.categorySource[k]} rel="noopener noreferrer nofollow" target="_blank">{c.categorySource[k]}</a>
                    : <span className="unknown">URLの記録なし</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>同じ領域を掲げている会社</h2>
      {cats.map((k) => (
        <div key={k}>
          <h3>{labelOf(k)}（{inCategory(k).length}社）</h3>
          <div className="chips">
            {inCategory(k).filter((x) => x.name !== c.name).slice(0, 12).map((x) => (
              <a key={x.officialUrl} href={`/company/${slugOf(x)}/`}>{x.name}</a>
            ))}
          </div>
          <p className="note"><a href={`/category/${k}/`}>{labelOf(k)}の一覧をすべて見る</a></p>
        </div>
      ))}

      <p className="note" style={{ marginTop: 36 }}>
        当サイトは各社から掲載料を受け取っておらず、順位づけもしていません。掲載しているのは公式サイトで確認できた事実だけです。
      </p>
    </article>
  )
}
