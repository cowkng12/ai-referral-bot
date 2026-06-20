const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('BOT_TOKEN is required. Copy .env.example to .env and set your token.');
  process.exit(1);
}

const adminIds = (process.env.ADMIN_IDS || '')
  .split(',')
  .map((id) => Number(id.trim()))
  .filter(Boolean);
const shopUrl = process.env.SHOP_URL || '';
const supportUrl = process.env.SUPPORT_URL || '';
const mainChannelUrl = process.env.MAIN_CHANNEL_URL || '';
const mainChannelUsername = process.env.MAIN_CHANNEL_USERNAME || '';

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'db.json');
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseStateTable = process.env.SUPABASE_STATE_TABLE || 'app_state';
const supabaseStateKey = process.env.SUPABASE_STATE_KEY || 'bot';
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } })
  : null;

const translations = {
  ru: {
    profile: '👤 Профиль',
    redeem: '🎁 Обмен',
    myLink: '🔗 Моя ссылка',
    progress: '📊 Прогресс',
    store: '🛍 Магазин',
    support: '💬 Поддержка',
    mainChannel: '📣 Основной канал',
    changeLanguage: '🌍 Сменить язык',
    servicePrice: ({ price }) => `${price} балл.`,
    newReferral: ({ name, points }) => `Новый реферал: ${name}. Начислен 1 балл.\nБаланс: ${points} балл.`,
    subscribeButton: '📣 Подписаться на канал',
    checkSubscriptionButton: '✅ Я подписался',
    subscribeRequired: 'Чтобы пользоваться ботом, подпишись на наш канал Omni Key, затем нажми "Я подписался".',
    balance: ({ points, referrals }) => `Баланс: ${points} балл.\nРефералов: ${referrals}.`,
    profileText: ({ name, id, points, referrals }) => `👤 Профиль\n\nПользователь: ${name}\nID: ${id}\nБаланс: ${points} балл.\nРефералов: ${referrals}`,
    progressText: ({ points, referrals }) => `📊 Прогресс\n\nБаллы: ${points}\nПриглашено друзей: ${referrals}`,
    redeemText: ({ services }) => `🎁 Обмен\n\nВыбери сервис для обмена баллов:\n\n${services}`,
    supportText: '💬 Поддержка\n\nПо всем вопросам рекомендуем обращаться в поддержку: @OmniKeySUPPORT',
    channelText: ({ url }) => (url ? `📣 Основной канал: ${url}` : '📣 Основной канал пока не настроен.'),
    storeText: ({ url }) => `🛍 Магазин\n\nНаш магазин по продаже ИИ-сервисов: @OminiKey_bot\n${url}`,
    chooseLanguage: 'Выберите язык / Choose language / 选择语言:',
    referralLink: ({ link }) => `🔗 Моя ссылка\n\n${link}\n\nЗа каждого нового приглашенного ты получаешь 1 балл.`,
    adminOnly: 'Команда доступна только администратору.',
    adminHelp: 'Админ-команды:\n/addpoints USER_ID AMOUNT - выдать баллы пользователю',
    addPointsUsage: 'Использование: /addpoints USER_ID AMOUNT',
    pointsAdded: ({ amount, name, points }) => `Начислено ${amount} балл. пользователю ${name}. Баланс: ${points} балл.`,
    welcome: 'Привет! Приглашай людей по своей ссылке и получай 1 балл за каждого нового реферала. Баллы можно обменять на подписку.',
    done: 'Готово.',
    subscriptionConfirmed: 'Подписка подтверждена.',
    subscriptionMissing: 'Подписка не найдена.',
    subscribeAgain: 'Сначала подпишись на канал, затем нажми "Я подписался" еще раз.',
    serviceMissing: 'Сервис не найден.',
    notEnoughPoints: 'Недостаточно баллов.',
    notEnoughPointsText: ({ price, points }) => `Нужно ${price} балл., у тебя ${points}.`,
    purchaseCreated: 'Покупка создана.',
    purchaseText: ({ title, points }) => `Покупка оформлена: ${title}. Остаток: ${points} балл. Администратор скоро выдаст доступ.`,
    adminPurchase: ({ id, name, userId, title, price }) => `Новая покупка #${id}\nПользователь: ${name} (${userId})\nСервис: ${title}\nЦена: ${price}`,
    help: 'Команды: /start, /balance, /link, /shop. Пригласи друга по ссылке и получи 1 балл после его первого запуска бота.',
    services: {
      chatgpt: 'Подписка ChatGPT Plus.',
      claude: 'Подписка Claude Pro.',
      cursor: 'Подписка Cursor Pro для разработки.',
      gemini: 'Доступ к расширенным возможностям Gemini.',
      perplexity: 'Подписка Perplexity Pro для поиска и исследований.',
      midjourney: 'Доступ к генерации изображений Midjourney.',
      runway: 'Доступ к AI-инструментам для видео.',
      elevenlabs: 'Доступ к AI-озвучке и голосам.',
      notion: 'Подписка Notion AI для работы с текстами.',
      pro_pack: 'Пакет премиум AI-сервисов.'
    }
  },
  en: {
    profile: '👤 Profile',
    redeem: '🎁 Redeem',
    myLink: '🔗 My Link',
    progress: '📊 Progress',
    store: '🛍 Store',
    support: '💬 Support',
    mainChannel: '📣 Main Channel',
    changeLanguage: '🌍 Change Language',
    servicePrice: ({ price }) => `${price} pts`,
    newReferral: ({ name, points }) => `New referral: ${name}. Added 1 point.\nBalance: ${points} pts.`,
    subscribeButton: '📣 Subscribe to channel',
    checkSubscriptionButton: '✅ I subscribed',
    subscribeRequired: 'To use the bot, subscribe to our Omni Key channel, then tap "I subscribed".',
    balance: ({ points, referrals }) => `Balance: ${points} pts.\nReferrals: ${referrals}.`,
    profileText: ({ name, id, points, referrals }) => `👤 Profile\n\nUser: ${name}\nID: ${id}\nBalance: ${points} pts.\nReferrals: ${referrals}`,
    progressText: ({ points, referrals }) => `📊 Progress\n\nPoints: ${points}\nFriends invited: ${referrals}`,
    redeemText: ({ services }) => `🎁 Redeem\n\nChoose a service to exchange points:\n\n${services}`,
    supportText: '💬 Support\n\nFor any questions, contact support: @OmniKeySUPPORT',
    channelText: ({ url }) => (url ? `📣 Main Channel: ${url}` : '📣 Main Channel is not configured yet.'),
    storeText: ({ url }) => `🛍 Store\n\nOur AI services store: @OminiKey_bot\n${url}`,
    chooseLanguage: 'Выберите язык / Choose language / 选择语言:',
    referralLink: ({ link }) => `🔗 My Link\n\n${link}\n\nYou get 1 point for each new invited user.`,
    adminOnly: 'This command is available only to administrators.',
    adminHelp: 'Admin commands:\n/addpoints USER_ID AMOUNT - add points to a user',
    addPointsUsage: 'Usage: /addpoints USER_ID AMOUNT',
    pointsAdded: ({ amount, name, points }) => `Added ${amount} pts to ${name}. Balance: ${points} pts.`,
    welcome: 'Hi! Invite people with your link and get 1 point for each new referral. Points can be exchanged for a subscription.',
    done: 'Done.',
    subscriptionConfirmed: 'Subscription confirmed.',
    subscriptionMissing: 'Subscription not found.',
    subscribeAgain: 'Subscribe to the channel first, then tap "I subscribed" again.',
    serviceMissing: 'Service not found.',
    notEnoughPoints: 'Not enough points.',
    notEnoughPointsText: ({ price, points }) => `You need ${price} pts, you have ${points}.`,
    purchaseCreated: 'Purchase created.',
    purchaseText: ({ title, points }) => `Purchase created: ${title}. Remaining balance: ${points} pts. An administrator will provide access soon.`,
    adminPurchase: ({ id, name, userId, title, price }) => `New purchase #${id}\nUser: ${name} (${userId})\nService: ${title}\nPrice: ${price}`,
    help: 'Commands: /start, /balance, /link, /shop. Invite a friend with your link and get 1 point after their first bot launch.',
    services: {
      chatgpt: 'ChatGPT Plus subscription.',
      claude: 'Claude Pro subscription.',
      cursor: 'Cursor Pro subscription for development.',
      gemini: 'Access to advanced Gemini features.',
      perplexity: 'Perplexity Pro subscription for search and research.',
      midjourney: 'Access to Midjourney image generation.',
      runway: 'Access to AI tools for video.',
      elevenlabs: 'Access to AI voiceover and voices.',
      notion: 'Notion AI subscription for working with text.',
      pro_pack: 'Premium AI services package.'
    }
  },
  zh: {
    profile: '👤 个人资料',
    redeem: '🎁 兑换',
    myLink: '🔗 我的链接',
    progress: '📊 进度',
    store: '🛍 商店',
    support: '💬 支持',
    mainChannel: '📣 主频道',
    changeLanguage: '🌍 更改语言',
    servicePrice: ({ price }) => `${price} 积分`,
    newReferral: ({ name, points }) => `新的推荐用户：${name}。已增加 1 积分。\n余额：${points} 积分。`,
    subscribeButton: '📣 订阅频道',
    checkSubscriptionButton: '✅ 我已订阅',
    subscribeRequired: '要使用机器人，请先订阅 Omni Key 频道，然后点击“我已订阅”。',
    balance: ({ points, referrals }) => `余额：${points} 积分。\n推荐人数：${referrals}。`,
    profileText: ({ name, id, points, referrals }) => `👤 个人资料\n\n用户：${name}\nID：${id}\n余额：${points} 积分。\n推荐人数：${referrals}`,
    progressText: ({ points, referrals }) => `📊 进度\n\n积分：${points}\n已邀请好友：${referrals}`,
    redeemText: ({ services }) => `🎁 兑换\n\n选择要兑换的服务：\n\n${services}`,
    supportText: '💬 支持\n\n如有问题，请联系支持：@OmniKeySUPPORT',
    channelText: ({ url }) => (url ? `📣 主频道：${url}` : '📣 主频道尚未配置。'),
    storeText: ({ url }) => `🛍 商店\n\n我们的 AI 服务商店：@OminiKey_bot\n${url}`,
    chooseLanguage: 'Выберите язык / Choose language / 选择语言:',
    referralLink: ({ link }) => `🔗 我的链接\n\n${link}\n\n每邀请一个新用户，你将获得 1 积分。`,
    adminOnly: '此命令仅管理员可用。',
    adminHelp: '管理员命令：\n/addpoints USER_ID AMOUNT - 给用户添加积分',
    addPointsUsage: '用法：/addpoints USER_ID AMOUNT',
    pointsAdded: ({ amount, name, points }) => `已给 ${name} 增加 ${amount} 积分。余额：${points} 积分。`,
    welcome: '你好！通过你的链接邀请用户，每个新推荐用户可获得 1 积分。积分可以兑换订阅。',
    done: '完成。',
    subscriptionConfirmed: '订阅已确认。',
    subscriptionMissing: '未找到订阅。',
    subscribeAgain: '请先订阅频道，然后再次点击“我已订阅”。',
    serviceMissing: '未找到服务。',
    notEnoughPoints: '积分不足。',
    notEnoughPointsText: ({ price, points }) => `需要 ${price} 积分，你有 ${points}。`,
    purchaseCreated: '购买已创建。',
    purchaseText: ({ title, points }) => `购买已创建：${title}。剩余余额：${points} 积分。管理员很快会提供访问权限。`,
    adminPurchase: ({ id, name, userId, title, price }) => `新购买 #${id}\n用户：${name} (${userId})\n服务：${title}\n价格：${price}`,
    help: '命令：/start, /balance, /link, /shop。通过链接邀请好友，在他们首次启动机器人后获得 1 积分。',
    services: {
      chatgpt: 'ChatGPT Plus 订阅。',
      claude: 'Claude Pro 订阅。',
      cursor: '用于开发的 Cursor Pro 订阅。',
      gemini: '访问 Gemini 高级功能。',
      perplexity: '用于搜索和研究的 Perplexity Pro 订阅。',
      midjourney: '访问 Midjourney 图像生成。',
      runway: '访问用于视频的 AI 工具。',
      elevenlabs: '访问 AI 配音和语音。',
      notion: '用于文本工作的 Notion AI 订阅。',
      pro_pack: '高级 AI 服务套餐。'
    }
  }
};

const defaultDb = {
  users: {},
  purchases: [],
  services: [
    {
      id: 'chatgpt',
      title: 'ChatGPT Plus',
      price: 3,
      description: 'Подписка ChatGPT Plus.'
    },
    {
      id: 'claude',
      title: 'Claude Pro',
      price: 5,
      description: 'Подписка Claude Pro.'
    },
    {
      id: 'cursor',
      title: 'Cursor Pro',
      price: 10,
      description: 'Подписка Cursor Pro для разработки.'
    },
    {
      id: 'gemini',
      title: 'Gemini Advanced',
      price: 15,
      description: 'Доступ к расширенным возможностям Gemini.'
    },
    {
      id: 'perplexity',
      title: 'Perplexity Pro',
      price: 20,
      description: 'Подписка Perplexity Pro для поиска и исследований.'
    },
    {
      id: 'midjourney',
      title: 'Midjourney',
      price: 25,
      description: 'Доступ к генерации изображений Midjourney.'
    },
    {
      id: 'runway',
      title: 'Runway AI',
      price: 30,
      description: 'Доступ к AI-инструментам для видео.'
    },
    {
      id: 'elevenlabs',
      title: 'ElevenLabs',
      price: 35,
      description: 'Доступ к AI-озвучке и голосам.'
    },
    {
      id: 'notion',
      title: 'Notion AI',
      price: 40,
      description: 'Подписка Notion AI для работы с текстами.'
    },
    {
      id: 'pro_pack',
      title: 'AI Pro Pack',
      price: 45,
      description: 'Пакет премиум AI-сервисов.'
    }
  ]
};

function normalizeDb(nextDb) {
  return {
    users: nextDb?.users || {},
    purchases: Array.isArray(nextDb?.purchases) ? nextDb.purchases : [],
    services: defaultDb.services
  };
}

function loadLocalDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    const nextDb = normalizeDb(defaultDb);
    saveLocalDb(nextDb);
    return nextDb;
  }

  const nextDb = normalizeDb(JSON.parse(fs.readFileSync(dbPath, 'utf8')));
  saveLocalDb(nextDb);

  return nextDb;
}

function saveLocalDb(nextDb) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(dbPath, JSON.stringify(nextDb, null, 2));
}

async function loadSupabaseDb() {
  const { data, error } = await supabase
    .from(supabaseStateTable)
    .select('data')
    .eq('key', supabaseStateKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const nextDb = normalizeDb(data?.data || defaultDb);
  await saveSupabaseDb(nextDb);

  return nextDb;
}

async function saveSupabaseDb(nextDb) {
  const { error } = await supabase
    .from(supabaseStateTable)
    .upsert({ key: supabaseStateKey, data: nextDb, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    throw error;
  }
}

async function loadDb() {
  if (supabase) {
    return loadSupabaseDb();
  }

  return loadLocalDb();
}

function saveDb(nextDb = db) {
  const dbToSave = normalizeDb(nextDb);

  if (!supabase) {
    saveLocalDb(dbToSave);
    return;
  }

  saveQueue = saveQueue.then(() => saveSupabaseDb(dbToSave)).catch((error) => {
    console.error('Supabase save failed:', error.message);
  });
}

let db;
let saveQueue = Promise.resolve();
const bot = new Telegraf(token);

function getUserName(from) {
  return from.username ? `@${from.username}` : [from.first_name, from.last_name].filter(Boolean).join(' ') || String(from.id);
}

function getTranslation(language) {
  return translations[language] || translations.ru;
}

function getUserTranslation(user) {
  return getTranslation(user.language);
}

function getCtxTranslation(ctx) {
  return getUserTranslation(ensureUser(ctx.from));
}

function ensureUser(from) {
  const id = String(from.id);

  if (!db.users[id]) {
    db.users[id] = {
      id: from.id,
      name: getUserName(from),
      points: 0,
      invitedBy: null,
      pendingReferrerId: null,
      referralRewarded: false,
      language: 'ru',
      languageSelected: false,
      referrals: [],
      subscribed: false,
      createdAt: new Date().toISOString()
    };
    saveDb();
  } else {
    db.users[id].name = getUserName(from);
    db.users[id].subscribed = Boolean(db.users[id].subscribed);
    db.users[id].pendingReferrerId = db.users[id].pendingReferrerId || null;
    db.users[id].referralRewarded = Boolean(db.users[id].referralRewarded || db.users[id].invitedBy);
    db.users[id].language = db.users[id].language || 'ru';
    db.users[id].languageSelected = Boolean(db.users[id].languageSelected);
    saveDb();
  }

  return db.users[id];
}

function mainKeyboard(user) {
  const text = getUserTranslation(user);

  return Markup.keyboard([
    [text.profile, text.redeem],
    [text.myLink, text.progress],
    [text.store, text.support],
    [text.mainChannel],
    [text.changeLanguage]
  ]).resize();
}

function languageKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🇷🇺 Русский', 'lang:ru')],
    [Markup.button.callback('🇬🇧 English', 'lang:en')],
    [Markup.button.callback('🇨🇳 中文', 'lang:zh')]
  ]);
}

function hasPurchased(user, serviceId) {
  return db.purchases.some((purchase) => purchase.userId === user.id && purchase.serviceId === serviceId);
}

function getServiceIcon(user, service) {
  return hasPurchased(user, service.id) ? '🔑' : '🔒';
}

function getServiceDescription(text, service) {
  return text.services[service.id] || service.description;
}

function serviceKeyboard(user) {
  const text = getUserTranslation(user);

  return Markup.inlineKeyboard(
    db.services.map((service) => [
      Markup.button.callback(`${getServiceIcon(user, service)} ${service.title} - ${text.servicePrice(service)}`, `buy:${service.id}`)
    ])
  );
}

async function rewardReferral(user) {
  if (!user.pendingReferrerId || user.referralRewarded) {
    return;
  }

  const referrerId = String(user.pendingReferrerId);
  const referrer = db.users[referrerId];

  if (!referrer) {
    return;
  }

  user.invitedBy = Number(referrerId);
  user.pendingReferrerId = null;
  user.referralRewarded = true;
  referrer.points += 1;

  if (!referrer.referrals.includes(user.id)) {
    referrer.referrals.push(user.id);
  }

  saveDb();
  const text = getUserTranslation(referrer);
  await bot.telegram.sendMessage(referrerId, text.newReferral({ name: user.name, points: referrer.points })).catch(() => null);
}

function subscribeKeyboard(user) {
  const text = getUserTranslation(user);
  const buttons = [];

  if (mainChannelUrl) {
    buttons.push([Markup.button.url(text.subscribeButton, mainChannelUrl)]);
  }

  buttons.push([Markup.button.callback(text.checkSubscriptionButton, 'check_subscription')]);

  return Markup.inlineKeyboard(buttons);
}

async function isSubscribed(ctx) {
  const user = ensureUser(ctx.from);

  if (user.subscribed) {
    await rewardReferral(user);
    return true;
  }

  if (!mainChannelUsername) {
    user.subscribed = true;
    saveDb();
    await rewardReferral(user);
    return true;
  }

  try {
    const member = await ctx.telegram.getChatMember(mainChannelUsername, ctx.from.id);
    const subscribed = !['left', 'kicked'].includes(member.status);

    if (subscribed) {
      user.subscribed = true;
      saveDb();
      await rewardReferral(user);
    }

    return subscribed;
  } catch (error) {
    console.error('Subscription check failed:', error.message);
    return false;
  }
}

async function requireSubscription(ctx) {
  const user = ensureUser(ctx.from);
  const text = getUserTranslation(user);

  if (await isSubscribed(ctx)) {
    return true;
  }

  await ctx.reply(
    text.subscribeRequired,
    subscribeKeyboard(user)
  );
  return false;
}

function withSubscription(handler) {
  return async (ctx) => {
    if (!(await requireSubscription(ctx))) {
      return;
    }

    return handler(ctx);
  };
}

function sendBalance(ctx) {
  const user = ensureUser(ctx.from);
  const text = getUserTranslation(user);
  return ctx.reply(text.balance({ points: user.points, referrals: user.referrals.length }));
}

function sendProfile(ctx) {
  const user = ensureUser(ctx.from);
  const text = getUserTranslation(user);
  return ctx.reply(text.profileText({ name: user.name, id: user.id, points: user.points, referrals: user.referrals.length }));
}

function sendProgress(ctx) {
  const user = ensureUser(ctx.from);
  const text = getUserTranslation(user);
  return ctx.reply(text.progressText({ points: user.points, referrals: user.referrals.length }));
}

function sendRedeem(ctx) {
  const user = ensureUser(ctx.from);
  const text = getUserTranslation(user);
  const services = db.services
    .map((service) => `${getServiceIcon(user, service)} ${service.title}\n${text.servicePrice(service)}\n${getServiceDescription(text, service)}`)
    .join('\n\n');

  return ctx.reply(text.redeemText({ services }), serviceKeyboard(user));
}

function sendSupport(ctx) {
  return ctx.reply(getCtxTranslation(ctx).supportText);
}

function sendMainChannel(ctx) {
  return ctx.reply(getCtxTranslation(ctx).channelText({ url: mainChannelUrl }));
}

function sendShop(ctx) {
  return ctx.reply(getCtxTranslation(ctx).storeText({ url: shopUrl }));
}

function toggleLanguage(ctx) {
  return ctx.reply(getCtxTranslation(ctx).chooseLanguage, languageKeyboard());
}

async function sendReferralLink(ctx) {
  const user = ensureUser(ctx.from);
  const botInfo = await ctx.telegram.getMe();
  const link = `https://t.me/${botInfo.username}?start=ref_${user.id}`;
  const text = getUserTranslation(user);

  return ctx.reply(text.referralLink({ link }));
}

async function notifyAdmins(message) {
  await Promise.allSettled(adminIds.map((adminId) => bot.telegram.sendMessage(adminId, message)));
}

function isAdmin(from) {
  return adminIds.includes(from.id);
}

function sendAdminHelp(ctx) {
  const text = getCtxTranslation(ctx);

  if (!isAdmin(ctx.from)) {
    return ctx.reply(text.adminOnly);
  }

  return ctx.reply(text.adminHelp);
}

function addPoints(ctx) {
  const text = getCtxTranslation(ctx);

  if (!isAdmin(ctx.from)) {
    return ctx.reply(text.adminOnly);
  }

  const [, userId, amountValue] = ctx.message.text.trim().split(/\s+/);
  const amount = Number(amountValue);

  if (!/^\d+$/.test(userId || '') || !Number.isInteger(amount) || amount <= 0) {
    return ctx.reply(text.addPointsUsage);
  }

  const user = db.users[userId] || {
    id: Number(userId),
    name: userId,
    points: 0,
    invitedBy: null,
    pendingReferrerId: null,
    referralRewarded: false,
    language: 'ru',
    languageSelected: true,
    referrals: [],
    subscribed: false,
    createdAt: new Date().toISOString()
  };

  user.points += amount;
  db.users[userId] = user;
  saveDb();

  return ctx.reply(text.pointsAdded({ amount, name: user.name, points: user.points }));
}

bot.start(async (ctx) => {
  const isNewUser = !db.users[String(ctx.from.id)];
  const user = ensureUser(ctx.from);
  const payload = ctx.startPayload || '';
  const referrerId = payload.startsWith('ref_') ? payload.slice(4) : null;

  if (isNewUser && referrerId && referrerId !== String(user.id) && !user.invitedBy && !user.pendingReferrerId && !user.referralRewarded && db.users[referrerId]) {
    user.pendingReferrerId = Number(referrerId);
    saveDb();
  }

  if (!user.languageSelected) {
    return ctx.reply(getUserTranslation(user).chooseLanguage, languageKeyboard());
  }

  if (!(await requireSubscription(ctx))) {
    return;
  }

  return ctx.reply(
    getUserTranslation(user).welcome,
    mainKeyboard(user)
  );
});

bot.hears('Баланс', withSubscription(sendBalance));
bot.hears('Balance', withSubscription(sendBalance));
bot.hears('余额', withSubscription(sendBalance));
bot.hears('👤 Профиль', withSubscription(sendProfile));
bot.hears('👤 Profile', withSubscription(sendProfile));
bot.hears('👤 个人资料', withSubscription(sendProfile));
bot.hears('🎁 Обмен', withSubscription(sendRedeem));
bot.hears('🎁 Redeem', withSubscription(sendRedeem));
bot.hears('🎁 兑换', withSubscription(sendRedeem));
bot.hears('🔗 Моя ссылка', withSubscription(sendReferralLink));
bot.hears('🔗 My Link', withSubscription(sendReferralLink));
bot.hears('🔗 我的链接', withSubscription(sendReferralLink));
bot.hears('📊 Прогресс', withSubscription(sendProgress));
bot.hears('📊 Progress', withSubscription(sendProgress));
bot.hears('📊 进度', withSubscription(sendProgress));
bot.hears('🛍 Магазин', withSubscription(sendShop));
bot.hears('🛍 Store', withSubscription(sendShop));
bot.hears('🛍 商店', withSubscription(sendShop));
bot.hears('💬 Поддержка', withSubscription(sendSupport));
bot.hears('💬 Support', withSubscription(sendSupport));
bot.hears('💬 支持', withSubscription(sendSupport));
bot.hears('📣 Основной канал', withSubscription(sendMainChannel));
bot.hears('📣 Main Channel', withSubscription(sendMainChannel));
bot.hears('📣 主频道', withSubscription(sendMainChannel));
bot.hears('🌍 Сменить язык', withSubscription(toggleLanguage));
bot.hears('🌍 Change Language', withSubscription(toggleLanguage));
bot.hears('🌍 更改语言', withSubscription(toggleLanguage));

bot.hears('Моя ссылка', withSubscription(sendReferralLink));

bot.hears('Магазин', withSubscription(sendShop));

bot.hears('Помощь', withSubscription((ctx) => ctx.reply(getCtxTranslation(ctx).help)));
bot.hears('Ссылка на магазин', withSubscription(sendShop));
bot.command('balance', withSubscription(sendBalance));
bot.command('profile', withSubscription(sendProfile));
bot.command('link', withSubscription(sendReferralLink));
bot.command('progress', withSubscription(sendProgress));
bot.command('redeem', withSubscription(sendRedeem));
bot.command('shop', withSubscription(sendShop));
bot.command('support', withSubscription(sendSupport));
bot.command('channel', withSubscription(sendMainChannel));
bot.command('store', withSubscription(sendShop));
bot.command('admin', sendAdminHelp);
bot.command('addpoints', addPoints);

bot.action(/^lang:(ru|en|zh)$/, async (ctx) => {
  const user = ensureUser(ctx.from);
  user.language = ctx.match[1];
  user.languageSelected = true;
  saveDb();
  const text = getUserTranslation(user);

  await ctx.answerCbQuery(text.done).catch(() => null);

  if (!(await requireSubscription(ctx))) {
    return;
  }

  return ctx.reply(text.subscriptionConfirmed, mainKeyboard(user));
});

bot.action('check_subscription', async (ctx) => {
  const user = ensureUser(ctx.from);
  const text = getUserTranslation(user);

  if (await isSubscribed(ctx)) {
    await ctx.answerCbQuery(text.subscriptionConfirmed).catch(() => null);
    await ctx.reply(text.subscriptionConfirmed, mainKeyboard(user));
    return;
  }

  await ctx.answerCbQuery(text.subscriptionMissing).catch(() => null);
  await ctx.reply(text.subscribeAgain, subscribeKeyboard(user));
});

bot.action(/^buy:(.+)$/, async (ctx) => {
  if (!(await requireSubscription(ctx))) {
    return;
  }

  const user = ensureUser(ctx.from);
  const text = getUserTranslation(user);
  const service = db.services.find((item) => item.id === ctx.match[1]);

  if (!service) {
    await ctx.answerCbQuery(text.serviceMissing).catch(() => null);
    return;
  }

  if (user.points < service.price) {
    await ctx.answerCbQuery(text.notEnoughPoints).catch(() => null);
    await ctx.reply(text.notEnoughPointsText({ price: service.price, points: user.points }));
    return;
  }

  user.points -= service.price;
  const purchase = {
    id: db.purchases.length + 1,
    userId: user.id,
    userName: user.name,
    serviceId: service.id,
    serviceTitle: service.title,
    price: service.price,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.purchases.push(purchase);
  saveDb();

  await ctx.answerCbQuery(text.purchaseCreated).catch(() => null);
  await ctx.reply(text.purchaseText({ title: service.title, points: user.points }));
  await notifyAdmins(translations.ru.adminPurchase({ id: purchase.id, name: user.name, userId: user.id, title: service.title, price: service.price }));
});

bot.catch((error) => {
  console.error('Bot error:', error);
});

async function main() {
  db = await loadDb();
  await bot.launch(() => {
    console.log(`AI referral bot is running with ${supabase ? 'Supabase' : 'local JSON'} storage.`);
  });
}

main().catch((error) => {
  console.error('Bot startup failed:', error);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
