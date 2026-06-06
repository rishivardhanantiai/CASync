import prisma from "@/lib/prisma";

export async function GET(req, { params }) {

  try {

    const user = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!user) {
      return Response.json({
        success: false,
        message: "User not found",
      });
    }

    return Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      message: error.message
    });

  }

}