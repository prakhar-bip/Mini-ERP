import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mini Operations ERP database...');

  // 1. Cleanup existing records in dependency order
  await prisma.customerOrder.deleteMany();
  await prisma.internalTransfer.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.item.deleteMany();
  await prisma.location.deleteMany();

  // 2. Seed Locations
  const locNorth = await prisma.location.create({
    data: {
      name: 'Warehouse North',
      code: 'WH-01',
      address: '101 Industrial Area, Zone A, New Delhi'
    }
  });

  const locSouth = await prisma.location.create({
    data: {
      name: 'Warehouse South',
      code: 'WH-02',
      address: '202 Logistics Park, Zone B, Mumbai'
    }
  });

  // 3. Seed Master Items
  const itemSteel = await prisma.item.create({
    data: {
      name: 'Raw Material Steel Rods',
      sku: 'ITEM-STL-01',
      category: 'Raw Material',
      unit: 'KG'
    }
  });

  const itemMotor = await prisma.item.create({
    data: {
      name: 'Component Motor X1',
      sku: 'ITEM-MTR-02',
      category: 'Components',
      unit: 'PCS'
    }
  });

  const itemGear = await prisma.item.create({
    data: {
      name: 'Gear Assembly 50mm',
      sku: 'ITEM-GAR-03',
      category: 'Finished Goods',
      unit: 'PCS'
    }
  });

  // 4. Seed Users with hashed passwords
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Prakhar Admin',
      email: 'admin@erp.com',
      password: passwordHash,
      role: 'ADMIN',
      locationId: locNorth.id
    }
  });

  const opsUser = await prisma.user.create({
    data: {
      name: 'Operations Manager',
      email: 'ops@erp.com',
      password: passwordHash,
      role: 'OPERATIONS_USER',
      locationId: locNorth.id
    }
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sales Executive',
      email: 'sales@erp.com',
      password: passwordHash,
      role: 'SALES_USER',
      locationId: locSouth.id
    }
  });

  // 5. Seed Initial Inventory
  await prisma.inventory.createMany({
    data: [
      {
        itemId: itemSteel.id,
        locationId: locNorth.id,
        batch: 'BATCH-2026-A',
        physicalQty: 100,
        reservedQty: 0
      },
      {
        itemId: itemMotor.id,
        locationId: locNorth.id,
        batch: 'BATCH-2026-B',
        physicalQty: 50,
        reservedQty: 0
      },
      {
        itemId: itemSteel.id,
        locationId: locSouth.id,
        batch: 'BATCH-2026-C',
        physicalQty: 20,
        reservedQty: 0
      },
      {
        itemId: itemGear.id,
        locationId: locSouth.id,
        batch: 'BATCH-2026-D',
        physicalQty: 40,
        reservedQty: 0
      }
    ]
  });

  // 6. Seed Sample Initial Work Order
  await prisma.workOrder.create({
    data: {
      orderNumber: 'WO-1001',
      locationId: locNorth.id,
      itemId: itemSteel.id,
      requiredQty: 40,
      assignedUserId: opsUser.id,
      status: 'ASSIGNED'
    }
  });

  console.log('Database seeded successfully!');
  console.log({
    locations: [locNorth.name, locSouth.name],
    users: [adminUser.email, opsUser.email, salesUser.email],
    items: [itemSteel.sku, itemMotor.sku, itemGear.sku]
  });
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
