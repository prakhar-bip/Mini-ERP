import prisma from '../config/database.js';

export class ItemService {
  async getAllItems() {
    return prisma.item.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getItemById(id) {
    const item = await prisma.item.findUnique({
      where: { id }
    });
    if (!item) {
      const error = new Error('Item not found');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async createItem(data) {
    const existing = await prisma.item.findUnique({
      where: { sku: data.sku }
    });
    if (existing) {
      const error = new Error(`Item with SKU '${data.sku}' already exists`);
      error.status = 400;
      throw error;
    }
    return prisma.item.create({ data });
  }
}

export const itemService = new ItemService();
