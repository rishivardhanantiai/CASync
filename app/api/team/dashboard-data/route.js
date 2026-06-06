import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ success: false, message: "Member ID required" }, { status: 400 });
    }

    const requests = await prisma.serviceRequest.findMany({
      where: { assignedToId: memberId },
      orderBy: { createdAt: "desc" }
    });

    const allRequestsSummary = await prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 10 // For "All Requests" preview
    });

    return NextResponse.json({
      success: true,
      myRequests: requests,
      allRequests: allRequestsSummary
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
