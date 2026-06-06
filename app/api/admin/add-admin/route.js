import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {

  try {

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const admin = await prisma.admin.create({
      data: {
        ...body,
        password: hashedPassword,
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
      }
    });

  } catch (error) {

    return Response.json({
      success: false,
      message: error.message
    });

  }

}