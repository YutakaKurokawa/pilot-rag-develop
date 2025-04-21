# dataDesign.md  
> Company‑specific data model for the **24 h RAG問い合わせ自動化プラットフォーム** described in Project Overview.  
> RDBMS: **PostgreSQL 15 + pgvector 0.7**,   Time‑zone: **Asia/Tokyo**

---

## 1. データモデル概要

### 1.1 取扱データの分類と要件
| # | データ分類 | 主な内容 | 更新頻度 | 保持期間 | 重要度 |
|---|-----------|---------|---------|---------|-------|
| 1 | **ユーザー情報** | 従業員（CS, Eng/PM, Sales, Admin）, 部署情報 | 可変 | 退職後＋1 年 | ★★★ |
| 2 | **ナレッジリソース** | Zendesk FAQ, Webマニュアル, リリースノート, Confluence記事 | API/Webhook: 4‑8回/月＋随時手動 | 最新のみ (上書き) | ★★★★ |
| 3 | **チャット会話履歴** | 発話ログ・追加質問・RAG Root‑Source | 常時 | 2 年 | ★★★ |
| 4 | **埋め込みベクトル** | 上記リソース & 会話チャンク | 同期直後 | 同リソースと同寿命 | ★★★ |
| 5 | **エスカレーションレコード** | 重要キーワード検知→CS二次対応チケットID | 随時 | 1 年 | ★★ |
| 6 | **同期ジョブログ** | 自動同期の実行結果・差分件数・失敗理由 | 4‑8回/月 | 6 ヶ月 | ★ |

---

### 1.2 コアエンティティ
- **User**　‐ 従業員（role: `admin` / `cs` / `pm` / `sales`）
- **Department**　‐ エスカレーション先部署 (Phase 1: 固定 `cs_l2`)
- **Resource**　‐ FAQ/Doc。`source_type` で区分 (e.g., `zendesk`, `confluence`, `manual_pdf`)
- **Embedding**　‐ Resource または Memory のチャンクベクトル
- **Conversation / Memory**　‐ ユーザーとBotの対話スレッド & メッセージ
- **Escalation**　‐ 重要問い合わせの二次対応チケット
- **SyncJob**　‐ 自動同期バッチの実行記録

> **スキーマ規模想定**: リソース 20k 件、Embeddings 2 M 行。

---

## 2. ER図

```mermaid
erDiagram
    DEPARTMENT ||--|{ USER : "has"
    USER ||--|{ CONVERSATION : "initiates"
    CONVERSATION ||--|{ MEMORY : "contains"
    RESOURCE ||--|{ EMBEDDING : "chunks"
    MEMORY ||--|{ EMBEDDING : "vectorized"
    MEMORY ||--|| ESCALATION : "triggers"
    RESOURCE ||--|{ SYNCJOB : "created by"

    DEPARTMENT {
        PK id INT
        name TEXT
    }
    USER {
        PK id INT
        department_id INT
        name TEXT
        email TEXT
        role TEXT
        password_hash TEXT
        sso_sub TEXT
        created_at TIMESTAMP
    }
    RESOURCE {
        PK id INT
        source_type TEXT
        external_id TEXT
        title TEXT
        file_path TEXT
        updated_at TIMESTAMP
    }
    EMBEDDING {
        PK id INT
        resource_id INT
        memory_id INT
        vector VECTOR
        chunk_index INT
        metadata JSON
    }
    CONVERSATION {
        PK id INT
        user_id INT
        title TEXT
        created_at TIMESTAMP
    }
    MEMORY {
        PK id INT
        conversation_id INT
        speaker TEXT
        content TEXT
        created_at TIMESTAMP
    }
    ESCALATION {
        PK id INT
        memory_id INT
        ticket_id TEXT
        status TEXT
        created_at TIMESTAMP
    }
    SYNCJOB {
        PK id INT
        resource_id INT
        job_type TEXT
        diff_count INT
        status TEXT
        executed_at TIMESTAMP
        message TEXT
    }
