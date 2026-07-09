import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, name, email, phone, role, password } = body;

    if (!id) {
      return Response.json({ success: false, message: "Admin ID is required" }, { status: 400 });
    }

    const data = {
      name: name || null,
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone || null,
      role: role || undefined,
    };

    if (password && password.trim() !== "") {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data,
    });

    return Response.json({
      success: true,
      message: "Admin updated successfully",
      admin: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone,
        role: updatedAdmin.role,
      }
    });

  } catch (error) {
    console.error("Update Admin Error:", error);
    return Response.json({
      success: false,
      message: error.message
    });
  }
}
