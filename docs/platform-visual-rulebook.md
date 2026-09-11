# Stocky platform visual rulebook

Version 1.0 · 11 September 2026  
Source of truth: `apps/web/src/app/global.css`

This is the visual contract for Stocky’s authenticated platform. Every new page, drawer, table, form, and interaction should feel like the same calm operating tool: warm paper, clear ink, restrained green signals, and one confident lime action.

## 1. Product character

Stocky should feel:

- Calm under pressure.
- Compact enough for data-heavy work.
- Clear before it is decorative.
- Friendly through spacing and language, not oversized UI.
- Consistent between desktop and phone.

Avoid introducing a new color system, radius language, shadow treatment, font scale, or animation curve for an individual page.

## 2. Design foundations

### 2.1 Color palette

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Global background | `--stocky-bg-global` | `#F8F8F4` | Page canvas, quiet empty space |
| Widget surface | `--stocky-bg-widget` | `#FFFFFF` | Cards, tables, drawers, menus |
| Main ink | `--stocky-text-main` | `#11120F` | Titles, primary values, important labels |
| Secondary ink | `--stocky-text-sub` | `#6D7069` | Supporting copy, metadata, inactive controls |
| Primary green | `--stocky-primary` | `#0E8755` | Active states, links, focus, positive actions |
| Primary green hover | `--stocky-primary-hover` | `#0A6D43` | Hover and pressed green actions |
| Lime action | `--stocky-accent` | `#D8FF00` | Main CTA, Add stock, high-confidence action |
| Lime action hover | — | `#E3FF47` | Hover state for lime actions |
| Hover background | `--stocky-bg-hover` | `#F0F2EB` | Row, menu, nav-item hover |
| Placeholder | `--stocky-text-placeholder` | `#939A90` | Placeholder and disabled-adjacent copy |

### 2.2 Status colors

Status colors are semantic and should not be used as general decoration.

| Status | Background | Text | Border | Use |
| --- | --- | --- | --- | --- |
| Success | `#ECFDF5` | `#047857` | `#A7F3D0` | Healthy, completed, available |
| Warning | `#FFFBEB` | `#B45309` | `#FDE68A` | Expiring, needs review, attention |
| Critical | `#FEF2F2` | `#B91C1C` | `#FECACA` | Error, expired, destructive risk |
| Info | `#EEF7F0` | `#0E8755` | `#C8E4CF` | Selected, informational, assigned |
| Muted | `#F3F4EF` | `#6D7069` | `#DDE0D8` | Not audited, inactive, neutral |
| Hold | `#F4F0F7` | `#73547F` | `#DED1E3` | Waiting, paused, pending approval |

Rules:

- Lime is reserved for the primary action, not for status badges.
- Green means active/healthy/available; it does not mean “primary button” by itself.
- Red and amber always communicate a decision or risk.
- Do not pair colored text with a similarly saturated background unless the contrast is verified.
- Never introduce page-specific hex values when an existing token applies.

## 3. Typography

### 3.1 Font family

Current platform stack:

```css
font-family: var(--stocky-font-stack);
/* Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
   "Segoe UI", sans-serif */
```

Switzer is not currently installed in the repository. If licensed Switzer files are added, replace the first family in `--stocky-font-stack`; do not change the sizing or weight rules below.

### 3.2 Allowed weights

Use only `300`, `400`, and `500`.

| Weight | Meaning | Typical use |
| --- | --- | --- |
| 300 | Light | Large editorial headings, quiet supporting emphasis |
| 400 | Regular | Body copy, values, labels, navigation |
| 500 | Medium | Buttons, active states, table headers, key labels |

Do not use `600`, `700`, `800`, or `900`. Create emphasis with color, position, size, or a status treatment instead.

### 3.3 Type scale

| Token | Size | Line height | Use |
| --- | ---: | ---: | --- |
| `--stocky-font-max` | 32px | 1.25 | Rare page-level display title |
| `--stocky-font-xl` | 24px | 1.25 | Workspace/page title |
| `--stocky-font-lg` | 20px | 1.2–1.35 | Section title, modal title |
| `--stocky-font-md` | 18px | 1.3 | Secondary heading |
| `--stocky-font-base` | 16px | 1.5 | Comfortable body copy |
| `--stocky-font-sm` | 14px | 1.45 | Supporting copy, dense page description |
| `--stocky-font-xs` | 12px | 1.35 | Buttons, nav items, compact body copy |
| `--stocky-font-2xs` | 11px | 1.3 | Dense labels, row values, metadata |
| `--stocky-font-table-header` | 10px | 1.2 | Table headers, overlines, micro labels |

Data-heavy rules:

- Table body text is normally `11px`.
- Table headers are `10px`, uppercase, medium weight, with modest tracking.
- Row metadata is `10–11px`, secondary ink.
- Do not enlarge tables to make them look like marketing cards.
- Do not use all caps for normal sentences.
- Keep line length short in drawers and cards; use truncation in rows when needed.

### 3.4 Hierarchy

```text
Page title          24px / 400 / main ink
Section title       20px / 400–500 / main ink
Body                14px / 400 / secondary ink
Controls            12px / 500
Table values        11px / 400–500
Table headers       10px / 500 / uppercase / tracked
Metadata            10px / 400 / secondary ink
```

## 4. Layout and spacing

### 4.1 Canvas

- Global background: `#F8F8F4`.
- Content max width: `1600px`.
- Base gutter: `16px`.
- Desktop page content usually uses `24px` horizontal breathing room.
- Mobile page content uses `12px` gutters unless a full-bleed surface is intentional.
- Keep the page background visible around white surfaces; do not stack white cards edge-to-edge without a reason.

### 4.2 Spacing scale

Use a 4px base rhythm:

| Size | Value | Use |
| --- | ---: | --- |
| 1 | 4px | Icon-to-label, micro gaps |
| 2 | 8px | Compact control gap, menu item padding |
| 3 | 12px | Row padding, small card gap |
| 4 | 16px | Base gutter, standard card padding |
| 5 | 20px | Section gap, drawer content gap |
| 6 | 24px | Page/card padding, major control group |
| 8 | 32px | Section separation, drawer header padding |
| 10 | 40px | Large page rhythm |
| 12 | 48px | Major section separation |

Rules:

- Align controls to a shared baseline before adjusting individual spacing.
- Prefer fewer, larger spacing decisions over many arbitrary margins.
- Dense tables may use 8–12px vertical row padding; do not make rows taller than their information requires.
- Keep toolbar controls in one aligned row on desktop and one full-width action group on phone.

### 4.3 Grid

- Desktop: use flexible grids with `minmax(0, 1fr)` to prevent accidental overflow.
- Tables: use explicit content-aware column widths and avoid unnecessary horizontal scrolling.
- Drawers: desktop width is `50vw`; phone width is `100vw`.
- The left navigation rail is `48px` collapsed and `240px` expanded.

## 5. Roundness and geometry

| Token | Value | Use |
| --- | ---: | --- |
| `--stocky-radius-widget` | 16px | Main cards, tables, major surfaces |
| `--stocky-radius-card` | 20px | Larger feature cards |
| `--stocky-radius-workspace` | 8px | Compact controls and navigation items |
| `--stocky-radius-menu` | 14px | Menus, dialogs, popovers |
| `--stocky-radius-menu-item` | 10px | Menu rows, compact fields |
| `--stocky-radius-pill` | 9999px | Buttons, filters, status chips, search |

Rules:

- Use a pill only for actions, filters, statuses, and search controls.
- Use 16px for primary surfaces; do not make every surface fully round.
- Table headers and editorial tabs have square/flat geometry; they should not become pills.
- A drawer is a panel, not a card: keep its edge flush to the viewport.
- Avoid mixing 24px, 18px, and 12px radii on one screen without a clear hierarchy.

## 6. Surfaces, borders, and shadows

### 6.1 Surface hierarchy

```text
Page canvas       #F8F8F4
Primary surface   #FFFFFF
Subtle surface    #F3F5EF / #F0F2EB
Dark focus        #151713
```

### 6.2 Borders

- Default hairline: `rgba(17, 18, 15, 0.10)`.
- Strong border: `rgba(17, 18, 15, 0.16)`.
- Focus border: `#0E8755` plus a soft 3px green focus ring.
- Use borders to separate information, not to outline every child element.
- Remove redundant borders where table row separators already provide structure.

### 6.3 Shadows

| Token | Value | Use |
| --- | --- | --- |
| Card | `0 10px 28px rgba(35,43,33,.05)` | Main surfaces |
| Card hover | `0 16px 34px rgba(35,43,33,.09)` | Interactive cards |
| Float | `0 16px 42px rgba(35,43,33,.14)` | Mobile dock, floating action bar |
| Menu | `0 18px 42px rgba(35,43,33,.14)` | Menus, drawers, popovers |

Keep shadows soft and low contrast. Avoid heavy black shadows or glow effects inside the operational product.

## 7. Buttons and actions

### 7.1 Button hierarchy

| Variant | Background | Text | Use |
| --- | --- | --- | --- |
| Primary | Lime `#D8FF00` | Main ink | Add stock, save, start, confirm |
| Secondary | White | Main ink | Import, export, cancel, neutral action |
| Quiet | Transparent | Secondary ink | Tertiary actions, toolbar links |
| Destructive | Critical tint | Critical text | Delete, remove, irreversible action |
| Icon-only | Transparent or subtle surface | Secondary ink | Close, edit, filter, more |

Button standard:

```css
min-height: 36px;       /* compact platform action */
padding-inline: 14px;
border-radius: 9999px;
font-size: 12px;
font-weight: 500;
gap: 8px;
```

Rules:

- One primary button per action group.
- Use verbs: `Add stock`, `Save supplier`, `Assign task`.
- Keep button labels short; move explanations into helper text.
- Icon-only controls need an accessible label and a visible hover/focus state.
- On phone, action groups stretch equally when the actions are peers.

## 8. Inputs, search, and selectors

- Search fields are pill-shaped, white, and 36–40px tall.
- Standard form fields are 40px tall, 10px radius, white surface, hairline border.
- Labels use 11px medium weight and main ink.
- Helper text uses 10–11px secondary ink.
- Placeholder uses `#939A90`; never use placeholder text as the only label.
- Focus state: green border plus `0 0 0 3px rgba(14,135,85,.10)`.
- Disabled state: global background, placeholder color, and no hover lift.
- Search/filter popovers use 14px panel radius and 10px menu-item radius.

## 9. Navigation and tabs

### 9.1 Sidebar

- Collapsed rail: 48px.
- Expanded rail: 240px and overlays content rather than reflowing it.
- Navigation icons are centered on the collapsed rail.
- Active item: soft green background, green icon/text, medium weight.
- Notification badge: lime circle with charcoal text.
- Account control sits at the bottom and follows the same hover surface.

### 9.2 Context tabs

- Tabs are plain text, not pill buttons.
- Active tab uses a 2px green underline.
- No fully rounded tab containers.
- Keep the tab rail horizontally scrollable on phone.
- Tab labels should be short nouns or clear view names.

## 10. Tables and data-dense views

### 10.1 Table structure

- Table surface: white, 16px outer radius, subtle border.
- Header row: `#F3F5EF`, 10px uppercase medium text.
- Body row: 11px text, 8–12px vertical padding.
- Primary row value: main ink, weight 500 only where it improves scanning.
- Metadata: 10px, secondary ink.
- Hover: `#FBFCF8`.
- Selected row: `#F1F8F0` with a subtle 2px green inset, never a blue rail.
- Actions sit in a dedicated right column with enough width for icon controls.
- Checkbox cells align to the same vertical center as the header checkbox.

### 10.2 Column behavior

- Allocate width from content importance: product/name first, actions last.
- Keep numeric columns right-aligned.
- Keep dates and statuses stacked when a row needs density.
- Use truncation with a tooltip for long supplier, location, or product names.
- Avoid side scrolling on phone; use a card/list representation or show only the primary columns.

### 10.3 Filter and sort controls

- Sort and filter icons sit together on the right side of each header.
- Icons are compact: approximately 12–14px.
- Filter menus are fixed-position popovers so table borders never clip them.
- Menu text uses 11px regular/medium weight.
- Menu search fields are 28–32px tall.
- Selected filter options use the info green surface.

## 11. Drawers, dialogs, and overlays

### 11.1 Drawer standard

- Desktop: `width: 50vw`, maximum width as needed by the content.
- Phone: `width: 100vw` and full viewport height.
- Surface: white, flush to the right edge, no outer radius on the viewport edge.
- Overlay: `rgba(17,18,15,.36)` with a light blur where appropriate.
- Header: 20–24px padding, title 20px regular, supporting copy 12–14px.
- Footer: separated by a hairline; primary action on the right desktop and full-width on phone.
- Drawer content is divided into clear sections with 1px separators.

### 11.2 Modal standard

- Use a modal only for focused decisions or short forms.
- Maximum width: approximately 544px for normal forms, 800px for data review.
- Radius: 14–16px.
- Keep the overlay visible and the close control discoverable.
- Do not nest a modal inside a drawer unless the task absolutely requires it.

## 12. Cards, empty states, and status blocks

- Use cards to group a decision, not to decorate every paragraph.
- Card headings use main ink; descriptions use secondary ink.
- Empty states should explain what the user can do next and include one clear action.
- Status chips should be short: `Healthy`, `Needs review`, `Never audited`.
- Avoid using icon-only status communication; pair icons with text for important states.
- Metric cards use one large value, one concise label, and optional supporting context.

## 13. Icons and imagery

- Use the shared Stocky icon set whenever an icon exists.
- Default icon sizes: 12px for table controls, 16px for nav/actions, 20px for empty states.
- Icons inherit semantic color; do not add random accent colors.
- Icons are aligned optically to text, not only by their bounding box.
- Product imagery belongs in the landing page or a focused detail view; data tables should stay text-first.

## 14. Motion standards

Motion should clarify state, not compete with work.

### 14.1 Timing tokens

| Motion | Timing | Curve | Use |
| --- | ---: | --- | --- |
| Micro interaction | 180ms | `cubic-bezier(.16,1,.3,1)` | Hover, color, border, icon shift |
| Sidebar | 240ms | `cubic-bezier(.16,1,.3,1)` | Expand/collapse rail |
| Drawer enter | 300ms | `cubic-bezier(.16,1,.3,1)` | Slide from right |
| Drawer exit | 220ms | `cubic-bezier(.7,0,.84,0)` | Dismiss drawer |
| Popover | 180ms | `cubic-bezier(.16,1,.3,1)` | Fade/scale menu |
| Selection bar | 180ms | `cubic-bezier(.16,1,.3,1)` | Slide up from bottom |
| Page reveal | 500–700ms | `power3.out` | Landing/editorial sections only |

### 14.2 Interaction rules

- Hover: use a small color/surface change; avoid large movement in dense tables.
- Press: reduce scale no more than 1–2% or darken the surface.
- Drawer: animate both the panel and overlay; never snap into existence.
- Row selection: change background immediately, then animate any action bar.
- Tabs: animate underline or content opacity; do not animate layout width.
- Loading: use a restrained spinner or skeleton; avoid infinite bouncing content.
- Respect `prefers-reduced-motion: reduce` by disabling decorative loops and reducing transitions to near-instant state changes.

### 14.3 Motion do/don’t

| Do | Don’t |
| --- | --- |
| Slide a drawer from the edge | Scale a full drawer from the center |
| Fade a menu with a small upward shift | Fly controls across the page |
| Use a single easing family | Give every widget a different spring |
| Keep table interactions under 240ms | Delay an operational action with decoration |
| Animate meaningful state change | Animate static labels continuously |

## 15. Responsive behavior

### Desktop

- Sidebar rail remains available and expands on hover/focus.
- Tables can show the full information model.
- Toolbar search and actions share one baseline.
- Drawers occupy half the viewport.

### Phone

- Hide or replace wide table views with compact cards.
- Never require primary work to depend on horizontal table scrolling.
- Toolbar actions stretch equally when they represent peer actions.
- Context tabs remain available and do not leave a dead gray placeholder when hidden.
- Drawers cover the whole screen.
- Bottom navigation and bottom selection bars must respect safe-area insets.
- Keep body text readable; compactness comes from grouping, not shrinking below 10px.

## 16. Accessibility requirements

- Every icon-only button needs an accessible name.
- Every input needs a visible label or an accessible label.
- Do not communicate state by color alone.
- Keyboard focus must be visible with the green focus ring.
- Menus, drawers, and dialogs need correct roles and focus return behavior.
- Maintain at least 44px touch targets on phone for primary controls, even when the visible icon is smaller.
- Preserve logical heading order.
- Keep contrast high for main ink and action labels; verify custom status combinations.

## 17. Content and naming

- Prefer direct operational verbs: `Add stock`, `Audit`, `Assign`, `Save`, `Delete`.
- Use sentence case everywhere except table overlines and compact headers.
- Use “location” consistently; do not alternate between branch, site, and location unless the distinction is meaningful.
- Use “next expiry date” and “last audit date” consistently in inventory tables.
- Keep supporting copy to one or two short sentences.
- Empty states should tell the user what happens after the action.

## 18. Implementation contract

Use existing tokens before adding new ones:

```css
.new-surface {
  background: var(--stocky-bg-widget);
  border: 1px solid var(--stocky-border-subtle);
  border-radius: var(--stocky-radius-widget);
  box-shadow: var(--stocky-shadow-card);
  color: var(--stocky-text-main);
}

.new-primary-action {
  min-height: 36px;
  padding-inline: 14px;
  border: 1px solid var(--stocky-accent);
  border-radius: var(--stocky-radius-pill);
  background: var(--stocky-accent);
  color: var(--stocky-text-main);
  font-size: var(--stocky-font-xs);
  font-weight: 500;
}
```

Before adding a new component, check:

1. Does an existing shared class already solve the geometry?
2. Is the surface using the platform background and border tokens?
3. Is the type within the scale and allowed weights?
4. Is the primary action lime and the supporting action neutral?
5. Does the interaction use the standard motion curve and duration?
6. Does the phone state remove horizontal scrolling and preserve touch targets?
7. Does the component work with keyboard focus and reduced motion?

## 19. Definition of done

A page is visually aligned when:

- It reads as warm paper + white surfaces + charcoal ink at a glance.
- It has one clear lime action hierarchy.
- It uses 16px surfaces, 8–10px compact controls, and pills only where appropriate.
- Its table and form typography stay compact and consistent.
- Sidebar, tabs, drawers, menus, and buttons share the same motion language.
- Its mobile version is a deliberate layout, not a squeezed desktop view.
- It introduces no unexplained color, radius, shadow, font weight, or animation.
