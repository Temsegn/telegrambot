# Telegram Referral & Gamification System

A full-stack Telegram referral and gamification system consisting of a Telegram Bot, Telegram Mini App, NestJS backend, Prisma ORM with PostgreSQL (Neon hosted), and a Next.js admin/dashboard frontend.

## Features

- **Telegram Bot**: Entry gateway for users via /start commands and referral deep links
- **Mini App**: User interface for viewing wallet, referrals, points, and analytics
- **Admin Dashboard**: Admin control, analytics, and system monitoring
- **Referral System**: Immutable referral attribution with anti-fraud measures
- **Points & Scoring**: State-based point calculation (5 points for join, 2 bonus for rejoin)
- **Fraud Detection**: Suspicious activity monitoring (rapid join/leave, duplicate attempts)

## Architecture

```
┌─────────────┐
│ Telegram Bot│
│  (Telegraf) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ NestJS API  │
│  Backend    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │
│  (Neon)     │
└─────────────┘
```

## Project Structure

```
.
├── backend/              # NestJS backend API
│   ├── src/
│   │   ├── users/       # User management
│   │   ├── referrals/   # Referral tracking
│   │   ├── events/      # Event logging
│   │   ├── wallet/      # Wallet transactions
│   │   ├── telegram/    # Telegram integration
│   │   └── prisma/      # Database service
│   └── package.json
├── bot/                 # Telegram Bot (Telegraf)
│   ├── src/
│   │   └── index.ts
│   └── package.json
├── mini-app/            # Telegram Mini App (React + Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── admin-dashboard/     # Admin Dashboard (Next.js)
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── package.json
└── prisma/              # Database schema
    └── schema.prisma
```

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Telegram Bot Token (from @BotFather)
- Telegram Channel ID

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database on [Neon](https://neon.tech) or use your own PostgreSQL instance.

### 2. Environment Configuration

Copy the example environment files and fill in your values:

```bash
# Root
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Bot
cp bot/.env.example bot/.env

# Mini App
cp mini-app/.env.example mini-app/.env

# Admin Dashboard
cp admin-dashboard/.env.example admin-dashboard/.env
```

Update the following variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN`: Your bot token from @BotFather
- `TELEGRAM_BOT_USERNAME`: Your bot username
- `TELEGRAM_CHANNEL_ID`: Your Telegram channel ID or username

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Bot
cd ../bot
npm install

# Mini App
cd ../mini-app
npm install

# Admin Dashboard
cd ../admin-dashboard
npm install

# Prisma (from root)
cd ..
npx prisma generate
npx prisma migrate dev
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Start the Services

Start each service in a separate terminal:

```bash
# Backend (Terminal 1)
cd backend
npm run start:dev

# Telegram Bot (Terminal 2)
cd bot
npm run dev

# Mini App (Terminal 3)
cd mini-app
npm run dev

# Admin Dashboard (Terminal 4)
cd admin-dashboard
npm run dev
```

## Usage

### For Users

1. **Start the Bot**: Open your Telegram bot and send `/start`
2. **Join Channel**: Join the required Telegram channel
3. **Open Mini App**: Click the Mini App link in the bot message
4. **View Dashboard**: Check your wallet, referrals, and points
5. **Share Referral Link**: Use your unique referral link to invite friends

### For Admins

1. **Access Dashboard**: Open `http://localhost:3001` in your browser
2. **View Overview**: See total users, points issued, and system stats
3. **Manage Users**: View all users and their referral trees
4. **Check Leaderboard**: See top performers by points
5. **Monitor Fraud**: Review suspicious activity patterns

## Points System

- **+5 points**: When an invited user joins the channel for the first time
- **+2 bonus points**: When the invited user remains active after verification delay
- **No points**: For leaving or rejoining (rejoining restores ACTIVE state but no new points)

## User Status Flow

```
CLICKED_INVITE → STARTED_BOT → JOINED_CHANNEL → ACTIVE_MEMBER
                                              ↓
                                         LEFT_CHANNEL
                                              ↓
                                         REJOINED (restores ACTIVE)
```

## Security Rules

- Telegram bot token must never be exposed in frontend
- Webhook requests must be validated
- One Telegram ID = one system identity
- Referral reassignment is strictly forbidden
- All leaderboard values are derived from validated state

## API Endpoints

### Users
- `GET /users/:telegramId` - Get user by Telegram ID
- `GET /users/leaderboard` - Get global leaderboard
- `GET /users/all` - Get all users (admin)

### Referrals
- `GET /referrals/stats/:telegramId` - Get referral statistics
- `GET /referrals/user/:telegramId` - Get user's referrals
- `POST /referrals/join/:telegramId` - Mark user as joined
- `POST /referrals/leave/:telegramId` - Mark user as left
- `POST /referrals/rejoin/:telegramId` - Mark user as rejoined

### Wallet
- `GET /wallet/transactions/:telegramId` - Get wallet transactions
- `GET /wallet/stats` - Get system wallet stats
- `POST /wallet/credit` - Credit points to user
- `POST /wallet/debit` - Debit points from user

### Telegram
- `POST /telegram/verify/:userId` - Verify channel membership
- `POST /telegram/send-mini-app` - Send Mini App link to user
- `GET /telegram/referral-link/:referralCode` - Get referral link

## Fraud Detection

The system monitors for:
- Rapid join/leave patterns (more than 5 in 24 hours)
- Duplicate referral attempts
- Suspicious referral spikes
- Re-invite abuse attempts

## Deployment

### Backend (NestJS)

```bash
cd backend
npm run build
npm run start:prod
```

### Bot (Telegraf)

```bash
cd bot
npm run build
node dist/index.js
```

### Mini App (Vite)

```bash
cd mini-app
npm run build
# Deploy dist/ folder to your hosting
```

### Admin Dashboard (Next.js)

```bash
cd admin-dashboard
npm run build
npm run start
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings

### Bot Not Responding
- Verify `TELEGRAM_BOT_TOKEN` is valid
- Check bot is not blocked by Telegram
- Ensure webhook is properly set

### Mini App Not Loading
- Verify `VITE_BACKEND_URL` is correct
- Check CORS settings in backend
- Ensure Telegram WebApp script is loaded

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
