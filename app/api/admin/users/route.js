import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      users: users
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      message: error.message
    });

  }
}