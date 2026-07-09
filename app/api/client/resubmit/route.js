import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, clientNotes, newDocuments } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Request ID is required" }, { status: 400 });
    }

    // 1. Update the ServiceRequest
    const serviceRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: "submitted",
        clientNotes,
        updatedAt: new Date()
      }
    });

    // 2. Update the underlying registration documents if necessary
    if (newDocuments && newDocuments.length > 0 && serviceRequest.referenceId && serviceRequest.serviceType) {
      const refId = serviceRequest.referenceId;
      const type = serviceRequest.serviceType;

      let record = null;
      switch (type) {
        case "GST_REGISTRATION":
          record = await prisma.gSTRegistration.findUnique({ where: { id: refId } });
          if (record) {
            await prisma.gSTRegistration.update({
              where: { id: refId },
              data: { documents: { set: [...record.documents, ...newDocuments] } }
            });
          }
          break;
        case "GST_RETURN":
          record = await prisma.gSTReturn.findUnique({ where: { id: refId } });
          if (record) {
            await prisma.gSTReturn.update({
              where: { id: refId },
              data: { documents: { set: [...record.documents, ...newDocuments] } }
            });
          }
          break;
        case "PAN":
          record = await prisma.panDetails.findUnique({ where: { id: refId } });
          if (record) {
             // PanDetails currently doesn't have documents array in schema, but keep logic for future parity
          }
          break;
        case "ITR":
          record = await prisma.incomeTaxReturn.findUnique({ where: { id: refId } });
          if (record) {
            await prisma.incomeTaxReturn.update({
              where: { id: refId },
              data: { documents: { set: [...record.documents, ...newDocuments] } }
            });
          }
          break;
        default:
          console.log("No specific record update logic for type:", type);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Request resubmitted successfully",
      request: serviceRequest
    });

  } catch (error) {
    console.error("Resubmit API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
