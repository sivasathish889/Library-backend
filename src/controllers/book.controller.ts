import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/db';

const formatBookResponse = (book: any) => {
  const accessionNumbers = book.copies ? book.copies.map((c: any) => c.accessionNo) : [];
  const bookCount = book.stock ?? (accessionNumbers.length > 0 ? accessionNumbers.length : 0);
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    publisher: book.publisher ?? null,
    bookCount: bookCount,
    accessionNumbers: accessionNumbers,
    stock: book.stock,
    rackNumber: book.rackNumber,
    copies: book.copies,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
};

export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page, limit = '10' } = req.query;

    let whereClause = {};

    if (search) {
      whereClause = {
        OR: [
          { title: { contains: String(search) } },
          { author: { contains: String(search) } },
          { publisher: { contains: String(search) } },
          { copies: { some: { accessionNo: { contains: String(search) } } } }
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
          orderBy: { id: 'desc' },
          include: { copies: true }
        }),
        prisma.book.count({ where: whereClause })
      ]);

      res.json({
        books: books.map(formatBookResponse),
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
      orderBy: { id: 'desc' },
      include: { copies: true }
    });
    res.json(books.map(formatBookResponse));
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
    res.json(formatBookResponse(book));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, author, publisher, bookCount, accessionNumbers, stock, rackNumber } = req.body;

    const accNos: string[] = Array.isArray(accessionNumbers)
      ? accessionNumbers.map((a: any) => String(a).trim()).filter(Boolean)
      : (typeof accessionNumbers === 'string' && accessionNumbers.trim() ? [accessionNumbers.trim()] : []);

    const count = bookCount !== undefined ? Number(bookCount) : (accNos.length > 0 ? accNos.length : (stock ? Number(stock) : 1));

    const bookData: Prisma.BookCreateInput = {
      title,
      author,
      publisher,
      stock: count,
      rackNumber,
    };

    if (accNos.length > 0) {
      bookData.copies = {
        create: accNos.map((accNo: string) => ({
          accessionNo: accNo,
          status: 'AVAILABLE'
        }))
      };
    }

    const book = await prisma.book.create({
      data: bookData,
      include: {
        copies: true
      }
    });
    res.status(201).json(formatBookResponse(book));
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message || 'Server error', error });
  }
};

export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, author, publisher, bookCount, accessionNumbers, stock, rackNumber } = req.body;
    const bookId = Number(id);

    const existingBook = await prisma.book.findUnique({
      where: { id: bookId },
      include: { copies: true }
    });

    if (!existingBook) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }

    const accNos: string[] | undefined = Array.isArray(accessionNumbers)
      ? accessionNumbers.map((a: any) => String(a).trim()).filter(Boolean)
      : undefined;

    const count = bookCount !== undefined
      ? Number(bookCount)
      : (stock !== undefined ? Number(stock) : (accNos ? accNos.length : existingBook.stock));

    const updatedBook = await prisma.$transaction(async (tx) => {
      if (accNos && accNos.length > 0) {
        const existingAccNos = existingBook.copies.map(c => c.accessionNo);
        const newAccNos = accNos.filter(acc => !existingAccNos.includes(acc));

        if (newAccNos.length > 0) {
          await tx.bookCopy.createMany({
            data: newAccNos.map(acc => ({
              bookId,
              accessionNo: acc,
              status: 'AVAILABLE'
            })),
            skipDuplicates: true
          });
        }
      }

      return tx.book.update({
        where: { id: bookId },
        data: {
          title,
          author,
          publisher,
          stock: count,
          rackNumber
        },
        include: { copies: true }
      });
    });

    res.json(formatBookResponse(updatedBook));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error', error });
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

export const deleteBulkBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'No book IDs provided' });
      return;
    }
    const bookIds = ids.map((id: any) => Number(id)).filter(Boolean);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const copies = await tx.bookCopy.findMany({
        where: { bookId: { in: bookIds } },
        select: { id: true }
      });
      const copyIds = copies.map((c: { id: number }) => c.id);

      if (copyIds.length > 0) {
        const transactions = await tx.transaction.findMany({
          where: { bookCopyId: { in: copyIds } },
          select: { id: true }
        });
        const transactionIds = transactions.map((t: { id: number }) => t.id);

        if (transactionIds.length > 0) {
          await tx.fine.deleteMany({
            where: { transactionId: { in: transactionIds } }
          });
        }

        await tx.transaction.deleteMany({
          where: { bookCopyId: { in: copyIds } }
        });

        await tx.bookCopy.deleteMany({
          where: { bookId: { in: bookIds } }
        });
      }

      await tx.book.deleteMany({
        where: { id: { in: bookIds } }
      });
    });

    res.json({ message: `${bookIds.length} books deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error', error });
  }
};
