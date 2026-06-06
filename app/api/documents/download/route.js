import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id }
    });

    if (!doc) {
      return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: doc.fileName,
        fileData: doc.fileData, // Base64
        mimeType: doc.mimeType
      }
    });

  } catch (error) {
    console.error("Download API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
