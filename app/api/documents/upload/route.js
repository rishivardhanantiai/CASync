import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      fileName,
      fileData,  // base64
      fileSize,
      mimeType,
      uploader,       // "admin" | "team"
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
        clientId: clientId || "",
        clientEmail,
        title: title || null,
        note: note || null,
      },
    });

    if (uploader === "client") {
      await prisma.notification.create({
        data: {
          email: clientEmail,
          title: "Document Uploaded",
          message: `Your document "${fileName}" has been uploaded successfully.`,
          type: "success",
        }
      });
    }

    return NextResponse.json({ success: true, document: { id: doc.id, fileName: doc.fileName, createdAt: doc.createdAt } });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
