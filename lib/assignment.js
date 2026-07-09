import prisma from "./prisma";

/**
 * Automatically determines if a new service request should be assigned to 
 * a specific team member based on existing client allocations.
 * 
 * @param {string} userEmail - The email of the client submitting the request.
 * @returns {Promise<{assignedToId: string|null, assignedToName: string|null}>}
 */
export async function getAutoAssignment(userEmail) {
  if (!userEmail) return { assignedToId: null, assignedToName: null };

  try {
    // 1. Find the user ID by their email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) return { assignedToId: null, assignedToName: null };

    // 2. Find a team member who has this client allocated to them
    // Note: allocatedClientIds is a String[] in the Prisma schema
    const member = await prisma.teamMember.findFirst({
      where: {
        allocatedClientIds: {
          has: user.id
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    if (member) {
      return {
        assignedToId: member.id,
        assignedToName: member.name
      };
    }

    return { assignedToId: null, assignedToName: null };
  } catch (error) {
    console.error("Auto-assignment helper error:", error);
    return { assignedToId: null, assignedToName: null };
  }
}
