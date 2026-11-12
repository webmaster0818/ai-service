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

### 2026-10-12
- GSC: 10/11 送信分の sitemap は 10/11 00:28Z に取得済み（submitted 100・errors 0・warnings 0）
- **株式会社サイシード・AIセキュリティ株式会社・株式会社ギックスを追加（84→87社・103ページ・AIガバナンス 18→19・データ基盤 22→23・チャットボット 24→25）**。薄い領域順（AIガバナンス18／AEO19／データ基盤22／Web制作23／チャットボット24）で選定
  - サイシード（candidates-held から再検討）: 見送り理由「根拠がフィードとお知らせだけ」は、製品サイト `saichat.jp/saichat/`（AIチャットボット sAI Chat）を根拠にして解消 → chatbot。ai-kaihatsu（RSSフィード）／gazo-onsei（フィード・技術ブログのインターン記事）／rag（お知らせ「人材事業の譲渡」。sAI Search は FAQ 検索）は reject。料金は `/saichat-price/` の3プランが「無料お見積り」で priceDisclosed=false。⚠️自動抽出の実績「支援実績 累計2,000社」は `services.sciseed.jp`＝新卒採用（人材）事業の数字（10/1 に譲渡済み）なので不採用、実績は `saichat.jp/case/`。社名・創業 2015年4月・中央区は `sciseed.jp/company/`
  - AIセキュリティ: 根拠 `/sixservice/quickairiskassessment`（社内で利用しているAIのリスクアセスメント）→ ai-governance。ai-kaihatsu（戦略コンサルの「PoCを通じたアライアンス」）／naisei-shien（セキュリティ・採用の内製化）／dx-consul（タレントプールの「AIコンサルタント」人材紹介）は reject。料金「基本料金 無料（先着10社限定）・詳細は別料金」、実績は同ページの CASE 01〜03。社名・設立 2021年9月・新宿区は `/company_n/overview`
  - ギックス: 根拠 `/service/`（System Innovation「分析基盤・データ基盤を整備・構築」＝data-kiban、AI wrapping の生成AI導入＝dx-consul、DIGITAL BOOST の「AI・デジタル組織の内製化」＝naisei-shien）。料金・実績はサービスページで確認できず未確認（顧客事例タグはプレスリリース一覧なので根拠にしない）。社名・設立 2012年12月12日・港区・東証グロースは `/company/`
  - `--only` dry で 3社とも差分0。全社一括 dry は実施せず
- precheck ✅ 全項目OK → source `3c09c4f` → deploy `36c5862`（ai-service-deploy）→ 本番 sitemap 103 URL（10/13 に記録を補記）

### 2026-10-13
- GSC: 10/12 送信分の sitemap は 10/12 00:52Z に取得済み（submitted 103・errors 0・warnings 0）
- **株式会社イーストクリエイティブ・secondz digital株式会社・株式会社bonを追加（87→90社・106ページ・AEO 19→22・LLMO 26→29・Web制作 23→25）**。薄い領域（AEO）狙い
  - イーストクリエイティブ: 根拠 `/llmo/`（「LLMO対策 / AEO対策」・Agent Server AI CMS）＝aeo・llmo／`/webdesign/`＝web-seisaku／`/training/`（生成AI利活用研修）＝ai-kenshu。dx-consul（研修対象者「DX推進担当者」）／gyomu-jidoka（研修の受講メリット「業務効率化」）は reject。料金はサービスページに記載なしで未確認、実績は `/production-record/`。社名・設立 昭和47年10月18日・中央区銀座は `/company/`
  - secondz digital: 根拠 `/agentsense`（「エンタープライズAEO・GEO・LLMO」の計測SaaS＋改善提案エージェント＋コンサル）＝aeo・llmo／`/service`（AI RevOps Consulting「戦略立案、AI開発、社内展開…一気通貫」「AIエージェントの実装・定着まで伴走支援」）＝dx-consul・ai-kaihatsu・ai-agent。gazo-onsei（メンバー紹介の前職経歴）は reject。料金は無料簡易診断＋有償診断（金額の掲載なし）で priceDisclosed=false。実績は `/service` の導入事例。社名・横浜市神奈川区は `/company`（設立日は掲載なし）
  - bon: 根拠 `aeolabo.boninc.co.jp/llmo-aeo-service`（「LLMO/AEO対策サービス」）＝aeo・llmo／`/service/`（公式サイト構築・採用サイト・LP制作）＝web-seisaku。dx-consul・naisei-shien（/service/ の「DX支援」はWeb広告・SNS・解析ツールの操作指導と、マーケ施策の内製化。AI・DXの導入支援ではない）は reject。料金は未確認、実績は `/work/`。社名・創業 2013年3月・大阪市中央区は `/company/`
  - `--only` dry で 3社とも差分0。全社一括 dry は実施せず
- 見送り: Onono Corporation（AEOコンサルはプレスリリース `/report/2026-05-08/` のみ。`/business` は日本製品の輸出事業でサービスページなし）、Uravation（`/aieo-daiko/` は LLMO/AIO/GEO 表記で AEO の明示なし。Web制作もなし）
- precheck ✅ 全項目OK → source `c98bc76` → deploy `3abf8af`（ai-service-deploy）→ 本番 sitemap 106 URL・`/company/east/` `/company/secondz/` `/company/boninc/` 200・AEO「企業22社」・Web制作「企業25社」を確認。GSC sitemap 送信（00:28Z・pending。前回取得分は 103）

### 2026-10-14
- GSC: 10/13 送信分の sitemap は 10/13 00:28Z に取得済み（submitted 106・errors 0・warnings 0）
- **Ridgelinez株式会社・クラスメソッド株式会社・株式会社DATAFLUCTを追加（90→93社・109ページ・AIガバナンス 19→20・データ基盤 23→26）**。薄い領域（AIガバナンス／データ基盤）狙い
  - Ridgelinez: 根拠 `/service/theme/governance-risk-compliance/ai-governance`（AIガバナンス/セキュリティ態勢の構築・定着支援）＝ai-governance／`/service/theme/data/`（「スケーラブルなデータ基盤の構築」構想・設計から構築まで）＝data-kiban／`/service/theme/ai-analytics/ai-strategy`（AI戦略の策定から実行・定着まで伴走）＝dx-consul／`/service/theme/ai-analytics/life-science`（「AI活用戦略の構想からAIエージェント開発・導入まで」）＝ai-agent。llmo（トップのプレス見出し）／gazo-onsei（事例見出し）／ai-kaihatsu（AI戦略のメニュー「POC実行支援」）／rag（メニュー名のみ）／gyomu-jidoka（業界ページの事例本文の RPA）は reject。料金は未確認。社名・設立 2020年1月15日は `/about/corporate/`
  - クラスメソッド: 根拠 `/services/data-analytics/`（データ基盤構築）＝data-kiban／`/services/ai/`（生成AI総合支援「コンサルから構築、定着まで」・AI適用診断）＝dx-consul・ai-kaihatsu／`/services/insource/`（内製化支援。AI駆動開発支援を含む）＝naisei-shien／`/services/generative-ai/ai-starter/`（RAGチャット（社内文書検索））＝rag／`/services/ai/claude-training/`＝ai-kenshu。chatbot・gyomu-jidoka（AIページの事例見出し）／gazo-onsei（トップの事例見出し）は reject。料金は AI-Starter の「月額 200,000 円〜（税別）・最低6ヶ月・初期費用別途」、実績「5,600社以上」は全社（AWS 等を含む）の数字と明記
  - DATAFLUCT: 根拠 `/ai-service/ai-platform/`（AIデータ基盤 Airlake）＝data-kiban／`/ai-service/ai-models/`（オーダーメイドのAIモデルを開発）＝ai-kaihatsu／`/ai-service/ai-agents/`＝ai-agent。gyomu-jidoka・dx-consul（ケーススタディ一覧の事例見出し）は reject。料金は未確認。社名は `/company/`
  - `--new` の直後は keep/reject が当たっていないので、`--only` dry の結果を service-facts.json に反映 → `--only` dry で 3社とも差分0。全社一括 dry は実施せず
- 見送り: サイバーセキュリティクラウド（「AIガバナンスアセスメントサービス」のサービスページを公式で特定できず。`/service/` の AI MONBAN はグループ会社のサービス掲載で、運営会社の確認が要る）、KPMG・PwC・デロイト（AIガバナンスのページURLが 404/403）
- precheck ✅ 全項目OK → source `2c0999b` → deploy `8be4aff`（ai-service-deploy）→ 本番 sitemap 109 URL・`/company/ridgelinez/` `/company/classmethod/` `/company/datafluct/` 200・AIガバナンス「企業20社」・データ基盤「企業26社」を確認。GSC sitemap 送信（00:29Z・pending。前回取得分は 106）

### 2026-10-15
- GSC: 10/14 送信分の sitemap は 10/14 00:29Z に取得済み（submitted 109・errors 0・warnings 0）
- **KPMGコンサルティング株式会社・プロティビティ合同会社を追加（93→95社・111ページ・AIガバナンス 20→22・データ基盤 26→27）**。10/14 に見送った大手のAIガバナンスを再挑戦
  - KPMGコンサルティング: officialUrl は `kpmg.com/jp/ja/about/kc.html`（KPMGジャパンのサイト内の法人ページ。社名もここで確認）。根拠 `/services/advisory/risk-consulting/digital-risk-management/ai-governance-support.html`（AIガバナンス構築・運用支援）＝ai-governance／同 `advanced-ai-datamanagement.html`（生成AIによるデータマネジメント高度化支援。DWH・分析基盤上で品質向上とメタデータ付与・カタログ化の仕組みを構築）＝data-kiban。dx-consul（法人ページの概要文と事例見出し）／ai-kaihatsu・gyomu-jidoka（事例 Case Study：UACJ）は reject。料金は未確認、実績は事例ページ `/insights/2026/08/case-uacj.html`
  - プロティビティ: officialUrl `protiviti.com/jp-jp/`。根拠 `/jp-jp/artificial-intelligence-services`（AIコンサルティングサービス。「信頼を築くAIガバナンス」AIガバナンスとAIリスク管理プロセス）＝ai-governance・dx-consul。gyomu-jidoka（担当者紹介の経歴の RPA）／data-kiban（提供価値の一節「AI戦略、ユースケース、データ基盤」）／ai-kaihatsu（量子コンピューティングの PoC）は reject。料金は未確認、実績は同ページの事例（SOX対応コスト60%削減 等）。社名「プロティビティ合同会社」・千代田区大手町は `/jp-jp/privacy-policy`（会社概要ページで社名を確認できなかったため）
  - `--new` 直後に `--only` dry の結果を service-facts.json に反映 → `--only` dry で 2社とも差分0。全社一括 dry は実施せず
- 見送り（再挑戦の結果）: サイバーセキュリティクラウド（AIガバナンスアセスメントサービスは今日もプレスリリースのみで公式のサービスページなし。`/service/` の AI MONBAN はグループ会社欄の掲載で運営はデータサイン系）、PwC（AIガバナンス・Responsible AI のページは今日も curl で 403）、デロイト トーマツ（`/services/consulting/services/ai-governance.html` は 200 で内容も十分だが、提供法人が合同会社デロイト トーマツ／有限責任監査法人トーマツ／リスクアドバイザリーのどれかをページで特定できず、社名を確定できない＝次の候補）
- precheck ✅ 全項目OK → source `9fc7688` → deploy `8c04751`（ai-service-deploy）→ 本番 sitemap 111 URL（CF 反映は push から約5分）・`/company/kpmg/` `/company/protiviti/` 200・AIガバナンス「企業22社」・データ基盤「企業27社」を確認。GSC sitemap 送信（00:35Z・pending。00:31Z に CF 反映前の 109 を取得済み）

### 2026-10-16
- GSC: 10/15 送信分の sitemap は 10/15 01:13Z に取得済み（submitted 111・errors 0・warnings 0）。URL検査で `/company/kpmg/` `/company/protiviti/` `/company/ridgelinez/` `/company/classmethod/` は全て「Submitted and indexed」。URL数は変わらないので再送信なし
- **MBSD に ai-kenshu を追加（生成AI研修 28→29社・95社/111p のまま）**: 根拠 `mbsd.jp/solutions/ai/ai_education/`（AIセキュリティ教育＝セキュアAI eラーニング・ハンズオン・AIエージェントセキュリティハンズオン。LLMセキュリティ・プロンプトインジェクションを含む）。料金は詳細リンク先 jpsec.ai（© ChillStack/MBSD の共同運営）の 5万/15万円/人・60万円/名（税別）を facts に。`--only` dry 差分0。デロイトは `ai-governance.html` の担当者が合同会社デロイト トーマツ／監査法人トーマツ／サイバー合同会社に分かれ、今日も提供法人を特定できず見送り
- precheck ✅ 全項目OK → source `e2eca9e` → deploy `eea629b` → 本番 生成AI研修「企業29社」・`/company/mbsd/` 200・sitemap 111 を確認

### 2026-10-16（夜）全文言のビジネス文書化（MediaXAI 指示・writing-standards.md §8）
- 全ページ・全部品（h1/見出し・本文・注記・表見出し・カード・フッター・meta title/description・領域の説明文・OG画像・opendata の note）を「当サイトでは〜しています」型に統一。旧表現「1社ずつ見て比べる」「まず結論」「この調査でわかったこと／わからないこと」「あれは広告」「本業」「ふるい」「順位づけ」「推定値では埋めません」等は out/ で 0 件
- 用語: 会社→企業（表見出し・h2・領域の説明文）。title は「AI開発・LLMO対策の発注先を公式サイトの情報で比較」（キーワード維持）
- 機械的な崩れの修正: 領域を判定できなかった企業（アムール）の meta description が「掲げているのはです。」になっていた → 専用文。同ページの空の「領域判定の根拠」表・「同じ領域」見出しは領域0件のとき出さない。会社ページの「料金は<公開されている>状態です」型の文を、値ごとに文として組み立てる `status()` に変更
- 手書きの priceNote 5件（LIG・Our AI面接・Advanced AI Partners・secondz・クラスメソッド）の「確認できていない／根拠にしない／確認できず」を です・ます に。**service-facts.json と category-keep.json の facts を同じ文に揃えた**（keep が `--rescore` で上書きするため片方だけ直すと戻る）。自動抽出の引用断片（「価格が異なるため、 お気軽にお問い合わせ」等）は出典の文言なので未変更
- OG 画像を新文言で再生成し `v=20261016` に更新
- precheck ✅ 全項目OK → source `6a334ea` → deploy `837186a` → 本番でトップ新文言・/category/ai-governance/・/company/mbsd/・/company/amour-inc/・/data/ 200・sitemap 111・新OG（157,046B）を確認

### 2026-10-17（朝）
- **GSC 表示半減（10/1〜7 749 → 10/8〜14 347）の切り分け: サイト側の事故なし**。減少 402 のうち 392 が単一クエリ「llmo対策コンサルバクリ株式会社」×`/company/bakuri/`（PC・掲載順位 10.6→10.9 で不変・クリック0）。このクエリは 9/30 から 1日 43〜100 表示が続き 10/9 に 19、10/10 に 5、以降0＝外部の検索需要（順位チェック等の機械的な検索とみられる）が止まっただけ。バクリを除くと 246 → 249 で横ばい。本番の robots・sitemap 111・canonical・noindex なし・主要ページ200・JSON-LD（Organization/BreadcrumbList）を確認
- 期限切れ情報の点検: out/ と deploy の全114ページで、月表記つきタイトル（【2026年◯月】等）・キャンペーン・募集・開催日の記載なし。期限つき表現は AIセキュリティの「無料（先着10社限定）」1件のみで、公式 `aisecurity.co.jp/sixservice/quickairiskassessment/` で 10/17 時点も同じ記載を確認 → 変更なし・デプロイなし
- 気づき: 下層ページ（category・company・data）の `og:url` がすべてトップ（`https://to-x-ai.com/`）になっている（canonical は正しい）
- **og:url を各ページの canonical と同値に修正（coordinator 指示）**: layout の `openGraph.url` 固定値（トップ）を全ページが継承していた。`lib/seo.tsx` に `ogFor(url)` を新設し、トップ・data・category・company の各ページで canonical と同じ式を渡す（Next はページの openGraph が layout のものを丸ごと置き換えるので、画像・siteName も ogFor 内で入れる）。og:title・og:description は元からページ別。og:url≠canonical: 110 → 0（111ページ中）

### 2026-10-18（朝）
- **GSC 表示半減（10/2〜8 749 → 10/9〜15 310）の切り分け: サイト側の事故なし**（10/17 の結論と同じ原因）。減少 439 のうち 471（ページ別）が `/company/bakuri/`（508→37・掲載順位 10.6→10.5 で不変）、クエリでは「llmo対策コンサルバクリ株式会社」487→24。バクリを除くと 241→273 で増加。日別のバクリ除外値: 10/12〜15 は 55・38・49・52。10/16 31・10/17 12 は速報値（dataState=all）なので 10/20 頃に再確認（10/16 夜の全文言変更の影響を見る）
- 本番点検: robots Allow・sitemap 111（deploy と一致）・sitemap 全111URLが 200／noindex 0／canonical 不一致 0・og:url ページ別
- **バクリの内容改善（公式 `/service/ai-countermeasures_llmo-consulting/` を 10/18 に確認）**: 料金 「費用目安 月額 30万円」→ 公式表記「費用目安 月額 30万円〜 / 契約期間 3ヶ月〜」（〜 が抜けて固定額に読めていた）。LLMO対策の根拠URLをトップ → 同サービスページ（ページ名「AIO対策/LLMOコンサルティング」）。service-facts.json と category-keep.json（keep・facts）の両方に書いた。`--only バクリ` dry 差分0
- 判断待ち（件数が変わるので未変更）: バクリの rag の根拠が AIO Lab のコラム `/aio-lab/gemini-seo/`（RAG はGoogleの仕組みの解説で、サービスではない）／aeo の根拠ページ（LLMOコンサル）に「AEO」の語がない（「AI検索最適化」のみ）
- precheck ✅ 全項目OK → source `2865ec8` → deploy `c4bf8ba` → 本番 `/company/bakuri/` 新表記2・旧表記0・sitemap 111・opendata CSV 反映を確認

### 2026-10-19（朝）
- **GSC 再確認（07:00 点検の 693→299 と同じ指標＝日付合計・final、10/3〜9 vs 10/10〜16）**: 全体 693→299。`/company/bakuri/` 450→27（掲載順位 10.7→10.1）、クエリ「バクリ」436→26。**バクリを除くと 243→272（+12%）で減っていない**（10/18 の 241→273 と同じ傾向）。10/17 48・10/18 16 は速報値（all）のみ
- **株式会社Ridge-iを追加（95→96社・112ページ・画像・音声認識AI 24→25・データ基盤 27→28）**。薄い領域（画像・音声認識AI）狙い
  - 根拠 `/business/consulting/`（AI活用コンサルティング・AI開発サービス。外観検査AI「Ridge Inspection」等、AIモデル開発からシステム統合まで）＝ai-kaihatsu／`/business/generative/`（生成AI活用に向けたDX戦略の構築から設計・開発まで）＝dx-consul／`/business/satellite/`（人工衛星データAI解析サービス。衛星画像解析・物体検出、衛星データ解析を自動化するAIエージェント「Zeus」）＝gazo-onsei・ai-agent／`/business/data/`（データ基盤構築）＝data-kiban。rag（`/business` のAIラインナップ見出し「LLM・RAG・AIエージェント」のみ。本文は目的特化型LLMの開発・チューニング）は reject
  - 料金はサービスページに記載なしで未確認、実績は `/business/consulting/` の開発事例。社名・設立 2016年7月29日・千代田区大手町・東証グロース（5572）はトップの会社概要
  - `--new` 直後に `--only` dry の結果を service-facts.json に反映 → `--only` dry で差分0。全社一括 dry は実施せず
  - バクリの rag・aeo（判断待ち）は未変更

### 2026-10-20（朝）
- **GSC 再確認（日付合計・ページ別でバクリ `/company/bakuri/` を除外）**: 確定値（final）は 10/17 まで。10/16 31・10/17 38（final）・10/18 34（速報・all）・10/19 22（速報・途中）。3日合計 10/16〜18 **103** は 10/13〜15 の 140 より −26% だが、10/10〜12 の 102 と同水準。10/13〜15 は `/company/aaip/` 17（10/13〜15 だけ 5・4・8）など一時的な山。週合計（バクリ除外）は 10/3〜9 245 → 10/10〜16 273。10/16 夜の文言変更・10/17 og:url 修正の後に下がり続ける形ではない。10/18 の final が出たら再確認
  - バクリは別クエリ「aio対策llmoバクリ株式会社」で再増加（10/13〜15 6 → 10/16〜18 26）
- **株式会社ラックを追加（96→97社・113ページ・AIガバナンス 22→23・RAG 30→31・AI開発 48→49）**。薄い領域（AIガバナンス）狙い
  - 根拠 `/consulting/ai_guideline_rules.html`（生成AI利用・開発ガイドライン策定支援）＝ai-governance／`/system/ai.html`（生成AI活用支援サービス。生成AIをアプリケーションに組み込む・プロトタイプ開発からリリースまで）＝ai-kaihatsu／`/system/ai_sales_document_search.html`（生成AI 営業ドキュメント検索。社内資料を生成AIで検索、顧客のクラウド環境にカスタムメイドで構築）＝rag。ai-agent（LAC WATCH のコラム）は reject。dx-consul は付けていない（ai.html は開発の支援）
  - 料金は各ページ「個別にお見積り」→ priceDisclosed false（facts に登録）。実績は `/system/ai.html` の関連事例（ディップ・横浜銀行/東日本銀行）。社名・設立 2007年10月1日・千代田区平河町は `/corporate/outline.html`
  - 他に見た候補ページ: `/consulting/ai_risk_consulting.html`（生成AI活用システム リスク診断）・`/system/agent-365.html`（Microsoft Agent 365 の導入・統制支援。エージェント開発ではないため ai-agent にしない）
  - `--new` → keep/reject/facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
- precheck ✅ 全項目OK → source `c5e960f` → deploy `7d6e7ea` → 本番（push から約10分で反映）`/company/lac/` 200・sitemap 113（ローカルと一致）・AIガバナンス「企業23社」・RAG「企業31社」・AI開発「企業49社」、旧値（22社/30社）0件。GSC sitemap 送信（00:29Z・pending。前回取得分は 112）

### 2026-10-21（朝）
- **GSC 再確認（確定値 final は 10/18 まで。日付合計からクエリ「llmo対策コンサルバクリ株式会社」の表示を引いた値）: 横ばい〜増加で確定**。週合計 10/5〜11 **257** → 10/12〜18 **339**（+32%）。日別 10/12〜18 は 55・39・51・60・41・48・45（10/11 以降このクエリは0）。ページ別で `/company/bakuri/` を除いても 242 → 297。3日合計（ページ除外）10/10〜12 102・10/13〜15 139・10/16〜18 103 で、10/20 の速報値の結論と同じ。10/16 夜の文言変更・10/17 og:url 修正の後に下がり続ける形ではない。バクリの別クエリ（「aio対策llmoバクリ株式会社」等）は 10/15〜18 に 1日 8〜11。速報（all）は 10/19 43・10/20 18（途中）
- **EYストラテジー・アンド・コンサルティング株式会社を追加（97→98社・114ページ・AIガバナンス 23→24・データ基盤 28→29・DXコンサル 61→62）**。薄い領域（AIガバナンス）狙い。デロイトで止まった「提供法人の特定」は、ページの「チーム」欄が同社の人だけのページに限ることで解決
  - officialUrl は `ey.com/ja_jp/about-us/ey-strategy-and-consulting`（社名・所在地 千代田区有楽町・資本金 4億5千万円・人員数 4,429名（2026年5月1日現在）を確認）。slug は `ey`
  - 根拠 `/services/consulting/ai-governance-services`（AIガバナンス態勢構築支援。生成AI利活用ガイドラインの整備、AI開発・運用のためのガバナンス。チームは同社リスク・コンサルティング パートナーのみ）＝ai-governance／`/services/consulting/artificial-intelligence-consulting-services`（AIコンサルティングサービス。AIの導入・拡張の要件定義から伴走。チームは同社 AI&データ）＝dx-consul／`/services/consulting/data-analytics-modernization`（AI&データ。「変化に強いデータ基盤の実装まで幅広く支援」。チームは全員同社）＝data-kiban
  - 自動判定の根拠は差し替え: ai-governance・dx-consul は `/services/ai`（EY新日本の人も載るハブページ）、data-kiban は `/services/consulting/technology-solution-delivery`（SAP等の ERP 導入支援でデータ基盤ではない）だった
  - 料金はサービスページに記載なしで未確認（priceDisclosed null）。実績は EYの事例 `/insights/consulting/practical-case-studies-of-ai-ready-data-preparation`（味の素のAIガバナンス・AI-Readyなデータ整備。プロジェクト担当は同社リスク・コンサルティング）
  - `--new` → keep・facts 登録 → `--only` dry 差分0。全社一括 dry は実施せず。バクリの rag・aeo（判断待ち）は未変更
- precheck ✅ 全項目OK → source `26e3974` → deploy `5b4e679` → 本番（push から約7分で反映）`/company/ey/` 200・sitemap 114（ローカルと一致）・AIガバナンス「企業24社」・データ基盤「企業29社」・DXコンサル「企業62社」、旧値（23/28/61社）0件・トップ 98社。GSC sitemap 送信（00:28Z・pending。前回取得分は 113）

### 2026-10-22（朝）
- **合同会社デロイト トーマツを追加（98→99社・115ページ・データ基盤 29→30・DXコンサル 62→63・AI開発 49→50）**。10/15・10/16 に「提供法人を特定できない」で止まった件を、EY と同じ基準（ページの担当者欄が同社の人だけのサービスページに限る）で再確認
  - officialUrl・社名は `deloitte.com/jp/ja/about/group/deloitte-tohmatsu-llc.html`（法人名 合同会社デロイト トーマツ／Deloitte Tohmatsu LLC・発足 2025年12月・人員数 約12,000名（子会社含む）・千代田区丸の内）。slug は `deloitte`
  - 根拠 `/services/consulting/services/artificial-intelligence-and-data.html`（AI Strategy「AI戦略の策定」＝dx-consul、Analytics & Data Modernization「クラウドプラットフォームやビッグデータアーキテクチャを活用して、アナリティクスとデータのモダナイゼーションを支援」＝data-kiban。担当者10名全員が同社）／`/services/consulting/services/ai-factory.html`（AI Factory as a Service。PoC から本番環境での開発・業務適用、クイック基盤構築＝ai-kaihatsu。担当者2名とも同社）
  - reject: ai-governance（`ai-governance.html` は今日も担当者が同社・有限責任監査法人トーマツ・デロイト トーマツ サイバー合同会社の3法人。`iso42001.html` も監査法人とサイバー）／ai-agent（自動判定の根拠が監査・保証業務の内部監査ページのニュース見出し）／chatbot（トップページ）
  - 料金・実績はサービスページで確認できず未確認（自動抽出の実績 `our-thinking.html` は記事一覧なので採らない）。`--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
  - 判断待ち: AI&Data ページの「Trustworthy AI」（AIガバナンスおよびリスクコントロールの方法論）は担当者が同社のみのページにあるが、詳細リンク先は3法人の `ai-governance.html`。これで ai-governance を付けるかは未決（今回は付けていない）
- **「新規企業に company-facts が入らない」の原因**: `data/company-facts.json` は 9/5 の初回コミット以降一度も更新されておらず 8社のみ（99社中 91社が未登録＝会社ページの設立・従業員数・代表者欄と JSON-LD の foundingDate が出ない）。(1) 会社を足す手順（このファイル冒頭）に `fetch-company-facts.py` が入っていない (2) 同スクリプトに `--new` が無く、回すと全社を巡回し直してファイルを丸ごと書き換える (3) 抽出はラベル完全一致（設立/資本金/従業員数/所在地/上場/代表者）で3項目以上が条件・候補URLは12本まで。`--one` で試すと Ridge-i は取得できたが、ラック（`/corporate/outline.html` に届かない）とデロイト（「発足年月」「人員数」表記・法人ページが officialUrl）は取得0。各社の会社情報は作業ログに手で確認した値があるが、データには入っていない。ほか `lib/seo.tsx` の companyLd が `description` に代表者名を入れている

### 2026-10-22（午後）記事コーナー新設・セキュリティ記事4本（MediaXAI 依頼「情報漏洩・脆弱性対応・PHP緊急脆弱性・Next.js・あるべき姿を記事化」・tomomi-2 指揮）
- **記事コーナー `/articles/`**: `content/articles/<slug>.md`（前付け title/description/published/updated/related/sources。`sources:` は「- タイトル | URL」行。**sources が無いとビルドを止める**）→ `lib/articles.ts`（marked）→ `app/articles/page.tsx`・`[slug]/page.tsx`（Article＋BreadcrumbList。出典・関連領域・ほかの記事を自動で出す。本文 H1 は書かない）。sitemap は記事ごとに updated（無ければ published）を lastmod。`draft: true` は出さない。ヘッダーに「記事」
- 原稿: ②PHP2Shell・③脆弱性対応の手順＝saburo-2、④Next.js と静的サイト・⑤AI時代のセキュリティ＝jiro-2。変換は `~/.openclaw/workspace/to-x-ai-articles/build-0205.py`・`build-0405.py`（原稿→前付け変換＋事実確認の修正を置換で適用）。①情報漏洩ニュースまとめ＝taro-2 待ち
- 事実確認（サブエージェントで全出典を照合・約125件一致）で直したこと: 「公開前の攻撃の試み」は Amazon のみ／発見者は Wiz を含む複数／修正版公開時刻（23時）は予定として表記／memory_limit=-1 の緩和策を追加／CISA は「オフラインにすべき」・IPA は判断として区別／Next.js 55182 は関連脆弱性を含む最新修正版を React 告知で確認するよう追記／OWASP「確実に防げるか不明」はプロンプトインジェクションに限定
- precheck ✅（description 160字超の2本を短縮）→ source d3ff836 → deploy 4226cf6 → 本番 sitemap 120・記事5URL 200 確認。GSC sitemap 送信 204・Indexing API 5/5 200

### 2026-10-23（朝）
- **株式会社課題解決プラットフォームを追加（99→100社・123ページ・LLMO 29→30・生成AI研修 29→30・業務自動化 25→26・チャットボット 25→26・RAG 31→32・内製化 34→35・AI開発 50→51）**。AEO（22社・最も薄い）の候補を探す中で見つけた会社。AEO は付けていない
  - officialUrl `0120.co.jp`（slug `0120`）。根拠 `/aio/`（AI検索対策（LLMO・AIO））＝llmo／`/ai-development/`（AI受託開発・業務自動化。社内ナレッジAI（RAG）・チャットボット・業務の自動化ツール、AI開発顧問の「社内メンバーの内製化支援」）＝ai-kaihatsu・rag・chatbot・gyomu-jidoka・naisei-shien／`/ai-training/`（法人向けAI研修・生成AI研修）＝ai-kenshu
  - reject: aeo（/aio/ で「呼び名はLLMO・AIO・GEO・AEOなどに分かれ」と類義語の列挙のみ＝Faber と同じ扱い）／web-seisaku（自社実証事例の「外部のWeb制作会社には頼らず」）／ai-governance（研修FAQのAIリスク管理講習）／dx-consul（トップページ。FAQ では導入支援は研修と開発で行うと説明）
  - 料金は公開（/aio/ スタンダード月30万・プレミアム月50万（税抜・初期15万〜・最低6ヶ月）、AI開発 30万〜/80万〜、研修 15万/人〜）を facts に。実績は /ai-development/ FAQ「お客様の導入事例は公開していません。公開している実績は、当社サイトでの実証」→ casesDisclosed false。社名・設立 2023年7月4日・西東京市は `/company/`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
- precheck ✅ 全項目OK → source `87a0faa` → deploy `d99bebf`

### 2026-10-24（朝）
- **株式会社AliveCastを追加（100→101社・124ページ・AEO 22→23・Web制作 25→26）**。AEO（最も薄い領域）狙い。福岡市博多区のホームページ制作会社
  - officialUrl `alivecast.co.jp`（slug `alivecast`）。根拠 `aeo-service.alivecast.co.jp/`（「福岡のAI検索最適化（AEO対策）サービス」。構造化データ・AIクローラー設定・E-E-A-T・FAQPage 等の実装と、ChatGPT・Gemini・Perplexity・Google AI Overview の引用測定）＝aeo／`/page/renewal.html`（ホームページリニューアル。標準単価に「AEO対策フルパッケージ 28万円」を含む）＝web-seisaku
  - reject: llmo（「AI検索最適化」は AEO の言い換えとしてのみ。LLMO の語はコラム見出しのみ＝Advanced AI Partners と同じ扱い）／ai-kenshu（AEOページの実測表の質問例「AI研修・セミナーはどこが良い？」）／ai-kaihatsu（llms.txt 解説コラム）
  - 料金は公開（AEO 無料診断・実装 10万円〜・月額 3万/10万/25万円〜（税別・目安）、リニューアル 10ページ規模 160万〜250万円）を facts に。実績は `/works`（件数の明記なし）。社名・設立 2005年8月17日・資本金 500万円は `/page/company.html`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
  - ⚠️ `fetch-service-facts.py --help` は引数を解釈せず**全社巡回の main() が走る**（今日誤って起動し、ファイル書き込み前に停止。データ変更なし）
- precheck ✅ 全項目OK → source `5d93260` → deploy `8802105`

### 2026-10-25（朝）
- **株式会社フューチャースタンダードを追加（101→102社・128ページ・画像・音声認識AI 25→26・AIエージェント開発 37→38・AI開発 51→52）**。薄い領域（画像・音声認識AI。AEO 23・AIガバナンス 24 の次）狙い。台東区の映像解析AI（SCORER）の会社
  - officialUrl `futurestandard.co.jp`（slug `futurestandard`）。根拠 `/business/ai/solutions`（映像解析AIソリューション・画像認識システム一覧。ナンバープレート認識・顔認証・転倒検知など27の解析技術）＝gazo-onsei／`/business/public`（公共向け映像AI事業。「映像AIモデルの開発・提供」、提供領域にAIアプリケーション開発・生成AI・LLM）＝ai-kaihatsu／`/business/ai/products/smartrounds`（防犯カメラAIエージェント Smart Rounds。プロンプトで解析条件を設定、導入設定まで同社）＝ai-agent（Ridge-i の Zeus と同じ扱い）
  - reject: dx-consul（自動判定の根拠がトップページ。Craftive `/business/ai/craftive` は生成AIを使ったシステム受託開発でコンサルではない）
  - 料金は公開（Smart Rounds 標準パッケージ 660万円（税込・カメラ40台構成例・年次 33万円）、交通量調査AIカメラ おまかせパック 55万円/台（税込・延べ2日間・関東））を facts に。受託開発の料金は未確認と明記。実績は `/cases`（件数の明記なし）。社名・設立 2014年3月4日・資本金 3,000万円・台東区台東は `/company`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
- precheck ✅ 全項目OK → source `de1ee3d` → deploy `285892a` → 本番（push から約10分で反映）`/company/futurestandard/` 200・sitemap 128（ローカルと一致・新URL掲載）・画像・音声認識AI「企業26社」

### 2026-10-26（朝）
- **株式会社サイバーセキュリティクラウドを追加（102→103社・129ページ・AIガバナンス 24→25）**。薄い領域（AIガバナンス。AEO 23 の次）狙い。品川区のWebセキュリティ（WAF・脆弱性診断）の会社
  - officialUrl `cscloud.co.jp`（slug `cscloud`）。根拠 `/ai-governance-assessment/`（AIガバナンスアセスメントサービス。社内のAI利用実態を調査し、セキュリティ・ガバナンス上のリスクを評価するコンサルティング。成果物は AI資産台帳・リスクヒートマップ・改善ロードマップ、標準期間 6〜8週間）＝ai-governance。専業（1領域）
  - reject: dx-consul（根拠が `/service/` の自社製品一覧）／web-seisaku（根拠が `/partner/` の販売パートナー募集でパートナー候補に「Web制作会社」）
  - ⚠️ `/service/` に載っている「AI MONBAN」（`ai-monban.com`・法人向けAIガバナンス基盤）は**提供元が株式会社DataSign**（同サイトのフッター・FAQ）なので根拠・料金に使っていない。「AI Optimeter」（`ai-optimeter.com`）は GEO 向けのアクセス解析ツールで AEO の明示なし＝aeo は付けていない
  - 料金はアセスメントページに記載なし→ priceDisclosed null（「契約・見積の条件に応じて定める」の記載を priceNote に）。実績は同ページ「GRC領域の専門コンサルティングチーム 200社以上の企業支援実績」を、AIガバナンスに限った件数ではないと明記して casesCount に。社名・設立 2010年8月・品川区上大崎は `/about/company/`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず。バクリの rag・aeo・デロイト ai-governance（判断待ち）は未変更
- precheck ✅ 全項目OK → source `df84203` → deploy `4faab75`

### 2026-10-27（朝）
- **クーミル株式会社を追加（103→104社・133ページ・Web制作 26→27・LLMO 30→31）**。AEO／Web制作狙い。新宿区のホームページ制作会社。AEO は付けていない
  - officialUrl `coomil.co.jp`（slug `coomil`）。根拠 `/service/llmo/`（LLMO・AIO対策コンサルティング。AI回答での言及・引用状況の調査、構造化データ等の基盤整備、運用代行）＝llmo／`/service/corporate-website/`（コーポレートサイト制作・企業サイト制作）＝web-seisaku。ほかに `/service/aio-website/`（AI検索（LLMO対策/AIO対策）に強いホームページ制作・50万/100万/200万円〜）もある
  - reject: aeo（自動判定は /service/llmo/ の「AI回答」の一語。サービスページ・一覧・会社概要に AEO 表記なし＝仁頼と同じ扱い）／dx-consul（LLMO・AIO対策の定義文の「生成AIを活用した検索」）／naisei-shien（/service/wordpress/ の「Web運用の内製化・自走化」）
  - 料金は公開（LLMO 診断15万・基盤整備30万・運用代行20万円〜、コーポレートサイト 70万/150万/300万円〜。いずれも「費用は一例」）を facts に。実績はトップ「対応実績は 800社以上」を Web制作・SEO 全体の数字と明記。社名・設立 2021年7月・資本金 500万円・新宿区西新宿は `/company/`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず（夜間）
- 見送り: デジタルベリー（`aio-taisaku.com`。トップの本文が短く今回は未精査＝次の AEO 候補）

### 2026-10-28（朝）
- **株式会社アドカルを追加（104→105社・137ページ・AEO 23→24・LLMO 31→32・DXコンサル 63→64・AI開発 52→53・AIエージェント開発 38→39・業務自動化 26→27・生成AI研修 30→31）**。AEO（最も薄い領域）狙い。千代田区紀尾井町の生成AI・LLMO・マーケティング支援の会社。候補は比較記事の掲載社名から拾い、公式サイトだけで確認した
  - officialUrl `adcal-inc.com`（slug `adcal-inc`）。サービスページは別サブドメイン `genai.adcal-inc.com`（自動巡回は届かないので keep で指定）。根拠 `/llmo`（「LLMOコンサルティング（GEO/AIO/AEO/AI検索対策）」＝サービス名に AEO を明示。CREVIA と同じ扱い）＝aeo・llmo／`/`（生成AIコンサルティング・開発サービス）＝dx-consul・ai-kaihatsu／`/n8n`（n8n によるAIエージェント開発・業務の自動化）＝ai-agent・gyomu-jidoka／`/genai-training`（生成AI研修）＝ai-kenshu
  - reject: naisei-shien（`/inhouse-genai` は広告運用・SEOのデジタルマーケティング内製化＝bon・クーミルと同じ扱い）／web-seisaku（根拠が llms.txt）。chatbot は生成AIコンサルのソリューション例「社内Q&Aのチャットボット作成」のみで付けていない
  - 料金は公開（LLMO診断 20万円・継続 月20万円〜（税別）、研修 1名40万円（税抜・最低10名）、生成AI顧問 月5万/10万/30万円（税抜）、開発は都度見積もり）を facts に。実績は `/llmo` の事例（件数の明記なし）。社名・設立 2023年12月14日・親会社 株式会社ライダース・パブリシティは `/company-information/`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
- 見送り: デジタルベリー（`aio-taisaku.com`。AIO対策のみで AEO の表記なし）、猫の手（`neko-te.co.jp`。サービスページに AEO の表記なし。AEO は外部メディア（ecnomikata.com）掲載のレポートのみ）、Stock Value（AEO はトップのコラム見出しのみ。サービスは GEO/LLMO）
- precheck ✅ 全項目OK → source `cf13f9b` → deploy `e0e6264`（CF 反映が20分止まったため空コミット `a4498d1` で再ビルド、その後約3分で反映）→ 本番 `/company/adcal-inc/` 200・sitemap 137（ローカルと一致・新URL掲載）・トップ 105社・AEO「企業24社」・LLMO「企業32社」ほか7領域の新件数を確認

### 2026-10-29（朝）
- **and media株式会社を追加（105→106社・140ページ・AEO 24→25・LLMO 32→33）**。AEO（最も薄い領域）狙い。渋谷区恵比寿西の BtoB 向け SEO・AEO（AIO）支援会社。候補は比較記事（funnel-ai・it-trend 等）の掲載社名から拾い、公式サイトだけで確認した
  - officialUrl `andmedia.co.jp`（slug `andmedia`）。根拠 `/aeo/`（「AEO（AIO）対策」サービス「and AEO」。AIでの推薦状況の分析、比較記事・プレスリリース・構造化データ・エンティティページ整理、AI推薦ログの監視）＝aeo・llmo（サービス名に AIO を明示。料金表 `/price` にも「LLMO（AIO）」メニューあり）
  - reject: web-seisaku（根拠がトップ。`/owned-lead/` は SEO のオウンドメディア運用、料金表の「ホームページ制作」は「その他のご相談」の要問い合わせのみ）／dx-consul（トップ）／data-kiban（`/price` の「データ分析基盤構築」は GA4・Looker Studio の SEO 計測環境）／naisei-shien（`/ai-in-house-seo/` は SEO 記事制作の内製化＝bon・クーミル・アドカルと同じ扱い）／chatbot（根拠が `/feed/`）
  - 料金は公開（`/aeo/`：サポート費用 月額10万円＋施策費用 AEO（AIO）設計 10万円・構造化マークアップ実装 10万円ほか。税込・税別の記載なし）を facts に。実績は `/company/` の「累計支援実績 150社」を SEO 全体の数字と明記。社名・設立 2019年4月15日・代表 鳥越 凌・渋谷区恵比寿西2-8-4 は `/company/`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
- 見送り: Onono Corporation（`ononocorp.com`。AEO コンサルの記載が `/report/2026-05-08/`（お知らせ記事）のみでサービスページなし）、GMO NIKKO・ファーストイノベーション・ピースカンパニー・ウィルゲート・サクラサクマーケティング・NEXER・TierGEO・AIO総合研究所（調べたページに AEO 表記なし）
- precheck ✅ 全項目OK → source `5812e4e` → deploy `3c1684c7` → 本番（push から約18分で反映・空コミット不要）`/company/andmedia/` 200・sitemap 140（ローカルと一致・新URL掲載）・トップ 106社・AEO「企業25社」・LLMO「企業33社」。GSC sitemap 再送信 09:41（isPending）

### 2026-10-30（朝）
- **株式会社Coziesを追加（106→107社・144ページ・AEO 25→26・LLMO 33→34・Web制作 27→28）**。AEO（最も薄い領域）狙い。文京区湯島のデジタルマーケティング会社。候補は比較記事（stockvalue・techsuite 等）と検索結果の社名から拾い、公式サイトだけで確認した
  - officialUrl `cozies.jp`（slug `cozies`）。根拠 `/service/marketing/geo`（「LLMOコンサルティング(GEO/AEO/AIO/AI検索対策)」＝サービス名に AEO を明示。ページ内で AEO を「回答の出典に入る（ChatGPT検索 / Perplexity / AI Overview）」と LLMO と分けて定義。アドカル・CREVIA と同じ扱い）＝aeo・llmo／`/service/ax/framer`（Framerウェブ制作支援「AI時代のノーコードWeb制作ツール」「AX × Framer」）＝web-seisaku（クーミルの corporate-website と同じ扱い）。どちらも `/service` のサービス一覧からリンクあり
  - reject: gyomu-jidoka（根拠がトップ。メニュー「AI導入・業務自動化」のリンク先は `/clickup`＝タスク管理SaaS ClickUp の導入・活用支援）／naisei-shien（`/service/marketing/ads` 広告運用代行の比較表「内製化も視野に入れられる」）
  - 料金は LLMO コンサルのページに記載なし → priceDisclosed null（自動抽出の「月額20万円」は広告運用代行ページの値なので採らない）。実績は `/case`（3事例・広告運用/オウンドメディア。件数の明記なし）。社名・設立 2020年9月23日・文京区湯島2-2-1・代表 大野 真由美は `/about`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
- 次の AEO 候補: 株式会社Oz link（`ozlink.co.jp/aeo-lp/`「AIO/AEO対策コンサルティング」。AEO 専用LPで料金は個別見積もり。ただしトップ・`/service/` からのリンクなし＝独立LP。京都市中京区）
- 見送り: デジタルアイデンティティ（`/service/seo/llmo/`）・メディアグロース（`/llmo-service/`）・センタード（`/service/llmo/`）・グラッドキューブ（トップ）＝いずれも AEO 表記なし
- precheck ✅ 全項目OK → source `23b4f7f` → deploy `db583469`（news-20261030-08 は本文差分なし・ビルドハッシュのみ）→ 本番（push から約8分で反映・空コミット不要）`/company/cozies/` 200・sitemap 144（ローカルと一致・新URL掲載）・トップ 107社・AEO「企業26社」・LLMO「企業34社」・Web制作「企業28社」（旧値 25/33/27社 0件）・news-20261030-08 200。GSC sitemap 再送信 09:31（isPending）

### 2026-10-31（朝）
- **株式会社LiKGを追加（107→108社・148ページ・AEO 26→27・LLMO 34→35・Web制作 28→29）**。AEO（最も薄い領域）狙い。渋谷区恵比寿西のデジタルマーケティング・Web制作会社。候補はバクリの比較記事（`/aio-lab/2026-llmo/`）の掲載社名から拾い、公式サイトだけで確認した
  - officialUrl `likg.co.jp`（slug `likg`）。根拠 `/service/llmo-consulting/`（「LLMOコンサルティング（GEO・AIO・AEO / AI検索対策）」＝サービス名に AEO を明示。アドカル・Cozies と同じ扱い）＝aeo・llmo／`/service/website-production/`（Webサイト制作）＝web-seisaku。どちらも `/service` のサービス一覧からリンクあり
  - reject: rag（LLMOページで AI検索の仕組みを説明した一節）／data-kiban（CRM・ナーチャリング支援の紹介文「営業とマーケをつなぐデータ基盤構築」）／gyomu-jidoka（SEO事例のコラムテーマ）／naisei-shien（`/service/media-management/` のお悩み例「ライターチームを内製化」）
  - 料金は公開（LLMO診断 10万円〜・LLMO×SEO コンサル 30万円〜・EEAT強化記事 5万円/記事（税別・調査費用別途）、Webサイト制作 30万/120万/200万円〜（税表記なし））を facts に。実績は `/performance`（件数の明記なし）。社名・設立 2023年1月・資本金 100万円・代表 近藤 光生・渋谷区恵比寿西2-4-8 はトップの会社概要（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
- 見送り（同じ比較記事の掲載社・調べたページに AEO 表記なし）: ブルースクレイ・ジャパン（トップ）・ホワイトリンク（トップ）・シード（トップ）・アイオイクス（`/service/seo-consulting/`）・SEデザイン・CoDigital・DCC（`/aio_service/`）・AtoZ design・ルーシー（`/services/ai-program`）・アマノート（`/service/content-marketing/llmo-consulting/`）・ステラジェント（`/ja/ai-search-dock`）。プエンテ「PUENTE AEO Booster」は AEO 対策 SaaS（ツール）で、支援会社ではないので未精査
- precheck ✅ 全項目OK → source `11c513b` → deploy `3f43279a` → 本番（push から約6分で反映・空コミット不要）`/company/likg/` 200・sitemap 148（ローカルと一致・新URL掲載）・トップ 108社・AEO「企業27社」・LLMO「企業35社」・Web制作「企業29社」。計測リンク 0本（変更なし）。GSC sitemap 再送信 09:28（isPending）

### 2026-11-01（朝）
- **株式会社W-ENDLESSを追加（108→109社・149ページ・AEO 27→28・LLMO 35→36）**。AEO（最も薄い領域）狙い。大阪市西区新町（東京支社 恵比寿）のデジタルマーケティング（SEO・広告・オウンドメディア）会社。候補は大阪のAIO対策会社の比較記事（shopowner-support）の掲載社名から拾い、公式サイトだけで確認した
  - officialUrl `www.w-endless.co.jp`（slug `w-endless`）。根拠 `/blog/servicelist/llmo-consulting/`（「LLMOコンサルティング（AIO/GEO/AEO・AI検索対策）」＝サービス名に AEO を明示。アドカル・Cozies・LiKG と同じ扱い。`/blog/servicelist/` のサービス一覧からリンクあり）＝aeo・llmo
  - reject: web-seisaku（自動判定の根拠が `/message_history/` の沿革「創業時に…ホームページ制作などWEB領域の事業を展開」。現在のサービス一覧は LLMOコンサル・SEOコンサル・オウンドメディアのみ）
  - 料金は公開（トライアル 30万円／3ヶ月・LLMO診断 15万円・LLMOコンサル 月30万円（プラン欄は最短3ヶ月、同ページ FAQ は「6か月から」と食い違い→両方を記載）・運用代行 月50万円〜・SEO＋LLMO 月80万円〜（税別））を facts に。実績は `/blog/achievement/`（SEO 支援事例。件数の明記なし）。社名・設立 2014年12月24日・資本金 900万円・従業員 74名（2025年11月時点）・代表 平峯 翔一は `/company/`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
  - ⚠️ 今日も `fetch-service-facts.py -h` を誤って起動しかけ即停止（データ変更なし）。引数なしは全社巡回になるので、使い方は本ファイル冒頭を見る
- 見送り: 売れるネット広告社（AEO施策「売れるAI最適化」の提供元・売れるAIマーケティング社は業務を SOBAプロジェクトへ移管済み。移管先の公式サイトに AEO 表記なし）、Tech Knowledge Base（Sighted は AEO 計測 SaaS。会社のサービスページは「AI認知モニタリング」で AEO 表記なし＝PUENTE と同じ扱い）、anadigi（ローカルビズ。AEO はプレスリリースのキーワードのみ・公式サイトに表記なし）、大阪の比較記事の他社（AIMA・AIOマーケティング・DY Growth Strategy・オレンジソフトウェア・S&Eパートナーズ・バリューエージェント・創希＝サービスページに AEO 表記なし。プレジャークリエーション `/llmo-ai/` は「LLMOはAIOやAEO、GEOなどと様々な呼ばれ方があります」の言い換え説明1回のみ＝サービスとしての AEO 明示ではない）
- precheck ✅ 全項目OK → source `4f980b4` → deploy `583bada6`
- 本番（push から約8分で反映・空コミット不要）`/company/w-endless/` 200・sitemap 149（ローカルと一致・新URL掲載）・トップ 109社・AEO「企業28社」・LLMO「企業36社」。計測リンク 0本（変更なし）

### 2026-11-02（朝）
- **株式会社トライエッジを追加（109→110社・151ページ・AEO 28→29・Web制作 29→30・生成AI研修 31→32）**。AEO（最も薄い領域）狙い。中央区銀座の BtoB マーケ・CRM（HubSpot ゴールド／Zoho 認定パートナー）支援会社で、2026年に AEO 事業を立ち上げ。候補は検索結果（「AEO対策」構造化データ・FAQ 実装の支援会社）から拾い、公式サイトだけで確認した
  - officialUrl `triedge.co.jp`（slug `triedge`）。根拠 `/service/aeo`（「AEO対策（AI検索最適化）」構造化データ・FAQ設計・コンテンツ最適化・被引用〜商談化の測定）＝aeo／同ページの「Webサイト構築（AEO対応）」（作り直す形で実装まで当社。料金ページにも OPTION として掲載）＝web-seisaku／`/service/training`（ビジネスAI実践研修。Claude を実務で使う法人向け・2日間11時間）＝ai-kenshu。いずれも `/service` のサービス一覧からリンクあり
  - reject: llmo（自動判定の根拠がトップの JSON-LD knowsAbout/serviceType。`/service/aeo` の本文は「AEO（AI検索最適化）」だけで LLMO は title タグのみ＝Advanced AI Partners と同じ扱い）
  - 料金は公開（`/service/price`：AEO基盤 初期10万円＋月35万円・最低6ヶ月／可視化つき月45万円／Webサイト構築（AEO対応）月15万円〜／研修 1名40万円。税込・税別の記載なし）を facts に。実績は `/case`（HubSpot・Zoho の CRM 事例が中心）と「支援実績 140社超（2026年8月時点）」を全社の数字と明記。社名・設立 2011年9月21日・代表 中野 三四郎・中央区銀座1-12-4・法人番号 2011401016037 は `/company`（company-facts は判断待ちのため未登録）
  - `/service/ai-staff`（AI社員＝チャット常駐・CRM連携・承認フローつきの業務AI）は「エージェント」の語がなく自動判定にも掛からないため ai-agent は付けていない（判断待ち）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
- 見送り: Owned（`/aio/` は AIO/LLMO 対策。AEO は FAQ の「LLMO・GEO・AEOと呼ばれることもあります」の言い換え1回のみ＝プレジャークリエーションと同じ扱い）、StockSun（`/service/llmo/`）・KAZET AI（`aio-llmo-overview.com`）・オロパス（`/brandchecker.html`＝SEOツールの機能）＝AEO 表記なし、テクロ（公式が 503）
- precheck ✅ 全項目OK → source `8c3d63a` → deploy `188e670f`
- 本番（push から約13分で反映・空コミット不要）`/company/triedge/` 200・sitemap 151（ローカルと一致・新URL掲載）・AEO「企業29社」・Web制作「企業30社」・生成AI研修「企業32社」・LLMO「企業36社」（変化なし）。計測リンク 0本

### 2026-11-02（12:00 成長ルーチン）企業ページに「事業内容の答え」
- **GSC（10/3〜10/30）**: バクリ系は全て `/company/bakuri/` 着地・クリック0（「llmo対策コンサルバクリ株式会社」437・10.8位／「aio対策llmoバクリ株式会社」112・10.0／「llmo対策 バクリ株式会社 コンサルティング」46・10.7／「llmo対策 aio バクリ株式会社」44・10.4 ほか）。「メディアリーチ」35・14.2／「株式会社メディアリーチ」26・17.6（`/company/mediareach/`）。「lionai」29・7.1（`/company/lion-ai/`）
- **`data/company-summary.json` を新設**（slug ごとに title・h1・description・headline・rows[{label,text,source}]・checkedAt）。`lib/data.ts` の `summaryOf(slug)` → 企業ページはある企業だけ title/description/h1 を差し替え、h1 直下に出典つきの事業内容表を出す。fetch-service-facts.py はこのファイルを触らない（--rescore でも戻らない）。service-facts.json は未変更
  - バクリ（公式 `/company/about/`・`/service/`・`/service/ai-countermeasures_llmo-consulting/` を 11/2 確認）: 事業内容・LLMO支援内容（1ヶ月目 戦略策定／2ヶ月目以降 内部最適化・llms.txt・構造化データ／外部施策／ナレッジ移管）・料金「月額 30万円〜 / 契約期間 3ヶ月〜」＋トライアル診断・6ヶ月〜推奨・依頼の流れ・所在地／代表。**rag・aeo（判断待ち）は未変更**
  - メディアリーチ（`/company`・`/service`・`/seo-consulting/llmo-service`・`/seo-consulting`）: LLMO は DolphinX AIO 導入前提・金額は見積り・契約期間の縛りなし／SEO は月額20万円〜・6ヶ月以上
  - ⚠️ 既存データの気づき（未変更・判断待ち）: メディアリーチの priceNote「月額20万円」は `/seo-consulting` の **SEOコンサルティング**の料金（LLMO は見積り）。LionAI は公式トップの会社案内で**運営会社が WONQ株式会社**（Lion AI はサービス名）で、トップに規模別の料金例（10万/30万/60万円・税抜・月20/60/120時間）があるのに priceDisclosed=false・社名「株式会社LionAI」。直すと社名表示・/data/ の集計が変わるので今回は触らず
- title 変更: `/company/bakuri/`・`/company/mediareach/`（11/2）→ 11/9 まで title を変えない
- precheck ✅ 151ページ全項目OK → source `8c28bcc` → deploy `73db1f5d`。sitemap・opendata は差分なし。計測リンク 0→0

### 2026-11-03（朝）
- **株式会社ウェスタナを追加（110→111社・sitemap 154→155・AEO 29→30・LLMO 36→37・Web制作 30→31・AI開発 53→54・DXコンサル 64→65・生成AI研修 32→33・業務自動化 27→28・RAG 32→33・チャットボット 26→27）**。AEO（最も薄い領域）狙い。神戸市東灘区（六甲アイランド）の中小企業向け AI導入支援・Webマーケティング会社。候補は検索結果（神戸の AEO 対策）から拾い、公式サイトだけで確認した
  - officialUrl `www.westana.co.jp`（slug `westana`）。根拠 `/web-marketing/aeo/`（グローバルナビ「AEO・AIO対策」。現状診断→設計→伴走運用→内製化、FAQ・構造化データ・明快な定義）＝aeo・llmo（サービス名に AIO を明示。and media と同じ扱い）／`/ai/development/`（AIシステム開発・料金表にライト「簡易AIチャットボット構築」・エンタープライズ「RAG構築」）＝ai-kaihatsu・chatbot・rag／`/ai/consulting/`（AIコンサルティング・メニュー「業務のAI化」＝見積書・FAX注文書入力・メール仕分け等）＝dx-consul・gyomu-jidoka／`/ai/ai-seminar/`（AIゼロイチセミナー＝社内研修）＝ai-kenshu／`/ai/nanopico/`（AI×ウェブサイト構築サービス）＝web-seisaku
  - reject: naisei-shien（AEO ページの「04 内製化」＝AEO ノウハウを残す伴走の説明。bon と同じ扱い）／gazo-onsei（開発事例と対応技術表の「写真認識」のみ。料金表・サービス区分に画像認識のメニューなし）。`/ai/development/` の対応技術表に「AIエージェント」があるが自動判定に掛からず ai-agent は付けていない（判断待ち）
  - 料金は公開（AIコンサル 月10万円〜・AI顧問 月5万円・最低6ヶ月・AI開発 10万/50万円〜・nanopico 月7,000円（いずれも税別）。AEO・AIO対策は一律の金額なし）を facts に。実績は `/ai/` の「AIゼロイチセミナー 延べ950社・1,400名超」をセミナー受講の数と明記。社名・設立 2019年6月28日・代表 井上 勝典・神戸市東灘区向洋町中6-9 は `/about/`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
  - ⚠️ 作業中に `fetch-service-facts.py --help` を実行したところ引数解釈が無く**全社巡回（main）が始まった**。数社分の取得で kill し、service-facts.json は最後に一括で書く作りのため未変更（git diff で確認）。このスクリプトに --help は無い
- 見送り: アイティクラウド（ITreview。AEO は「レビューサイト掲載の効果」の訴求で、AEO記事・AEO分析コンサルはプレスリリースのみ・サービスページなし）、フィードフォース（Answer IO は AI検索計測ツールで AEO 表記なし）、Charlesworth（`/jp/answer-engine-optimization` に AEO サービスページあり。ただし契約主体は英国法人 Charlesworth Publishing Services Ltd で日本の会社ではない＝判断待ち）、盛田一成（design-bureau.yokohama `/aeo/`。個人のコンサルタントで法人ではない）、Aurant Technologies・アシスト（AEO 表記なし）

### 2026-11-04（朝）
- **株式会社カンドウコーポレーションを追加（111→112社・sitemap 155→156・AEO 30→31・LLMO 37→38・Web制作 31→32）**。AEO（最も薄い領域）狙い。広島市西区のホームページ制作会社。候補は検索結果（AEO対策の FAQ ページ `/faq/ai-search/aeo_4/`）から拾い、公式サイトだけで確認した
  - officialUrl `can-do.co.jp`（slug `can-do`）。根拠 `/service/aeo/`（AI最適化。提供サービス「AI検索対策（AEO・LLMO）」・FAQ・構造化データ設計・AI検索診断。AEO と LLMO を分けて定義）＝aeo・llmo／`/service/`（サービス一覧。成果物に Webサイト制作・採用サイト制作・LP制作）＝web-seisaku。会社概要の事業内容にも「AEO対策」「LLMO・GEO対策」あり
  - reject: dx-consul（自動判定の根拠がトップ。`/service/dx/` の提供サービスはサイト診断・リニューアル提案・コンテンツ設計・運用サポート＝Webサイトの運用改善）
  - 料金は公開扱い（`/faq/phase/web_4/`：LP 30万円〜・コーポレートサイト 80万円〜・採用サイトや大規模サイト 150万円〜の目安。税込・税別の記載なし）。AI検索対策の金額はサービスページ・FAQ に記載なしと priceNote に明記（AI検索 FAQ を含む 68 ページで「万円」を確認）。実績は `/works/`（件数の明記なし）。社名・設立 平成3年2月15日・資本金 2,600万円・従業員 9名・代表 福原勘二／小田英男・広島市西区三篠町は `/about/`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず。`content/articles/` の未追跡 draft 2本（news-20261029-08・news-20261104-08）はコミットせず、draft のため out/ にも出ていない
- 見送り: エイチリンク（`/service/llmo-consulting/`。「AIO対策・LLMO対策・AEO・GEOは、呼び方が違うだけでほぼ同じ」の言い換え説明のみ）、シーエスプラス（csplus.jp。AEO はブログ記事のみ・トップに表記なし）、Bridge（検索結果の `/llmo/` は LLMO・GEO・AIO 表記）
- 次の AEO 候補（未精査）: 福岡ECサイト（`/business/ai-search-engine/ai-search-engine/` に「AIO・LLMO・AEO・GEO・エンティティ設計・SEO」を連動して対策と記載）。Lifunext（トップに AEO 表記なし。`/llmo-consulting/` は未確認）
- precheck ✅ 全項目OK → source `686e6e6` → deploy `e1859b61` → 本番（push から約5分で反映・空コミット不要）`/company/can-do/` 200・sitemap 156（ローカルと一致・新URL掲載）・トップ 112社・AEO「企業31社」・LLMO「企業38社」・Web制作「企業32社」（旧値 30/37/31社 0件）。draft 2本は本番 404。計測リンク 0本（変更なし）。GSC sitemap 再送信 11/4

### 2026-11-05（朝）
- **福岡ECサイト株式会社を追加（112→113社・sitemap 158→159・AEO 31→32・LLMO 38→39・Web制作 32→33）**。AEO（最も薄い領域）狙い。福岡市博多区の EC サイト制作・AI検索対策の会社。候補は前回の見送り欄から
  - officialUrl `fukuoka-ecsite.co.jp`（slug `fukuoka-ecsite`）。根拠 `/business/ai-search-engine/ai-search-engine/`（事業内容「AI検索 集客エンジン」。「AIO・LLMO・AEO・GEO・エンティティ設計・SEO」を連動して対策と明記し、FAQ で AEO の定義と自社の施策も記載）＝aeo・llmo／`/business/new-production/service_newcreate/`（ECサイト・Webサイトの新規制作。AIに理解・引用されやすいサイト制作を明記）＝web-seisaku
  - reject: dx-consul・naisei-shien（自動判定の根拠がコラム `/ai-search-lab/ai-search/ai-search-company-recommend/`。内製化の語は他社の紹介で、自社のサービスページに DX・内製化の記載なし）。`/business/fukuoka-system-development/` は EC 周りのシステム開発で AI 開発の記載なし＝ai-kaihatsu は付けていない
  - 料金は公開（`/ai-search-lab/ai-search-service/`：月3万/7万/20万円＋初期費用10万円。税込・税別の記載なし。プランの差は AI 記事生成の本数とレポート）。EC・Web制作の金額は記載なし。`/ai-search-plans/`（「料金・機能を詳しく見る」のリンク先）は 11/5 時点で 404。実績は `/business/ecsite/service_fukuokaecsite/` の「EC制作・支援実績 300社以上」を EC 全体の数字と明記。「AI検索流入 368%」は自社サイトの自己申告なので載せていない。社名・設立 2022年8月19日・代表 鳥井敏史・福岡市博多区は `/company/about/corporate_about/`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
- 見送り: Lifunext（`/llmo-consulting/`・トップ・会社情報とも AEO の表記なし。LLMO のみ＝AEO の候補から外す。月20万円〜・初期診断25万円〜の記載あり）
- **`/articles/ai-era-security/` の FAQ を修正（点検 C3）**：「当サイトでは、…管理しやすいと考えます」→「社内で使ってよいサービスと…管理しやすくなります」。読者への助言が当サイトの実施に読めたため。前付けに `updated: 2026-11-05`
- **`scripts/generate-sitemap.mjs` の lastmod を修正**：会社・領域ページが全ページ一律で最新の確認日になり、1社足すたびに約130ページの lastmod が動いていた。会社＝その会社の確認日（company-summary の確認日も見る）、領域＝所属企業の確認日の最大、トップ・/data/＝全体の最大に変更。11/5 時点は 131 ページ分の 11-04 が実際の確認日に戻る

### 2026-11-05（12:00 成長ルーチン）LionAI・アノテテ・仁頼に「事業内容の答え」
- **GSC（10/6〜11/2）**: 「lionai」29@7.1（`/company/lion-ai/`）／「anotete」23@7.3・「あのテテ」10@9.8（`/company/anotete/`）／「株式会社仁頼」23@6.0（`/company/jinrai/`）。いずれもクリック0・社名検索
- `data/company-summary.json` に3社を追加（title・h1・description・冒頭の出典つき表。公式を 11/5 確認）。service-facts.json・category-keep.json・評点類は未変更。`--rescore` は未実行
  - LionAI: 公式の会社案内は **WONQ株式会社**（Lion AI はサービス名）。規模別の料金例 10万/30万/60万円（税抜・20/60/120時間/月）・見積り制・導入の流れ・福岡市中央区天神。title/h1 は「Lion AI（LionAI）」＋ WONQ の表記（「株式会社LionAI」は公式で確認できないので使わない）。表の「運営会社」「料金例」行に、当サイト掲載名と下部の料金欄が古い判定であることを明記
  - アノテテ: Tebot 3プラン（年間契約時）・ShareMind・Claude Code導入支援・Boost Dev の納期・所在地。「あのテテ」は公式ページで確認できないと「社名の表記」行に明記（title には入れていない）
  - 仁頼: GEO Hack 4プラン・Webサイト制作の参考価格帯・AI FIT・依頼の流れ・所在地。title/h1 に読み「じんらい」
- ⚠️ 判断待ち（未変更・11/2 から継続）: LionAI の service-facts（社名「株式会社LionAI」・priceDisclosed=false・priceNote の断片）。直すと社名表示・一覧・JSON-LD・/data/ の集計が変わる。それまで同ページの確認結果欄と JSON-LD は旧社名・旧判定のまま
- title 変更: `/company/lion-ai/`・`/company/anotete/`・`/company/jinrai/`（11/5）→ 11/12 まで title を変えない
- 本番確認で JSON-LD の WebPage 名が旧 title・dateModified が旧確認日のまま（`lib/seo.tsx` の companyLd は summary を見ていない）と判明 → company-summary に `ldWebPage: true` を新設し、3社だけ title・確認日に揃えた。**バクリ・メディアリーチは 10日ルールのため未適用（旧名・2026-09-23 のまま。11/12 以降に `ldWebPage` を足す）**

### 2026-11-05（16:00 遅れ挽回ルーチン）7社に「事業内容の答え」
- **GSC（10/6〜11/2）**: 「エクサプラザ」11@7.4（`/company/explaza/`）／「queue株式会社」8@15.9（`/company/queue-tech/`）／JetB の評判語 7@7.9（`/company/jetb/`）／「advanced ai partners」7@10.0（`/company/aaip/`）／「株式会社ai native」7@9.0（`/company/ai-native/`）／「株式会社風音屋」6@9.5（`/company/kazaneya/`）／「アムール株式会社」4@15.8（`/company/amour-inc/`）
- `data/company-summary.json` に7社を追加（title・h1・description・冒頭の出典つき表・`ldWebPage: true`。公式を 11/5 確認）。service-facts.json・category-keep.json・評点類は未変更。`--rescore` は未実行。7社とも 10/26 以降の変更なし（git log で確認）。sitemap の差分は7社の lastmod のみ
  - エクスプラザ: Palma プロ 月2,000円／名（税抜）・法人は個別提案、AIPM研修（全4回・各2時間・料金は問い合わせ）。「エクサプラザ」は公式ページで確認できないと「社名の表記」行に明記（title には入れていない）。`partner.explaza.jp` は JS 描画なので Chrome headless で確認
  - Queue: 料金は個別見積もり。自社発表の効果値（AI引用改善率 +460% 等）は載せていない
  - JetB: 評判語は title・本文に入れず、「評判を調べている方へ」行で当サイトは評判を評価しないと明記。Our AI面接（定額制・契約1年・金額掲載なし）・特商法の解約条件。比較記事の「月額換算 7.5万円〜」は第三者の情報なので不採用（従来の方針と同じ）
  - AAIP: 費用は無料ヒアリング後に概算。固定価格パッケージと記載があるが金額の掲載なし
  - AI Native: AX パートナーシップ 月300万円〜・CMS Migration 50万/150万/300万円〜（保守 月5〜20万円）
  - 風音屋: 金額の掲載なし
  - アムール: 月10万/30万/50万円（税抜）・初期無料・最低6ヶ月
- ⚠️ 判断待ち（未変更）: AI Native の service-facts「ライトプラン 750,000 円」「実績 19社」は 11/5 の公式で見当たらない（同ページの表に明記）／アムールは categories 空・料金未確認のままだが公式は AIO/LLMO 専業で料金公開（llmo 等を付けると領域の社数と /data/ が変わる）／エクスプラザの料金欄・風音屋の実績欄も表と食い違う（表に明記）
- title 変更: 上記7社（11/5）→ 11/12 まで title を変えない

### 2026-11-06（朝）
- **アズ・マーケティング株式会社を追加（113→114社・sitemap 160→161・AEO 32→33・LLMO 39→40・Web制作 33→34・チャットボット 27→28）**。AEO（最も薄い領域）狙い。埼玉県越谷市のマーケティング支援会社。候補は Yahoo 検索から拾い、公式サイトだけで確認した
  - officialUrl `az-mark.jp`（slug `az-mark`）。根拠 `/service/aeo-llmo/`（「AEO/LLMO対策」。8施策・FAQ で AEO と LLMO を定義し一体で提供）＝aeo・llmo／`/service/web-creation/`（コーポレート・採用・サービスサイト・LP の制作）＝web-seisaku／`/service/saas-product/`（自社の AIチャットボット AIComms）＝chatbot
  - reject: rag（`/service/product-development/` の「生成AI・LLM・RAG・AIエージェント等」は実装技術の列挙）。同じ箇所の ai-kaihatsu・ai-agent は自動判定に掛かっておらず付けていない
  - 料金は公開扱い。ただし AEO/LLMO対策・Web制作は個別見積り（AEO/LLMO は最低6ヶ月契約が基本）で、金額は自社ツールのみ（AIMention 税込・`/tokusho` で確認／AIComms 税抜・`aicomms.jp/pricing`）と priceNote に明記。実績は `/case/` の「延べ100社以上のマーケティング支援」を全体の数字と明記。「引用率」等の自社発表の効果値は載せていない。社名・設立 2024年7月1日・代表 菊地真人・越谷市は `/about/`（company-facts は判断待ちのため未登録）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず。`content/articles/` の未追跡 draft 6本は全て `draft: true` で、コミットせず out/ にも出ていない。news-20261106-08 は out/ にあり
- 見送り: ウェスタナ・AliveCast は掲載済み。deca.marketing（ギブリー）は AEO 表記あり、料金は個別見積もり、事例の掲載なしで未精査（`/service/marketing/aeo/`）＝次の候補。IT-cares（`it-cares.biz/aeo/service/`）は AEO サービスページあり、法人格は未確認＝次の候補。Oz link は判断待ちで使っていない
- precheck ✅ 全項目OK → source `cb0048f` → deploy `2dd7ff9c` → 本番（push から約16分で反映・空コミット不要）`/company/az-mark/` 200・sitemap 161（ローカルと一致・新URL掲載）・トップ 114社・AEO「企業33社」・LLMO「企業40社」・Web制作「企業34社」・チャットボット「企業28社」（旧値 0件）。draft 6本は本番 404・news-20261106-08 は 200。計測リンク 0本（変更なし）。GSC sitemap 再送信 11/6

### 2026-11-07（朝）
- **株式会社ギブリーを追加（114→115社・sitemap 165→166・AEO 33→34・Web制作 34→35・チャットボット 28→29・AIエージェント開発 39→40・AI開発 54→55・DXコンサル 65→66・内製化 35→36・生成AI研修 33→34）**。AEO（最も薄い領域）狙い。渋谷区のコンサルティング・システム開発会社で、AEO は同社のマーケティングDX事業 DECA（`deca.marketing`。フッターに運営企業 `givery.co.jp`・© Givery, Inc.）が提供
  - officialUrl `givery.co.jp`（slug `givery`）。根拠 `deca.marketing/service/marketing/aeo/`（AEOコンサルティング。診断・方針・実装・定点観測）＝aeo／`deca.marketing/service/marketing/cms-migration/`（Givery Next for CMS。WordPress移行・AI検索対策Web構築、情報設計を含むリニューアルにも対応）＝web-seisaku／`deca.marketing/service/contactcenter/chatbot/`（チャットボットの構築・運用）＝chatbot／`givery.co.jp/services/ai-lab/`（生成AI活用コンサルティング・PoC〜本番の開発支援・内製化支援・生成AI研修）＝dx-consul・ai-kaihatsu・naisei-shien・ai-kenshu／`gomana.ai/service/agent/`（AIエージェント構築支援。© Givery, Inc.）＝ai-agent
  - reject: gyomu-jidoka（自動判定の根拠が `/company/` の役員経歴）
  - 付けていないもの: llmo（AEO ページの「GEO・LLMOと呼ばれることもあります」は言い換え説明で、Advanced AI Partners・AliveCast と同じ扱い）／rag（自動判定に掛からず。`/services/` の「RAGチューニング」、`/services/ai-lab/` の「RAG研修」、チャットボットの「ナレッジ検索（RAG）」はある）。`givery-consulting.com` は別法人（株式会社ギブリーコンサルティング）なので根拠にしていない
  - 料金は公開扱い。ただし AEO・Givery Next for CMS は個別見積りで、金額は Givery AI 顧問（月33万円〜・月165万円〜・税込）のみと priceNote に明記。実績は `deca.marketing/cases/`（AEO の事例ではない）と `/services/ai-lab/` の「1,000社超の生成AI導入・活用支援」を AEO のみの数字ではないと明記。AEO ページの自社実測「627回／日」等は載せていない
  - **`data/company-facts.json` に登録**（9社目）: 設立 2009年4月28日・資本金 5,000万円・従業員等 581名（グループ全体・2025年6月現在）・代表 井手 高志・渋谷区南平台町は `givery.co.jp/company/`（11/7 確認）。従業員数は「従業員等」で始まるので JSON-LD の numberOfEmployees には出ない（グループ全体の数字なので出さなくてよい）。既存の未登録社は埋めていない
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず
- 次の候補: アイティーケアーズ合同会社（`it-cares.biz`。宇都宮市大通り3-5-18-4F・代表 鈴木 茂樹・2016年法人化は `/company`）。`/aeo/service/`（AEO対策サービス）に AEO の明示あり、`/price` に AEO 内部調整提示書 2万円・改善 9万円〜・AEO＋SEO 月2.9万円（税別）、`/works` に制作実績 300件以上。11/7 時点で基準を満たす（1社の枠のため未追加）
- precheck ✅ 全項目OK → source `c037b4e` → deploy `ac75f7f0` → 本番（push から約9分で反映・空コミット不要）`/company/givery/` 200・sitemap 166（ローカルと一致・新URL掲載）・トップ 115社・AEO「企業34社」ほか8領域の新件数（旧値 0件）・設立欄と JSON-LD foundingDate 2009-04-28。計測リンク 0本（変更なし）。GSC sitemap 再送信 11/7

### 2026-11-08（朝）
- **アイティーケアーズ合同会社（IT-cares）を追加（115→116社・sitemap 167→168・AEO 34→35・Web制作 35→36）**。AEO（最も薄い領域）狙い。宇都宮市のホームページ制作・SEO・AEO対策の会社。候補は 11/7 の「次の候補」から。公式サイトを 11/8 に確認
  - officialUrl `it-cares.biz`（slug `it-cares`）。根拠 `/aeo/service/`（「AEO対策サービス」。FAQ設計・情報構造の整理・サービス説明の具体化・内部リンク・導線の再設計。グローバルナビ「AEO対策」）＝aeo／`/homepage-development`（企業サイト・店舗サイト・サービスサイト・LP の制作）＝web-seisaku
  - reject: dx-consul（自動判定の根拠がトップの「AI導入支援など…ご相談にも対応」の一文。AI導入・DX のサービスページなし。`/web-consulting` は Web施策のコンサル）
  - 付けていないもの: llmo（調べた9ページに LLMO・GEO・AIO・生成AI の語なし）
  - 料金は公開（`/price`：AEO内部調整提示書 2万円・AEO対策改善・最適化 9万円〜・AEO＋SEO 月2.9万円（いずれも税別）、ホームページ制作 8万円〜（税表記なし））を facts に。実績は `/works` の「300件以上のホームページ制作・リニューアル・Web支援」を AEO のみの数字ではないと明記
  - **`data/company-facts.json` に登録**（10社目）: 設立「2016年（合同会社として法人化。2009年に代表が個人事業として開始）」・代表 鈴木 茂樹・宇都宮市大通り3-5-18-4F は `/company`（11/8 確認）。設立日・資本金・従業員数は掲載なし（設立は年のみなので JSON-LD foundingDate は出ない）。mentions は AEO のみ true
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず。ギブリーの company-facts（判断待ち A/B）は未変更
- precheck ✅ 全項目OK → source `3893f31` → deploy `1856918a` → 本番（push から約5分で反映・空コミット不要）`/company/it-cares/` 200・sitemap 168（ローカルと一致・新URL掲載）・トップ 116社・AEO「企業35社」・Web制作「企業36社」（旧値 0件）・設立欄・代表者欄。計測リンク 0本（変更なし）。GSC sitemap 再送信 11/8 09:24（isPending）

### 2026-11-09（朝）
- **deca.marketing は見送り（重複）**: 11/6 の「次の候補」に残っていた deca.marketing は、11/7 に追加した株式会社ギブリーのマーケティングDX事業 DECA のサイトだった。11/9 に公式を再確認：`/about/` の「運営会社 株式会社ギブリー」（渋谷区南平台町15-13 帝都渋谷ビル8F）・フッター「© Givery, Inc.」、`/service/marketing/aeo/`（AEO（AI検索対策）コンサルティング）は 200。この AEO ページは既にギブリーの aeo の根拠（category-keep.json）で、本番 `/company/givery/` にも掲載済み。別会社として足すと同じ会社が2行になるので追加しない。データ・本番の変更なし（116社・AEO 35社・sitemap 168 のまま）。ギブリーの company-facts（判断待ち A/B）は未変更
- 11/6・11/7 の「次の候補」はこれで両方消化（IT-cares は 11/8 に追加済み）。AEO の次の候補は未選定
- **ECマーケティング株式会社を追加（116→117社・sitemap 168→169・AEO 35→36・LLMO 40→41・Web制作 36→37）**。AEO（最も薄い領域）狙い。港区浜松町の Webマーケティング支援・サイト制作会社。候補は Yahoo 検索「AEO対策 会社」の2ページ目（`ecmarketing.co.jp`）。公式サイトを 11/9 に確認
  - officialUrl `ecmarketing.co.jp`（slug `ecmarketing`）。根拠 `/service/promotion/seo/`（「SEO/LLMO/AEO対策サービス」。サービス名・パンくず・グローバルナビに AEO を明示、本文は LLMO の視点を取り入れたコンサルティング）＝aeo・llmo／`/service/production/webdesign/`（戦略的Webサイト制作。コーポレート・サービス・EC・採用サイト）＝web-seisaku
  - reject: dx-consul（自動判定の根拠がトップ。`/service/strategic-operation/webmarketing-dx/` は Webマーケティング（CVR改善）のコンサルで AI導入ではない）／naisei-shien（根拠が業界別の制作事例一覧）
  - 料金はサービスページに記載なし→ priceDisclosed null（自動抽出の「月額 29ドル〜」は ECサイト構築ページのカート利用料なので不採用）。実績はトップ「制作実績500社超」を AEO のみの数字ではないと明記
  - **`data/company-facts.json` に登録**（11社目）: 設立 2010年12月・資本金 10,000,000円（1,000万円と表記）・代表 中山 高志・港区浜松町2-1-13 芝エクセレントビル7F は `/corporate/profile/`（11/9 確認）。従業員数は掲載なし。設立は年月のみなので foundingDate は出ない。mentions は AEO・LLMO・AIO・生成AI が true（GEO はトップ・サービス・会社概要に無し）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず。ギブリーの company-facts（判断待ち A/B）は未変更
  - 同じ検索で見た他社: Speee・CINC・PLAN-B・アドマノ・アズ・マーケティング・AliveCast・トライエッジ・イノーバ・LANY は掲載済み。Oz link は判断待ち。techsuite（AI検索パートナーズ）は TechSuite 掲載済み
- precheck ✅ 全項目OK → source `e23ea6b` → deploy `c61e4375` → 本番（push から約12分で反映・空コミット不要）`/company/ecmarketing/` 200・sitemap 169（ローカルと一致・新URL掲載）・トップ 117社・AEO「企業36社」・LLMO「企業41社」・Web制作「企業37社」（旧値 0件）・設立欄・代表者欄。計測リンク 0本（変更なし）。GSC sitemap 再送信 11/9

### 2026-11-10（朝）
- **株式会社ファーストイノベーションを追加（117→118社・sitemap 169→170・AEO 36→37・LLMO 41→42・Web制作 37→38・AIエージェント開発 40→41・業務自動化 28→29）**。AEO（最も薄い領域）狙い。中央区晴海の Web制作・マーケティング会社。候補は Yahoo 検索「AEO対策サービス 料金 税別」（2ページ目）から拾った QUERYA（`querya.jp`）。10/29 に「調べたページに AEO 表記なし」で見送った会社だが、運営する SEO・AIO・LLMO 専門メディア兼支援サービス QUERYA に AEO のサービスページができていた。公式サイトを 11/10 に確認
  - officialUrl `www.f-innovations.co.jp`（slug `f-innovations`）。根拠 `querya.jp/aeo`（「AEO対策（回答エンジン最適化）」。質問と検索意図の整理・結論と根拠・FAQ/比較/手順・表示と案内の改善の支援範囲と成果物。`querya.jp/services` の分野別サービスに AEO対策）＝aeo。QUERYA の運営は `querya.jp/company`「株式会社ファーストイノベーションが運営する」＋会社概要（社名・代表・設立・所在地が公式と一致）、`f-innovations.co.jp/service/llmo/` から `querya.jp` へリンクあり＝ギブリーの deca と同じ扱い／`/service/llmo/`（LLMO対策・月額10万円〜）＝llmo／`/service/hp/`（ホームページ制作 50万円〜）＝web-seisaku／`/service/lumina/`（AIエージェント導入 Lumina・月額5万円〜）＝ai-agent／`/service/sysytem/`（システム構築の「AI・業務自動化」）＝gyomu-jidoka
  - ⚠️ 自動判定の aeo の根拠 `f-innovations.co.jp/service/llmo/` は「関連情報」欄のニュース見出し（TechSuite のプレスリリース）の AEO で、根拠にしていない（keep で querya.jp/aeo に差し替え）
  - reject: dx-consul（自動判定の根拠がトップ。AIコンサル Optis は AI を使った月次の事業相談と制作支援）
  - 料金は公開（QUERYA `/support`：AIO 3プラン 初期30万/50万/80万円・月額10万/30万/50万円（すべて税別）、LLMO 月額10万円〜・HP制作 50万円〜（税表記なし））。AEO のページに金額なしと priceNote に明記。実績は `querya.jp/cases` が自社サイト・自社サービス・代表者の情報設計の例のみで、顧客の支援実績・件数の掲載なし→ casesDisclosed false
  - **`data/company-facts.json` に登録**（12社目）: 設立 2016年12月19日・資本金 10,000,000円（1,000万円と表記）・代表 木ノ根 雄志・中央区晴海3-13-1 DEUX TOURS EASTタワー52F は `/company/`（11/10 確認）。従業員数は掲載なし。mentions は会社概要ページの本文で判定（AEO は QUERYA 側にのみあるため false。生 HTML だと JSON-LD の「ImageObject」に GEO が誤一致するので本文で数えた）
  - `--new` → keep・reject・facts → `--only` dry の結果を反映 → `--only` dry 差分0。全社一括 dry は実施せず。ギブリーの company-facts（判断待ち A/B）は未変更
- 見送り（同じ調査で見た社）: IR（札幌・`irw.jp/aeo/` は URL のみ aeo で本文は AIO 対策）、セブンアイズ（`llmo-1.com` は AEO を概念として説明するのみ）、ひとのて（`hitonote.co.jp` は AEO がコラムのみ・サービスページ seo/consulting/web/content に表記なし）、KAMERAD・From North・SEO Dash（トップに AEO 表記なし）。次の候補（未精査）: WEBRAIN（高槻市・`webrain.co.jp/service/seo/` に「SEO・AEO（AI）対策」と月額プラン。和文の法人名が未確認）

### 2026-11-11（朝）
- **株式会社ウィブレイン（WEBRAIN）を追加（118→119社・sitemap 172→173・AEO 37→38・LLMO 42→43・Web制作 38→39）**。AEO（最も薄い領域）狙い。大阪府高槻市のホームページ制作・SEO/MEO・SNS運用の会社。候補は 11/10 の「次の候補」。Yahoo 検索「AI検索対策 高槻」でも公式が出ることを確認。公式サイトを 11/11 に確認
  - officialUrl `webrain.co.jp`（slug `webrain`）。根拠 `/service/seo/`（「SEO・AEO (AI)対策」。グローバルナビ・ページ題に AEO、AIに伝わるコンテンツ設計・構造化データ・FAQ/HowTo 等の支援内容、FAQ で「SEO・MEO・AEO・GEO・LLMO」を対策すると明記）＝aeo・llmo／`/service/`（ホームページ制作：新規・リニューアル・LP・採用ページ・WordPress）＝web-seisaku
  - 料金は公開（`/service/seo/`：更新運用プラン 月額 33,000円／39,600円／55,000円／55,000円（税込）・最低半年契約・北摂地域10%割引）。ホームページ制作は個別見積り（`/about/` FAQ）。実績は `/hpworks/`（件数の明記なし）。「前年比3.2倍」「1.8倍」等の自社発表の効果値は載せていない
  - **`data/company-facts.json` に登録**（13社目）: 設立 2013年6月1日・代表 来栖 秀長・高槻市野見町4-6-2F は `/about/` 会社概要（11/11 確認）。資本金・従業員数は掲載なし。mentions は会社概要ページの本文で AEO・LLMO が true
  - `--new` → keep・facts → `--only` dry の結果を反映 → `--only` dry 差分0。reject なし。全社一括 dry は実施せず。ギブリーの company-facts（判断待ち A/B）は未変更

### 2026-11-11（16:00 遅れ挽回ルーチン）ウェスタナ・CREVIA・課題解決プラットフォームに「事業内容の答え」、ニュース2本に脆弱性の要点表
- **GSC（9/13〜11/8）**: 「ウェスタナ」4@7.8・「株式会社ウェスタナ」1@12（`/company/westana/`）／「株式会社crevia」4@9.5（`/company/crevia-ts/`）／「課題解決プラットフォーム」3@10.3・「株式会社課題解決プラットフォーム」2@7.0（`/company/0120/`）／「cve-2026-109849」6@9.3（`/articles/news-20261104-18/`）／「jvn#82782759」5@9.8（`/articles/news-20261029-14/`）。いずれもクリック0
- `data/company-summary.json` に3社を追加（title・h1・description・冒頭の出典つき表・`ldWebPage: true`。公式と国税庁 法人番号公表サイトを 11/11 確認）。service-facts.json・category-keep.json・company-facts.json・評点類は未変更。`--rescore` 未実行
  - ウェスタナ: 事業内容・AIコンサル 月10万円〜（税別・最低6か月）・AI顧問 月50,000円（税別・最低6ヶ月）・AI開発 10万/50万円〜・AEO/AIO は一律の金額なし・所在地／代表／設立・法人番号 7140001114134
  - CREVIA: AI検索対策 月33,000円（税込・SEO込み・最低3か月）・HP制作 30万円〜（税別）・MEO・構造化マークアップ・法人番号 3330001032840（登記商号「株式会社ＣＲＥＶＩＡ」。同名の別会社が横浜・長岡にあると明記）
  - 課題解決プラットフォーム: AI検索対策 月30万/50万円（税抜・初期15万円〜・最低6ヶ月）・業務改善AI・MEO・動画・法人番号 9012701017734
- ニュース2本: 冒頭（導入文の後）に JVN を 11/11 再確認した要点表（番号・対象製品・影響バージョン・内容・対処）、title/h1 に番号（「…（日時）Hinemosの脆弱性 CVE-2026-109849 ほか」「…Apache Struts 2 JVN#82782759 ほか」）、前付け `updated: 2026-11-11`
- ⚠️ 判断待ち（未変更）: 課題解決プラットフォームの service-facts priceNote「AI研修 ライト（半日）150,000円/人〜」は、11/11 の公式 `/ai-training/` が「研修は単体ではお受けしていません」で食い違う（表に明記）。ai-kenshu の領域を外すと領域の社数・/data/ が変わる
- 落ちたページ（トップ・category/naisei-shien・company/webridge 各 1→0）は偶然の範囲として未調査・未変更
- title 変更: 上記5URL（11/11）→ 11/18 まで title を変えない
- precheck ✅ 174ページ全項目OK → source `e6504be` → deploy `0787a6f8` → 本番（push から約10分で反映・空コミット不要）5URLで新 title・法人番号/要点表を確認、旧 title 0件。sitemap 174（ローカルと一致・lastmod の変化は5URLのみ）。計測リンク 0→0

### 2026-11-12（朝）
- **株式会社BOZUPを追加（119→120社・sitemap 177→178・AEO 38→39・LLMO 43→44・Web制作 39→40）**。AEO（最も薄い領域）狙い。横浜市中区（長野にも拠点）の店舗向け Web制作・MEO・動画広告の会社。候補は Yahoo 検索「"AEO対策" 料金プラン 制作会社 横浜」（未使用の語）。公式サイトを 11/12 に確認
  - officialUrl `bozup.co.jp`（slug `bozup`）。根拠 `/web-service/`（「AEO / AI Search Optimization」。サービス項目「02 — AEO：AEO対策（AIに発見・引用される設計）」、LLMO（構造化データ・NAP統一・llms.txt）→AIO（MEO）→AEO（FAQ・Answer-first）の3段階を分けて定義し全段階を実装すると明記、料金表「AI検索対策サイト制作」）＝aeo・llmo・web-seisaku（自動判定の aeo・web-seisaku の根拠はトップ → keep で /web-service/ に差し替え）
  - 料金は公開（制作費 120,000円〜・月額 20,000円〜（MEO・AEO運用込み）・すべて税別）を facts に。⚠️ 自動抽出の「月額30〜50万円」は `/online-ad/`（動画広告）の値なので不採用。実績は `/works/`（件数の明記なし）
  - **`data/company-facts.json` に登録**（14社目）: 設立 2013年5月2日・代表 笹田 祐介・横浜市中区日本大通７ 合人社横浜日本大通７ビル４Ｆ は `/company/`（11/12 確認）。資本金・従業員数は掲載なし。mentions は会社概要の本文で AEO のみ true（事業内容「AI検索対策サイト・LP制作（SEO・MEO・AEO）」）
  - `--new` → keep・facts → `--only` dry の結果を反映 → `--only` dry 差分0。reject なし。全社一括 dry は実施せず。ギブリーの company-facts（判断待ち A/B）は未変更
- 見送り（同じ調査で見た社）: カバズワース（kaba-design.jp。`/about/` に「AEO対策・GEO対策・AI検索対策にも力を入れています」とあるが、AEO のサービスページ・料金がなく法人格も未確認＝次の候補）、くるみ（`/services/aio-llmo` は AIO/LLMO のみ。AEO はブログのみ）、Mesut（名古屋。トップ・`/mentori-aio/` は SEO・AIO）、ソニーネットワークコミュニケーションズ（AEO はブログのみ・`/service/` に AEO なし）、one-clue（仙台。制作 Q&A で AIO/AEO/LLMO 対策の可否に触れるのみ）
- **点検 C3 `/company/jetb/`＝誤検知**：「当サイトでは社数を検証していません」は否定（免責）の文。主張は JetB 公式トップの「累計 3,000社 以上の導入実績」を帰属・出典つきで引用したもので、11/12 も公式トップに同じ記載。変更なし
