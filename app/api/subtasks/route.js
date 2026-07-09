import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { actorFromBody, logRequestActivity } from "@/lib/requestActivity";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceRequestId = searchParams.get("serviceRequestId");

    if (!serviceRequestId) {
      return NextResponse.json({ success: false, message: "serviceRequestId required" }, { status: 400 });
    }

    const subtasks = await prisma.subTask.findMany({
      where: { serviceRequestId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, subtasks });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { serviceRequestId, title, description } = body;

    if (!serviceRequestId || !title?.trim()) {
      return NextResponse.json({ success: false, message: "serviceRequestId and title are required" }, { status: 400 });
    }

    const actor = actorFromBody(body);
    const subtask = await prisma.subTask.create({
      data: {
        serviceRequestId,
        title: title.trim(),
        description: description?.trim() || null,
        createdById: actor.actorId,
        createdByName: actor.actorName,
      },
    });

    await logRequestActivity(prisma, {
      serviceRequestId,
      action: "subtask_created",
      description: `Task added: ${subtask.title}`,
      actor,
      metadata: { subtaskId: subtask.id },
    });

    return NextResponse.json({ success: true, subtask });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, isCompleted, title, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "id required" }, { status: 400 });
    }

    const current = await prisma.subTask.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ success: false, message: "Subtask not found" }, { status: 404 });
    }

    const actor = actorFromBody(body);
    const data = {};

    if (typeof isCompleted === "boolean") {
      data.isCompleted = isCompleted;
      data.completedAt = isCompleted ? new Date() : null;
      data.completedById = isCompleted ? actor.actorId : null;
      data.completedByName = isCompleted ? actor.actorName : null;
    }
    if (typeof title === "string") data.title = title.trim();
    if (typeof description === "string") data.description = description.trim() || null;

    const subtask = await prisma.subTask.update({ where: { id }, data });

    await logRequestActivity(prisma, {
      serviceRequestId: subtask.serviceRequestId,
      action: typeof isCompleted === "boolean" ? "subtask_toggled" : "subtask_updated",
      description: typeof isCompleted === "boolean"
        ? `Task ${isCompleted ? "completed" : "reopened"}: ${subtask.title}`
        : `Task updated: ${subtask.title}`,
      actor,
      metadata: { subtaskId: subtask.id, isCompleted: subtask.isCompleted },
    });

    return NextResponse.json({ success: true, subtask });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
