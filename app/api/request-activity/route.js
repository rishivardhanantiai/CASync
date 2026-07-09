import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Ensure this route is always fresh for the dashboard activity feed
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceRequestId = searchParams.get("serviceRequestId");
    const memberId = searchParams.get("memberId");
    const limit = Math.min(Number(searchParams.get("limit") || 100), 250);

    // Build filter object based on presence of params
    const where = {};
    if (serviceRequestId) where.serviceRequestId = serviceRequestId;
    if (memberId) where.serviceRequest = { assignedToId: memberId };

    const activities = await prisma.requestActivity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        serviceRequest: {
          select: {
            id: true,
            clientName: true,
            userEmail: true,
            serviceType: true,
            assignedToId: true,
            assignedToName: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      activities 
    });
    
  } catch (error) {
    console.error("Activity log error:", error);
    return NextResponse.json(
      { success: false, message: error.message }, 
      { status: 500 }
    );
  }
}