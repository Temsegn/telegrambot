import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(telegramId: bigint, username?: string, firstName?: string, lastName?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (existingUser) {
      return existingUser;
    }

    const referralCode = this.generateReferralCode();

    return this.prisma.user.create({
      data: {
        telegramId,
        username,
        firstName,
        lastName,
        referralCode,
        status: UserStatus.STARTED_BOT,
      },
    });
  }

  async findByTelegramId(telegramId: bigint) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      include: {
        referralsGiven: true,
        referralsReceived: true,
        events: true,
        walletTransactions: true,
      },
    });
  }

  async findByReferralCode(referralCode: string) {
    return this.prisma.user.findUnique({
      where: { referralCode },
    });
  }

  async updateStatus(userId: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  async updateActiveStatus(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async updateWalletBalance(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          increment: amount,
        },
      },
    });
  }

  async getLeaderboard(limit = 100) {
    return this.prisma.user.findMany({
      take: limit,
      orderBy: {
        walletBalance: 'desc',
      },
      include: {
        referralsGiven: {
          where: { activeStatus: true },
        },
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        referralsGiven: true,
        referralsReceived: true,
        events: true,
        walletTransactions: true,
      },
    });
  }

  private generateReferralCode(): string {
    return nanoid(10);
  }
}
