scrpt UI# Commando AI - UI Style Guide

> **Reference Pages:**
> - Connections: `http://localhost:3000/connections`
> - Meet Home: `http://localhost:3000/dashboard/meet-home`
> - Workflow Editor: `http://localhost:3000/workflows/editor/[id]`

> **⚠️ CRITICAL DESIGN PRINCIPLE:**  
> **Commando AI uses a STRICT MONOCHROMATIC design.** Use ONLY grayscale colors (black, white, gray). NO red, green, blue, yellow, or any other colors. Rely on typography, spacing, and opacity for visual hierarchy instead of color.

This document captures the consistent UI patterns, spacing, typography, and component styles used across Commando AI to ensure professional and cohesive design.

---

## 📐 Layout Structure

### Page Container Pattern
```tsx
<div className="flex flex-col">
  {/* Sticky header */}
  <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
    Page Title
  </h1>
  
  {/* Main content */}
  <div className="relative flex flex-col gap-4">
    <section className="flex flex-col gap-4 p-6 text-muted-foreground">
      {/* Content here */}
    </section>
  </div>
</div>
```

**Key Characteristics:**
- **Sticky headers** with `sticky top-0 z-[10]`
- **Backdrop blur** for modern glassmorphism effect: `bg-background/50 backdrop-blur-lg`
- **Border bottom** on headers: `border-b`
- **Consistent padding**: `p-6` for major sections
- **Gap spacing**: `gap-4` for vertical stacking

### Full-Screen Layout (Meet Home Pattern)
```tsx
<main className="flex min-h-screen flex-col bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-12">
  <div className="mx-auto w-full max-w-6xl">
    {/* Content */}
  </div>
</main>
```

**Key Characteristics:**
- **Responsive padding**: `px-4 py-8 md:px-8 lg:px-12`
- **Max width container**: `max-w-6xl` centered with `mx-auto`
- **Explicit background**: `bg-[#0A0A0A]` (near-black)
- **Full viewport height**: `min-h-screen`

---

## 🎨 Color Palette

### Background Colors
```css
/* Primary backgrounds */
bg-[#0A0A0A]      /* Near-black, main background */
bg-[#111111]      /* Dark cards/inputs */
bg-[#161616]      /* Hover state for dark cards */
bg-background     /* CSS variable (typically #0a0a0a) */
bg-background/50  /* Semi-transparent for glassmorphism */

/* Borders */
border-[#222222]  /* Subtle borders on dark UI */
border-b          /* Uses CSS variable --border */
```

### Text Colors
```css
text-white              /* Primary text on dark backgrounds */
text-foreground         /* CSS variable for main text */
text-muted-foreground   /* Secondary/descriptive text */
text-gray-400           /* Placeholder and secondary content */
text-gray-300           /* Labels and metadata */
text-neutral-500        /* Inactive states */
```

### Status Colors (⚠️ DEPRECATED - DO NOT USE)

> **WARNING**: The following color patterns are **LEGACY ONLY** and should **NOT** be used in new components. See **Color Discipline & Design Philosophy** section below for the correct monochromatic approach.

```css
/* ❌ DEPRECATED - Use monochromatic variants instead */

/* Success/Connected */
border-green-500 bg-green-500/10 text-green-500  /* DON'T USE */

/* Warning */
border-yellow-500/50 bg-yellow-500/10 text-yellow-500  /* DON'T USE */

/* Error/Destructive */
text-red-500 hover:text-red-500  /* DON'T USE */

/* Primary Action */
bg-primary text-primary-foreground  /* DON'T USE - Use bg-white instead */
```

---

## 🎨 Color Discipline & Design Philosophy

### **Core Principle: Monochromatic Simplicity**

Commando AI follows a **strict monochromatic design philosophy** to maintain visual simplicity, reduce cognitive load, and create a professional, distraction-free interface.

### Color Usage Rules

**✅ DO:**
- Use shades of **gray scale only**: `#0A0A0A`, `#111111`, `#161616`, `#222222`, `text-gray-400`, `text-gray-300`
- Use **white/foreground** for text: `text-white`, `text-foreground`
- Use **subtle opacity variations**: `bg-white/5`, `bg-white/10` for depth
- Rely on **spacing, typography, and borders** for visual hierarchy
- Use **shadows sparingly**: `shadow-sm` for subtle elevation

**❌ DON'T:**
- ❌ **No red** for errors or warnings
- ❌ **No green** for success states
- ❌ **No blue** for links or primary actions
- ❌ **No yellow** for alerts
- ❌ **No purple, orange, or any accent colors**
- ❌ Avoid colorful badges, buttons, or status indicators
- ❌ No multi-colored charts or graphs

### Exception: External Brand Colors Only
The **ONLY** acceptable use of color is for:
- External service logos (Slack, Google, Notion, Discord) - displayed as-is
- User-uploaded avatars and profile images
- OAuth provider branding (required by platform guidelines)

### Implementation Examples

#### ✅ Correct - Monochromatic Status Indicators
```tsx
{/* Success/Completed - Use subtle contrast only */}
<div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
  Completed
</div>

{/* Warning/Alert - Use emphasis through opacity */}
<div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold">
  ⚠ Attention Required
</div>

{/* Error - Use typography weight, not color */}
<div className="rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-sm font-bold">
  ✗ Action Failed
</div>
```

#### ❌ Wrong - Multi-color Approach
```tsx
{/* NEVER use these colored variants */}
<Badge className="bg-green-500 text-white">Success</Badge>
<Badge className="bg-red-500 text-white">Error</Badge>
<Badge className="bg-yellow-500 text-black">Warning</Badge>
<Button className="bg-blue-500">Primary Action</Button>
```

### Visual Hierarchy Without Color

Use these techniques instead of color to create hierarchy:

1. **Typography Weight**
   - `font-light` (300) - Low emphasis
   - `font-normal` (400) - Default
   - `font-medium` (500) - Medium emphasis
   - `font-semibold` (600) - High emphasis
   - `font-bold` (700) - Critical emphasis

2. **Size Contrast**
   - `text-xs` vs `text-4xl` for importance hierarchy
   - `h-8 w-8` vs `h-12 w-12` for icon prominence

3. **Opacity Levels**
   - `text-white/40` - Disabled/inactive
   - `text-white/60` - Secondary information
   - `text-white/80` - Body text
   - `text-white` - Primary content
   - `font-bold text-white` - Critical information

4. **Border Thickness**
   - `border` (1px) - Standard
   - `border-2` - Emphasis
   - `border-[3px]` - High focus

5. **Spacing & Whitespace**
   - More `padding` and `gap` = higher importance
   - `mb-8` vs `mb-2` to separate sections by priority

6. **Background Contrast**
   - `bg-[#0A0A0A]` - Page background
   - `bg-[#111111]` - Card/elevated surface
   - `bg-[#161616]` - Hover/active state
   - `bg-white/5` - Subtle highlight

### Status Representation Examples

```tsx
{/* Connection Status - Without color */}
<div className="flex items-center gap-2">
  <div className="h-2 w-2 rounded-full bg-white" /> {/* Active indicator */}
  <span className="text-sm font-medium">Connected</span>
</div>

<div className="flex items-center gap-2">
  <div className="h-2 w-2 rounded-full bg-white/20" /> {/* Inactive indicator */}
  <span className="text-sm text-white/40">Disconnected</span>
</div>

{/* Priority Levels - Without color */}
<Badge className="border border-white/30 bg-white/15 font-bold">Critical</Badge>
<Badge className="border border-white/20 bg-white/10 font-semibold">High</Badge>
<Badge className="border border-white/10 bg-white/5 font-medium">Medium</Badge>
<Badge className="border border-white/5 font-normal">Low</Badge>

{/* Progress States - Without color */}
<div className="space-y-1">
  <div className="flex items-center justify-between">
    <span className="text-sm">Progress</span>
    <span className="text-sm font-bold">75%</span>
  </div>
  <div className="h-2 w-full rounded-full bg-white/10">
    <div className="h-full w-3/4 rounded-full bg-white" />
  </div>
</div>
```

### Icons & Symbols for Meaning

Replace color-coding with universally recognized symbols:

```tsx
{/* Instead of red error badge */}
<span className="text-sm">✗ Error</span>

{/* Instead of green success badge */}
<span className="text-sm">✓ Success</span>

{/* Instead of yellow warning badge */}
<span className="text-sm">⚠ Warning</span>

{/* Instead of blue info badge */}
<span className="text-sm">ℹ Information</span>
```

### Benefits of Monochromatic Design

1. **Reduced Visual Noise** - Users focus on content, not colors
2. **Accessibility** - No reliance on color perception
3. **Professional Aesthetic** - Timeless, sophisticated appearance
4. **Consistency** - No debates about color palette or combinations
5. **Performance** - Simpler CSS, fewer style variations
6. **Brand Flexibility** - Works in any lighting condition or display

---

## 📝 Typography System

### Heading Hierarchy
```tsx
/* Page Titles (H1) - Sticky Headers */
className="text-4xl"  // 36px - Main page titles

/* Large Headings (H1) - Hero sections */
className="text-4xl font-medium leading-tight md:text-5xl"
// 36px → 48px responsive
// font-weight: 500
// tight line-height

/* Section Titles (H2) */
className="text-2xl font-semibold"  // 24px

/* Subsection Titles (H3) */
className="text-xl font-bold"       // 20px

/* Card Titles */
className="text-lg"                 // 18px (ConnectionCard)

/* Small Headings */
className="text-base font-medium"   // 16px
```

### Body Text
```tsx
/* Standard body */
className="text-base"  // 16px (default)

/* Large body text */
className="text-lg text-gray-400"  // 18px for subtitles

/* Small text */
className="text-sm"                 // 14px
className="text-sm text-gray-400"   // 14px secondary

/* Extra small */
className="text-xs"                 // 12px
className="text-[10px]"            // 10px for micro text
```

### Font Weights
```css
font-medium     /* 500 - Headings */
font-semibold   /* 600 - Section titles */
font-bold       /* 700 - Emphasis */
font-light      /* 300 - Secondary labels */
```

---

## 🎴 Card Components

### Standard Card Pattern (Connections)
```tsx
<Card className="flex w-full items-center justify-between">
  <CardHeader className="flex flex-col gap-4">
    <div className="flex flex-row gap-2">
      <Image src={icon} alt={title} height={30} width={30} className="object-contain" />
    </div>
    <div>
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </div>
  </CardHeader>
  <div className="flex flex-col items-center gap-2 p-4">
    {/* Actions */}
  </div>
</Card>
```

**Key Characteristics:**
- **Horizontal layout**: `flex items-center justify-between`
- **Left side**: Icon + Title + Description
- **Right side**: Actions (buttons, badges)
- **Gap spacing**: `gap-4` within CardHeader, `gap-2` for smaller groupings
- **Icon size**: `30x30` for service icons
- **Padding**: `p-4` for action areas

### Feature Card Pattern (Meet Home)
```tsx
<Button
  variant="outline"
  className="flex h-[140px] flex-col items-center justify-center gap-4 rounded-lg border-[#222222] bg-[#111111] p-6 hover:bg-[#161616]"
>
  <IconComponent className="h-8 w-8 text-gray-400" />
  <div className="text-center">
    <p className="text-sm text-gray-400">Feature description</p>
  </div>
</Button>
```

**Key Characteristics:**
- **Fixed height**: `h-[140px]` for consistency
- **Vertical centering**: `flex-col items-center justify-center`
- **Icon size**: `h-8 w-8` (32x32)
- **Dark background**: `bg-[#111111]` with hover `hover:bg-[#161616]`
- **Custom borders**: `border-[#222222]`
- **Internal spacing**: `gap-4` between icon and text
- **Button as card**: Uses `Button` component with `variant="outline"`

### Grid Layout for Cards
```tsx
{/* 3-column grid for feature cards */}
<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
  {/* Cards */}
</div>

{/* 4-column grid for dashboards */}
<div className="grid gap-6 md:grid-cols-4">
  {/* Cards */}
</div>
```

---

## 🔘 Button Styles

### Primary Action Buttons
```tsx
{/* Monochromatic primary button - White on dark */}
<Button className="bg-white text-black hover:bg-white/90">
  Action
</Button>

{/* Primary with icon */}
<Button size="lg" className="flex items-center gap-2 bg-white text-black hover:bg-white/90">
  <Icon className="h-5 w-5" />
  Primary Action
</Button>
```

### Secondary/Ghost Buttons
```tsx
{/* Ghost variant - Transparent with subtle hover */}
<Button variant="ghost" className="text-white hover:bg-white/10">
  Secondary
</Button>

{/* Outline variant - Border only */}
<Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
  Outlined
</Button>
```

### Small Action Buttons
```tsx
{/* Small ghost button - No destructive colors */}
<Button
  variant="ghost"
  size="sm"
  className="text-xs text-white/60 hover:bg-white/10 hover:text-white"
>
  <X className="mr-1 h-3 w-3" />
  Remove
</Button>
```

### Status Representations (No Color)
```tsx
{/* Connected status - Use opacity and weight */}
<div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
  <div className="h-2 w-2 rounded-full bg-white" />
  <span className="text-sm font-semibold">Active</span>
</div>

{/* Disconnected status */}
<div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
  <div className="h-2 w-2 rounded-full bg-white/30" />
  <span className="text-sm text-white/60">Inactive</span>
</div>
```

**Button Icon Sizes:**
- Standard: `h-5 w-5` (20x20)
- Small: `h-3 w-3` (12x12)
- Medium: `h-4 w-4` (16x16)

---

## ⌨️ Input Components

### Standard Input with Dark Theme
```tsx
<Input
  placeholder="Enter a code or link"
  className="border-none bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-0"
/>
```

### Input with Custom Background
```tsx
<Input
  placeholder="Enter meeting link"
  className="border-gray-800 bg-[#1a1a1a] focus-visible:ring-gray-200"
/>
```

### Composite Input (Search/Join pattern)
```tsx
<div className="flex flex-1 items-center gap-2 rounded-lg bg-[#111111] p-2 md:max-w-md">
  <LinkIcon className="ml-2 h-5 w-5 text-gray-400" />
  <Input
    placeholder="Enter a code or link"
    className="border-none bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-0"
  />
  <Button variant="ghost" className="text-white hover:bg-gray-50">
    Join
  </Button>
</div>
```

**Key Characteristics:**
- **Container**: `rounded-lg bg-[#111111] p-2` wraps icon + input + button
- **Input**: Transparent background, no border
- **Icons**: `h-5 w-5 text-gray-400`
- **Spacing**: `gap-2` between elements

### Textarea
```tsx
<Textarea
  className="border-[#222222] bg-[#111111] focus-visible:ring-blue-500"
  placeholder="Add meeting description"
/>
```

---

## 📏 Spacing System

### Gap Spacing
```css
gap-1   /* 0.25rem = 4px  - Very tight */
gap-2   /* 0.5rem  = 8px  - Tight groupings */
gap-4   /* 1rem    = 16px - Standard spacing */
gap-6   /* 1.5rem  = 24px - Section spacing */
```

### Padding Scale
```css
p-2     /* 0.5rem  = 8px  - Tight padding */
p-4     /* 1rem    = 16px - Standard padding */
p-6     /* 1.5rem  = 24px - Section padding */
px-3 py-2  /* Compact badges/pills */
```

### Margin Scale
```css
mb-4    /* margin-bottom: 1rem */
mb-12   /* margin-bottom: 3rem - Large section separation */
mt-4    /* margin-top: 1rem */
mx-auto /* Horizontal centering */
```

### Responsive Spacing
```tsx
{/* Responsive padding */}
className="px-4 py-8 md:px-8 lg:px-12"

{/* Responsive gaps */}
className="gap-4"  // Consistent across breakpoints

{/* Responsive margins */}
className="mb-4 md:mb-8 lg:mb-12"
```

---

## 🎭 Common UI Patterns

### Status Indicators (Monochromatic Only)

#### Active/Connected State
```tsx
<div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold">
  <div className="h-2 w-2 rounded-full bg-white" />
  Connected
</div>
```

#### Inactive/Disconnected State
```tsx
<div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
  <div className="h-2 w-2 rounded-full bg-white/30" />
  Disconnected
</div>
```

#### Loading State
```tsx
{isLoading ? (
  <div className="flex items-center gap-2 text-sm text-white/60">
    <Loader2 className="h-4 w-4 animate-spin" />
    Loading...
  </div>
) : (
  <Content />
)}
```

#### Alert/Warning (No Color)
```tsx
<div className="flex items-start gap-3 rounded-lg border border-white/30 bg-white/15 p-4">
  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
  <div>
    <p className="text-sm font-semibold">Attention Required</p>
    <p className="text-xs text-white/70">
      Important message that needs user attention
    </p>
  </div>
</div>
```

#### Success/Completion (No Color)
```tsx
<div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
  <CheckCircle className="h-4 w-4" />
  <span className="text-sm font-medium">Action Completed</span>
</div>
```

#### Error State (No Color)
```tsx
<div className="flex items-start gap-3 rounded-lg border-2 border-white/40 bg-white/20 p-4">
  <XCircle className="h-5 w-5 flex-shrink-0" />
  <div>
    <p className="text-sm font-bold">Operation Failed</p>
    <p className="text-xs text-white/70">
      Error message with details
    </p>
  </div>
</div>
```

### Hero Section (Meet Home Pattern)
```tsx
<div className="mb-12 max-w-2xl">
  <h1 className="mb-4 text-4xl font-medium leading-tight md:text-5xl">
    Video calls and meetings for everyone
  </h1>
  <p className="text-lg text-gray-400">
    Connect, collaborate and celebrate from anywhere with Fuzzie Meet
  </p>
</div>
```

**Key Characteristics:**
- **Max width**: `max-w-2xl` for readability
- **Bottom margin**: `mb-12` (3rem) for separation
- **Heading margin**: `mb-4` between heading and subtitle
- **Large responsive text**: `text-4xl md:text-5xl`
- **Subtitle**: `text-lg text-gray-400`

### Icon + Text Combo
```tsx
<Button className="flex items-center gap-2">
  <Icon className="h-5 w-5" />
  Button Text
</Button>

{/* Smaller variant */}
<span className="flex items-center gap-1">
  <Icon className="h-3 w-3" />
  <span className="text-xs">Text</span>
</span>
```

### Feature Grid
```tsx
{/* 3-column responsive grid */}
<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
  {features.map(feature => (
    <FeatureCard key={feature.id} {...feature} />
  ))}
</div>
```

---

## 🎯 Workflow Editor Specific Patterns

### Toolbar Pattern
```tsx
<div className="flex items-center justify-between border-b bg-background p-4">
  {/* Left: Tool icons */}
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="icon">
      <Icon className="h-4 w-4" />
    </Button>
  </div>
  
  {/* Center: Primary actions */}
  <div className="flex items-center gap-2">
    <Button variant="outline">Action</Button>
  </div>
  
  {/* Right: Status & save */}
  <div className="flex items-center gap-2">
    <span className="text-sm text-green-500">Saved</span>
    <Button>Publish</Button>
  </div>
</div>
```

### Sidebar Panel
```tsx
<div className="flex h-full flex-col border-l bg-background">
  {/* Header with tabs */}
  <div className="border-b p-4">
    <div className="flex gap-2">
      <Button variant="ghost" size="sm">Actions</Button>
      <Button variant="ghost" size="sm">Settings</Button>
    </div>
  </div>
  
  {/* Content area */}
  <div className="flex-1 overflow-y-auto p-4">
    {/* Scrollable content */}
  </div>
</div>
```

---

## 📱 Responsive Design Patterns

### Breakpoint Usage
```tsx
{/* Mobile-first approach */}
className="grid-cols-1 md:grid-cols-3"        // 1 col → 3 cols
className="text-4xl md:text-5xl"              // 36px → 48px
className="px-4 md:px-8 lg:px-12"            // 16px → 32px → 48px
className="gap-4"                             // Consistent gap
className="flex-col md:flex-row"             // Stack → horizontal
```

### Common Breakpoints
- `md:` - 768px and up (tablet)
- `lg:` - 1024px and up (desktop)
- `xl:` - 1280px and up (large desktop)

---

## ✅ Implementation Checklist

When creating or updating a page, ensure:

- [ ] **Dark theme**: Use `bg-[#0A0A0A]` or `bg-background`
- [ ] **Sticky header**: `sticky top-0 z-[10] border-b bg-background/50 backdrop-blur-lg`
- [ ] **Typography hierarchy**: `text-4xl` for page titles, `text-lg` for card titles
- [ ] **Consistent spacing**: `gap-4` for sections, `p-6` for major containers
- [ ] **Card borders**: Use subtle `border` with `rounded-lg`
- [ ] **Button icons**: `h-5 w-5` for standard, `h-3 w-3` for small
- [ ] **Monochromatic only**: NO red, green, blue, yellow, or any colors (except external logos)
- [ ] **Status representation**: Use opacity, weight, borders - NOT color
- [ ] **Visual hierarchy**: Rely on typography, spacing, and opacity - NOT color
- [ ] **Responsive**: Mobile-first with `md:` and `lg:` breakpoints
- [ ] **Loading states**: Show `Loader2` with `animate-spin`
- [ ] **Muted text**: Use `text-white/60` or `text-white/40` for secondary content
- [ ] **Icons for meaning**: Use ✓, ✗, ⚠, ℹ symbols instead of color coding

---

## 🎨 Quick Reference

### Page Header
```tsx
<h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
  Page Title
</h1>
```

### Section Container
```tsx
<section className="flex flex-col gap-4 p-6 text-muted-foreground">
  {/* Content */}
</section>
```

### Card
```tsx
<Card className="flex w-full items-center justify-between">
  <CardHeader className="flex flex-col gap-4">
    <CardTitle className="text-lg">Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
</Card>
```

### Button
```tsx
<Button size="lg" className="flex items-center gap-2 bg-white hover:bg-gray-50">
  <Icon className="h-5 w-5" />
  Action
</Button>
```

### Input Group
```tsx
<div className="flex items-center gap-2 rounded-lg bg-[#111111] p-2">
  <Icon className="h-5 w-5 text-gray-400" />
  <Input className="border-none bg-transparent" />
</div>
```

### Grid
```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Status Indicator (Monochromatic)
```tsx
<div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
  <div className="h-2 w-2 rounded-full bg-white" />
  <span className="text-sm font-semibold">Active</span>
</div>
```

### Alert/Message (No Color)
```tsx
<div className="flex items-start gap-3 rounded-lg border border-white/30 bg-white/15 p-4">
  <AlertTriangle className="h-5 w-5" />
  <div>
    <p className="text-sm font-semibold">Important Notice</p>
    <p className="text-xs text-white/70">Message content</p>
  </div>
</div>
```

---

## 🔗 Related Documentation

- [Copilot Instructions](.github/copilot-instructions.md) - General architecture and coding patterns
- [shadcn/ui Components](https://ui.shadcn.com/) - Component library reference
- [Tailwind CSS Docs](https://tailwindcss.com/docs) - Utility class reference

---

**Last Updated:** Based on analysis of Connections, Meet Home, and Workflow Editor pages
**Maintained by:** Development Team
**Purpose:** Ensure consistent, professional UI across all Commando AI pages
