import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    const password = String(body?.password || "");

    if (!email || !password) {
      return Response.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return Response.json(
        {
          success: false,
          message: "Incorrect credentials",
        },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return Response.json(
        {
          success: false,
          message: "Incorrect credentials",
        },
        { status: 401 }
      );
    }

    const superAdminExists =
      await prisma.admin.findFirst({
        where: {
          role: "Super Admin",
        },
      });

    if (!superAdminExists) {
      await prisma.admin.updateMany({
        data: {
          role: "Super Admin",
        },
      });
    }

    const updatedAdmin =
      await prisma.admin.findUnique({
        where: {
          id: admin.id,
        },
      });

    return Response.json({
      success: true,
      token: String(updatedAdmin.id),
      admin: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone,
        role: updatedAdmin.role,
      },
    });
  } catch (error) {
    console.error(
      "Admin Login Error:",
      error
    );

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}