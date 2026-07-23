import { Router } from 'express';
import { getLibrarianDashboardStats } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics (Librarian/Admin)
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Key library dashboard metrics and statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 */
router.get('/', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getLibrarianDashboardStats);

export default router;
