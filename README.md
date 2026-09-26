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

1. Keep the monorepo organized by application and shared package.
2. Keep styling tokenized in `global.css` and use the centralized icon library.
3. Build pages from focused widgets and use `*View.tsx` files to orchestrate layouts.
