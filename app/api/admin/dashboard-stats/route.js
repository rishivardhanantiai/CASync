import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();
    const totalRequests = await prisma.serviceRequest.count();
    const pendingRequests = await prisma.serviceRequest.count({
      where: { status: { not: "completed" } }
    });
    const completedRequests = await prisma.serviceRequest.count({
      where: { status: "completed" }
    });

    // For revenue, we sum the amount of invoices
    const revenueData = await prisma.invoice.aggregate({
      where: { status: "paid" },
      _sum: { amount: true }
    });

    // ── Team Workload Aggregation ─────────────────────────────────────────────
    // Fetch all requests with assignment info in one query
    const allRequests = await prisma.serviceRequest.findMany({
      select: {
        assignedToId:   true,
        assignedToName: true,
        status:         true,
        dueDate:        true,
      }
    });

    // Also fetch all team members so unassigned ones still appear
    const teamMembers = await prisma.teamMember.findMany({
      select: { id: true, name: true, email: true }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build a map keyed by assignedToId
    const workloadMap = {};

    // Pre-seed every team member with zero counts
    for (const m of teamMembers) {
      workloadMap[m.id] = {
        memberId:   m.id,
        memberName: m.name,
        email:      m.email,
        active:     0,
        completed:  0,
        overdue:    0,
        total:      0,
      };
    }

    // Aggregate request counts per team member
    for (const r of allRequests) {
      if (!r.assignedToId) continue; // skip unassigned

      if (!workloadMap[r.assignedToId]) {
        // Team member not in DB yet (edge case) — still track them
        workloadMap[r.assignedToId] = {
          memberId:   r.assignedToId,
          memberName: r.assignedToName || "Unknown",
          email:      "",
          active:     0,
          completed:  0,
          overdue:    0,
          total:      0,
        };
      }

      const entry = workloadMap[r.assignedToId];
      entry.total += 1;

      if (r.status === "completed") {
        entry.completed += 1;
      } else {
        entry.active += 1;
        // Overdue: non-completed AND dueDate is before today
        if (r.dueDate && new Date(r.dueDate) < today) {
          entry.overdue += 1;
        }
      }
    }

    const teamWorkload = Object.values(workloadMap);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalRequests,
        pendingRequests,
        completedRequests,
        totalRevenue: revenueData._sum.amount || 0
      },
      teamWorkload,
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
