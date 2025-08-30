# Meeting Manager Backend

Backend API untuk aplikasi Meeting Manager menggunakan Express.js dan MySQL.

## Persyaratan Sistem

- Node.js >= 14.0.0
- MySQL >= 5.7
- XAMPP (untuk pengembangan lokal)

## Setup Proyek

1. Clone repositori
2. Install dependensi:
   ```bash
   npm install
   ```
3. Salin file konfigurasi:
   ```bash
   cp .env.example .env
   ```
4. Sesuaikan konfigurasi database di file `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=meeting_manager
   ```

## Setup Database

1. Pastikan MySQL server sudah berjalan (melalui XAMPP)

2. Inisialisasi database dan data awal:
   ```bash
   npm run db:init
   ```
   Atau jika ingin menggunakan migrasi:
   ```bash
   npm run migrate
   ```

3. Jika perlu rollback migrasi:
   ```bash
   npm run migrate:rollback
   ```

## Menjalankan Aplikasi

1. Mode development (dengan hot reload):
   ```bash
   npm run dev
   ```

2. Mode production:
   ```bash
   npm start
   ```

## Struktur Database

### Tabel `meetings`
- `id` - Primary key
- `title` - Judul rapat
- `date` - Tanggal rapat
- `start_time` - Waktu mulai
- `end_time` - Waktu selesai
- `location` - Lokasi rapat
- `description` - Deskripsi (opsional)
- `meeting_link` - Link meeting online (opsional)
- `attendance_link` - Link absensi (opsional)
- `dress_code` - Kode pakaian (opsional)
- `status` - Status rapat (scheduled/ongoing/completed/cancelled)

### Tabel `participants`
- `id` - Primary key
- `name` - Nama peserta
- `nip` - NIP (unique)
- `whatsapp_number` - Nomor WhatsApp
- `section` - Seksi/Bagian

### Tabel `meeting_participants`
- `id` - Primary key
- `meeting_id` - Foreign key ke meetings
- `participant_id` - Foreign key ke participants

- `arrival_time` - Waktu kedatangan
- `notes` - Catatan (opsional)

### Tabel `meeting_files`
- `id` - Primary key
- `meeting_id` - Foreign key ke meetings
- `filename` - Nama file di sistem
- `original_name` - Nama file asli
- `mime_type` - Tipe MIME
- `size` - Ukuran file
- `file_path` - Path file
- `description` - Deskripsi file (opsional)

### Tabel `settings`
- `id` - Primary key
- `group_notification_time` - Waktu notifikasi grup
- `group_notification_enabled` - Status notifikasi grup
- `individual_reminder_minutes` - Menit sebelum rapat untuk reminder
- `individual_reminder_enabled` - Status reminder individu
- `whatsapp_connected` - Status koneksi WhatsApp
- `whatsapp_group_id` - ID grup WhatsApp
- `notification_templates` - Template pesan notifikasi

### Tabel `notification_logs`
- `id` - Primary key
- `type` - Tipe notifikasi
- `recipient` - Penerima (nomor/grup WhatsApp)
- `message` - Isi pesan
- `status` - Status pengiriman
- `error` - Pesan error (jika ada)
- `sent_at` - Waktu pengiriman
- `meeting_id` - Foreign key ke meetings (opsional)
- `participant_id` - Foreign key ke participants (opsional)