import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { Role } from '@prisma/client';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role ? (role as Role) : Role.STUDENT;

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: userRole },
    });

    res.status(201).json({ message: 'User created successfully', user: { id: user.id, name, email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during signup' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during login' });
  }
};
