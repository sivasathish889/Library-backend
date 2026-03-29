import { Router } from 'express';
import { issueBook, returnBook, markMissing, getMyTransactions, getAllTransactions, getIssuedBooks, getIssuedBooksByUser, getReturnedBooks, createMissingTransaction, getMissingBooks } from '../controllers/transaction.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/my', authenticate, getMyTransactions);
router.get('/issued', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getIssuedBooks);
router.get('/returned', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getReturnedBooks);
router.get('/missing', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getMissingBooks);
router.get('/issued-by-user/:userId', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getIssuedBooksByUser);
router.post('/issue', authenticate, authorize(['LIBRARIAN', 'ADMIN']), issueBook);
router.post('/missing-manual', authenticate, authorize(['LIBRARIAN', 'ADMIN']), createMissingTransaction);
router.put('/:id/return', authenticate, authorize(['LIBRARIAN', 'ADMIN']), returnBook);
router.put('/:id/missing', authenticate, authorize(['LIBRARIAN', 'ADMIN']), markMissing);
router.get('/', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getAllTransactions);


export default router;
