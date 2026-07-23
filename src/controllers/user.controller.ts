import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { Role, Prisma } from '@prisma/client';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, registerNumber: true, department: true, createdAt: true } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const searchStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registerNumber, name, department } = req.query;

    // Build filter conditions
    const conditions: Prisma.UserWhereInput[] = [{ role: Role.STUDENT }];
    if (registerNumber && String(registerNumber).trim()) {
      conditions.push({ registerNumber: { contains: String(registerNumber) } });
    }
    if (name && String(name).trim()) {
      conditions.push({ name: { contains: String(name) } });
    }
    if (department && String(department).trim()) {
      conditions.push({ department: { contains: String(department) } });
    }

    // If no filters provided, return empty
    if (conditions.length === 1) {
      res.json([]);
      return;
    }

    const students = await prisma.user.findMany({
      where: {
        AND: conditions,
      },
      select: {
        id: true,
        name: true,
        email: true,
        registerNumber: true,
        department: true,
        createdAt: true,
        _count: {
          select: {
            transactions: {
              where: { status: 'ISSUED' },
            },
          },
        },
      },
      take: 20,
    });
    const result = students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      registerNumber: s.registerNumber,
      department: s.department,
      createdAt: s.createdAt,
      activeBooks: s._count.transactions,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, registerNumber, department } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { res.status(400).json({ message: 'Email already exists' }); return; }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role ? (role as Role) : Role.STUDENT;

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: userRole, registerNumber, department },
      select: { id: true, name: true, email: true, role: true, registerNumber: true, department: true }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, registerNumber, department } = req.body;

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { name, email, role: role as Role, registerNumber, department },
      select: { id: true, name: true, email: true, role: true, registerNumber: true, department: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Get all transaction IDs of this user
      const transactions = await tx.transaction.findMany({
        where: { userId },
        select: { id: true }
      });
      const transactionIds = transactions.map((t: { id: number }) => t.id);

      // 2. Delete Fines associated with these transactions
      if (transactionIds.length > 0) {
        await tx.fine.deleteMany({
          where: { transactionId: { in: transactionIds } }
        });
      }

      // 3. Delete Transactions of this user
      await tx.transaction.deleteMany({
        where: { userId }
      });

      // 4. Delete the User
      await tx.user.delete({
        where: { id: userId }
      });
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
