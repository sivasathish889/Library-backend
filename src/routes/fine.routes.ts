import { Router } from 'express';
import { updateFineConfig, getFines, getMyFines, payFine } from '../controllers/fine.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/fines/config:
 *   put:
 *     summary: Update daily fine rate configuration (Admin only)
 *     tags:
 *       - Fines
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountPerDay
 *             properties:
 *               amountPerDay:
 *                 type: number
 *                 example: 10.0
 *     responses:
 *       200:
 *         description: Fine configuration updated
 */
router.put('/config', authenticate, authorize(['ADMIN']), updateFineConfig);

/**
 * @openapi
 * /api/fines:
 *   get:
 *     summary: Get all system fines (Librarian/Admin)
 *     tags:
 *       - Fines
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all user fines
 */
router.get('/', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getFines);

/**
 * @openapi
 * /api/fines/my:
 *   get:
 *     summary: Get logged-in user's fines
 *     tags:
 *       - Fines
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's fine records
 */
router.get('/my', authenticate, getMyFines);

/**
 * @openapi
 * /api/fines/{id}/pay:
 *   put:
 *     summary: Mark a fine as paid
 *     tags:
 *       - Fines
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fine marked as paid successfully
 */
router.put('/:id/pay', authenticate, payFine);

export default router;
