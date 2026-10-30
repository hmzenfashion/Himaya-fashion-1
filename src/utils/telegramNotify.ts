import { Order, StoreSettings } from '../types';

function escapeTelegramHtml(unsafe?: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Converts a base64 data URI, remote URL, or relative URL to a Blob in the browser.
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
      console.warn("Base64 to blob conversion failed:", e);
      return null;
    }
  }

  // 2. Remote HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const res = await fetch(trimmed);
      if (res.ok) return await res.blob();
    } catch {}
    return null;
  }

  // 3. Relative path (e.g. /assets/... or /uploads/...)
  if (trimmed.startsWith('/')) {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(origin + trimmed);
      if (res.ok) return await res.blob();
    } catch {}
    return null;
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

    // Build item text breakdown
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

    const fullInvoiceHtml = `${headerHtml}${itemsList}${footerHtml}`;

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
        const albumBatch = itemsWithPhotos.slice(0, 10); // Telegram maximum 10 items per album

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
          console.log(`✅ Telegram sendMediaGroup succeeded with ${albumBatch.length} item photos for order:`, order.id);
        } else if (mediaRes.status === 401 || mediaData?.error_code === 401) {
          console.warn("[Telegram] Bot token is unauthorized (401). Please update Bot Token in Admin Settings.");
          return { success: false, error: "Telegram Bot Token is unauthorized (401). Please check Bot Token in Admin Settings." };
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
              const pRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                body: itemForm
              });
              if (pRes.status === 401) {
                console.warn("[Telegram] Bot token is unauthorized (401). Stopping photo dispatch.");
                return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
              }
            } else if (item.image) {
              const pRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  photo: item.image,
                  caption,
                  parse_mode: 'HTML'
                })
              });
              if (pRes.status === 401) {
                console.warn("[Telegram] Bot token is unauthorized (401). Stopping photo dispatch.");
                return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
              }
            }
          } catch (singlePhotoErr) {
            console.warn(`[Telegram] sendPhoto for item ${idx + 1} note:`, singlePhotoErr);
          }
        }
      }

      // Now send the complete Grand Order Invoice with customer address and WhatsApp button
      const invoiceRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: fullInvoiceHtml,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        })
      });
      const invoiceData = await invoiceRes.json().catch(() => null);

      if (invoiceRes.ok && invoiceData?.ok) {
        return { success: true, withPhoto: true };
      }
      if (invoiceRes.status === 401 || invoiceData?.error_code === 401) {
        console.warn("[Telegram] Bot token is unauthorized (401). Please update Bot Token in Admin Settings.");
        return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
      }
      return { success: false, error: invoiceData?.description || 'Invoice send failed' };
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
          } else if (photoRes.status === 401 || photoData?.error_code === 401) {
            console.warn("[Telegram] Bot token is unauthorized (401). Please update Bot Token in Admin Settings.");
            return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
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
          } else if (photoRes.status === 401 || photoData?.error_code === 401) {
            console.warn("[Telegram] Bot token is unauthorized (401). Please update Bot Token in Admin Settings.");
            return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
          }
        }

        if (photoSent) {
          if (sendInvoiceSeparately) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: fullInvoiceHtml,
                parse_mode: 'HTML',
                reply_markup: replyMarkup
              })
            });
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
    const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: fullInvoiceHtml,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    const msgData = await msgRes.json().catch(() => null);
    if (msgRes.status === 401 || msgData?.error_code === 401) {
      console.warn("[Telegram] Bot token is unauthorized (401). Please update Bot Token in Admin Settings.");
      return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
    }
    if (!msgRes.ok || !msgData?.ok) {
      console.warn("[Telegram] Client sendMessage note:", msgData?.description);
      return { success: false, error: msgData?.description || 'Failed to send Telegram message' };
    }

    console.log("✅ Telegram client sendMessage succeeded for order:", order.id);
    return { success: true, withPhoto: false };
  } catch (err: any) {
    console.warn("[Telegram] Client dispatch note:", err?.message || err);
    return { success: false, error: err.message || 'Notification failed' };
  }
}
