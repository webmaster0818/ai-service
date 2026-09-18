// 掲載企業データの読み込みと横断集計。
//
// ■ このサイトの価値は「49社を1社ずつ公式サイトで確認した」という事実そのもの
//   公開情報を並べただけの企業ページは Scaled Content と判定される（takushoku-biyori で被弾済み）。
//   だから当サイトは **横断集計** を主役にする。「料金を公開しているのは確認できた20社中12社」は、
//   全社を個別に見た当サイトにしか出せない。
//
// ■ 数値の扱い（data/schema.md の前提をコードで担保する）
//   ・確認できなかった項目は埋めない。null のまま「未確認」と表示する
//   ・分母は必ず「確認できた社数」にする。未確認を False 側に混ぜない
//   ・全社が sourceUrl と checkedAt を持ち、画面に出す
import fs from 'node:fs'
import path from 'node:path'

export type Company = {
  name: string
  officialUrl: string
  categories: string[]
  categorySource?: Record<string, string>
  priceDisclosed: boolean | null
  priceNote?: string | null
  priceSource?: string | null
  casesDisclosed: boolean | null
  casesCount?: string | null
  casesSource?: string | null
  pagesChecked?: number
  checkedAt: string
}

export type CompanyProfile = {
  name: string
  officialUrl: string
  founded?: string
  employees?: string
  listing?: string
  representative?: string
  infoPageUrl?: string
  checkedAt?: string
}

export const CATEGORIES: { slug: string; label: string; blurb: string }[] = [
  { slug: 'ai-kaihatsu', label: 'AI開発', blurb: 'AIモデル・システムの受託開発を掲げている会社' },
  { slug: 'dx-consul', label: 'DXコンサル', blurb: '業務のデジタル化・変革の支援を掲げている会社' },
  { slug: 'naisei-shien', label: '内製化支援', blurb: '発注側が自分たちで作れるようにする支援を掲げている会社' },
  { slug: 'llmo', label: 'LLMO対策', blurb: '生成AIに引用されるための最適化を掲げている会社' },
  { slug: 'aeo', label: 'AEO対策', blurb: '回答エンジン向けの最適化を掲げている会社' },
  { slug: 'web-seisaku', label: 'Web制作', blurb: 'サイト制作を掲げている会社' },
]

function read<T>(f: string): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', f), 'utf-8'))
}

let cache: Company[] | null = null
export function companies(): Company[] {
  if (!cache) cache = read<Company[]>('service-facts.json')
  return cache!
}

let pcache: CompanyProfile[] | null = null
export function profiles(): CompanyProfile[] {
  if (!pcache) pcache = read<CompanyProfile[]>('company-facts.json')
  return pcache!
}

export function profileOf(name: string) {
  return profiles().find((p) => p.name === name)
}

/** URLは公式ドメインの先頭ラベルを使う。社名の表記ゆれに左右されず、読んで会社が分かる。 */
export function slugOf(c: Company): string {
  try {
    const h = new URL(c.officialUrl).hostname.replace(/^www\./, '')
    return h.split('.')[0].toLowerCase()
  } catch {
    return c.name.toLowerCase()
  }
}

export function findBySlug(slug: string) {
  return companies().find((c) => slugOf(c) === slug)
}

export function labelOf(cat: string) {
  return CATEGORIES.find((c) => c.slug === cat)?.label ?? cat
}

export function inCategory(cat: string) {
  return companies().filter((c) => (c.categories || []).includes(cat))
}

/**
 * 開示状況の集計。
 * ⚠️ 分母は「確認できた社数（true+false）」。未確認をfalse扱いすると「公開していない会社が多い」という
 *    事実と違う結論になる。tomomi-2 が過去に自社ブログを根拠に誤判定した件と同じ種類の事故を防ぐ。
 */
export function disclosure(field: 'priceDisclosed' | 'casesDisclosed') {
  const all = companies()
  const yes = all.filter((c) => c[field] === true).length
  const no = all.filter((c) => c[field] === false).length
  const unknown = all.filter((c) => c[field] === null || c[field] === undefined).length
  return { yes, no, unknown, judged: yes + no, total: all.length }
}

/** 単一カテゴリだけを掲げている会社＝その領域の専業。 */
export function specialists(cat: string) {
  return inCategory(cat).filter((c) => (c.categories || []).length === 1)
}

export const SITE = {
  name: 'AIサービス比較ナビ',
  // ⚠️ ドメインはMediaXAI側で取得中。確定後ここだけ差し替えれば canonical と sitemap が追随する。
  origin: 'https://to-x-ai.com',
  description:
    'AI開発・DXコンサル・LLMO対策などを手がける企業を1社ずつ公式サイトで確認し、料金と実績の開示状況を横断集計しています。他社のおすすめ記事は情報源にしていません。',
}
