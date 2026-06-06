/**
 * seed_due_dates.js
 * Run: node seed_due_dates.js
 * Sets test due dates on existing service requests so SLA badges are visible.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.serviceRequest.findMany({
    where: { status: { not: "completed" } },
    orderBy: { createdAt: "desc" },
  });

  if (requests.length === 0) {
    console.log("No active (non-completed) requests found.");
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Assign varied due dates to show all three badge types
  const dueDates = [
    new Date(today.getTime() - 3 * 86400000), // 3 days ago  → OVERDUE 🔴
    new Date(today.getTime()),                  // today       → DUE TODAY 🟡
    new Date(today.getTime() + 5 * 86400000),  // 5 days ahead → ON TRACK 🟢
    new Date(today.getTime() + 10 * 86400000), // 10 days ahead → ON TRACK 🟢
    new Date(today.getTime() - 1 * 86400000),  // yesterday   → OVERDUE 🔴
    new Date(today.getTime() + 3 * 86400000),  // 3 days ahead → ON TRACK 🟢
  ];

  let updated = 0;
  for (let i = 0; i < requests.length; i++) {
    const dueDate = dueDates[i % dueDates.length];
    await prisma.serviceRequest.update({
      where: { id: requests[i].id },
      data: { dueDate },
    });
    const label = dueDate < today ? "OVERDUE" : dueDate.getTime() === today.getTime() ? "DUE TODAY" : "ON TRACK";
    console.log(`✓ ${requests[i].id.slice(0, 20)}... → ${dueDate.toLocaleDateString("en-IN")} [${label}]`);
    updated++;
  }

  console.log(`\nDone! Updated ${updated} requests with test due dates.`);
  console.log("Refresh the Admin Dashboard → Service Requests to see SLA badges.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
