<p align="center">
  <img src="https://img.shields.io/badge/Repository-Local%20copy-blue?style=for-the-badge&logo=github" alt="Status" />
  <img src="https://img.shields.io/badge/Lisensi-MIT-green?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/HTML-5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS-3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
</p>

# Simple Turnbase Game: Kampar Clash

## Deskripsi Singkat

Simple Turnbase Game: Kampar Clash adalah demo RPG turn-based satu pertempuran yang sepenuhnya berjalan di browser. Pemain memimpin satu skuad berisi empat pahlawan untuk menaklukkan seekor Naga Kampar, mengatur giliran, memilih skill, dan memanfaatkan buff/debuff demi bertahan hidup. Semua logika game ditulis dengan JavaScript vanila dan dijalankan dari berkas statis tanpa backend.

## Preview

<p align="center">
  <img src="gif/soldier.gif" alt="Soldier" />
  <img src="gif/mage.gif" alt="Mage" />
  <img src="gif/healer.gif" alt="Healer" />
  <img src="gif/tank.gif" alt="Tank" />
  <img src="gif/dragon.gif" alt="Dragon" />
</p>

## Fitur Utama

### Core Gameplay
- **Layar Pembuka** - Pengaturan tingkat kesulitan (Easy, Normal, Hard) dengan penyimpanan hasil run terbaik per tingkat via `localStorage`.
- **Urutan Cerita** - Cutscene singkat menggunakan potret karakter sebelum pertarungan, bisa dijeda atau dilewati.
- **Empat Hero** - Soldier (DPS), Mage (Magic DPS), Healer (Support), Tank (Defender) dengan peran, skill, biaya MP, cooldown, buff/debuff, dan limit breaks berbeda.
- **Boss Naga Kampar** - AI bertahap (3 fase), enrage di 50% HP, interaksi silence/taunt, dan serangan AoE setelah charge.
- **Sistem Giliran** - Turn order dinamis berbasis kecepatan (SPD) yang divisualisasikan lewat timeline tracker.
- **Status Effects** - Buff, debuff, damage-over-time, guard, silence, mark, dan limit gain dengan visual icon indicators.

### Strategic Enhancements (Version 2.0)
- **🎯 Enemy Telegraph** - Boss menampilkan intent attack berikutnya untuk perencanaan strategi.
- **💥 Synergy System** - Combo bonuses:
  - Physical + DEF Down: +15% damage
  - Fire + Mark: +20% damage  
  - Tank + Burning Boss: +10% damage
- **🎨 Enhanced UI** - Status icons dengan emoji, floating damage/heal numbers, categorized battle log.
- **📊 Target Info** - Target selection menampilkan HP%, status effects, dan synergy previews.

## Teknologi yang Digunakan

- **HTML5**: Struktur halaman, layar pembuka, cerita, arena, dan elemen UI utama (`index.html`).
- **CSS3**: Gaya visual, animasi latar, tata letak responsif, dan pemakaian font khusus Monocraft (`styles.css`, folder `fonts/`).
- **JavaScript (ES6+)**: Seluruh logika gameplay, AI naga, manajemen status, rendering UI dinamis, serta penyimpanan skor terbaik (`game.js`).
- **Aset statis**: GIF karakter/bos di folder `gif/` dan berkas font di `fonts/`.

## Cara Menjalankan Proyek Secara Lokal

1. Clone atau unduh repositori ini lalu masuk ke folder proyek:
   ```bash
   git clone <url-repo>
   cd Simple_Turnbase_Game
   ```
2. Tidak ada dependency yang perlu diinstal; proyek berjalan dari berkas statis.
3. Jalankan server statis pilihan Anda (contoh):
   ```bash
   python3 -m http.server 3000
   # atau
   npx serve . -l 3000
   ```
4. Buka `http://localhost:3000` di browser untuk memainkan game.

## Struktur Folder Singkat

- `index.html` — Halaman utama yang memuat struktur UI, layar start, cerita, arena, dan dialog game over.
- `styles.css` — Aturan gaya, layout, animasi, serta referensi font kustom.
- `game.js` — Logika gameplay, AI, sistem status, tracker giliran, log pertempuran, dengan error handling.
- `game_config.js` — Konfigurasi data game (karakter, boss, skill, pesan, constants).
- `style_guide.md` — ⭐ **NEW** - Dokumentasi UI design tokens, color palette, typography, dan component patterns.
- `gif/` — GIF animasi untuk tiap hero dan naga yang ditampilkan di UI.
- `fonts/` — Berkas font Monocraft yang digunakan untuk nuansa retro.

## What's New in Version 2.0

✨ **6 Major Enhancements:**
1. Enemy Telegraph System - Boss intent display
2. Floating Combat Text - Animated damage/heal numbers  
3. Enhanced Status Icons - Emoji-based visual indicators
4. Battle Log Categorization - Color-coded message types
5. Synergy System Feedback - Visual combo notifications
6. Target Highlights - HP% and synergy previews

📝 See [CHANGELOG.md](CHANGELOG.md) for detailed changes.

## Dokumentasi Lengkap

Untuk dokumentasi lengkap tentang mekanik game, struktur kode, sistem combat, AI boss, dan panduan pengembangan, silakan lihat **[DOCUMENTATION.md](DOCUMENTATION.md)**.

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

```
MIT License

Copyright (c) 2024 Simple Turnbase Game

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
