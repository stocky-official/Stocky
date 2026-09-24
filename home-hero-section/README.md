# Home Page Hero Section (Wavy Background & Components)

This folder contains the complete set of components, page layouts, stylesheets, and SVG assets that define the **Home Page Hero Section** with the signature organic wavy bottom edge transition.

---

## 📁 File Manifest

| File | Type | Description |
| :--- | :--- | :--- |
| [`HomeHeroWidget.tsx`](./HomeHeroWidget.tsx) | React Component | **The Core Hero Section**: Solid luxury forest (`#14261C`) background, greeting typography, circular company logo badge, branch switcher dropdown, frosted search bar with embedded barcode scanner button, notification bell, and the organic SVG wavy bottom edge. |
| [`HomePlatformView.tsx`](./HomePlatformView.tsx) | PageView Orchestrator | **The Home Page Orchestrator**: Coordinates user profile, location scoping, metrics computation, and integrates Section 1 (Hero), Section 2 (Quick Nav), Section 3 (Highlights), and Section 4 (Operational Health). |
| [`HomeQuickActionsWidget.tsx`](./HomeQuickActionsWidget.tsx) | React Component | Quick navigation buttons directly beneath the hero (Settings, Team, Locations, Audit Logs). |
| [`HomeHighlightsWidget.tsx`](./HomeHighlightsWidget.tsx) | React Component | 2x2 operational metric callout cards (Expiring SKUs, Pending Supplier Requests, Assigned Tasks, Staff on Duty). |
| [`HomeAssetCardsWidget.tsx`](./HomeAssetCardsWidget.tsx) | React Component | High-density asset & location breakdown cards. |
| [`wavy-bottom-edge.svg`](./wavy-bottom-edge.svg) | SVG Asset | Standalone vector graphic of the smooth organic wave transition curve. |
| [`hero-wavy-styles.css`](./hero-wavy-styles.css) | Stylesheet | Extracted CSS rules for `.stocky-home-hero`, glassmorphic `.stocky-home-hero__stat-pill`, and `.stocky-platform-content--home`. |

---

## 🌊 The Wavy Background Implementation

The hero section uses a full-bleed luxury forest green background (`#14261C`) and transitions smoothly into the page canvas (`#FAFAFA`) using an absolute-positioned SVG path anchored to the bottom:

```tsx
{/* Smooth Wavy Bottom Edge (Talabat-style organic wave transition) */}
<div className="absolute -bottom-px left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-20">
  <svg
    viewBox="0 0 1440 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
    className="w-full h-6 sm:h-9 block"
    style={{ color: 'var(--stocky-bg-global, #FAFAFA)' }}
  >
    <path
      d="M0,18 C220,38 460,38 720,22 C980,6 1220,20 1440,24 L1440,64 L0,64 Z"
      fill="currentColor"
    />
  </svg>
</div>
```

### Key Design Attributes:
1. **Fluid Aspect Ratio**: `preserveAspectRatio="none"` allows the wave curve to scale horizontally across any viewport (mobile phones to ultra-wide displays) without distortion or clipping.
2. **Dynamic Theming**: `fill="currentColor"` with `color: var(--stocky-bg-global, #FAFAFA)` ensures the wave matches the downstream page background seamlessly.
3. **Subpixel Bleed Protection**: The `-bottom-px` positioning eliminates 1px subpixel gaps between the hero container and the page canvas.
4. **Non-blocking Interaction**: `pointer-events-none` guarantees clicks pass through to interactive elements underneath if any overlap occurs.
