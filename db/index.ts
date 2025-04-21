// Export schema type definitions
// Note: These are just TypeScript interfaces until Drizzle is installed
export interface FaqData {
  id: number;
  question_text: string;
  answer_text: string;
  category?: string;
  embedding?: any; // Will be a vector type when pgvector is installed
  ts?: any; // Will be a tsvector type when properly set up
  created_at: Date;
}

export interface FaqThreshold {
  id: number;
  threshold_value: number;
  updated_at: Date;
  updated_by?: string;
}

// Mock database implementation for demonstration purposes
// This will be replaced with a real database connection when packages are installed

// Mock database connection
export function createDb() {
  return mockDb;
}

// Mock database with in-memory storage
const mockDb = {
  // Mock FAQ data
  faqData: [
    {
      id: 1,
      question_text: '製品の使い方を教えてください',
      answer_text: '製品の使い方については、ユーザーマニュアルをご参照ください。詳細な手順とチュートリアルが記載されています。',
      category: '使い方',
      created_at: new Date()
    },
    {
      id: 2,
      question_text: '料金プランについて知りたいです',
      answer_text: '基本プランは月額8,000円から、プレミアムプランは月額15,000円からご利用いただけます。年間契約の場合は10%割引となります。',
      category: '料金',
      created_at: new Date()
    },
    {
      id: 3,
      question_text: 'アカウント設定の変更方法は？',
      answer_text: 'アカウント設定の変更は、ログイン後に画面右上のプロフィールアイコンをクリックし、「設定」を選択することで行えます。',
      category: 'アカウント',
      created_at: new Date()
    }
  ],
  
  // Mock threshold data
  thresholdData: [
    {
      id: 1,
      threshold_value: 0.4,
      updated_at: new Date(),
      updated_by: 'system'
    }
  ],
  
  // Mock query method
  async query(sql: string, params: any[] = []) {
    console.log('Mock DB Query:', sql, params);
    
    // Simple SQL parsing to handle different query types
    if (sql.includes('SELECT * FROM faq_data')) {
      if (sql.includes('WHERE')) {
        // Handle search query
        const searchTerm = params[0].replace(/%/g, '').toLowerCase();
        const results = this.faqData.filter(item => 
          item.question_text.toLowerCase().includes(searchTerm) || 
          item.answer_text.toLowerCase().includes(searchTerm)
        );
        return { rows: results };
      } else {
        // Handle get all query
        return { rows: this.faqData.slice(0, params[0] || 100) };
      }
    } else if (sql.includes('SELECT * FROM faq_threshold')) {
      return { rows: this.thresholdData };
    } else if (sql.includes('INSERT INTO faq_data')) {
      // Handle insert query
      const newId = this.faqData.length > 0 ? Math.max(...this.faqData.map(item => item.id)) + 1 : 1;
      const newItem = {
        id: newId,
        question_text: params[0],
        answer_text: params[1],
        category: params[2],
        created_at: new Date()
      };
      this.faqData.push(newItem);
      return { rows: [{ id: newId }] };
    }
    
    return { rows: [] };
  }
};

// Table names and query helpers
export const faqData = {
  tableName: 'faq_data',
  
  // Helper methods for common queries
  async findAll(db: any, limit = 100) {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} ORDER BY id LIMIT $1`,
      [limit]
    );
    return result.rows;
  },
  
  async findById(db: any, id: number) {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },
  
  async search(db: any, query: string, limit = 3) {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} 
       WHERE question_text ILIKE $1 OR answer_text ILIKE $1
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  },
  
  async insert(db: any, data: { question_text: string, answer_text: string, category?: string }) {
    const result = await db.query(
      `INSERT INTO ${this.tableName} (question_text, answer_text, category, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [data.question_text, data.answer_text, data.category || null]
    );
    return result.rows[0];
  }
};

export const faqThreshold = {
  tableName: 'faq_threshold',
  
  async getThreshold(db: any) {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} ORDER BY id LIMIT 1`
    );
    return result.rows.length > 0 ? result.rows[0] : { threshold_value: 0.4 };
  },
  
  async updateThreshold(db: any, value: number, updatedBy: string) {
    const result = await db.query(
      `INSERT INTO ${this.tableName} (threshold_value, updated_by, updated_at)
       VALUES ($1, $2, NOW())
       RETURNING id`,
      [value, updatedBy]
    );
    return result.rows[0];
  }
};
