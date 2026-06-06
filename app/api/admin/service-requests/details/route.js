import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json({ success: false, message: "ID and Type are required" }, { status: 400 });
    }

    let data = null;

    switch (type) {
      case "GST_REGISTRATION":
        data = await prisma.gSTRegistration.findUnique({ where: { id } });
        break;
      case "GST_RETURN":
        data = await prisma.gSTReturn.findUnique({ where: { id } });
        break;
      case "PAN":
        data = await prisma.panDetails.findUnique({ where: { id } });
        break;
      case "ITR":
        data = await prisma.incomeTaxReturn.findUnique({ where: { id } });
        break;
      case "IT_QUERY":
        data = await prisma.incomeTaxQuery.findUnique({ where: { id } });
        break;
      case "COMPANY_REG":
      case "FIRM_REG":
      case "UDHYAM_REG":
        // Add more as needed
        data = { message: "Details for this type yet to be mapped" };
        break;
      default:
        return NextResponse.json({ success: false, message: "Unknown service type" }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Details API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
