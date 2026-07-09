import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { actorFromBody, logRequestActivity } from "@/lib/requestActivity";

// ✅ Stop Next.js from caching to ensure dashboard data is always fresh
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // 1. Fetch both service requests and team members in parallel
    const [requests, teamMembers] = await Promise.all([
      prisma.serviceRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              subtasks: true,
              missingDocuments: true,
              activities: true,
            },
          },
        },
      }),
      prisma.teamMember.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      }).catch(() => []) // Graceful fallback if the table is empty or schema varies
    ]);

    // 2. Calculate the exact workload metrics the TeamWorkloadTable needs
    const teamWorkload = teamMembers.map(member => {
      const memberReqs = requests.filter(r => r.assignedToId === member.id);
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        activeCount: memberReqs.filter(r => r.status !== "completed").length,
        completedCount: memberReqs.filter(r => r.status === "completed").length,
        totalAssigned: memberReqs.length
      };
    });

    // 3. Return everything back to the frontend dashboard
    return NextResponse.json({
      success: true,
      requests,      // Keeps your main dashboard cards & pie chart working
      teamWorkload   // Populates Khushi's workload table at the bottom
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "id required" }, { status: 400 });
    }

    const current = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ success: false, message: "Service request not found" }, { status: 404 });
    }

    // Only allow updating specific safe fields to prevent schema corruption
    const allowedFields = [
      "assignedToId",
      "assignedToName",
      "reviewerId",
      "reviewerName",
      "status",
      "priority",
      "dueDate",
      "adminNotes",
      "clientNotes",
    ];
    
    const data = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        data[field] = body[field];
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "dueDate")) {
      data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data
    });

    // ── Audit Logging ──
    const actor = actorFromBody(body);
    const normalizeAuditValue = (value) => value instanceof Date ? value.toISOString() : value;
    
    const changes = Object.entries(data)
      .filter(([key, value]) => normalizeAuditValue(current[key]) !== normalizeAuditValue(value))
      .map(([key, value]) => ({
        field: key,
        from: normalizeAuditValue(current[key]),
        to: normalizeAuditValue(value),
      }));

    if (changes.length > 0) {
      const statusChange = changes.find(change => change.field === "status");
      const assignmentChange = changes.find(change => change.field === "assignedToId" || change.field === "assignedToName");
      const reviewerChange = changes.find(change => change.field === "reviewerId" || change.field === "reviewerName");

      let action = "request_updated";
      let description = `Request updated (${changes.map(change => change.field).join(", ")})`;

      if (statusChange) {
        action = "status_changed";
        description = `Status changed from ${current.status} to ${updated.status}`;
      } else if (assignmentChange) {
        action = "assignment_changed";
        description = `Assigned to ${updated.assignedToName || "Unassigned"}`;
      } else if (reviewerChange) {
        action = "reviewer_changed";
        description = `Reviewer set to ${updated.reviewerName || "Unassigned"}`;
      }

      await logRequestActivity(prisma, {
        serviceRequestId: id,
        action,
        description,
        actor,
        metadata: { changes },
      });
    }

    return NextResponse.json({
      success: true,
      request: updated
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}