import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventType } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async createEvent(userId: string, eventType: EventType, metadata?: any) {
    return this.prisma.event.create({
      data: {
        userId,
        eventType,
        metadata: metadata || {},
      },
    });
  }

  async getEventsByUser(telegramId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      return null;
    }

    return this.prisma.event.findMany({
      where: { userId: user.id },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async getEventsByType(eventType: EventType, limit = 100) {
    return this.prisma.event.findMany({
      where: { eventType },
      take: limit,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        user: true,
      },
    });
  }

  async detectSuspiciousActivity() {
    // Detect rapid join/leave patterns
    const recentEvents = await this.prisma.event.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        user: true,
      },
    });

    const suspiciousUsers = new Map();

    recentEvents.forEach(event => {
      const userId = event.userId;
      if (!suspiciousUsers.has(userId)) {
        suspiciousUsers.set(userId, []);
      }
      suspiciousUsers.get(userId).push(event);
    });

    const flaggedUsers = [];

    suspiciousUsers.forEach((events, userId) => {
      const joinLeaveCount = events.filter(
        e => e.eventType === EventType.JOINED || e.eventType === EventType.LEFT
      ).length;

      if (joinLeaveCount > 5) {
        flaggedUsers.push({
          userId,
          joinLeaveCount,
          events: events.length,
        });
      }
    });

    return flaggedUsers;
  }
}
