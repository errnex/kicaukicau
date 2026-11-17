# sky/prompts — Prompt Library

Web statis sederhana: kumpulan prompt agent milik sky. Orang lain cuma bisa
lihat dan salin. Sky mengelola semuanya lewat dashboard admin terpisah —
halaman depan bersih, tanpa tombol admin apa pun.

Gratis di Vercel, tanpa backend, tanpa database, tanpa build step.

## Isi project

| File | Fungsi |
| --- | --- |
| `index.html` | Halaman publik (lihat + salin prompt) |
| `admin.html` | Dashboard admin (PIN, daftar prompt, publish) |
| `styles.css` | Semua styling + animasi |
| `app.js` | Logika halaman publik |
| `admin.js` | Logika dashboard |
| `prompts.json` | **Sumber data prompt** — ini yang dibaca pengunjung |
| `config.js` | PIN admin + nama repo GitHub |
| `README.md` | File ini |

## Deploy ke Vercel (gratis)

### Cara 1 — lewat GitHub (disarankan, auto-redeploy)

1. Buat repo baru di GitHub, misal `kicaukicau` (public atau private, bebas).
2. Upload semua file project ini ke **root repo** (bukan di dalam folder).
3. Buka [vercel.com/new](https://vercel.com/new) → **Import** repo tersebut.
4. Framework Preset: pilih **Other** (ini situs statis, tidak ada build).
   Build Command dan Output Directory dikosongkan saja.
5. Klik **Deploy**. Selesai — setiap push ke repo akan redeploy otomatis.

Kalau file-file terlanjur ada di dalam folder (misal `prompt-library/`),
pilih salah satu: pindahkan file ke root repo, **atau** di Vercel
Settings → General → Root Directory isi nama foldernya, lalu redeploy.

### Cara 2 — drag & drop (tanpa GitHub)

1. Buka [vercel.com/new](https://vercel.com/new), pilih tab deploy manual.
2. Drag folder project ini ke sana. Selesai.
3. Catatan: cara ini tidak auto-redeploy. Setiap ada perubahan, upload ulang.

## Sebelum deploy — wajib diganti

Buka `config.js` dan ganti:

- `ADMIN_PIN` — default-nya `admin123`. Ganti ke PIN rahasia lo.
- `GITHUB_REPO` — samakan dengan nama repo yang lo buat.
- `GITHUB_OWNER` — username GitHub lo (`errnex`).
- `GITHUB_BRANCH` — `main` (atau `master`, sesuai repo lo).

## Dashboard admin

Buka `namadomainlo.vercel.app/admin.html`, masukkan PIN.

Di dashboard ada:

- **Statistik** — total prompt, jumlah kategori, status publish.
- **Daftar prompt** — tiap baris ada tombol Salin, Edit, Hapus.
  Tombol **+ Tambah prompt** untuk membuat prompt baru.
- **Publish** — kartu untuk menaikkan perubahan ke live:
  - **Publish ke GitHub** — butuh GitHub token (lihat bawah). Sekali klik,
    `prompts.json` di repo ter-update dan Vercel redeploy otomatis.
  - **Download JSON** — download `prompts.json` baru, lalu ganti file itu
    di repo (bisa lewat web GitHub: buka file → Edit → paste → Commit).
  - **Salin JSON** — sama seperti download, tapi copy-paste manual.
  - **Buang perubahan** — membatalkan semua draft dan kembali ke data live.

Semua perubahan pertama-tama tersimpan sebagai **draft lokal** di browser
lo saja. Pengunjung belum melihat perubahan itu sampai lo publish.

### GitHub token (untuk tombol Publish)

Token ini TIDAK disimpan di repo — cuma tersimpan di browser lo.

1. GitHub → Settings → Developer settings → **Personal access tokens →
   Fine-grained tokens** → Generate new token.
2. Repository access: **Only select repositories** → pilih repo ini.
3. Permissions → Repository permissions → **Contents: Read and write**.
4. Copy tokennya (cuma ditampilkan sekali), paste di kolom token pada
   kartu Publish di dashboard, klik Publish.
   Token tersimpan di browser lo untuk publish berikutnya.

Kalau tidak mau pakai token, abaikan saja dan pakai Download JSON.

## Nambah / edit prompt

- **Lewat dashboard:** buka `admin.html` → masukkan PIN → + Tambah prompt,
  isi judul, kategori, deskripsi, link GitHub (opsional — kalau kosong,
  tombol GitHub tidak muncul), dan isi prompt. Simpan → publish.
- **Lewat file:** edit `prompts.json` langsung. Satu prompt bentuknya:

```json
{
  "id": "slug-unik",
  "title": "Judul Prompt",
  "category": "Security",
  "description": "Satu kalimat: prompt ini buat apa.",
  "github": "https://github.com/errnex/prompt-library/blob/main/prompts/nama-file.md",
  "prompt": "Isi prompt lengkapnya…"
}
```

- `id` harus unik, huruf kecil, pakai strip (`-`) sebagai pemisah.
- Link GitHub per prompt bebas: bisa ke file `.md` di repo lain, ke repo
  lain, atau ke profil. Kosongkan (`""`) kalau tidak ada.
- Prompt contoh yang ikut dalam project ini cuma contoh — hapus dan ganti
  dengan prompt asli lo.

## Catatan

- Situs ini membaca `prompts.json` lewat `fetch`, jadi tidak bisa dibuka
  dengan double-click (`file://`). Test lewat server lokal
  (`python3 -m http.server` di folder ini, lalu buka `localhost:8000`)
  atau langsung deploy.
- PIN admin itu gerbang lunak di browser, bukan keamanan server. Siapa pun
  yang membaca source code bisa melihat PIN-nya. Untuk situs prompt publik
  ini sudah cukup — yang dijaga cuma tombol edit, bukan data rahasia.
  Kunci benerannya adalah GitHub token, bukan PIN.
  Jangan pernah menaruh token atau secret di file project ini.
- Repo boleh public atau private — web tetap jalan dan tombol publish
  tetap bisa nulis ke repo private. Yang berubah: kalau repo private,
  link GitHub yang mengarah ke repo itu akan 404 buat orang lain.
