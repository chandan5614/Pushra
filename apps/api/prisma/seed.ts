import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@pushra.local' },
    update: {},
    create: { email: 'test@pushra.local', name: 'Test User' },
  })

  // Add-ons
  const addons = await prisma.$transaction([
    prisma.addon.upsert({
      where: { id: 'vase' },
      update: {},
      create: { id: 'vase', name: 'Glass Vase', priceCents: 1500 },
    }),
    prisma.addon.upsert({
      where: { id: 'ribbon' },
      update: {},
      create: { id: 'ribbon', name: 'Premium Ribbon', priceCents: 500 },
    }),
    prisma.addon.upsert({
      where: { id: 'card' },
      update: {},
      create: { id: 'card', name: 'Greeting Card', priceCents: 300 },
    }),
  ])

  // Products
  const products = [
    {
      name: 'Roses Bouquet',
      variants: [
        { title: 'Classic', priceCents: 5000 },
        { title: 'Premium', priceCents: 8000 },
        { title: 'Deluxe', priceCents: 12000 },
      ],
    },
    {
      name: 'Jasmine Bouquet',
      variants: [
        { title: 'Classic', priceCents: 4500 },
        { title: 'Premium', priceCents: 7000 },
        { title: 'Deluxe', priceCents: 10000 },
      ],
    },
    {
      name: 'Mixed Flowers',
      variants: [
        { title: 'Classic', priceCents: 6000 },
        { title: 'Premium', priceCents: 9000 },
        { title: 'Deluxe', priceCents: 13000 },
      ],
    },
  ]

  for (const [i, p] of products.entries()) {
    let product = await prisma.product.findFirst({ where: { name: p.name } })
    if (!product) {
      product = await prisma.product.create({ data: { name: p.name } })
    }
    for (const [j, v] of p.variants.entries()) {
      const sku = `FLOW-${i + 1}-${j + 1}`
      const variant = await prisma.productVariant.upsert({
        where: { sku },
        update: { priceCents: v.priceCents, title: v.title, productId: product.id },
        create: {
          productId: product.id,
          sku,
          title: v.title,
          priceCents: v.priceCents,
          addons: {
            create: [
              { addonId: addons[0].id },
              { addonId: addons[1].id },
              { addonId: addons[2].id },
            ],
          },
        },
      })
      await prisma.inventoryLot.upsert({
        where: { id: `lot-${sku}` },
        update: { quantity: 100 },
        create: { id: `lot-${sku}`, productVariantId: variant.id, quantity: 100 },
      })
    }
  }

  // Delivery slots for today
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const windows = [
    [10, 14],
    [14, 18],
    [18, 22],
  ]
  for (const [sh, eh] of windows) {
    const s = new Date(base)
    s.setHours(sh, 0, 0, 0)
    const e = new Date(base)
    e.setHours(eh, 0, 0, 0)
    await prisma.deliverySlot.upsert({
      where: { city_start_end: { city: 'al-ain', start: s, end: e } },
      update: { capacity: 100 },
      create: { city: 'al-ain', start: s, end: e, capacity: 100 },
    })
  }

  // Courier (demo rider)
  await prisma.courier.upsert({
    where: { email: 'rider@pushra.local' },
    update: {},
    create: {
      name: 'Pushra Rider',
      email: 'rider@pushra.local',
      phone: '+971500000001',
      status: 'AVAILABLE',
    },
  })

  console.log('Seeded user:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
