import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TelegramService {
  private botToken: string;
  private channelId: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.channelId = this.configService.get<string>('TELEGRAM_CHANNEL_ID');
  }

  async verifyChannelMembership(userId: bigint): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.telegram.org/bot${this.botToken}/getChatMember`,
          {
            params: {
              chat_id: this.channelId,
              user_id: userId.toString(),
            },
          }
        )
      );

      const memberStatus = response.data.result.status;
      return ['member', 'administrator', 'creator'].includes(memberStatus);
    } catch (error) {
      console.error('Error verifying channel membership:', error);
      return false;
    }
  }

  async sendMiniAppLink(userId: bigint, miniAppUrl: string) {
    try {
      await firstValueFrom(
        this.httpService.post(
          `https://api.telegram.org/bot${this.botToken}/sendMessage`,
          {
            chat_id: userId.toString(),
            text: `🎉 Welcome! Open the Mini App to view your dashboard and rewards:\n${miniAppUrl}`,
            parse_mode: 'HTML',
          }
        )
      );
    } catch (error) {
      console.error('Error sending Mini App link:', error);
    }
  }

  async sendMessage(userId: bigint, text: string) {
    try {
      await firstValueFrom(
        this.httpService.post(
          `https://api.telegram.org/bot${this.botToken}/sendMessage`,
          {
            chat_id: userId.toString(),
            text,
            parse_mode: 'HTML',
          }
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  getReferralLink(referralCode: string): string {
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');
    return `https://t.me/${botUsername}?start=${referralCode}`;
  }
}
