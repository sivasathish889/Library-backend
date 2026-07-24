import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import transactionRoutes from './routes/transaction.routes';
import fineRoutes from './routes/fine.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import Logger from './config/logger';
import { setupSwagger } from './config/swagger';

const app = express();


app.use(cors());
app.use(express.json());
app.use(Logger);

setupSwagger(app);

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health Check
 *     description: Check if the backend API server is running and healthy.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Server is running normally.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: LMS Backend is running
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'LMS Backend is running' });
});

export default app;

