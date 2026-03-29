import { Router } from 'express';
import { updateFineConfig, getFines, getMyFines, payFine } from '../controllers/fine.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.put('/config', authenticate, authorize(['ADMIN']), updateFineConfig);
router.get('/', authenticate, authorize(['LIBRARIAN', 'ADMIN']), getFines);
router.get('/my', authenticate, getMyFines);
router.put('/:id/pay', authenticate, payFine);

export default router;
