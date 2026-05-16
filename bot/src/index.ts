import { Telegraf, Context, Markup } from 'telegraf';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || '';

if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is required');

const bot = new Telegraf(BOT_TOKEN);

bot.use((ctx, next) => {
  console.log(`Update from ${ctx.from?.id}: ${ctx.updateType}`);
  return next();
});

// ─── Helper: Main Menu ────────────────────────────────────────────────────────
function mainMenu(botUsername: string) {
  return Markup.inlineKeyboard([
    [Markup.button.webApp('🚀  Open Dashboard', `https://t.me/${botUsername}/app`)],
    [
      Markup.button.callback('🔗  My Referral', 'get_referral'),
      Markup.button.callback('💰  My Points', 'get_points'),
    ],
    [Markup.button.callback('✅  Verify Membership', 'check_membership')],
  ]);
}

// ─── Helper: Fetch user from backend ─────────────────────────────────────────
async function getUser(telegramId: bigint) {
  try {
    const res = await axios.get(`${BACKEND_URL}/users/${telegramId}`, { timeout: 8000 });
    return res.data?.error ? null : res.data;
  } catch { return null; }
}

// ─── Helper: Fetch referral stats ────────────────────────────────────────────
async function getReferralStats(telegramId: bigint) {
  try {
    const res = await axios.get(`${BACKEND_URL}/referrals/stats/${telegramId}`, { timeout: 8000 });
    return res.data;
  } catch { return null; }
}

// ─── /start ──────────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  const telegramId = BigInt(ctx.from.id);
  const username   = ctx.from.username;
  const firstName  = ctx.from.first_name || 'Friend';
  const lastName   = ctx.from.last_name;
  const botUser    = ctx.botInfo.username;

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
        if (inviterRes.data?.telegramId) {
          await axios.post(`${BACKEND_URL}/referrals/create`, {
            inviterTelegramId: inviterRes.data.telegramId,
            invitedTelegramId: telegramId.toString(),
          }, { timeout: 8000 });
        }
      } catch (e) { console.error('Referral processing error:', e); }
    }

    // 3. Fetch user stats
    const user  = await getUser(telegramId);
    const stats = await getReferralStats(telegramId);
    const isMember = await checkChannelMembership(telegramId);

    if (isMember) {
      await axios.post(`${BACKEND_URL}/referrals/join/${telegramId}`).catch(() => {});
    }

    // 4. Build rich welcome message
    const pointsLine  = `💰 *Balance:* ${user?.walletBalance ?? 0} pts`;
    const invitedLine = `👥 *Referrals:* ${stats?.totalInvited ?? 0} friends`;
    const activeLine  = `✅ *Active:* ${stats?.activeMembers ?? 0} members`;

    const welcomeText = isMember
      ? `🎉 *Welcome back, ${firstName}!*\n\n` +
        `${pointsLine}\n${invitedLine}\n${activeLine}\n\n` +
        `Share your referral link to earn more points! 🚀`
      : `👋 *Hey ${firstName}! Welcome to DejenRewards!*\n\n` +
        `To activate your account and start earning points:\n\n` +
        `1️⃣ Tap *Join Channel* below\n` +
        `2️⃣ Once you join, your dashboard unlocks *automatically!* 🎁`;

    const keyboard = isMember
      ? mainMenu(botUser)
      : Markup.inlineKeyboard([
          [Markup.button.url('📢 Join Our Channel', `https://t.me/${CHANNEL_ID?.replace('@', '')}`)],
          [Markup.button.callback('✅ Already Joined? Verify', 'check_membership')],
        ]);

    // 5. Send welcome banner with stats
    try {
      await ctx.replyWithPhoto(
        { url: 'https://placehold.co/800x400/6366f1/ffffff/png?text=DejenRewards+%F0%9F%8F%86' },
        {
          caption: welcomeText,
          parse_mode: 'Markdown',
          ...keyboard,
        }
      );
    } catch {
      await ctx.reply(welcomeText, { parse_mode: 'Markdown', ...keyboard });
    }

  } catch (error) {
    console.error('Error in /start:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
});

// ─── Button: Get Referral ─────────────────────────────────────────────────────
bot.action('get_referral', async (ctx) => {
  await ctx.answerCbQuery();
  const telegramId = BigInt(ctx.from!.id);
  const botUser    = ctx.botInfo.username;

  try {
    const [user, stats] = await Promise.all([
      getUser(telegramId),
      getReferralStats(telegramId),
    ]);

    if (!user) return ctx.reply('❌ User not found. Please send /start first.');

    const referralLink = `https://t.me/${botUser}?start=${user.referralCode}`;
    const shareText    = encodeURIComponent(`💎 Join DejenRewards and earn points!\n\nUse my invite link:`);

    const msg =
      `🔗 *Your Referral Info*\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Balance:*        ${user.walletBalance ?? 0} pts\n` +
      `👥 *Total Invited:* ${stats?.totalInvited ?? 0} friends\n` +
      `✅ *Active Members:* ${stats?.activeMembers ?? 0}\n` +
      `📊 *Conversion:*    ${stats?.conversionRate ?? 0}%\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `📎 *Your Link:*\n\`${referralLink}\`\n\n` +
      `Every active friend earns you *5 points* 🎁`;

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📤 Share Link', `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`)],
        [Markup.button.callback('💰 My Points', 'get_points'), Markup.button.callback('⬅️ Menu', 'main_menu')],
      ]),
    });
  } catch (error) {
    console.error('Error in get_referral:', error);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
});

// ─── Button: Get Points ───────────────────────────────────────────────────────
bot.action('get_points', async (ctx) => {
  await ctx.answerCbQuery();
  const telegramId = BigInt(ctx.from!.id);
  const botUser    = ctx.botInfo.username;

  try {
    const [user, stats] = await Promise.all([
      getUser(telegramId),
      getReferralStats(telegramId),
    ]);

    if (!user) return ctx.reply('❌ User not found. Please send /start first.');

    const rank = user.walletBalance >= 100 ? '🥇 Gold' : user.walletBalance >= 50 ? '🥈 Silver' : '🥉 Bronze';

    const msg =
      `💰 *Your Points Dashboard*\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🏆 *Rank:*           ${rank}\n` +
      `💎 *Balance:*        ${user.walletBalance ?? 0} pts\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👥 *Total Invited:* ${stats?.totalInvited ?? 0}\n` +
      `✅ *Active Refs:*    ${stats?.activeMembers ?? 0}\n` +
      `🚪 *Left Channel:*  ${stats?.leftChannel ?? 0}\n` +
      `📈 *Conversion:*    ${stats?.conversionRate ?? 0}%\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `*How to earn more:*\n` +
      `• Invite friends → +5 pts each\n` +
      `• Stay active → bonus pts\n` +
      `• Climb the leaderboard! 🎯`;

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 Full Dashboard', `https://t.me/${botUser}/app`)],
        [Markup.button.callback('🔗 Get Referral Link', 'get_referral'), Markup.button.callback('⬅️ Menu', 'main_menu')],
      ]),
    });
  } catch (error) {
    console.error('Error in get_points:', error);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
});

// ─── Button: Check Membership ─────────────────────────────────────────────────
bot.action('check_membership', async (ctx) => {
  await ctx.answerCbQuery('Checking membership...');
  const telegramId = BigInt(ctx.from!.id);
  const botUser    = ctx.botInfo.username;

  try {
    const isMember = await checkChannelMembership(telegramId);

    if (isMember) {
      await axios.post(`${BACKEND_URL}/referrals/join/${telegramId}`).catch(() => {});
      const user  = await getUser(telegramId);
      const stats = await getReferralStats(telegramId);

      await ctx.reply(
        `✅ *Membership Verified!*\n\n` +
        `You're an active member of ${CHANNEL_ID}.\n\n` +
        `💰 *Balance:* ${user?.walletBalance ?? 0} pts\n` +
        `👥 *Referrals:* ${stats?.totalInvited ?? 0} friends\n\n` +
        `Keep inviting friends to earn more points! 🎉`,
        { parse_mode: 'Markdown', ...mainMenu(botUser) }
      );
    } else {
      await ctx.reply(
        `❌ *Not a Member Yet*\n\n` +
        `Please join *${CHANNEL_ID}* first, then tap Check Again!`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('📢 Join Channel', `https://t.me/${CHANNEL_ID?.replace('@', '')}`)],
            [Markup.button.callback('🔄 Check Again', 'check_membership')],
          ]),
        }
      );
    }
  } catch (error) {
    console.error('Error in check_membership:', error);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
});

// ─── Button: Back to Menu ─────────────────────────────────────────────────────
bot.action('main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  const botUser   = ctx.botInfo.username;
  const firstName = ctx.from?.first_name || 'Friend';
  await ctx.reply(
    `👋 *Hello, ${firstName}!* What would you like to do?`,
    { parse_mode: 'Markdown', ...mainMenu(botUser) }
  );
});

// ─── /referral command ────────────────────────────────────────────────────────
bot.command('referral', async (ctx) => {
  const telegramId = BigInt(ctx.from.id);
  const botUser    = ctx.botInfo.username;

  try {
    const [user, stats] = await Promise.all([getUser(telegramId), getReferralStats(telegramId)]);
    if (!user) return ctx.reply('❌ Please send /start first.');

    const referralLink = `https://t.me/${botUser}?start=${user.referralCode}`;
    const shareText    = encodeURIComponent('💎 Join DejenRewards and earn points!');

    await ctx.reply(
      `🔗 *Your Referral Info*\n\n` +
      `💰 Balance: *${user.walletBalance ?? 0} pts*\n` +
      `👥 Friends Invited: *${stats?.totalInvited ?? 0}*\n` +
      `✅ Active Members: *${stats?.activeMembers ?? 0}*\n\n` +
      `📎 Your Link:\n\`${referralLink}\``,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('📤 Share', `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`)],
        ]),
      }
    );
  } catch (error) {
    console.error('Error in /referral:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
});

// ─── /check command ───────────────────────────────────────────────────────────
bot.command('check', async (ctx) => {
  const telegramId = BigInt(ctx.from.id);
  const botUser    = ctx.botInfo.username;
  const isMember   = await checkChannelMembership(telegramId);

  if (isMember) {
    await axios.post(`${BACKEND_URL}/referrals/join/${telegramId}`).catch(() => {});
    await ctx.reply('✅ *Membership verified! Your account is active.* 🎉', {
      parse_mode: 'Markdown', ...mainMenu(botUser),
    });
  } else {
    await ctx.reply(
      `❌ You haven't joined ${CHANNEL_ID} yet.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('📢 Join Channel', `https://t.me/${CHANNEL_ID?.replace('@', '')}`)],
          [Markup.button.callback('✅ Check Again', 'check_membership')],
        ]),
      }
    );
  }
});

// ─── /help command ────────────────────────────────────────────────────────────
bot.help((ctx) => {
  ctx.reply(
    `📖 *Commands:*\n\n/start - Start & see your dashboard\n/referral - Get your referral link & stats\n/check - Verify channel membership\n/help - Show this menu`,
    { parse_mode: 'Markdown', ...mainMenu(ctx.botInfo.username) }
  );
});

// ─── Channel member updates ───────────────────────────────────────────────────
bot.on('chat_member', async (ctx) => {
  const { new_chat_member, old_chat_member } = ctx.chatMember;
  const telegramId = BigInt(new_chat_member.user.id);
  const tgUser     = new_chat_member.user;
  const oldStatus  = old_chat_member.status;
  const newStatus  = new_chat_member.status;

  try {
    if (oldStatus === 'left' && ['member', 'administrator', 'creator'].includes(newStatus)) {
      // ── User just joined ──────────────────────────────────────────────────
      await axios.post(`${BACKEND_URL}/referrals/join/${telegramId}`).catch(() => {});
      console.log(`✅ User ${telegramId} joined the channel`);

      // Fetch their stats and send automatic dashboard message
      const [user, stats] = await Promise.all([
        getUser(telegramId),
        getReferralStats(telegramId),
      ]);

      const botUser      = ctx.botInfo.username;
      const firstName    = tgUser.first_name || 'Friend';
      const referralLink = user?.referralCode ? `https://t.me/${botUser}?start=${user.referralCode}` : null;
      const balance      = user?.walletBalance ?? 0;
      const totalInvited = stats?.totalInvited ?? 0;
      const activeRefs   = stats?.activeMembers ?? 0;
      const rank         = balance >= 100 ? '🥇 Gold' : balance >= 50 ? '🥈 Silver' : '🥉 Bronze';

      const msg =
        `🎊 *Welcome to DejenRewards, ${firstName}!*\n\n` +
        `Your account is now *active*! Here's your dashboard:\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🏆 *Rank:*           ${rank}\n` +
        `💰 *Balance:*        ${balance} pts\n` +
        `👥 *Referrals:*      ${totalInvited} friends\n` +
        `✅ *Active Members:* ${activeRefs}\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        (referralLink ? `📎 *Your Referral Link:*\n\`${referralLink}\`\n\n` : '') +
        `Share your link to earn *5 pts* per active friend! 🚀`;

      const keyboard = referralLink
        ? Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Open Dashboard', `https://t.me/${botUser}/app`)],
            [Markup.button.url('📤 Share Referral Link', `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join DejenRewards!')}`)],
            [Markup.button.callback('💰 My Points', 'get_points'), Markup.button.callback('🔗 My Referral', 'get_referral')],
          ])
        : mainMenu(botUser);

      // Send message directly to the user's DM
      await ctx.telegram.sendMessage(Number(telegramId), msg, {
        parse_mode: 'Markdown',
        ...keyboard,
      }).catch(err => console.warn('Could not DM user:', err.message));

    } else if (['member', 'administrator', 'creator'].includes(oldStatus) && newStatus === 'left') {
      // ── User left ─────────────────────────────────────────────────────────
      await axios.post(`${BACKEND_URL}/referrals/leave/${telegramId}`).catch(() => {});
      console.log(`🚪 User ${telegramId} left the channel`);
    }
  } catch (error) {
    console.error('Error processing chat member update:', error);
  }
});

// ─── Helper: Check channel membership ────────────────────────────────────────
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
    if (desc.includes('member list is inaccessible')) {
      console.warn('⚠️  Add bot as admin in channel to check memberships.');
      return false;
    }
    if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(error.code)) {
      console.warn('⚠️  Network error checking membership:', error.code);
      return false;
    }
    return false;
  }
}

// ─── Launch ───────────────────────────────────────────────────────────────────
bot.launch().then(() => console.log('🤖 Bot launched!'));
process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
