const fs = require('fs');
const path = require('path');
require('dotenv').config();
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

function loadDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    saveDb(defaultDb);
    return structuredClone(defaultDb);
  }

  const nextDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  nextDb.services = defaultDb.services;
  saveDb(nextDb);

  return nextDb;
}

function saveDb(nextDb = db) {
  fs.writeFileSync(dbPath, JSON.stringify(nextDb, null, 2));
}

const db = loadDb();
const bot = new Telegraf(token);

function getUserName(from) {
  return from.username ? `@${from.username}` : [from.first_name, from.last_name].filter(Boolean).join(' ') || String(from.id);
}

function ensureUser(from) {
  const id = String(from.id);

  if (!db.users[id]) {
    db.users[id] = {
      id: from.id,
      name: getUserName(from),
      points: 0,
      invitedBy: null,
      referrals: [],
      subscribed: false,
      createdAt: new Date().toISOString()
    };
    saveDb();
  } else {
    db.users[id].name = getUserName(from);
    db.users[id].subscribed = Boolean(db.users[id].subscribed);
    saveDb();
  }

  return db.users[id];
}

function mainKeyboard() {
  return Markup.keyboard([
    ['👤 Profile', '🎁 Redeem'],
    ['🔗 My Link', '📊 Progress'],
    ['🛍 Store', '💬 Support'],
    ['📣 Main Channel']
  ]).resize();
}

function hasPurchased(user, serviceId) {
  return db.purchases.some((purchase) => purchase.userId === user.id && purchase.serviceId === serviceId);
}

function getServiceIcon(user, service) {
  return hasPurchased(user, service.id) ? '🔑' : '🔒';
}

function serviceKeyboard(user) {
  return Markup.inlineKeyboard(
    db.services.map((service) => [
      Markup.button.callback(`${getServiceIcon(user, service)} ${service.title} - ${service.price} балл.`, `buy:${service.id}`)
    ])
  );
}

function subscribeKeyboard() {
  const buttons = [];

  if (mainChannelUrl) {
    buttons.push([Markup.button.url('📣 Подписаться на канал', mainChannelUrl)]);
  }

  buttons.push([Markup.button.callback('✅ Я подписался', 'check_subscription')]);

  return Markup.inlineKeyboard(buttons);
}

async function isSubscribed(ctx) {
  const user = ensureUser(ctx.from);

  if (user.subscribed) {
    return true;
  }

  if (!mainChannelUsername) {
    user.subscribed = true;
    saveDb();
    return true;
  }

  try {
    const member = await ctx.telegram.getChatMember(mainChannelUsername, ctx.from.id);
    const subscribed = !['left', 'kicked'].includes(member.status);

    if (subscribed) {
      user.subscribed = true;
      saveDb();
    }

    return subscribed;
  } catch (error) {
    console.error('Subscription check failed:', error.message);
    return false;
  }
}

function markSubscribed(from) {
  const user = ensureUser(from);
  user.subscribed = true;
  saveDb();
}

async function requireSubscription(ctx) {
  if (await isSubscribed(ctx)) {
    return true;
  }

  await ctx.reply(
    'Чтобы пользоваться ботом, подпишись на наш канал Omni Key, затем нажми "Я подписался".',
    subscribeKeyboard()
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
  return ctx.reply(`Баланс: ${user.points} балл.\nРефералов: ${user.referrals.length}.`);
}

function sendProfile(ctx) {
  const user = ensureUser(ctx.from);
  return ctx.reply(
    `👤 Profile\n\nПользователь: ${user.name}\nID: ${user.id}\nБаланс: ${user.points} балл.\nРефералов: ${user.referrals.length}`
  );
}

function sendProgress(ctx) {
  const user = ensureUser(ctx.from);
  return ctx.reply(
    `📊 Progress\n\nБаллы: ${user.points}\nПриглашено друзей: ${user.referrals.length}`
  );
}

function sendRedeem(ctx) {
  const user = ensureUser(ctx.from);
  const text = db.services
    .map((service) => `${getServiceIcon(user, service)} ${service.title}\nЦена: ${service.price} балл.\n${service.description}`)
    .join('\n\n');

  return ctx.reply(`🎁 Redeem\n\nВыбери сервис для обмена баллов:\n\n${text}`, serviceKeyboard(user));
}

function sendSupport(ctx) {
  return ctx.reply('💬 Support\n\nПо всем вопросам можете обращаться в поддержку: @OmniKeySUPPORT');
}

function sendMainChannel(ctx) {
  return ctx.reply(mainChannelUrl ? `📣 Main Channel: ${mainChannelUrl}` : '📣 Main Channel пока не настроен.');
}

function sendShop(ctx) {
  return ctx.reply(`🛍 Store\n\nНаш магазин по продаже ИИ-сервисов: @OminiKey_bot\n${shopUrl}`);
}

async function sendReferralLink(ctx) {
  const user = ensureUser(ctx.from);
  const botInfo = await ctx.telegram.getMe();
  const link = `https://t.me/${botInfo.username}?start=ref_${user.id}`;

  return ctx.reply(`🔗 My Link\n\n${link}\n\nЗа каждого нового приглашенного ты получаешь 1 балл.`);
}

async function notifyAdmins(message) {
  await Promise.allSettled(adminIds.map((adminId) => bot.telegram.sendMessage(adminId, message)));
}

bot.start(async (ctx) => {
  const user = ensureUser(ctx.from);
  const payload = ctx.startPayload || '';
  const referrerId = payload.startsWith('ref_') ? payload.slice(4) : null;

  if (referrerId && referrerId !== String(user.id) && !user.invitedBy && db.users[referrerId]) {
    const referrer = db.users[referrerId];

    user.invitedBy = Number(referrerId);
    referrer.points += 1;
    referrer.referrals.push(user.id);
    saveDb();

    await ctx.telegram.sendMessage(referrerId, `Новый реферал: ${user.name}. Начислен 1 балл.`).catch(() => null);
  }

  if (!(await requireSubscription(ctx))) {
    return;
  }

  return ctx.reply(
    'Привет! Приглашай людей по своей ссылке и получай 1 балл за каждого нового реферала. Баллы можно тратить в Store на ИИ-сервисы.',
    mainKeyboard()
  );
});

bot.hears('Баланс', withSubscription(sendBalance));
bot.hears('👤 Profile', withSubscription(sendProfile));
bot.hears('🎁 Redeem', withSubscription(sendRedeem));
bot.hears('🔗 My Link', withSubscription(sendReferralLink));
bot.hears('📊 Progress', withSubscription(sendProgress));
bot.hears('🛍 Store', withSubscription(sendShop));
bot.hears('💬 Support', withSubscription(sendSupport));
bot.hears('📣 Main Channel', withSubscription(sendMainChannel));

bot.hears('Моя ссылка', withSubscription(sendReferralLink));

bot.hears('Магазин', withSubscription(sendShop));

bot.hears('Помощь', withSubscription((ctx) => ctx.reply('Команды: /start, /balance, /link, /shop. Пригласи друга по ссылке и получи 1 балл после его первого запуска бота.')));
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

bot.action('check_subscription', async (ctx) => {
  if (await isSubscribed(ctx)) {
    await ctx.answerCbQuery('Подписка подтверждена.').catch(() => null);
    await ctx.reply('Спасибо за подписку! Теперь можно пользоваться ботом.', mainKeyboard());
    return;
  }

  markSubscribed(ctx.from);
  await ctx.answerCbQuery('Подписка сохранена.').catch(() => null);
  await ctx.reply('Спасибо! Подписка сохранена, теперь бот больше не будет запрашивать ее повторно.', mainKeyboard());
});

bot.action(/^buy:(.+)$/, async (ctx) => {
  if (!(await requireSubscription(ctx))) {
    return;
  }

  const user = ensureUser(ctx.from);
  const service = db.services.find((item) => item.id === ctx.match[1]);

  if (!service) {
    await ctx.answerCbQuery('Сервис не найден.').catch(() => null);
    return;
  }

  if (user.points < service.price) {
    await ctx.answerCbQuery('Недостаточно баллов.').catch(() => null);
    await ctx.reply(`Нужно ${service.price} балл., у тебя ${user.points}.`);
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

  await ctx.answerCbQuery('Покупка создана.').catch(() => null);
  await ctx.reply(`Покупка оформлена: ${service.title}. Остаток: ${user.points} балл. Администратор скоро выдаст доступ.`);
  await notifyAdmins(`Новая покупка #${purchase.id}\nПользователь: ${user.name} (${user.id})\nСервис: ${service.title}\nЦена: ${service.price}`);
});

bot.catch((error) => {
  console.error('Bot error:', error);
});

bot.launch(() => {
  console.log('AI referral bot is running.');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
