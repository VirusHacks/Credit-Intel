# Credit-Intel — Design System & UI Specification

> **Version:** 2.0 — Complete Redesign  
> **Last Updated:** March 2026  
> **Purpose:** Authoritative reference document for redesigning every page and component of the Credit-Intel platform into a modern, bank-grade fintech interface.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout Grid](#4-spacing--layout-grid)
5. [Elevation & Surfaces](#5-elevation--surfaces)
6. [Iconography](#6-iconography)
7. [Component Library](#7-component-library)
8. [Data Visualization](#8-data-visualization)
9. [Motion & Interaction](#9-motion--interaction)
10. [Page Specifications](#10-page-specifications)
11. [Responsive Strategy](#11-responsive-strategy)
12. [Implementation Reference](#12-implementation-reference)
13. [Do's & Don'ts](#13-dos--donts)

---

## 1. Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Bank-Grade Trust** | Every element communicates institutional credibility. No playful colors, no casual layouts. This is a tool for credit officers managing ₹100Cr+ decisions. |
| **Clarity Over Density** | Show the right information, not all information. Use progressive disclosure. White space is not wasted space — it is breathing room for cognition. |
| **Explainability as UI** | AI transparency is a first-class feature, not an afterthought. Source chips, confidence badges, and reasoning traces are core layout elements, not footnotes. |
| **Minimal Intervention** | Every click must have purpose. Reduce navigation depth. Key actions within 2 clicks of any page. |
| **Quiet Sophistication** | The interface whispers competence. Subdued palette, measured typography, restrained animation. The content speaks, not the chrome. |

### Visual Identity

```
Aesthetic:   Minimal SaaS / Enterprise Fintech
Mood:        Professional, Calm, Trustworthy, Intelligent
References:  Mercury (banking), Linear (clarity), Stripe Dashboard (polish),
             Bloomberg Terminal (data density when needed), Ramp (modern fintech)
Avoid:       Hackathon-style UIs, dark heavy themes, gaming aesthetics,
             excessive gradients, stock imagery, clip art icons
```

---

## 2. Color System

### 2.1 Primary Palette

All colors use **oklch()** for perceptual uniformity. Hex equivalents provided for reference.

```
┌─────────────────────────────────────────────────────────────┐
│  BRAND / PRIMARY                                            │
│                                                             │
│  Deep Navy       #1E3A5F   oklch(0.32 0.06 250)            │
│  Brand Blue      #2563EB   oklch(0.55 0.20 260)            │
│  Brand Blue 600  #1D4ED8   oklch(0.50 0.21 262)            │
│  Soft Blue       #DBEAFE   oklch(0.93 0.04 250)            │
│                                                             │
│  NEUTRALS                                                   │
│                                                             │
│  Ink             #0F172A   oklch(0.15 0.02 260)             │
│  Slate 700      #334155   oklch(0.35 0.02 255)             │
│  Slate 500      #64748B   oklch(0.55 0.03 255)             │
│  Slate 300      #CBD5E1   oklch(0.85 0.02 250)             │
│  Slate 100      #F1F5F9   oklch(0.97 0.01 250)             │
│  Surface        #F8FAFC   oklch(0.98 0.005 250)            │
│  White          #FFFFFF   oklch(1.00 0 0)                   │
│                                                             │
│  SEMANTIC                                                   │
│                                                             │
│  Success BG     #F0FDF4   Success FG  #16A34A              │
│  Warning BG     #FFFBEB   Warning FG  #D97706              │
│  Danger BG      #FEF2F2   Danger FG   #DC2626              │
│  Info BG        #EFF6FF   Info FG     #2563EB              │
│  Purple BG      #F5F3FF   Purple FG   #7C3AED              │
│                                                             │
│  ACCENT                                                     │
│                                                             │
│  Teal           #0D9488   oklch(0.60 0.12 180)             │
│  Teal Light     #CCFBF1                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 CSS Variable Mapping

Replace the current neutral oklch variables with branded ones:

```css
:root {
  /* ── Brand ─────────────────────────────── */
  --brand:              oklch(0.55 0.20 260);   /* #2563EB Brand Blue */
  --brand-foreground:   oklch(1.00 0 0);        /* White on brand */
  --brand-muted:        oklch(0.93 0.04 250);   /* #DBEAFE Soft Blue */
  --brand-deep:         oklch(0.32 0.06 250);   /* #1E3A5F Deep Navy */

  /* ── Surfaces ──────────────────────────── */
  --background:         oklch(0.98 0.005 250);  /* #F8FAFC warm off-white */
  --foreground:         oklch(0.15 0.02 260);   /* #0F172A near-black ink */
  --card:               oklch(1.00 0 0);        /* #FFFFFF pure white cards */
  --card-foreground:    oklch(0.15 0.02 260);

  /* ── Neutral Scale ─────────────────────── */
  --muted:              oklch(0.97 0.01 250);   /* #F1F5F9 */
  --muted-foreground:   oklch(0.55 0.03 255);   /* #64748B */
  --border:             oklch(0.91 0.01 250);   /* #E2E8F0 */
  --input:              oklch(0.91 0.01 250);

  /* ── Primary (interactive) ─────────────── */
  --primary:            oklch(0.55 0.20 260);   /* Brand Blue */
  --primary-foreground: oklch(1.00 0 0);

  /* ── Semantic ──────────────────────────── */
  --success:            oklch(0.60 0.18 145);   /* #16A34A */
  --success-muted:      oklch(0.96 0.04 150);   /* #F0FDF4 */
  --warning:            oklch(0.65 0.17 75);    /* #D97706 */
  --warning-muted:      oklch(0.98 0.04 85);    /* #FFFBEB */
  --destructive:        oklch(0.55 0.22 25);    /* #DC2626 */
  --destructive-muted:  oklch(0.97 0.03 25);    /* #FEF2F2 */

  /* ── Charts ────────────────────────────── */
  --chart-1:            oklch(0.55 0.20 260);   /* Brand Blue */
  --chart-2:            oklch(0.60 0.12 180);   /* Teal */
  --chart-3:            oklch(0.60 0.18 145);   /* Green */
  --chart-4:            oklch(0.65 0.17 75);    /* Amber */
  --chart-5:            oklch(0.55 0.22 25);    /* Red */

  /* ── Radius ────────────────────────────── */
  --radius:             0.875rem;               /* 14px — softer cards */
}
```

### 2.3 Color Usage Rules

| Context | Color | Example |
|---------|-------|---------|
| Page background | `--background` (`#F8FAFC`) | Main wrapper `bg-background` |
| Cards | `--card` (`#FFFFFF`) | All content cards sit on white |
| Card borders | `--border` (`#E2E8F0`) | `border border-border` — subtle |
| Primary buttons | `--brand` (`#2563EB`) | CTA buttons, active nav |
| Secondary buttons | `--muted` fill, `--foreground` text | Non-primary actions |
| Body text | `--foreground` (`#0F172A`) | Main readable text |
| Caption / helper text | `--muted-foreground` (`#64748B`) | Subtitles, labels, timestamps |
| Links | `--brand` | Text links, "View all →" |
| Approved status | `--success` on `--success-muted` bg | Green badge |
| Under Review | `--warning` on `--warning-muted` bg | Amber badge |
| Risk Flag / Failed | `--destructive` on `--destructive-muted` bg | Red badge |
| Active pipeline | `--brand` on `--brand-muted` bg | Blue badge |

**Rule: Never use more than 3 colors on a single card.** Typically: neutral card bg, one accent badge, one text color hierarchy.

---

## 3. Typography

### 3.1 Font Stack

```css
--font-heading: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
--font-body:    'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono:    'Geist Mono', 'SF Mono', 'Fira Code', monospace;
```

> **Why Inter?** Designed for screens, excellent number legibility (critical for financial data), wide weight range, free.
> Load from Google Fonts: `Inter:wght@400;500;600;700` — only 4 weights needed.

### 3.2 Type Scale

```
┌───────────┬──────────┬────────┬───────────┬──────────────────────┐
│ Token     │ Size     │ Weight │ Line-H    │ Usage                │
├───────────┼──────────┼────────┼───────────┼──────────────────────┤
│ display   │ 48px/3rem│ 700    │ 1.1       │ Hero headline only   │
│ h1        │ 36px/2.25│ 700    │ 1.2       │ Page titles          │
│ h2        │ 28px/1.75│ 600    │ 1.3       │ Section headings     │
│ h3        │ 22px/1.375│ 600   │ 1.35      │ Card titles, modal h │
│ h4        │ 18px/1.125│ 600   │ 1.4       │ Sub-section headings │
│ body-lg   │ 16px/1rem│ 400    │ 1.6       │ Primary body text    │
│ body      │ 14px/.875│ 400    │ 1.5       │ Table cells, details │
│ caption   │ 13px/.8125│ 500   │ 1.4       │ Labels, badges       │
│ overline  │ 12px/.75 │ 600    │ 1.3       │ Uppercase labels     │
│ tiny      │ 11px/.6875│ 500   │ 1.3       │ Timestamps, footnotes│
└───────────┴──────────┴────────┴───────────┴──────────────────────┘
```

### 3.3 Typography Classes (Tailwind)

```html
<!-- Page title -->
<h1 class="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>

<!-- Section heading -->
<h2 class="text-2xl font-semibold text-foreground">Recent Applications</h2>

<!-- Card title -->
<h3 class="text-lg font-semibold text-foreground">Bank Statement Analysis</h3>

<!-- Sub-section -->
<h4 class="text-base font-semibold text-foreground">Monthly Credits</h4>

<!-- Body -->
<p class="text-sm text-foreground leading-relaxed">...</p>

<!-- Caption / secondary -->
<p class="text-sm text-muted-foreground">Last updated 2 hours ago</p>

<!-- Overline label -->
<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</span>

<!-- Metric number -->
<span class="text-3xl font-bold tabular-nums text-foreground">₹12.4Cr</span>

<!-- Mono / code values -->
<code class="font-mono text-sm text-slate-600">CMR: 4/10</code>
```

### 3.4 Typography Rules

1. **Page titles** (`h1`): One per page, top-left, bold. Never center-aligned on dashboard pages.
2. **Section titles** (`h2`): Separate content groups. Always have `mt-8` or `mt-10` above.
3. **Card metric values**: Use `tabular-nums` for aligned numbers. Large size (`text-3xl` or `text-2xl`).
4. **Body text** minimum `14px`. Nothing below `11px` anywhere.
5. **Letter-spacing**: Tight (`tracking-tight`) for headlines. Normal for body. Wide (`tracking-wider`) only for `OVERLINE` labels.
6. **Line height**: Always ≥ 1.4 for body text. Dense (`1.1`) only for display headlines.
7. **Never use `font-light`** — minimum `font-normal` (400). Financial text must feel solid.
8. **Number formatting**: Always use `toLocaleString('en-IN')` for Indian rupee formatting. Always show ₹ symbol.

---

## 4. Spacing & Layout Grid

### 4.1 Spacing Scale

```
┌──────────┬─────────┬────────────────────────────┐
│ Token    │ Value   │ Usage                      │
├──────────┼─────────┼────────────────────────────┤
│ spacing-1│ 4px     │ Tight inline gaps          │
│ spacing-2│ 8px     │ Icon-to-text, badge padding│
│ spacing-3│ 12px    │ Element internal spacing    │
│ spacing-4│ 16px    │ Card inner element gaps     │
│ spacing-5│ 20px    │ Card group gaps             │
│ spacing-6│ 24px    │ Card padding (standard)     │
│ spacing-8│ 32px    │ Section separation          │
│ spacing-10│ 40px   │ Major section separation    │
│ spacing-12│ 48px   │ Page top padding            │
│ spacing-16│ 64px   │ Hero section padding        │
└──────────┴─────────┴────────────────────────────┘
```

### 4.2 Page Container Layout

```
┌──────────────────────────────────────────────────────────┐
│ Navigation Bar (fixed top, h-16, full-width, bg-white)   │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐    │
│  │ Content Container (max-w-[1320px] mx-auto)       │    │
│  │ Padding: px-6 sm:px-8 lg:px-12                   │    │
│  │ Top: pt-8                                         │    │
│  │                                                    │    │
│  │  ┌─ Page Header ──────────────────────────────┐   │    │
│  │  │ H1 title + subtitle + action buttons       │   │    │
│  │  └────────────────────────────────────────────┘   │    │
│  │  ↕ gap: 32px (spacing-8)                          │    │
│  │  ┌─ Metrics Cards ────────────────────────────┐   │    │
│  │  │ grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4│  │    │
│  │  │ gap-5                                       │   │    │
│  │  └────────────────────────────────────────────┘   │    │
│  │  ↕ gap: 40px (spacing-10)                         │    │
│  │  ┌─ Section ──────────────────────────────────┐   │    │
│  │  │ H2 + content area                          │   │    │
│  │  └────────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 4.3 Grid System

**Primary Grid:** 12-column at `lg`, collapses to 1-column on mobile.

```html
<!-- Metrics: 4-column equal -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

<!-- Main + Sidebar: 8/4 split -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div class="lg:col-span-8"><!-- main --></div>
  <div class="lg:col-span-4"><!-- sidebar --></div>
</div>

<!-- 3-column cards -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

<!-- 5Cs: 5-column (desktop) or 2+3 (tablet) -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
```

### 4.4 Max Width Rules

| Context | Max Width | Reason |
|---------|-----------|--------|
| Page container | `max-w-[1320px]` | Optimal reading width + chart space |
| Content-only pages | `max-w-4xl` (896px) | Settings, forms, login |
| CAM report viewer | `max-w-5xl` (1024px) | Document-like width |
| Dialog/Modal | `max-w-lg` (512px) | Forms, confirmations |

---

## 5. Elevation & Surfaces

### 5.1 Card Anatomy

Every content area is a **Card** — the primary surface unit.

```
┌───────────────────────────────────────────────┐
│                                               │  ← border: 1px solid var(--border)
│   ┌─ Card Header ──────────────────────────┐  │     (subtle #E2E8F0)
│   │ Icon + Title + Optional badge/action   │  │
│   └────────────────────────────────────────┘  │  ← Optional divider (border-b)
│                                               │
│   ┌─ Card Content ─────────────────────────┐  │
│   │ Metrics / Charts / Data / Forms        │  │
│   └────────────────────────────────────────┘  │
│                                               │  ← padding: 24px (p-6)
│   ┌─ Card Footer (optional) ───────────────┐  │     border-radius: 14px
│   │ Actions / Links / Timestamps           │  │     shadow: none by default
│   └────────────────────────────────────────┘  │     shadow-sm on hover
│                                               │
└───────────────────────────────────────────────┘
```

### 5.2 Shadow Scale

```css
/* Level 0 — Default card: no shadow */
shadow-none  →  0 0 0 0 transparent

/* Level 1 — Hovered card, dropdown */
shadow-sm    →  0 1px 2px 0 rgb(0 0 0 / 0.05)

/* Level 2 — Elevated card, modal */
shadow-md    →  0 4px 6px -1px rgb(0 0 0 / 0.07),
                0 2px 4px -2px rgb(0 0 0 / 0.05)

/* Level 3 — Popover, command palette */
shadow-lg    →  0 10px 15px -3px rgb(0 0 0 / 0.08),
                0 4px 6px -4px rgb(0 0 0 / 0.04)
```

### 5.3 Card Variants

| Variant | Background | Border | Shadow | Usage |
|---------|-----------|--------|--------|-------|
| **Default** | `bg-card` (white) | `border border-border` | none | Standard content cards |
| **Metric** | `bg-card` (white) | `border border-border` | none → `shadow-sm` on hover | KPI overview cards |
| **Tinted** | Semantic light bg (e.g. `bg-blue-50/60`) | none | none | Status highlighting, agent cards |
| **Elevated** | `bg-card` | none | `shadow-md` | Modal content, floating panels |
| **Inset** | `bg-muted` (`#F1F5F9`) | none | none | Nested content within a card |
| **Ghost** | transparent | `border border-dashed border-border` | none | Upload zones, empty states |

### 5.4 Visual Treatment

```css
/* Standard card */
.card-default {
  @apply bg-card border border-border rounded-[14px] p-6;
}

/* Hover effect — subtle lift */
.card-interactive {
  @apply bg-card border border-border rounded-[14px] p-6
         transition-all duration-200 ease-out
         hover:shadow-sm hover:border-slate-300;
}

/* Status-tinted card */
.card-tinted-success {
  @apply bg-green-50/60 border border-green-200/50 rounded-[14px] p-6;
}

/* Inset panel */
.card-inset {
  @apply bg-muted rounded-xl p-4;
}
```

---

## 6. Iconography

### 6.1 Icon Library

**Primary:** Lucide React (already installed)  
**Size Scale:**

| Context | Size | Class |
|---------|------|-------|
| Inline with text | 16px | `h-4 w-4` |
| Card icon | 20px | `h-5 w-5` |
| Feature icon | 24px | `h-6 w-6` |
| Hero / empty state | 40-48px | `h-10 w-10` or `h-12 w-12` |

### 6.2 Icon Containers

For metric and feature cards, icons sit in soft-colored circles:

```html
<!-- Icon container -->
<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100/80">
  <TrendingUp class="h-5 w-5 text-blue-600" />
</div>

<!-- Semantic variants -->
<div class="... rounded-xl bg-green-100/80">   <!-- success -->
<div class="... rounded-xl bg-amber-100/80">   <!-- warning -->
<div class="... rounded-xl bg-red-100/80">     <!-- danger -->
<div class="... rounded-xl bg-purple-100/80">  <!-- info/AI -->
```

### 6.3 Icon Mapping (Key Features)

| Feature | Icon | Color |
|---------|------|-------|
| Total Applications | `LayoutDashboard` | Blue |
| Completed / Approved | `CheckCircle2` | Green |
| Under Review | `Clock` | Amber |
| Risk Alert / Failed | `AlertTriangle` | Red |
| Documents | `FileText` | Slate |
| Upload | `Upload` | Blue |
| AI / Pipeline | `Brain` | Purple |
| Search / Research | `Search` | Teal |
| Download PDF | `Download` | Blue |
| Settings | `Settings` | Slate |
| Bank Statement | `Building2` | Blue |
| GST | `Receipt` | Teal |
| ITR / Balance Sheet | `Calculator` | Indigo |
| CIBIL | `ShieldCheck` | Purple |
| Scout Agent | `Globe` | Cyan |
| Character (5C) | `User` | Blue |
| Capacity (5C) | `TrendingUp` | Teal |
| Capital (5C) | `Banknote` | Green |
| Collateral (5C) | `Shield` | Purple |
| Conditions (5C) | `Scale` | Amber |

---

## 7. Component Library

### 7.1 Navigation Bar

```
┌──────────────────────────────────────────────────────────────┐
│ ◉ Credit Intel          [Applications] [Analysis] [...]  👤  │
│   ↑ Logo/Wordmark       ↑ Nav links (horizontal)    ↑ User  │
└──────────────────────────────────────────────────────────────┘
```

**Specification:**

```
Height:         h-16 (64px)
Background:     bg-white/80 backdrop-blur-xl
Border:         border-b border-border
Position:       sticky top-0 z-50
Max-width:      Full width, inner content max-w-[1320px] mx-auto
Logo:           Text wordmark "Credit Intel" — text-lg font-bold text-brand-deep
                Optional logomark: small blue square icon before text
Nav links:      text-sm font-medium text-muted-foreground
                hover:text-foreground
                Active: text-foreground, with subtle bottom border or bg-muted pill
Spacing:        gap-1 between nav items
Right side:     User avatar (circular, 32px) + dropdown
```

**Nav Items:** Dashboard · Applications · Documents · Analysis · Analytics · Audit

**Active State (Pill Style):**
```html
<a class="rounded-lg px-3 py-2 text-sm font-medium bg-muted text-foreground">
  Applications
</a>
```

**Inactive State:**
```html
<a class="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
  Analysis
</a>
```

---

### 7.2 Metric Card

The primary KPI display unit.

```
┌─────────────────────────────────┐
│  ┌──────┐                       │
│  │  📊  │   Applications        │  ← overline label
│  └──────┘   Processed           │     (text-xs uppercase tracking-wider
│             ─────────           │      text-muted-foreground)
│                                 │
│  247                            │  ← metric value
│                                 │     (text-3xl font-bold tabular-nums)
│  ↑ 12% from last month         │  ← trend indicator
│                                 │     (text-xs text-green-600)
└─────────────────────────────────┘
     240px min-width
     p-6, rounded-[14px]
     border border-border
     hover:shadow-sm transition
```

**Implementation:**

```tsx
function MetricCard({ icon: Icon, iconBg, label, value, trend, trendDirection }) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-6 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
            {value}
          </p>
          {trend && (
            <p className={`mt-2 text-xs font-medium ${
              trendDirection === 'up' ? 'text-green-600' : 'text-red-500'
            }`}>
              {trendDirection === 'up' ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
```

---

### 7.3 Status Badge

```
Variants:
  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐
  │ ● Approved   │  │ ● Under Rev  │  │ ● Risk Flag  │  │ ● Processing │
  │   green      │  │   amber      │  │   red        │  │   blue       │
  └─────────────┘  └──────────────┘  └─────────────┘  └─────────────┘
```

**Implementation:**

```tsx
const STATUS_STYLES = {
  approved:    'bg-green-50 text-green-700 border-green-200/60',
  complete:    'bg-green-50 text-green-700 border-green-200/60',
  under_review:'bg-amber-50 text-amber-700 border-amber-200/60',
  analyzing:   'bg-blue-50 text-blue-700 border-blue-200/60',
  ingesting:   'bg-blue-50 text-blue-700 border-blue-200/60',
  risk_flag:   'bg-red-50 text-red-700 border-red-200/60',
  failed:      'bg-red-50 text-red-700 border-red-200/60',
  awaiting:    'bg-amber-50 text-amber-700 border-amber-200/60',
  not_started: 'bg-slate-50 text-slate-600 border-slate-200/60',
  reconciling: 'bg-purple-50 text-purple-700 border-purple-200/60',
};

function StatusBadge({ status, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
```

---

### 7.4 Confidence Badge

Displays AI confidence level with traffic-light color.

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ◉ 92% High   │  │ ◉ 74% Medium │  │ ◉ 58% Low    │
│   green       │  │   amber      │  │   red         │
└──────────────┘  └──────────────┘  └──────────────┘
```

```tsx
function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const level = pct >= 85 ? 'high' : pct >= 70 ? 'medium' : 'low';
  const styles = {
    high:   'bg-green-50 text-green-700 border-green-200/60',
    medium: 'bg-amber-50 text-amber-700 border-amber-200/60',
    low:    'bg-red-50 text-red-700 border-red-200/60',
  };
  const labels = { high: 'High', medium: 'Medium', low: 'Low' };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${styles[level]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {pct}% {labels[level]}
    </span>
  );
}
```

---

### 7.5 Source Chip

Traces a data point to its extraction source.

```
┌─────────────────────────┐
│ 📄 Mistral OCR p.42     │   ← Extraction source citation
└─────────────────────────┘
```

```tsx
function SourceChip({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      <FileText className="h-3 w-3" />
      {source}
    </span>
  );
}
```

---

### 7.6 Data Table

```
┌──────────────────────────────────────────────────────────────┐
│ Company Name     Industry    Requested    Risk    Status  ▾  │
├──────────────────────────────────────────────────────────────┤
│ ABC Industries   Textiles    ₹50Cr       4/10   ● Review    │
│ XYZ Corp         IT Svcs     ₹25Cr       2/10   ● Approved  │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

**Specification:**

```
Container:      rounded-[14px] border border-border bg-card overflow-hidden
Header row:     bg-slate-50/80 border-b  |  text-xs font-semibold uppercase
                tracking-wider text-muted-foreground
Data rows:      text-sm text-foreground  |  border-b border-border/50
                hover:bg-slate-50/50 transition-colors
Cell padding:   px-5 py-4
Row height:     ~56px
Pagination:     Bottom bar with page numbers, rounded-lg buttons
Actions:        Icon button group (eye, edit, trash) — ghost variant
```

**Header cell:** `px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground`

**Data cell:** `px-5 py-4 text-sm text-foreground`

---

### 7.7 Button System

| Variant | Appearance | Usage |
|---------|------------|-------|
| **Primary** | Blue filled (`bg-brand text-white`) | Main CTA: "Run Analysis", "Upload", "Generate CAM" |
| **Secondary** | White filled, subtle border (`bg-card border`) | Secondary actions: "View Details", "Cancel" |
| **Ghost** | Transparent, icon-only | Table row actions, toolbar toggles |
| **Destructive** | Red filled | "Delete Application", "Cancel Pipeline" |
| **Outline** | Transparent with border | "Download PDF", "Export Data" |

**Specification:**

```css
/* Primary */
.btn-primary {
  @apply h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold
         shadow-sm shadow-blue-600/20
         hover:bg-blue-700 active:bg-blue-800
         transition-all duration-150;
}

/* Secondary */
.btn-secondary {
  @apply h-10 px-5 rounded-xl bg-card border border-border text-foreground
         text-sm font-semibold
         hover:bg-muted active:bg-slate-100
         transition-all duration-150;
}

/* Ghost */
.btn-ghost {
  @apply h-9 px-3 rounded-lg text-muted-foreground text-sm font-medium
         hover:bg-muted hover:text-foreground
         transition-colors duration-150;
}
```

**Button Group (e.g., "Run Analysis" + "Upload Documents"):**
```html
<div class="flex items-center gap-3">
  <button class="btn-primary">Run Credit Analysis</button>
  <button class="btn-secondary">Upload Documents</button>
</div>
```

---

### 7.8 Agent Activity Card

Live status display for each pipeline agent.

```
┌──────────────────────────────────────┐
│  ┌──┐  Bank Statement Agent          │
│  │🏦│  Analyzing 12-month cashflow.. │
│  └──┘                                │
│  ████████████░░░░░░░░    68%         │
│                                      │
│  Confidence: ◉ 88% High             │
└──────────────────────────────────────┘
```

**States:**

| State | Icon | Progress | Color Accent |
|-------|------|----------|-------------|
| Pending | `Circle` (empty) | Hidden | Slate |
| Processing | `Loader2` (spinning) | Animated bar | Blue |
| Done | `CheckCircle2` | Full | Green |
| Failed | `XCircle` | Hidden | Red |

```tsx
function AgentCard({ name, status, progress, confidence, message }) {
  const stateStyles = {
    pending:    'border-slate-200 bg-slate-50/30',
    processing: 'border-blue-200 bg-blue-50/30',
    done:       'border-green-200 bg-green-50/30',
    failed:     'border-red-200 bg-red-50/30',
  };

  return (
    <div className={`rounded-xl border p-4 transition-all ${stateStyles[status]}`}>
      <div className="flex items-start gap-3">
        <AgentIcon agent={name} status={status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">{agentLabel(name)}</h4>
            <StatusDot status={status} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{message}</p>
          {status === 'processing' && (
            <div className="mt-3 h-1.5 rounded-full bg-blue-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                   style={{ width: `${progress}%` }} />
            </div>
          )}
          {status === 'done' && confidence != null && (
            <div className="mt-2">
              <ConfidenceBadge score={confidence} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 7.9 Five C Score Card

Individual card for each of the Five Cs of Credit.

```
┌────────────────────────────────────────────┐
│                                            │
│  ┌────┐  Character                         │
│  │ 👤 │  ────────────────                  │
│  └────┘  Score: 72 / 100    Adequate       │
│                                            │
│  ████████████████████████░░░░░░░ 72%       │
│                                            │
│  Supporting:                               │
│  • CMR rank 4 (moderate risk)              │
│  • Clean repayment track record            │
│                                            │
│  Against:                                  │
│  • 1 active civil court case               │
│  • Related party transactions at 34%       │
│                                            │
│  ⊕ View AI Reasoning                       │
│                                            │
└────────────────────────────────────────────┘
```

**Rating Color Map:**

| Rating | Score Range | Color | Badge |
|--------|------------|-------|-------|
| Strong | 75–100 | Green | `bg-green-50 text-green-700` |
| Adequate | 55–74 | Amber/Blue | `bg-blue-50 text-blue-700` |
| Weak | 35–54 | Amber | `bg-amber-50 text-amber-700` |
| Red Flag | 0–34 | Red | `bg-red-50 text-red-700` |

**Progress Bar Color:** Same as rating (green bar for Strong, amber for Weak, etc.)

---

### 7.10 Progress / Pipeline Indicator

Horizontal multi-step pipeline visualization.

```
  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
  │  ✓   │───→│  ✓   │───→│ ●●●  │───→│      │───→│      │───→│      │
  │Ingest│    │Agents│    │Scout │    │Detect│    │Eval  │    │ CAM  │
  └──────┘    └──────┘    └──────┘    └──────┘    └──────┘    └──────┘
   Done        Done      Running     Pending     Pending     Pending
```

**Implementation:**

```
Stages laid out horizontally with flex / grid.
Each stage:
  - Circle icon (24px): ✓ green, ● blue animated, ○ gray
  - Label below (text-xs)
  - Connecting line between stages: h-0.5 bg-border (gray) or bg-green-400 (completed)
  - Active stage line is animated (pulse or gradient sweep)
```

---

### 7.11 Empty State

When a section has no data.

```
┌──────────────────────────────────────┐
│                                      │
│          ┌──────┐                    │
│          │  📄  │                    │
│          └──────┘                    │
│                                      │
│    No applications yet               │
│    Create your first credit          │
│    application to get started.       │
│                                      │
│    [ + New Application ]             │
│                                      │
└──────────────────────────────────────┘
```

```tsx
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border bg-muted/30 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

---

### 7.12 Discrepancy Row

Table row for the 7-check discrepancy engine.

```
┌───────────────────────────────────────────────────────────────────┐
│ Check                     │ Threshold        │ Actual  │ Verdict  │
├───────────────────────────┼──────────────────┼─────────┼──────────┤
│ GST vs Bank Credits       │ >15% variance    │  39.1%  │ 🔴 RED   │
│ GSTR-3B vs 2A ITC         │ >10% mismatch    │  12.4%  │ 🟡 FLAG  │
│ ITR Profit vs Bank Trend  │ Opposite dir.    │  Same   │ 🟢 PASS  │
└───────────────────────────┴──────────────────┴─────────┴──────────┘
```

**Verdict Colors:**

```tsx
const VERDICT_STYLES = {
  PASS:     'bg-green-50 text-green-700',
  FLAG:     'bg-amber-50 text-amber-700',
  RED_FLAG: 'bg-red-50 text-red-700',
};
```

---

## 8. Data Visualization

### 8.1 Chart Library

**Use:** Recharts (already installed)

### 8.2 Chart Color Tokens

```
Primary series:    var(--chart-1) — Brand Blue     #2563EB
Secondary series:  var(--chart-2) — Teal           #0D9488
Tertiary series:   var(--chart-3) — Green          #16A34A
Quaternary:        var(--chart-4) — Amber          #D97706
Quinary:           var(--chart-5) — Red            #DC2626
Grid lines:        #E2E8F0 (border color) — 0.5px dashed
Axis labels:       #64748B (muted-foreground) — 11px
Tooltip bg:        #0F172A (foreground) — rounded-lg, text-white
```

### 8.3 Chart Specifications

#### Five Cs Radar Chart

```
Type:      Radar (Recharts RadarChart)
Shape:     Pentagon (5 axes)
Fill:      Brand Blue at 20% opacity
Stroke:    Brand Blue at 100%, 2px
Dots:      Brand Blue filled circles, 6px
Grid:      4 concentric pentagons, stroke #E2E8F0 dashed
Labels:    Character, Capacity, Capital, Collateral, Conditions
           text-xs font-medium text-muted-foreground
Scale:     0–100
Size:      min 300×300px
Container: White card with p-6
```

#### Monthly GST vs Bank Bar Chart

```
Type:      Grouped Bar (BarChart)
Series 1:  GST Monthly Turnover — Brand Blue
Series 2:  Bank Monthly Credits — Teal
Bars:      radius-top-md (rounded top corners), gap 4px between pairs
X-axis:    Month labels (Apr, May, Jun...)
Y-axis:    ₹ Lakh — formatted with toLocaleString
Grid:      Horizontal lines only, dashed, #E2E8F0
Legend:     Bottom, inline flex, small colored squares + text-xs labels
Size:      Full card width, height 280px
```

#### Financial Trend Line Chart

```
Type:      Line (LineChart)
Lines:     Revenue (Blue, 2px), Profit (Green, 2px), Expenses (Amber, 2px dashed)
Dots:      Show only on hover (activeDot)
Grid:      Horizontal dashed lines
Tooltip:   Dark bg with ₹ formatted values
```

#### Risk Gauge

```
Type:      Semi-circle gauge (custom SVG or third-party)
Segments:  Green (0-35) → Amber (35-65) → Red (65-100)
Needle:    Points to current risk value
Label:     Center — score number in text-2xl font-bold
Size:      200×120px
```

### 8.4 Chart Container Pattern

All charts sit inside a standard Card with title:

```html
<div class="rounded-[14px] border border-border bg-card p-6">
  <div class="mb-5 flex items-center justify-between">
    <div>
      <h3 class="text-base font-semibold text-foreground">GST vs Bank Monthly</h3>
      <p class="text-xs text-muted-foreground">12-month comparison (₹ in Lakhs)</p>
    </div>
    <!-- Optional: filter dropdown or period selector -->
  </div>
  <div class="h-[280px]">
    {/* Recharts component here */}
  </div>
</div>
```

---

## 9. Motion & Interaction

### 9.1 Animation Principles

1. **Purposeful** — Animate to communicate state changes, not for decoration.
2. **Fast** — All transitions ≤ 300ms. Users should never wait for animation.
3. **Subtle** — Avoid bouncy, springy, or attention-grabbing effects.
4. **Consistent** — All hover, enter, exit animations use same easing.

### 9.2 Timing & Easing

```css
/* Standard transition */
transition-all duration-200 ease-out

/* Hover states (cards, buttons) */
transition-all duration-150 ease-out

/* Page/section enter */
transition-all duration-300 ease-out

/* Framer Motion defaults */
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: 'easeOut' }}
```

### 9.3 Interaction Patterns

| Element | Hover | Active | Transition |
|---------|-------|--------|-----------|
| Card (interactive) | `shadow-sm`, border darkens slightly | — | 200ms |
| Button (primary) | Darken bg by 1 shade | Darken by 2 shades | 150ms |
| Button (ghost) | Show bg `bg-muted` | Darken | 150ms |
| Table row | `bg-slate-50/50` | — | 150ms |
| Nav link | `text-foreground`, `bg-muted/50` | — | 150ms |
| Badge | — | — | No hover |
| Accordion | Smooth height expand | — | 250ms |
| Tooltip | Fade in after 500ms delay | — | 200ms |
| Modal | Fade overlay + scale-up content | — | 200ms |

### 9.4 Loading States

| Context | Treatment |
|---------|----------|
| Full page load | Centered `Loader2` icon (spinning), blue, 24px, with "Loading..." text |
| Table loading | Skeleton rows: 5 rows of `h-4 bg-muted animate-pulse rounded` bars |
| Card loading | Skeleton: `h-8 bg-muted rounded animate-pulse` for metric, smaller for labels |
| Pipeline stage | Animated progress bar (width transition 500ms) |
| Button loading | Replace label with `Loader2` spinner, keep button same width |

**Skeleton Anatomy:**

```tsx
function CardSkeleton() {
  return (
    <div className="rounded-[14px] border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
      </div>
      <div className="h-8 w-16 rounded bg-muted animate-pulse" />
      <div className="h-3 w-32 rounded bg-muted animate-pulse" />
    </div>
  );
}
```

---

## 10. Page Specifications

### Page 1: Landing / Dashboard Home

**Route:** `/`  
**Purpose:** First thing Credit Officer sees after login. Overview of application portfolio.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ Nav Bar                                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ Hero Section ──────────────────────────────────────┐ │
│  │                                                      │ │
│  │  Left (60%):                                         │ │
│  │    overline:  "AI-POWERED CREDIT INTELLIGENCE"       │ │
│  │    h1:        "Automate credit analysis.             │ │
│  │                Detect risk signals.                   │ │
│  │                Generate explainable decisions."       │ │
│  │    body:      "Transform raw financial documents      │ │
│  │                into auditable Credit Appraisal Memos │ │
│  │                in minutes, not weeks."               │ │
│  │    buttons:   [Run Credit Analysis] [Upload Docs]    │ │
│  │                                                      │ │
│  │  Right (40%):                                        │ │
│  │    Abstract illustration or mini dashboard preview   │ │
│  │    (gradient blue → teal abstract shape, not photo)  │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  Hero bg: Subtle gradient — bg-gradient-to-br            │
│           from-blue-50/80 via-white to-teal-50/30        │
│  Hero container: rounded-2xl, p-12 lg:p-16              │
│                                                          │
│  ────────────────── spacing-10 ──────────────────────    │
│                                                          │
│  ┌─ Metrics Row ───────────────────────────────────────┐ │
│  │ [Applications] [Complete] [In Progress] [Alerts]    │ │
│  │  4-column grid, MetricCard component                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ────────────────── spacing-10 ──────────────────────    │
│                                                          │
│  ┌─ Recent Applications ───────────────────────────────┐ │
│  │ H2 "Recent Applications"     [View all →]           │ │
│  │ 3-column card grid (ApplicationCard × 6 max)        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ────────────────── spacing-10 ──────────────────────    │
│                                                          │
│  ┌─ Quick Actions Row ─────────────────────────────────┐ │
│  │ [📋 New Application] [📄 Upload Documents]          │ │
│  │ [📊 View Analytics] [🔍 Audit Trail]                │ │
│  │ 4-column, ghost-style cards with icon + label       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Hero Section Detail:**

```tsx
// Hero background: soft gradient card
<section className="rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-teal-50/30 border border-blue-100/50 px-8 py-12 lg:px-16 lg:py-16">
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
    {/* Left: 3/5 */}
    <div className="lg:col-span-3 space-y-6">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
        AI-Powered Credit Intelligence
      </span>
      <h1 className="text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight text-foreground">
        Automate credit analysis.<br />
        Detect risk signals.<br />
        Generate explainable decisions.
      </h1>
      <p className="max-w-lg text-base text-muted-foreground leading-relaxed">
        Transform raw financial documents into auditable Credit Appraisal Memos in minutes, not weeks.
        AI-powered Five C analysis with full source attribution.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Button className="h-11 px-6 rounded-xl bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/20 hover:bg-blue-700">
          Run Credit Analysis
        </Button>
        <Button variant="outline" className="h-11 px-6 rounded-xl font-semibold">
          Upload Documents
        </Button>
      </div>
    </div>
    {/* Right: 2/5 — Illustration or abstract visual */}
    <div className="lg:col-span-2 flex items-center justify-center">
      {/* Abstract gradient orb or isometric mini-dashboard illustration */}
      <div className="h-64 w-64 rounded-3xl bg-gradient-to-br from-blue-400/20 to-teal-400/20 backdrop-blur" />
    </div>
  </div>
</section>
```

**Application Card in Grid:**

```
┌──────────────────────────────────┐
│  ABC Industries     ● Under Rev │
│  Textiles                       │
│  ─────────────────────────────  │
│  CMR Rank:          4/10 (mod)  │
│  Requested:         ₹50Cr      │
│                                  │
│  [ View Details → ]              │
└──────────────────────────────────┘
  p-6, rounded-[14px], border
  hover:shadow-sm transition
```

---

### Page 2: Applications Dashboard

**Route:** `/applications`  
**Purpose:** Searchable, filterable list of all credit applications.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ Nav                                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  H1: "Applications"                                      │
│  subtitle: "Manage and track all credit applications"    │
│  Right: [ + New Application ] button                     │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌─ Metrics ──┐  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ Total: 247 │  │ Active:38│  │ Alerts:12│  │CAMs:89│ │
│  └────────────┘  └──────────┘  └──────────┘  └───────┘ │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌─ Filter Bar ──────────────────────────────────────┐   │
│  │ [Search 🔍] [Status ▾] [Industry ▾] [Date ▾]     │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  ────────────────── spacing-4 ───────────────────────    │
│                                                          │
│  ┌─ Data Table ──────────────────────────────────────┐   │
│  │ Company │ Industry │ Amount │ CMR │ Status │ Act  │   │
│  │─────────┼──────────┼────────┼─────┼────────┼──────│   │
│  │ ABC Ind │ Textile  │ ₹50Cr  │ 4   │●Review │ ⊕    │   │
│  │ XYZ Corp│ IT       │ ₹25Cr  │ 2   │●Approv │ ⊕    │   │
│  │ ...     │          │        │     │        │      │   │
│  ├──────────────────────────────────────────────────│   │
│  │ ← 1 2 3 ... 12 →         Showing 1-20 of 247   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Filter Bar:**

```html
<div class="flex flex-wrap items-center gap-3">
  <div class="relative flex-1 min-w-[240px]">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <input class="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm
                  placeholder:text-muted-foreground focus:border-blue-300 focus:ring-2
                  focus:ring-blue-100 outline-none transition-all" placeholder="Search companies..." />
  </div>
  <select class="h-10 rounded-xl border border-border bg-card px-4 text-sm font-medium">
    <option>All Statuses</option>
    ...
  </select>
  ...
</div>
```

**Table column widths:** Company (30%) | Industry (15%) | Amount (15%) | CMR (10%) | Status (15%) | Actions (15%)

---

### Page 3: Document Upload Interface

**Route:** `/documents` or `/applications/[id]` (upload tab)  
**Purpose:** Upload financial documents for analysis.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ Nav                                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  H1: "Document Upload"                                   │
│  subtitle: "Upload loan documents for AI analysis"       │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌─ Upload Zone ─────────────────────────────────────┐   │
│  │                                                    │   │
│  │          ┌────────┐                                │   │
│  │          │  ☁️ ↑  │                                │   │
│  │          └────────┘                                │   │
│  │                                                    │   │
│  │  Drag & drop your loan documents here              │   │
│  │  or click to browse                                │   │
│  │                                                    │   │
│  │  Supported:   Bank Statements · GST Returns ·      │   │
│  │               ITR Filings · Annual Reports ·        │   │
│  │               CIBIL Reports · Sanction Letters      │   │
│  │                                                    │   │
│  │  PDF only · Max 50MB per file                      │   │
│  │                                                    │   │
│  │  [ Browse Files ]                                  │   │
│  │                                                    │   │
│  └───  border-dashed-2 border-blue-300/50 bg-blue-50/20 │
│        rounded-2xl py-16 text-center                     │
│        hover:border-blue-400 hover:bg-blue-50/40         │
│        transition-all                                    │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  H2: "Uploaded Documents" (count badge)                  │
│                                                          │
│  ┌─ Document Cards Grid (2 or 3 col) ───────────────┐   │
│  │                                                    │   │
│  │  ┌────────────────────┐  ┌────────────────────┐   │   │
│  │  │ 📄 bank_stmt.pdf   │  │ 📄 gstr3b_2025.pdf│   │   │
│  │  │ Bank Statement     │  │ GST Return         │   │   │
│  │  │ 4.2 MB             │  │ 1.8 MB             │   │   │
│  │  │ ✓ Uploaded          │  │ ● Processing       │   │   │
│  │  └────────────────────┘  └────────────────────┘   │   │
│  │                                                    │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Upload Zone (Drag State):**
- Default: `border-dashed border-2 border-slate-300 bg-slate-50/30`
- Drag over: `border-blue-400 bg-blue-50/50 ring-4 ring-blue-100/50`
- File accepted: Brief green flash `border-green-400 bg-green-50/30`

**Document Card:**

```html
<div class="flex items-center gap-4 rounded-xl border border-border bg-card p-4
            transition-all hover:shadow-sm">
  <!-- File icon: colored by doc type -->
  <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
    <FileText class="h-6 w-6 text-blue-600" />
  </div>
  <!-- Info -->
  <div class="flex-1 min-w-0">
    <p class="text-sm font-semibold text-foreground truncate">bank_statement_2025.pdf</p>
    <p class="text-xs text-muted-foreground">Bank Statement · 4.2 MB</p>
  </div>
  <!-- Status -->
  <StatusBadge status="complete" label="✓ Uploaded" />
  <!-- Actions -->
  <button class="btn-ghost"><Trash2 class="h-4 w-4" /></button>
</div>
```

---

### Page 4: AI Pipeline Analysis Page

**Route:** `/analysis` or `/applications/[id]/analysis`  
**Purpose:** Real-time visualization of the credit analysis pipeline.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ Nav                                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  H1: "Credit Analysis Pipeline"                          │
│  subtitle: "Real-time agent execution monitoring"        │
│  Right: Application selector dropdown                    │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌─ Pipeline Progress Bar (horizontal stages) ───────┐   │
│  │                                                    │   │
│  │  [✓ Ingest]──[✓ Agents]──[● Scout]──[ ]──[ ]──[ ] │   │
│  │   Done        Done      Running   Pending          │   │
│  │                                                    │   │
│  └───  Card, p-6, rounded-[14px]  ───────────────────┘   │
│                                                          │
│  ────────────────── spacing-6 ───────────────────────    │
│                                                          │
│  ┌─ Main (8 col) ─────────┬─ Sidebar (4 col) ───────┐   │
│  │                         │                          │   │
│  │  Agent Cards (2×3 grid) │  Live Status Feed        │   │
│  │                         │                          │   │
│  │  ┌── Bank ──┐ ┌── GST──┐│  ┌──────────────────┐  │   │
│  │  │ ✓ Done   │ │ ✓ Done  ││  │ 14:32 Bank ✓     │  │   │
│  │  │ conf:88% │ │ conf:85%││  │ 14:33 GST ✓      │  │   │
│  │  └──────────┘ └─────────┘│  │ 14:34 Scout ●    │  │   │
│  │                         │  │ 14:34 Analyzing..  │  │   │
│  │  ┌── ITR ──┐ ┌── CIBIL─┐│  │                    │  │   │
│  │  │ ✓ Done   │ │ ● Run   ││  └──────────────────┘  │   │
│  │  └──────────┘ └─────────┘│                          │   │
│  │                         │  ┌── AI Reasoning ────┐  │   │
│  │  ┌── Scout ──┐          │  │ (collapsible)       │  │   │
│  │  │ ● Running │          │  │ <think> traces...   │  │   │
│  │  │ 68%       │          │  │                     │  │   │
│  │  └───────────┘          │  └─────────────────────┘  │   │
│  │                         │                          │   │
│  └─────────────────────────┴──────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Pipeline Stage Component:**

```html
<div class="flex items-center gap-0">
  <!-- Stage node -->
  <div class="flex flex-col items-center gap-2">
    <div class="flex h-10 w-10 items-center justify-center rounded-full
                border-2 border-green-500 bg-green-50">
      <Check class="h-5 w-5 text-green-600" />
    </div>
    <span class="text-xs font-medium text-foreground">Ingest</span>
  </div>

  <!-- Connector line -->
  <div class="h-0.5 w-12 bg-green-400" /> <!-- completed -->
  <div class="h-0.5 w-12 bg-border" />    <!-- upcoming: gray -->
  
  <!-- Active stage use blue with pulse -->
  <div class="flex h-10 w-10 ... rounded-full border-2 border-blue-500 bg-blue-50 animate-pulse">
    <Loader2 class="h-5 w-5 text-blue-600 animate-spin" />
  </div>
</div>
```

**Live Status Feed (Sidebar):**

```html
<div class="space-y-3 max-h-[400px] overflow-y-auto">
  <div class="flex items-start gap-3">
    <div class="mt-0.5 h-2 w-2 rounded-full bg-green-400" />
    <div>
      <p class="text-xs font-semibold text-foreground">Bank Statement Agent</p>
      <p class="text-[11px] text-muted-foreground">Completed · conf: 88%</p>
    </div>
    <span class="ml-auto text-[11px] text-muted-foreground">14:32</span>
  </div>
  ...
</div>
```

---

### Page 5: Risk Analysis Dashboard

**Route:** `/analytics` or `/applications/[id]/risk`  
**Purpose:** Deep-dive into risk signals, financial comparisons, and agent outputs.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ Nav                                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  H1: "Risk Analysis"                                     │
│  subtitle: "Financial signals and risk intelligence"     │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───┐  │
│  │ Avg Bank   │  │ GST vs Bank│  │ Related    │  │OD │  │
│  │ Balance    │  │ Variance   │  │ Party %    │  │Ut%│  │
│  │ ₹48 Lakh  │  │ 39.1%  🔴  │  │ 34%   🟡  │  │94%│  │
│  └────────────┘  └────────────┘  └────────────┘  └───┘  │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌─ 8 col ─────────────────┬─ 4 col ────────────────┐   │
│  │                         │                          │   │
│  │  Monthly GST vs Bank    │  Five Cs Radar           │   │
│  │  (Bar Chart)            │  (Radar Chart)           │   │
│  │  280px height           │  300×300px               │   │
│  │                         │                          │   │
│  └─────────────────────────┴──────────────────────────┘   │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌─ Discrepancy Table (full width) ──────────────────┐   │
│  │ H3: "Cross-Document Triangulation"                 │   │
│  │ 7-check table with verdict badges                  │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌─ Research Findings ────┬─ Agent Signals ───────────┐   │
│  │ Scout agent results    │ Per-agent signal list      │   │
│  │ with source URLs       │ with confidence badges     │   │
│  └────────────────────────┴───────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Metric Card with Alert Color:**

When a metric exceeds threshold, the card tints:

```tsx
// If GST vs Bank variance > 15%, card gets red-tinted
<div className={`rounded-[14px] border p-6 ${
  variance > 30 ? 'border-red-200 bg-red-50/60' :
  variance > 15 ? 'border-amber-200 bg-amber-50/60' :
  'border-border bg-card'
}`}>
```

---

### Page 6: Five Cs Credit Evaluation Page

**Route:** `/applications/[id]/evaluation`  
**Purpose:** Detailed Five C scoring with contrastive explanations.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ Nav                                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  H1: "Credit Evaluation — ABC Industries"                │
│  subtitle: "Five Cs of Credit Analysis"                  │
│  Right: Decision badge [CONDITIONAL APPROVE] + amount    │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌─ 8 col ─────────────────┬─ 4 col ────────────────┐   │
│  │                         │                          │   │
│  │  5 × Five C Cards       │  Radar Chart             │   │
│  │  (stacked vertically,   │  (sticky, stays in view) │   │
│  │   expandable)           │                          │   │
│  │                         │  Decision Summary Card   │   │
│  │  ┌── Character ──────┐  │  ┌──────────────────┐   │   │
│  │  │ Score: 72/100     │  │  │ Decision: COND.  │   │   │
│  │  │ Rating: Adequate  │  │  │ Amount: ₹35Cr    │   │   │
│  │  │ Progress bar      │  │  │ Rate: 13.5%      │   │   │
│  │  │                   │  │  │ Conditions: 3    │   │   │
│  │  │ Supporting:       │  │  │                  │   │   │
│  │  │ • CMR 4 moderate  │  │  │ [ Download CAM   │   │   │
│  │  │ • Clean repayment │  │  │   PDF → ]        │   │   │
│  │  │                   │  │  └──────────────────┘   │   │
│  │  │ Against:          │  │                          │   │
│  │  │ • 1 court case    │  │                          │   │
│  │  │ • RPT 34%         │  │                          │   │
│  │  │                   │  │                          │   │
│  │  │ ⊕ View Reasoning  │  │                          │   │
│  │  └───────────────────┘  │                          │   │
│  │                         │                          │   │
│  │  ┌── Capacity ───────┐  │                          │   │
│  │  │ ...               │  │                          │   │
│  │  └───────────────────┘  │                          │   │
│  │  ... (Capital, etc.)    │                          │   │
│  │                         │                          │   │
│  └─────────────────────────┴──────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Five C Card (Expanded):**

```tsx
<div className="rounded-[14px] border border-border bg-card overflow-hidden">
  {/* Header with score bar */}
  <div className="flex items-center gap-4 border-b border-border p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100/80">
      <User className="h-5 w-5 text-blue-600" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Character</h3>
        <StatusBadge status={ratingToStatus(rating)} label={rating} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-blue-500" style={{ width: '72%' }} />
        </div>
        <span className="text-sm font-bold tabular-nums text-foreground">72</span>
      </div>
    </div>
  </div>
  
  {/* Body: Contrastive explanation */}
  <div className="p-5 space-y-4">
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2">
        Supporting Factors
      </h4>
      <ul className="space-y-1.5 text-sm text-foreground">
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500 flex-shrink-0" />
          <span>CMR rank 4 — moderate risk, acceptable for mid-market lending
            <SourceChip source="CIBIL Agent, conf: 0.95" />
          </span>
        </li>
        ...
      </ul>
    </div>
    
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">
        Against Factors
      </h4>
      <ul className="space-y-1.5 text-sm text-foreground">
        <li className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-red-500 flex-shrink-0" />
          <span>1 active civil court case — pending High Court
            <SourceChip source="Tavily: e-Courts" />
          </span>
        </li>
        ...
      </ul>
    </div>
    
    {/* Qualitative Impact (if notes exist) */}
    <div className="rounded-xl bg-amber-50/60 border border-amber-200/40 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
        Credit Officer Input
      </h4>
      <p className="text-sm text-foreground">
        "Promoter evasive on related-party questions during interview."
      </p>
      <p className="mt-1 text-xs font-semibold text-amber-600">
        Score adjusted: -8 points (from 80 → 72)
      </p>
    </div>
    
    {/* Expandable AI Reasoning */}
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
        <Brain className="h-4 w-4" />
        View AI Reasoning
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
          {thinkingTrace}
        </p>
      </CollapsibleContent>
    </Collapsible>
  </div>
</div>
```

**Decision Summary Card (Sidebar):**

```
┌──────────────────────────────────┐
│  OVERALL RECOMMENDATION          │
│                                  │
│  ┌────────────────────────────┐  │
│  │  CONDITIONAL APPROVE       │  │  ← Large badge, amber bg
│  └────────────────────────────┘  │
│                                  │
│  Recommended Amount:             │
│  ₹35,00,00,000      (₹35 Cr)   │  ← text-2xl font-bold
│                                  │
│  Interest Rate:                  │
│  13.5% p.a.                     │
│                                  │
│  Original Ask:                   │
│  ₹50 Cr  (−30% reduction)      │  ← text-sm text-muted
│                                  │
│  Conditions:                     │
│  • Quarterly production audit    │
│  • RPT monthly disclosure        │
│  • Promoter co-guarantee         │
│                                  │
│  ─────────────────────────────  │
│                                  │
│  [ 📥 Download CAM PDF ]        │  ← Primary button, full width
│  [ 🔄 Regenerate Analysis ]     │  ← Ghost button
│                                  │
└──────────────────────────────────┘
```

---

### Page 7: CAM Report Preview Page

**Route:** `/applications/[id]/cam`  
**Purpose:** Professional document-style preview of the Credit Appraisal Memo.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ Nav                                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ Toolbar ─────────────────────────────────────────┐   │
│  │ ← Back    "CAM — ABC Industries"    [📥 Download] │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Document Viewer (max-w-5xl mx-auto) ─────────────┐   │
│  │                                                    │   │
│  │  ┌─ Executive Summary ────────────────────────┐   │   │
│  │  │ Decision badge, company info, 5C summary   │   │   │
│  │  │ Mini radar chart, recommended terms        │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  ┌─ Five Cs Analysis ─────────────────────────┐   │   │
│  │  │ Per-C sections with explanations           │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  ┌─ Financial Summary ────────────────────────┐   │   │
│  │  │ Key financial metrics table                │   │   │
│  │  │ Monthly GST vs Bank chart                  │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  ┌─ Risk Flags & Discrepancies ───────────────┐   │   │
│  │  │ 7-check table                              │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  ┌─ Research Intelligence ────────────────────┐   │   │
│  │  │ Scout findings with source URLs            │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  ┌─ Credit Officer Notes ─────────────────────┐   │   │
│  │  │ Field observations by category             │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  ┌─ Loan Recommendation ──────────────────────┐   │   │
│  │  │ Amount, rate, conditions, rationale         │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  ┌─ AI Reasoning Trace ───────────────────────┐   │   │
│  │  │ Collapsible thinking chain                 │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  └───── bg-card, shadow-lg, rounded-2xl, p-8-12 ────┘   │
│         (document appearance)                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Document Container:**

```html
<!-- Paper-like appearance -->
<div class="mx-auto max-w-5xl rounded-2xl border border-border bg-card shadow-lg">
  <div class="px-10 py-12 lg:px-16 lg:py-16">
    {/* ... sections ... */}
  </div>
</div>
```

**Section Dividers:**

```html
<div class="my-10 border-t border-border" />
```

Each CAM section uses consistent heading pattern:

```html
<div class="mb-6">
  <h2 class="text-xl font-semibold text-foreground">Five Cs Credit Analysis</h2>
  <p class="mt-1 text-sm text-muted-foreground">Scoring based on automated analysis and officer observations</p>
</div>
```

---

### Page 8: Research Intelligence Page

**Route:** `/applications/[id]/research` or tab within analysis  
**Purpose:** Timeline of all OSINT findings from Scout Agent.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ Nav                                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  H1: "Research Intelligence"                             │
│  subtitle: "Secondary research and OSINT findings"       │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───┐  │
│  │ Litigation │  │ Credit     │  │ Negative   │  │MCA│  │
│  │ Findings   │  │ Ratings    │  │ News       │  │Dir│  │
│  │ 3          │  │ BB-        │  │ 0          │  │ 4 │  │
│  │ 🟡 Moderate│  │ 🟡 Below IG│  │ 🟢 Clean   │  │   │  │
│  └────────────┘  └────────────┘  └────────────┘  └───┘  │
│                                                          │
│  ────────────────── spacing-8 ───────────────────────    │
│                                                          │
│  ┌─ Timeline (full width) ───────────────────────────┐   │
│  │                                                    │   │
│  │  ┌─ Mar 10 ────────────────────────────────────┐  │   │
│  │  │                                              │  │   │
│  │  │  🔴 e-Courts: NCLT Case No. 123/2024        │  │   │
│  │  │     Civil dispute with supplier XYZ Pvt Ltd  │  │   │
│  │  │     Status: Pending — High Court             │  │   │
│  │  │     [Source: ecourts.gov.in ↗]               │  │   │
│  │  │                                              │  │   │
│  │  │  🟡 Credit Ratings: CRISIL BB- (Stable)     │  │   │
│  │  │     Assigned July 2025                       │  │   │
│  │  │     Note: Below investment grade             │  │   │
│  │  │     [Source: crisil.com ↗]                   │  │   │
│  │  │                                              │  │   │
│  │  │  🟢 MCA: Director DIN 01234567              │  │   │
│  │  │     4 associated companies — all active      │  │   │
│  │  │     No struck-off entities found             │  │   │
│  │  │     [Source: mca.gov.in ↗]                   │  │   │
│  │  │                                              │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                    │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Timeline Item:**

```tsx
function ResearchItem({ finding }) {
  const severityStyles = {
    high:    'border-l-red-400 bg-red-50/40',
    medium:  'border-l-amber-400 bg-amber-50/40',
    low:     'border-l-green-400 bg-green-50/40',
    neutral: 'border-l-slate-300 bg-slate-50/40',
  };

  return (
    <div className={`rounded-xl border-l-4 p-4 ${severityStyles[severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <ResearchTypeIcon type={finding.searchType} />
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        {finding.isFraudSignal && (
          <StatusBadge status="risk_flag" label="Fraud Signal" />
        )}
      </div>
      <p className="mt-2 text-sm text-foreground">{finding.snippet}</p>
      {finding.sourceUrl && (
        <a href={finding.sourceUrl} target="_blank" rel="noopener"
           className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
          Source ↗
        </a>
      )}
    </div>
  );
}
```

---

### Page 9: Login Page

**Route:** `/login`  
**Purpose:** Authentication screen.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Full screen, centered                                   │
│  bg-gradient-to-br from-slate-50 to-blue-50/30          │
│                                                          │
│           ┌────────────────────────────────┐              │
│           │                                │              │
│           │  ◉ Credit Intel                │              │
│           │                                │              │
│           │  Welcome back                  │              │
│           │  Sign in to your account       │              │
│           │                                │              │
│           │  Email                         │              │
│           │  ┌────────────────────────┐    │              │
│           │  │                        │    │              │
│           │  └────────────────────────┘    │              │
│           │                                │              │
│           │  Password                      │              │
│           │  ┌────────────────────────┐    │              │
│           │  │                        │    │              │
│           │  └────────────────────────┘    │              │
│           │                                │              │
│           │  [ Sign In ]  (full-width)     │              │
│           │                                │              │
│           │  Don't have an account?        │              │
│           │  Contact your administrator.   │              │
│           │                                │              │
│           └────────────────────────────────┘              │
│            max-w-md, bg-card, shadow-lg                   │
│            rounded-2xl, p-8                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### Page 10: Settings Page

**Route:** `/settings`  
**Purpose:** System configuration, API key management, notification preferences.

**Layout:**

```
max-w-4xl centered container.

Sections in stacked cards:
1. Profile Settings (name, email, role)
2. Notification Preferences (toggles)
3. API Configuration (keys with masked values)
4. Data Export (buttons to export audit logs, applications)

Each section is a Card with:
  H3 title
  Divider
  Form fields in 2-column grid
  Save button at bottom-right
```

---

## 11. Responsive Strategy

### Breakpoint System

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| `sm` | 640px | 2-column grids |
| `md` | 768px | Sidebar visible |
| `lg` | 1024px | 3-4 column grids, full nav |
| `xl` | 1280px | Max container width active |

### Mobile Adaptations

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Nav | Horizontal links | Hamburger menu / Sheet |
| Metric cards | 4-column grid | 2-column, stacked |
| Data table | Full table | Cards or horizontal scroll |
| Pipeline stages | Horizontal | Vertical timeline |
| 5C cards + radar | Side-by-side 8/4 split | Stacked, radar on top |
| CAM viewer | Wide document | Full-width with smaller padding |
| Agent cards | 2×3 grid | Single column |

### Touch Targets

All interactive elements minimum **44×44px** touch area on mobile.
- Buttons: `h-11` minimum on mobile
- Table rows: `py-4` minimum
- Nav items: `py-3` minimum

---

## 12. Implementation Reference

### 12.1 File Changes Required

```
Files to MODIFY:
  app/globals.css              — Replace CSS variables with new color system
  styles/globals.css           — Mirror changes from app/globals.css
  app/layout.tsx               — Add Inter font import
  app/page.tsx                 — Redesign dashboard home
  app/applications/page.tsx    — Redesign applications list
  app/documents/page.tsx       — Redesign document upload
  app/analysis/page.tsx        — Redesign pipeline view
  app/analytics/page.tsx       — Redesign risk analytics
  app/audit/page.tsx           — Redesign audit log
  app/login/page.tsx           — Redesign login
  app/settings/page.tsx        — Redesign settings
  components/layout/main-nav.tsx               — Redesign navigation
  components/dashboard/overview-cards.tsx       — New metric card design
  components/tables/applications-table.tsx      — New table design
  components/forms/document-uploader.tsx        — New upload zone
  components/agent/agent-activity-feed.tsx      — New agent cards
  components/agent/explainability.tsx           — New 5C cards
  components/analysis/analysis-dashboard.tsx    — New analysis layout
  components/memo/credit-memo-viewer.tsx        — New CAM preview
  components/assessment/risk-assessment.tsx     — New risk display
  components/ui/button.tsx     — Adjust sizes & radius
  components/ui/card.tsx       — Adjust radius to 14px
  components/ui/badge.tsx      — New status badge styles

Files to CREATE:
  components/ui/metric-card.tsx      — Reusable metric display
  components/ui/status-badge.tsx     — Semantic status badges
  components/ui/confidence-badge.tsx — AI confidence display
  components/ui/source-chip.tsx      — Data source attribution
  components/ui/empty-state.tsx      — No-data placeholder
  components/ui/pipeline-stages.tsx  — Horizontal pipeline viz
  components/ui/agent-card.tsx       — Individual agent status
  components/ui/five-c-card.tsx      — Five C evaluation card
  components/ui/research-item.tsx    — Research finding timeline item
  components/charts/five-cs-radar.tsx     — Radar chart wrapper
  components/charts/gst-bank-bar.tsx      — Bar chart wrapper
  components/charts/financial-trend.tsx   — Line chart wrapper
```

### 12.2 Font Installation

In `app/layout.tsx`, add Google Fonts import:

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

// In body tag:
<body className={`${inter.variable} font-sans antialiased`}>
```

Update the `@theme` block in `globals.css`:
```css
--font-sans: var(--font-inter), 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
```

### 12.3 Border Radius Global Change

In `globals.css`:
```css
--radius: 0.875rem;  /* 14px — up from current 10px */
```

This automatically cascades to all shadcn components via:
```css
--radius-sm: calc(var(--radius) - 4px);   /* 10px */
--radius-md: calc(var(--radius) - 2px);   /* 12px */
--radius-lg: var(--radius);                /* 14px */
--radius-xl: calc(var(--radius) + 4px);    /* 18px */
```

---

## 13. Do's & Don'ts

### ✅ Do

- **Use white cards on off-white background.** The contrast layer defines the visual hierarchy.
- **Left-align everything** except empty state content. No centered page titles.
- **Use `tabular-nums`** for all financial figures. Numbers must align vertically.
- **Show confidence scores** next to every AI-generated data point.
- **Use consistent badge colors** — green=good, amber=watch, red=risk. Always.
- **Use `gap-5`** between cards in a grid, `gap-3` within card content.
- **Keep hero sections subtle** — soft gradient, not bold neon.
- **Include empty states** for every list/table that could be empty.
- **Use semantic HTML** — `<main>`, `<section>`, `<nav>`, `<table>`.
- **Test with real data** — design for ₹12,34,56,789 and "Sundry Debtors Ageing Analysis", not "Lorem ipsum".

### ❌ Don't

- **Don't use dark backgrounds** for main content areas. This is a daytime banking tool.
- **Don't use more than 2 accent colors per page.** Brand blue + one semantic color max.
- **Don't use random icon colors.** Icons follow the semantic icon container pattern.
- **Don't make cards narrower than 240px.** Financial data needs width.
- **Don't use text smaller than 11px.** Even footnotes must be readable.
- **Don't center-align data tables.** They must be left-aligned.
- **Don't add borders AND shadows to cards.** Use one or the other. Default: border only.
- **Don't animate data.** Charts should render fully, not animate in (distracting for analysis).
- **Don't use red for non-risk elements.** Red = danger/risk ONLY.
- **Don't show technical field names** to users. "pipeline_status" → "Pipeline Status". "cmr_rank" → "CMR Rank".
- **Don't use gradient text.** Solid colors only.
- **Don't put more than 4 metrics in a single row.** 5 is the absolute max at `lg` breakpoint.
- **Don't make buttons smaller than `h-9`.** Primary CTAs: `h-10` or `h-11`.
- **Don't use light gray text on light gray background.** Maintain WCAG AA (4.5:1) contrast ratio for all text.

---

## Appendix A: Quick Color Reference Card

```
Page BG:          #F8FAFC    (Surface)
Card BG:          #FFFFFF    (White)
Card Border:      #E2E8F0    (Slate 200)
Primary Blue:     #2563EB    (CTA buttons, active nav, links)
Deep Navy:        #1E3A5F    (Logo, headings if needed)
Body Text:        #0F172A    (Ink — near black)
Secondary Text:   #64748B    (Slate 500 — captions, labels)
Success:          #16A34A bg #F0FDF4
Warning:          #D97706 bg #FFFBEB
Danger:           #DC2626 bg #FEF2F2
Info/Active:      #2563EB bg #EFF6FF
Teal Accent:      #0D9488 bg #CCFBF1
Purple/AI:        #7C3AED bg #F5F3FF
```

---

## Appendix B: Component Checklist

When redesigning each page, ensure these components are used consistently:

- [ ] **Page wrapper:** `bg-background min-h-screen`
- [ ] **Container:** `max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12`
- [ ] **Page header:** H1 left, actions right, subtitle below H1
- [ ] **Section spacing:** `mt-10` between major sections
- [ ] **Card grid:** `gap-5` with correct column count
- [ ] **All cards:** `rounded-[14px] border border-border bg-card p-6`
- [ ] **Status badges:** Consistent color mapping, always with dot indicator
- [ ] **Loading states:** Skeletons for cards, spinner for actions
- [ ] **Empty states:** Icon + title + description + CTA
- [ ] **Table headers:** Uppercase, small, muted, tracking-wider
- [ ] **Interactive hover:** `transition-all hover:shadow-sm` on clickable cards
- [ ] **Confidence badges:** On every AI-generated value
- [ ] **Source chips:** On every extracted data point
- [ ] **Financial formatting:** ₹ symbol, `toLocaleString('en-IN')`, `tabular-nums`

---

**END OF DESIGN SYSTEM**

*This document should be referenced when redesigning any page or component. Every design decision must trace back to a specification in this document.*
