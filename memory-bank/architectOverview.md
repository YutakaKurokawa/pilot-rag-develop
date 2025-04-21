## 1. システム全体像・アーキテクチャ
### 1.1 アーキテクチャ概要

- **主目的**: 24 時間対応でユーザー問い合わせを 90 % 自動化する RAG チャットボットを提供し、サポート工数と回答遅延を削減する。
- **構成要素**:
  - **フロントエンド**: Next.js 14 (App Router) / Vercel Edge Runtime
  - **バックエンド**: Edge Route & Serverless Route に実装した API / RAG ロジック (Vercel AI SDK + Drizzle ORM)
  - **データベース**: マネージド Postgres (Neon / Supabase / Vercel Postgres) + `pgvector`
  - **外部 AI サービス**: OpenAI GPT‑4o via Vercel AI SDK
- **位置付け**: 本設計書はシステムの上位設計として各コンポーネントの連携を示す。

---

## 2. 全体構成図（System Architecture Diagram）
### 2.1 論理構成図
```mermaid
flowchart LR
    U[ユーザー] --(Web/Mobile)--> FE[フロントエンド(Edge)]
    FE --> API[バックエンド(API/RAG ロジック)]
    API --> DB[(Postgres + pgvector)]
    API -.->|REST| LLM[外部AIサービス(OpenAI)]
```
- **フロントエンド**: shadcn‑ui + TailwindCSS で構築したチャット UI／管理 UI。
- **バックエンド**: Edge Route でストリーミング応答、Serverless Route でベクトル検索と RAG。
- **データベース**: FAQ・ドキュメント埋め込み・会話履歴を保存。
- **外部 AI サービス**: GPT‑4o (temperature 0.2) を呼び出し。

---

## 3. サーバ・クライアント・外部連携システム構造

### 3.1 クライアント（フロントエンド）構造
- **Web UI**: チャット画面 (リアルタイムストリーミング), ログ・ROI ダッシュボード。
- **管理画面**: FAQ 追加／削除、同期設定、権限管理 (NextAuth.js)。

### 3.2 サーバ（バックエンド）構造
- **API サーバ** (Edge & Serverless):
  - `POST /api/rag` で質問を受け取り、検索結果と GPT‑4o 応答を統合。
  - 共通処理: JWT 検証、RBAC、Structured Logging (Sentry)。
- **RAG ロジック**:
  - ベクトル検索 (`pgvector` cosine) → コンテキスト整形 → LLM 呼び出し → 引用付き回答を生成。
  - 会話履歴を Postgres に保存し、コンテキスト長を最適化。

### 3.3 外部システム
- **LLM サービス**: OpenAI GPT‑4o (Vercel AI SDK `@ai-sdk/openai`).
- **ストレージ / 他 API**: S3 互換ストレージ (R2 など) を `@vercel/blob` で接続可能。

---

## 4. 物理構成図（例）
```
┌────────────────────────────────┐
│         Vercel Edge Network      │
│  ┌──────────────────────────┐   │
│  │ Edge Route (chat/stream) │   │
│  └──────────────────────────┘   │
│                 │                │
│  ┌──────────────────────────┐   │
│  │ Serverless Route (api)   │───┼─▶ OpenAI API
│  └──────────────────────────┘   │
│                 │                │
└─────────────┬───┴────────────────┘
              │ HTTPS
      ┌───────▼────────────────────┐
      │  Managed Postgres (Neon)   │
      └────────────────────────────┘
```

---

## 5. モジュール構成・コンポーネント一覧
| **モジュール** | **役割 / 機能概要** |
|----------------|---------------------|
| フロントエンド (UI) | チャット画面, 管理 UI, 認証画面 (Next.js 14 / shadcn‑ui) |
| バックエンド API | `@vercel/ai` Edge Route, Serverless Route (`route.ts`) |
| データベース | Postgres + `pgvector`, Drizzle ORM Migration |
| ベクトル検索 | `SELECT … ORDER BY embedding <=> :q` で類似度検索 |
| LLM 連携 | GPT‑4o 呼び出し、プロンプトテンプレート管理 |
| 認証・権限 | NextAuth.js (OIDC), RBAC Claims |
| ログ・監視 | Vercel Monitoring, Sentry, Datadog LogDrain |