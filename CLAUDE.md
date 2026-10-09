# ai-company-navi（to-x-ai.com）作業メモ

- ローカル: `~/projects/ai-company-navi`／remote: `webmaster0818/ai-service`（SSHエイリアス `github.com-webmaster0818-ai-service`）
- **デプロイは方式B**: `npm run build` → `rsync -a --delete --exclude .git out/ ~/projects/ai-service-deploy/` → deploy リポで commit・`git push origin HEAD:main`。**ソースへの push だけでは本番に出ない**
- 公開前チェック: `python3 ~/.openclaw/workspace/site-precheck.py out --origin https://to-x-ai.com`（1項目でも落ちたら出さない）
- 本番確認: `curl https://to-x-ai.com/sitemap.xml | grep -c "<loc>"` がローカル `out/sitemap.xml` と一致してから。GSC は `https://to-x-ai.com/` プロパティに sitemap を送信
- データの設計は `data/schema.md`。会社を足す手順: `data/candidates.json` に追記 → `python3 scripts/fetch-service-facts.py --new` → 根拠文を1領域ずつ読む → サービスページを `data/category-keep.json`（keep／facts）、外す領域を `data/category-reject.json` に理由つきで書く → `--rescore --dry` で差分0 → build → precheck → deploy
- 根拠はサービスページに限る（トップ・コラム・事例・プレスリリースは不可）。架空の値は書かない

## 作業ログ

### 2026-10-09
- **keep を料金欄・実績欄に拡張**: `category-keep.json` に `"facts"` を新設（書けるのは `priceDisclosed / priceNote / priceSource / casesDisclosed / casesCount / casesSource` の6つ＝`FACT_KEEP_FIELDS`。それ以外は起動時に止める）。`apply_keeps()` が領域の後に当てる。`--rescore --dry` の差分表示にもこの6フィールドを追加
- **手修正の実数**: キャッシュから全79社を再判定して現行と比べ、11社26フィールドが違った。うち手修正は **9社17フィールド**（デジライズ1・カラクリ1・ジオコード1・LIG2・ソフトバンク3・ID3・NRIセキュア1・JetB3・アノテテ2）→ facts に登録。アムール（5）・Beyont（4）は手修正ではなく巡回結果の揺れ（例: Beyont の priceDisclosed True→None）なので登録せず。実際に `--rescore` を回す前に dry の表示で見る
- **証明（10/8 と同じ `--only` 方式）**: facts 無しの keep で 10社（上記9社＋Advanced AI Partners）を `--rescore --dry --only` → **10社とも料金欄が自動抽出の値に戻る**（例: JetB priceDisclosed False→True・月額75,000円／ソフトバンク priceSource が SoftVoice → paytoku2 のモバイル料金ページ）。facts 有りで同じ10社 → **差分あり 0社 / 1社 ×10**。ログ: `/tmp/only-nofacts.log` `/tmp/only-facts.log`
- ⚠️ **全社一括の `--rescore --dry` は 2回とも完走せず**。1回目は背景実行の10分上限で停止、2回目・3回目は 45社目 LionAI（`https://www.lion-ai.co.jp/`、curl は 0.08s で 200）で10分以上止まった＝JS描画のフォールバック（Chrome 3回＋virtual-time）がページごとに走っている。次回は LionAI のキャッシュ状態を見てから、全社分は `nohup` で回す
- **Advanced AI Partners を追加（78→79社・95ページ・AEO 16→17・Web制作 19→20）**: 根拠は `/ai-solutions`（「AIサイト制作・AEO対策」「コーポレートサイト・LP制作」）・`/coe-consulting`・`/ambassador-program`（AI戦略研修）。llmo / ai-kaihatsu / gyomu-jidoka / data-kiban / rag は理由つきで reject（AI検索最適化は AEO の見出しラベル・PoC は事例と研修・業務自動化は講座名・データ基盤はコンサル提供項目の一節・RAG は xAI の保有ノウハウ）。料金は FAQ「無料ヒアリング後に概算を提示」で要問合せ扱い。社名は `/company` の「株式会社Advanced AI Partners」（設立 2025年4月8日・港区）
- 見送り: ウィルゲート（`/promonista/servicelist/llmo/`。LLMO・45万円〜/月の料金公開あり。薄い領域の AEO/Web制作には当たらないので今回は見送り＝次の候補）、プエンテ（PUENTE AEO Booster は SaaS で、会社の公式サイト・サービスページを特定できず）、オロ・フルスピード（公式トップに AIO/LLMO のサービスページ導線なし）
- precheck ✅ 全項目OK → deploy `612b352`（ai-service-deploy）→ 本番 sitemap 95 URL・`/company/aaip/` 200・AEO「企業17社」・Web制作「企業20社」を確認。GSC sitemap 送信 2回（1回目は CF 反映前で 94 を取得。2回目 00:30Z は pending）
