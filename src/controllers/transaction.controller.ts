import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

export const issueBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, bookId } = req.body;

    const book = await prisma.book.findUnique({ where: { id: Number(bookId) } });
    if (!book || book.stock <= 0) { res.status(400).json({ message: 'Book unavailable or out of stock' }); return; }

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: Number(bookId) },
        data: { stock: { decrement: 1 } }
      });
      return tx.transaction.create({
        data: { userId: Number(userId), bookId: Number(bookId), status: 'ISSUED' }
      });
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error issuing book' });
  }
};

export const returnBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({ where: { id: Number(id) } });
    if (!transaction || transaction.status !== 'ISSUED') {
      res.status(400).json({ message: 'Invalid transaction' }); return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: transaction.bookId },
        data: { stock: { increment: 1 } }
      });
      return tx.transaction.update({
        where: { id: Number(id) },
        data: { status: 'RETURNED', returnDate: new Date() }
      });
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error returning book' });
  }
};

export const markMissing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({ where: { id: Number(id) } });
    if (!transaction || transaction.status !== 'ISSUED') {
      res.status(400).json({ message: 'Invalid transaction' }); return;
    }

    const fineAmount = 50.0;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.transaction.update({
        where: { id: Number(id) },
        data: { status: 'MISSING' }
      });
      await tx.fine.create({
        data: { transactionId: updatedTx.id, amount: fineAmount, status: 'UNPAID' }
      });
      return updatedTx;
    });

    res.json({ message: 'Book marked as missing and fine generated.', transaction: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error marking book as missing' });
  }
};

export const getMyTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      include: { book: true }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        book: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getIssuedBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const search = String(req.query.search || '').trim();
    const skip = (page - 1) * limit;
    // Build where clause — always filter for ISSUED status
    const where: any = { status: 'ISSUED' as const };

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { registerNumber: { contains: search } } },
        { book: { title: { contains: search } } },
        { book: { bookCode: { contains: search } } },
      ];
    }

    // Run data query and count in parallel
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
        include: {
          book: { select: { id: true, title: true, bookCode: true } },
          user: { select: { id: true, name: true, email: true, registerNumber: true, department: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);
    // Overdue / critical counts (server-side, for the stats cards)
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [overdueCount, criticalCount] = await Promise.all([
      prisma.transaction.count({ where: { status: 'ISSUED', issueDate: { lt: fourteenDaysAgo } } }),
      prisma.transaction.count({ where: { status: 'ISSUED', issueDate: { lt: thirtyDaysAgo } } }),
    ]);
    res.json({
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: { totalIssued: total, overdueCount, criticalCount },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching issued books' });
  }
};

export const getIssuedBooksByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: Number(userId),
        status: 'ISSUED',
      },
      orderBy: { issueDate: 'desc' },
      include: {
        book: { select: { id: true, title: true, author: true, bookCode: true, rackNumber: true } },
        user: { select: { id: true, name: true, registerNumber: true, department: true } },
      },
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getReturnedBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const search = String(req.query.search || '').trim();
    const skip = (page - 1) * limit;

    const where: any = { status: 'RETURNED' as const };

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { registerNumber: { contains: search } } },
        { book: { title: { contains: search } } },
        { book: { bookCode: { contains: search } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { returnDate: 'desc' },
        skip,
        take: limit,
        include: {
          book: { select: { id: true, title: true, author: true, bookCode: true } },
          user: { select: { id: true, name: true, email: true, registerNumber: true, department: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching returned books' });
  }
};
