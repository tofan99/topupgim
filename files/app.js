/* ============================================================
   ONE TopUp — app.js
   Sistem Redeem Kode Otomatis + Cek Status Pembayaran
   ============================================================ */

// ────────────────────────────────────────────────────────────
// KONFIGURASI UTAMA
// ────────────────────────────────────────────────────────────
const CFG = {
  supabaseUrl: 'https://tcnratctwezzhxtrzfqo.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbnJhdGN0d2V6emh4dHJ6ZnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MjkzMDksImV4cCI6MjA5NTEwNTMwOX0.tc6lLDOceuv_L6mFXKRSfNYw8LJsIFYCOcETPTBulrg',
  tgBotToken:  '8530811986:AAGweu9eyUEtjWeKLdJpMtwBAKaH1sql7jY',
  tgChatId:    '1373603810',
  adminWA:     '6281239515295',
  adminTG:     'onetopup02',
  qrisImage:   'https://i.ibb.co/Wv47wGB9/qr-ID1026524066705-24-05-26-1779608209-1779608209749.jpg',
  rekening: {
    'QRIS':      { label:'QRIS — Scan & Pay', number:'ID1026524066705',  holder:'One Top-up' },
    'DANA':      { label:'DANA',              number:'081938282686',     holder:'Taufan Pebriawan' },
    'GoPay':     { label:'GoPay',             number:'081938282686',     holder:'Taufan Pebriawan' },
    'ShopeePay': { label:'ShopeePay',         number:'081938282686',     holder:'Taufan Pebriawan' },
    'BCA':       { label:'Bank BCA',          number:'7255215663',       holder:'Taufan Pebriawan' },
    'Mandiri':   { label:'Bank Mandiri',      number:'1610014973627',    holder:'Taufan Pebriawan' },
    'SeaBank':   { label:'Bank SeaBank',      number:'901383895634',     holder:'Taufan Pebriawan' },
  }
};

// ────────────────────────────────────────────────────────────
// INISIALISASI SUPABASE
// ────────────────────────────────────────────────────────────
let sb = null;
try { sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey); } catch(e) {}

// ────────────────────────────────────────────────────────────
// DATA GAME & PAKET
// ────────────────────────────────────────────────────────────
const GAMES = {
  ff: {
    name:'Free Fire', sub:'Top up diamond FF aman, murah & cepat',
    icon:'💎', unit:'Diamond', bannerClass:'banner-ff',
    pkgs:[
      {id:'ff-50',   amt:50,   price:5000,   popular:false, bonus:null},
      {id:'ff-100',  amt:100,  price:12000,  popular:false, bonus:null},
      {id:'ff-150',  amt:150,  price:20000,  popular:false, bonus:null},
      {id:'ff-350',  amt:350,  price:40000,  popular:false, bonus:'+ 50 Diamond'},
      {id:'ff-500',  amt:500,  price:65000,  popular:true,  bonus:'+ 50 Diamond'},
      {id:'ff-750',  amt:750,  price:90000,  popular:false, bonus:'+ 50 Diamond'},
      {id:'ff-1000', amt:1000, price:120000, popular:true,  bonus:'+ 50 Diamond'},
      {id:'ff-1450', amt:1450, price:165000, popular:false, bonus:'+ 100 Diamond'},
      {id:'ff-1800', amt:1800, price:235000, popular:false, bonus:'+ 100 Diamond'},
      {id:'ff-2200', amt:2200, price:275000, popular:false, bonus:'+ 150 Diamond'},
      {id:'ff-3650', amt:3650, price:440000, popular:false, bonus:'+ 200 Diamond'},
    ]
  },
  ml: {
    name:'Mobile Legends', sub:'Top up diamond MLBB harga hemat',
    icon:'💎', unit:'Diamond', bannerClass:'banner-ml',
    pkgs:[
      {id:'ml-24',   amt:24,   price:5000,   popular:false, bonus:null},
      {id:'ml-48',   amt:48,   price:11000,  popular:false, bonus:null},
      {id:'ml-72',   amt:72,   price:17000,  popular:false, bonus:null},
      {id:'ml-96',   amt:96,   price:24000,  popular:false, bonus:null},
      {id:'ml-120',  amt:120,  price:38000,  popular:true,  bonus:null},
      {id:'ml-240',  amt:240,  price:70000,  popular:false, bonus:null},
      {id:'ml-480',  amt:480,  price:135000, popular:false, bonus:null},
      {id:'ml-720',  amt:720,  price:210000, popular:false, bonus:null},
      {id:'ml-768',  amt:720,  price:190000, popular:false, bonus:'48 Diamond', discount:10},
      {id:'ml-1200', amt:1200, price:305000, popular:true,  bonus:null},
      {id:'ml-1920', amt:1920, price:487000, popular:false, bonus:null},
      {id:'ml-2400', amt:2400, price:610000, popular:false, bonus:null},
      {id:'ml-4320', amt:4320, price:1120000,popular:false, bonus:null},
      {id:'ml-6000', amt:6000, price:1510000,popular:false, bonus:null},
    ]
  }
};

const PAYS = [
  {id:'QRIS',      icon:'⬛', name:'QRIS',              desc:'Scan QR • Semua E-Wallet & Bank'},
  {id:'DANA',      icon:'🔵', name:'DANA',              desc:'E-Wallet'},
  {id:'GoPay',     icon:'🟢', name:'GoPay',             desc:'E-Wallet'},
  {id:'ShopeePay', icon:'🟠', name:'ShopeePay',         desc:'E-Wallet'},
  {id:'BCA',       icon:'🏦', name:'Transfer BCA',      desc:'Bank Transfer'},
  {id:'Mandiri',   icon:'🔴', name:'Transfer Mandiri',  desc:'Bank Transfer'},
  {id:'SeaBank',   icon:'🟩', name:'Transfer SeaBank',  desc:'Bank Transfer'},
];

// ────────────────────────────────────────────────────────────
// STATE GLOBAL
// ────────────────────────────────────────────────────────────
let S = { game:'ff', pkg:null, step:1, pay:null };
let pendingRedeemOrder = null; // menyimpan order redeem yang menunggu pembayaran
let paymentCheckInterval = null;

const fmt  = n => 'Rp ' + parseInt(n).toLocaleString('id-ID');
const fmtN = n => parseInt(n).toLocaleString('id-ID');

// ────────────────────────────────────────────────────────────
// SISTEM REDEEM KODE
// ────────────────────────────────────────────────────────────

/**
 * Proses utama redeem kode:
 * 1. Validasi format kode
 * 2. Cek ke database/storage
 * 3. Cek status pembayaran order terkait
 * 4. Jika sudah bayar → proses diamond langsung
 * 5. Jika belum bayar → tampilkan status pending
 */
async function processRedeemCode() {
  const input = document.getElementById('redeem-code-input');
  const code = input.value.trim().toUpperCase();

  if (!code) { toast('⚠️ Masukkan kode redeem terlebih dahulu!', true); return; }
  if (code.length < 8) { toast('⚠️ Format kode tidak valid!', true); return; }

  // Set loading state
  const btn = document.getElementById('redeem-btn');
  const btnText = document.getElementById('redeem-btn-text');
  btn.disabled = true;
  btnText.textContent = '⏳ Memeriksa...';
  showRedeemStatus('processing', '🔍 Memeriksa kode redeem, mohon tunggu...');

  try {
    // Step 1: Cari kode di storage
    const redeemData = await findRedeemCode(code);

    if (!redeemData) {
      showRedeemStatus('error', '❌ Kode redeem tidak ditemukan atau sudah tidak berlaku.');
      btn.disabled = false;
      btnText.textContent = 'Redeem';
      return;
    }

    if (redeemData.used) {
      showRedeemStatus('error', `❌ Kode <strong>${code}</strong> sudah pernah digunakan pada ${formatDate(redeemData.usedAt)}.`);
      btn.disabled = false;
      btnText.textContent = 'Redeem';
      return;
    }

    // Step 2: Cek status pembayaran order terkait
    const paymentStatus = await checkPaymentStatus(redeemData.orderId);

    // Step 3: Tampilkan modal sesuai status
    showRedeemModal(code, redeemData, paymentStatus);

  } catch (err) {
    console.error('Redeem error:', err);
    showRedeemStatus('error', '❌ Gagal memproses kode. Coba lagi atau hubungi admin.');
  }

  btn.disabled = false;
  btnText.textContent = 'Redeem';
  document.getElementById('redeem-status').style.display = 'none';
}

/**
 * Cari kode redeem di Supabase atau localStorage
 */
async function findRedeemCode(code) {
  // Coba Supabase dulu
  if (sb && CFG.supabaseUrl !== 'GANTI_SUPABASE_URL') {
    try {
      const { data, error } = await sb.from('redeem_codes').select('*').eq('code', code).single();
      if (!error && data) return data;
    } catch(e) {}
  }

  // Fallback ke localStorage
  const codes = JSON.parse(localStorage.getItem('onetopup_redeem_codes') || '[]');
  return codes.find(c => c.code === code) || null;
}

/**
 * Cek status pembayaran order di Supabase atau localStorage
 */
async function checkPaymentStatus(orderId) {
  if (!orderId) return { status: 'unknown', paid: false };

  // Coba Supabase
  if (sb && CFG.supabaseUrl !== 'GANTI_SUPABASE_URL') {
    try {
      const { data, error } = await sb.from('orders').select('*').eq('order_id', orderId).single();
      if (!error && data) {
        return {
          orderId:    data.order_id,
          status:     data.status,
          paid:       data.status === 'Paid' || data.status === 'Completed',
          processed:  data.status === 'Completed' || data.status === 'Delivered',
          game:       data.game,
          amt:        data.amt,
          unit:       data.unit,
          payMethod:  data.pay_method,
          idGame:     data.id_game,
          price:      data.price,
          createdAt:  data.created_at,
        };
      }
    } catch(e) {}
  }

  // Fallback localStorage
  const orders = JSON.parse(localStorage.getItem('onetopup_log') || '[]');
  const order = orders.find(o => o.order_id === orderId);
  if (!order) return { status: 'not_found', paid: false };

  return {
    orderId:   order.order_id,
    status:    order.status,
    paid:      order.status === 'Paid' || order.status === 'Completed',
    processed: order.status === 'Completed' || order.status === 'Delivered',
    game:      order.game,
    amt:       order.amt,
    unit:      order.unit,
    payMethod: order.pay_method,
    idGame:    order.id_game,
    price:     order.price,
    createdAt: order.created_at,
  };
}

/**
 * Tampilkan modal hasil redeem sesuai status pembayaran
 */
function showRedeemModal(code, redeemData, paymentStatus) {
  const modal = document.getElementById('redeem-modal');
  const icon  = document.getElementById('modal-icon');
  const title = document.getElementById('modal-title');
  const body  = document.getElementById('modal-body');
  const statusBox = document.getElementById('modal-status-box');
  const actions   = document.getElementById('modal-actions');

  // Baris info dasar kode
  const codeInfo = `
    <div class="modal-status-box" style="margin-bottom:10px">
      <div class="modal-status-row"><span class="msr-key">Kode</span><span class="msr-val blue" style="font-family:'Space Grotesk',monospace;letter-spacing:1px">${code}</span></div>
      <div class="modal-status-row"><span class="msr-key">Game</span><span class="msr-val">${redeemData.game || paymentStatus.game || '—'}</span></div>
      <div class="modal-status-row"><span class="msr-key">Nominal</span><span class="msr-val">${fmtN(redeemData.amt || paymentStatus.amt)} ${redeemData.unit || paymentStatus.unit || 'Diamond'} 💎</span></div>
      <div class="modal-status-row"><span class="msr-key">Order ID</span><span class="msr-val">${redeemData.orderId || '—'}</span></div>
    </div>`;

  // ── CASE 1: Order sudah diproses / diamond sudah masuk ──
  if (paymentStatus.processed) {
    icon.textContent = '✅';
    title.textContent = 'Diamond Sudah Dikirim!';
    body.innerHTML = `Diamond untuk kode ini <strong>sudah berhasil dikirim</strong> ke akun game kamu.`;
    statusBox.innerHTML = codeInfo + `
      <div class="modal-status-row"><span class="msr-key">Status Bayar</span><span class="msr-val green">✅ Lunas</span></div>
      <div class="modal-status-row"><span class="msr-key">Status Diamond</span><span class="msr-val green">✅ Sudah Masuk</span></div>
    `;
    actions.innerHTML = `<button class="btn-modal-primary" onclick="closeRedeemModal()">Tutup</button>`;

  // ── CASE 2: Sudah bayar, diamond sedang diproses ──
  } else if (paymentStatus.paid) {
    icon.textContent = '⚡';
    title.textContent = 'Pembayaran Diterima!';
    body.innerHTML = `Pembayaran <strong>sudah dikonfirmasi</strong>. Diamond sedang diproses oleh admin dan akan masuk dalam <strong style="color:var(--primary)">1–5 menit</strong>.`;
    statusBox.innerHTML = codeInfo + `
      <div class="modal-status-row"><span class="msr-key">Status Bayar</span><span class="msr-val green">✅ Lunas</span></div>
      <div class="modal-status-row"><span class="msr-key">Status Diamond</span><span class="msr-val blue">⏳ Sedang Diproses</span></div>
    `;
    actions.innerHTML = `
      <button class="btn-modal-primary" onclick="autoProcessDiamond('${code}', '${JSON.stringify(redeemData).replace(/'/g,"\\'")}')">⚡ Proses Sekarang</button>
    `;
    // Mulai polling otomatis
    startPaymentPolling(code, redeemData);

  // ── CASE 3: Belum bayar → PENDING ──
  } else if (paymentStatus.status === 'Pending' || paymentStatus.status === 'pending') {
    icon.textContent = '⏳';
    title.textContent = 'Menunggu Pembayaran';
    body.innerHTML = `Kode redeem valid! Namun <strong>pembayaran belum dikonfirmasi</strong>. Selesaikan pembayaran terlebih dahulu, lalu diamond akan otomatis diproses.`;
    statusBox.innerHTML = codeInfo + `
      <div class="modal-status-row"><span class="msr-key">Status Bayar</span><span class="msr-val orange">⏳ Belum Lunas</span></div>
      <div class="modal-status-row"><span class="msr-key">Status Diamond</span><span class="msr-val" style="color:#92400E">🔒 Pending — Menunggu Bayar</span></div>
      <div class="modal-status-row"><span class="msr-key">Metode Bayar</span><span class="msr-val">${paymentStatus.payMethod || '—'}</span></div>
      <div class="modal-status-row"><span class="msr-key">Total Bayar</span><span class="msr-val orange">${fmt(paymentStatus.price || 0)}</span></div>
    `;
    actions.innerHTML = `
      <button class="btn-modal-pending" onclick="checkPendingAndProcess('${code}', '${redeemData.orderId}')">🔄 Cek Ulang Pembayaran</button>
      <button class="btn-modal-primary" onclick="openPaymentGuide('${redeemData.orderId}', '${paymentStatus.payMethod}')">💳 Cara Bayar</button>
    `;

    // Tampilkan pending bar
    showPendingBar(code, redeemData);
    pendingRedeemOrder = { code, redeemData, paymentStatus };

    // Auto polling tiap 10 detik
    startPaymentPolling(code, redeemData);

  // ── CASE 4: Tidak diketahui / order tidak ditemukan ──
  } else {
    icon.textContent = '🎟️';
    title.textContent = 'Kode Valid!';
    body.innerHTML = `Kode redeem <strong>${code}</strong> valid. Hubungi admin untuk verifikasi manual.`;
    statusBox.innerHTML = codeInfo;
    actions.innerHTML = `
      <a href="https://wa.me/${CFG.adminWA}?text=${encodeURIComponent('Halo admin, saya ingin redeem kode: ' + code)}" target="_blank" class="btn btn-wa" style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:10px;font-weight:700;font-size:0.9rem;">💬 Konfirmasi ke Admin</a>
    `;
  }

  modal.style.display = 'flex';
}

/**
 * Proses pengisian diamond secara otomatis setelah pembayaran lunas
 */
async function autoProcessDiamond(code, redeemDataStr) {
  const redeemData = JSON.parse(redeemDataStr);
  showLoading('⚡ Memproses pengisian diamond...');

  try {
    // Update status order ke "Processing" di Supabase
    if (sb && CFG.supabaseUrl !== 'GANTI_SUPABASE_URL') {
      await sb.from('orders').update({ status: 'Processing', updated_at: new Date().toISOString() })
              .eq('order_id', redeemData.orderId);

      // Mark kode sebagai used
      await sb.from('redeem_codes').update({ used: true, usedAt: new Date().toISOString() })
              .eq('code', code);
    } else {
      // LocalStorage fallback
      const orders = JSON.parse(localStorage.getItem('onetopup_log') || '[]');
      const idx = orders.findIndex(o => o.order_id === redeemData.orderId);
      if (idx !== -1) { orders[idx].status = 'Processing'; localStorage.setItem('onetopup_log', JSON.stringify(orders)); }

      const codes = JSON.parse(localStorage.getItem('onetopup_redeem_codes') || '[]');
      const cidx = codes.findIndex(c => c.code === code);
      if (cidx !== -1) { codes[cidx].used = true; codes[cidx].usedAt = new Date().toISOString(); localStorage.setItem('onetopup_redeem_codes', JSON.stringify(codes)); }
    }

    // Kirim notifikasi ke admin via Telegram
    const msg = buildRedeemMsg(code, redeemData);
    if (CFG.tgBotToken !== 'GANTI_TELEGRAM_BOT_TOKEN') {
      await fetch(`https://api.telegram.org/bot${CFG.tgBotToken}/sendMessage`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ chat_id: CFG.tgChatId, text: msg, parse_mode:'Markdown' })
      }).catch(()=>{});
    }

    hideLoading();
    stopPaymentPolling();
    hidePendingBar();
    closeRedeemModal();
    toast('✅ Diamond sedang diproses! Masuk dalam 1-5 menit.');

  } catch(err) {
    hideLoading();
    toast('⚠️ Terjadi kesalahan. Hubungi admin.', true);
    console.error(err);
  }
}

/**
 * Cek ulang pembayaran secara manual (tombol di modal)
 */
async function checkPendingAndProcess(code, orderId) {
  showLoading('🔍 Mengecek status pembayaran...');
  const paymentStatus = await checkPaymentStatus(orderId);
  hideLoading();

  if (paymentStatus.paid || paymentStatus.processed) {
    closeRedeemModal();
    const redeemData = await findRedeemCode(code);
    showRedeemModal(code, redeemData, paymentStatus);
  } else {
    toast('⏳ Pembayaran belum terkonfirmasi. Tunggu sebentar lagi.', false);
  }
}

/**
 * Cek pembayaran dari pending bar
 */
async function checkPendingPayment() {
  if (!pendingRedeemOrder) return;
  const { code, redeemData } = pendingRedeemOrder;
  const paymentStatus = await checkPaymentStatus(redeemData.orderId);
  if (paymentStatus.paid) {
    hidePendingBar();
    showRedeemModal(code, redeemData, paymentStatus);
  } else {
    toast('⏳ Pembayaran masih pending. Cek lagi nanti.', false);
  }
}

/**
 * Polling otomatis status pembayaran tiap 10 detik
 */
function startPaymentPolling(code, redeemData) {
  stopPaymentPolling();
  paymentCheckInterval = setInterval(async () => {
    const paymentStatus = await checkPaymentStatus(redeemData.orderId);
    if (paymentStatus.paid || paymentStatus.processed) {
      stopPaymentPolling();
      hidePendingBar();
      // Update modal jika masih terbuka
      const modal = document.getElementById('redeem-modal');
      if (modal.style.display !== 'none') {
        showRedeemModal(code, redeemData, paymentStatus);
      } else {
        toast('✅ Pembayaran terkonfirmasi! Diamond sedang diproses.', false);
      }
    }
  }, 10000); // cek tiap 10 detik
}

function stopPaymentPolling() {
  if (paymentCheckInterval) {
    clearInterval(paymentCheckInterval);
    paymentCheckInterval = null;
  }
}

/**
 * Tampilkan panduan pembayaran ulang
 */
function openPaymentGuide(orderId, payMethod) {
  closeRedeemModal();
  if (payMethod && CFG.rekening[payMethod]) {
    const r = CFG.rekening[payMethod];
    toast(`💳 Bayar ke ${r.label}: ${r.number} a.n. ${r.holder}`);
  } else {
    toast(`💬 Hubungi admin untuk panduan pembayaran.`);
  }
}

/**
 * Build pesan Telegram untuk notifikasi redeem
 */
function buildRedeemMsg(code, redeemData) {
  return [
    `🎟️ *REDEEM KODE — ONE TopUp*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Kode      : *${code}*`,
    `Order ID  : *${redeemData.orderId}*`,
    `Game      : ${redeemData.game}`,
    `Nominal   : *${fmtN(redeemData.amt)} ${redeemData.unit}* 💎`,
    `ID Game   : *${redeemData.idGame || '—'}*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Status Bayar : ✅ LUNAS`,
    `Action    : *Proses Diamond Sekarang!*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `_Pembayaran terverifikasi. Harap segera isi diamond._ 🚀`
  ].join('\n');
}

// ────────────────────────────────────────────────────────────
// UI HELPERS — REDEEM
// ────────────────────────────────────────────────────────────
function showRedeemStatus(type, html) {
  const el = document.getElementById('redeem-status');
  el.className = 'redeem-status ' + type;
  el.innerHTML = html;
  el.style.display = 'block';
}

function closeRedeemModal(event) {
  if (event && event.target !== document.getElementById('redeem-modal')) return;
  document.getElementById('redeem-modal').style.display = 'none';
}

function showPendingBar(code, redeemData) {
  const bar = document.getElementById('pending-bar');
  document.getElementById('pending-bar-text').textContent =
    `⏳ Kode ${code}: Menunggu konfirmasi pembayaran untuk ${fmtN(redeemData.amt)} ${redeemData.unit || 'Diamond'}...`;
  bar.style.display = 'block';
}

function hidePendingBar() {
  document.getElementById('pending-bar').style.display = 'none';
  pendingRedeemOrder = null;
}

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ────────────────────────────────────────────────────────────
// FUNGSI GAME & PAKET
// ────────────────────────────────────────────────────────────
function switchGame(g) {
  S = { game:g, pkg:null, step:1, pay:null };
  document.querySelectorAll('.game-card').forEach(c => c.classList.remove('active'));
  document.getElementById('gtab-'+g).classList.add('active');
  const gd = GAMES[g];
  document.getElementById('game-banner').className = 'game-banner ' + gd.bannerClass;
  document.getElementById('banner-deco').textContent  = gd.icon;
  document.getElementById('banner-title').textContent = gd.name;
  document.getElementById('banner-sub').textContent   = gd.sub;
  document.getElementById('banner-tag').textContent   = gd.icon + ' ' + gd.unit;
  document.getElementById('pkg-label').textContent    = 'Pilih Nominal ' + gd.unit;
  renderPkgs(); gotoStep(1);
}

function renderPkgs() {
  const gd = GAMES[S.game];
  document.getElementById('pkg-grid').innerHTML = gd.pkgs.map(p => `
    <div class="pkg-item${p.popular?' popular':''}${S.pkg&&S.pkg.id===p.id?' selected':''}"
         id="pi-${p.id}" onclick="pickPkg('${p.id}')">
      <div class="pkg-check">✓</div>
      <span class="pkg-icon">${gd.icon}</span>
      <div class="pkg-amt">${fmtN(p.amt)}</div>
      <div class="pkg-unit">${gd.unit}</div>
      <div class="pkg-price">
        ${p.discount ? `<div class="pkg-disc-wrap">
          <span class="pkg-orig">${fmt(Math.round(p.price/(1-p.discount/100)))}</span>
          <span class="pkg-disc-badge">-${p.discount}%</span>
        </div>` : ''}
        ${fmt(p.price)}
      </div>
      ${p.bonus ? `<div class="pkg-bonus">${p.bonus}</div>` : ''}
    </div>`).join('');
}

function pickPkg(id) {
  const gd = GAMES[S.game];
  S.pkg = gd.pkgs.find(p => p.id === id);
  document.querySelectorAll('.pkg-item').forEach(c => c.classList.remove('selected'));
  document.getElementById('pi-'+id).classList.add('selected');
  document.getElementById('btn1').disabled = false;
  document.getElementById('spd1').innerHTML = `
    <div class="spd-l"><div class="spd-ico">${gd.icon}</div>
      <div><div class="spd-lbl">${gd.name}</div><div class="spd-val">${fmtN(S.pkg.amt)} ${gd.unit}</div></div>
    </div><div class="spd-price">${fmt(S.pkg.price)}</div>`;
  if (window.innerWidth < 900)
    document.querySelector('.right-col').scrollIntoView({behavior:'smooth',block:'start'});
}

// ────────────────────────────────────────────────────────────
// STEP NAVIGATION
// ────────────────────────────────────────────────────────────
function gotoStep(n) {
  if (n===2 && !S.pkg) { toast('⚠️ Pilih nominal dulu!'); return; }
  if (n===3) {
    if (!document.getElementById('in-id').value.trim()) { toast('⚠️ ID Game wajib diisi!'); return; }
    if (!document.getElementById('in-wa').value.trim()) { toast('⚠️ Nomor WA wajib diisi!'); return; }
  }
  if (n===2||n===3) {
    const gd = GAMES[S.game];
    ['s'+n+'ico','s'+n+'lbl','s'+n+'val','s'+n+'price'].forEach((id,i)=>{
      document.getElementById(id).textContent = [gd.icon, gd.name+' • '+gd.unit, fmtN(S.pkg.amt)+' '+gd.unit, fmt(S.pkg.price)][i];
    });
  }
  if (n===2) {
    const hints = { ff:'ID FF: Buka game → klik avatar → salin Player ID', ml:'ID ML: Buka MLBB → klik profil → salin ID & Server' };
    document.getElementById('id-hint').textContent = hints[S.game];
  }
  if (n===3) renderPayList();
  S.step = n;
  for(let i=1;i<=4;i++){
    document.getElementById('fs'+i).style.display = i===n ? 'block' : 'none';
    const si = document.getElementById('si'+i);
    si.className = 'sbi' + (i<n?' done':i===n?' active':'');
    si.querySelector('.sbi-dot').textContent = i<n ? '✓' : i;
  }
}

// ────────────────────────────────────────────────────────────
// PEMBAYARAN
// ────────────────────────────────────────────────────────────
function renderPayList() {
  document.getElementById('pay-list').innerHTML = PAYS.map(p=>`
    <div class="pay-item${S.pay===p.id?' selected':''}" onclick="selectPay('${p.id}')">
      <div class="pay-radio"></div>
      <div class="pay-ico">${p.icon}</div>
      <div><div class="pay-name">${p.name}</div><div class="pay-desc">${p.desc}</div></div>
    </div>`).join('');
}

function selectPay(id) {
  S.pay = id; renderPayList();
  const r = CFG.rekening[id];
  const isQris = id === 'QRIS';
  document.getElementById('qris-view').style.display   = isQris ? 'block' : 'none';
  document.getElementById('normal-view').style.display  = isQris ? 'none'  : 'block';
  document.getElementById('rk-title').textContent       = isQris ? '📱 Bayar dengan QRIS' : '📲 Info Transfer';
  if (isQris) {
    document.getElementById('qris-img').src = CFG.qrisImage;
    document.getElementById('qris-total').textContent = fmt(S.pkg.price);
  } else {
    document.getElementById('rk-method').textContent = r.label;
    document.getElementById('rk-num').textContent    = r.number;
    document.getElementById('rk-holder').textContent = 'a.n. '+r.holder;
    document.getElementById('rk-total').textContent  = fmt(S.pkg.price);
    document.getElementById('rk-copy').onclick = () => copyText(r.number, r.label+' disalin!');
  }
  document.getElementById('rek-box').classList.add('show');
  document.getElementById('btn-confirm').disabled = false;
}

// ────────────────────────────────────────────────────────────
// SUBMIT ORDER
// ────────────────────────────────────────────────────────────
async function submitOrder() {
  if (!S.pay) { toast('⚠️ Pilih metode pembayaran!'); return; }
  const idGame = document.getElementById('in-id').value.trim();
  const wa     = document.getElementById('in-wa').value.trim();
  const nick   = document.getElementById('in-nick').value.trim();
  const gd     = GAMES[S.game];
  const orderId = 'OT' + Date.now().toString().slice(-8);

  showLoading('Mengirim order...');

  const orderData = {
    order_id:    orderId,
    game:        gd.name,
    unit:        gd.unit,
    amt:         S.pkg.amt,
    price:       S.pkg.price,
    pay_method:  S.pay,
    bonus:       S.pkg.bonus || null,
    id_game:     idGame,
    nickname:    nick || null,
    wa_customer: wa,
    status:      'Pending'
  };

  // Simpan ke Supabase / localStorage
  if (sb && CFG.supabaseUrl !== 'GANTI_SUPABASE_URL') {
    try { await sb.from('orders').insert([orderData]); } catch(e) { console.warn('Supabase:', e); }
  } else {
    const log = JSON.parse(localStorage.getItem('onetopup_log') || '[]');
    log.unshift({...orderData, created_at: new Date().toISOString()});
    localStorage.setItem('onetopup_log', JSON.stringify(log.slice(0,300)));
  }

  // Kirim notif Telegram dengan tombol inline keyboard
  let tgMsgId = null;
  if (CFG.tgBotToken && CFG.tgBotToken !== 'GANTI_TELEGRAM_BOT_TOKEN') {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${CFG.tgBotToken}/sendMessage`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          chat_id:      CFG.tgChatId,
          text:         buildMsg(orderId, gd, idGame, nick, wa),
          parse_mode:   'Markdown',
          reply_markup: buildInlineKeyboard(orderId)
        })
      });
      const tgData = await tgRes.json();
      if (tgData.ok) tgMsgId = tgData.result.message_id;
    } catch(e) { console.warn('TG notif gagal:', e); }
  }

  // Simpan tgMsgId ke order agar bisa diedit nanti saat konfirmasi
  if (tgMsgId && sb && CFG.supabaseUrl !== 'GANTI_SUPABASE_URL') {
    try { await sb.from('orders').update({ tg_msg_id: tgMsgId }).eq('order_id', orderId); } catch(e) {}
  }

  hideLoading();

  // Tampilkan step 4 — waiting screen
  const rows = [
    ['Order ID',  orderId],
    ['Game',      gd.name],
    [gd.unit,     fmtN(S.pkg.amt)+' '+gd.icon],
    ['Total',     fmt(S.pkg.price)],
    ['Bayar via', S.pay],
    ['ID Game',   idGame],
  ];
  if (S.pkg.bonus) rows.push(['Bonus', S.pkg.bonus]);

  document.getElementById('s-card').innerHTML = rows.map(([k,v]) =>
    `<div class="s-row"><span class="s-key">${k}</span><span class="s-val">${v}</span></div>`
  ).join('');

  renderWaitingStatus(orderId);
  gotoStep(4);

  // Mulai polling status order
  startOrderPolling(orderId);
}

// ────────────────────────────────────────────────────────────
// WAITING STATUS MONITOR — polling tiap 8 detik
// ────────────────────────────────────────────────────────────
let orderPollInterval = null;
let currentOrderId    = null;

function renderWaitingStatus(orderId) {
  currentOrderId = orderId;
  const sNote = document.querySelector('.s-note');
  if (!sNote) return;

  const existing = document.getElementById('order-status-monitor');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'order-status-monitor';
  div.innerHTML = `
    <div id="osm-box" style="margin-top:12px;border-radius:12px;padding:14px;background:rgba(59,130,246,0.08);border:1.5px solid rgba(59,130,246,0.25);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div id="osm-pulse" style="width:9px;height:9px;border-radius:50%;background:var(--primary);animation:pulse 1.4s infinite"></div>
        <div style="font-size:0.78rem;font-weight:700;color:var(--primary)" id="osm-title">⏳ Menunggu Konfirmasi Admin</div>
      </div>
      <div style="font-size:0.7rem;color:var(--text2);line-height:1.6" id="osm-desc">
        Notifikasi sudah dikirim ke admin. Setelah kamu transfer, admin akan konfirmasi dan diamond langsung diproses.<br>
        <strong style="color:var(--text)">Proses: 1–5 menit</strong> setelah admin konfirmasi.
      </div>
      <div style="margin-top:10px;display:flex;gap:7px">
        <a href="https://wa.me/${CFG.adminWA}?text=${encodeURIComponent('Halo admin, saya sudah transfer untuk Order ID: '+orderId)}" target="_blank"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:9px;border-radius:8px;background:rgba(37,211,102,0.12);border:1px solid rgba(37,211,102,0.3);color:#25D366;font-size:0.75rem;font-weight:700;text-decoration:none">
          💬 Konfirmasi via WA
        </a>
        <a href="https://t.me/${CFG.adminTG}" target="_blank"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:9px;border-radius:8px;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.25);color:var(--primary2);font-size:0.75rem;font-weight:700;text-decoration:none">
          ✈️ Chat Telegram
        </a>
      </div>
      <div style="margin-top:8px;font-size:0.63rem;color:var(--text3);text-align:center">
        Auto-cek status tiap 8 detik &nbsp;|&nbsp; Order ID: <strong>${orderId}</strong>
      </div>
    </div>`;
  sNote.insertAdjacentElement('beforebegin', div);
}

function updateWaitingStatus(status) {
  const box   = document.getElementById('osm-box');
  const title = document.getElementById('osm-title');
  const desc  = document.getElementById('osm-desc');
  const pulse = document.getElementById('osm-pulse');
  if (!box) return;

  if (status === 'Paid' || status === 'Processing') {
    box.style.background = 'rgba(16,185,129,0.08)';
    box.style.borderColor = 'rgba(16,185,129,0.3)';
    pulse.style.background = 'var(--green)';
    title.style.color = 'var(--green2)';
    title.textContent = '⚡ Pembayaran Dikonfirmasi!';
    desc.innerHTML = 'Admin sudah konfirmasi pembayaranmu. Diamond sedang diproses dan akan masuk dalam <strong style="color:var(--primary)">1–5 menit</strong>.';
  } else if (status === 'Completed') {
    box.style.background = 'rgba(16,185,129,0.12)';
    box.style.borderColor = 'rgba(16,185,129,0.4)';
    pulse.style.animation = 'none';
    pulse.style.background = 'var(--green)';
    title.style.color = 'var(--green2)';
    title.textContent = '✅ Diamond Sudah Masuk!';
    desc.innerHTML = '<strong style="color:var(--green2)">Selesai!</strong> Diamond sudah berhasil masuk ke akun game kamu. Terima kasih!';
    stopOrderPolling();
  } else if (status === 'Failed' || status === 'Cancelled') {
    box.style.background = 'rgba(239,68,68,0.08)';
    box.style.borderColor = 'rgba(239,68,68,0.2)';
    pulse.style.background = 'var(--red)';
    title.style.color = 'var(--red)';
    title.textContent = '❌ Order Dibatalkan';
    desc.innerHTML = 'Order ini dibatalkan oleh admin. Hubungi CS jika ada pertanyaan.';
    stopOrderPolling();
  }
}

function startOrderPolling(orderId) {
  stopOrderPolling();
  orderPollInterval = setInterval(async () => {
    try {
      let status = null;
      if (sb && CFG.supabaseUrl !== 'GANTI_SUPABASE_URL') {
        const { data, error } = await sb.from('orders').select('status').eq('order_id', orderId).single();
        if (!error && data) status = data.status;
      } else {
        const log = JSON.parse(localStorage.getItem('onetopup_log') || '[]');
        const o = log.find(x => x.order_id === orderId);
        if (o) status = o.status;
      }
      if (status && status !== 'Pending') {
        updateWaitingStatus(status);
        if (status === 'Completed' || status === 'Failed' || status === 'Cancelled') stopOrderPolling();
      }
    } catch(e) {}
  }, 8000);
}

function stopOrderPolling() {
  if (orderPollInterval) { clearInterval(orderPollInterval); orderPollInterval = null; }
}

// Proof upload dihapus — notifikasi sekarang otomatis via Telegram inline keyboard

// sendProof dihapus — sistem sekarang tanpa upload bukti

/**
 * Generate kode redeem unik dari order ID
 */
function generateRedeemCode(orderId) {
  const suffix = orderId.slice(-6).toUpperCase();
  const prefix = 'OT';
  const mid = Math.random().toString(36).slice(2,6).toUpperCase();
  return `${prefix}-${mid}-${suffix}`;
}

/**
 * Simpan kode redeem ke Supabase atau localStorage
 */
async function saveRedeemCode(code, orderData) {
  const codeData = {
    code,
    orderId:   orderData.order_id,
    game:      orderData.game,
    amt:       orderData.amt,
    unit:      orderData.unit,
    idGame:    orderData.id_game,
    used:      false,
    createdAt: new Date().toISOString()
  };

  if (sb && CFG.supabaseUrl !== 'GANTI_SUPABASE_URL') {
    try { await sb.from('redeem_codes').insert([codeData]); } catch(e) {}
  } else {
    const codes = JSON.parse(localStorage.getItem('onetopup_redeem_codes') || '[]');
    codes.unshift(codeData);
    localStorage.setItem('onetopup_redeem_codes', JSON.stringify(codes.slice(0,1000)));
  }
}

/**
 * Build pesan WhatsApp/Telegram untuk order baru
 */
function buildMsg(orderId, gd, idGame, nick, wa) {
  return [
    `🔔 *ORDER BARU — ONE TopUp*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Order ID  : *${orderId}*`,
    `Game      : ${gd.name}`,
    `Nominal   : *${fmtN(S.pkg.amt)} ${gd.unit}* ${gd.icon}`,
    S.pkg.bonus ? `Bonus     : ${S.pkg.bonus}` : null,
    `Harga     : *${fmt(S.pkg.price)}*`,
    `Bayar via : ${S.pay}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `ID Game   : *${idGame}*`,
    `Nickname  : ${nick||'-'}`,
    `No. WA    : ${wa}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `💡 Klik tombol di bawah untuk konfirmasi atau batalkan order ini.`
  ].filter(Boolean).join('\n');
}

// Inline keyboard untuk tombol Telegram
function buildInlineKeyboard(orderId) {
  return {
    inline_keyboard: [[
      { text: '✅ Konfirmasi Bayar', callback_data: 'confirm_' + orderId },
      { text: '❌ Batalkan Order',   callback_data: 'cancel_'  + orderId }
    ]]
  };
}

// ────────────────────────────────────────────────────────────
// RESET & UTILITY
// ────────────────────────────────────────────────────────────
function resetOrder() {
  S = { game:S.game, pkg:null, step:1, pay:null };
  ['in-id','in-wa','in-nick'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('rek-box').classList.remove('show');
  document.getElementById('btn1').disabled = true;
  document.getElementById('btn-confirm').disabled = true;
  document.getElementById('spd1').innerHTML = '<span class="spd-ph">← Pilih nominal di sebelah kiri</span>';
  renderPkgs(); gotoStep(1);
}

function switchTab(btn, id) {
  document.querySelectorAll('.itab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.icontent').forEach(t => t.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById(id).classList.add('on');
}

function copyText(t, m) {
  navigator.clipboard.writeText(t).then(() => toast('✓ '+m));
}

function toast(msg, err=false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' err' : '');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function showLoading(txt) {
  document.getElementById('loading-text').textContent = txt;
  document.getElementById('loading').classList.add('show');
}

function hideLoading() {
  document.getElementById('loading').classList.remove('show');
}

// ────────────────────────────────────────────────────────────
// PROMO SYSTEM
// ────────────────────────────────────────────────────────────
function renderPromos() {
  const promos = JSON.parse(localStorage.getItem('onetopup_promos') || '[]')
    .filter(p => p.active && (!p.expDate || new Date(p.expDate) >= new Date()));
  const section = document.getElementById('promo-section');
  const scroll  = document.getElementById('promo-scroll');
  if (!promos.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  const emoji = { flash:'⚡', disc:'🏷️', bonus:'🎁', info:'📢' };
  const label = { flash:'Flash Sale', disc:'Diskon', bonus:'Bonus', info:'Info' };
  scroll.innerHTML = promos.map(p => {
    const hasLink = p.linkGame && p.linkPkg;
    const onclick = hasLink ? `onclick="promoCheckout('${p.linkGame}','${p.linkPkg}')"` : '';
    return `<div class="promo-card type-${p.type}${hasLink?' clickable':''}" ${onclick}>
      <div class="promo-deco">${emoji[p.type]||'📢'}</div>
      <div class="promo-badge">${emoji[p.type]||'📢'} ${label[p.type]||'Promo'}</div>
      <div class="promo-title">${p.title}</div>
      <div class="promo-desc">${p.desc}</div>
      ${p.expDate ? `<div class="promo-exp">⏳ Berlaku s/d ${new Date(p.expDate).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>` : ''}
      ${hasLink ? `<div class="promo-cta">🛒 Checkout Sekarang →</div>` : ''}
    </div>`;
  }).join('');
}

function promoCheckout(game, pkgId) {
  switchGame(game);
  const gd = GAMES[game];
  const pkg = gd.pkgs.find(p => p.id === pkgId);
  if (!pkg) return;
  setTimeout(() => {
    pickPkg(pkgId);
    document.querySelector('.right-col').scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(() => gotoStep(2), 400);
  }, 100);
}

// ────────────────────────────────────────────────────────────
// KEYBOARD SHORTCUT: Enter di input redeem
// ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const redeemInput = document.getElementById('redeem-code-input');
  if (redeemInput) {
    redeemInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') processRedeemCode();
    });
  }
});

// ────────────────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────────────────
renderPkgs();
renderPromos();
