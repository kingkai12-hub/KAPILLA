/**
 * One-off backfill: turn existing shipments into real Customer records.
 *
 * Groups shipments by sender phone number, creates a Customer for each
 * distinct phone that does not already have one, then links the shipments.
 * Shipments with no usable phone stay unlinked and are counted as "needs
 * review" so nothing is guessed silently.
 *
 * Safe to re-run: it only touches shipments that are still unlinked.
 *
 * Usage (from the project root, with DIRECT_URL available):
 *   node scripts/backfill-customers.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

function normalisePhone(value) {
  return (value || '').replace(/[^\d+]/g, '').trim();
}

async function nextAvailableCode(startFrom) {
  let n = startFrom;
  for (;;) {
    const code = `KPL-${String(n).padStart(4, '0')}`;
    const clash = await prisma.customer.findUnique({ where: { code }, select: { id: true } });
    if (!clash) return { code, n };
    n += 1;
  }
}

async function main() {
  const unlinked = await prisma.shipment.findMany({
    where: { customerId: null },
    select: {
      id: true,
      waybillNumber: true,
      senderName: true,
      senderPhone: true,
      senderEmail: true,
      senderAddress: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Unlinked shipments: ${unlinked.length}`);

  // phone -> the earliest known sender details + the shipment ids using it
  const groups = new Map();
  let needsReview = 0;

  for (const s of unlinked) {
    const phone = normalisePhone(s.senderPhone);
    if (!phone) {
      needsReview += 1;
      continue;
    }
    if (!groups.has(phone)) {
      groups.set(phone, {
        name: s.senderName,
        email: s.senderEmail,
        address: s.senderAddress,
        ids: [],
      });
    }
    groups.get(phone).ids.push(s.id);
  }

  console.log(`Distinct sender phones: ${groups.size}`);
  console.log(`Shipments without a usable phone: ${needsReview}`);

  const existing = await prisma.customer.findMany({ select: { id: true, phone: true } });
  const byPhone = new Map();
  for (const c of existing) byPhone.set(c.phone, c);

  let counter = existing.length;
  let created = 0;
  let linked = 0;

  for (const [phone, info] of groups) {
    let customer = byPhone.get(phone);

    if (!customer) {
      counter += 1;
      const { code, n } = await nextAvailableCode(counter);
      counter = n;
      customer = await prisma.customer.create({
        data: {
          code,
          name: info.name || 'Unknown client',
          phone,
          email: info.email || null,
          address: info.address || null,
          createdByName: 'System backfill',
        },
        select: { id: true, phone: true },
      });
      byPhone.set(phone, customer);
      created += 1;
    }

    const result = await prisma.shipment.updateMany({
      where: { id: { in: info.ids }, customerId: null },
      data: { customerId: customer.id },
    });
    linked += result.count;
  }

  const remaining = await prisma.shipment.count({ where: { customerId: null } });

  console.log('---');
  console.log(`Customers created: ${created}`);
  console.log(`Shipments linked:  ${linked}`);
  console.log(`Still unlinked:    ${remaining} (no usable phone — review manually)`);
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
