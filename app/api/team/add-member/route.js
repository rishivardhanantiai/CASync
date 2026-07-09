import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role, services } = body;

    if (!email || !password || !name) {
      return Response.json(
        { success: false, message: "Name, email and password are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.teamMember.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return Response.json(
        { success: false, message: "A team member with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const member = await prisma.teamMember.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        role: role || "Team",
        services: Array.isArray(services) ? services : [],
      },
    });

    return Response.json({
      success: true,
      message: "Team member added successfully.",
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        services: member.services,
      },
    });
  } catch (error) {
    console.error("Add Team Member Error:", error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
