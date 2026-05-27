/**
 * ONE TopUp — Telegram Webhook Handler
 * Netlify Serverless Function
 *
 * Deploy path: netlify/functions/telegram-webhook.js
 * URL otomatis: https://[domain]/.netlify/functions/telegram-webhook
 *
 * Fungsi ini menerima callback dari tombol inline keyboard Telegram:
 *   ✅ Konfirmasi Bayar  → update order status ke Paid → assign voucher → notif selesai
 *   ❌ Batalkan Order    → update order status ke Cancelled → notif ke admin
 */

const { createClient } = require('@supabase/supabase-js');

// ── CONFIG — isi sesuai app.js ──
const CFG = {
  supabaseUrl:  process.env.SUPABASE_URL  || 'https://XXXXX.supabase.co',
  supabaseKey:  process.env.SUPABASE_KEY  || 'eyJ...',
  tgBotToken:   process.env.TG_BOT_TOKEN  || '12345:ABCdef',
  tgChatId:     process.env.TG_CHAT_ID    || '1234567890',
  duniaGamesBase: 'https://duniagames.co.id/dg-voucher/redeem-voucher/',
};

const sb = createClient(CFG.supabaseUrl, CFG.supabaseKey);

// ── HELPER: kirim/edit pesan Telegram ──
async function tgSend(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${CFG.tgBotToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── HELPER: ambil voucher tersedia dari stok Supabase (tabel redeem_codes) ──
async function getAvailableVoucher(game) {
  const gameKey = (game || '').toLowerCase().includes('mobile') ? 'ml' : 'ff';
  const { data } = await sb
    .from('redeem_codes')
    .select('*')
    .eq('used', false)
    .eq('game', gameKey)
    .order('createdAt', { ascending: true })
    .limit(1);
  return data?.[0] || null;
}

// ── HELPER: format rupiah ──
const fmt = n => 'Rp ' + parseInt(n).toLocaleString('id-ID');
const fmtN = n => parseInt(n).toLocaleString('id-ID');

// ── MAIN HANDLER ──
exports.handler = async (event) => {
  // Hanya terima POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let update;
  try {
    update = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Bad Request' };
  }

  // Hanya proses callback_query (dari tombol inline)
  const cb = update.callback_query;
  if (!cb) return { statusCode: 200, body: 'OK' };

  const cbId     = cb.id;
  const data     = cb.data || '';
  const msgId    = cb.message?.message_id;
  const chatId   = cb.message?.chat?.id;
  const origText = cb.message?.text || '';

  // ── Parse action & orderId dari callback_data ──
  // Format: "confirm_OT12345678" atau "cancel_OT12345678"
  const [action, orderId] = data.split('_');

  if (!orderId || !['confirm', 'cancel'].includes(action)) {
    await tgSend('answerCallbackQuery', { callback_query_id: cbId, text: '⚠️ Data tidak valid.' });
    return { statusCode: 200, body: 'OK' };
  }

  // ── Ambil data order dari Supabase ──
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (orderErr || !order) {
    await tgSend('answerCallbackQuery', { callback_query_id: cbId, text: '❌ Order tidak ditemukan.' });
    return { statusCode: 200, body: 'OK' };
  }

  // Cegah double-process
  if (order.status === 'Completed' || order.status === 'Cancelled') {
    await tgSend('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `Order ini sudah ${order.status === 'Completed' ? 'selesai ✅' : 'dibatalkan ❌'}.`,
      show_alert: true,
    });
    return { statusCode: 200, body: 'OK' };
  }

  // ════════════════════════════════════════════════
  // ✅ KONFIRMASI BAYAR
  // ════════════════════════════════════════════════
  if (action === 'confirm') {
    // Cari voucher yang tersedia sesuai game
    const voucher = await getAvailableVoucher(order.game);
    const voucherCode = voucher?.code || null;
    const duniaUrl    = voucherCode ? CFG.duniaGamesBase + voucherCode : null;

    // Update status order → Paid (atau Processing jika voucher tersedia)
    const newStatus = voucherCode ? 'Processing' : 'Paid';
    await sb.from('orders').update({
      status:          newStatus,
      voucher_code:    voucherCode,
      dunia_games_url: duniaUrl,
      updated_at:      new Date().toISOString(),
    }).eq('order_id', orderId);

    // Mark voucher sebagai used
    if (voucher) {
      await sb.from('redeem_codes').update({
        used:    true,
        usedAt:  new Date().toISOString(),
        orderId: orderId,
      }).eq('code', voucherCode);
    }

    // ── Edit pesan Telegram: hapus tombol, tampilkan ringkasan ──
    const editedText = [
      `✅ *DIKONFIRMASI — ONE TopUp*`,
      `━━━━━━━━━━━━━━━━`,
      `Order ID  : *${orderId}*`,
      `Game      : ${order.game}`,
      `Nominal   : *${fmtN(order.amt)} ${order.unit}* 💎`,
      `Total     : *${fmt(order.price)}*`,
      `Bayar via : ${order.pay_method}`,
      `ID Game   : *${order.id_game}*`,
      `━━━━━━━━━━━━━━━━`,
      voucherCode
        ? `🎟️ Voucher : \`${voucherCode}\``
        : `⚠️ Stok voucher kosong — assign manual!`,
      duniaUrl
        ? `🌐 [Buka Dunia Games](${duniaUrl})`
        : null,
      `━━━━━━━━━━━━━━━━`,
      `_Pembayaran dikonfirmasi. ${voucherCode ? 'Selesaikan redeem di Dunia Games.' : 'Tambah stok voucher lalu proses manual.'}_`,
    ].filter(Boolean).join('\n');

    // Edit pesan asli — hapus inline keyboard, ganti isi
    await tgSend('editMessageText', {
      chat_id:    chatId,
      message_id: msgId,
      text:       editedText,
      parse_mode: 'Markdown',
      // Jika ada voucher, tambah tombol 1-klik buka Dunia Games
      ...(duniaUrl ? {
        reply_markup: {
          inline_keyboard: [[
            { text: '🌐 Buka Dunia Games', url: duniaUrl },
            { text: '✅ Tandai Selesai', callback_data: 'done_' + orderId },
          ]]
        }
      } : {}),
    });

    // Jawab callback agar loading spinner berhenti
    await tgSend('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `✅ Order ${orderId} dikonfirmasi!`,
      show_alert: false,
    });

  // ════════════════════════════════════════════════
  // ✅ TANDAI SELESAI (setelah redeem di Dunia Games)
  // ════════════════════════════════════════════════
  } else if (action === 'done') {
    await sb.from('orders').update({
      status:     'Completed',
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId);

    const doneText = [
      `✅ *SELESAI — ONE TopUp*`,
      `━━━━━━━━━━━━━━━━`,
      `Order ID  : *${orderId}*`,
      `Game      : ${order.game}`,
      `Nominal   : *${fmtN(order.amt)} ${order.unit}* 💎`,
      `━━━━━━━━━━━━━━━━`,
      `_Diamond sudah masuk ke akun customer._ 🎉`,
    ].join('\n');

    await tgSend('editMessageText', {
      chat_id:    chatId,
      message_id: msgId,
      text:       doneText,
      parse_mode: 'Markdown',
    });

    await tgSend('answerCallbackQuery', {
      callback_query_id: cbId,
      text: '✅ Order selesai!',
    });

  // ════════════════════════════════════════════════
  // ❌ BATALKAN ORDER
  // ════════════════════════════════════════════════
  } else if (action === 'cancel') {
    await sb.from('orders').update({
      status:     'Cancelled',
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId);

    const cancelText = [
      `❌ *DIBATALKAN — ONE TopUp*`,
      `━━━━━━━━━━━━━━━━`,
      `Order ID  : *${orderId}*`,
      `Game      : ${order.game}`,
      `Nominal   : *${fmtN(order.amt)} ${order.unit}* 💎`,
      `Total     : *${fmt(order.price)}*`,
      `━━━━━━━━━━━━━━━━`,
      `_Order ini telah dibatalkan oleh admin._`,
    ].join('\n');

    await tgSend('editMessageText', {
      chat_id:    chatId,
      message_id: msgId,
      text:       cancelText,
      parse_mode: 'Markdown',
    });

    await tgSend('answerCallbackQuery', {
      callback_query_id: cbId,
      text: '❌ Order dibatalkan.',
    });
  }

  return { statusCode: 200, body: 'OK' };
};
