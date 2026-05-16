import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(userId: string, amount: number, type: TransactionType, reason: string) {
    // Update user balance
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const balanceChange = type === TransactionType.CREDIT ? amount : -amount;

    if (user.walletBalance + balanceChange < 0) {
      throw new Error('Insufficient balance');
    }

    // Create transaction
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        userId,
        amount,
        type,
        reason,
      },
    });

    // Update user balance
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          increment: balanceChange,
        },
      },
    });

    return transaction;
  }

  async getWalletTransactions(telegramId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      return null;
    }

    return this.prisma.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSystemStats() {
    const totalUsers = await this.prisma.user.count();
    const totalPointsIssued = await this.prisma.walletTransaction.aggregate({
      where: { type: TransactionType.CREDIT },
      _sum: { amount: true },
    });
    const totalPointsRedeemed = await this.prisma.walletTransaction.aggregate({
      where: { type: TransactionType.DEBIT },
      _sum: { amount: true },
    });

    return {
      totalUsers,
      totalPointsIssued: totalPointsIssued._sum.amount || 0,
      totalPointsRedeemed: totalPointsRedeemed._sum.amount || 0,
      activePoints: (totalPointsIssued._sum.amount || 0) - (totalPointsRedeemed._sum.amount || 0),
    };
  }

  async creditPoints(userId: string, amount: number, reason: string) {
    return this.createTransaction(userId, amount, TransactionType.CREDIT, reason);
  }

  async debitPoints(userId: string, amount: number, reason: string) {
    return this.createTransaction(userId, amount, TransactionType.DEBIT, reason);
  }
}
