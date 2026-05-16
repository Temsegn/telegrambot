import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserStatus } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  async createUser(@Body() body: { telegramId: string, username?: string, firstName?: string, lastName?: string }) {
    const id = BigInt(body.telegramId);
    const user = await this.usersService.create(id, body.username, body.firstName, body.lastName);
    return { ...user, telegramId: user.telegramId.toString() };
  }

  @Get('referral/:code')
  async getUserByReferralCode(@Param('code') code: string) {
    const user = await this.usersService.findByReferralCode(code);
    if (!user) return { error: 'User not found' };
    return { ...user, telegramId: user.telegramId.toString() };
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }

  @Get('all')
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':telegramId')
  async getUser(@Param('telegramId') telegramId: string) {
    const id = BigInt(telegramId);
    const user = await this.usersService.findByTelegramId(id);
    if (!user) return { error: 'User not found' };
    return { ...user, telegramId: user.telegramId.toString() };
  }

  @Post(':telegramId/status')
  async updateStatus(@Param('telegramId') telegramId: string, @Body('status') status: UserStatus) {
    const user = await this.usersService.findByTelegramId(BigInt(telegramId));
    if (!user) {
      return { error: 'User not found' };
    }
    return this.usersService.updateStatus(user.id, status);
  }
}
