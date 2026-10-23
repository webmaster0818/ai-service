import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allArticles, articleBySlug } from '@/lib/articles'
import { SITE, CATEGORIES } from '@/lib/data'
import { JsonLd, breadcrumb, ogFor } from '@/lib/seo'

export function generateStaticParams() {
  return allArticles().map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const a = articleBySlug(slug)
  if (!a) return {}
  const url = `${SITE.origin}/articles/${slug}/`
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: url },
    openGraph: {
      ...ogFor(url),
      type: 'article' as const,
      ...(a.image ? { images: [{ url: `${SITE.origin}${a.image}`, width: 1200, height: 630, alt: a.imageAlt || a.title }] } : {}),
    },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const a = articleBySlug(slug)
  if (!a) notFound()
  const url = `${SITE.origin}/articles/${slug}/`
  const others = allArticles().filter((x) => x.slug !== slug)
  const cats = a.related.map((s) => CATEGORIES.find((c) => c.slug === s)).filter((c): c is (typeof CATEGORIES)[number] => !!c)

  const ld = [
    breadcrumb([{ name: 'トップ', url: '/' }, { name: '記事', url: '/articles/' }, { name: a.title, url: `/articles/${slug}/` }]),
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: a.description,
      datePublished: a.published,
      dateModified: a.updated,
      mainEntityOfPage: url,
      inLanguage: 'ja',
      author: { '@type': 'Organization', name: `${SITE.name} 編集部`, url: `${SITE.origin}/` },
      publisher: { '@type': 'Organization', name: SITE.name, url: `${SITE.origin}/` },
      citation: a.sources.map((s) => s.url),
      ...(a.image ? { image: `${SITE.origin}${a.image}` } : {}),
    },
  ]

  return (
    <article className="post">
      <JsonLd data={ld} />
      <p className="note" style={{ marginTop: 28 }}><a href="/">トップ</a> ／ <a href="/articles/">記事</a></p>
      <h1>{a.title}</h1>
      <p className="note">
        公開 {a.published}{a.updated !== a.published ? `／更新 ${a.updated}` : ''}　{SITE.name} 編集部
      </p>
      {a.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="post-hero" src={a.image} alt={a.imageAlt || a.title} width={1200} height={630} />
      )}
      <div className="post-body" dangerouslySetInnerHTML={{ __html: a.html }} />

      <h2>出典</h2>
      <ol className="sources">
        {a.sources.map((s) => (
          <li key={s.url}>{s.title}<br /><a href={s.url} rel="noopener" target="_blank">{s.url}</a></li>
        ))}
      </ol>

      {cats.length > 0 && (
        <>
          <h2>関連する領域の企業</h2>
          <div className="chips">
            {cats.map((c) => <a key={c.slug} href={`/category/${c.slug}/`}>{c.label}</a>)}
          </div>
        </>
      )}

      {others.length > 0 && (
        <>
          <h2>ほかの記事</h2>
          <div className="article-list">
            {others.slice(0, 6).map((x) => (
              <a className="card" key={x.slug} href={`/articles/${x.slug}/`}>
                <p className="t">{x.title}</p>
              </a>
            ))}
          </div>
        </>
      )}
    </article>
  )
}
