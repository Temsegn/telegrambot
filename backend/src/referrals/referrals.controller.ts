import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get('stats/:telegramId')
  async getReferralStats(@Param('telegramId') telegramId: string) {
    return this.referralsService.getReferralStats(BigInt(telegramId));
  }

  @Get('user/:telegramId')
  async getReferralsByUser(@Param('telegramId') telegramId: string) {
    return this.referralsService.getReferralsByUser(BigInt(telegramId));
  }

  @Post('create')
  async createReferral(@Body() body: { inviterTelegramId: string, invitedTelegramId: string }) {
    return this.referralsService.createReferral(
      BigInt(body.inviterTelegramId),
      BigInt(body.invitedTelegramId),
    );
  }

  @Post('join/:telegramId')
  async markAsJoined(@Param('telegramId') telegramId: string) {
    return this.referralsService.markAsJoined(BigInt(telegramId));
  }

  @Post('leave/:telegramId')
  async markAsLeft(@Param('telegramId') telegramId: string) {
    return this.referralsService.markAsLeft(BigInt(telegramId));
  }

  @Post('rejoin/:telegramId')
  async markAsRejoined(@Param('telegramId') telegramId: string) {
    return this.referralsService.markAsRejoined(BigInt(telegramId));
  }
}
