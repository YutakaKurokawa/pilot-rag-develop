// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();                           // ← dotenv で .env を読む

export default defineConfig({
  schema: "./src/schema",                  // 変更なし
  out: "./sql",
  dialect: "pg",                           // ★ 追加 ★
  driver: "pg",                            // driver はあっても OK
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});
