import { z } from 'zod';

export const createShipmentSchema = z.object({
  senderName: z.string().min(2, 'Sender name must be at least 2 characters'),
  senderEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  senderPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  senderAddress: z.string().optional(),
  receiverName: z.string().min(2, 'Receiver name must be at least 2 characters'),
  receiverPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  receiverAddress: z.string().optional(),
  origin: z.string().min(2, 'Origin is required'),
  destination: z.string().min(2, 'Destination is required'),
  weight: z.number().positive('Weight must be positive').optional(),
  price: z.number().positive('Price must be positive').optional(),
  cargoDetails: z.string().optional(),
});

export const updateShipmentSchema = createShipmentSchema.partial();

export const trackingEventSchema = z.object({
  shipmentId: z.string().uuid('Invalid shipment ID'),
  status: z.enum([
    'PENDING',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ]),
  location: z.string().min(2, 'Location is required'),
  remarks: z.string().optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type TrackingEventInput = z.infer<typeof trackingEventSchema>;
