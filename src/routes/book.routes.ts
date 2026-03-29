import { Router } from 'express';
import { getBooks, getBookById, createBook, updateBook, deleteBook } from '../controllers/book.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getBooks);
router.get('/:id', authenticate, getBookById);
router.post('/', authenticate, authorize(['ADMIN', 'LIBRARIAN']), createBook);
router.put('/:id', authenticate, authorize(['ADMIN', 'LIBRARIAN']), updateBook);
router.delete('/:id', authenticate, authorize(['ADMIN', 'LIBRARIAN']), deleteBook);

export default router;
