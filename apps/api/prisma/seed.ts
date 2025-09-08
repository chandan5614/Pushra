import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@pushra.local' },
    update: {},
    create: { email: 'test@pushra.local', name: 'Test User' },
  });

  // Addons
  const addons = await prisma.$transaction([
    prisma.addon.upsert({
      where: { id: 'addon-1' },
      update: {},
      create: { id: 'addon-1', name: 'Extra Sauce', priceCents: 50 },
    }),
    prisma.addon.upsert({
      where: { id: 'addon-2' },
      update: {},
      create: { id: 'addon-2', name: 'Gift Wrap', priceCents: 199 },
    }),
  ]);

  const productsData = [
    { name: 'Alpha Snack', variants: [{ title: 'Small', priceCents: 299 }, { title: 'Large', priceCents: 499 }] },
    { name: 'Bravo Drink', variants: [{ title: 'Bottle', priceCents: 199 }] },
    { name: 'Charlie Bar', variants: [{ title: 'Single', priceCents: 149 }, { title: 'Pack of 6', priceCents: 799 }] },
    { name: 'Delta Mix', variants: [{ title: 'Regular', priceCents: 599 }] },
    { name: 'Echo Chips', variants: [{ title: 'Classic', priceCents: 249 }, { title: 'Spicy', priceCents: 259 }] },
    { name: 'Foxtrot Cookie', variants: [{ title: 'Choco', priceCents: 299 }] },
  ];

  const createdProducts = [] as any[];
  for (const [i, p] of productsData.entries()) {
    const product = await prisma.product.create({ data: { name: p.name } });
    for (const [j, v] of p.variants.entries()) {
      const sku = `SKU-${i + 1}-${j + 1}-${Math.floor(Math.random() * 1000)}`;
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku,
          title: v.title,
          priceCents: v.priceCents,
          addons: { create: { addonId: addons[0].id } },
        },
      });
      await prisma.inventoryLot.create({ data: { productVariantId: variant.id, quantity: 100 } });
    }
    createdProducts.push(product);
  }

  // Delivery slots for today
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ranges = [
    [10, 14],
    [14, 18],
    [18, 22],
  ];
  for (const [start, end] of ranges) {
    const s = new Date(base);
    s.setHours(start, 0, 0, 0);
    const e = new Date(base);
    e.setHours(end, 0, 0, 0);
    await prisma.deliverySlot.upsert({
      where: { id: `slot-${start}-${end}` },
      update: { start: s, end: e },
      create: { id: `slot-${start}-${end}`, start: s, end: e, capacity: 100 },
    });
  }

  console.log('Seeded user:', user.email);
  console.log('Seeded products:', createdProducts.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

