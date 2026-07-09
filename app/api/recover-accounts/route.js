import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Create the Admin
    await prisma.admin.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        password: "password123", // Note: Ensure your API handles plain text or use the hash
        name: "Admin User"
      }
    });

    // 2. Create the Team Members
    const teamEmails = ["member@example.com", "member2@example.com"];
    for (const email of teamEmails) {
      await prisma.teamMember.upsert({
        where: { email: email },
        update: {},
        create: {
          email: email,
          password: "password123",
          name: "Team Member",
          role: "Team"
        }
      });
    }

    return NextResponse.json({ success: true, message: "Credentials restored!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}