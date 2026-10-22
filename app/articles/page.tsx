import type { Metadata } from 'next'
import { allArticles } from '@/lib/articles'
import { SITE } from '@/lib/data'
import { JsonLd, breadcrumb, itemListLd, ogFor } from '@/lib/seo'

export const metadata: Metadata = {
  title: '記事一覧（AI・セキュリティの解説）',
  description: 'AIの導入やWebサイトのセキュリティについて、公的機関・公式発表の一次情報をもとに解説した記事の一覧です。',
  alternates: { canonical: `${SITE.origin}/articles/` },
  openGraph: ogFor(`${SITE.origin}/articles/`),
}

export default function Page() {
  const rows = allArticles()
  return (
    <article>
      <JsonLd data={[
        breadcrumb([{ name: 'トップ', url: '/' }, { name: '記事', url: '/articles/' }]),
        itemListLd('記事一覧', rows.map((a) => `/articles/${a.slug}/`)),
      ]} />
      <p className="note" style={{ marginTop: 28 }}><a href="/">トップ</a> ／ 記事</p>
      <h1>記事一覧</h1>
      <p>
        AIの導入やWebサイトのセキュリティについて、公的機関・公式発表などの一次情報をもとに解説しています。
        各記事の末尾に出典を記載しています。
      </p>
      <div className="article-list">
        {rows.map((a) => (
          <a className="card" key={a.slug} href={`/articles/${a.slug}/`}>
            <p className="k">{a.published}{a.updated !== a.published ? `（更新 ${a.updated}）` : ''}</p>
            <p className="t">{a.title}</p>
            <p className="k">{a.description}</p>
          </a>
        ))}
      </div>
    </article>
  )
}
