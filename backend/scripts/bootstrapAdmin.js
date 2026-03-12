import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/config/prisma.js";

async function main() {
  const password = "Admin123!@#";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      username: "admin1",
      email: "admin1@example.com",
      password_hash: passwordHash,
      role: "admin",
      full_name: "Main Administrator",
      department: "ICT",
      phone: "+251900000000",
      is_active: true,
    },
  });

  console.log("Bootstrap admin created:", {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
}

main()
  .catch((err) => {
    console.error("Failed to create bootstrap admin", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
