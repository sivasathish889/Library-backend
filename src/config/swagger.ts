import { Express, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library Management System API',
      version: '1.0.0',
      description: 'Comprehensive REST API documentation for the Library Management System backend.',
      contact: {
        name: 'LMS API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Local Development Server',
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
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'An unexpected error occurred',
            },
            error: {
              type: 'string',
              example: 'Detailed error trace or message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', example: 'student@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['STUDENT', 'LIBRARIAN', 'ADMIN'], example: 'STUDENT' },
            studentId: { type: 'string', example: 'STU1001', nullable: true },
            department: { type: 'string', example: 'Computer Science', nullable: true },
            year: { type: 'integer', example: 3, nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Book: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Clean Code' },
            author: { type: 'string', example: 'Robert C. Martin' },
            publisher: { type: 'string', example: 'Prentice Hall', nullable: true },
            bookCount: { type: 'integer', example: 2 },
            accessionNumbers: {
              type: 'array',
              items: { type: 'string' },
              example: ['ACC-101', 'ACC-102']
            },
            bookCode: { type: 'string', example: 'BK-101' },
            stock: { type: 'integer', example: 2 },
            rackNumber: { type: 'string', example: 'A-12', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        BookCopy: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 101 },
            copyCode: { type: 'string', example: 'BK-101-1' },
            bookId: { type: 'integer', example: 1 },
            isAvailable: { type: 'boolean', example: true },
            isMissing: { type: 'boolean', example: false },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 2 },
            bookCopyId: { type: 'integer', example: 101 },
            issueDate: { type: 'string', format: 'date-time' },
            dueDate: { type: 'string', format: 'date-time' },
            returnDate: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['ISSUED', 'RETURNED', 'OVERDUE', 'MISSING'], example: 'ISSUED' },
            isMissing: { type: 'boolean', example: false },
            user: { $ref: '#/components/schemas/User' },
            bookCopy: { $ref: '#/components/schemas/BookCopy' },
          },
        },
        Fine: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 2 },
            transactionId: { type: 'integer', example: 1 },
            amount: { type: 'number', example: 50.0 },
            status: { type: 'string', enum: ['UNPAID', 'PAID'], example: 'UNPAID' },
            reason: { type: 'string', example: 'Late return fine (5 days overdue)' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        FineConfig: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            amountPerDay: { type: 'number', example: 10.0 },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalBooks: { type: 'integer', example: 120 },
            totalIssued: { type: 'integer', example: 15 },
            totalReturned: { type: 'integer', example: 85 },
            totalMissing: { type: 'integer', example: 2 },
            totalFineCollected: { type: 'number', example: 450.0 },
            totalPendingFine: { type: 'number', example: 120.0 },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
