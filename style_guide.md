# Kampar Clash - UI Style Guide

## Color Tokens

```css
:root {
  /* Backgrounds */
  --space: #050912;           /* Main dark background */
  --panel: rgba(18, 26, 48, 0.92);  /* Panel overlay */
  --card: rgba(23, 32, 60, 0.9);    /* Card backgrounds */
  
  /* Borders & Lines */
  --line: rgba(116, 240, 237, 0.3); /* Subtle borders */
  
  /* Primary Colors */
  --primary: #74f0ed;         /* Cyan - actions, highlights */
  --secondary: #ffc857;       /* Gold - names, important text */
  --accent: #ff6b6b;          /* Red - danger, damage */
  
  /* Text */
  --text: #e3ecff;           /* Primary text */
  --muted: #9eb0d3;          /* Secondary text */
  
  /* Meters */
  --hp: linear-gradient(90deg, #ff8f70, #ff3d3d);
  --mp: linear-gradient(90deg, #74b9ff, #0984e3);
}
```

## Typography

| Scale | Size | Usage |
|-------|------|-------|
| Title | 2.2rem | Main headers (game title) |
| Section | 1.25rem | Section headers (boss name) |
| Body | 1rem | Primary text, buttons |
| Caption | 0.85rem | Skill meta, status info |
| Small | 0.75rem | Status icons duration |

**Font:** Monocraft (retro pixel-style monospace)

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline gaps, icon spacing |
| sm | 8px | Small component gaps |
| md | 12px | Panel padding |
| lg | 16px | Section spacing |
| xl | 24px | Major section gaps |

## Component Patterns

### Buttons

| State | Style |
|-------|-------|
| Default | Gradient bg, 1px border |
| Hover | translateY(-2px), shadow |
| Disabled | opacity: 0.4 |
| Active | Primary border color |

### Status Icons

| Type | Color | Examples |
|------|-------|----------|
| Buff | Primary (cyan) | ⚔️ ATK↑, ✨ MAG↑, 💨 SPD↑, 🛡️ Guard |
| Debuff | Accent (red) | 🔇 Silenced, 🔥 Burning, 🐌 SPD↓ |
| Neutral | Secondary (gold) | 🎯 Marked, 😤 Provoked |

### Cards

- Border radius: 16px
- Border: 1px solid --line
- Shadow: 0 20px 45px rgba(5, 9, 18, 0.55)
- Active state: --primary border + glow

## Animation Guidelines

| Animation | Duration | Easing |
|-----------|----------|--------|
| Hover transitions | 0.2s | ease |
| Card active | 0.3s | ease |
| Floating text | 1.2s | ease-out |
| Intent pulse | 1.5s | ease-in-out (infinite) |
| Target pulse | 1.2s | ease-in-out (infinite) |

## Responsive Breakpoints

| Breakpoint | Font Size | Adjustments |
|------------|-----------|-------------|
| > 1200px | 15px | Full layout |
| 900-1200px | 14px | Slightly smaller cards |
| < 900px | 13px | Compact hero cards (180px) |
