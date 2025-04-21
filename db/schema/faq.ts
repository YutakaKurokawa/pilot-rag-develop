// This file defines the schema for the FAQ tables
// It will be replaced with Drizzle ORM schema when the packages are installed

// FAQ data table schema
export interface FaqData {
  id: number;
  question_text: string;
  answer_text: string;
  category?: string;
  embedding?: any; // Will be a vector type when pgvector is installed
  ts?: any; // Will be a tsvector type when properly set up
  created_at: Date;
}

// FAQ threshold settings table schema
export interface FaqThreshold {
  id: number;
  threshold_value: number;
  updated_at: Date;
  updated_by?: string;
}

// Export table names for use in SQL queries
export const tableNames = {
  faqData: 'faq_data',
  faqThreshold: 'faq_threshold'
};

// SQL for creating the tables (for reference)
export const createTablesSql = `
-- Create FAQ data table
CREATE TABLE IF NOT EXISTS "faq_data" (
  "id" SERIAL PRIMARY KEY,
  "question_text" TEXT NOT NULL,
  "answer_text" TEXT NOT NULL,
  "category" VARCHAR(40),
  "embedding" VECTOR(768),
  "ts" TSVECTOR GENERATED ALWAYS AS (to_tsvector('japanese', question_text || ' ' || answer_text)) STORED,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS "ts_idx" ON "faq_data" USING GIN ("ts");

-- Create FAQ threshold settings table
CREATE TABLE IF NOT EXISTS "faq_threshold" (
  "id" SERIAL PRIMARY KEY,
  "threshold_value" REAL NOT NULL DEFAULT 0.4,
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_by" VARCHAR(100)
);

-- Insert initial threshold value
INSERT INTO "faq_threshold" ("threshold_value", "updated_by")
VALUES (0.4, 'system_init')
ON CONFLICT DO NOTHING;
`;
