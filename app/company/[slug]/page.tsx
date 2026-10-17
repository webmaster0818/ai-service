import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { companies, findBySlug, slugOf, profileOf, CATEGORIES, labelOf, inCategory, SITE } from '@/lib/data'
import Link from 'next/link'
import { JsonLd, breadcrumb, companyLd, ogFor } from '@/lib/seo'

export function generateStaticParams() {
  return companies().map((c) => ({ slug: slugOf(c) }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = findBySlug(slug)
  if (!c) return {}
  const cs = c.categories || []
  const cats = cs.map(labelOf).join('・')
  return {
    title: `${c.name}が公式サイトで掲げている領域と開示状況`,
    // ⚠️ 領域を14に増やしたら、全部並べる書き方では説明文が120字を超えた（17社）。
    //    数と代表的な3つまでにして、残りは件数で示す。
    description: cs.length === 0
      ? `${c.name}について、料金と実績の公開状況を、確認日と出典URLを付して掲載しています（公式サイトの記載から掲げている領域は判定できませんでした）。`
      : cs.length > 3
      ? `${c.name}が公式サイトで掲げているのは${cs.slice(0, 3).map(labelOf).join('・')}ほか計${cs.length}領域です。料金と実績の公開状況を、確認日と出典URLを付して掲載しています。`
      : `${c.name}が公式サイトで掲げているのは${cats}です。料金と実績の公開状況を、確認日と出典URLを付して掲載しています。`,
    alternates: { canonical: `${SITE.origin}/company/${slug}/` },
    openGraph: ogFor(`${SITE.origin}/company/${slug}/`),
  }
}

function Mark({ v }: { v: boolean | null | undefined }) {
  if (v === true) return <strong>公開されています</strong>
  if (v === false) return <>公式サイトで記載を確認できませんでした</>
  return <span className="unknown">未確認</span>
}

/** 結論欄の一文。表の Mark をそのまま文中に差し込むと「公開されている状態です」のような崩れた文になるため、文として組み立てる。 */
function status(label: string, v: boolean | null | undefined) {
  if (v === true) return `${label}は公開されています。`
  if (v === false) return `${label}は公式サイトで記載を確認できませんでした。`
  return `${label}の公開状況は未確認です。`
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = findBySlug(slug)
  if (!c) notFound()
  const p = profileOf(c.name)
  const cats = c.categories || []
  const isSpecialist = cats.length === 1

  // ⚠️ 領域を1つも判定できなかった会社（アムール）は、どの領域ページにも出ないため
  //    トップからの1本しか張られず孤立していた。名前順で前後の会社を相互に張って繋ぐ。
  const all = [...companies()].sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  const i = all.findIndex((x) => slugOf(x) === slug)
  const nearby = all.slice(Math.max(0, i - 3), i + 4).filter((x) => slugOf(x) !== slug)

  const ld = [
    companyLd(c),
    breadcrumb([
      { name: 'トップ', url: '/' },
      ...(cats[0] ? [{ name: labelOf(cats[0]), url: `/category/${cats[0]}/` }] : []),
      { name: c.name, url: `/company/${slug}/` },
    ]),
  ]

  return (
    <article>
      <JsonLd data={ld} />
      <p className="note" style={{ marginTop: 28 }}><a href="/">トップ</a> ／ {c.name}</p>
      <h1>{c.name}が公式サイトで掲げている領域</h1>

      <div className="verdict">
        <div className="tag">確認結果</div>
        <p className="headline">
          {cats.length > 0
            ? <>{c.name}が掲げている領域は<span className="num">{cats.length}</span>つです（{cats.map(labelOf).join('・')}）。</>
            : <>{c.name}について、公式サイトの記載から掲げている領域を判定できませんでした。</>}
        </p>
        <p style={{ margin: 0 }}>
          {isSpecialist
            ? `当サイトが調査している${CATEGORIES.length}領域のうち、掲げているのはこの1領域のみです。当サイトでは、この状態を「専業」として区別しています（${CATEGORIES.length}領域以外の事業は調査対象外です）。`
            : cats.length > 1
              ? `複数の領域を掲げています。いずれが主力事業であるかは公式サイトの記載から判断できないため、当サイトでは順位付けを行っていません。`
              : ''}
          {cats.length > 0 ? '　' : ''}{status('料金', c.priceDisclosed)}{status('実績', c.casesDisclosed)}
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
        ※「未確認」および記載のない項目は、当サイトが公式サイト上で確認できなかったことを示すもので、公開していないことを意味するものではありません。
      </p>

      {cats.length > 0 && (<>
      <h2>領域判定の根拠</h2>
      <p className="note">
        判定は、サービス紹介ページの記載にもとづいています。ブログ・コラム・ニュース記事は根拠としていません
        （他社を比較した記事の内容は、その企業の事業内容を示すものではないためです）。
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
                    : <span className="unknown">根拠URLの記録なし</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>同じ領域を掲げている企業</h2>
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
      </>)}

      <p className="note" style={{ marginTop: 36 }}>
        当サイトは各社から掲載料を受け取っておらず、順位付けは行っていません。掲載内容は、公式サイトで確認できた事実に限っています。
      </p>
      <h2>その他の掲載企業</h2>
      <div className="grid">
        {nearby.map((x) => (
          <Link className="card" key={x.officialUrl} href={`/company/${slugOf(x)}/`}>
            <p className="t">{x.name}</p>
            <p className="k">
              {(x.categories || []).length > 0
                ? (x.categories || []).slice(0, 2).map(labelOf).join('・')
                : '領域を判定できませんでした'}
            </p>
          </Link>
        ))}
      </div>

    </article>
  )
}
