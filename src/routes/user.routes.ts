import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, searchStudents } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/users/search:
 *   get:
 *     summary: Search student profiles by query (Librarian/Admin)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search by student ID or name
 *     responses:
 *       200:
 *         description: Matching student users
 */
router.get('/search', authenticate, authorize(['LIBRARIAN', 'ADMIN']), searchStudents);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all system users (Admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of registered users
 */
router.get('/', authenticate, authorize(['ADMIN']), getUsers);

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a new system user (Admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/', authenticate, authorize(['ADMIN']), createUser);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Update user details (Admin only)
 *     tags:
 *       - Users
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
 *         description: User updated successfully
 */
router.put('/:id', authenticate, authorize(['ADMIN']), updateUser);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a system user (Admin only)
 *     tags:
 *       - Users
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
 *         description: User deleted successfully
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteUser);

export default router;
