import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, message: "Email required" }, { status: 400 });
    }

    const requests = await prisma.serviceRequest.findMany({
      where: { userEmail: email },
      orderBy: { createdAt: "desc" }
    });

    const invoices = await prisma.invoice.findMany({
      where: { clientEmail: email },
      orderBy: { createdAt: "desc" }
    });

    const notifications = await prisma.notification.findMany({
      where: { email: email },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { clientId: email },
          { clientEmail: email }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      success: true,
      requests,
      invoices,
      notifications,
      documents
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
