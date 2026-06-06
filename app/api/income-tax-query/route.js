import prisma from "@/lib/prisma";
import { getAutoAssignment } from "@/lib/assignment";

export async function POST(req) {
  try {
    const body = await req.json();
    const assignment = await getAutoAssignment(body.email);

    console.log("Query Received:", body);

    const query = await prisma.incomeTaxQuery.create({
      data: body
    });

    // Create a unified service request for the dashboard
    await prisma.serviceRequest.create({
      data: {
        userEmail: body.email || "",
        clientName: body.name || "",
        serviceType: "IT_QUERY",
        status: "submitted",
        priority: "medium",
        referenceId: query.id,
        ...assignment
      }
    });

    return Response.json({
      success: true,
      message: "Query submitted successfully! We will get back to you soon.",
      data: query
    });

  } catch (error) {
    console.error("Query Error:", error);
    return Response.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const queries = await prisma.incomeTaxQuery.findMany({
      orderBy: {
        timestamp: 'desc'
      }
    });
    return Response.json({ success: true, data: queries });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}