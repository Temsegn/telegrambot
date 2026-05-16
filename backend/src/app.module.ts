import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ReferralsModule } from './referrals/referrals.module';
import { EventsModule } from './events/events.module';
import { WalletModule } from './wallet/wallet.module';
import { TelegramModule } from './telegram/telegram.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    ReferralsModule,
    EventsModule,
    WalletModule,
    TelegramModule,
  ],
})
export class AppModule {}
