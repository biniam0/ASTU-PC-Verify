import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. PostgreSQL connection will fail until it is configured.",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== "test") {
    console.log("executed query", { text, duration, rows: res.rowCount });
  }
  return res;
}
