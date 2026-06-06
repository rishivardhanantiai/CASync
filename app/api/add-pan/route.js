import prisma from "@/lib/prisma";
import { getAutoAssignment } from "@/lib/assignment";

export async function POST(req) {
  try {
    const body = await req.json();
    const assignment = await getAutoAssignment(body.userEmail || body.email);

    console.log("PAN Data Received:", body);

    // Check if PAN already exists
    const existing = await prisma.panDetails.findUnique({
      where: { pan: body.pan }
    });

    if (existing) {
      return Response.json({
        success: false,
        message: "PAN already exists"
      }, { status: 400 });
    }

    const pan = await prisma.panDetails.create({
      data: body
    });

    // Create a unified service request for the dashboard
    await prisma.serviceRequest.create({
      data: {
        userEmail: body.userEmail || body.email || "",
        clientName: body.name || "",
        serviceType: "PAN",
        status: "submitted",
        priority: "medium",
        referenceId: pan.id,
        ...assignment
      }
    });

    return Response.json({
      success: true,
      message: "PAN details saved successfully!",
      data: pan
    });

  } catch (error) {
    console.error("PAN Error:", error);
    return Response.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pan = searchParams.get("pan");

    if (pan) {
      const record = await prisma.panDetails.findUnique({
        where: { pan: pan.toUpperCase() }
      });
      return Response.json({
        success: !!record,
        data: record || null
      });
    }

    const allPans = await prisma.panDetails.findMany();
    return Response.json({
      success: true,
      data: allPans
    });

  } catch (error) {
    return Response.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}