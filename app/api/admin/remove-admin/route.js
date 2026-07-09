import prisma from "@/lib/prisma";

export async function POST(req) {

  try {

    const body = await req.json();

    await prisma.admin.delete({
      where: { id: body.adminId }
    });

    return Response.json({
      success: true,
      message: "Admin removed"
    });

  } catch (error) {

    return Response.json({
      success: false,
      message: error.message
    });

  }

}