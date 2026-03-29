import { Request, Response } from 'express';
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
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
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
    const book = await prisma.book.findUnique({ where: { id: Number(id) } });
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
    const book = await prisma.book.create({
      data: { title, author, stock, bookCode, rackNumber }
    });
    res.status(201).json(book);
  } catch (error) {
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
    await prisma.book.delete({ where: { id: Number(id) } });
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
