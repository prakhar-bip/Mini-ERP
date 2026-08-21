import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { inventoryService } from '../src/services/inventory.service.js';
import { transferService } from '../src/services/transfer.service.js';
import { customerOrderService } from '../src/services/customer-order.service.js';
import { workOrderService } from '../src/services/work-order.service.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

describe('Mini Operations ERP - Mandatory Test Suite', () => {
  // Helper to generate valid mock JWT for any role
  const getAuthToken = (role = 'ADMIN', userId = 'mock-user-id') => {
    return jwt.sign(
      { userId, email: `${role.toLowerCase()}@erp.com`, role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  };

  /**
   * TEST 1: Cannot reserve more than available inventory.
   */
  describe('Test 1: Stock Reservation Limit Guard', () => {
    it('should reject customer reservation when requested quantity exceeds available inventory', async () => {
      // Mocking inventory lookup to return Physical = 100, Reserved = 30 (Available = 70)
      const mockItemId = 'item-test-1';
      const mockLocationId = 'loc-test-1';

      jest.spyOn(prisma.location, 'findUnique').mockResolvedValue({ id: mockLocationId, name: 'Warehouse 1' });
      jest.spyOn(prisma.item, 'findUnique').mockResolvedValue({ id: mockItemId, name: 'Steel' });
      
      // Mock transaction with row-level locking
      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: async () => [
            { id: 'inv-1', itemId: mockItemId, locationId: mockLocationId, physicalQty: 100, reservedQty: 30, version: 1 }
          ],
          inventory: {
            update: jest.fn()
          },
          customerOrder: {
            create: jest.fn()
          }
        };
        return callback(tx);
      });

      // Requesting 80 when available is 70
      await expect(
        customerOrderService.createCustomerOrder({
          customerName: 'Acme Corp',
          locationId: mockLocationId,
          itemId: mockItemId,
          quantity: 80
        })
      ).rejects.toThrow('Cannot reserve more than available inventory');
    });
  });

  /**
   * TEST 2: Cannot transfer more than available inventory.
   */
  describe('Test 2: Stock Transfer Limit Guard', () => {
    it('should reject dispatch when requested transfer quantity exceeds source available stock', async () => {
      const mockTransferId = 'tr-test-2';
      
      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        const tx = {
          internalTransfer: {
            findUnique: async () => ({
              id: mockTransferId,
              status: 'REQUESTED',
              itemId: 'item-1',
              sourceLocationId: 'loc-1',
              destLocationId: 'loc-2',
              quantity: 50 // Requesting 50
            })
          },
          inventory: {
            findMany: async () => [
              // Available is only 20 (Physical 20 - Reserved 0)
              { id: 'inv-src', physicalQty: 20, reservedQty: 0 }
            ]
          }
        };
        return callback(tx);
      });

      await expect(
        transferService.dispatchTransfer(mockTransferId)
      ).rejects.toThrow('Cannot transfer more than available inventory');
    });
  });

  /**
   * TEST 3: Destination stock increases ONLY after transfer receipt.
   */
  describe('Test 3: Transfer In-Transit and Receipt Stock Movement', () => {
    it('should reduce source inventory on dispatch while keeping destination stock unchanged until receipt', async () => {
      let sourcePhysical = 100;
      let destPhysical = 0;
      let transferStatus = 'REQUESTED';

      // 1. Dispatch step
      jest.spyOn(prisma, '$transaction').mockImplementationOnce(async (callback) => {
        const tx = {
          internalTransfer: {
            findUnique: async () => ({
              id: 'tr-test-3',
              status: 'REQUESTED',
              itemId: 'item-1',
              sourceLocationId: 'loc-1',
              destLocationId: 'loc-2',
              quantity: 40
            }),
            update: async ({ data }) => {
              transferStatus = data.status;
              return { id: 'tr-test-3', status: transferStatus };
            }
          },
          inventory: {
            findMany: async () => [{ id: 'inv-src', physicalQty: sourcePhysical, reservedQty: 0 }],
            update: async ({ data }) => {
              sourcePhysical = data.physicalQty;
              return { id: 'inv-src', physicalQty: sourcePhysical };
            }
          }
        };
        return callback(tx);
      });

      await transferService.dispatchTransfer('tr-test-3');

      // Verify on dispatch: source decreased, status is DISPATCHED, destination is still 0 (in-transit)
      expect(sourcePhysical).toBe(60);
      expect(destPhysical).toBe(0);
      expect(transferStatus).toBe('DISPATCHED');

      // 2. Receive step
      jest.spyOn(prisma, '$transaction').mockImplementationOnce(async (callback) => {
        const tx = {
          internalTransfer: {
            findUnique: async () => ({
              id: 'tr-test-3',
              status: 'DISPATCHED',
              itemId: 'item-1',
              sourceLocationId: 'loc-1',
              destLocationId: 'loc-2',
              quantity: 40,
              transferNumber: 'TR-1003'
            }),
            update: async ({ data }) => {
              transferStatus = data.status;
              return { id: 'tr-test-3', status: transferStatus };
            }
          },
          inventory: {
            upsert: async () => {
              destPhysical += 40;
              return { physicalQty: destPhysical };
            }
          }
        };
        return callback(tx);
      });

      await transferService.receiveTransfer('tr-test-3');

      // Verify on receipt: destination is now increased to 40 and status is RECEIVED
      expect(destPhysical).toBe(40);
      expect(transferStatus).toBe('RECEIVED');
    });
  });

  /**
   * TEST 4: Same transfer cannot be received twice.
   */
  describe('Test 4: Duplicate Transfer Receipt Prevention', () => {
    it('should strictly throw error if attempting to receive an already RECEIVED transfer', async () => {
      const mockTransferId = 'tr-already-received';

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        const tx = {
          internalTransfer: {
            findUnique: async () => ({
              id: mockTransferId,
              status: 'RECEIVED',
              itemId: 'item-1',
              sourceLocationId: 'loc-1',
              destLocationId: 'loc-2',
              quantity: 40
            })
          }
        };
        return callback(tx);
      });

      await expect(
        transferService.receiveTransfer(mockTransferId)
      ).rejects.toThrow('Transfer has already been received. Duplicate receipt is not allowed.');
    });
  });

  /**
   * TEST 5: Unauthorized user cannot perform restricted operation.
   */
  describe('Test 5: Role-Based Access Control (RBAC) Guard', () => {
    it('should block a SALES_USER from creating a Work Order with 403 Forbidden', async () => {
      const salesToken = getAuthToken('SALES_USER', 'user-sales-01');

      // Mock user lookup for authentication middleware
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-sales-01',
        name: 'Sales Person',
        email: 'sales@erp.com',
        role: 'SALES_USER',
        locationId: null,
        location: null
      });

      const response = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          locationId: 'loc-1',
          itemId: 'item-1',
          requiredQty: 50,
          assignedUserId: 'user-sales-01'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Role 'SALES_USER' is not authorized");
    });
  });
});
