import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/db';

export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page, limit = '10' } = req.query;

    let whereClause = {};

    if (search) {
      whereClause = {
        OR: [
          { title: { contains: String(search) } },
          { author: { contains: String(search) } },
          { bookCode: { contains: String(search) } }
        ]
      };
    }

    if (page) {
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [books, total] = await Promise.all([
        prisma.book.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: { id: 'desc' }
        }),
        prisma.book.count({ where: whereClause })
      ]);

      res.json({
        books,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      });
      return;
    }

    const books = await prisma.book.findMany({
      where: whereClause,
      orderBy: { id: 'desc' }
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getBookById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id: Number(id) },
      include: {
        copies: true
      }
    });
    if (!book) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, author, stock, bookCode, rackNumber } = req.body;

    const existingBook = await prisma.book.findUnique({
      where: { bookCode }
    });

    if (existingBook) {
      res.status(400).json({ message: 'Book with this bookCode already exists' });
      return;
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        stock: stock ? Number(stock) : 0,
        bookCode,
        rackNumber
      }
    });
    res.status(201).json(book);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, author, stock, bookCode, rackNumber } = req.body;
    const book = await prisma.book.update({
      where: { id: Number(id) },
      data: { title, author, stock, bookCode, rackNumber }
    });
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bookId = Number(id);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Get all book copy IDs of this book
      const copies = await tx.bookCopy.findMany({
        where: { bookId },
        select: { id: true }
      });
      const copyIds = copies.map((c: { id: number }) => c.id);

      if (copyIds.length > 0) {
        // 2. Get all transaction IDs of these book copies
        const transactions = await tx.transaction.findMany({
          where: { bookCopyId: { in: copyIds } },
          select: { id: true }
        });
        const transactionIds = transactions.map((t: { id: number }) => t.id);

        // 3. Delete Fines associated with these transactions
        if (transactionIds.length > 0) {
          await tx.fine.deleteMany({
            where: { transactionId: { in: transactionIds } }
          });
        }

        // 4. Delete Transactions of these book copies
        await tx.transaction.deleteMany({
          where: { bookCopyId: { in: copyIds } }
        });

        // 5. Delete Book copies
        await tx.bookCopy.deleteMany({
          where: { bookId }
        });
      }

      // 6. Delete the Book
      await tx.book.delete({
        where: { id: bookId }
      });
    });

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
