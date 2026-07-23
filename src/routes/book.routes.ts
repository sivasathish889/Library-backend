import { Router } from 'express';
import { getBooks, getBookById, createBook, updateBook, deleteBook } from '../controllers/book.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/books:
 *   get:
 *     summary: Get list of books (supports searching and filtering)
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title, author, or book code
 *     responses:
 *       200:
 *         description: List of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */
router.get('/', authenticate, getBooks);

/**
 * @openapi
 * /api/books/{id}:
 *   get:
 *     summary: Get book details by ID
 *     tags:
 *       - Books
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
 *         description: Book details including copies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 */
router.get('/:id', authenticate, getBookById);

/**
 * @openapi
 * /api/books:
 *   post:
 *     summary: Add a new book with copy count (Librarian/Admin)
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - bookCode
 *               - stock
 *             properties:
 *               title:
 *                 type: string
 *                 example: Clean Code
 *               author:
 *                 type: string
 *                 example: Robert C. Martin
 *               bookCode:
 *                 type: string
 *                 example: BK-101
 *               stock:
 *                 type: integer
 *                 example: 5
 *               rackNumber:
 *                 type: string
 *                 example: A-12
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 */
router.post('/', authenticate, authorize(['ADMIN', 'LIBRARIAN']), createBook);

/**
 * @openapi
 * /api/books/{id}:
 *   put:
 *     summary: Update book details (Librarian/Admin)
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               bookCode:
 *                 type: string
 *               stock:
 *                 type: integer
 *               rackNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Book updated successfully
 */
router.put('/:id', authenticate, authorize(['ADMIN', 'LIBRARIAN']), updateBook);

/**
 * @openapi
 * /api/books/{id}:
 *   delete:
 *     summary: Delete a book and its copies (Librarian/Admin)
 *     tags:
 *       - Books
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
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 */
router.delete('/:id', authenticate, authorize(['ADMIN', 'LIBRARIAN']), deleteBook);

export default router;
