import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/team/my-clients?memberId=xxx
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ success: false, message: "memberId required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: { allocatedClientIds: true, name: true },
    });

    if (!member) {
      return NextResponse.json({ success: false, message: "Team member not found" }, { status: 404 });
    }

    if (!member.allocatedClientIds || member.allocatedClientIds.length === 0) {
      return NextResponse.json({ success: true, clients: [] });
    }

    // Fetch all allocated users
    const clients = await prisma.user.findMany({
      where: { id: { in: member.allocatedClientIds } },
      select: { id: true, name: true, email: true, mobile: true, createdAt: true },
    });

    return NextResponse.json({ success: true, clients });
  } catch (err) {
    console.error("My-clients error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch clients" }, { status: 500 });
  }
}
