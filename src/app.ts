import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import transactionRoutes from './routes/transaction.routes';
import fineRoutes from './routes/fine.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import Logger from './config/logger';

const app = express();


app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(Logger)

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'LMS Backend is running' });
});

export default app;

