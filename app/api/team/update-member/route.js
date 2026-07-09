import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, name, email, phone, role, services, password } = body;

    if (!id) {
      return Response.json({ success: false, message: "Team member ID is required" }, { status: 400 });
    }

    const updateData = {
      name: name || undefined,
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone || null,
      role: role || undefined,
      services: Array.isArray(services) ? services : undefined,
    };

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.teamMember.update({
      where: { id },
      data: updateData,
    });

    return Response.json({
      success: true,
      message: "Team member updated successfully",
      member: updated,
    });
  } catch (error) {
    console.error("Update Team Member Error:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
