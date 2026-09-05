/** @type {import('next').NextConfig} */
// Cloudflare Pages へローカルビルド方式で載せるため静的書き出しに固定する。
const nextConfig = { output: 'export', images: { unoptimized: true }, trailingSlash: true }
export default nextConfig
