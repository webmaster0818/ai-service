import type { Metadata } from 'next'
import './globals.css'
import { SITE, CATEGORIES } from '@/lib/data'
import { OG_IMAGE } from '@/lib/seo'

// ⚠️ ここに静的な alternates.canonical を書かない（子ページが継承して全ページがトップを指す事故になる）。

export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),
  title: { default: `${SITE.name}｜AI開発・LLMO対策の発注先を公式サイトの情報で比較`, template: `%s｜${SITE.name}` },
  description: SITE.description,
  // OGPは1枚を全ページ共通で使う。会社ごとに画像を作ると、他社のロゴや版面を
  // 当サイトの成果物のように配ることになる。
  // ⚠️ ここに openGraph.url を書かない（全ページが継承して og:url がトップを指す）。各ページで ogFor(canonical) を使う。
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: 'ja_JP',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: { card: 'summary_large_image', images: [OG_IMAGE] },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="site">
          <div className="inner">
            <a className="logo" href="/">AI SERVICE NAVI</a>
            <nav>
              {CATEGORIES.map((c) => <a key={c.slug} href={`/category/${c.slug}/`}>{c.label}</a>)}
              <a href="/data/">調査データ</a>
              <a href="/articles/">記事</a>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site">
          <div className="wrap">
            <p className="note" style={{ maxWidth: 640 }}>
              当サイトの掲載内容は、各社の<strong>公式サイトで確認できた事実</strong>に限っています。
              確認できなかった項目は「未確認」と表示し、推定による値は掲載していません。
              また、他社の「おすすめ○選」記事は広告を含み一次情報ではないため、情報源としていません。
            </p>
            <p className="note">
              各社ページに確認日と出典URLを記載しています。／ <a href="/data/">調査データを見る</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
