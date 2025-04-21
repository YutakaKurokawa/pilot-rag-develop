# FAQ Feature Database Setup

This directory contains the database schema and migration files for the FAQ feature.

## Directory Structure

- `schema/`: Contains the Drizzle ORM schema definitions
- `migrations/`: Will contain the generated migration files
- `migrate.ts`: Script to apply migrations to the database

## Setup Instructions

1. Install the required packages:

```bash
npm install drizzle-orm pg @neondatabase/serverless drizzle-kit pg-vector postgres dotenv
```

2. Add the DATABASE_URL to your `.env.local` file:

```
DATABASE_URL=postgres://username:password@host:port/database
```

3. Generate migration files:

```bash
npm run db:generate
```

This will create SQL migration files in the `db/migrations` directory based on your schema definitions.

4. Apply migrations to your database:

```bash
npm run db:migrate
```

## Schema Details

### FAQ Data Table (`faq_data`)

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | FAQ identifier |
| question_text | TEXT | Question text |
| answer_text | TEXT | Answer text |
| category | VARCHAR(40) | Optional category |
| embedding | VECTOR(768) | For future similarity search |
| ts | TSVECTOR | Generated column for full-text search |
| created_at | TIMESTAMPTZ | Creation timestamp |

Indexes:
- GIN index on `ts` for efficient full-text search

### FAQ Threshold Table (`faq_threshold`)

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Setting identifier |
| threshold_value | FLOAT | Search score threshold (default: 0.4) |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| updated_by | VARCHAR(100) | User who last updated the threshold |

## Usage in Application

Once the database is set up, you can use the Drizzle ORM to interact with the FAQ tables in your application code:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { faqData, faqThreshold } from './db/schema/faq';

// Create database connection
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

// Example: Query FAQs
const faqs = await db.select().from(faqData).limit(10);

// Example: Get current threshold
const [threshold] = await db.select().from(faqThreshold).limit(1);
