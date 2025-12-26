/**
 * Test Data Factories
 * 
 * Provides utility functions for creating test data with realistic defaults.
 * All factories use the test Prisma client for database operations.
 */

import { testPrisma } from './setup';
import bcrypt from 'bcrypt';

export const TestFactory = {
  /**
   * Create a test user with hashed password
   * @param overrides - Optional fields to override defaults
   * @returns Created user
   */
  async createUser(overrides?: { username?: string; password?: string }) {
    const username = overrides?.username || `testuser-${Date.now()}`;
    const password = overrides?.password || 'test123';
    const passwordHash = await bcrypt.hash(password, 10);

    return testPrisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });
  },

  /**
   * Create a test supplier with contact information
   * @param overrides - Optional fields to override defaults
   * @returns Created supplier
   */
  async createSupplier(overrides?: {
    name?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    notes?: string;
  }) {
    return testPrisma.supplier.create({
      data: {
        name: overrides?.name || `Test Supplier ${Date.now()}`,
        contactPerson: overrides?.contactPerson || 'Test Contact',
        email: overrides?.email || 'test@example.com',
        phone: overrides?.phone || '123-456-7890',
        address: overrides?.address || '123 Test St',
        city: overrides?.city || 'Test City',
        country: overrides?.country || 'Test Country',
        taxId: overrides?.taxId,
        notes: overrides?.notes,
      },
    });
  },

  /**
   * Create or get a test unit
   * @param name - Unit name (e.g., 'pieces', 'kg', 'm2')
   * @returns Created or existing unit
   */
  async createUnit(name: string = 'pieces') {
    return testPrisma.unit.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  },

  /**
   * Create a test product with supplier and unit relationships
   * @param name - Product name
   * @param supplierId - Supplier ID
   * @param unitId - Unit ID
   * @param description - Optional product description
   * @returns Created product
   */
  async createProduct(
    name: string,
    supplierId: number,
    unitId: number,
    description?: string
  ) {
    return testPrisma.product.create({
      data: {
        name,
        supplierId,
        unitId,
        description: description || `Test product: ${name}`,
      },
    });
  },

  /**
   * Create a purchase lot with required snapshots and FIFO fields
   * @param data - Purchase lot data
   * @returns Created purchase lot
   */
  async createPurchaseLot(data: {
    productId: number;
    supplierId: number;
    quantity: number;
    unitCost: number;
    purchaseDate: Date;
  }) {
    // Fetch product and supplier details for snapshots
    const product = await testPrisma.product.findUnique({
      where: { id: data.productId },
      include: { supplier: true, unit: true },
    });

    if (!product) {
      throw new Error(`Product with id ${data.productId} not found`);
    }

    const supplier = await testPrisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    if (!supplier) {
      throw new Error(`Supplier with id ${data.supplierId} not found`);
    }

    // Generate snapshots
    const productSnapshot = JSON.stringify({
      id: product.id,
      name: product.name,
      description: product.description,
      unit: {
        id: product.unit.id,
        name: product.unit.name,
      },
      supplierIdRef: product.supplierId,
    });

    const supplierSnapshot = JSON.stringify({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      country: supplier.country,
      taxId: supplier.taxId,
    });

    return testPrisma.purchaseLot.create({
      data: {
        productId: data.productId,
        supplierId: data.supplierId,
        quantity: data.quantity,
        unitCost: data.unitCost,
        unitCostExclVAT: data.unitCost, // Default: no VAT for legacy tests
        unitCostInclVAT: data.unitCost,
        vatRate: 0, // Default: no VAT for legacy tests
        purchaseDate: data.purchaseDate,
        year: data.purchaseDate.getFullYear(),
        remainingQuantity: data.quantity, // Initially equals quantity
        productSnapshot,
        supplierSnapshot,
      },
    });
  },

  /**
   * Create a complete test environment with supplier, unit, and product
   * @param productName - Name for the product
   * @returns Object with created supplier, unit, and product
   */
  async createCompleteProductSetup(productName: string = 'Test Product') {
    const supplier = await this.createSupplier({ name: `Supplier for ${productName}` });
    const unit = await this.createUnit('pieces');
    const product = await this.createProduct(productName, supplier.id, unit.id);

    return { supplier, unit, product };
  },
};
