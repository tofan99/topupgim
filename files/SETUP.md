# ONE TopUp — Panduan Setup Lengkap (v2 — Notif Otomatis)

## 📁 Struktur File
```
onetopup/
├── index.html                           ← Halaman toko (customer)
├── style.css                            ← CSS
├── app.js                               ← JS toko
├── admin.html                           ← Dashboard admin
├── promo.html                           ← Kelola banner promo
├── netlify/
│   └── functions/
│       ├── telegram-webhook.js          ← ⭐ Handler tombol Telegram (BARU)
│       └── set-webhook.js               ← Script daftarkan webhook ke Telegram
├── .env.example                         ← Contoh environment variables
└── SETUP.md                             ← Panduan ini
```

---

## ✅ Alur Kerja Baru (Otomatis)

```
Customer order di index.html
        ↓
Sistem simpan order → kirim notif Telegram ke admin
dengan 2 tombol inline:
  [✅ Konfirmasi Bayar]   [❌ Batalkan Order]
        ↓
Customer transfer sesuai nominal
        ↓
Admin terima transfer → klik [✅ Konfirmasi Bayar] di Telegram
        ↓
Sistem otomatis:
  • Update status order → Paid / Processing
  • Assign voucher dari stok (jika tersedia)
  • Edit pesan Telegram → tampilkan kode voucher + link Dunia Games
        ↓
Admin klik [🌐 Buka Dunia Games] → redeem voucher
        ↓
Admin klik [✅ Tandai Selesai] di Telegram
        ↓
Status order → Completed
Customer di halaman toko otomatis update (polling 8 detik)
```

---

## 1. Setup Supabase

### Buat Tabel SQL (jalankan di SQL Editor Supabase)

```sql
-- TABEL ORDERS (tambah kolom tg_msg_id)
create table orders (
  id              bigint generated always as identity primary key,
  order_id        text unique not null,
  game            text,
  unit            text default 'Diamond',
  amt             integer,
  price           integer,
  pay_method      text,
  bonus           text,
  id_game         text,
  nickname        text,
  wa_customer     text,
  status          text default 'Pending',
  voucher_code    text,
  dunia_games_url text,
  payment_proof   text,
  tg_msg_id       bigint,          -- ← BARU: ID pesan Telegram untuk edit
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- TABEL REDEEM CODES (voucher stok, dipisah per game)
create table redeem_codes (
  id         bigint generated always as identity primary key,
  code       text unique not null,
  "orderId"  text references orders(order_id),
  game       text,                  -- 'ff' atau 'ml'
  amt        integer,
  unit       text,
  "idGame"   text,
  used       boolean default false,
  "usedAt"   timestamptz,
  "createdAt" timestamptz default now()
);

-- AKTIFKAN REALTIME
alter publication supabase_realtime add table orders;

-- ROW LEVEL SECURITY
alter table orders enable row level security;
alter table redeem_codes enable row level security;

create policy "allow_all_orders" on orders for all using (true) with check (true);
create policy "allow_all_codes"  on redeem_codes for all using (true) with check (true);
```

> Jika tabel orders sudah ada, tambahkan kolom tg_msg_id saja:
> ```sql
> alter table orders add column if not exists tg_msg_id bigint;
> ```

---

## 2. Setup Telegram Bot

1. Chat **@BotFather** → `/newbot` → ikuti instruksi → salin **token**
2. Chat bot kamu sekali, lalu buka:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Salin **chat.id** dari response

---

## 3. Deploy ke Netlify + Pasang Environment Variables

### Deploy
1. Buka https://netlify.com → login
2. Drag & drop seluruh folder project (termasuk folder `netlify/`) ke dashboard
3. Netlify beri link gratis: `onetopup.netlify.app`

### Set Environment Variables
1. Netlify Dashboard → **Site Settings → Environment Variables**
2. Tambahkan semua variabel berikut:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://XXXXX.supabase.co` |
| `SUPABASE_KEY` | `eyJ...` (anon public key) |
| `TG_BOT_TOKEN` | `12345:ABCdef...` |
| `TG_CHAT_ID` | `1234567890` |

3. Klik **Save** → **Trigger Deploy** ulang

---

## 4. Daftarkan Webhook Telegram (WAJIB — sekali saja)

Setelah deploy, buka URL ini di browser:

```
https://[domain-netlify-kamu]/.netlify/functions/set-webhook
```

Contoh: `https://onetopup.netlify.app/.netlify/functions/set-webhook`

Jika berhasil, browser tampilkan:
```json
{ "message": "✅ Webhook berhasil dipasang!", "webhookUrl": "..." }
```

> Setelah ini, setiap tombol di notif Telegram akan berfungsi otomatis.

---

## 5. Isi Config di app.js

Ganti bagian `CFG` di `app.js`:

```javascript
const CFG = {
  supabaseUrl: 'https://XXXXX.supabase.co',
  supabaseKey: 'eyJ...',
  tgBotToken:  '12345:ABCdef...',
  tgChatId:    '1234567890',
  adminWA:     '6281234567890',
  adminTG:     'username_telegram',
  ...
```

---

## 6. Cara Tambah Stok Voucher (Admin Panel)

1. Buka `admin.html` → masukkan password
2. Panel kanan → **Stok Voucher Dunia Games**
3. Klik tab **🔥 Free Fire** atau **⚔️ Mobile Legends**
4. Paste kode voucher (1 per baris) → klik **+ Tambah Stok**

Voucher otomatis di-assign saat kamu klik **✅ Konfirmasi Bayar** di Telegram.

---

## 7. Fitur Lengkap

| Fitur | Keterangan |
|-------|-----------|
| 📲 Notif Otomatis | Order masuk langsung ke Telegram dengan tombol aksi |
| ✅ Konfirmasi 1-Klik | Klik tombol di Telegram = order langsung diproses |
| ⚡ Auto-Assign Voucher | Voucher otomatis di-assign sesuai game (FF/ML) |
| 🔄 Status Realtime | Halaman customer auto-update tiap 8 detik |
| 🎟️ Voucher Terpisah | Stok FF dan ML dipisah di admin panel |
| 🔐 Login 1 Jam | Admin panel pakai sesi 1 jam, tidak logout saat refresh |
| 📊 Revenue Chart | Grafik omzet 7 hari |
| ⬇️ Export CSV | Download semua data order |
| 🎯 Promo Manager | Kelola banner promo di halaman toko |

---

## 8. Troubleshooting

**Tombol Telegram tidak berfungsi?**
- Pastikan webhook sudah didaftarkan (langkah 4)
- Cek Environment Variables di Netlify sudah benar
- Lihat log di Netlify Dashboard → Functions → telegram-webhook

**Order tidak tersimpan di Supabase?**
- Cek `supabaseUrl` dan `supabaseKey` di `app.js`
- Pastikan RLS policy sudah diaktifkan

**Voucher tidak ter-assign otomatis?**
- Pastikan stok voucher FF/ML sudah diisi di admin panel
- Kolom `game` di tabel `redeem_codes` harus `'ff'` atau `'ml'`

---

## 9. Kontak & Support

- **WhatsApp**: 081938282686
- **Telegram**: @onetopup02
