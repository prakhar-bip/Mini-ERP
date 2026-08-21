import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';

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
        },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createUser({ name, email, password, role, locationId }, creatorUser) {
    if (creatorUser?.role !== 'ADMIN') {
      const error = new Error('Only Admin is authorized to create employee accounts.');
      error.status = 403;
      throw error;
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      const error = new Error(`User with email '${email}' already exists.`);
      error.status = 400;
      throw error;
    }

    if (locationId) {
      const location = await prisma.location.findUnique({ where: { id: locationId } });
      if (!location) {
        const error = new Error('Invalid location specified.');
        error.status = 404;
        throw error;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        locationId: locationId || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locationId: true,
        location: {
          select: { id: true, name: true, code: true }
        },
        createdAt: true
      }
    });

    return user;
  }

  async updateUser(id, { name, email, password, role, locationId }) {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      const error = new Error('Employee record not found.');
      error.status = 404;
      throw error;
    }

    if (email && email.toLowerCase() !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      if (emailConflict) {
        const error = new Error(`Email '${email}' is already in use by another user.`);
        error.status = 400;
        throw error;
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (locationId !== undefined) updateData.locationId = locationId || null;
    if (password && password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locationId: true,
        location: {
          select: { id: true, name: true, code: true }
        },
        createdAt: true
      }
    });

    return updated;
  }

  async deleteUser(id, currentUserId) {
    if (id === currentUserId) {
      const error = new Error('You cannot delete your own active Admin account.');
      error.status = 400;
      throw error;
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      const error = new Error('Employee record not found.');
      error.status = 404;
      throw error;
    }

    // Check if user has active assigned work orders
    const assignedWorkOrders = await prisma.workOrder.count({
      where: { assignedUserId: id, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } }
    });

    if (assignedWorkOrders > 0) {
      const error = new Error(
        `Cannot delete employee '${existingUser.name}'. They have ${assignedWorkOrders} active work orders assigned.`
      );
      error.status = 400;
      throw error;
    }

    await prisma.user.delete({ where: { id } });
    return { success: true, message: `Employee '${existingUser.name}' removed successfully.` };
  }
}

export const userService = new UserService();
