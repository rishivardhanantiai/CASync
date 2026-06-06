import prisma from "@/lib/prisma";

export async function GET(req) {

  try {

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      success: true,
      admins: admins
    });

  } catch (error) {

    return Response.json({
      success: false,
      message: error.message
    });

  }

}