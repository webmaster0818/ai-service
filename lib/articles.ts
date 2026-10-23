// 記事（content/articles/*.md）の読み込み。
//
// ■ 記事も会社ページと同じく「出典で確かめられる事実」だけを書く。
//   前付けの sources に挙げた URL を記事末尾に必ず出し、数字・日付はそこから辿れるようにする。
// ■ 前付けは「key: value」の1行形式だけを読む（YAML ライブラリは入れない）。
//   sources は「- タイトル | URL」の行を並べる。
import fs from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'

export type Source = { title: string; url: string }

export type Article = {
  slug: string
  title: string
  description: string
  published: string
  updated: string
  related: string[]
  sources: Source[]
  html: string
  draft: boolean
  // 冒頭の画像（public/ からのパス）。無い記事は出さない
  image?: string
  imageAlt?: string
}

const DIR = path.join(process.cwd(), 'content', 'articles')

function parse(file: string): Article {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf-8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) throw new Error(`${file}: 前付け（--- で囲む）がありません`)
  const meta: Record<string, string> = {}
  const sources: Source[] = []
  let inSources = false
  for (const line of m[1].split('\n')) {
    if (/^sources:\s*$/.test(line)) { inSources = true; continue }
    const s = line.match(/^\s*-\s*(.+?)\s*\|\s*(https?:\/\/\S+)\s*$/)
    if (inSources && s) { sources.push({ title: s[1], url: s[2] }); continue }
    const kv = line.match(/^([a-zA-Z]+):\s*(.*)$/)
    if (kv) { inSources = false; meta[kv[1]] = kv[2].trim() }
  }
  for (const k of ['title', 'description', 'published']) {
    if (!meta[k]) throw new Error(`${file}: ${k} がありません`)
  }
  // ⚠️ 出典のない記事は出さない（ビルドを止める）
  if (!sources.length) throw new Error(`${file}: sources がありません`)
  return {
    slug: file.replace(/\.md$/, ''),
    title: meta.title,
    description: meta.description,
    published: meta.published,
    updated: meta.updated || meta.published,
    related: (meta.related || '').split(',').map((x) => x.trim()).filter(Boolean),
    sources,
    html: marked.parse(m[2], { async: false }) as string,
    draft: meta.draft === 'true',
    image: meta.image || undefined,
    imageAlt: meta.imageAlt || undefined,
  }
}

export function allArticles(): Article[] {
  if (!fs.existsSync(DIR)) return []
  return fs.readdirSync(DIR)
    .filter((f) => f.endsWith('.md'))
    .map(parse)
    .filter((a) => !a.draft)
    .sort((a, b) => (a.published < b.published ? 1 : -1))
}

export function articleBySlug(slug: string) {
  return allArticles().find((a) => a.slug === slug)
}
