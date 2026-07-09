import prisma from "@/lib/prisma";

export async function GET(req) {

  try {

    // Automatically migrate existing admins to Super Admin if none exist yet
    const superAdminExists = await prisma.admin.findFirst({
      where: { role: "Super Admin" }
    });

    if (!superAdminExists) {
      await prisma.admin.updateMany({
        data: { role: "Super Admin" }
      });
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
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