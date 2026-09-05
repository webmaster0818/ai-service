#!/usr/bin/env python3
"""公式サイトから「サービス面の事実」を収集する（会社概要の補完）。

fetch-company-facts.py は会社概要（設立・資本金等）を取る。
こちらは**サイト全体を見て**次を判定する:
  - categories   … AEO / LLMO / AI開発 等（**公式サイトの記載のみ**で判定）
  - priceDisclosed … 料金を公開しているか ★このサイトの差別化の核
  - casesDisclosed … 実績・事例を公開しているか

⚠️ 会社概要ページだけで判定すると誤る（実測: ナイル・PLAN-Bが「LLMO言及なし」と誤判定された）。
   サービスページまで辿る必要がある。
⚠️ 判定は必ず**根拠URL**とセットで残す。根拠を出せないものは false ではなく null（未確認）にする。
"""
import json
import re
import subprocess
import sys
import time
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent.parent
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# ⚠️ 日本語だけで判定すると、公式サイトが英語のみの会社（Sakana AI等）が
#    「カテゴリ判定不可」になる。英語表現も併記して拾えるようにする。
CATEGORY_PATTERNS = {
    "aeo":         [r"\bAEO\b", r"AEO対策", r"AI回答", r"アンサーエンジン",
                    r"answer engine optimi"],
    "llmo":        [r"\bLLMO\b", r"\bGEO\b", r"\bAIO\b", r"LLM最適化", r"AI検索最適化",
                    r"generative engine optimi", r"LLM optimi"],
    # ⚠️「生成AI活用」はここに入れない。作る（開発）とは限らず、
    #    導入・活用の支援を指していることが多いため dx-consul 側で拾う。
    "ai-kaihatsu": [r"AI開発", r"AI受託", r"生成AI.{0,6}(?:開発|構築)", r"機械学習.{0,4}開発", r"PoC",
                    r"AI development", r"custom AI", r"machine learning.{0,12}development",
                    r"foundation model", r"LLM development"],
    "web-seisaku": [r"Web制作", r"ホームページ制作", r"サイト制作", r"web (?:site )?production"],
    # ⚠️ FIXERは「生成AI活用」「DXをご支援」と書いているのに1つも判定できていなかった。
    #    実文言を確認したうえで、その書き方を拾えるようにした（推測での拡張はしない）。
    "dx-consul":   [r"DX支援", r"DXコンサル", r"DX.{0,4}(?:を)?ご?支援", r"DX推進",
                    r"AI導入支援", r"AIコンサル", r"生成AI.{0,4}活用", r"生成AI.{0,4}導入",
                    r"AI consulting", r"digital transformation"],
    "naisei-shien": [r"内製化支援", r"内製化", r"in-house.{0,12}(?:support|enablement)"],
}
# 料金公開の判定: 「円」を含む具体的な金額が料金文脈にあるか
PRICE_PAT = re.compile(r"(月額|初期費用|料金プラン|価格|費用)[^。]{0,40}?([0-9０-９,，]{2,}\s*万?円)")
PRICE_HIDDEN = re.compile(r"(料金|費用|価格)[^。]{0,20}(要問[いあ]?合わせ|お問い合わせ|応相談|個別見積)")
CASE_PAT = re.compile(r"(導入事例|支援実績|制作実績|お客様の声|実績紹介|CASE)")
CASE_COUNT = re.compile(r"(?:実績|支援|導入)[^。]{0,10}?([0-9,，]{2,})\s*(社|件|店舗)")


CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def fetch(url, timeout=25):
    """通常はcurl。中身がJavaScriptで描画されるサイトはheadless Chromeに切り替える。

    ⚠️ 実測で2社（アムール/divx）がcurlではリンク5個・2個しか取れず、
       会社概要にもサービスページにも辿れなかった。HTMLは返るが中身が無い状態。
       「HTTP 200なのに情報が取れない」ときはJS描画を疑う。
    """
    try:
        r = subprocess.run(["curl", "-sL", "--max-time", str(timeout), "-A", UA, url],
                           capture_output=True, text=True, timeout=timeout + 10)
        html = r.stdout or ""
    except Exception:
        html = ""
    # リンクが極端に少ない = JSで組み立てている可能性が高い
    if html and len(re.findall(r'href="', html)) >= 8:
        return html
    return fetch_rendered(url, timeout) or html


def fetch_rendered(url, timeout=25, tries=3):
    """headless Chromeで描画後のHTMLを得る。

    ⚠️ --virtual-time-budget は使わない（描画途中で打ち切られる実績あり）。
    ⚠️ --dump-dom は**JSの描画完了を待たない**。同じURLで 19KB / 245KB / 245KB と揺れ、
       小さい方を掴んだ回だけ AIdeaLab が「2ページ・カテゴリ判定不可」になっていた。
       取得できたうち最も大きいものを採る（＝描画が進んだ回を選ぶ）。
    """
    if not Path(CHROME).exists():
        return ""
    best = ""
    for _ in range(tries):
        try:
            r = subprocess.run(
                [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
                 f"--user-agent={UA}", "--dump-dom", url],
                capture_output=True, text=True, timeout=timeout + 25)
            html = r.stdout or ""
        except Exception:
            html = ""
        if len(html) > len(best):
            best = html
        # 十分な量が取れたら打ち切る（毎回3回起動すると遅いため）
        if len(re.findall(r'href="', best)) >= 8:
            break
    return best


def text_of(html):
    t = re.sub(r"<script[\s\S]*?</script>", " ", html)
    t = re.sub(r"<style[\s\S]*?</style>", " ", t)
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", t)


# ブログ・コラム・ニュース記事のURL。
# ⚠️ ここを「その会社が何をやっているか」の根拠にしてはいけない。
#    実測で Queue の web-seisaku / dx-consul が、**他社を比較した自社ブログ記事**から
#    判定されていた（/blog/llmo-companies-btob-comparison-2026）。
#    ニュートラルワークスの naisei-shien も「LLMO会社おすすめ」記事が根拠だった。
#    これは料金判定で起きた誤検知（他社の費用相場を自社料金と誤認）と同じ種類の間違い。
#    末尾スラッシュ無し（…/blog）も同じ扱いにする。実測でこれを取り逃した。
ARTICLE_PAT = re.compile(
    r"/(blog|blogs|column|columns|media|news|article|articles|post|posts|topics)(?:/|$)")


def internal_links(base, html, limit=40):
    host = base.split("/")[2]
    out = []
    for m in re.finditer(r'href="([^"#?]+)"', html):
        u = urljoin(base, m.group(1))
        # ⚠️ 相対リンク（./assets/… 形式）を捨てていた。
        #    Laboro.AI は238リンク中231が「./」始まりで、内部リンクを1本しか拾えず
        #    2ページしか巡回できていなかった。urljoinで正しく解決する。
        if not u.startswith("http") or host not in u.split("/")[2]:
            continue
        if re.search(r"\.(png|jpe?g|gif|svg|pdf|zip|css|js|xml|ico)$", u, re.I):
            continue
        if u not in out:
            out.append(u)
    # サービス・料金・実績に関係しそうなURLを優先
    def score(u):
        s = 0
        for kw, w in [("service", 3), ("solution", 3), ("llmo", 5), ("aeo", 5), ("geo", 4),
                      ("ai", 2), ("price", 4), ("plan", 3), ("case", 4), ("works", 3), ("jisseki", 3)]:
            if kw in u.lower():
                s += w
        # 記事は巡回枠を食うだけで根拠にも使えないので最後に回す
        if ARTICLE_PAT.search(u):
            s -= 20
        return -s
    return sorted(out, key=score)[:limit]


def survey(name, base):
    top = fetch(base)
    if not top:
        return {"name": name, "officialUrl": base, "error": "トップページを取得できず"}
    pages = [(base, top)]
    for u in internal_links(base, top, limit=14):
        h = fetch(u)
        if h:
            pages.append((u, h))
        time.sleep(0.35)

    cats, cat_src = [], {}
    price_url = price_note = None
    price_disclosed = None
    cases_url = None
    cases_disclosed = None
    cases_count = None

    for u, h in pages:
        # 記事ページは「その会社が何をやっているか」の根拠にしない（他社の話が書いてあるため）
        if ARTICLE_PAT.search(u):
            continue
        t = text_of(h)
        for cat, pats in CATEGORY_PATTERNS.items():
            if cat in cats:
                continue
            for p in pats:
                if re.search(p, t, re.I):
                    cats.append(cat); cat_src[cat] = u
                    break
        if price_disclosed is not True:
            m = PRICE_PAT.search(t)
            if m:
                price_disclosed = True; price_url = u; price_note = m.group(0)[:60]
            elif PRICE_HIDDEN.search(t) and price_disclosed is None:
                price_disclosed = False; price_url = u
                price_note = PRICE_HIDDEN.search(t).group(0)[:60]
        if cases_disclosed is not True and CASE_PAT.search(t):
            cases_disclosed = True; cases_url = u
            cm = CASE_COUNT.search(t)
            if cm:
                cases_count = cm.group(0)[:24]

    return {
        "name": name, "officialUrl": base,
        "categories": cats, "categorySource": cat_src,
        "priceDisclosed": price_disclosed, "priceNote": price_note, "priceSource": price_url,
        "casesDisclosed": cases_disclosed, "casesCount": cases_count, "casesSource": cases_url,
        "pagesChecked": len(pages),
        "checkedAt": date.today().isoformat(),
    }


def main():
    cpath = ROOT / "data" / "candidates.json"
    cands = json.loads(cpath.read_text(encoding="utf-8"))
    out = []
    for c in cands:
        r = survey(c["name"], c["officialUrl"])
        # ⚠️ 1回の巡回で判断すると、たまたまの取得失敗が「カテゴリ判定不可」として残る。
        #    実測でAIdeaLabが 15ページ→2ページ→15ページ と揺れ、2ページの回だけ判定不可になった。
        #    件数が極端に少ない回は1度だけ引き直す（それでも少なければ、それが実態）。
        if "error" in r or r.get("pagesChecked", 0) < 5:
            time.sleep(2)
            r2 = survey(c["name"], c["officialUrl"])
            if r2.get("pagesChecked", 0) > r.get("pagesChecked", 0):
                r = r2
        out.append(r)
        if "error" in r:
            print(f"{c['name']:26} ❌ {r['error']}")
        else:
            pd = {True: "公開", False: "要問合せ", None: "未確認"}[r["priceDisclosed"]]
            cd = {True: "あり", False: "なし", None: "未確認"}[r["casesDisclosed"]]
            print(f"{c['name']:26} cats={','.join(r['categories']) or '—':28} 料金={pd:6} 実績={cd:5} ({r['pagesChecked']}p)")
        time.sleep(0.6)
    p = ROOT / "data" / "service-facts.json"
    p.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n保存: {p} ({len(out)}社)")


if __name__ == "__main__":
    main()
