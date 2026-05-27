/**
 * ONE TopUp — Set Telegram Webhook
 * Jalankan file ini SEKALI setelah deploy ke Netlify
 *
 * Cara pakai:
 *   1. Isi BOT_TOKEN dan NETLIFY_URL di bawah
 *   2. Buka file ini di browser: https://[domain]/.netlify/functions/set-webhook
 *      ATAU jalankan di terminal: node set-webhook.js
 */

// ── JIKA DIJALANKAN LEWAT BROWSER (sebagai Netlify function) ──
exports.handler = async () => {
  const BOT_TOKEN   = process.env.TG_BOT_TOKEN;
  const NETLIFY_URL = process.env.URL; // Netlify otomatis set ini

  const webhookUrl = `${NETLIFY_URL}/.netlify/functions/telegram-webhook`;

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    }
  );
  const data = await res.json();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message:    data.ok ? '✅ Webhook berhasil dipasang!' : '❌ Gagal',
      webhookUrl: webhookUrl,
      telegramResponse: data,
    }, null, 2),
  };
};

// ── JIKA DIJALANKAN LANGSUNG DI TERMINAL (node set-webhook.js) ──
if (require.main === module) {
  const BOT_TOKEN   = 'ISI_TOKEN_BOT_KAMU';         // ← ganti
  const NETLIFY_URL = 'https://onetopup.netlify.app'; // ← ganti

  const webhookUrl = `${NETLIFY_URL}/.netlify/functions/telegram-webhook`;

  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  })
  .then(r => r.json())
  .then(data => {
    console.log(data.ok ? '✅ Webhook berhasil!' : '❌ Gagal:');
    console.log('URL:', webhookUrl);
    console.log(data);
  });
}
