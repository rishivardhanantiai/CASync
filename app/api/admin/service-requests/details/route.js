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
      case "APPLY_NEW_GST":
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
      case "ADD_COMPANY":
      case "NEW_COMPANY_REGISTRATION":
        data = await prisma.companyRegistration.findUnique({ where: { id } });
        break;
      case "COMPLIANCE":
        data = await prisma.compliance.findUnique({ where: { id } });
        break;
      case "NEW_FIRM_REGISTRATION":
        data = await prisma.firmRegistration.findUnique({ where: { id } });
        break;
      case "NEW_UDHYAM_REGISTRATION":
      case "UDHYAM_UPDATES":
        data = await prisma.udhyamRegistration.findUnique({ where: { id } });
        break;
      case "OTHER_REQUIREMENTS":
        data = await prisma.otherRequirement.findUnique({ where: { id } });
        break;
      case "GST_QUERY":
        data = await prisma.gstQuery.findUnique({ where: { id } });
        break;
      case "COMPANY_QUERY":
        data = await prisma.companyQuery.findUnique({ where: { id } });
        break;
      case "FIRM_QUERY":
        data = await prisma.firmQuery.findUnique({ where: { id } });
        break;
      case "UDHYAM_QUERY":
        data = await prisma.udhyamQuery.findUnique({ where: { id } });
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
