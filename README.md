<p align="center">
  <img src="https://img.shields.io/github/stars/fjrmhri/Simple_Turnbase_Game?style=for-the-badge&logo=github&color=8b5cf6" alt="Stars"/>
  <img src="https://img.shields.io/badge/License-Belum_didefinisikan-lightgray?style=for-the-badge" alt="License"/>
  <img src="https://img.shields.io/badge/HTML-5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
  <img src="https://img.shields.io/badge/CSS-Vanilla-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS"/>
  <img src="https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
</p>

# Celestia Clash — Demo RPG Turn-Based

## Deskripsi Singkat
Celestia Clash adalah demo game RPG turn-based berbasis browser di mana satu tim berisi empat pahlawan (Soldier, Mage, Healer, dan Tank) menghadapi Obsidian Dragon. Proyek ini sepenuhnya menggunakan HTML, CSS, dan JavaScript tanpa backend; seluruh logika pertarungan, UI, serta penyimpanan rekaman kemenangan per tingkat kesulitan berjalan di sisi klien.

## Preview
<p align="center">
  <img src="gif/soldier.gif" alt="Soldier" />
  <img src="gif/mage.gif" alt="Mage" />
  <img src="gif/healer.gif" alt="Healer" />
  <img src="gif/tank.gif" alt="Tank" />
  <img src="gif/dragon.gif" alt="Dragon" />
</p>

## Fitur Utama
- Cerita pembuka singkat dengan percakapan karakter sebelum pertarungan dimulai, lengkap dengan opsi pause/skip.
- Pilihan tingkat kesulitan (Easy, Normal, Hard) yang menyesuaikan statistik bos/pahlawan dan mencatat hasil terbaik (jumlah turn) di `localStorage`.
- Empat pahlawan dengan peran dan skill unik, termasuk biaya MP, cooldown, buff/debuff, serta limit gauge untuk jurus pamungkas.
- Bos Obsidian Dragon dengan AI multi-fase, kemampuan enrage, AoE delay, serta interaksi efek silence/taunt.
- Sistem antrean giliran berbasis statistik kecepatan, log pertempuran, serta ringkasan akhir yang menampilkan turn, hit tertinggi, dan kontribusi tiap pahlawan.
- UI bergaya pixel art dengan font Monocraft, bar status, indikator efek, dan kontrol target yang responsif.

## Teknologi yang Digunakan
- **HTML5** untuk struktur halaman dan tampilan UI utama (`index.html`).
- **CSS vanilla** untuk layout, tema, animasi, dan tipografi kustom (`styles.css`, folder `fonts/`).
- **JavaScript murni (ES6)** untuk logika permainan, manajemen status, AI bos, dan pembaruan UI (`game.js`).
- **Aset statis** berupa GIF karakter/bos (`gif/`) dan file font Monocraft (`fonts/`).

## Cara Menjalankan Proyek Secara Lokal
1. Kloning repositori dan masuk ke direktori proyek:
   ```bash
   git clone https://github.com/fjrmhri/Simple_Turnbase_Game.git
   cd Simple_Turnbase_Game
   ```
2. Tidak ada dependensi npm; cukup jalankan server statis atau buka `index.html` langsung di browser. Contoh dengan server lokal:
   ```bash
   python3 -m http.server 3000
   # atau
   npx serve . -l 3000
   ```
3. Buka `http://localhost:3000` di browser untuk mulai bermain.

## Struktur Folder Singkat
- `index.html` — Halaman utama dengan layout layar awal, dialog cerita, area pertempuran, serta panel ringkasan.
- `game.js` — Definisi pahlawan/bos, skill, sistem giliran, efek status, AI, UI updater, dan penyimpanan hasil terbaik.
- `styles.css` — Gaya visual, tata letak responsif, warna/meteran HP-MP-limit, tombol, serta komponen overlay.
- `gif/` — GIF animasi untuk setiap pahlawan dan Obsidian Dragon yang ditampilkan di UI.
- `fonts/` — File font Monocraft yang digunakan untuk nuansa retro/pixel.

## Lisensi
Tidak ada berkas lisensi di repositori ini; tambahkan lisensi yang sesuai atau hubungi pemilik repositori bila ingin menggunakannya lebih lanjut.
