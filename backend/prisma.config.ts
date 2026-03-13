import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Use DATABASE_URL for all Prisma CLI operations (migrate, generate, etc.)
    url: process.env.DATABASE_URL ?? "",
  },
});
