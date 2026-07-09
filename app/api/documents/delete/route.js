import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, message: "Document ID required" }, { status: 400 });
    }

    // 1. Clean up associated chat messages (RequestMessage table) referencing this document
    const messages = await prisma.requestMessage.findMany({
      where: { fileId: id }
    });

    for (const msg of messages) {
      if (!msg.message || msg.message.trim() === "") {
        // If the chat message is solely an attachment message, delete it entirely
        await prisma.requestMessage.delete({
          where: { id: msg.id }
        });
      } else {
        // If the chat message contains text content, keep it but nullify the attachment references
        await prisma.requestMessage.update({
          where: { id: msg.id },
          data: {
            fileId: null,
            fileName: null
          }
        });
      }
    }

    // 2. Delete the actual Document record (ignoring already-deleted P2025 errors)
    try {
      await prisma.document.delete({
        where: { id }
      });
    } catch (err) {
      // P2025: Record to delete does not exist. Gracefully ignore as the goal is achieved.
      if (err.code !== "P2025") {
        throw err;
      }
    }

    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Document Deletion Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete document" }, { status: 500 });
  }
}