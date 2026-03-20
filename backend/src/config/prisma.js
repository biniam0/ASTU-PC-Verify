import dotenv from "dotenv";
import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { pool } from "./db.js";

dotenv.config();

const { PrismaClient } = pkg;
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});
