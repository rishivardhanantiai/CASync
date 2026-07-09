import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {

  try {

    const body = await req.json();
    if (!body.email || !body.password) {
      return Response.json({ success: false, message: "Email and password are required" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const admin = await prisma.admin.create({
      data: {
        name: body.name || null,
        email: body.email.trim().toLowerCase(),
        password: hashedPassword,
        phone: body.phone || null,
        role: body.role || "Admin",
      },
    });

    return Response.json({
      success: true,
      message: "Admin added successfully",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      }
    });

  } catch (error) {

    return Response.json({
      success: false,
      message: error.message
    });

  }

}