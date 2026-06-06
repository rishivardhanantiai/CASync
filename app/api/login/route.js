import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const data = await req.json();

    const email = String(data?.email || "").trim().toLowerCase();
    const password = String(data?.password || "");

    if (!email || !password) {
      return Response.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    // Step 1: Find user by email only
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return Response.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Step 2: Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return Response.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Step 3: Return user data (excluding password)
    return Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}