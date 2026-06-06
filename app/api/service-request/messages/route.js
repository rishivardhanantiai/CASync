import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/service-request/messages?serviceRequestId=xxx
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceRequestId = searchParams.get("serviceRequestId");
    if (!serviceRequestId) {
      return NextResponse.json({ success: false, message: "serviceRequestId required" }, { status: 400 });
    }
    const messages = await prisma.requestMessage.findMany({
      where: { serviceRequestId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/service-request/messages
export async function POST(req) {
  try {
    const body = await req.json();
    const { serviceRequestId, senderEmail, senderName, senderRole, message, fileId, fileName } = body;

    if (!serviceRequestId || !senderEmail || !senderName || !senderRole) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Must have either a text message or a file attachment
    if (!message?.trim() && !fileId) {
      return NextResponse.json({ success: false, message: "Message or file required" }, { status: 400 });
    }

    const newMsg = await prisma.requestMessage.create({
      data: {
        serviceRequestId,
        senderEmail,
        senderName,
        senderRole,
        message: message?.trim() || "",
        fileId: fileId || null,
        fileName: fileName || null,
      },
    });
    return NextResponse.json({ success: true, message: newMsg });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
