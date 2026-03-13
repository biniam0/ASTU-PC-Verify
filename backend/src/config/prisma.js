import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { pool } from "./db.js";

dotenv.config();

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});
