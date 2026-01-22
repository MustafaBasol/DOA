import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DOA WhatsApp Management Panel API',
      version: '2.0.0',
      description: 'Comprehensive API documentation for DOA WhatsApp Chatbot Management System',
      contact: {
        name: 'API Support',
        email: 'support@autoviseo.com',
      },
      license: {
        name: 'Proprietary',
        url: 'https://autoviseo.com/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.autoviseo.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CLIENT'] },
            fullName: { type: 'string', nullable: true },
            companyName: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            whatsappNumber: { type: 'string', nullable: true },
            language: { type: 'string', enum: ['TR', 'EN', 'FR'], default: 'TR' },
            isActive: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            planName: { type: 'string' },
            monthlyPrice: { type: 'number', format: 'decimal' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date', nullable: true },
            status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'CANCELLED'] },
            autoRenew: { type: 'boolean', default: true },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', format: 'decimal' },
            currency: { type: 'string', default: 'TRY' },
            paymentDate: { type: 'string', format: 'date' },
            paymentMethod: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            direction: { type: 'string', enum: ['INBOUND', 'OUTBOUND'] },
            fromNumber: { type: 'string' },
            toNumber: { type: 'string' },
            customerName: { type: 'string', nullable: true },
            customerPhone: { type: 'string' },
            messageContent: { type: 'string', nullable: true },
            messageType: { type: 'string', default: 'text' },
            readStatus: { type: 'boolean', default: false },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: {
              type: 'string',
              enum: [
                'NEW_MESSAGE',
                'MESSAGE_READ',
                'PAYMENT_RECEIVED',
                'PAYMENT_FAILED',
                'SUBSCRIPTION_EXPIRING',
                'SUBSCRIPTION_EXPIRED',
                'SUBSCRIPTION_RENEWED',
                'SYSTEM_ALERT',
                'WELCOME',
                'PASSWORD_CHANGED',
              ],
            },
            title: { type: 'string' },
            message: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            isRead: { type: 'boolean', default: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        MessageTemplate: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            content: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            language: { type: 'string', default: 'TR' },
            category: { type: 'string' },
            status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Authentication', description: 'Authentication and authorization endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Messages', description: 'WhatsApp message management' },
      { name: 'Payments', description: 'Payment tracking and management' },
      { name: 'Subscriptions', description: 'Subscription management' },
      { name: 'Reports', description: 'Report generation and export' },
      { name: 'Analytics', description: 'Analytics and statistics' },
      { name: 'Search', description: 'Advanced search functionality' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Devices', description: 'Push notification device management' },
      { name: 'Templates', description: 'WhatsApp message templates' },
      { name: 'WhatsApp', description: 'WhatsApp messaging operations' },
      { name: 'Permissions', description: 'Role and permission management' },
      { name: 'Audit', description: 'Audit log management' },
      { name: 'Webhooks', description: 'Webhook endpoints for n8n integration' },
    ],
  },
  apis: [
    './src/modules/**/*.routes.ts',
    './src/routes/*.routes.ts',
    './src/modules/**/*.controller.ts',
    './src/controllers/*.controller.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DOA API Documentation',
  }));

  // JSON endpoint
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger documentation available at /api-docs');
};

export default swaggerSpec;
