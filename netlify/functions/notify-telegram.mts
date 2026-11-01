import { sendTelegramOrderNotification } from '../../server/telegram';

// Netlify injects this environment accessor at function invocation time.
declare const Netlify: { env: { get(name: string): string | undefined } };

export default async (request: Request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
  }
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const botToken = Netlify.env.get('telegrambot_token') || Netlify.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Netlify.env.get('telegramchat_id') || Netlify.env.get('TELEGRAM_CHAT_ID');
  if (!botToken || !chatId) {
    return Response.json({ success: false, error: 'Notifications are not configured' }, { status: 503 });
  }
  try {
    const text = await request.text();
    if (text.length > 4_000_000) {
      return Response.json({ success: false, error: 'Order too large' }, { status: 413 });
    }
    const { order } = JSON.parse(text);
    if (!order || typeof order.id !== 'string' || !order.id ||
        typeof order.customerName !== 'string' || typeof order.phone !== 'string' ||
        typeof order.address !== 'string' || !Number.isFinite(order.totalAmount) ||
        !Array.isArray(order.items) || !order.items.length || order.items.length > 50 ||
        order.items.some((item: any) => !item || typeof item.title !== 'string' ||
          !Number.isFinite(item.price) || !Number.isInteger(item.quantity) || item.quantity < 1 ||
          (item.image != null && typeof item.image !== 'string'))) {
      return Response.json({ success: false, error: 'Invalid order' }, { status: 400 });
    }
    const result = await sendTelegramOrderNotification(order, { botToken, chatId });
    return Response.json(result, { status: result.success ? 200 : 502 });
  } catch {
    return Response.json({ success: false, error: 'Unable to process notification' }, { status: 400 });
  }
};

export const config = { path: '/api/notify-telegram' };
