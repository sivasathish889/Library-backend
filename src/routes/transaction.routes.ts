import { Router } from 'express';
import { issueBook, returnBook, markMissing, getMyTransactions, getAllTransactions, getIssuedBooks, getIssuedBooksByUser, getReturnedBooks, createMissingTransaction, getMissingBooks } from '../controllers/transaction.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/transactions/my:
 *   get:
 *     summary: Get current authenticated user's transactions
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user transactions
 */
router.get('/my', authenticate, getMyTransactions);

/**
 * @openapi
 * /api/transactions/issued:
 *   get:
 *     summary: Get all currently issued books (Librarian/Admin)
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of issued book transactions
 */
router.get('/issued', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getIssuedBooks);

/**
 * @openapi
 * /api/transactions/returned:
 *   get:
 *     summary: Get returned books history (Librarian/Admin)
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of returned transactions
 */
router.get('/returned', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getReturnedBooks);

/**
 * @openapi
 * /api/transactions/missing:
 *   get:
 *     summary: Get missing books history (Librarian/Admin)
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of missing book records
 */
router.get('/missing', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getMissingBooks);

/**
 * @openapi
 * /api/transactions/issued-by-user/{userId}:
 *   get:
 *     summary: Get issued books for a specific user ID (Librarian/Admin)
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's issued books
 */
router.get('/issued-by-user/:userId', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getIssuedBooksByUser);

/**
 * @openapi
 * /api/transactions/issue:
 *   post:
 *     summary: Issue a book copy to a student/user (Librarian/Admin)
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - bookId
 *               - dueDate
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 2
 *               bookId:
 *                 type: integer
 *                 example: 1
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-01T00:00:00.000Z"
 *     responses:
 *       201:
 *         description: Book issued successfully
 *       400:
 *         description: Book not available or validation failure
 */
router.post('/issue', authenticate, authorize(['LIBRARIAN', 'ADMIN']), issueBook);

/**
 * @openapi
 * /api/transactions/missing-manual:
 *   post:
 *     summary: Manually record a missing book transaction (Librarian/Admin)
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - bookId
 *             properties:
 *               userId:
 *                 type: integer
 *               bookId:
 *                 type: integer
 *               fineAmount:
 *                 type: number
 *                 example: 200
 *     responses:
 *       201:
 *         description: Missing transaction recorded
 */
router.post('/missing-manual', authenticate, authorize(['LIBRARIAN', 'ADMIN']), createMissingTransaction);

/**
 * @openapi
 * /api/transactions/{id}/return:
 *   put:
 *     summary: Process return of an issued book copy and calculate fine if overdue (Librarian/Admin)
 *     tags:
 *       - Transactions
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
 *         description: Book returned successfully
 */
router.put('/:id/return', authenticate, authorize(['LIBRARIAN', 'ADMIN']), returnBook);

/**
 * @openapi
 * /api/transactions/{id}/missing:
 *   put:
 *     summary: Mark an active transaction as missing (Librarian/Admin)
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fineAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transaction updated to missing
 */
router.put('/:id/missing', authenticate, authorize(['LIBRARIAN', 'ADMIN']), markMissing);

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     summary: Get all transactions with filtering options (Librarian/Admin)
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getAllTransactions);

export default router;
