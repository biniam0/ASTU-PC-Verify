import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. PostgreSQL connection will fail until it is configured.",
  );
}

// Optional query logging can be enabled explicitly for debugging
const SHOULD_LOG_QUERIES =
  process.env.LOG_SQL_QUERIES === "true" &&
  process.env.NODE_ENV !== "production" &&
  process.env.NODE_ENV !== "test";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (SHOULD_LOG_QUERIES) {
    console.log("executed query", { text, duration, rows: res.rowCount });
  }
  return res;
}
