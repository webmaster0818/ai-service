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

### 2026-10-10
- **GMOサイバーセキュリティ byイエラエ・三井物産セキュアディレクション（MBSD）を追加（79→81社・97ページ・AIガバナンス 16→18）**。薄い領域（AIガバナンス）狙い
  - GMO: 根拠 `/service/ai/`（AIセキュリティ対策＝AIアプリケーション診断・AIエージェントペネトレーションテスト）。naisei-shien（JC-STAR評価内製化支援コース・脆弱性診断の内製化）／dx-consul（対象者「DX推進担当者様」）／gyomu-jidoka（診断対象のAIエージェントの説明）は reject。料金は Webアプリ診断の「16,500円〜/月・30万円・60万円〜（税抜）」を出典つきで記載し、AIセキュリティ対策はお見積もりと明記（NRIセキュアと同じ扱い）。実績「診断件数16,000件」は脆弱性診断全体と明記。社名・設立 2013年2月22日は `/company/`
  - MBSD: 根拠 `/solutions/ai/`（AIセキュリティ教育・AIシステムに対するセキュリティ診断・アドバイザリ・AI TRiSM）。ai-kaihatsu（導入文「AI開発におけるセキュリティ」）／rag（AI TRiSM の項目⑨「RAGなどを活用しセキュリティ業務を支援」）は reject。料金は公開を確認できず未確認。実績は「公共・政府機関実績 70件以上（過去5年間の累計）」。社名・設立 2001年3月23日は `/company/profile/`。`/solutions/ai/ai_education/`（eラーニング＋ハンズオン研修）は自動判定に掛からず、AIセキュリティの研修で「生成AI研修」に当たるか判断が要るので今回は付けていない
  - `--only` dry で 2社とも差分0。全社一括 dry は実施せず（LionAI 停止のため）
- 見送り: サクラサクマーケティング（`/services/llmo/` は LLMO のみ。ウィルゲートと同じ理由で対象外）、ラック（`/service/` に AI のサービスページ導線なし。AI関連はコラム・プレスのみ）
- precheck ✅ 全項目OK → source `742838b` → deploy `35672a8`（ai-service-deploy）→ 本番 sitemap 97 URL・`/company/gmo-cybersecurity/` `/company/mbsd/` 200・AIガバナンス「企業18社」を確認。GSC sitemap 送信（00:23Z・pending。前回取得分は 95）

### 2026-10-11
- **有限会社バンブーハウス・株式会社CREVIA・株式会社仁頼を追加（81→84社・100ページ・AEO 17→19・Web制作 20→23）**。薄い領域（AEO/Web制作）狙い
  - バンブーハウス: 根拠 `/ai-ready/`（AEO対策の無料相談「AI検索対策（AEO/GEO/LLMO）」）＝aeo・llmo／`/price/`（AI検索対応のホームページ制作費用）＝web-seisaku／`/business/ai/`（AI活用型Webシステム開発のAIチャットボット）＝chatbot。ai-agent（料金ページのメニュー内コラム見出し）／gazo-onsei（AI搭載CMSのFAQ「画像解析はGemini」）／rag（チャットボット費用の「RAG連携ありなら上がります」）は reject。料金は `/price/` の LP18万円〜ほか4段階（AEO/GEO 全プラン標準搭載）。実績「累計制作実績 600+」はHP制作全体と明記。社名・設立 1999年10月1日・世田谷区・6名は `/company/`
  - CREVIA: 根拠 `/services`（「AI検索対応サービス（GEO・AEO・LLMO）」月額33,000円〜）＝aeo・llmo／`/homepage`（AI完全自動運用ホームページ制作・制作費30万円から）＝web-seisaku。専用ページ `/seo-geo` には AEO の語がないので一覧ページを根拠にした。社名・設立 2025年1月27日・熊本市は `/about`
  - 仁頼: 根拠 `/geo-hack/`（GEO/AIO/LLMO）＝llmo／`/web-development/`（SEO/GEO対策のHP制作・参考価格帯）＝web-seisaku／`/ai-fit/`（生成AI導入支援 AI FIT・月1回のAI活用研修つき）＝dx-consul・ai-kenshu。aeo（トップのメニュー内コラムカテゴリのみ。サービスページに AEO 表記なし）／naisei-shien（ツールの「低コストで内製化」訴求）／gyomu-jidoka（Claude Code導入支援の一覧紹介文のみ）は reject。料金は GEO Hack の3プランを転記。社名・設立 2022年9月・横浜市は `/about/`
  - `--only` dry で 3社とも差分0。全社一括 dry は実施せず（LionAI 停止のため）
- 見送り: 一創（issoh.co.jp。AEO解説コラムはあるが、curl で 403「セキュリティ確認中」になり巡回できない）、ぞろ屋（トップ・サービス導線は SEO・AIO まで。AEO はコラム記事のみ）、コネクティッドワン（サイト作成ツール（ファネルビルダー）のSaaSで、制作会社のサービスページではない）、Coadex（検索結果では AIO 対策つきHP制作だが公式サイトに到達できず未確認）
- precheck ✅ 全項目OK → source `a3997e9` → deploy `0d6a4af`（ai-service-deploy）→ 本番 sitemap 100 URL・`/company/bamboo-h/` `/company/crevia-ts/` `/company/jinrai/` 200・AEO「企業19社」・Web制作「企業23社」を確認。GSC sitemap 送信（00:28Z・pending。前回取得分は 97）
