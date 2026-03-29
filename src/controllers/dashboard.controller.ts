import { Request, Response } from 'express';
import prisma from '../config/db';

export const getLibrarianDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalBooks = await prisma.book.count();

    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT' },
    });

    const issuedBooks = await prisma.transaction.count({
      where: { status: 'ISSUED' },
    });

    const missingBooks = await prisma.transaction.count({
      where: { status: 'MISSING' },
    });

    const recentIssuances = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { status: 'ISSUED' },
      include: {
        user: { select: { name: true, email: true } },
        book: { select: { title: true, author: true } },
      },
    });

    // Activity - Last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const activityMap = new Map<string, { name: string; Issued: number; Returned: number }>();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const key = `${m}_${d.getFullYear()}`;
      activityMap.set(key, { name: monthNames[m] || '', Issued: 0, Returned: 0 });
    }

    recentTransactions.forEach(t => {
      const d = new Date(t.createdAt);
      const m = d.getMonth();
      const key = `${m}_${d.getFullYear()}`;
      if(activityMap.has(key)) {
        const entry = activityMap.get(key)!;
        if(t.status === 'ISSUED') {
          entry.Issued += 1;
        } else if(t.status === 'RETURNED') {
          entry.Returned += 1;
        }
      }
    });

    const bookActivity = Array.from(activityMap.values());

    // Books By Author
    const books = await prisma.book.groupBy({
      by: ['author'],
      _count: {
        _all: true,
      },
      orderBy: {
        _count: { author: 'desc' }
      },
      take: 6,
    });

    const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#eab308'];
    const booksByAuthor = books.map((b, idx) => ({
      name: b.author || 'Unknown',
      value: b._count._all,
      color: colors[idx % colors.length]
    }));

    res.json({
      totalBooks,
      totalStudents,
      issuedBooks,
      missingBooks,
      recentIssuances,
      bookActivity,
      booksByAuthor,
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};
