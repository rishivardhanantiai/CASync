import prisma from "@/lib/prisma";

export async function POST(req) {
  try {

    const message = await prisma.chatMessage.create({
      data: {
        userId: body.user_id,
        adminId: body.admin_id,
        message: "Task has been completed by admin.",
        isFromAdmin: true,
        isCompleted: true,
      },
    });

    return Response.json({
      success: true,
      message: "Task marked as completed",
      data: message
    });

  } catch (error) {

    return Response.json({
      success: false,
      message: error.message
    });

  }
}