import prisma from "@/lib/prisma";

export async function POST(req) {

  try {

    const chat = await prisma.chatMessage.create({
      data: {
        userId: body.user_id,
        adminId: body.admin_id,
        message: body.message,
        attachmentPath: body.attachment_path,
        isFromAdmin: body.is_from_admin,
        isCompleted: body.is_completed,
      },
    });

    return Response.json({
      success: true,
      message: "Message sent",
      chat
    });

  } catch (error) {

    return Response.json({
      success: false,
      message: error.message
    });

  }

}