import { db } from '../db';
import { getCached, invalidateCache } from '../cache';
import { createAuditLog } from '../audit';
import { log } from '../logger';
import type { CreateShipmentInput, UpdateShipmentInput } from '../validators/shipment';

export class ShipmentService {
  /**
   * Generate unique waybill number
   */
  private async generateWaybillNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.shipment.count();
    const number = String(count + 1).padStart(6, '0');
    return `KPL-${year}-${number}`;
  }

  /**
   * Create a new shipment
   */
  async createShipment(data: CreateShipmentInput, userId?: string) {
    try {
      const waybillNumber = await this.generateWaybillNumber();

      const shipment = await db.shipment.create({
        data: {
          ...data,
          waybillNumber,
          currentStatus: 'PENDING',
        },
      });

      // Create initial tracking event
      await db.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: 'PENDING',
          location: data.origin,
          remarks: 'Shipment created',
        },
      });

      // Invalidate cache
      await invalidateCache('shipments:*');

      // Audit log
      if (userId) {
        await createAuditLog({
          userId,
          action: 'CREATE',
          entity: 'Shipment',
          entityId: shipment.id,
          changes: { waybillNumber, ...data },
        });
      }

      log.info(`Shipment created: ${waybillNumber}`);

      return shipment;
    } catch (error) {
      log.error('Failed to create shipment', { error, data });
      throw error;
    }
  }

  /**
   * Get shipment by waybill number with caching
   */
  async getShipmentByWaybill(waybillNumber: string) {
    return getCached(
      `shipment:${waybillNumber}`,
      async () => {
        const shipment = await db.shipment.findUnique({
          where: { waybillNumber },
          include: {
            events: {
              orderBy: { timestamp: 'desc' },
            },
            tracking: true,
          },
        });

        return shipment;
      },
      300 // Cache for 5 minutes
    );
  }

  /**
   * Update shipment
   */
  async updateShipment(id: string, data: UpdateShipmentInput, userId?: string) {
    try {
      const existing = await db.shipment.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('Shipment not found');
      }

      const updated = await db.shipment.update({
        where: { id },
        data,
      });

      // Invalidate cache
      await invalidateCache(`shipment:${existing.waybillNumber}`);
      await invalidateCache('shipments:*');

      // Audit log
      if (userId) {
        await createAuditLog({
          userId,
          action: 'UPDATE',
          entity: 'Shipment',
          entityId: id,
          changes: { before: existing, after: data },
        });
      }

      log.info(`Shipment updated: ${existing.waybillNumber}`);

      return updated;
    } catch (error) {
      log.error('Failed to update shipment', { error, id, data });
      throw error;
    }
  }

  /**
   * Get all shipments with pagination and filters
   */
  async getShipments(params: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status) {
      where.currentStatus = params.status;
    }

    if (params.search) {
      where.OR = [
        { waybillNumber: { contains: params.search, mode: 'insensitive' } },
        { senderName: { contains: params.search, mode: 'insensitive' } },
        { receiverName: { contains: params.search, mode: 'insensitive' } },
        { senderPhone: { contains: params.search } },
        { receiverPhone: { contains: params.search } },
      ];
    }

    const [shipments, total] = await Promise.all([
      db.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          events: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      }),
      db.shipment.count({ where }),
    ]);

    return {
      shipments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete shipment
   */
  async deleteShipment(id: string, userId?: string) {
    try {
      const existing = await db.shipment.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('Shipment not found');
      }

      await db.shipment.delete({ where: { id } });

      // Invalidate cache
      await invalidateCache(`shipment:${existing.waybillNumber}`);
      await invalidateCache('shipments:*');

      // Audit log
      if (userId) {
        await createAuditLog({
          userId,
          action: 'DELETE',
          entity: 'Shipment',
          entityId: id,
          changes: existing,
        });
      }

      log.info(`Shipment deleted: ${existing.waybillNumber}`);

      return { success: true };
    } catch (error) {
      log.error('Failed to delete shipment', { error, id });
      throw error;
    }
  }
}

export const shipmentService = new ShipmentService();
