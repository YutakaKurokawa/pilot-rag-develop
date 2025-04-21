-- Migration file: 0000_initial_faq_tables.sql
-- Generated at: 2025-04-21T14:28:00
-- Description: Initial migration for FAQ tables

-- Create extension for vector support
CREATE EXTENSION IF NOT EXISTS vector;

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
