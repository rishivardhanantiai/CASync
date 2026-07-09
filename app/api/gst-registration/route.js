import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAutoAssignment } from "@/lib/assignment";

export async function POST(req) {
  try {
    const body = await req.json();
    const assignment = await getAutoAssignment(body.userEmail);

    console.log("Received Data:", body); // 🔥 DEBUG

    const data = {
      userEmail: body.userEmail || "",
      gstNumber: body.gstNumber || null,
      firmName: body.firmName || null,
      businessType: body.businessType || null,
      mainPerson: body.mainPerson || null,
      address: body.address || null,
      panNo: body.panNo || null,
      udyamNo: body.udyamNo || null,
      bankAccNo: body.bankAccNo || null,
      ifscCode: body.ifscCode || null,
      documents: body.documents || []
    };

    const gst = await prisma.gSTRegistration.create({
      data
    });

    // Create a unified service request for the dashboard
    await prisma.serviceRequest.create({
      data: {
        userEmail: body.userEmail || "",
        clientName: body.firmName || "",
        serviceType: "GST_REGISTRATION",
        status: "submitted",
        priority: "medium",
        referenceId: gst.id,
        gstNumber: body.gstNumber || "",
        panNumber: body.panNo || "",
        udyamNumber: body.udyamNo || "",
        ...assignment
      }
    });

    return NextResponse.json({
      success: true,
      message: "GST Registration saved successfully",
      data: gst,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    const updated = await prisma.gSTRegistration.update({
      where: { id },
      data
    });

    return NextResponse.json({
      success: true,
      message: "GST Registration updated successfully",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const gstList = await prisma.gSTRegistration.findMany();

    return NextResponse.json({
      success: true,
      data: gstList,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}