// ビルド後に out/ へ sitemap.xml / robots.txt / オープンデータを書き出す。
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'out')
const ORIGIN = 'https://to-x-ai.com'
const all = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-facts.json'), 'utf-8'))
const CATS = ['ai-kaihatsu','dx-consul','naisei-shien','llmo','aeo','web-seisaku']

const slugOf = (c) => { try { return new URL(c.officialUrl).hostname.replace(/^www\./,'').split('.')[0].toLowerCase() } catch { return c.name } }
const urls = ['/', '/data/', ...CATS.map(c => `/category/${c}/`), ...all.map(c => `/company/${slugOf(c)}/`)]
const today = all.map(c => c.checkedAt).sort().pop()

fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `<url><loc>${ORIGIN}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + `\n</urlset>\n`)
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`)

const odir = path.join(OUT, 'opendata'); fs.mkdirSync(odir, { recursive: true })
fs.writeFileSync(path.join(odir, 'ai-service-facts.json'),
  JSON.stringify({ license: 'CC BY 4.0', note: '公式サイトで確認できた事実のみ。未確認はnull', companies: all }, null, 1))
const cols = ['name','officialUrl','categories','priceDisclosed','priceNote','casesDisclosed','casesCount','pagesChecked','checkedAt']
const esc = v => v === undefined || v === null ? '' : Array.isArray(v) ? `"${v.join('|')}"`
  : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v)
fs.writeFileSync(path.join(odir, 'ai-service-facts.csv'),
  cols.join(',') + '\n' + all.map(c => cols.map(k => esc(c[k])).join(',')).join('\n') + '\n')

console.log(`sitemap ${urls.length} URL / opendata ${all.length}社 を out/ に書き出しました`)
