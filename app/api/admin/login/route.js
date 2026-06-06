import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req){
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

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      return Response.json(
        { success: false, message: "Incorrect credentials" },
        { status: 401 }
      );
    }

    // Comparing entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return Response.json(
        { success: false, message: "Incorrect credentials" },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      token: String(admin.id),
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}