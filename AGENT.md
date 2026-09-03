# AGENT.md — Stocky Architecture & Developer Directives

Welcome to **Stocky**, an enterprise-grade stock management platform built as a multi-platform monorepo (Web first via Next.js, Mobile via Expo).

All AI agents and developers working on this codebase **MUST STRICTLY ADHERE** to the rules and conventions established in this document.

---

## 🚨 Non-Negotiable Critical Rules

### 1. Impeccable Organization
- Every file must have a single, well-defined responsibility and live in its designated directory.
- No loose scripts, temporary test files, or exploratory artifacts in the project root or source trees.

### 2. The `_technical_support` Mandate
- **ANY irrelevant, auxiliary, maintenance, migration, test harness, seed script, or temporary file MUST reside in `_technical_support/`.**
- Never place scrapers, data parsers, temporary JSON/CSV dumps, or one-off utility scripts in `apps/` or `packages/`.
- If you need to test an algorithm or process incoming assets (e.g. `data/fwdata.zip`), create a script in `_technical_support/scripts/`.

### 3. Centralized Tokenization & Centralized Icon Library
- **All styling aspects MUST BE TOKENIZED AND CENTRALIZED IN `global.css`.**
  - All styling values (colors, spacing, radiuses, gutters) are declared as CSS custom properties in `apps/web/src/app/global.css`.
  - Tailwind CSS configurations must map directly to these variables.
  - Hardcoded color hexes, raw pixel margins, or ad-hoc style values are strictly prohibited in application components.
- **Never import raw icons directly from third-party libraries (e.g., `lucide-react`) inside features or widgets.**
  - All icons must be imported through the centralized icon library (`@stocky/icons`).
  - This ensures uniform stroke widths, sizing tokens (`xs`, `sm`, `md`, `lg`, `xl`), and semantic consistency across Web and Mobile.

### 4. Never Develop a Monolith — Always Develop Widgets
- Pages and features must be decomposed into self-contained, modular **widgets**.
- A widget is an independent functional unit with its own UI, localized state, and data requirements.
- Example widgets:
  - `LandingHeroWidget`
  - `SidebarNavWidget`
  - `AuthUserWidget`
  - `StatsOverviewWidget`
- Widgets reside in `src/widgets/` and are composed using atomic UI components from `src/components/ui/`.

### 5. Mandatory PageView Pattern (`*View.tsx`)
- App Router route files (`page.tsx`) must be thin entry points that delegate rendering to a corresponding `*View.tsx` component (e.g., `LandingView.tsx`, `PlatformView.tsx`, `DashboardView.tsx`).
- The `*View.tsx` component controls:
  - Page layout hierarchy (sidebar, grid, responsive containers, headers).
  - Page-level orchestration.
  - Widget placement and layout slots.
- **Never write monolithic business logic or raw table implementations inside `page.tsx` or `*View.tsx` directly.** Always import the required widgets.

---

## 🎨 v0.1.0 Strict Design System Rules

All code and styling in Stocky v0.1.0 must strictly comply with the following 7 design specifications:

### 1. Typography Rules
- **Font Family**: `Geist` (`next/font/google`) with fallback to `Inter`.
- **STRICT: NO MONOSPACE / MONO FONTS**: Monospace fonts (`font-mono`, `monospace`) are **strictly prohibited** across the entire application. All numbers, currency balances, quantities, barcodes, SKU codes, tags, phone numbers, and data columns MUST use the standard primary font family (`Geist` / `Inter`). Never use `font-mono`.
- **System**: Always use the `rem` system (`1rem = 16px`).
- **Allowed Font Weights**: Only **`300` (Light), `400` (Regular), and `500` (Medium)**.
  - ⚠️ **NEVER use font weights larger than 500** (no semi-bold 600, bold 700, or heavy weights).
- **Maximum Font Size**: **`32px` (`2rem`)**. Never exceed this size anywhere in headings or hero titles.
- **Spacing**: Ensure clean line-height and letter-spacing for readability.

### 2. Color Palette
- **Main Text** (titles, headlines, primary copy): `#000000`
- **Sub-text** (descriptions, secondary labels, metadata): `#131313`
- **Global Website Background**: `#F9F9F9`
- **Widgets Background**: `#FFFFFF`
- **Buttons / Hyperlinks**: `#0057FF`
- **Accent Color**: `#4D92D1`

### 3. Surface & Border Rules
- **NO harsh borders**.
- **NO box-shadows** anywhere in the application.
- Apply a smooth, clean border effect (`#EBEBEB` or `rgba(0, 0, 0, 0.06)`) that gently blends with the `#F9F9F9` background while ensuring widgets are visually distinct.

### 4. Widget Roundness
- Exactly **`12px`** (`0.75rem`) for all cards, containers, inputs, and interactive widgets.

### 5. Layout, Gaps & Padding
- **Max Width**: Optimized for a **1920x1080 view** using a clean `max-w-[1600px]` container.
- **Gutter**: Use a column structure with a strict **`16px` (`1rem`) gutter**.
- **Alignment**: Ensure all widgets are pixel-perfect in the layout.

---

## 📁 Repository Structure

```
Stocky/
├── apps/
│   ├── web/                          # Next.js App Router Web Application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── global.css        # Centralized v0.1.0 Design Tokens
│   │   │   │   ├── layout.tsx        # App root layout with Geist font (300/400/500)
│   │   │   │   ├── page.tsx          # Landing Route -> LandingView
│   │   │   │   └── platform/
│   │   │   │       └── page.tsx      # Platform Route -> PlatformView
│   │   │   ├── views/                # PageView orchestrators (Rule 5)
│   │   │   │   ├── landing/LandingView.tsx
│   │   │   │   └── platform/PlatformView.tsx
│   │   │   ├── widgets/              # Modular widgets (Rule 4)
│   │   │   │   ├── LandingHeroWidget/
│   │   │   │   ├── SidebarNavWidget/
│   │   │   │   └── AuthUserWidget/
│   │   │   ├── components/           # UI primitives (Card, Button, Badge)
│   │   │   └── lib/                  # Supabase clients & DB
│   └── mobile/                       # Expo Mobile Application
├── packages/
│   ├── db/                           # Drizzle ORM package (@stocky/db)
│   ├── icons/                        # Centralized Icon Library (@stocky/icons)
│   ├── tokens/                       # Design Tokens (@stocky/tokens)
│   └── types/                        # Domain Models (@stocky/types)
├── _technical_support/               # Auxiliary scripts & tools (Rule 2)
├── run_stocky.bat                    # Server launcher & zombie killer
└── AGENT.md                          # This file
```
