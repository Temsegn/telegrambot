import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventType } from '@prisma/client';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get('user/:telegramId')
  async getEventsByUser(@Param('telegramId') telegramId: string) {
    return this.eventsService.getEventsByUser(BigInt(telegramId));
  }

  @Get('type/:type')
  async getEventsByType(@Param('type') type: EventType) {
    return this.eventsService.getEventsByType(type);
  }

  @Get('suspicious')
  async detectSuspiciousActivity() {
    return this.eventsService.detectSuspiciousActivity();
  }

  @Post('create')
  async createEvent(@Body('userId') userId: string, @Body('eventType') eventType: EventType, @Body('metadata') metadata?: any) {
    return this.eventsService.createEvent(userId, eventType, metadata);
  }
}
