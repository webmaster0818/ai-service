import { SITE, labelOf, slugOf, profileOf, type Company } from './data'

/**
 * 構造化データの組み立て。
 *
 * ⚠️ 会社ページに aggregateRating / Review は出さない。
 *    このサイトは「公式サイトに何が書いてあるか」を確認しただけで、評価はしていない。
 * ⚠️ Offer も出さない。料金は「公開されているか」しか見ておらず、金額を持っていない。
 * ⚠️ Organization は公式サイト（officialUrl）を `@id` と `url` にして、
 *    このサイトのページは `subjectOf` として繋ぐ。会社の正体は公式サイト側にある。
 */

type Crumb = { name: string; url: string }

export function breadcrumb(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url.startsWith('http') ? c.url : `${SITE.origin}${c.url}`,
    })),
  }
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: `${SITE.origin}/`,
    description: SITE.description,
    inLanguage: 'ja',
    publisher: { '@type': 'Organization', name: SITE.name, url: `${SITE.origin}/` },
  }
}

export function itemListLd(name: string, urls: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: urls.length,
    itemListElement: urls.map((u, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.origin}${u}`,
    })),
  }
}

/**
 * 会社ページ。公式サイトで確認できた事実だけを入れる。
 * 創業日・従業員数は自由記述（「2007年1月15日」「268名」）なので、
 * foundingDate / numberOfEmployees の型に合うものだけを機械可読にする。
 */
export function companyLd(c: Company) {
  const p = profileOf(c.name)
  const founded = p?.founded?.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  const employees = p?.employees?.match(/^([\d,]+)\s*名/)

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': c.officialUrl,
    name: c.name,
    url: c.officialUrl,
    ...(founded
      ? { foundingDate: `${founded[1]}-${founded[2].padStart(2, '0')}-${founded[3].padStart(2, '0')}` }
      : {}),
    ...(employees
      ? {
          numberOfEmployees: {
            '@type': 'QuantitativeValue',
            value: Number(employees[1].replace(/,/g, '')),
          },
        }
      : {}),
    ...(p?.representative ? { description: p.representative } : {}),
    knowsAbout: (c.categories || []).map(labelOf),
    subjectOf: {
      '@type': 'WebPage',
      '@id': `${SITE.origin}/company/${slugOf(c)}/`,
      url: `${SITE.origin}/company/${slugOf(c)}/`,
      name: `${c.name}が公式サイトで掲げている領域と開示状況`,
      dateModified: c.checkedAt,
    },
  }
}

export function JsonLd({ data }: { data: object | object[] }) {
  const arr = Array.isArray(data) ? data : [data]
  return (
    <>
      {arr.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  )
}
