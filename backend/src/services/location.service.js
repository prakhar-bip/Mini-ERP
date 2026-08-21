import prisma from '../config/database.js';

export class LocationService {
  async getAllLocations() {
    return prisma.location.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getLocationById(id) {
    const location = await prisma.location.findUnique({
      where: { id }
    });
    if (!location) {
      const error = new Error('Location not found');
      error.status = 404;
      throw error;
    }
    return location;
  }

  async createLocation(data) {
    const existing = await prisma.location.findUnique({
      where: { code: data.code }
    });
    if (existing) {
      const error = new Error(`Location with code '${data.code}' already exists`);
      error.status = 400;
      throw error;
    }
    return prisma.location.create({ data });
  }
}

export const locationService = new LocationService();
