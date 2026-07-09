const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const docs = await prisma.document.findMany();
  console.log(docs.map(d => ({id: d.id, clientId: d.clientId, clientEmail: d.clientEmail, uploader: d.uploader})));
}
main().finally(() => prisma.$disconnect());
