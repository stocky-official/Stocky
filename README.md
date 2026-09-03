# Stocky - Enterprise Stock Management Platform

Stocky is a modern, modular stock and inventory management platform architected as a monorepo for Web (Next.js) and Mobile (Expo).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Development Server (Web)
```bash
pnpm --filter web dev
```
Or start via Turbo:
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏛 Monorepo Architecture

- **`apps/web`**: Next.js 15 (App Router, Tailwind CSS, Framer Motion, Supabase client).
- **`apps/mobile`**: Expo / React Native starter.
- **`packages/icons`**: Centralized Icon Library wrapping Lucide icons with uniform tokens.
- **`packages/tokens`**: Design tokens for colors, statuses, typography, and spacing.
- **`packages/types`**: Shared TypeScript domain models (StockItem, StockMovement, Warehouse, etc.).
- **`_technical_support/`**: Dedicated folder for maintenance scripts, data parsers, and developer tools.

---

## 📜 Development Directives & Rules

Please refer to [`AGENT.md`](./AGENT.md) for critical architectural rules:
1. Everything must remain organized.
2. Any auxiliary scripts or non-production tools must live in `_technical_support/`.
3. All styling aspects must be tokenized in `global.css`. All icons must use the centralized icon library.
4. Never develop a monolith — always develop widgets.
5. Always use `*View.tsx` (PageView) to orchestrate page layout and import widgets.
