import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { actorFromBody, logRequestActivity } from "@/lib/requestActivity";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceRequestId = searchParams.get("serviceRequestId");

    if (!serviceRequestId) {
      return NextResponse.json({ success: false, message: "serviceRequestId required" }, { status: 400 });
    }

    const missingDocuments = await prisma.missingDocument.findMany({
      where: { serviceRequestId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, missingDocuments });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { serviceRequestId, documentName, note } = body;

    if (!serviceRequestId || !documentName?.trim()) {
      return NextResponse.json({ success: false, message: "serviceRequestId and documentName are required" }, { status: 400 });
    }

    const actor = actorFromBody(body);
    const missingDocument = await prisma.missingDocument.create({
      data: {
        serviceRequestId,
        documentName: documentName.trim(),
        note: note?.trim() || null,
        requestedById: actor.actorId,
        requestedByName: actor.actorName,
      },
    });

    await logRequestActivity(prisma, {
      serviceRequestId,
      action: "missing_document_requested",
      description: `Missing document requested: ${missingDocument.documentName}`,
      actor,
      metadata: { missingDocumentId: missingDocument.id },
    });

    return NextResponse.json({ success: true, missingDocument });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, status, documentName, note, receivedDocumentId } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "id required" }, { status: 400 });
    }

    const current = await prisma.missingDocument.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ success: false, message: "Missing document item not found" }, { status: 404 });
    }

    const actor = actorFromBody(body);
    const data = {};
    if (typeof documentName === "string") data.documentName = documentName.trim();
    if (typeof note === "string") data.note = note.trim() || null;
    if (typeof status === "string") {
      data.status = status;
      data.receivedAt = status === "received" ? new Date() : null;
    }
    if (typeof receivedDocumentId === "string") data.receivedDocumentId = receivedDocumentId || null;

    const missingDocument = await prisma.missingDocument.update({ where: { id }, data });

    await logRequestActivity(prisma, {
      serviceRequestId: missingDocument.serviceRequestId,
      action: "missing_document_updated",
      description: `Missing document ${missingDocument.status}: ${missingDocument.documentName}`,
      actor,
      metadata: {
        missingDocumentId: missingDocument.id,
        status: missingDocument.status,
        receivedDocumentId: missingDocument.receivedDocumentId,
      },
    });

    return NextResponse.json({ success: true, missingDocument });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
