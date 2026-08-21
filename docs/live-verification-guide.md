# 💡 Live Verification Round: Quick Implementation Guide

In the next round (Live Verification), the interviewer will ask you to perform **one small unannounced change** in live coding. 

Here are the exact, tested code solutions for all 4 example changes mentioned in the case study:

---

## 🎯 Change 1: Add "DAMAGED" Stock
**Requirement:** Damaged stock should automatically reduce available stock:
$$\text{Available Quantity} = \text{Physical Quantity} - \text{Reserved Quantity} - \text{Damaged Quantity}$$

### Implementation Steps:
1. **In `backend/prisma/schema.prisma`:**
   Add `damagedQty` to the `Inventory` model:
   ```prisma
   model Inventory {
     ...
     physicalQty Int @default(0)
     reservedQty Int @default(0)
     damagedQty  Int @default(0)  // <-- ADD THIS LINE
   }
   ```
2. **Push to DB:**
   ```bash
   npx prisma db push
   ```
3. **In `backend/src/services/inventory.service.js`:**
   Update the available formula calculation:
   ```javascript
   availableQty: Math.max(0, inv.physicalQty - inv.reservedQty - (inv.damagedQty || 0))
   ```

---

## 🎯 Change 2: Allow a Transfer to be Partially Received
**Requirement:** Allow receiving a smaller quantity than dispatched (e.g., dispatched 50, but received 30 first; remaining 20 stays in transit).

### Implementation Steps:
1. **In `backend/prisma/schema.prisma`:**
   Add `receivedQty` to `InternalTransfer`:
   ```prisma
   model InternalTransfer {
     ...
     quantity    Int
     receivedQty Int @default(0) // <-- ADD THIS LINE
   }
   ```
2. **In `backend/src/services/transfer.service.js`:**
   Modify `receiveTransfer(transferId, quantityToReceive)`:
   ```javascript
   async receiveTransfer(transferId, quantityToReceive) {
     return prisma.$transaction(async (tx) => {
       const transfer = await tx.internalTransfer.findUnique({ where: { id: transferId } });
       const qty = quantityToReceive || (transfer.quantity - transfer.receivedQty);
       
       if (qty > (transfer.quantity - transfer.receivedQty)) {
         throw new Error('Cannot receive more than in-transit quantity');
       }

       // Increase destination stock by partial qty
       await tx.inventory.upsert({ ... physicalQty: { increment: qty } });

       const newReceivedQty = transfer.receivedQty + qty;
       const isFullyReceived = newReceivedQty >= transfer.quantity;

       return tx.internalTransfer.update({
         where: { id: transferId },
         data: {
           receivedQty: newReceivedQty,
           status: isFullyReceived ? 'RECEIVED' : 'DISPATCHED',
           receivedAt: isFullyReceived ? new Date() : null
         }
       });
     });
   }
   ```

---

## 🎯 Change 3: Cancel an Order & Release Reserved Stock
**Requirement:** Cancel confirmed order and return the reserved inventory back to available stock.

> 🌟 **Already Built in Codebase!**
> This feature is already fully implemented in [`customer-order.service.js`](file:///c:/Users/prakh/OneDrive/Desktop/New_CRM/backend/src/services/customer-order.service.js#L141-L188).

### How to Explain to Interviewer:
* "We designed our system with an atomic `cancelCustomerOrder` method inside a Prisma transaction."
* "It finds the reserved inventory buckets for that item and decrements `reservedQty` by the order quantity, immediately freeing up the available stock."

---

## 🎯 Change 4: Restrict Users to Only Their Assigned Location
**Requirement:** Non-admin users can only view or manage records for their assigned warehouse location.

### Implementation Steps:
1. **Create location scoping middleware or service filter:**
   In any service (e.g. `getInventories` / `getWorkOrders`):
   ```javascript
   // If user is not ADMIN and has an assigned locationId, enforce filter
   if (currentUser.role !== 'ADMIN' && currentUser.locationId) {
     where.locationId = currentUser.locationId;
   }
   ```
2. In route handler, pass `req.user` to the service method.
