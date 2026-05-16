import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class ReferralsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async createReferral(inviterTelegramId: bigint, invitedTelegramId: bigint) {
    // Prevent self-referral
    if (inviterTelegramId === invitedTelegramId) {
      throw new ConflictException('Cannot refer yourself');
    }

    // Get or create inviter
    const inviter = await this.usersService.findByTelegramId(inviterTelegramId);
    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    // Get or create invited user (create is upsert-safe)
    const invited = await this.usersService.create(invitedTelegramId);

    // Check if invited user already has a referral (using their UUID)
    const existingReferral = await this.prisma.referral.findUnique({
      where: { invitedId: invited.id },
    });

    if (existingReferral) {
      throw new ConflictException('User already has an inviter');
    }

    // Update invited user status
    await this.usersService.updateStatus(invited.id, UserStatus.CLICKED_INVITE);

    // Create referral
    return this.prisma.referral.create({
      data: {
        inviterId: inviter.id,
        invitedId: invited.id,
      },
      include: {
        inviter: true,
        invited: true,
      },
    });
  }

  async markAsJoined(invitedTelegramId: bigint) {
    const invited = await this.usersService.findByTelegramId(invitedTelegramId);
    if (!invited) {
      throw new NotFoundException('User not found');
    }

    // Update user status regardless of referral
    await this.usersService.updateStatus(invited.id, UserStatus.JOINED_CHANNEL);
    await this.usersService.updateActiveStatus(invited.id, true);

    const referral = await this.prisma.referral.findUnique({
      where: { invitedId: invited.id },
    });

    if (!referral) {
      // User joined without a referral link — that's fine, just update their status
      return { message: 'User marked as joined (no referral)', userId: invited.id };
    }

    const isRejoin = referral.joinedAt !== null;

    // Update referral
    const updatedReferral = await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        joinedAt: referral.joinedAt || new Date(),
        activeStatus: true,
      },
    });

    // Award points to inviter (5 points for join) only if first time
    if (!isRejoin) {
      await this.usersService.updateWalletBalance(referral.inviterId, 5);
    }

    return { ...updatedReferral, isRejoin };
  }

  async markAsLeft(invitedTelegramId: bigint) {
    const invited = await this.usersService.findByTelegramId(invitedTelegramId);
    if (!invited) {
      throw new NotFoundException('User not found');
    }

    // Update user status regardless of referral
    await this.usersService.updateStatus(invited.id, UserStatus.LEFT_CHANNEL);
    await this.usersService.updateActiveStatus(invited.id, false);

    const referral = await this.prisma.referral.findUnique({
      where: { invitedId: invited.id },
    });

    if (!referral) {
      return { message: 'User marked as left (no referral)', userId: invited.id };
    }

    // Update referral
    return this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        leftAt: new Date(),
        activeStatus: false,
      },
    });
  }

  async markAsRejoined(invitedTelegramId: bigint) {
    const invited = await this.usersService.findByTelegramId(invitedTelegramId);
    if (!invited) {
      throw new NotFoundException('User not found');
    }

    // Update user status regardless of referral
    await this.usersService.updateStatus(invited.id, UserStatus.REJOINED);
    await this.usersService.updateActiveStatus(invited.id, true);

    const referral = await this.prisma.referral.findUnique({
      where: { invitedId: invited.id },
    });

    if (!referral) {
      return { message: 'User marked as rejoined (no referral)', userId: invited.id };
    }

    // Update referral - restore active status but don't award new points
    return this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        activeStatus: true,
      },
    });
  }

  async getReferralStats(telegramId: bigint) {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const referrals = await this.prisma.referral.findMany({
      where: { inviterId: user.id },
      include: {
        invited: true,
      },
    });

    const stats = {
      totalInvited: referrals.length,
      joinedChannel: referrals.filter(r => r.joinedAt !== null).length,
      activeMembers: referrals.filter(r => r.activeStatus === true).length,
      leftChannel: referrals.filter(r => r.leftAt !== null).length,
      neverJoined: referrals.filter(r => r.joinedAt === null).length,
      conversionRate: referrals.length > 0 
        ? (referrals.filter(r => r.joinedAt !== null).length / referrals.length * 100).toFixed(2)
        : 0,
    };

    return stats;
  }

  async getReferralsByUser(telegramId: bigint) {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.referral.findMany({
      where: { inviterId: user.id },
      include: {
        invited: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
