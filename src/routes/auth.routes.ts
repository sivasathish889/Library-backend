import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller';

const router = Router();

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 example: Secret123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [STUDENT, LIBRARIAN, ADMIN]
 *                 default: STUDENT
 *               studentId:
 *                 type: string
 *                 example: STU1001
 *               department:
 *                 type: string
 *                 example: Computer Science
 *               year:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request / user already exists
 */
router.post('/signup', signup);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and receive JWT token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 example: Secret123!
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

export default router;
