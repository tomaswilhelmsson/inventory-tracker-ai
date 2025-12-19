import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
    },
  });
  console.log('✅ Created user:', user.username);

  // Create suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { name: 'Acme Corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      contactPerson: 'John Doe',
      email: 'contact@acme.com',
      phone: '555-0100',
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { name: 'Widget Warehouse' },
    update: {},
    create: {
      name: 'Widget Warehouse',
      contactPerson: 'Jane Smith',
      email: 'sales@widgetwarehouse.com',
      phone: '555-0200',
    },
  });
  console.log('✅ Created suppliers');

  // Create units
  const unitPieces = await prisma.unit.upsert({
    where: { name: 'pieces' },
    update: {},
    create: { name: 'pieces' },
  });

  const unitKg = await prisma.unit.upsert({
    where: { name: 'kg' },
    update: {},
    create: { name: 'kg' },
  });

  const unitM2 = await prisma.unit.upsert({
    where: { name: 'm2' },
    update: {},
    create: { name: 'm2' },
  });

  // Create other common units
  await prisma.unit.upsert({
    where: { name: 'g' },
    update: {},
    create: { name: 'g' },
  });

  await prisma.unit.upsert({
    where: { name: 'tons' },
    update: {},
    create: { name: 'tons' },
  });

  await prisma.unit.upsert({
    where: { name: 'liters' },
    update: {},
    create: { name: 'liters' },
  });

  await prisma.unit.upsert({
    where: { name: 'ml' },
    update: {},
    create: { name: 'ml' },
  });

  await prisma.unit.upsert({
    where: { name: 'm3' },
    update: {},
    create: { name: 'm3' },
  });

  await prisma.unit.upsert({
    where: { name: 'm' },
    update: {},
    create: { name: 'm' },
  });

  await prisma.unit.upsert({
    where: { name: 'boxes' },
    update: {},
    create: { name: 'boxes' },
  });

  await prisma.unit.upsert({
    where: { name: 'pallets' },
    update: {},
    create: { name: 'pallets' },
  });

  await prisma.unit.upsert({
    where: { name: 'rolls' },
    update: {},
    create: { name: 'rolls' },
  });

  console.log('✅ Created units');

  // Create products
  const product1 = await prisma.product.upsert({
    where: { name: 'Bolt 10mm' },
    update: {},
    create: {
      name: 'Bolt 10mm',
      description: 'Standard 10mm bolt',
      unitId: unitPieces.id,
      supplierId: supplier1.id,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { name: 'Widget Standard' },
    update: {},
    create: {
      name: 'Widget Standard',
      description: 'Standard widget product',
      unitId: unitKg.id,
      supplierId: supplier2.id,
    },
  });

  const product3 = await prisma.product.upsert({
    where: { name: 'Gasket Ring A' },
    update: {},
    create: {
      name: 'Gasket Ring A',
      description: 'Type A gasket ring',
      unitId: unitM2.id,
      supplierId: supplier1.id,
    },
  });
  console.log('✅ Created products');

  // Create purchase lots with multi-year data for FIFO testing
  // IMPORTANT: FIFO means oldest lots are consumed FIRST
  // If total consumed = 595 units from product1:
  //   - 2022 lot (500 units) should be FULLY consumed (0 remaining)
  //   - 2023 lot (300 units) should have 205 remaining (95 consumed)
  //   - 2024 lot (400 units) should be UNTOUCHED (400 remaining)
  
  // 2022 purchases (oldest - should be consumed first)
  await prisma.purchaseLot.createMany({
    data: [
      {
        productId: product1.id,
        supplierId: supplier1.id,
        purchaseDate: new Date('2022-01-15'),
        quantity: 500,
        unitCost: 1.0,
        remainingQuantity: 0, // FIFO: Fully consumed (oldest first)
        year: 2022,
      },
      {
        productId: product2.id,
        supplierId: supplier2.id,
        purchaseDate: new Date('2022-03-20'),
        quantity: 200,
        unitCost: 5.0,
        remainingQuantity: 0, // FIFO: Fully consumed (oldest first)
        year: 2022,
      },
    ],
  });

  // 2023 purchases (middle - consumed after 2022 lots are exhausted)
  await prisma.purchaseLot.createMany({
    data: [
      {
        productId: product1.id,
        supplierId: supplier1.id,
        purchaseDate: new Date('2023-06-10'),
        quantity: 300,
        unitCost: 1.25,
        remainingQuantity: 205, // FIFO: Partially consumed (95 units used after 2022 lot exhausted)
        year: 2023,
      },
      {
        productId: product2.id,
        supplierId: supplier2.id,
        purchaseDate: new Date('2023-08-15'),
        quantity: 150,
        unitCost: 5.50,
        remainingQuantity: 0, // FIFO: Fully consumed after 2022 lot
        year: 2023,
      },
      {
        productId: product3.id,
        supplierId: supplier1.id,
        purchaseDate: new Date('2023-11-01'),
        quantity: 1000,
        unitCost: 0.75,
        remainingQuantity: 450, // Partially consumed
        year: 2023,
      },
    ],
  });

  // 2024 purchases
  await prisma.purchaseLot.createMany({
    data: [
      {
        productId: product1.id,
        supplierId: supplier1.id,
        purchaseDate: new Date('2024-02-10'),
        quantity: 400,
        unitCost: 1.50,
        remainingQuantity: 400,
        year: 2024,
      },
      {
        productId: product3.id,
        supplierId: supplier1.id,
        purchaseDate: new Date('2024-05-20'),
        quantity: 800,
        unitCost: 0.80,
        remainingQuantity: 800,
        year: 2024,
      },
    ],
  });
  console.log('✅ Created purchase lots (multi-year FIFO test data)');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
