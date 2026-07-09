import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ success: false, message: "Member ID required" }, { status: 400 });
    }

    // Keep your OR logic: this ensures the member sees everything they are working on OR reviewing
    const requests = await prisma.serviceRequest.findMany({
      where: {
        OR: [
          { assignedToId: memberId },
          { reviewerId: memberId },
        ],
      },
      orderBy: { createdAt: "desc" }
    });

    // Removed the limit (take: 10) so the dashboard can actually filter all requests
    const allRequestsSummary = await prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" }
    });

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId }
    });

    return NextResponse.json({
      success: true,
      myRequests: requests,
      allRequests: allRequestsSummary,
      member: member ? {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        services: member.services,
        allocatedClientIds: member.allocatedClientIds,
      } : null
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}