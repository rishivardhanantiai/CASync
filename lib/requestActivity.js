export function actorFromBody(body = {}) {
  return {
    actorId: body.actorId || body.updatedById || body.senderId || null,
    actorEmail: body.actorEmail || body.updatedByEmail || body.senderEmail || null,
    actorName: body.actorName || body.updatedByName || body.senderName || null,
    actorRole: body.actorRole || body.updatedByRole || body.senderRole || null,
  };
}

export async function logRequestActivity(prisma, {
  serviceRequestId,
  action,
  description,
  actor = {},
  metadata = null,
}) {
  if (!serviceRequestId || !action || !description) return null;

  return prisma.requestActivity.create({
    data: {
      serviceRequestId,
      action,
      description,
      actorId: actor.actorId || null,
      actorEmail: actor.actorEmail || null,
      actorName: actor.actorName || null,
      actorRole: actor.actorRole || null,
      metadata,
    },
  });
}
