import { Order, StoreSettings } from '../types';

function escapeTelegramHtml(unsafe?: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Dispatches an order notification directly to Telegram Bot API with product photo.
 * Works seamlessly in both browser (Netlify/static deployment) and backend.
 */
export async function sendTelegramOrderNotificationClient(
  order: Order,
  settings?: StoreSettings | null
): Promise<{ success: boolean; withPhoto?: boolean; error?: string }> {
  try {
    const rawToken = settings?.telegramBotToken || "8964946844:AAGtnJBIcNqoUXAfin_OXI9wglopYGfDsUA";
    const botToken = (rawToken || "").replace(/\s+/g, '').trim();
    const chatId = (settings?.telegramChatId || "6333005937").trim();

    if (!botToken || !chatId) {
      console.warn("[Telegram] Bot Token or Chat ID is missing. Skipping notification.");
      return { success: false, error: "Bot token or Chat ID is not configured" };
    }

    if (settings?.isTelegramNotificationsEnabled === false) {
      console.info("[Telegram] Notifications are disabled in store settings.");
      return { success: false, error: "Telegram notifications are turned off" };
    }

    const orderTime = new Date(order.createdAt || Date.now()).toLocaleString('bn-BD', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const isFirst = order.isFirstOrder ?? true;

    // Identify primary product photo
    let primaryImage = '';
    for (const item of (order.items || [])) {
      if (item.image && typeof item.image === 'string' && item.image.trim()) {
        primaryImage = item.image.trim();
        break;
      }
    }

    // Prepare items list text
    const itemsList = (order.items || []).map((item, idx) => {
      let t = `<b>${idx + 1}. ${escapeTelegramHtml(item.title)}</b>\n`;
      t += `   • সাইজ: <code>${escapeTelegramHtml(item.size || 'Free Size')}</code> | কালার: <code>${escapeTelegramHtml(item.color || 'Default')}</code>\n`;
      t += `   • পরিমাণ: <b>${item.quantity}টি</b> x ৳${item.price} = <b>৳${(item.price * item.quantity).toFixed(2)}</b>`;
      return t;
    }).join('\n');

    const paymentText = order.paymentMethod === 'bkash'
      ? `বিকাশ (bKash)${order.paymentTrxId ? ` | TrxID: <code>${escapeTelegramHtml(order.paymentTrxId)}</code> (প্রেরক: <code>${escapeTelegramHtml(order.paymentSenderPhone || '')}</code>)` : ''}`
      : order.paymentMethod === 'nagad'
      ? `নগদ (Nagad)${order.paymentTrxId ? ` | TrxID: <code>${escapeTelegramHtml(order.paymentTrxId)}</code> (প্রেরক: <code>${escapeTelegramHtml(order.paymentSenderPhone || '')}</code>)` : ''}`
      : 'ক্যাশ অন ডেলিভারি (Cash on Delivery)';

    const discountText = (order.discountAmount && order.discountAmount > 0)
      ? `🎟️ <b>কুপন ডিসকাউন্ট (${escapeTelegramHtml(order.couponCode || 'PROMO')}):</b> -৳${order.discountAmount.toFixed(2)}\n`
      : '';

    const itemsSubtotal = (order.totalAmount - (order.deliveryCharge || 0) + (order.discountAmount || 0));

    const headerHtml =
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
      `\n👗 <b>অর্ডারকৃত পণ্যসমূহ (${order.items?.length || 0}টি):</b>\n`;

    const footerHtml =
      `\n━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 <b>পেমেন্ট পদ্ধতি:</b> ${paymentText}\n` +
      `💰 <b>পণ্যের মূল্য:</b> ৳${itemsSubtotal.toFixed(2)}\n` +
      `${discountText}` +
      `🚚 <b>ডেলিভারি চার্জ:</b> ৳${(order.deliveryCharge || 0).toFixed(2)}\n` +
      `✨ <b>সর্বমোট প্রদেয় টাকা:</b> <b>৳${order.totalAmount.toFixed(2)}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💎 <b>হিমায়া ফ্যাশন (Himaya Fashion BD)</b>`;

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

    // Caption limit in Telegram sendPhoto is 1024 chars
    let fullMessageHtml = `${headerHtml}${itemsList}${footerHtml}`;
    let captionHtml = fullMessageHtml;
    if (captionHtml.length > 1000) {
      const truncatedItems = (order.items || []).slice(0, 2).map((item, idx) => 
        `<b>${idx + 1}. ${escapeTelegramHtml(item.title)}</b> (${item.quantity}টি - ৳${item.price})`
      ).join('\n') + `\n<i>...এবং আরও ${(order.items || []).length - 2}টি পণ্য</i>`;
      captionHtml = `${headerHtml}${truncatedItems}${footerHtml}`;
      if (captionHtml.length > 1000) {
        captionHtml = captionHtml.substring(0, 995) + '...';
      }
    }

    // Try sending photo
    if (primaryImage) {
      try {
        // Case 1: Remote HTTP/HTTPS URL
        if (primaryImage.startsWith('http://') || primaryImage.startsWith('https://')) {
          const photoUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
          const photoRes = await fetch(photoUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              photo: primaryImage,
              caption: captionHtml,
              parse_mode: 'HTML',
              reply_markup: replyMarkup
            })
          });
          const photoData = await photoRes.json().catch(() => null);
          if (photoRes.ok && photoData?.ok) {
            console.log("✅ Telegram client sendPhoto succeeded with remote URL for order:", order.id);
            return { success: true, withPhoto: true };
          }
        } 
        // Case 2: Base64 Data URL in browser
        else if (primaryImage.startsWith('data:image/')) {
          const byteString = atob(primaryImage.split(',')[1]);
          const mimeString = primaryImage.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });

          const formData = new FormData();
          formData.append('chat_id', chatId);
          formData.append('caption', captionHtml);
          formData.append('parse_mode', 'HTML');
          formData.append('reply_markup', JSON.stringify(replyMarkup));
          formData.append('photo', blob, 'product_image.jpg');

          const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            body: formData
          });
          const photoData = await photoRes.json().catch(() => null);
          if (photoRes.ok && photoData?.ok) {
            console.log("✅ Telegram client sendPhoto succeeded with base64 blob for order:", order.id);
            return { success: true, withPhoto: true };
          }
        }
      } catch (photoErr) {
        console.warn("[Telegram] Client sendPhoto failed, falling back to sendMessage:", photoErr);
      }
    }

    // Fallback to text sendMessage
    const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: fullMessageHtml,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    const msgData = await msgRes.json().catch(() => null);
    if (!msgRes.ok || !msgData?.ok) {
      console.error("[Telegram] Client sendMessage failed:", msgData);
      return { success: false, error: msgData?.description || 'Failed to send Telegram message' };
    }

    console.log("✅ Telegram client sendMessage succeeded for order:", order.id);
    return { success: true, withPhoto: false };
  } catch (err: any) {
    console.error("[Telegram] Client dispatch exception:", err);
    return { success: false, error: err.message || 'Notification failed' };
  }
}
