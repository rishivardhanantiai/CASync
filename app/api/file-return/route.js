import prisma from "@/lib/prisma";
import { getAutoAssignment } from "@/lib/assignment";

export async function POST(req) {
  try {
    const body = await req.json();
    const assignment = await getAutoAssignment(body.userEmail);

    console.log("File Return Data:", body);

    const tax = await prisma.incomeTaxReturn.create({
      data: body
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

    const updated = await prisma.incomeTaxReturn.update({
      where: { id },
      data
    });

    return NextResponse.json({
      success: true,
      message: "ITR Filing updated successfully",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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