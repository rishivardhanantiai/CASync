import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/documents/list?clientEmail=xxx  (client: their docs)
// GET /api/documents/list                  (admin/team: all docs)
// GET /api/documents/list?clientEmail=xxx&download=docId  (returns base64 for download)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clientEmail = searchParams.get("clientEmail");
    const downloadId  = searchParams.get("download");

    // Single doc download
    if (downloadId) {
      const doc = await prisma.document.findUnique({ where: { id: downloadId } });
      if (!doc) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
      return NextResponse.json({ success: true, document: doc });
    }

    const where = clientEmail ? { clientEmail } : {};
    const docs = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploader: true,
        uploaderName: true,
        clientId: true,
        clientEmail: true,
        title: true,
        note: true,
        createdAt: true,
        // fileData excluded for list — fetched only on download
      },
    });

    return NextResponse.json({ success: true, documents: docs });
  } catch (err) {
    console.error("List docs error:", err);
    return NextResponse.json({ success: false, message: "Failed to list documents" }, { status: 500 });
  }
}
