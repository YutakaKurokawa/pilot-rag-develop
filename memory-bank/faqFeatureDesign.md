# FAQコア機能 詳細設計書 – 実装指針 (Essential)
本書は **FAQ 検索〜回答提供のバックエンド API** を実装する際に最低限必要な情報を示す。開発チーム／自動化エージェントが迷わず製造できるよう、機能要件と設計判断の根拠だけをまとめ、具体コードは含めない。

---
## 1. 目的と適用範囲
| 項目 | 内容 |
|------|------|
| 目的 | ユーザー質問に対し、FAQ 検索→回答提示→必要に応じて LLM 生成回答を返す API を提供する。|
| 適用範囲 | バックエンド API、DB スキーマ、検索ロジック、LLM フォールバック、基本的なエラーハンドリング、性能・監視指標。|
| 非対象 | Web UI 実装、CI/CD パイプライン詳細、フロントエンドのデザイン。|

---
## 2. ユースケースと正常フロー
1. **質問受付** – Web UI から `GET /api/faq?query=` で質問文字列を受信。
2. **検索処理** – FAQ テーブルを全文検索し、類似スコア上位 3 件を取得。
3. **スコア評価** – 最上位件のスコアが動的閾値以上なら FAQ 直返し。閾値未満ならフォールバックへ。
4. **フォールバック** – 検索結果要約をコンテキストに LLM へプロンプト送信し、生成回答を取得。
5. **レスポンス整形** – `answer`, `source (FAQ|AI)`, `score`, `traceId` を JSON で UI へ返却。
6. **ログ記録** – 構造化ログに `traceId`, `userId`, `tenantId`, `resultSource`, `latency` を出力。

---
## 3. API 概要
| エンドポイント | 用途 | 入力 | 出力 | 主要ステータス |
|----------------|------|------|------|---------------|
| `GET /api/faq` | FAQ 検索 | `query` (文字列) | `answer`, `source`, `score`, `traceId` | 200, 400, 502 |
| `POST /api/faq` | FAQ 登録 (管理者) | `question_text`, `answer_text`, `category?` | `id` | 201, 409 |

---
## 4. データモデル (faq_data)
| 列名 | 型 | 説明 | Drizzle定義 |
|------|----|------|------------|
| id | SERIAL PK | FAQ識別子 | `serial("id").primaryKey()` |
| question_text | TEXT | 質問文 | `text("question_text").notNull()` |
| answer_text | TEXT | 回答文 | `text("answer_text").notNull()` |
| category | VARCHAR(40) | 任意カテゴリ | `varchar("category", { length: 40 })` |
| embedding | VECTOR(768) | 将来の類似検索用 | `pgvector.vector("embedding", 768)` |
| ts | TSVECTOR | 全文検索用生成列 | `tsvector("ts").generatedAlwaysAs('to_tsvector(\'japanese\', question_text || \' \' || answer_text)')` |
| created_at | TIMESTAMPTZ | 登録日時 | `timestamp("created_at", { withTimezone: true }).defaultNow()` |

インデックス: 
- `GIN(ts)` を必須: `gin("ts")` 
- embedding 用 ivfflat / HNSW は拡張フェーズで追加

### 4.1 閾値設定テーブル (faq_threshold)
| 列名 | 型 | 説明 | Drizzle定義 |
|------|----|------|------------|
| id | SERIAL PK | 設定識別子 | `serial("id").primaryKey()` |
| threshold_value | FLOAT | 検索スコア閾値 | `real("threshold_value").notNull().default(0.4)` |
| updated_at | TIMESTAMPTZ | 更新日時 | `timestamp("updated_at", { withTimezone: true }).defaultNow()` |
| updated_by | VARCHAR(100) | 更新者 | `varchar("updated_by", { length: 100 })` |

---
## 5. 検索 & フォールバック設計
| 項目 | 決定事項 | 補足 |
|------|---------|------|
| 検索手法 | Postgres `tsvector` + 日本語辞書 (pg_jieba) | 3 件取得・スコア順 |
| スコア閾値 | 運用テーブル (`faq_threshold`) で設定。初期値 = 0.4 × p50 スコア | 調整しやすいよう DB 保持 |
| LLM | OpenAI GPT‑4o | 温度 0.2 / max 512 token |
| プロンプト要約 | 検索上位 Q&A 合計 400 文字以内 | 要約アルゴリズムは自由 |

---
## 6. エラー分類 (抜粋)
| 分類 | 例 | HTTP | ユーザー表示 | 運用対応 |
|------|----|------|-------------|--------|
| 入力不正 | 空クエリ | 400 | 再入力促し | 監視対象外 |
| DB 障害 | 接続不可 | 500 | システムエラー | Ops 通知 |
| LLM 遅延 | タイムアウト | 502 | AI 応答遅延 | 自動再試行 3回 |

※ コード体系・ログ形式は *errorAndExceptionalHandling.md* を参照。

---
## 7. 性能・監視
| 指標 | 目標 | 備考 |
|------|------|------|
| 応答時間 p95 | ≤ 2.5 s | UI 体感向上のため |
| DB Hit Rate | ≥ 70 % | LLM コスト最適化 |
| LLM Timeout率 | < 1 % / 5 分 | SLA 準拠 |

---
## 8. テスト観点
- **単体**: スコア計算、閾値判定、プロンプト生成。  
- **結合**: FAQ ヒット／ミス時の応答が UI 仕様どおりか。  
- **負荷**: 15 RPS・p95 < 3 s 達成。  
- **障害注入**: DB 3 s 停止で LLM フォールバックが成功すること。

---
## 9. 今後の拡張ポイント
1. **ベクトル検索移行** – pgvector + ivfflat で検索精度と速度を両立。  
2. **CSV バッチ登録** – 管理 API をキュー化し大量データ投入に対応。  
3. **多言語対応** – question/answer を JSONB 多言語フィールドに変更。
