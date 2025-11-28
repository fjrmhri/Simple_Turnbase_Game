<p align="center">
  <img src="https://img.shields.io/github/stars/fjrmhri/Pomo-Pixel?style=for-the-badge&logo=github&color=8b5cf6" alt="Stars"/>
  <img src="https://img.shields.io/github/license/fjrmhri/Pomo-Pixel?style=for-the-badge&color=10b981" alt="License"/>
  <img src="https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/Firebase-11.9.1-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.1-38bdf8?style=for-the-badge&logo=tailwind-css" alt="TailwindCSS"/>
</p>

# Celestia Clash: Turn-Based Dragon Fight

## Project Overview
Celestia Clash is a browser-based, single-battle turn-based RPG demo built with vanilla HTML, CSS, and JavaScript. Players control a four-person squad facing an Obsidian Dragon, managing skills, turn order, and status effects to achieve victory. The project is self-contained and runs entirely on the client side with no backend.

## Features
- **Story intro** with portrait-driven dialogue that can be paused or skipped before combat begins.
- **Difficulty selection** (Easy, Normal, Hard) that scales hero and boss stats and tracks best turn counts per difficulty via `localStorage`.
- **Four playable heroes** (Soldier, Mage, Healer, Tank) each with role-specific skills, cooldowns, MP costs, buffs/debuffs, and limit-break actions.
- **Obsidian Dragon boss** with multi-phase AI, enrage behavior at 50% HP, silence and taunt interactions, and wind-up AoE attacks when enraged.
- **Dynamic turn order** based on speed stats, shown via a visual tracker with character portraits.
- **Targeting controls** for selecting allies or enemies, plus contextual skill tooltips and availability checks (MP, silence, cooldown, limit gauge).
- **Status handling** including buffs, debuffs, damage-over-time, guard effects, and limit gain from damage dealt/taken.
- **Battle log and summary** showing recent events, run statistics (turns, highest hit, per-hero damage/healing), and persistent best-run display.
- **Responsive UI styling** with custom pixel font, animated backgrounds, and character/boss GIF portraits.

## Tech Stack
- **HTML5** for layout and UI structure (`index.html`).
- **Vanilla JavaScript** for game logic, state management, AI, and UI updates (`game.js`).
- **CSS** for styling, layout, and animations (`styles.css`), including embedded custom Monocraft font files.
- **Static assets**: character and boss GIFs (`gif/`), and bundled font files (`fonts/`).

## Project Structure
- `index.html` – Main page and UI layout for start screen, story sequence, battle field, targeting overlay, and game-over dialog.
- `game.js` – Core gameplay logic: hero/boss definitions, skill resolution, turn management, AI, status effects, UI rendering, and localStorage best-run handling.
- `styles.css` – Visual styling for all screens, typography, meters, buttons, overlays, and responsive layouts.
- `gif/` – Character and boss animations displayed in the UI.
- `fonts/` – Monocraft font files used for the retro-styled interface.

## Setup & Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/fjrmhri/Simple_Turnbase_Game.git
   cd Simple_Turnbase_Game
   ```
2. No package installation is required; the project runs from static files.

## Configuration
- The game does not require environment variables or external configuration.
- Browser `localStorage` is used to remember the best turn count per difficulty; clearing site data resets these records.

## Running the Project Locally
Start any static file server from the project root and open the site in your browser:
```bash
npx serve . -l 3000
# or
python3 -m http.server 3000
```
Then navigate to `http://localhost:3000`.

## Build & Deployment
The project is a static site. A production build step is not required; deploy the existing files to any static host (e.g., GitHub Pages, Netlify, Vercel static export, S3) using the contents of this repository.

## Usage
1. Open the site and choose a **difficulty** on the start screen; best-run stats appear if you have previous victories on that difficulty.
2. Click **Start** to play through the dialogue sequence; use **Pause** or **Skip** to control the story flow.
3. During battle:
   - Follow the **turn tracker** to see the acting unit.
   - Select a hero skill to view its tooltip; choose a target when prompted or auto-targeted for enemies/AoE.
   - Manage **MP, cooldowns, silence, and limit** requirements; limit skills become available at 100% limit.
   - Watch the **battle log** for results and status changes.
4. When the fight ends, the **summary panel** shows turns, highest hit, and per-hero damage/healing; victories update the best-run display for the chosen difficulty.

## Preview
- ![Soldier](gif/soldier.gif)
- ![Mage](gif/mage.gif)
- ![Healer](gif/healer.gif)
- ![Tank](gif/tank.gif)
- ![Dragon](gif/dragon.gif)

## Contributing
Contributions are welcome via issues or pull requests. Please keep changes aligned with the existing vanilla HTML/CSS/JS approach.

## License
No license file is included in this repository. If you plan to use or distribute this project, please add an appropriate license or contact the repository owner.
