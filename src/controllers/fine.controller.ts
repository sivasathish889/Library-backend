import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

// Global mock setting for Fine amount since Settings model wasn't explicitly asked for by user.
let GLOBAL_FINE_AMOUNT = 50.0;

export const updateFineConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount } = req.body;
  if (amount && Number(amount) > 0) {
    GLOBAL_FINE_AMOUNT = Number(amount);
    res.json({ message: 'Fine configuration updated', fineAmount: GLOBAL_FINE_AMOUNT });
  } else {
    res.status(400).json({ message: 'Invalid fine amount' });
  }
};

export const getFines = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fines = await prisma.fine.findMany({
      include: { transaction: { include: { bookCopy: { include: { book: true } }, user: true } } }
    });
    const result = fines.map(f => ({
      ...f,
      transaction: f.transaction ? {
        ...f.transaction,
        book: f.transaction.bookCopy?.book,
      } : null
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getMyFines = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fines = await prisma.fine.findMany({
      where: { transaction: { userId: req.user.id } },
      include: { transaction: { include: { bookCopy: { include: { book: true } } } } }
    });
    const result = fines.map(f => ({
      ...f,
      transaction: f.transaction ? {
        ...f.transaction,
        book: f.transaction.bookCopy?.book,
      } : null
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const payFine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const fine = await prisma.fine.update({
      where: { id: Number(id) },
      data: { status: 'PAID' }
    });
    res.json({ message: 'Fine paid successfully', fine });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
