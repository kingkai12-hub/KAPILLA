import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kapilla Logistics API',
      version: '1.0.0',
      description: 'Comprehensive logistics management system API documentation',
      contact: {
        name: 'Kapilla Logistics',
        email: 'support@kapilla-logistics.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://kapilla-logistics.vercel.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'kapilla_auth',
        },
      },
      schemas: {
        Shipment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            waybillNumber: { type: 'string' },
            senderName: { type: 'string' },
            senderPhone: { type: 'string' },
            receiverName: { type: 'string' },
            receiverPhone: { type: 'string' },
            origin: { type: 'string' },
            destination: { type: 'string' },
            currentStatus: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TrackingEvent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            shipmentId: { type: 'string', format: 'uuid' },
            status: { type: 'string' },
            location: { type: 'string' },
            remarks: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Shipments', description: 'Shipment management' },
      { name: 'Tracking', description: 'Shipment tracking' },
      { name: 'Documents', description: 'Document management' },
      { name: 'Admin', description: 'Admin-only endpoints' },
    ],
  },
  apis: ['./app/api/**/*.ts'], // Path to API routes
};

export const swaggerSpec = swaggerJsdoc(options);
