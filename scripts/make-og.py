#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""OG画像（public/og-image.png・1200x630）を作る。

⚠️ **画像に社数を入れない。** 以前は「AI関連企業49社」と入れていたが、会社を足すと
   画像だけ古い数字のまま残る。画像の中の数字は公開前チェックでも検出できない。
   社数はページ本文（companies().length）で出す。

  python3 scripts/make-og.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
BG, INK, SUB, RULE = (255, 255, 255), (17, 20, 24), (98, 104, 112), (224, 226, 228)
GREEN = (15, 107, 94)

JP_BOLD = "/System/Library/Fonts/ヒラギノ角ゴシック W7.ttc"
JP = "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"


def main() -> None:
    S = 2   # 2倍で描いて縮める（文字の縁をなめらかにする）
    im = Image.new("RGB", (W * S, H * S), BG)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 20 * S, H * S], fill=GREEN)

    def put(xy, s, font, size, fill):
        d.text((xy[0] * S, xy[1] * S), s, font=ImageFont.truetype(font, size * S), fill=fill)

    put((86, 100), "AIサービス比較ナビ", JP_BOLD, 36, GREEN)
    put((86, 172), "他社のおすすめ記事ではなく、", JP_BOLD, 66, INK)
    put((86, 262), "公式サイトを1社ずつ見て比べる。", JP_BOLD, 66, INK)
    d.line([(86 * S, 381 * S), (1116 * S, 381 * S)], fill=RULE, width=2 * S)
    put((86, 414), "料金と実績の開示状況を確認日・出典URLつきで公開", JP, 32, SUB)
    put((86, 470), "AI開発・DXコンサル・LLMO対策", JP, 32, SUB)
    put((86, 552), "to-x-ai.com", JP, 28, SUB)

    out = ROOT / "public" / "og-image.png"
    im.resize((W, H), Image.LANCZOS).save(out, optimize=True)
    print(f"書き出し → {out}")


if __name__ == "__main__":
    main()
