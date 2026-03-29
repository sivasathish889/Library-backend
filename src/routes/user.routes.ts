import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, searchStudents } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Librarian can search students
router.get('/search', authenticate, authorize(['LIBRARIAN', 'ADMIN']), searchStudents);

// Only Admins can manage users directly
router.get('/', authenticate, authorize(['ADMIN']), getUsers);
router.post('/', authenticate, authorize(['ADMIN']), createUser);
router.put('/:id', authenticate, authorize(['ADMIN']), updateUser);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteUser);

export default router;
