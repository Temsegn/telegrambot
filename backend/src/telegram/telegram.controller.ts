import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Post('verify/:userId')
  async verifyMembership(@Param('userId') userId: string) {
    return {
      isMember: await this.telegramService.verifyChannelMembership(BigInt(userId)),
    };
  }

  @Post('send-mini-app')
  async sendMiniAppLink(@Body('userId') userId: string, @Body('miniAppUrl') miniAppUrl: string) {
    await this.telegramService.sendMiniAppLink(BigInt(userId), miniAppUrl);
    return { success: true };
  }

  @Get('referral-link/:referralCode')
  async getReferralLink(@Param('referralCode') referralCode: string) {
    return {
      link: this.telegramService.getReferralLink(referralCode),
    };
  }
}
