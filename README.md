<p align="center">
  <img src="https://img.shields.io/badge/Repository-Local%20copy-blue?style=for-the-badge&logo=github" alt="Status" />
  <img src="https://img.shields.io/badge/Lisensi-Tidak%20didefinisikan-lightgrey?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/HTML-5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS-3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
</p>

# Celestia Clash: Turn-Based Dragon Fight

## Deskripsi Singkat
Celestia Clash adalah demo RPG turn-based satu pertempuran yang sepenuhnya berjalan di browser. Pemain memimpin satu skuad berisi empat pahlawan untuk menaklukkan seekor naga Obsidian, mengatur giliran, memilih skill, dan memanfaatkan buff/debuff demi bertahan hidup. Semua logika game ditulis dengan JavaScript vanila dan dijalankan dari berkas statis tanpa backend.

## Preview
<p align="center">
  <img src="gif/soldier.gif" alt="Soldier" />
  <img src="gif/mage.gif" alt="Mage" />
  <img src="gif/healer.gif" alt="Healer" />
  <img src="gif/tank.gif" alt="Tank" />
  <img src="gif/dragon.gif" alt="Dragon" />
</p>

## Fitur Utama
- Layar pembuka dengan pengaturan tingkat kesulitan (Easy, Normal, Hard) serta penyimpanan hasil run terbaik per tingkat via `localStorage`.
- Urutan cerita singkat menggunakan potret karakter sebelum pertarungan dimulai yang bisa dijeda atau dilewati.
- Empat hero yang dapat dimainkan (Soldier, Mage, Healer, Tank) dengan peran, skill, biaya MP, cooldown, buff/debuff, dan skill limit berbeda.
- Bos Obsidian Dragon dengan AI bertahap, perilaku enrage di 50% HP, interaksi silence/taunt, dan serangan AoE setelah charge.
- Sistem giliran dinamis berbasis kecepatan yang divisualisasikan lewat tracker serta kontrol targeting untuk memilih musuh atau sekutu.
- Status efek yang kaya (buff, debuff, damage-over-time, guard, limit gain) serta log pertempuran dan ringkasan hasil setelah game berakhir.

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
- `game.js` — Definisi karakter, skill, AI bos, sistem status, tracker giliran, log pertempuran, dan penyimpanan hasil.
- `gif/` — GIF animasi untuk tiap hero dan naga yang ditampilkan di UI.
- `fonts/` — Berkas font Monocraft yang digunakan untuk nuansa retro.

## Lisensi
Repositori ini belum menyertakan berkas lisensi. Tambahkan lisensi yang sesuai sebelum didistribusikan atau digunakan secara luas.
