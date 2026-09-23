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
    # --- ここから2026-09-23追加。「領域を広げたい」（MediaXAI）を受けての候補。
    #     ⚠️ パターンは必ずAIの文脈に縛る。「人材育成」「データ活用」のような語は
    #        採用ページやDXの決まり文句に必ず出てくるので、単独で拾うと全社が該当する。
    "ai-agent":      [r"AIエージェント.{0,6}(?:開発|構築|導入|サービス|ソリューション)", r"AIエージェント開発",
                      r"エージェント開発", r"\bAI agents?\b", r"autonomous agents?"],
    "rag":           [r"\bRAG\b", r"検索拡張生成", r"社内(?:文書|データ|情報).{0,8}(?:検索|活用|参照)",
                      r"retrieval[- ]?augmented", r"ナレッジ検索"],
    "chatbot":       [r"チャットボット.{0,4}(?:開発|構築|導入|サービス)", r"AIチャットボット",
                      r"\bchat ?bot\b.{0,20}(?:development|solution)", r"対話AI"],
    # 「AI人材育成」はコラムの見出しに頻出するので単独では採らない。
    #  研修・講座という**商品名**として書かれているものに限る。
    "ai-kenshu":     [r"(?:生成)?AI.{0,6}(?:研修|講座|スクール)", r"AIリテラシー.{0,4}(?:研修|教育|講座)",
                      r"AI教育.{0,6}(?:サービス|プログラム)", r"DX人材育成.{0,6}(?:研修|サービス|支援)",
                      r"AI training (?:service|program)"],
    "gyomu-jidoka":  [r"業務自動化", r"\bRPA\b", r"AI[- ]?OCR", r"業務効率化.{0,6}(?:AI|自動)",
                      r"workflow automation", r"process automation"],
    # 「データ分析」単独はDXの決まり文句で26社が該当してしまった。基盤構築の語に限る。
    "data-kiban":    [r"データ基盤", r"データ分析基盤", r"データ分析(?:支援|コンサル)",
                      r"データエンジニアリング", r"\bdata platform\b", r"データマネジメント",
                      r"DWH", r"BI(?:ツール)?導入"],
    # 「AI倫理」はプライバシーポリシーの定型文。商品として掲げているものに限る。
    "ai-governance": [r"AIガバナンス", r"AI.{0,4}セキュリティ(?:対策|診断|ソリューション|サービス)",
                      r"AI governance", r"責任あるAI", r"responsible AI", r"AIリスク.{0,4}(?:管理|評価)"],
    "gazo-onsei":    [r"画像認識", r"音声認識", r"画像解析", r"物体検知", r"computer vision",
                      r"speech recognition", r"音声合成"],
}
# 料金公開の判定: 「円」を含む具体的な金額が料金文脈にあるか
PRICE_PAT = re.compile(r"(月額|初期費用|料金プラン|価格|費用)[^。]{0,40}?([0-9０-９,，]{2,}\s*万?円)")
PRICE_HIDDEN = re.compile(r"(料金|費用|価格)[^。]{0,20}(要問[いあ]?合わせ|お問い合わせ|応相談|個別見積)")
CASE_PAT = re.compile(r"(導入事例|支援実績|制作実績|お客様の声|実績紹介|CASE)")
CASE_COUNT = re.compile(r"(?:実績|支援|導入)[^。]{0,10}?([0-9,，]{2,})\s*(社|件|店舗)")


CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


CACHE = ROOT / "data" / ".html-cache"


def cache_path(url):
    import hashlib
    return CACHE / (hashlib.sha1(url.encode()).hexdigest() + ".html")


def fetch(url, timeout=25):
    """通常はcurl。中身がJavaScriptで描画されるサイトはheadless Chromeに切り替える。

    取得したHTMLはディスクに残す。領域（カテゴリ）の判定条件を足すたびに
    49社×15ページを巡回し直すのは重く、相手のサーバーにも無駄に当たる。
    再取得したいときは data/.html-cache を消す。

    ⚠️ 実測で2社（アムール/divx）がcurlではリンク5個・2個しか取れず、
       会社概要にもサービスページにも辿れなかった。HTMLは返るが中身が無い状態。
       「HTTP 200なのに情報が取れない」ときはJS描画を疑う。
    """
    cp = cache_path(url)
    if cp.exists():
        # 1行目に元URLを書いてある（ファイル名はハッシュなので、後から選別できるように）
        t = cp.read_text(encoding="utf-8", errors="ignore")
        return t.split("\n", 1)[1] if t.startswith("<!--url:") else t
    try:
        r = subprocess.run(["curl", "-sL", "--max-time", str(timeout), "-A", UA, url],
                           capture_output=True, text=True, timeout=timeout + 10)
        html = r.stdout or ""
    except Exception:
        html = ""
    # ⚠️ 「href の数」で判定していたが、これは資産ファイル（/_nuxt/*.js 等）も数えてしまう。
    #    Nuxt/Next のSPAは描画前でも href が19本あるので「取得できた」と誤判定し、
    #    実際に辿れる内部リンクは0本だった（AIdeaLab / neoAI / SpiralAI / アムールの4社。
    #    8/14は15ページ取れていたので、たまたま描画が間に合っていただけ）。
    #    数えるのは**同じドメインの、資産でないリンク**にする。
    if usable_links(url, html) < 5:
        html = fetch_rendered(url, timeout) or html
    # それでも辿れない＝描画待ちが必要なSPA。virtual-time-budget で描画を進めてから取る。
    # （スクショ用途では描画を打ち切るので禁止しているが、DOM取得では逆にこれが要る）
    if usable_links(url, html) < 5:
        html = fetch_rendered(url, timeout, tries=1, vtb=6000) or html
    # ⚠️ 中身の薄い取得をキャッシュすると、その会社は永久に判定不能になる。
    #    実測: AIdeaLab / neoAI / SpiralAI が 15ページ→1ページに落ちた。
    #    headless Chrome の --dump-dom は描画途中を返すことがあり（元のコメント参照）、
    #    その回をキャッシュに焼くと再取得の機会が消える。完全に見えるものだけ残す。
    if usable_links(url, html) >= 5:
        CACHE.mkdir(parents=True, exist_ok=True)
        cp.write_text(f"<!--url:{url}-->\n" + html, encoding="utf-8")
    return html


def usable_links(base, html):
    """同じドメインの、資産ファイルでないリンクの数。取得が成功したかの判定に使う。"""
    if not html:
        return 0
    try:
        host = base.split("/")[2]
    except IndexError:
        return 0
    n = set()
    for m2 in re.finditer(r'href="([^"#?]+)"', html):
        u = urljoin(base, m2.group(1))
        if not u.startswith("http") or host not in u.split("/")[2]:
            continue
        if re.search(r"\.(png|jpe?g|gif|svg|pdf|zip|css|js|xml|ico|woff2?)$", u, re.I):
            continue
        n.add(u)
    return len(n)


def fetch_rendered(url, timeout=25, tries=3, vtb=None):
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
                 f"--user-agent={UA}"]
                + ([f"--virtual-time-budget={vtb}"] if vtb else [])
                + ["--dump-dom", url],
                capture_output=True, text=True, timeout=timeout + 25)
            html = r.stdout or ""
        except Exception:
            html = ""
        if len(html) > len(best):
            best = html
        # 十分な量が取れたら打ち切る（毎回3回起動すると遅いため）
        if usable_links(url, best) >= 5:
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
# ⚠️ 2026-09-23 領域を増やしたときに精度を実測したら、記事以外にも根拠にできないページが
#    大量に混ざっていた（実例）:
#      CINC の AIエージェント  … 自社メディア /magazine/ の号内紹介文
#      Hakuhodo DY ONE のチャットボット … セミナー・コラム一覧の記事タイトル
#      Vareal のチャットボット   … 研修レポートに出てくる演習内容
#      Queue の AIガバナンス     … プライバシーポリシーの「AI倫理への配慮」
#      バクリ の データ基盤       … 支援事例の中の一節（その会社の商品ではない）
#    いずれも「その会社が売っているもの」ではない。URLの種類で先に落とす。
ARTICLE_PAT = re.compile(
    r"/(blog|blogs|column|columns|media|magazine|news|article|articles|post|posts|topics"
    r"|seminar|seminars|event|events|webinar|report|reports|interview|interviews"
    r"|case|cases|casestudy|case-study|jirei|works|jisseki"
    r"|privacy|policy|terms|security-policy|recruit|careers?|ir)(?:/|$)")


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


def rescore():
    """巡回し直さず、キャッシュ済みHTMLだけで領域を判定し直す。
    判定条件を調整するたびに49社を巡回するのは重く、相手のサーバーにも無駄に当たる。"""
    cands = json.loads((ROOT / "data" / "candidates.json").read_text(encoding="utf-8"))
    out = []
    for c in cands:
        r = survey(c["name"], c["officialUrl"])
        # 1回の取得で判断しない（main と同じ）。薄い回はキャッシュされないので引き直せる。
        if "error" in r or r.get("pagesChecked", 0) < 5:
            r2 = survey(c["name"], c["officialUrl"])
            if r2.get("pagesChecked", 0) > r.get("pagesChecked", 0):
                r = r2
        out.append(r)
        print(f"{c['name']:26} ({r.get('pagesChecked')}p) cats={','.join(r.get('categories') or []) or '—'}")
    (ROOT / "data" / "service-facts.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n再判定: {len(out)}社（キャッシュから）")


def main():
    if "--rescore" in sys.argv:
        return rescore()
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
