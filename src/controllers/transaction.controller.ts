import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

export const issueBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, bookId, bookCopyId } = req.body;
    const targetBookId = Number(bookId);
    let targetCopyId = bookCopyId ? Number(bookCopyId) : null;

    if (!targetCopyId && targetBookId) {
      const copy = await prisma.bookCopy.findFirst({
        where: { bookId: targetBookId, status: 'AVAILABLE' }
      });
      if (copy) {
        targetCopyId = copy.id;
      }
    }

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let copyToUseId = targetCopyId;
      if (!copyToUseId) {
        const bookObj = await tx.book.findUnique({ where: { id: targetBookId } });
        if (!bookObj || bookObj.stock <= 0) {
          throw new Error('Book unavailable or out of stock');
        }
        const createdCopy = await tx.bookCopy.create({
          data: {
            bookId: targetBookId,
            accessionNo: `${bookObj.bookCode}-COPY-${Date.now()}`,
            status: 'ISSUED',
          }
        });
        copyToUseId = createdCopy.id;
      } else {
        await tx.bookCopy.update({
          where: { id: copyToUseId },
          data: { status: 'ISSUED' }
        });
      }

      await tx.book.update({
        where: { id: targetBookId },
        data: { stock: { decrement: 1 } }
      });

      return tx.transaction.create({
        data: { userId: Number(userId), bookCopyId: copyToUseId, status: 'ISSUED' }
      });
    });

    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error issuing book' });
  }
};

export const returnBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
      include: { bookCopy: true }
    });
    if (!transaction || transaction.status !== 'ISSUED') {
      res.status(400).json({ message: 'Invalid transaction' }); return;
    }

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.bookCopy.update({
        where: { id: transaction.bookCopyId },
        data: { status: 'AVAILABLE' }
      });
      if (transaction.bookCopy?.bookId) {
        await tx.book.update({
          where: { id: transaction.bookCopy.bookId },
          data: { stock: { increment: 1 } }
        });
      }
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

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
      include: { bookCopy: true }
    });
    if (!transaction || transaction.status !== 'ISSUED') {
      res.status(400).json({ message: 'Invalid transaction' }); return;
    }

    const fineAmount = 50.0;

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedTx = await tx.transaction.update({
        where: { id: Number(id) },
        data: { status: 'MISSING' }
      });
      await tx.bookCopy.update({
        where: { id: transaction.bookCopyId },
        data: { status: 'LOST' }
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
      include: { bookCopy: { include: { book: true } } }
    });
    const result = transactions.map(t => ({ ...t, book: t.bookCopy?.book }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        bookCopy: { include: { book: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    const result = transactions.map(t => ({ ...t, book: t.bookCopy?.book }));
    res.json(result);
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

    const where: any = { status: 'ISSUED' as const };

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { registerNumber: { contains: search } } },
        { bookCopy: { book: { title: { contains: search } } } },
        { bookCopy: { book: { bookCode: { contains: search } } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
        include: {
          bookCopy: { select: { id: true, book: { select: { id: true, title: true, bookCode: true } } } },
          user: { select: { id: true, name: true, email: true, registerNumber: true, department: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [overdueCount, criticalCount] = await Promise.all([
      prisma.transaction.count({ where: { status: 'ISSUED', issueDate: { lt: fourteenDaysAgo } } }),
      prisma.transaction.count({ where: { status: 'ISSUED', issueDate: { lt: thirtyDaysAgo } } }),
    ]);

    const result = transactions.map(t => ({ ...t, book: t.bookCopy?.book }));

    res.json({
      data: result,
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
        bookCopy: { select: { id: true, book: { select: { id: true, title: true, author: true, bookCode: true, rackNumber: true } } } },
        user: { select: { id: true, name: true, registerNumber: true, department: true } },
      },
    });

    const result = transactions.map(t => ({ ...t, book: t.bookCopy?.book }));

    res.json(result);
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
        { bookCopy: { book: { title: { contains: search } } } },
        { bookCopy: { book: { bookCode: { contains: search } } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { returnDate: 'desc' },
        skip,
        take: limit,
        include: {
          bookCopy: { select: { id: true, book: { select: { id: true, title: true, author: true, bookCode: true } } } },
          user: { select: { id: true, name: true, email: true, registerNumber: true, department: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    const result = transactions.map(t => ({ ...t, book: t.bookCopy?.book }));

    res.json({
      data: result,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching returned books' });
  }
};

export const createMissingTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, bookId, bookCopyId, fineAmount } = req.body;
    const targetBookId = Number(bookId);

    const book = await prisma.book.findUnique({ where: { id: targetBookId } });
    if (!book) { res.status(404).json({ message: 'Book not found' }); return; }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let existingTx = await tx.transaction.findFirst({
        where: {
          userId: Number(userId),
          bookCopy: { bookId: targetBookId },
          status: 'ISSUED'
        }
      });

      if (existingTx) {
        existingTx = await tx.transaction.update({
          where: { id: existingTx.id },
          data: { status: 'MISSING' }
        });
        await tx.bookCopy.update({
          where: { id: existingTx.bookCopyId },
          data: { status: 'LOST' }
        });
      } else {
        let copy = await tx.bookCopy.findFirst({ where: { bookId: targetBookId } });
        if (!copy) {
          copy = await tx.bookCopy.create({
            data: {
              bookId: targetBookId,
              accessionNo: `${book.bookCode}-COPY-${Date.now()}`,
              status: 'LOST'
            }
          });
        } else {
          await tx.bookCopy.update({
            where: { id: copy.id },
            data: { status: 'LOST' }
          });
        }
        existingTx = await tx.transaction.create({
          data: {
            userId: Number(userId),
            bookCopyId: copy.id,
            status: 'MISSING'
          }
        });
        await tx.book.update({
          where: { id: targetBookId },
          data: { stock: { decrement: 1 } }
        });
      }

      await tx.fine.create({
        data: {
          transactionId: existingTx.id,
          amount: parseFloat(fineAmount),
          status: 'UNPAID'
        }
      });

      return existingTx;
    });

    res.status(201).json({ message: 'Missing book logged and fine generated', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error logging missing book', error });
  }
};

export const getMissingBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const search = String(req.query.search || '').trim();
    const skip = (page - 1) * limit;

    const where: any = { status: 'MISSING' as const };

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { registerNumber: { contains: search } } },
        { bookCopy: { book: { title: { contains: search } } } },
        { bookCopy: { book: { bookCode: { contains: search } } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          bookCopy: { select: { id: true, book: { select: { id: true, title: true, author: true, bookCode: true } } } },
          user: { select: { id: true, name: true, email: true, registerNumber: true, department: true } },
          Fine: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    const result = transactions.map(t => ({ ...t, book: t.bookCopy?.book }));

    res.json({
      data: result,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching missing books' });
  }
};
