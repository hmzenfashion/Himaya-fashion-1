import { Order, StoreSettings } from '../types';

function escapeTelegramHtml(unsafe?: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Resolves Telegram Bot Token & Chat/SMS ID from all possible sources:
 * 1. Netlify Environment Variables (VITE_TELEGRAM_*, TELEGRAM_*, HTTP_API_KEY, SMS_ID, etc.)
 * 2. Vite import.meta.env
 * 3. Node process.env (bundled via Vite define)
 * 4. LocalStorage
 * 5. StoreSettings from backend/Firestore/settings.json
 * 6. Hardcoded verified active Bot credentials
 */
export function getTelegramCredentials(settings?: StoreSettings | null): {
  botToken: string;
  chatId: string;
  enabled: boolean;
} {
  // Verified default active Telegram credentials
  const DEFAULT_TOKEN = "9051474160:AAEC6TImfbG8vjZUbYePEuKRWIAb6IyVahI";
  const DEFAULT_CHAT_ID = "6333005937";

  // Check Netlify / Vite environment variables
  let envToken = '';
  let envChatId = '';

  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      const e = metaEnv as Record<string, any>;
      envToken = e.VITE_TELEGRAM_BOT_TOKEN ||
                 e.VITE_TELEGRAM_HTTP_API ||
                 e.VITE_TELEGRAM_API_KEY ||
                 e.VITE_HTTP_API_KEY ||
                 e.VITE_BOT_TOKEN ||
                 e.VITE_TELEGRAM_TOKEN ||
                 e.TELEGRAM_BOT_TOKEN ||
                 e.TELEGRAM_HTTP_API ||
                 e.TELEGRAM_API_KEY ||
                 e.HTTP_API_KEY ||
                 e.BOT_TOKEN || '';

      envChatId = e.VITE_TELEGRAM_CHAT_ID ||
                  e.VITE_TELEGRAM_SMS_ID ||
                  e.VITE_TELEGRAM_MESSAGE_ID ||
                  e.VITE_CHAT_ID ||
                  e.VITE_SMS_ID ||
                  e.TELEGRAM_CHAT_ID ||
                  e.TELEGRAM_SMS_ID ||
                  e.TELEGRAM_MESSAGE_ID ||
                  e.CHAT_ID ||
                  e.SMS_ID || '';
    }
  } catch {}

  try {
    if (typeof process !== 'undefined' && process.env) {
      if (!envToken) {
        envToken = process.env.TELEGRAM_BOT_TOKEN ||
                   process.env.TELEGRAM_HTTP_API ||
                   process.env.HTTP_API_KEY ||
                   process.env.BOT_TOKEN ||
                   process.env.VITE_TELEGRAM_BOT_TOKEN || '';
      }
      if (!envChatId) {
        envChatId = process.env.TELEGRAM_CHAT_ID ||
                    process.env.TELEGRAM_SMS_ID ||
                    process.env.CHAT_ID ||
                    process.env.SMS_ID ||
                    process.env.VITE_TELEGRAM_CHAT_ID || '';
      }
    }
  } catch {}

  // Check localStorage
  let localToken = '';
  let localChatId = '';
  if (typeof window !== 'undefined') {
    try {
      localToken = localStorage.getItem('himaya_telegram_bot_token') || '';
      localChatId = localStorage.getItem('himaya_telegram_chat_id') || '';
      if (!localToken || !localChatId) {
        const raw = localStorage.getItem('himaya_real_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.telegramBotToken) localToken = parsed.telegramBotToken;
          if (parsed.telegramChatId) localChatId = parsed.telegramChatId;
        }
      }
    } catch {}
  }

  // Priority: Netlify env > Admin settings > LocalStorage > Default verified
  let chosenToken = (envToken || settings?.telegramBotToken || localToken || DEFAULT_TOKEN).trim();

  // Guard against old revoked token that returns 401 Unauthorized
  if (chosenToken.startsWith('8964946844') || chosenToken.length < 20) {
    chosenToken = DEFAULT_TOKEN;
  }
  const botToken = chosenToken.replace(/\s+/g, '');

  let chosenChatId = String(envChatId || settings?.telegramChatId || localChatId || DEFAULT_CHAT_ID).trim();
  if (!chosenChatId || chosenChatId === 'undefined' || chosenChatId === 'null') {
    chosenChatId = DEFAULT_CHAT_ID;
  }

  return {
    botToken,
    chatId: chosenChatId,
    enabled: settings?.isTelegramNotificationsEnabled !== false
  };
}

/**
 * Converts a base64 data URI, remote URL, or relative URL to a Blob in the browser with timeout.
 */
async function resolveImageBlob(imgStr?: string): Promise<Blob | null> {
  if (!imgStr) return null;
  const trimmed = imgStr.trim();

  // 1. Base64 Data URI
  if (trimmed.startsWith('data:image/')) {
    try {
      const parts = trimmed.split(',');
      if (parts.length < 2) return null;
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeType });
    } catch (e) {
      return null;
    }
  }

  // 2. Remote or relative URL with 2500ms timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const url = trimmed.startsWith('/')
      ? (typeof window !== 'undefined' ? window.location.origin : '') + trimmed
      : trimmed;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) return await res.blob();
  } catch {
    clearTimeout(timer);
  }

  return null;
}

/**
 * Dispatches an order notification directly to Telegram Bot API.
 * Guarantees that when a customer bags and orders multiple products together,
 * every ordered product's photo and full details (size, color, qty, price) are sent to Telegram!
 */
export async function sendTelegramOrderNotificationClient(
  order: Order,
  settings?: StoreSettings | null
): Promise<{ success: boolean; withPhoto?: boolean; error?: string }> {
  try {
    const { botToken, chatId, enabled } = getTelegramCredentials(settings);

    if (!botToken || !chatId) {
      console.warn("[Telegram] Bot Token or Chat ID is missing. Skipping notification.");
      return { success: false, error: "Bot token or Chat ID is not configured" };
    }

    if (!enabled) {
      console.info("[Telegram] Notifications are currently disabled in store settings.");
      return { success: false, error: "Telegram notifications are turned off" };
    }

    const orderTime = new Date(order.createdAt || Date.now()).toLocaleString('bn-BD', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const isFirst = order.isFirstOrder ?? true;

    // Build item text breakdown (HTML)
    const itemsListHtml = (order.items || []).map((item, idx) => {
      let t = `<b>${idx + 1}. ${escapeTelegramHtml(item.title)}</b>\n`;
      t += `   • সাইজ: <code>${escapeTelegramHtml(item.size || 'Free Size')}</code> | কালার: <code>${escapeTelegramHtml(item.color || 'Default')}</code>\n`;
      t += `   • পরিমাণ: <b>${item.quantity}টি</b> x ৳${item.price} = <b>৳${(item.price * item.quantity).toFixed(2)}</b>`;
      return t;
    }).join('\n');

    // Build item text breakdown (Plain Text fallback)
    const itemsListPlain = (order.items || []).map((item, idx) => {
      let t = `${idx + 1}. ${item.title}\n`;
      t += `   - সাইজ: ${item.size || 'Free Size'} | কালার: ${item.color || 'Default'}\n`;
      t += `   - পরিমাণ: ${item.quantity}টি x ৳${item.price} = ৳${(item.price * item.quantity).toFixed(2)}`;
      return t;
    }).join('\n');

    const paymentTextHtml = order.paymentMethod === 'bkash'
      ? `বিকাশ (bKash)${order.paymentTrxId ? ` | TrxID: <code>${escapeTelegramHtml(order.paymentTrxId)}</code> (প্রেরক: <code>${escapeTelegramHtml(order.paymentSenderPhone || '')}</code>)` : ''}`
      : order.paymentMethod === 'nagad'
      ? `নগদ (Nagad)${order.paymentTrxId ? ` | TrxID: <code>${escapeTelegramHtml(order.paymentTrxId)}</code> (প্রেরক: <code>${escapeTelegramHtml(order.paymentSenderPhone || '')}</code>)` : ''}`
      : 'ক্যাশ অন ডেলিভারি (Cash on Delivery)';

    const paymentTextPlain = order.paymentMethod === 'bkash'
      ? `বিকাশ (bKash)${order.paymentTrxId ? ` | TrxID: ${order.paymentTrxId} (প্রেরক: ${order.paymentSenderPhone || ''})` : ''}`
      : order.paymentMethod === 'nagad'
      ? `নগদ (Nagad)${order.paymentTrxId ? ` | TrxID: ${order.paymentTrxId} (প্রেরক: ${order.paymentSenderPhone || ''})` : ''}`
      : 'ক্যাশ অন ডেলিভারি (Cash on Delivery)';

    const discountTextHtml = (order.discountAmount && order.discountAmount > 0)
      ? `🎟️ <b>কুপন ডিসকাউন্ট (${escapeTelegramHtml(order.couponCode || 'PROMO')}):</b> -৳${order.discountAmount.toFixed(2)}\n`
      : '';

    const discountTextPlain = (order.discountAmount && order.discountAmount > 0)
      ? `🎟️ কুপন ডিসকাউন্ট (${order.couponCode || 'PROMO'}): -৳${order.discountAmount.toFixed(2)}\n`
      : '';

    const itemsSubtotal = (order.totalAmount - (order.deliveryCharge || 0) + (order.discountAmount || 0));

    // Complete HTML Invoice
    const fullInvoiceHtml =
      `🛍️ <b>নতুন অর্ডার নোটিফিকেশন — হিমায়া ফ্যাশন</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>অর্ডার আইডি:</b> <code>#${escapeTelegramHtml(order.id)}</code>\n` +
      `📅 <b>সময়:</b> ${orderTime}\n` +
      `${isFirst ? '⭐ <i>ওয়েবসাইটে গ্রাহকের প্রথম অর্ডার!</i>\n' : ''}` +
      `\n👤 <b>গ্রাহকের তথ্য:</b>\n` +
      `• নাম: <b>${escapeTelegramHtml(order.customerName)}</b>\n` +
      `• ফোন: <code>${escapeTelegramHtml(order.phone)}</code>\n` +
      (order.email ? `• ইমেইল: ${escapeTelegramHtml(order.email)}\n` : '') +
      `\n📍 <b>ডেলিভারি ঠিকানা:</b>\n` +
      `• ঠিকানা: ${escapeTelegramHtml(order.address)}\n` +
      `• এলাকা/উপজেলা: ${escapeTelegramHtml([order.thana, order.district].filter(Boolean).join(', ') || order.city || 'N/A')}\n` +
      `• ডেলিভারি জোন: ${escapeTelegramHtml(order.deliveryArea || 'Inside Dhaka')} (চার্জ: ৳${order.deliveryCharge || 80})\n` +
      `\n👗 <b>অর্ডারকৃত পণ্যসমূহ (${order.items?.length || 0}টি):</b>\n` +
      `${itemsListHtml}\n` +
      `\n━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 <b>পেমেন্ট পদ্ধতি:</b> ${paymentTextHtml}\n` +
      `💰 <b>পণ্যের মূল্য:</b> ৳${itemsSubtotal.toFixed(2)}\n` +
      `${discountTextHtml}` +
      `🚚 <b>ডেলিভারি চার্জ:</b> ৳${(order.deliveryCharge || 0).toFixed(2)}\n` +
      `✨ <b>সর্বমোট প্রদেয় টাকা:</b> <b>৳${order.totalAmount.toFixed(2)}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💎 <b>হিমায়া ফ্যাশন (Himaya Fashion BD)</b>`;

    // Complete Plain Text Invoice
    const fullInvoicePlain =
      `🛍️ নতুন অর্ডার নোটিফিকেশন — হিমায়া ফ্যাশন\n` +
      `------------------------------------\n` +
      `📦 অর্ডার আইডি: #${order.id}\n` +
      `📅 সময়: ${orderTime}\n` +
      `${isFirst ? '⭐ ওয়েবসাইটে গ্রাহকের প্রথম অর্ডার!\n' : ''}` +
      `\n👤 গ্রাহকের তথ্য:\n` +
      `• নাম: ${order.customerName}\n` +
      `• ফোন: ${order.phone}\n` +
      (order.email ? `• ইমেইল: ${order.email}\n` : '') +
      `\n📍 ডেলিভারি ঠিকানা:\n` +
      `• ঠিকানা: ${order.address}\n` +
      `• এলাকা/উপজেলা: ${[order.thana, order.district].filter(Boolean).join(', ') || order.city || 'N/A'}\n` +
      `• ডেলিভারি জোন: ${order.deliveryArea || 'Inside Dhaka'} (চার্জ: ৳${order.deliveryCharge || 80})\n` +
      `\n👗 অর্ডারকৃত পণ্যসমূহ (${order.items?.length || 0}টি):\n` +
      `${itemsListPlain}\n` +
      `\n------------------------------------\n` +
      `💳 পেমেন্ট পদ্ধতি: ${paymentTextPlain}\n` +
      `💰 পণ্যের মূল্য: ৳${itemsSubtotal.toFixed(2)}\n` +
      `${discountTextPlain}` +
      `🚚 ডেলিভারি চার্জ: ৳${(order.deliveryCharge || 0).toFixed(2)}\n` +
      `✨ সর্বমোট প্রদেয় টাকা: ৳${order.totalAmount.toFixed(2)}\n` +
      `------------------------------------\n` +
      `💎 হিমায়া ফ্যাশন (Himaya Fashion BD)`;

    // WhatsApp Action Link
    const rawPhone = (order.phone || '').replace(/[^0-9]/g, '');
    let waPhone = rawPhone;
    if (waPhone.startsWith('0')) waPhone = '88' + waPhone;
    else if (!waPhone.startsWith('880') && waPhone.length === 10) waPhone = '880' + waPhone;

    const inlineKeyboard: any[] = [];
    const buttonRow: any[] = [];
    if (waPhone) {
      buttonRow.push({
        text: '💬 হোয়াটসঅ্যাপে চ্যাট করুন',
        url: `https://wa.me/${waPhone}`
      });
    }
    buttonRow.push({
      text: '🌐 হিমায়া ফ্যাশন ওয়েবসাইট',
      url: 'https://himayafashion.netlify.app'
    });
    inlineKeyboard.push(buttonRow);
    const replyMarkup = { inline_keyboard: inlineKeyboard };

    // Helper: Send message with automatic plain text fallback if HTML fails
    const sendSafeMessage = async (htmlText: string, plainText: string): Promise<boolean> => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: htmlText,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
          })
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.ok) return true;

        // If HTML parsing failed or message was rejected, retry as Plain Text
        const retryRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: plainText,
            reply_markup: replyMarkup
          })
        });
        const retryData = await retryRes.json().catch(() => null);
        return Boolean(retryRes.ok && retryData?.ok);
      } catch (err) {
        console.warn("[Telegram] sendSafeMessage error:", err);
        return false;
      }
    };

    // Collect all items with resolved image blobs or URLs
    const items = order.items || [];
    const resolvedItems: Array<{
      title: string;
      size: string;
      color: string;
      quantity: number;
      price: number;
      image: string;
      blob: Blob | null;
    }> = [];

    for (const it of items) {
      const rawImg = (it.image || '').trim();
      const blob = rawImg ? await resolveImageBlob(rawImg) : null;
      resolvedItems.push({
        title: it.title || 'Product',
        size: it.size || 'Free Size',
        color: it.color || 'Standard',
        quantity: it.quantity || 1,
        price: it.price || 0,
        image: rawImg,
        blob
      });
    }

    const itemsWithPhotos = resolvedItems.filter(i => i.blob !== null || i.image.startsWith('http://') || i.image.startsWith('https://'));

    // ==========================================
    // CASE A: Customer ordered MULTIPLE items in bag (>1 item with photos)
    // ==========================================
    if (itemsWithPhotos.length > 1) {
      let albumSent = false;

      // Attempt 1: Send as grouped photo album (sendMediaGroup)
      try {
        const formData = new FormData();
        formData.append('chat_id', chatId);

        const mediaGroupPayload: any[] = [];
        const albumBatch = itemsWithPhotos.slice(0, 10); // Telegram limit 10 items per album

        for (let idx = 0; idx < albumBatch.length; idx++) {
          const item = albumBatch[idx];
          const itemTotal = (item.price * item.quantity).toFixed(2);
          const caption = idx === 0
            ? `🛍️ <b>অর্ডার #${escapeTelegramHtml(order.id)} [পণ্য ১/${items.length}]</b>\n<b>${escapeTelegramHtml(item.title)}</b>\n• সাইজ: <code>${escapeTelegramHtml(item.size)}</code> | কালার: <code>${escapeTelegramHtml(item.color)}</code>\n• পরিমাণ: <b>${item.quantity}টি</b> x ৳${item.price} = <b>৳${itemTotal}</b>`
            : `👗 <b>[পণ্য ${idx + 1}/${items.length}] ${escapeTelegramHtml(item.title)}</b>\n• সাইজ: <code>${escapeTelegramHtml(item.size)}</code> | কালার: <code>${escapeTelegramHtml(item.color)}</code>\n• পরিমাণ: <b>${item.quantity}টি</b> x ৳${item.price} = <b>৳${itemTotal}</b>`;

          if (item.blob) {
            const attachName = `photo_${idx}`;
            formData.append(attachName, item.blob, `product_${idx + 1}.jpg`);
            mediaGroupPayload.push({
              type: 'photo',
              media: `attach://${attachName}`,
              caption,
              parse_mode: 'HTML'
            });
          } else {
            mediaGroupPayload.push({
              type: 'photo',
              media: item.image,
              caption,
              parse_mode: 'HTML'
            });
          }
        }

        formData.append('media', JSON.stringify(mediaGroupPayload));

        const mediaRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
          method: 'POST',
          body: formData
        });
        const mediaData = await mediaRes.json().catch(() => null);

        if (mediaRes.ok && mediaData?.ok) {
          albumSent = true;
          console.log(`✅ [Telegram] sendMediaGroup succeeded with ${albumBatch.length} item photos for order:`, order.id);
        } else {
          console.warn("[Telegram] sendMediaGroup note:", mediaData?.description || 'album not sent');
        }
      } catch (albumErr) {
        console.warn("[Telegram] sendMediaGroup exception:", albumErr);
      }

      // Attempt 2: If sendMediaGroup didn't go through, send individual sendPhoto for EACH ordered item!
      if (!albumSent) {
        for (let idx = 0; idx < itemsWithPhotos.length; idx++) {
          const item = itemsWithPhotos[idx];
          const itemTotal = (item.price * item.quantity).toFixed(2);
          const caption = `📦 <b>[পণ্য ${idx + 1}/${items.length}] ${escapeTelegramHtml(item.title)}</b>\n• সাইজ: <code>${escapeTelegramHtml(item.size)}</code> | কালার: <code>${escapeTelegramHtml(item.color)}</code>\n• পরিমাণ: <b>${item.quantity}টি</b> x ৳${item.price} = <b>৳${itemTotal}</b>`;

          try {
            if (item.blob) {
              const itemForm = new FormData();
              itemForm.append('chat_id', chatId);
              itemForm.append('caption', caption);
              itemForm.append('parse_mode', 'HTML');
              itemForm.append('photo', item.blob, `product_${idx + 1}.jpg`);
              await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                body: itemForm
              });
            } else if (item.image) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  photo: item.image,
                  caption,
                  parse_mode: 'HTML'
                })
              });
            }
          } catch (singlePhotoErr) {
            console.warn(`[Telegram] sendPhoto for item ${idx + 1} note:`, singlePhotoErr);
          }
        }
      }

      // Now send the complete Grand Order Invoice with customer address and WhatsApp button
      const invoiceOk = await sendSafeMessage(fullInvoiceHtml, fullInvoicePlain);
      return { success: invoiceOk, withPhoto: true };
    }

    // ==========================================
    // CASE B: Customer ordered SINGLE item with photo
    // ==========================================
    if (itemsWithPhotos.length === 1) {
      const singleItem = itemsWithPhotos[0];
      let captionHtml = fullInvoiceHtml;
      let sendInvoiceSeparately = false;

      if (captionHtml.length > 1000) {
        captionHtml = `🛍️ <b>নতুন অর্ডার #${escapeTelegramHtml(order.id)}</b>\n` +
          `• পণ্য: <b>${escapeTelegramHtml(singleItem.title)}</b>\n` +
          `• পরিমাণ: ${singleItem.quantity}টি | মূল্য: ৳${singleItem.price}\n` +
          `• মোট প্রদেয়: <b>৳${order.totalAmount.toFixed(2)}</b>\n` +
          `• গ্রাহক: <b>${escapeTelegramHtml(order.customerName)}</b> (${escapeTelegramHtml(order.phone)})\n` +
          `• ঠিকানা: ${escapeTelegramHtml(order.address)}`;
        sendInvoiceSeparately = true;
      }

      try {
        let photoSent = false;
        if (singleItem.blob) {
          const form = new FormData();
          form.append('chat_id', chatId);
          form.append('caption', captionHtml);
          form.append('parse_mode', 'HTML');
          if (!sendInvoiceSeparately) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }
          form.append('photo', singleItem.blob, 'product_image.jpg');

          const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            body: form
          });
          const photoData = await photoRes.json().catch(() => null);
          if (photoRes.ok && photoData?.ok) {
            photoSent = true;
          }
        } else if (singleItem.image.startsWith('http://') || singleItem.image.startsWith('https://')) {
          const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              photo: singleItem.image,
              caption: captionHtml,
              parse_mode: 'HTML',
              reply_markup: sendInvoiceSeparately ? undefined : replyMarkup
            })
          });
          const photoData = await photoRes.json().catch(() => null);
          if (photoRes.ok && photoData?.ok) {
            photoSent = true;
          }
        }

        if (photoSent) {
          if (sendInvoiceSeparately) {
            await sendSafeMessage(fullInvoiceHtml, fullInvoicePlain);
          }
          return { success: true, withPhoto: true };
        }
      } catch (photoErr) {
        console.warn("[Telegram] Client single sendPhoto note:", photoErr);
      }
    }

    // ==========================================
    // CASE C: Fallback to text sendMessage
    // ==========================================
    const success = await sendSafeMessage(fullInvoiceHtml, fullInvoicePlain);
    console.log("✅ [Telegram] Order invoice dispatch status:", success, "Order ID:", order.id);
    return { success, withPhoto: false };
  } catch (err: any) {
    console.warn("[Telegram] Client dispatch exception:", err?.message || err);
    return { success: false, error: err?.message || 'Notification failed' };
  }
}
