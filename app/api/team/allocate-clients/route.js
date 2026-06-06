import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/team/allocate-clients
// Body: { memberId, clientIds: ["id1","id2",...] }
export async function POST(req) {
  try {
    const { memberId, clientIds } = await req.json();

    if (!memberId || !Array.isArray(clientIds)) {
      return NextResponse.json(
        { success: false, message: "memberId and clientIds (array) required" },
        { status: 400 }
      );
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { allocatedClientIds: clientIds },
    });

    return NextResponse.json({
      success: true,
      message: "Clients allocated successfully",
      allocatedCount: clientIds.length,
      member: { id: updated.id, name: updated.name, allocatedClientIds: updated.allocatedClientIds },
    });
  } catch (err) {
    console.error("Allocate clients error:", err);
    return NextResponse.json({ success: false, message: "Failed to allocate clients" }, { status: 500 });
  }
}
