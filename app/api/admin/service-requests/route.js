import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const requests = await prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      success: true,
      requests
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data
    });

    return NextResponse.json({
      success: true,
      request: updated
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
