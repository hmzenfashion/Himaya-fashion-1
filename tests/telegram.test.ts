import assert from 'node:assert/strict';
import { test } from 'node:test';
import handler from '../netlify/functions/notify-telegram.mts';
import { sendTelegramOrderNotificationClient } from '../src/utils/telegramNotify';

const order = {
  id: 'TEST', customerName: 'Test', phone: 'test', address: 'Test address',
  totalAmount: 100, items: [{ title: 'Dress', quantity: 1, price: 100 }]
};
const request = (body: unknown) => new Request('https://example.com/api/notify-telegram', {
  method: 'POST', body: JSON.stringify(body)
});

test('notification boundary keeps credentials server-side', async () => {
  const originalFetch = globalThis.fetch;
  try {
    (globalThis as any).Netlify = { env: { get: () => undefined } };
    assert.equal((await handler(new Request('https://example.com/api/notify-telegram'))).status, 405);
    assert.equal((await handler(request({ order }))).status, 503);
    (globalThis as any).Netlify.env.get = (name: string) => ({
      telegrambot_token: 'test-token', telegramchat_id: 'test-chat'
    }[name]);
    assert.equal((await handler(request({ order: {} }))).status, 400);
    const external = request({ order });
    external.headers.set('origin', 'https://other.example');
    assert.equal((await handler(external)).status, 403);

    const calls: string[] = [];
    globalThis.fetch = async (url, init) => {
      calls.push(String(url));
      assert.equal(JSON.parse(init!.body as string).chat_id, 'test-chat');
      return Response.json({ ok: true });
    };
    const response = await handler(request({ order }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).success, true);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].endsWith('/sendMessage'));

    calls.length = 0;
    const photoResponse = await handler(request({ order: {
      ...order, items: [{ ...order.items[0], image: 'https://example.com/dress.jpg' }]
    } }));
    assert.equal((await photoResponse.json()).withPhoto, true);
    assert.ok(calls[0].endsWith('/sendPhoto'));

    globalThis.fetch = async () => { throw new Error('Private upstream URL'); };
    const failure = await handler(request({ order }));
    assert.equal(failure.status, 502);
    assert.ok(!(await failure.text()).includes('Private upstream'));

    globalThis.fetch = async (url, init) => {
      assert.equal(url, '/api/notify-telegram');
      assert.deepEqual(JSON.parse(init!.body as string), { order });
      return Response.json({ success: true });
    };
    assert.equal((await sendTelegramOrderNotificationClient(order as any)).success, true);
  } finally {
    globalThis.fetch = originalFetch;
    delete (globalThis as any).Netlify;
  }
});
