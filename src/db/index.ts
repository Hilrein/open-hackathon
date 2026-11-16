import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Клиент создаётся лениво, только если DATABASE_URL существует
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your Neon database."
    );
  }
  if (!db) {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema });
  }
  return db;
}

export { schema };
