import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { memberId } = body;

    if (!memberId) {
      return Response.json(
        { success: false, message: "memberId is required." },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({ where: { id: memberId } });

    return Response.json({ success: true, message: "Team member removed." });
  } catch (error) {
    console.error("Remove Member Error:", error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
