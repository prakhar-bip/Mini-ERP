import prisma from '../config/database.js';

export class UserService {
  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locationId: true,
        location: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }
}

export const userService = new UserService();
