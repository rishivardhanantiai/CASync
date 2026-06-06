import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return Response.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const member = await prisma.teamMember.findUnique({ where: { email } });

    if (!member) {
      return Response.json(
        { success: false, message: "Incorrect credentials." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      return Response.json(
        { success: false, message: "Incorrect credentials." },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      token: String(member.id),
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        services: member.services,
        allocatedClientIds: member.allocatedClientIds,
      },
    });
  } catch (error) {
    console.error("Team Login Error:", error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
