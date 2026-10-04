import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function seedAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@tuanlinh.coffee";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!@";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await db.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Thu Ngân Quầy 1",
      passwordHash,
    },
  });

  return admin;
}
