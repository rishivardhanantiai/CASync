const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Generating password hash...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create or Update Client User
  console.log("Creating Client user...");
  const clientUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {
      name: "Client User",
      mobile: "9999999999",
      password: hashedPassword,
    },
    create: {
      name: "Client User",
      email: "user@example.com",
      mobile: "9999999999",
      password: hashedPassword,
    },
  });
  console.log(`Created Client User: ${clientUser.email}`);

  // 2. Create or Update Super Admin
  console.log("Creating Super Admin user...");
  const adminUser = await prisma.admin.upsert({
    where: { email: "admin@example.com" },
    update: {
      name: "Super Admin",
      password: hashedPassword,
      phone: "9999999999",
      role: "Super Admin",
    },
    create: {
      name: "Super Admin",
      email: "admin@example.com",
      password: hashedPassword,
      phone: "9999999999",
      role: "Super Admin",
    },
  });
  console.log(`Created Admin User: ${adminUser.email} (Role: ${adminUser.role})`);

  // 3. Create or Update Team Member 1
  console.log("Creating Team Member 1...");
  const teamMember1 = await prisma.teamMember.upsert({
    where: { email: "member@example.com" },
    update: {
      name: "Team Member 1",
      password: hashedPassword,
      phone: "9999999999",
      role: "Team",
    },
    create: {
      name: "Team Member 1",
      email: "member@example.com",
      password: hashedPassword,
      phone: "9999999999",
      role: "Team",
    },
  });
  console.log(`Created Team Member 1: ${teamMember1.email}`);

  // 4. Create or Update Team Member 2
  console.log("Creating Team Member 2...");
  const teamMember2 = await prisma.teamMember.upsert({
    where: { email: "member2@example.com" },
    update: {
      name: "Team Member 2",
      password: hashedPassword,
      phone: "9999999999",
      role: "Team",
    },
    create: {
      name: "Team Member 2",
      email: "member2@example.com",
      password: hashedPassword,
      phone: "9999999999",
      role: "Team",
    },
  });
  console.log(`Created Team Member 2: ${teamMember2.email}`);

  console.log("\nAll seed users created successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
