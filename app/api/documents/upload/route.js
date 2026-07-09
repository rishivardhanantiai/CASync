import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logRequestActivity } from "@/lib/requestActivity";

// Ensures this route is always fresh and never cached
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      fileName,
      fileData,  // base64
      fileSize,
      mimeType,
      uploader, // "admin" | "team" | "client"
      uploaderId,
      uploaderName,
      clientId,
      clientEmail,
      title,
      note,
    } = body;

    if (!fileName || !fileData || !clientEmail || !uploader || !uploaderId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const doc = await prisma.document.create({
      data: {
        fileName,
        fileData,
        fileSize: fileSize || null,
        mimeType: mimeType || "application/octet-stream",
        uploader,
        uploaderId,
        uploaderName: uploaderName || null,
        clientId: clientId || clientEmail || "",
        clientEmail,
        title: title || null,
        note: note || null,
      },
    });

    let linkedRequestId = null;

    // --------------------------------------------------
    // CLIENT UPLOAD FLOW (Auto-match missing docs)
    // --------------------------------------------------
    if (uploader === "client") {
      const normalize = (value) =>
        String(value || "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

      const uploadedLabel = normalize(`${title || ""} ${fileName || ""}`);

      const openMissingDocs = await prisma.missingDocument.findMany({
        where: {
          status: "requested",
          serviceRequest: { userEmail: clientEmail },
        },
        include: {
          serviceRequest: { select: { id: true } },
        },
      });

      const matched = openMissingDocs.find((item) => {
        const expected = normalize(item.documentName);
        return expected && uploadedLabel && (uploadedLabel.includes(expected) || expected.includes(uploadedLabel));
      });

      if (matched) {
        linkedRequestId = matched.serviceRequestId;

        await prisma.missingDocument.update({
          where: { id: matched.id },
          data: {
            status: "received",
            receivedDocumentId: doc.id,
            receivedAt: new Date(),
          },
        });

        await logRequestActivity(prisma, {
          serviceRequestId: matched.serviceRequestId,
          action: "missing_document_received",
          description: `Missing document received: ${matched.documentName}`,
          actor: {
            actorId: uploaderId,
            actorEmail: clientEmail,
            actorName: uploaderName || clientEmail,
            actorRole: "client",
          },
          metadata: {
            missingDocumentId: matched.id,
            documentId: doc.id,
            fileName: doc.fileName,
          },
        });
      }
    }

    // --------------------------------------------------
    // ADMIN / TEAM NOTIFICATION TO CLIENT
    // --------------------------------------------------
    if (uploader !== "client") {
      await prisma.notification.create({
        data: {
          email: clientEmail,
          title: "New Document Uploaded",
          message: `${uploaderName || uploader} uploaded "${fileName}"`,
          type: "info",
        },
      });
    }

    // --------------------------------------------------
    // GENERAL DOCUMENT ACTIVITY LOG
    // --------------------------------------------------
    if (!linkedRequestId) {
      const latestRequest = await prisma.serviceRequest.findFirst({
        where: { userEmail: clientEmail },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      linkedRequestId = latestRequest?.id || null;
    }

    if (linkedRequestId) {
      await logRequestActivity(prisma, {
        serviceRequestId: linkedRequestId,
        action: "document_uploaded",
        description: `Document uploaded: ${fileName}`,
        actor: {
          actorId: uploaderId,
          actorEmail: uploader === "client" ? clientEmail : null,
          actorName: uploaderName || uploader,
          actorRole: uploader,
        },
        metadata: { documentId: doc.id, fileName: doc.fileName },
      });
    }

    return NextResponse.json({
      success: true,
      document: { id: doc.id, fileName: doc.fileName, createdAt: doc.createdAt },
    });
    
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}