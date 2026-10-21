# design_philosophy.md

# Forum Aeterna — Visual Identity & Design Philosophy

> This document establishes the visual identity, colour palette, typographic guidelines, and stylistic standards for Forum Aeterna (The BP Debate Tabulation System). It is designed to inspire a prestigious, classical Renaissance-like aesthetic that celebrates the historical legacy of debate while maintaining clean digital readability.

---

## The Emotional North Star

Forum Aeterna celebrates debate as a timeless classical art form. Rather than feeling like a sterile SaaS utility, the platform should evoke the **grandeur, tradition, and intellectual prestige** of a Renaissance academy or historical assembly (inspired by image_0.png, image_1.png, and image_2.png). 

Every visual element must look **graceful, artistic, and structured**, like parchment manuscript, weathered gold, and marble architecture, without sacrificing modern readability.

---

## 1. Classical Colour Palette

The palette combines sky blues, old-world parchment, and metallic gold with rich sepia-indigo tones. 

### Sky & Canvas Foundation

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--color-canvas-marble` | `#F8FAFC` | Primary page background—soft, natural marble-white |
| `--color-canvas-parchment`| `#FDFBF7` | Card surfaces, modals, and list backdrops—warm antique paper |
| `--color-sky-light` | `#E1EDF6` | Banner backdrops, status highlights, hover states |
| `--color-sky-blue` | `#BDD5E7` | Border accents, sky illustration tints, navbar lines |

### Renaissance Metallic & Accent

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--color-gold-deep` | `#B59A57` | Fine border rules, active link underlining, Roman numerals |
| `--color-gold-light` | `#D9C383` | Muted accent lines, sub-tab highlights, active UI rings |

### High-Contrast Ink Neutrals

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--color-ink-900` | `#1A242F` | Headings, room titles, core navigation—deep midnight blue |
| `--color-ink-800` | `#2D3945` | Secondary content, primary body text |
| `--color-ink-600` | `#5A6874` | Descriptions, metadata, empty state announcements |
| `--color-ink-400` | `#93A2B0` | Borders, inactive buttons, divider ornaments |

### Custom BP Bench Scrolls (Crest Color mapping)

| Bench | Colour Family | Hex (Primary & Light Back) | Role / Style |
| :--- | :--- | :--- | :--- |
| **OG** (Opening Govt) | Lapis Blue | `#3A7CA5` (Back: `#E9F2F7`) | Custom Gov Scroll Crest |
| **OO** (Opening Opp) | Rust Crimson | `#9C3A3A` (Back: `#F7EAEB`) | Custom Opp Scroll Crest |
| **CG** (Closing Govt) | Indigo Navy | `#2A3A5C` (Back: `#EBEFF5`) | Custom Gov Scroll Crest |
| **CO** (Closing Opp) | Earthy Sienna| `#8E522C` (Back: `#F5ECE8`) | Custom Opp Scroll Crest |

---

## 2. Antique Typography System

Typography must pair historical elegance with tabular technical precision. 

| Role | Font Family | Example Source / Fallbacks | Vibe & Rationale |
| :--- | :--- | :--- | :--- |
| **Headers & Nav** | `Cormorant Garamond` (`serif`) | [Google Fonts](https://fonts.google.com/specimen/Cormorant+Garamond) | Refined, literary, and expressive. Delicate serifs and elegant italics for titles (`FORUM AETERNA`). |
| **Body & Labels** | `Cinzel` or `EB Garamond` (`serif`) | [Google Fonts](https://fonts.google.com/specimen/Cinzel) | Prestigious classical Roman capitals and text used for Roman numeral markers (`ROUND II`) and status banners. |
| **Dynamic UI / Data**| `Plus Jakarta Sans` or `Alegreya Sans` | System UI / Universal Sans | Clean, high-legibility geometric sans for small table cells, user forms, and numbers. |

```css
@theme {
  --font-serif: "Cormorant Garamond", "Playfair Display", Georgia, serif;
  --font-roman: "Cinzel", "Times New Roman", serif;
  --font-sans: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
}