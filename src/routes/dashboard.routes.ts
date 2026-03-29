import { Router } from 'express';
import { getLibrarianDashboardStats } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getLibrarianDashboardStats);

export default router;
