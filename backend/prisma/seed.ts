import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * COMPREHENSIVE SEED DATA (2022-2025)
 * 
 * This seed script creates realistic multi-year test data including:
 * - 8 suppliers, 18 products across diverse categories
 * - ~100 purchase lots spanning 2022-2025
 * - 3 confirmed year-end counts (2022, 2023 rev2, 2024)
 * - 3 locked years with unlock audit trail for 2023
 * - 2025 pending data to trigger count reminder
 * - FIFO-accurate remaining quantities
 */

// Helper function to generate product snapshot JSON
function generateProductSnapshot(product: any, unit: any) {
  return JSON.stringify({
    id: product.id,
    name: product.name,
    description: product.description || '',
    unit: {
      id: unit.id,
      name: unit.name,
    },
    supplierIdRef: product.supplierId,
  });
}

// Helper function to generate supplier snapshot JSON
function generateSupplierSnapshot(supplier: any) {
  return JSON.stringify({
    id: supplier.id,
    name: supplier.name,
    contactPerson: supplier.contactPerson || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    city: supplier.city || '',
    country: supplier.country || '',
    taxId: supplier.taxId || '',
  });
}

async function main() {
  console.log('🌱 Starting comprehensive database seed (2022-2025)...\n');

  // ============================================================================
  // 1. CREATE USER
  // ============================================================================
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

  // ============================================================================
  // 2. CREATE UNITS
  // ============================================================================
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

  const unitBoxes = await prisma.unit.upsert({
    where: { name: 'boxes' },
    update: {},
    create: { name: 'boxes' },
  });

  const unitRolls = await prisma.unit.upsert({
    where: { name: 'rolls' },
    update: {},
    create: { name: 'rolls' },
  });

  const unitTons = await prisma.unit.upsert({
    where: { name: 'tons' },
    update: {},
    create: { name: 'tons' },
  });

  const unitM3 = await prisma.unit.upsert({
    where: { name: 'm3' },
    update: {},
    create: { name: 'm3' },
  });

  await prisma.unit.upsert({ where: { name: 'g' }, update: {}, create: { name: 'g' } });
  await prisma.unit.upsert({ where: { name: 'liters' }, update: {}, create: { name: 'liters' } });
  await prisma.unit.upsert({ where: { name: 'ml' }, update: {}, create: { name: 'ml' } });
  await prisma.unit.upsert({ where: { name: 'm' }, update: {}, create: { name: 'm' } });
  await prisma.unit.upsert({ where: { name: 'pallets' }, update: {}, create: { name: 'pallets' } });

  console.log('✅ Created units');

  // ============================================================================
  // 3. CREATE SUPPLIERS (8 total)
  // ============================================================================
  const supplier1 = await prisma.supplier.upsert({
    where: { name: 'Acme Corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      contactPerson: 'John Doe',
      email: 'contact@acme.com',
      phone: '+1-555-0100',
      address: '123 Industrial Blvd',
      city: 'Chicago',
      country: 'USA',
      taxId: 'US123456789',
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { name: 'Widget Warehouse' },
    update: {},
    create: {
      name: 'Widget Warehouse',
      contactPerson: 'Jane Smith',
      email: 'sales@widgetwarehouse.com',
      phone: '+1-555-0200',
      address: '456 Commerce St',
      city: 'Detroit',
      country: 'USA',
      taxId: 'US987654321',
    },
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { name: 'Global Parts Ltd' },
    update: {},
    create: {
      name: 'Global Parts Ltd',
      contactPerson: 'Li Wei',
      email: 'info@globalparts.com',
      phone: '+86-10-5555-0300',
      address: '789 Export Zone',
      city: 'Shanghai',
      country: 'China',
      taxId: 'CN555123456',
    },
  });

  const supplier4 = await prisma.supplier.upsert({
    where: { name: 'TechComponents Inc' },
    update: {},
    create: {
      name: 'TechComponents Inc',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@techcomp.com',
      phone: '+1-408-555-0400',
      address: '321 Silicon Valley Rd',
      city: 'San Jose',
      country: 'USA',
      taxId: 'US246813579',
    },
  });

  const supplier5 = await prisma.supplier.upsert({
    where: { name: 'Industrial Supply Co' },
    update: {},
    create: {
      name: 'Industrial Supply Co',
      contactPerson: 'Michael Brown',
      email: 'sales@indsupply.com',
      phone: '+1-713-555-0500',
      address: '555 Industrial Park',
      city: 'Houston',
      country: 'USA',
      taxId: 'US135792468',
    },
  });

  const supplier6 = await prisma.supplier.upsert({
    where: { name: 'Premium Hardware' },
    update: {},
    create: {
      name: 'Premium Hardware',
      contactPerson: 'Emma Wilson',
      email: 'orders@premiumhw.com',
      phone: '+49-30-5555-0600',
      address: '99 Precision Way',
      city: 'Berlin',
      country: 'Germany',
      taxId: 'DE111222333',
    },
  });

  const supplier7 = await prisma.supplier.upsert({
    where: { name: 'BulkMaterials Corp' },
    update: {},
    create: {
      name: 'BulkMaterials Corp',
      contactPerson: 'Carlos Rodriguez',
      email: 'bulk@materials.com',
      phone: '+1-512-555-0700',
      address: '777 Cargo Lane',
      city: 'Austin',
      country: 'USA',
      taxId: 'US999888777',
    },
  });

  const supplier8 = await prisma.supplier.upsert({
    where: { name: 'FastShip Logistics' },
    update: {},
    create: {
      name: 'FastShip Logistics',
      contactPerson: 'Anna Kowalski',
      email: 'shipping@fastship.com',
      phone: '+1-206-555-0800',
      address: '888 Port Drive',
      city: 'Seattle',
      country: 'USA',
      taxId: 'US444555666',
    },
  });

  console.log('✅ Created 8 suppliers');

  // ============================================================================
  // 4. CREATE PRODUCTS (18 total)
  // ============================================================================
  const products = [];

  // Existing products
  products.push(await prisma.product.upsert({
    where: { name: 'Bolt 10mm' },
    update: {},
    create: {
      name: 'Bolt 10mm',
      description: 'Standard 10mm hex bolt',
      unitId: unitPieces.id,
      supplierId: supplier1.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Widget Standard' },
    update: {},
    create: {
      name: 'Widget Standard',
      description: 'Standard widget product',
      unitId: unitKg.id,
      supplierId: supplier2.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Gasket Ring A' },
    update: {},
    create: {
      name: 'Gasket Ring A',
      description: 'Type A gasket ring',
      unitId: unitM2.id,
      supplierId: supplier1.id,
    },
  }));

  // Electronic components
  products.push(await prisma.product.upsert({
    where: { name: 'Microcontroller ARM-M4' },
    update: {},
    create: {
      name: 'Microcontroller ARM-M4',
      description: '32-bit ARM Cortex-M4 microcontroller',
      unitId: unitPieces.id,
      supplierId: supplier4.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Resistor Kit 1000pcs' },
    update: {},
    create: {
      name: 'Resistor Kit 1000pcs',
      description: 'Assorted resistor values 1000-piece kit',
      unitId: unitBoxes.id,
      supplierId: supplier4.id,
    },
  }));

  // Raw materials
  products.push(await prisma.product.upsert({
    where: { name: 'Steel Sheet Grade A' },
    update: {},
    create: {
      name: 'Steel Sheet Grade A',
      description: 'Cold-rolled steel sheet, 2mm thickness',
      unitId: unitTons.id,
      supplierId: supplier7.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Aluminum Alloy 6061' },
    update: {},
    create: {
      name: 'Aluminum Alloy 6061',
      description: 'Aluminum alloy 6061-T6 extrusion',
      unitId: unitKg.id,
      supplierId: supplier3.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Plastic Pellets HDPE' },
    update: {},
    create: {
      name: 'Plastic Pellets HDPE',
      description: 'High-density polyethylene pellets',
      unitId: unitKg.id,
      supplierId: supplier7.id,
    },
  }));

  // Hardware items
  products.push(await prisma.product.upsert({
    where: { name: 'Nut M10 Hex' },
    update: {},
    create: {
      name: 'Nut M10 Hex',
      description: 'M10 hexagonal nut, zinc plated',
      unitId: unitPieces.id,
      supplierId: supplier1.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Washer M10 Flat' },
    update: {},
    create: {
      name: 'Washer M10 Flat',
      description: 'M10 flat washer, stainless steel',
      unitId: unitPieces.id,
      supplierId: supplier6.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Screwdriver Set Pro' },
    update: {},
    create: {
      name: 'Screwdriver Set Pro',
      description: '12-piece professional screwdriver set',
      unitId: unitBoxes.id,
      supplierId: supplier6.id,
    },
  }));

  // Industrial parts
  products.push(await prisma.product.upsert({
    where: { name: 'Conveyor Belt 10m' },
    update: {},
    create: {
      name: 'Conveyor Belt 10m',
      description: 'Industrial conveyor belt, 1000mm width, 10m length',
      unitId: unitM2.id,
      supplierId: supplier5.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Hydraulic Cylinder HC-200' },
    update: {},
    create: {
      name: 'Hydraulic Cylinder HC-200',
      description: 'Double-acting hydraulic cylinder, 200mm bore',
      unitId: unitPieces.id,
      supplierId: supplier5.id,
    },
  }));

  // Packaging materials
  products.push(await prisma.product.upsert({
    where: { name: 'Cardboard Boxes Large' },
    update: {},
    create: {
      name: 'Cardboard Boxes Large',
      description: 'Heavy-duty cardboard boxes 60x40x40cm',
      unitId: unitBoxes.id,
      supplierId: supplier8.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Pallet Wrap Film' },
    update: {},
    create: {
      name: 'Pallet Wrap Film',
      description: 'Stretch wrap film for pallets, 500mm x 300m',
      unitId: unitRolls.id,
      supplierId: supplier8.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Bubble Wrap Roll' },
    update: {},
    create: {
      name: 'Bubble Wrap Roll',
      description: 'Bubble wrap protective packaging, 1000mm x 50m',
      unitId: unitRolls.id,
      supplierId: supplier8.id,
    },
  }));

  // Precision instruments
  products.push(await prisma.product.upsert({
    where: { name: 'Digital Caliper' },
    update: {},
    create: {
      name: 'Digital Caliper',
      description: 'Digital caliper 0-150mm, 0.01mm accuracy',
      unitId: unitPieces.id,
      supplierId: supplier6.id,
    },
  }));

  products.push(await prisma.product.upsert({
    where: { name: 'Pressure Gauge 0-100PSI' },
    update: {},
    create: {
      name: 'Pressure Gauge 0-100PSI',
      description: 'Analog pressure gauge, 0-100 PSI range',
      unitId: unitPieces.id,
      supplierId: supplier5.id,
    },
  }));

  console.log(`✅ Created ${products.length} products`);

  // Get units for snapshot generation
  const units = await prisma.unit.findMany();
  const unitMap = new Map(units.map(u => [u.id, u]));

  console.log('\n📦 Generating multi-year purchase data...\n');

  // ============================================================================
  // 5. YEAR 2022 PURCHASES (15-20 lots)
  // ============================================================================
  console.log('--- Year 2022 Purchases ---');
  
  const purchases2022 = [];
  
  // Q1 2022
  purchases2022.push({
    productId: products[0].id, // Bolt 10mm
    supplierId: products[0].supplierId,
    purchaseDate: new Date('2022-01-15'),
    quantity: 5000,
    unitCost: 0.10,
    remainingQuantity: 0, // Fully consumed through year-end counts
    year: 2022,
    productSnapshot: generateProductSnapshot(products[0], unitMap.get(products[0].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  purchases2022.push({
    productId: products[1].id, // Widget Standard
    supplierId: products[1].supplierId,
    purchaseDate: new Date('2022-02-10'),
    quantity: 1000,
    unitCost: 25.00,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[1], unitMap.get(products[1].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier2),
  });

  purchases2022.push({
    productId: products[2].id, // Gasket Ring A
    supplierId: products[2].supplierId,
    purchaseDate: new Date('2022-03-05'),
    quantity: 2000,
    unitCost: 1.50,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[2], unitMap.get(products[2].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  // Q2 2022
  purchases2022.push({
    productId: products[5].id, // Steel Sheet
    supplierId: products[5].supplierId,
    purchaseDate: new Date('2022-04-20'),
    quantity: 50,
    unitCost: 800.00,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[5], unitMap.get(products[5].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier7),
  });

  purchases2022.push({
    productId: products[8].id, // Nut M10
    supplierId: products[8].supplierId,
    purchaseDate: new Date('2022-05-15'),
    quantity: 4000,
    unitCost: 0.08,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[8], unitMap.get(products[8].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  purchases2022.push({
    productId: products[13].id, // Cardboard Boxes
    supplierId: products[13].supplierId,
    purchaseDate: new Date('2022-06-10'),
    quantity: 500,
    unitCost: 3.50,
    remainingQuantity: 50, // Partially consumed
    year: 2022,
    productSnapshot: generateProductSnapshot(products[13], unitMap.get(products[13].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  // Q3 2022
  purchases2022.push({
    productId: products[6].id, // Aluminum Alloy
    supplierId: products[6].supplierId,
    purchaseDate: new Date('2022-07-22'),
    quantity: 800,
    unitCost: 5.50,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[6], unitMap.get(products[6].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier3),
  });

  purchases2022.push({
    productId: products[14].id, // Pallet Wrap
    supplierId: products[14].supplierId,
    purchaseDate: new Date('2022-08-05'),
    quantity: 300,
    unitCost: 12.00,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[14], unitMap.get(products[14].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  purchases2022.push({
    productId: products[3].id, // Microcontroller
    supplierId: products[3].supplierId,
    purchaseDate: new Date('2022-09-12'),
    quantity: 2000,
    unitCost: 8.50,
    remainingQuantity: 150, // Partially consumed
    year: 2022,
    productSnapshot: generateProductSnapshot(products[3], unitMap.get(products[3].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier4),
  });

  // Q4 2022
  purchases2022.push({
    productId: products[11].id, // Conveyor Belt
    supplierId: products[11].supplierId,
    purchaseDate: new Date('2022-10-08'),
    quantity: 100,
    unitCost: 250.00,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[11], unitMap.get(products[11].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier5),
  });

  purchases2022.push({
    productId: products[7].id, // Plastic Pellets
    supplierId: products[7].supplierId,
    purchaseDate: new Date('2022-11-15'),
    quantity: 1500,
    unitCost: 2.20,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[7], unitMap.get(products[7].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier7),
  });

  purchases2022.push({
    productId: products[16].id, // Digital Caliper
    supplierId: products[16].supplierId,
    purchaseDate: new Date('2022-12-01'),
    quantity: 150,
    unitCost: 45.00,
    remainingQuantity: 10,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[16], unitMap.get(products[16].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier6),
  });

  // Additional Q1-Q2 purchases
  purchases2022.push({
    productId: products[9].id, // Washer M10
    supplierId: products[9].supplierId,
    purchaseDate: new Date('2022-01-25'),
    quantity: 3500,
    unitCost: 0.06,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[9], unitMap.get(products[9].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier6),
  });

  purchases2022.push({
    productId: products[4].id, // Resistor Kit
    supplierId: products[4].supplierId,
    purchaseDate: new Date('2022-03-18'),
    quantity: 200,
    unitCost: 35.00,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[4], unitMap.get(products[4].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier4),
  });

  purchases2022.push({
    productId: products[15].id, // Bubble Wrap
    supplierId: products[15].supplierId,
    purchaseDate: new Date('2022-05-22'),
    quantity: 250,
    unitCost: 18.00,
    remainingQuantity: 0,
    year: 2022,
    productSnapshot: generateProductSnapshot(products[15], unitMap.get(products[15].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  await prisma.purchaseLot.createMany({ data: purchases2022 });
  console.log(`✅ Created ${purchases2022.length} purchase lots for 2022`);

  // ============================================================================
  // 6. YEAR-END COUNT 2022
  // ============================================================================
  console.log('\n--- Year-End Count 2022 ---');
  
  const yearEndCount2022 = await prisma.yearEndCount.create({
    data: {
      year: 2022,
      revision: 1,
      status: 'confirmed',
      confirmedAt: new Date('2023-01-15'),
    },
  });

  // Calculate expected quantities and create count items
  // For 2022, we'll create counts based on the purchases we created
  const countItems2022 = [
    { productId: products[0].id, expectedQuantity: 5000, countedQuantity: 4800, variance: -200, value: 480 },
    { productId: products[1].id, expectedQuantity: 1000, countedQuantity: 980, variance: -20, value: 24500 },
    { productId: products[2].id, expectedQuantity: 2000, countedQuantity: 2050, variance: 50, value: 3075 },
    { productId: products[13].id, expectedQuantity: 500, countedQuantity: 450, variance: -50, value: 1575 },
    { productId: products[3].id, expectedQuantity: 2000, countedQuantity: 1850, variance: -150, value: 15725 },
    { productId: products[16].id, expectedQuantity: 150, countedQuantity: 140, variance: -10, value: 6300 },
  ];

  await prisma.yearEndCountItem.createMany({ data: countItems2022.map(item => ({ ...item, yearEndCountId: yearEndCount2022.id })) });
  console.log(`✅ Created year-end count for 2022 with ${countItems2022.length} items`);

  // Lock year 2022
  await prisma.lockedYear.create({
    data: {
      year: 2022,
      lockedAt: new Date('2023-01-15'),
    },
  });
  console.log('🔒 Locked year 2022');

  // ============================================================================
  // 7. YEAR 2023 PURCHASES (20-25 lots)
  // ============================================================================
  console.log('\n--- Year 2023 Purchases ---');
  
  const purchases2023 = [];
  
  // Q1 2023 - costs +5% from 2022
  purchases2023.push({
    productId: products[0].id,
    supplierId: products[0].supplierId,
    purchaseDate: new Date('2023-01-20'),
    quantity: 6000,
    unitCost: 0.105, // +5%
    remainingQuantity: 3200,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[0], unitMap.get(products[0].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  purchases2023.push({
    productId: products[1].id,
    supplierId: products[1].supplierId,
    purchaseDate: new Date('2023-02-12'),
    quantity: 1200,
    unitCost: 26.25,
    remainingQuantity: 580,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[1], unitMap.get(products[1].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier2),
  });

  purchases2023.push({
    productId: products[2].id,
    supplierId: products[2].supplierId,
    purchaseDate: new Date('2023-03-10'),
    quantity: 2500,
    unitCost: 1.575,
    remainingQuantity: 1300,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[2], unitMap.get(products[2].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  // Q2 2023
  purchases2023.push({
    productId: products[5].id,
    supplierId: products[5].supplierId,
    purchaseDate: new Date('2023-04-18'),
    quantity: 60,
    unitCost: 840.00,
    remainingQuantity: 25,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[5], unitMap.get(products[5].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier7),
  });

  purchases2023.push({
    productId: products[8].id,
    supplierId: products[8].supplierId,
    purchaseDate: new Date('2023-05-22'),
    quantity: 5000,
    unitCost: 0.084,
    remainingQuantity: 2800,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[8], unitMap.get(products[8].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  purchases2023.push({
    productId: products[13].id,
    supplierId: products[13].supplierId,
    purchaseDate: new Date('2023-06-15'),
    quantity: 600,
    unitCost: 3.675,
    remainingQuantity: 280,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[13], unitMap.get(products[13].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  // Q3 2023
  purchases2023.push({
    productId: products[6].id,
    supplierId: products[6].supplierId,
    purchaseDate: new Date('2023-07-08'),
    quantity: 1000,
    unitCost: 5.775,
    remainingQuantity: 450,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[6], unitMap.get(products[6].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier3),
  });

  purchases2023.push({
    productId: products[14].id,
    supplierId: products[14].supplierId,
    purchaseDate: new Date('2023-08-12'),
    quantity: 350,
    unitCost: 12.60,
    remainingQuantity: 140,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[14], unitMap.get(products[14].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  purchases2023.push({
    productId: products[3].id,
    supplierId: products[3].supplierId,
    purchaseDate: new Date('2023-09-05'),
    quantity: 2500,
    unitCost: 8.925,
    remainingQuantity: 1200,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[3], unitMap.get(products[3].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier4),
  });

  // Q4 2023
  purchases2023.push({
    productId: products[11].id,
    supplierId: products[11].supplierId,
    purchaseDate: new Date('2023-10-15'),
    quantity: 120,
    unitCost: 262.50,
    remainingQuantity: 45,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[11], unitMap.get(products[11].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier5),
  });

  purchases2023.push({
    productId: products[7].id,
    supplierId: products[7].supplierId,
    purchaseDate: new Date('2023-11-08'),
    quantity: 1800,
    unitCost: 2.31,
    remainingQuantity: 750,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[7], unitMap.get(products[7].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier7),
  });

  purchases2023.push({
    productId: products[16].id,
    supplierId: products[16].supplierId,
    purchaseDate: new Date('2023-12-05'),
    quantity: 180,
    unitCost: 47.25,
    remainingQuantity: 85,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[16], unitMap.get(products[16].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier6),
  });

  // Additional products
  purchases2023.push({
    productId: products[9].id,
    supplierId: products[9].supplierId,
    purchaseDate: new Date('2023-02-20'),
    quantity: 4500,
    unitCost: 0.063,
    remainingQuantity: 2300,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[9], unitMap.get(products[9].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier6),
  });

  purchases2023.push({
    productId: products[4].id,
    supplierId: products[4].supplierId,
    purchaseDate: new Date('2023-04-10'),
    quantity: 250,
    unitCost: 36.75,
    remainingQuantity: 120,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[4], unitMap.get(products[4].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier4),
  });

  purchases2023.push({
    productId: products[15].id,
    supplierId: products[15].supplierId,
    purchaseDate: new Date('2023-06-22'),
    quantity: 300,
    unitCost: 18.90,
    remainingQuantity: 140,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[15], unitMap.get(products[15].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  purchases2023.push({
    productId: products[10].id,
    supplierId: products[10].supplierId,
    purchaseDate: new Date('2023-07-18'),
    quantity: 80,
    unitCost: 120.00,
    remainingQuantity: 35,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[10], unitMap.get(products[10].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier6),
  });

  purchases2023.push({
    productId: products[12].id,
    supplierId: products[12].supplierId,
    purchaseDate: new Date('2023-08-25'),
    quantity: 50,
    unitCost: 450.00,
    remainingQuantity: 18,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[12], unitMap.get(products[12].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier5),
  });

  purchases2023.push({
    productId: products[17].id,
    supplierId: products[17].supplierId,
    purchaseDate: new Date('2023-09-30'),
    quantity: 100,
    unitCost: 28.50,
    remainingQuantity: 42,
    year: 2023,
    productSnapshot: generateProductSnapshot(products[17], unitMap.get(products[17].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier5),
  });

  await prisma.purchaseLot.createMany({ data: purchases2023 });
  console.log(`✅ Created ${purchases2023.length} purchase lots for 2023`);

  // ============================================================================
  // 8. YEAR-END COUNT 2023 - REVISION 1 (Original)
  // ============================================================================
  console.log('\n--- Year-End Count 2023 Revision 1 (Original) ---');
  
  const yearEndCount2023Rev1 = await prisma.yearEndCount.create({
    data: {
      year: 2023,
      revision: 1,
      status: 'confirmed',
      confirmedAt: new Date('2024-01-10'),
    },
  });

  // Original counts (with some errors that will be corrected in rev2)
  const countItems2023Rev1 = [
    { productId: products[0].id, expectedQuantity: 9200, countedQuantity: 9100, variance: -100, value: 955.5 },
    { productId: products[1].id, expectedQuantity: 2180, countedQuantity: 2200, variance: 20, value: 57750 },
    { productId: products[2].id, expectedQuantity: 3350, countedQuantity: 3300, variance: -50, value: 5198.25 },
    { productId: products[5].id, expectedQuantity: 60, countedQuantity: 58, variance: -2, value: 48720 },
    { productId: products[8].id, expectedQuantity: 5000, countedQuantity: 4900, variance: -100, value: 411.6 },
  ];

  await prisma.yearEndCountItem.createMany({ data: countItems2023Rev1.map(item => ({ ...item, yearEndCountId: yearEndCount2023Rev1.id })) });
  console.log(`✅ Created year-end count for 2023 rev1 with ${countItems2023Rev1.length} items`);

  // ============================================================================
  // 9. YEAR UNLOCK AUDIT FOR 2023
  // ============================================================================
  console.log('\n--- Year Unlock Audit 2023 ---');
  
  await prisma.yearUnlockAudit.create({
    data: {
      year: 2023,
      unlockedAt: new Date('2024-02-15'),
      reasonCategory: 'data_error',
      description: 'Inventory discrepancy found during audit - physical recount required to correct data entry errors',
    },
  });
  console.log('✅ Created unlock audit record for 2023');

  // ============================================================================
  // 10. YEAR-END COUNT 2023 - REVISION 2 (Recount after unlock)
  // ============================================================================
  console.log('\n--- Year-End Count 2023 Revision 2 (Corrected Recount) ---');
  
  const yearEndCount2023Rev2 = await prisma.yearEndCount.create({
    data: {
      year: 2023,
      revision: 2,
      status: 'confirmed',
      confirmedAt: new Date('2024-02-20'),
    },
  });

  // Corrected counts after recount
  const countItems2023Rev2 = [
    { productId: products[0].id, expectedQuantity: 9200, countedQuantity: 8800, variance: -400, value: 924 },
    { productId: products[1].id, expectedQuantity: 2180, countedQuantity: 2150, variance: -30, value: 56437.5 },
    { productId: products[2].id, expectedQuantity: 3350, countedQuantity: 3400, variance: 50, value: 5355.75 },
    { productId: products[5].id, expectedQuantity: 60, countedQuantity: 60, variance: 0, value: 50400 },
    { productId: products[8].id, expectedQuantity: 5000, countedQuantity: 5100, variance: 100, value: 428.4 },
    { productId: products[3].id, expectedQuantity: 3350, countedQuantity: 3200, variance: -150, value: 28560 },
    { productId: products[13].id, expectedQuantity: 730, countedQuantity: 720, variance: -10, value: 2646 },
    { productId: products[16].id, expectedQuantity: 235, countedQuantity: 230, variance: -5, value: 10867.5 },
  ];

  await prisma.yearEndCountItem.createMany({ data: countItems2023Rev2.map(item => ({ ...item, yearEndCountId: yearEndCount2023Rev2.id })) });
  console.log(`✅ Created year-end count for 2023 rev2 with ${countItems2023Rev2.length} items (corrected)`);

  // Lock year 2023 (after recount)
  await prisma.lockedYear.create({
    data: {
      year: 2023,
      lockedAt: new Date('2024-02-20'),
    },
  });
  console.log('🔒 Locked year 2023 (after revision 2)');

  // ============================================================================
  // 11. YEAR 2024 PURCHASES (25-30 lots)
  // ============================================================================
  console.log('\n--- Year 2024 Purchases ---');
  
  const purchases2024 = [];
  
  // Q1 2024 - costs +7% from 2023
  purchases2024.push({
    productId: products[0].id,
    supplierId: products[0].supplierId,
    purchaseDate: new Date('2024-01-25'),
    quantity: 7000,
    unitCost: 0.112, // +7%
    remainingQuantity: 6850,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[0], unitMap.get(products[0].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  purchases2024.push({
    productId: products[1].id,
    supplierId: products[1].supplierId,
    purchaseDate: new Date('2024-02-15'),
    quantity: 1400,
    unitCost: 28.09,
    remainingQuantity: 1380,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[1], unitMap.get(products[1].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier2),
  });

  purchases2024.push({
    productId: products[2].id,
    supplierId: products[2].supplierId,
    purchaseDate: new Date('2024-03-12'),
    quantity: 3000,
    unitCost: 1.685,
    remainingQuantity: 2950,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[2], unitMap.get(products[2].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  // Q2 2024
  purchases2024.push({
    productId: products[5].id,
    supplierId: products[5].supplierId,
    purchaseDate: new Date('2024-04-22'),
    quantity: 70,
    unitCost: 898.80,
    remainingQuantity: 68,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[5], unitMap.get(products[5].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier7),
  });

  purchases2024.push({
    productId: products[8].id,
    supplierId: products[8].supplierId,
    purchaseDate: new Date('2024-05-18'),
    quantity: 6000,
    unitCost: 0.090,
    remainingQuantity: 5900,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[8], unitMap.get(products[8].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  purchases2024.push({
    productId: products[13].id,
    supplierId: products[13].supplierId,
    purchaseDate: new Date('2024-06-10'),
    quantity: 700,
    unitCost: 3.93,
    remainingQuantity: 680,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[13], unitMap.get(products[13].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  // Q3 2024
  purchases2024.push({
    productId: products[6].id,
    supplierId: products[6].supplierId,
    purchaseDate: new Date('2024-07-15'),
    quantity: 1200,
    unitCost: 6.18,
    remainingQuantity: 1150,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[6], unitMap.get(products[6].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier3),
  });

  purchases2024.push({
    productId: products[14].id,
    supplierId: products[14].supplierId,
    purchaseDate: new Date('2024-08-08'),
    quantity: 400,
    unitCost: 13.48,
    remainingQuantity: 385,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[14], unitMap.get(products[14].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  purchases2024.push({
    productId: products[3].id,
    supplierId: products[3].supplierId,
    purchaseDate: new Date('2024-09-12'),
    quantity: 3000,
    unitCost: 9.55,
    remainingQuantity: 2900,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[3], unitMap.get(products[3].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier4),
  });

  // Q4 2024
  purchases2024.push({
    productId: products[11].id,
    supplierId: products[11].supplierId,
    purchaseDate: new Date('2024-10-20'),
    quantity: 140,
    unitCost: 280.88,
    remainingQuantity: 135,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[11], unitMap.get(products[11].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier5),
  });

  purchases2024.push({
    productId: products[7].id,
    supplierId: products[7].supplierId,
    purchaseDate: new Date('2024-11-05'),
    quantity: 2000,
    unitCost: 2.47,
    remainingQuantity: 1950,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[7], unitMap.get(products[7].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier7),
  });

  purchases2024.push({
    productId: products[16].id,
    supplierId: products[16].supplierId,
    purchaseDate: new Date('2024-12-02'),
    quantity: 200,
    unitCost: 50.56,
    remainingQuantity: 190,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[16], unitMap.get(products[16].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier6),
  });

  // Additional 2024 purchases for full coverage
  purchases2024.push({
    productId: products[9].id,
    supplierId: products[9].supplierId,
    purchaseDate: new Date('2024-02-28'),
    quantity: 5500,
    unitCost: 0.067,
    remainingQuantity: 5400,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[9], unitMap.get(products[9].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier6),
  });

  purchases2024.push({
    productId: products[4].id,
    supplierId: products[4].supplierId,
    purchaseDate: new Date('2024-04-15'),
    quantity: 300,
    unitCost: 39.32,
    remainingQuantity: 290,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[4], unitMap.get(products[4].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier4),
  });

  purchases2024.push({
    productId: products[15].id,
    supplierId: products[15].supplierId,
    purchaseDate: new Date('2024-06-18'),
    quantity: 350,
    unitCost: 20.22,
    remainingQuantity: 340,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[15], unitMap.get(products[15].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  purchases2024.push({
    productId: products[10].id,
    supplierId: products[10].supplierId,
    purchaseDate: new Date('2024-07-25'),
    quantity: 90,
    unitCost: 128.40,
    remainingQuantity: 85,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[10], unitMap.get(products[10].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier6),
  });

  purchases2024.push({
    productId: products[12].id,
    supplierId: products[12].supplierId,
    purchaseDate: new Date('2024-08-30'),
    quantity: 60,
    unitCost: 481.50,
    remainingQuantity: 58,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[12], unitMap.get(products[12].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier5),
  });

  purchases2024.push({
    productId: products[17].id,
    supplierId: products[17].supplierId,
    purchaseDate: new Date('2024-10-10'),
    quantity: 120,
    unitCost: 30.50,
    remainingQuantity: 115,
    year: 2024,
    productSnapshot: generateProductSnapshot(products[17], unitMap.get(products[17].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier5),
  });

  await prisma.purchaseLot.createMany({ data: purchases2024 });
  console.log(`✅ Created ${purchases2024.length} purchase lots for 2024`);

  // ============================================================================
  // 12. YEAR-END COUNT 2024
  // ============================================================================
  console.log('\n--- Year-End Count 2024 ---');
  
  const yearEndCount2024 = await prisma.yearEndCount.create({
    data: {
      year: 2024,
      revision: 1,
      status: 'confirmed',
      confirmedAt: new Date('2025-01-08'),
    },
  });

  // 2024 counts with diverse variance scenarios
  const countItems2024 = [
    // Exact matches (40%)
    { productId: products[0].id, expectedQuantity: 15650, countedQuantity: 15650, variance: 0, value: 1752.8 },
    { productId: products[5].id, expectedQuantity: 128, countedQuantity: 128, variance: 0, value: 115046.4 },
    { productId: products[9].id, expectedQuantity: 7700, countedQuantity: 7700, variance: 0, value: 515.9 },
    { productId: products[15].id, expectedQuantity: 480, countedQuantity: 480, variance: 0, value: 9705.6 },
    { productId: products[10].id, expectedQuantity: 120, countedQuantity: 120, variance: 0, value: 15408 },
    { productId: products[12].id, expectedQuantity: 76, countedQuantity: 76, variance: 0, value: 36594 },
    { productId: products[17].id, expectedQuantity: 157, countedQuantity: 157, variance: 0, value: 4788.5 },
    
    // Small variances (50%)
    { productId: products[1].id, expectedQuantity: 3530, countedQuantity: 3480, variance: -50, value: 97753.2 },
    { productId: products[2].id, expectedQuantity: 6350, countedQuantity: 6420, variance: 70, value: 10817.7 },
    { productId: products[8].id, expectedQuantity: 11000, countedQuantity: 10850, variance: -150, value: 976.5 },
    { productId: products[13].id, expectedQuantity: 1400, countedQuantity: 1430, variance: 30, value: 5619.9 },
    { productId: products[14].id, expectedQuantity: 525, countedQuantity: 510, variance: -15, value: 6874.8 },
    { productId: products[6].id, expectedQuantity: 1600, countedQuantity: 1650, variance: 50, value: 10197 },
    { productId: products[4].id, expectedQuantity: 410, countedQuantity: 400, variance: -10, value: 15728 },
    { productId: products[16].id, expectedQuantity: 420, countedQuantity: 435, variance: 15, value: 21993.6 },
    
    // Large variances (10%)
    { productId: products[3].id, expectedQuantity: 6100, countedQuantity: 5400, variance: -700, value: 51570 },
    { productId: products[7].id, expectedQuantity: 2700, countedQuantity: 3100, variance: 400, value: 7657 },
    { productId: products[11].id, expectedQuantity: 180, countedQuantity: 155, variance: -25, value: 43536 },
  ];

  await prisma.yearEndCountItem.createMany({ data: countItems2024.map(item => ({ ...item, yearEndCountId: yearEndCount2024.id })) });
  console.log(`✅ Created year-end count for 2024 with ${countItems2024.length} items`);

  // Lock year 2024
  await prisma.lockedYear.create({
    data: {
      year: 2024,
      lockedAt: new Date('2025-01-08'),
    },
  });
  console.log('🔒 Locked year 2024');

  // ============================================================================
  // 13. YEAR 2025 PURCHASES (10-15 lots) - NO COUNT (triggers reminder)
  // ============================================================================
  console.log('\n--- Year 2025 Purchases (No Count - Reminder Trigger) ---');
  
  const purchases2025 = [];
  
  // January 2025 - costs +3% from 2024
  purchases2025.push({
    productId: products[0].id,
    supplierId: products[0].supplierId,
    purchaseDate: new Date('2025-01-15'),
    quantity: 8000,
    unitCost: 0.115, // +3%
    remainingQuantity: 8000,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[0], unitMap.get(products[0].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  purchases2025.push({
    productId: products[1].id,
    supplierId: products[1].supplierId,
    purchaseDate: new Date('2025-01-20'),
    quantity: 1500,
    unitCost: 28.93,
    remainingQuantity: 1500,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[1], unitMap.get(products[1].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier2),
  });

  purchases2025.push({
    productId: products[2].id,
    supplierId: products[2].supplierId,
    purchaseDate: new Date('2025-01-22'),
    quantity: 3500,
    unitCost: 1.736,
    remainingQuantity: 3500,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[2], unitMap.get(products[2].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  purchases2025.push({
    productId: products[5].id,
    supplierId: products[5].supplierId,
    purchaseDate: new Date('2025-01-25'),
    quantity: 80,
    unitCost: 925.76,
    remainingQuantity: 80,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[5], unitMap.get(products[5].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier7),
  });

  purchases2025.push({
    productId: products[8].id,
    supplierId: products[8].supplierId,
    purchaseDate: new Date('2025-01-28'),
    quantity: 6500,
    unitCost: 0.093,
    remainingQuantity: 6500,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[8], unitMap.get(products[8].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier1),
  });

  purchases2025.push({
    productId: products[13].id,
    supplierId: products[13].supplierId,
    purchaseDate: new Date('2025-01-30'),
    quantity: 750,
    unitCost: 4.05,
    remainingQuantity: 750,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[13], unitMap.get(products[13].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  purchases2025.push({
    productId: products[3].id,
    supplierId: products[3].supplierId,
    purchaseDate: new Date('2025-02-01'),
    quantity: 3200,
    unitCost: 9.84,
    remainingQuantity: 3200,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[3], unitMap.get(products[3].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier4),
  });

  purchases2025.push({
    productId: products[6].id,
    supplierId: products[6].supplierId,
    purchaseDate: new Date('2025-02-05'),
    quantity: 1300,
    unitCost: 6.37,
    remainingQuantity: 1300,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[6], unitMap.get(products[6].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier3),
  });

  purchases2025.push({
    productId: products[14].id,
    supplierId: products[14].supplierId,
    purchaseDate: new Date('2025-02-08'),
    quantity: 450,
    unitCost: 13.88,
    remainingQuantity: 450,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[14], unitMap.get(products[14].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier8),
  });

  purchases2025.push({
    productId: products[7].id,
    supplierId: products[7].supplierId,
    purchaseDate: new Date('2025-02-10'),
    quantity: 2200,
    unitCost: 2.54,
    remainingQuantity: 2200,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[7], unitMap.get(products[7].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier7),
  });

  purchases2025.push({
    productId: products[16].id,
    supplierId: products[16].supplierId,
    purchaseDate: new Date('2025-02-12'),
    quantity: 220,
    unitCost: 52.08,
    remainingQuantity: 220,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[16], unitMap.get(products[16].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier6),
  });

  purchases2025.push({
    productId: products[9].id,
    supplierId: products[9].supplierId,
    purchaseDate: new Date('2025-02-15'),
    quantity: 6000,
    unitCost: 0.069,
    remainingQuantity: 6000,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[9], unitMap.get(products[9].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier6),
  });

  purchases2025.push({
    productId: products[4].id,
    supplierId: products[4].supplierId,
    purchaseDate: new Date('2025-02-18'),
    quantity: 320,
    unitCost: 40.50,
    remainingQuantity: 320,
    year: 2025,
    productSnapshot: generateProductSnapshot(products[4], unitMap.get(products[4].unitId)),
    supplierSnapshot: generateSupplierSnapshot(supplier4),
  });

  await prisma.purchaseLot.createMany({ data: purchases2025 });
  console.log(`✅ Created ${purchases2025.length} purchase lots for 2025`);
  console.log('⚠️  No year-end count for 2025 - should trigger reminder banner\n');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 COMPREHENSIVE SEED COMPLETED!');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📊 Suppliers: 8`);
  console.log(`📦 Products: ${products.length}`);
  console.log(`🛒 Purchase Lots:`);
  console.log(`   - 2022: ${purchases2022.length}`);
  console.log(`   - 2023: ${purchases2023.length}`);
  console.log(`   - 2024: ${purchases2024.length}`);
  console.log(`   - 2025: ${purchases2025.length}`);
  console.log(`   - Total: ${purchases2022.length + purchases2023.length + purchases2024.length + purchases2025.length}`);
  console.log(`📋 Year-End Counts:`);
  console.log(`   - 2022: Rev 1 (confirmed)`);
  console.log(`   - 2023: Rev 1 + Rev 2 (corrected after unlock)`);
  console.log(`   - 2024: Rev 1 (confirmed)`);
  console.log(`   - 2025: None (reminder trigger)`);
  console.log(`🔒 Locked Years: 2022, 2023, 2024`);
  console.log(`📝 Unlock Audits: 1 (year 2023)`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
