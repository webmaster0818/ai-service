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
