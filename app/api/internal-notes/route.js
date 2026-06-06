import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/internal-notes?serviceRequestId=xxx
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceRequestId = searchParams.get("serviceRequestId");

    if (!serviceRequestId) {
      return NextResponse.json(
        { success: false, message: "serviceRequestId is required" },
        { status: 400 }
      );
    }

    const notes = await prisma.internalNote.findMany({
      where: { serviceRequestId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error("[internal-notes] GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/internal-notes
// Body: { serviceRequestId, authorId, authorName, content }
export async function POST(req) {
  try {
    const body = await req.json();
    const { serviceRequestId, authorId, authorName, content } = body;

    if (!serviceRequestId || !authorId || !authorName || !content?.trim()) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const note = await prisma.internalNote.create({
      data: {
        serviceRequestId,
        authorId,
        authorName,
        content: content.trim(),
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("[internal-notes] POST error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
