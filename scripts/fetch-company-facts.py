#!/usr/bin/env python3
"""掲載候補企業の「公式サイトに書かれている事実」だけを収集する。

⚠️方針（schema.md と対）
  - 情報源は**その企業の公式サイトのみ**。他社の「おすすめ○選」記事は使わない（あれは広告）
  - 取れなかった項目は**空のまま**にする。推測で埋めない
  - 取得元URLと取得日を必ず残す

使い方:
  python3 scripts/fetch-company-facts.py            # candidates.json を読んで収集
  python3 scripts/fetch-company-facts.py --one URL  # 単発確認
"""
import argparse
import json
import re
import subprocess
import sys
import time
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# 会社概要ページの候補パス（サイトごとに構造が違うため総当たりで探す）
INFO_PATHS = [
    "/company/about/", "/company/", "/company/profile/", "/company/outline/",
    "/about/", "/about/company/", "/corporate/", "/corporate/about/",
    "/companyinfo/", "/overview/", "/profile/",
]

FIELDS = {
    "founded": ["設立", "創業"],
    "capital": ["資本金"],
    "employees": ["従業員数", "社員数"],
    "hq": ["所在地", "本社"],
    "listing": ["株式情報", "上場"],
    "representative": ["代表取締役", "代表者"],
}


def fetch(url, timeout=25):
    try:
        r = subprocess.run(["curl", "-sL", "--max-time", str(timeout), "-A", UA, url],
                           capture_output=True, text=True, timeout=timeout + 10)
        return r.stdout or ""
    except Exception:
        return ""


def flatten(html):
    """タグを区切り記号に変換して、ラベルと値が隣接する形にする"""
    t = re.sub(r"<script[\s\S]*?</script>", " ", html)
    t = re.sub(r"<style[\s\S]*?</style>", " ", t)
    t = re.sub(r"<[^>]+>", "|", t)
    t = re.sub(r"\|+", "|", t)
    return re.sub(r"[ \t　]+", " ", t)


def extract(text):
    """ラベルの次に来る「最初の中身のあるセグメント」を値として拾う。

    サイトによって <dt>設立</dt><dd> </dd><dd>2007年…</dd> のように
    空セグメントが挟まるため、単純な隣接マッチでは取り逃す（実測で6/8社が失敗した）。
    """
    segs = [x.strip() for x in text.split("|")]
    out = {}
    for key, labels in FIELDS.items():
        for lb in labels:
            for i, seg in enumerate(segs):
                # ラベルだけのセグメント（「設立」「資本金」など）を探す
                if seg == lb or seg == lb + "：" or seg == lb + ":":
                    for j in range(i + 1, min(i + 6, len(segs))):
                        v = segs[j]
                        if v and v not in ("&nbsp;", "-") and not v.startswith("※") and len(v) <= 80:
                            out[key] = v
                            break
                # 「設立：2007年11月29日」のように1セグメントに収まる形
                elif seg.startswith(lb) and any(c in seg for c in "：:") and len(seg) <= 80:
                    v = re.split(r"[：:]", seg, 1)[1].strip()
                    if v:
                        out[key] = v
                if key in out:
                    break
            if key in out:
                break
    return out


def find_info_page(base):
    """会社概要ページを探す。トップのリンクを優先し、無ければ総当たり。"""
    top = fetch(base)
    cands = []
    for m in re.finditer(r'href="([^"]*(?:company|about|corporate|profile|outline)[^"]*)"', top, re.I):
        u = m.group(1)
        if u.startswith("http") and base.split("/")[2] not in u:
            continue
        cands.append(u if u.startswith("http") else base.rstrip("/") + "/" + u.lstrip("/"))
    seen, ordered = set(), []
    for u in cands + [base.rstrip("/") + p for p in INFO_PATHS]:
        if u not in seen:
            seen.add(u); ordered.append(u)
    for u in ordered[:12]:
        html = fetch(u)
        if not html:
            continue
        flat = flatten(html)
        got = extract(flat)
        # 3項目以上取れたら会社概要ページとみなす
        if len(got) >= 3:
            return u, got, flat
        time.sleep(0.4)
    return None, {}, ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--one")
    args = ap.parse_args()

    if args.one:
        url, got, _ = find_info_page(args.one)
        print(json.dumps({"sourceUrl": url, **got}, ensure_ascii=False, indent=1))
        return

    cpath = ROOT / "data" / "candidates.json"
    if not cpath.exists():
        sys.exit("data/candidates.json がありません")
    cands = json.loads(cpath.read_text(encoding="utf-8"))

    results = []
    for c in cands:
        url, got, flat = find_info_page(c["officialUrl"])
        # AEO/LLMO の明示があるか（カテゴリ判定は公式サイトの記載のみで行う）
        site = flat or fetch(c["officialUrl"])
        mentions = {k: bool(re.search(k, site, re.I)) for k in ["AEO", "LLMO", "GEO", "AIO", "生成AI"]}
        rec = {
            "name": c["name"], "officialUrl": c["officialUrl"],
            "infoPageUrl": url, **got, "mentions": mentions,
            "checkedAt": date.today().isoformat(),
        }
        results.append(rec)
        miss = [k for k in FIELDS if k not in got]
        print(f"{c['name']:26} {'✅' if url else '❌ページ未特定':12} 未取得={miss}")
        time.sleep(1.0)

    out = ROOT / "data" / "company-facts.json"
    out.write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n保存: {out}  ({len(results)}社)")


if __name__ == "__main__":
    main()
