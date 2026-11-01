import type { Order, StoreSettings } from '../types';

/** Sends order data to our server; Telegram credentials never enter the browser. */
export async function sendTelegramOrderNotificationClient(
  order: Order,
  settings?: StoreSettings | null
): Promise<{ success: boolean; withPhoto?: boolean; error?: string }> {
  if (settings?.isTelegramNotificationsEnabled === false) {
    return { success: false, error: 'Telegram notifications are turned off' };
  }
  try {
    const response = await fetch('/api/notify-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    });
    if (!response.ok) return { success: false, error: 'Notification service unavailable' };
    return await response.json();
  } catch {
    return { success: false, error: 'Notification service unavailable' };
  }
}
