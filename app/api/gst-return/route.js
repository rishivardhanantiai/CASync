import prisma from "@/lib/prisma";
import { getAutoAssignment } from "@/lib/assignment";

export async function POST(req) {
  try {
    const body = await req.json();
    const assignment = await getAutoAssignment(body.userEmail);

    const data = {
      userEmail: body.userEmail || "",
      gstNumber: body.gstNumber || null,
      businessName: body.businessName || null,
      state: body.state || null,
      mainPerson: body.mainPerson || null,
      panNo: body.panNo || null,
      financialYear: body.financialYear || null,
      month: body.month || null,
      documents: body.documents || []
    };

    const gstReturn = await prisma.gSTReturn.create({
      data
    });

    // Create a unified service request for the dashboard
    await prisma.serviceRequest.create({
      data: {
        userEmail: body.userEmail || "",
        clientName: body.businessName || "",
        serviceType: "GST_RETURN",
        status: "submitted",
        priority: "medium",
        referenceId: gstReturn.id,
        gstNumber: body.gstNumber || "",
        panNumber: body.panNo || "",
        financialYear: body.financialYear || "",
        financialMonth: body.month || "",
        ...assignment
      }
    });

    return Response.json({
      success: true,
      message: "GST Return submitted successfully",
      data: gstReturn
    });

  } catch (error) {
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

    const updated = await prisma.gSTReturn.update({
      where: { id },
      data
    });

    return NextResponse.json({
      success: true,
      message: "GST Return updated successfully",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const returns = await prisma.gSTReturn.findMany();

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