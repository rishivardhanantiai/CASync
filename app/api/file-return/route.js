import prisma from "@/lib/prisma";
import { getAutoAssignment } from "@/lib/assignment";

export async function POST(req) {
  try {
    const body = await req.json();
    const assignment = await getAutoAssignment(body.userEmail);

    console.log("File Return Data:", body);

    const data = {
      userEmail: body.userEmail || "",
      pan: body.pan || "",
      name: body.name || "",
      fatherName: body.fatherName || "",
      dob: body.dob || "",
      mobileNo: body.mobileNo || "",
      email: body.email || "",
      incomeType: body.incomeType || "",
      address: body.address || "",
      bankAccount: body.bankAccount || "",
      ifscCode: body.ifscCode || "",
      financialYear: body.financialYear || "",
      assessmentYear: body.assessmentYear || "",
      landSale: Number(body.landSale || 0),
      housingRent: Number(body.housingRent || 0),
      salary: Number(body.salary || 0),
      business: Number(body.business || 0),
      agriculture: Number(body.agriculture || 0),
      other: Number(body.other || 0),
      otherIncome: body.otherIncome || "",
      aadharNo: body.aadharNo || ""
    };

    const tax = await prisma.incomeTaxReturn.create({
      data
    });

    // Create a unified service request for the dashboard
    await prisma.serviceRequest.create({
      data: {
        userEmail: body.userEmail || "",
        clientName: body.name || "",
        serviceType: "ITR",
        status: "submitted",
        priority: "medium",
        referenceId: tax.id,
        panNumber: body.pan || "",
        aadharNumber: body.aadharNo || "",
        financialYear: body.financialYear || "",
        ...assignment
      }
    });

    return Response.json({
      success: true,
      message: "Tax return filed successfully!",
      data: tax
    });

  } catch (error) {
    console.error("File Return Error:", error);
    return Response.json({
      success: false,
      message: error.message
    });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    // Verify request can still be modified
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: { referenceId: id, serviceType: "ITR" }
    });

    if (serviceRequest && serviceRequest.status !== "submitted" && serviceRequest.status !== "pending_docs") {
      return Response.json({
        success: false,
        message: "This request has already been processed by the admin/team and cannot be modified."
      }, { status: 403 });
    }

    // Filter out obsolete fields if any exist
    const { electricityBill, bankStatement, ...cleanData } = data;

    const updated = await prisma.incomeTaxReturn.update({
      where: { id },
      data: cleanData
    });

    // Update corresponding ServiceRequest fields for sync
    await prisma.serviceRequest.updateMany({
      where: { referenceId: id, serviceType: "ITR" },
      data: {
        panNumber: updated.pan || "",
        aadharNumber: updated.aadharNo || "",
        financialYear: updated.financialYear || ""
      }
    });

    return Response.json({
      success: true,
      message: "ITR Filing updated successfully",
      data: updated,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const returns = await prisma.incomeTaxReturn.findMany();

    return Response.json({
      success: true,
      data: returns
    });

  } catch (error) {
    return Response.json({
      success: false,
      message: error.message
    });
  }
}