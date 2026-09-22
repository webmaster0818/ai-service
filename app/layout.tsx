import type { Metadata } from 'next'
import './globals.css'
import { SITE, CATEGORIES } from '@/lib/data'

// ⚠️ ここに静的な alternates.canonical を書かない（子ページが継承して全ページがトップを指す事故になる）。
export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),
  title: { default: `${SITE.name}｜AI開発・LLMO対策の発注先を1社ずつ確認して比較`, template: `%s｜${SITE.name}` },
  description: SITE.description,
  // OGPは1枚を全ページ共通で使う。会社ごとに画像を作ると、他社のロゴや版面を
  // 当サイトの成果物のように配ることになる。
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: 'ja_JP',
    url: `${SITE.origin}/`,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: { card: 'summary_large_image', images: ['/og-image.png'] },
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
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site">
          <div className="wrap">
            <p className="note" style={{ maxWidth: 640 }}>
              当サイトの掲載内容は、各社の<strong>公式サイトで確認できた事実のみ</strong>です。
              確認できなかった項目は空欄にし「未確認」と表示しています。推定値では埋めません。
              また、他社の「おすすめ○選」記事は情報源にしていません。あれは広告であり一次情報ではないためです。
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
