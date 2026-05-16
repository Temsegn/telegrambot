import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TransactionType } from '@prisma/client';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('transactions/:telegramId')
  async getWalletTransactions(@Param('telegramId') telegramId: string) {
    return this.walletService.getWalletTransactions(BigInt(telegramId));
  }

  @Get('stats')
  async getSystemStats() {
    return this.walletService.getSystemStats();
  }

  @Post('credit')
  async creditPoints(@Body('userId') userId: string, @Body('amount') amount: number, @Body('reason') reason: string) {
    return this.walletService.creditPoints(userId, amount, reason);
  }

  @Post('debit')
  async debitPoints(@Body('userId') userId: string, @Body('amount') amount: number, @Body('reason') reason: string) {
    return this.walletService.debitPoints(userId, amount, reason);
  }
}
