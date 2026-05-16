import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';
import * as path from 'path';

// ── Hardcoded config for testing ──────────────────────────────────────────────
const BOT_TOKEN = '8878260053:AAFnUgkU_hjJRedU2SJq_a81proq7gwvB0U';
const BACKEND_URL = 'https://telegrambot-backend-37gb.onrender.com';
const CHANNEL_ID = '@userdejendejen';
const MINI_APP_URL = 'https://telegrambot-1-b7u3.onrender.com';
// ─────────────────────────────────────────────────────────────────────────────

const bot = new Telegraf(BOT_TOKEN);
const WELCOME_IMG = path.resolve(__dirname, '../assets/welcome.png');

// --- Health Check Server — must always bind for Render web service ---
const http = require('http');
const PORT = 10000;
http.createServer((req: any, res: any) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!');
}).listen(PORT, () => {
  console.log(`✅ Health check server listening on port ${PORT}`);
});
// -------------------------------------------------------------------

bot.use((ctx, next) => {
  console.log(`Update from ${ctx.from?.id}: ${ctx.updateType}`);
  return next();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getUser(telegramId: bigint) {
  try {
    const res = await axios.get(`${BACKEND_URL}/users/${telegramId}`, { timeout: 8000 });
    return res.data?.error ? null : res.data;
  } catch { return null; }
}

async function getReferralStats(telegramId: bigint) {
  try {
    const res = await axios.get(`${BACKEND_URL}/referrals/stats/${telegramId}`, { timeout: 8000 });
    return res.data;
  } catch { return null; }
}

async function checkChannelMembership(userId: bigint): Promise<boolean> {
  if (!CHANNEL_ID) return true;
  try {
    const res = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
      { params: { chat_id: CHANNEL_ID, user_id: userId.toString() }, timeout: 10000 }
    );
    return ['member', 'administrator', 'creator'].includes(res.data.result?.status);
  } catch (error: any) {
    const desc = error?.response?.data?.description || '';
    if (desc.includes('member list is inaccessible'))
      console.warn('⚠️  Add bot as admin in channel to check memberships.');
    else if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(error.code))
      console.warn('⚠️  Network error:', error.code);
    return false;
  }
}

function getRank(balance: number) {
  if (balance >= 100) return '🥇 Gold';
  if (balance >= 50) return '🥈 Silver';
  if (balance >= 10) return '🥉 Bronze';
  return '🌱 Starter';
}

// ─── /start ──────────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  const telegramId = BigInt(ctx.from.id);
  const username = ctx.from.username;
  const firstName = ctx.from.first_name || 'Friend';
  const lastName = ctx.from.last_name;
  const botUser = ctx.botInfo.username;

  const referralCode = ctx.message.text.split(' ')[1];

  try {
    // 1. Register / get user
    await axios.post(`${BACKEND_URL}/users`, {
      telegramId: telegramId.toString(), username, firstName, lastName,
    }, { timeout: 8000 });

    // 2. Handle referral code
    if (referralCode) {
      try {
        const inviterRes = await axios.get(`${BACKEND_URL}/users/referral/${referralCode}`, { timeout: 8000 });
        const inviterId = inviterRes.data?.telegramId;
        // Prevent self-referral
        if (inviterId && inviterId !== telegramId.toString()) {
          await axios.post(`${BACKEND_URL}/referrals/create`, {
            inviterTelegramId: inviterId,
            invitedTelegramId: telegramId.toString(),
          }, { timeout: 8000 });
        }
      } catch (e) { console.error('Referral error:', e); }
    }

    // 3. Fetch stats
    const user = await getUser(telegramId);
    const stats = await getReferralStats(telegramId);
    const isMember = await checkChannelMembership(telegramId);

    if (isMember) {
      await axios.post(`${BACKEND_URL}/referrals/join/${telegramId}`).catch(() => { });
    }

    const balance = user?.walletBalance ?? 0;
    const totalInvited = stats?.totalInvited ?? 0;
    const activeRefs = stats?.activeMembers ?? 0;
    const rank = getRank(balance);
    const refLink = user?.referralCode
      ? `https://t.me/${botUser}?start=${user.referralCode}`
      : null;

    // 4. Build message — everything in one view
    const caption = isMember
      ? `🎉 *Welcome back, ${firstName}!*\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🏆 Rank:  ${rank}\n` +
      `💰 Balance:  ${balance} pts\n` +
      `👥 Referrals:  ${totalInvited} friends\n` +
      `✅ Active:  ${activeRefs} members\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      (refLink ? `🔗 *Your Referral Link:*\n\`${refLink}\`\n\n` : '') +
      `Share & earn *5 pts* per friend! 🚀`

      : `👋 *Welcome to DejenRewards, ${firstName}!*\n\n` +
      `Join our channel to activate your account\n` +
      `and start earning rewards! 🎁`;

    // 5. Buttons — all actions, no check button
    const shareText = refLink ? encodeURIComponent(`💎 Join DejenRewards and earn points!\n${refLink}`) : '';

    const channelUrl = CHANNEL_ID ? `https://t.me/${CHANNEL_ID.replace('@', '')}` : null;

    const buttons = isMember
      ? Markup.inlineKeyboard([
        ...(channelUrl ? [[Markup.button.url('📢 Join Channel', channelUrl)]] : []),
        ...(MINI_APP_URL ? [[Markup.button.webApp('🚀 Open Mini App', MINI_APP_URL)]] : []),
        [Markup.button.callback('💰 My Balance', 'show_balance')],
        ...(refLink ? [[Markup.button.url('📤 Share Referral Link', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}`)]] : []),
      ])
      : Markup.inlineKeyboard([
        ...(channelUrl ? [[Markup.button.url('📢 Join Channel', channelUrl)]] : []),
        ...(MINI_APP_URL ? [[Markup.button.webApp('🚀 Open Mini App', MINI_APP_URL)]] : []),
      ]);

    // 6. Send with image
    try {
      await ctx.replyWithPhoto(
        { source: WELCOME_IMG },
        { caption, parse_mode: 'Markdown', ...buttons }
      );
    } catch {
      // Fallback: try URL placeholder
      try {
        await ctx.replyWithPhoto(
          { url: 'https://placehold.co/800x400/6366f1/ffffff/png?text=DejenRewards' },
          { caption, parse_mode: 'Markdown', ...buttons }
        );
      } catch {
        await ctx.reply(caption, { parse_mode: 'Markdown', ...buttons });
      }
    }

  } catch (error) {
    console.error('Error in /start:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
});

// ─── Button: Show Balance ─────────────────────────────────────────────────────
bot.action('show_balance', async (ctx) => {
  await ctx.answerCbQuery();
  const telegramId = BigInt(ctx.from!.id);
  const botUser = ctx.botInfo.username;

  const [user, stats] = await Promise.all([getUser(telegramId), getReferralStats(telegramId)]);

  if (!user) return ctx.reply('❌ Not registered. Send /start first.');

  const balance = user.walletBalance ?? 0;
  const rank = getRank(balance);
  const refLink = `https://t.me/${botUser}?start=${user.referralCode}`;

  const msg =
    `💰 *Your Balance*\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🏆 Rank:         ${rank}\n` +
    `💎 Points:       ${balance} pts\n` +
    `👥 Invited:      ${stats?.totalInvited ?? 0}\n` +
    `✅ Active Refs:  ${stats?.activeMembers ?? 0}\n` +
    `📊 Conversion:   ${stats?.conversionRate ?? 0}%\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `*How to earn:*\n` +
    `• Invite friends → +5 pts each\n` +
    `• Keep friends active → bonus pts\n\n` +
    `🔗 *Your Link:*\n\`${refLink}\``;

  const shareText = encodeURIComponent(`💎 Join DejenRewards!\n${refLink}`);

  await ctx.reply(msg, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.url('📤 Share Referral Link', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}`)],
      ...(MINI_APP_URL ? [[Markup.button.webApp('🚀 Open Mini App', MINI_APP_URL)]] : []),
    ]),
  });
});

// ─── /referral command ────────────────────────────────────────────────────────
bot.command('referral', async (ctx) => {
  const telegramId = BigInt(ctx.from.id);
  const botUser = ctx.botInfo.username;
  const user = await getUser(telegramId);

  if (!user) return ctx.reply('❌ Send /start first.');

  const refLink = `https://t.me/${botUser}?start=${user.referralCode}`;
  const stats = await getReferralStats(telegramId);
  const shareText = encodeURIComponent(`💎 Join DejenRewards!\n${refLink}`);

  await ctx.reply(
    `🔗 *Your Referral Link*\n\n` +
    `\`${refLink}\`\n\n` +
    `💰 Balance: *${user.walletBalance ?? 0} pts*\n` +
    `👥 Invited: *${stats?.totalInvited ?? 0}*\n` +
    `✅ Active: *${stats?.activeMembers ?? 0}*`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📤 Share', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}`)],
      ]),
    }
  );
});

// ─── /help command ────────────────────────────────────────────────────────────
bot.help((ctx) => {
  const botUser = ctx.botInfo.username;
  ctx.reply(
    `📖 *Commands:*\n\n` +
    `/start — Dashboard & stats\n` +
    `/referral — Your referral link\n` +
    `/help — This menu`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        ...(CHANNEL_ID ? [[Markup.button.url('📢 Join Channel', `https://t.me/${CHANNEL_ID.replace('@', '')}`)]] : []),
        ...(MINI_APP_URL ? [[Markup.button.webApp('🚀 Open Mini App', MINI_APP_URL)]] : []),
      ]),
    }
  );
});

// ─── Channel member updates ───────────────────────────────────────────────────
bot.on('chat_member', async (ctx) => {
  const { new_chat_member, old_chat_member } = ctx.chatMember;
  const telegramId = BigInt(new_chat_member.user.id);
  const tgUser = new_chat_member.user;
  const oldStatus = old_chat_member.status;
  const newStatus = new_chat_member.status;

  try {
    if (oldStatus === 'left' && ['member', 'administrator', 'creator'].includes(newStatus)) {
      // User just joined
      let isRejoin = false;
      try {
        const joinRes = await axios.post(`${BACKEND_URL}/referrals/join/${telegramId}`);
        if (joinRes.data && joinRes.data.isRejoin) {
          isRejoin = true;
        }
      } catch (err) { }
      console.log(`✅ User ${telegramId} joined the channel (rejoin: ${isRejoin})`);

      const [user, stats] = await Promise.all([getUser(telegramId), getReferralStats(telegramId)]);
      const botUser = ctx.botInfo.username;
      const firstName = tgUser.first_name || 'Friend';
      const balance = user?.walletBalance ?? 0;
      const totalInvited = stats?.totalInvited ?? 0;
      const activeRefs = stats?.activeMembers ?? 0;
      const rank = getRank(balance);
      const refLink = user?.referralCode ? `https://t.me/${botUser}?start=${user.referralCode}` : null;
      const shareText = refLink ? encodeURIComponent(`💎 Join DejenRewards!\n${refLink}`) : '';

      const msg =
        (isRejoin ? `🎊 *Welcome back, ${firstName}!*\n\n` : `🎊 *Welcome, ${firstName}!*\n\n`) +
        `Your account is now *active*!\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🏆 Rank:  ${rank}\n` +
        `💰 Balance:  ${balance} pts\n` +
        `👥 Referrals:  ${totalInvited}\n` +
        `✅ Active:  ${activeRefs}\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        (refLink ? `🔗 *Your Referral Link:*\n\`${refLink}\`\n\n` : '') +
        `Share & earn *5 pts* per friend! 🚀`;

      await ctx.telegram.sendMessage(Number(telegramId), msg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          ...(CHANNEL_ID ? [[Markup.button.url('📢 Join Channel', `https://t.me/${CHANNEL_ID.replace('@', '')}`)]] : []),
          ...(MINI_APP_URL ? [[Markup.button.webApp('🚀 Open Mini App', MINI_APP_URL)]] : []),
          [Markup.button.callback('💰 My Balance', 'show_balance')],
          ...(refLink ? [[Markup.button.url('📤 Share Referral Link', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}`)]] : []),
        ]),
      }).catch(err => console.warn('Could not DM user:', err.message));

    } else if (['member', 'administrator', 'creator'].includes(oldStatus) && newStatus === 'left') {
      await axios.post(`${BACKEND_URL}/referrals/leave/${telegramId}`).catch(() => { });
      console.log(`🚪 User ${telegramId} left the channel`);
    }
  } catch (error) {
    console.error('Error processing chat member update:', error);
  }
});

// ─── Launch ───────────────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

bot.launch({
  allowedUpdates: ['message', 'callback_query', 'chat_member'],
}).then(() => {
  console.log('🤖 Bot launched successfully!');
}).catch((err) => {
  console.error('❌ Failed to launch bot:', err);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
