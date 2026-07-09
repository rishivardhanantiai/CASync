import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const userId = body.userId;

    if (!userId) {
      return Response.json({ success: false, message: "userId required" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return Response.json({ success: true, message: "User removed" });
  } catch (error) {
    return Response.json({ success: false, message: error.message });
  }
}
