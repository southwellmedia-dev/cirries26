# Cirries Subpage Developer Guide

A comprehensive guide for developers and AI agents to quickly build consistent subpages following the established INO (Intelligent Network Observability) patterns.

---

## Table of Contents

1. [Quick Start Checklist](#quick-start-checklist)
2. [Folder Structure](#folder-structure)
3. [Page Architecture](#page-architecture)
4. [Section Deep Dives](#section-deep-dives)
5. [Design System Reference](#design-system-reference)
6. [Animation Patterns](#animation-patterns)
7. [Props & Customization](#props--customization)
8. [Responsive Breakpoints](#responsive-breakpoints)
9. [Common Patterns](#common-patterns)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start Checklist

Follow this workflow to create a new subpage:

### Phase 1: Planning
- [ ] Define page purpose and product name
- [ ] Identify parent route (e.g., `/solutions/intelligent-network-observability/`)
- [ ] Prepare content: title, subtitle, paragraphs, stats, capabilities
- [ ] Gather assets: logo SVG, icons (or use SVG path data)

### Phase 2: Setup
- [ ] Create page file: `src/pages/[route]/[page-name].astro`
- [ ] Create section components folder: `src/components/sections/[page-name]/`
- [ ] Create animation script: `src/scripts/neural-network-[page-name].ts`

### Phase 3: Implementation
- [ ] Copy templates from `src/templates/subpage/`
- [ ] Customize page file with SubpageLayout + SubpageHero
- [ ] Build "Meet [Product]" section (light theme)
- [ ] Build Capabilities section (dark theme)
- [ ] Build Features section (light theme)
- [ ] Configure neural network animation

### Phase 4: Testing
- [ ] Test responsive layouts (mobile, tablet, desktop)
- [ ] Verify animations work smoothly
- [ ] Check color contrast and accessibility
- [ ] Validate all links and CTAs

---

## Folder Structure

```
src/
├── pages/solutions/[category]/
│   └── [page-name].astro              # Main page file
│
├── components/sections/[page-name]/
│   ├── Meet[Product]Section.astro     # Light "Meet" section with neural viz
│   ├── [Feature]Section.astro         # Dark capabilities section
│   └── [Features]Section.astro        # Light feature grid section
│
├── scripts/
│   └── neural-network-[page-name].ts  # GSAP animation for neural viz
│
├── assets/logos/
│   └── [product]-lightmode.svg        # Product logo for neural core
│
└── templates/subpage/                  # Copy these to start!
    ├── README.md
    ├── _page-template.astro
    ├── _meet-section-template.astro
    ├── _capabilities-template.astro
    ├── _features-template.astro
    └── _neural-network-template.ts
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Page file | `kebab-case.astro` | `dart-ai.astro` |
| Section folder | `kebab-case/` | `dart-ai/` |
| Section component | `PascalCase.astro` | `MeetDartSection.astro` |
| Animation script | `neural-network-[name].ts` | `neural-network-dart.ts` |
| CSS classes | `kebab-case` | `.meet-dart-section` |

---

## Page Architecture

Every subpage follows a **4-section pattern**:

```
┌─────────────────────────────────────────┐
│           SubpageHero (dark)            │  ← Title + Subtitle
├─────────────────────────────────────────┤
│      "Meet [Product]" (light)           │  ← Neural viz + intro content
├─────────────────────────────────────────┤
│     Capabilities (dark)                 │  ← Problem/Solution cards
├─────────────────────────────────────────┤
│       Features (light)                  │  ← 3-column feature grid
├─────────────────────────────────────────┤
│          CTABar (dark)                  │  ← Provided by layout
└─────────────────────────────────────────┘
```

### Page File Structure

```astro
---
import SubpageLayout from "../../../layouts/SubpageLayout.astro";
import SubpageHero from "../../../components/sections/SubpageHero.astro";

// Import your section components
import MeetProductSection from "../../../components/sections/[page-name]/MeetProductSection.astro";
import CapabilitiesSection from "../../../components/sections/[page-name]/CapabilitiesSection.astro";
import FeaturesSection from "../../../components/sections/[page-name]/FeaturesSection.astro";
---

<SubpageLayout
  title="[Page Title] - Cirries"
  description="[SEO description]"
>
  <Fragment slot="hero">
    <SubpageHero
      title="[Product Name]"
      subtitle="[Tagline]"
      align="left"
    />
  </Fragment>

  <MeetProductSection />
  <CapabilitiesSection />
  <FeaturesSection />
</SubpageLayout>
```

---

## Section Deep Dives

### 1. SubpageHero

**Purpose**: Dark hero section with title and subtitle.

**Location**: `src/components/sections/SubpageHero.astro`

**Props**:
```typescript
interface Props {
  title: string;           // Main heading (supports HTML)
  subtitle?: string;       // Secondary text
  badge?: string;          // Optional badge above title
  align?: 'left' | 'center';  // Content alignment
  size?: 'default' | 'compact';
  breadcrumbs?: { label: string; href: string }[];
}
```

**Usage**:
```astro
<SubpageHero
  title="DART <span>AI</span>"
  subtitle="The Intelligence Engine for Network Observability"
  align="left"
/>
```

**Visual Features**:
- Dark background with gradient
- Subtle grid pattern with mask
- Noise texture overlay
- 140px top padding (header clearance)

---

### 2. "Meet [Product]" Section

**Purpose**: Light-themed introduction with neural network visualization.

**Theme**: `data-theme="light"` (white background)

**Layout**: Two-column grid (content left, visualization right)

**Structure**:
```
┌──────────────────────────────────────────────────┐
│ [Light Background with Neural Grid]              │
│  ┌─────────────────┬────────────────────────┐    │
│  │ Eyebrow         │                        │    │
│  │ Title + Highlight│    Neural Network     │    │
│  │ Paragraphs...    │    Visualization      │    │
│  │ [CTA] [CTA]     │    (4 orbiting stats) │    │
│  └─────────────────┴────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface Stat {
  value: string;    // e.g., "24/7"
  label: string;    // e.g., "Always-on monitoring"
  icon: string;     // SVG path data
}

interface Props {
  eyebrow?: string;
  title?: string;
  highlightText?: string;
  paragraphs?: string[];        // Supports HTML (<strong>)
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats?: Stat[];               // 4 stats for neural nodes
}
```

**Neural Network Components**:
- `.neural-bg` - Background system (gradient, grid, particles, noise)
- `.neural-core` - Center logo with pulsing rings
- `.stat-node[data-node-index="N"]` - Orbiting stat cards
- `.neural-connections` - SVG for connection lines
- `.data-particles` - Floating particle container

---

### 3. Capabilities Section (Dark)

**Purpose**: Dark-themed section showcasing capabilities with problem/solution format.

**Theme**: `data-theme="dark"` (var(--color-bg-primary))

**Layout**: Stacked editorial cards with numbered watermarks

**Structure**:
```
┌──────────────────────────────────────────────────┐
│ [Dark Background with Grid + Glow Orbs]          │
│                                                  │
│            [Badge]                               │
│       Title: Highlight                           │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ 01  Title                                  │  │
│  │     ┌─────────────┬─────────────────────┐  │  │
│  │     │ The Problem │ The Solution        │  │  │
│  │     └─────────────┴─────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │ 02  ...                                    │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│         [Closing statement]                      │
└──────────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface Capability {
  number: string;   // "01", "02", etc.
  title: string;
  problem: string;
  solution: string;
}

interface Props {
  badge?: string;
  title?: string;
  titleHighlight?: string;
  capabilities?: Capability[];
}
```

**Visual Features**:
- Large number watermarks (opacity: 0.08)
- Problem/Solution markers with colored lines
- Staggered reveal animations
- Hover: red left border accent, translateX shift

---

### 4. Features Section (Light)

**Purpose**: Light-themed 3-column feature grid.

**Theme**: `data-theme="light"`

**Layout**: Responsive 3-column grid

**Structure**:
```
┌──────────────────────────────────────────────────┐
│ [Light Background with Subtle Watermark]         │
│                                                  │
│         Title (centered)                         │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ [Icon]   │  │ [Icon]   │  │ [Icon]   │       │
│  │ Title    │  │ Title    │  │ Title    │       │
│  │ Desc...  │  │ Desc...  │  │ Desc...  │       │
│  └──────────┘  └──────────┘  └──────────┘       │
└──────────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface Feature {
  icon: string;       // SVG path data
  title: string;
  description: string;
}

interface Props {
  eyebrow?: string;
  title?: string;
  titleHighlight?: string;
  features?: Feature[];
}
```

---

## Design System Reference

### Color Tokens

**Primary Brand**:
```css
--color-primary: #EA242B;           /* Brand red */
--color-primary-hover: #FF3B42;     /* Hover state */
--color-primary-dark: #C41E24;      /* Darker variant */
--color-primary-muted: rgba(234, 36, 43, 0.1);   /* Subtle background */
--color-primary-subtle: rgba(234, 36, 43, 0.2); /* Border accent */
```

**Dark Theme** (default):
```css
--color-bg-primary: #0A0A0A;        /* Near black */
--color-bg-secondary: #0F0F0F;
--color-bg-card: #141414;
--color-text-primary: #FFFFFF;
--color-text-secondary: #A0A0A0;
--color-border: #2A2A2A;
```

**Light Theme** (`data-theme="light"`):
```css
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F8F9FA;
--color-text-primary: #111111;
--color-text-secondary: #555555;
--color-border: #E0E0E0;
```

### Typography Scale

```css
/* Font Families */
--font-display: 'Outfit';     /* Headings */
--font-body: 'DM Sans';       /* Body text */
--font-mono: 'JetBrains Mono'; /* Code/technical */

/* Responsive Font Sizes (clamp) */
--text-xs: clamp(0.6875rem, 0.65rem + 0.2vw, 0.75rem);    /* 11-12px */
--text-sm: clamp(0.8125rem, 0.775rem + 0.2vw, 0.875rem);  /* 13-14px */
--text-base: clamp(0.9375rem, 0.9rem + 0.2vw, 1rem);      /* 15-16px */
--text-lg: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);       /* 16-18px */
--text-xl: clamp(1.125rem, 1.05rem + 0.4vw, 1.25rem);     /* 18-20px */
--text-2xl: clamp(1.375rem, 1.25rem + 0.6vw, 1.5rem);     /* 22-24px */
--text-3xl: clamp(1.75rem, 1.5rem + 1vw, 2rem);           /* 28-32px */
--text-4xl: clamp(2.25rem, 1.875rem + 1.5vw, 2.5rem);     /* 36-40px */
--text-5xl: clamp(2.5rem, 2rem + 2vw, 3rem);              /* 40-48px */
--text-6xl: clamp(3rem, 2.25rem + 3vw, 4.5rem);           /* 48-72px */

/* Font Weights */
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Line Heights */
--leading-tight: 1.1;     /* Headings */
--leading-snug: 1.25;
--leading-normal: 1.5;    /* Body */
--leading-relaxed: 1.625;

/* Letter Spacing */
--tracking-tight: -0.025em;   /* Headings */
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;     /* Eyebrows, badges */
```

### Spacing Tokens

```css
/* Base unit: 4px */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 20px;
--radius-full: 9999px;
```

### Shadow System

```css
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.35);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.4);
```

### Component Variants

**Button**:
```astro
<Button variant="primary">Primary</Button>      <!-- Red bg, white text -->
<Button variant="outline-dark">Outline</Button> <!-- For light backgrounds -->
<Button variant="secondary">Secondary</Button>  <!-- Dark bg, light border -->
<Button variant="ghost">Ghost</Button>          <!-- Transparent -->
```

**Container**:
```astro
<Container size="xl">...</Container>  <!-- max-width: 1440px -->
<Container size="lg">...</Container>  <!-- max-width: 1280px -->
```

**Badge**:
```astro
<Badge variant="outline">Label</Badge>
```

---

## Animation Patterns

### Neural Network Visualization

**File**: `src/scripts/neural-network-[name].ts`

**Dependencies**: GSAP (already installed)

**Key Concepts**:

1. **Initialization**: Run after DOM ready with slight delay
```typescript
import gsap from "gsap";

export function initNeuralNetwork(): void {
  const container = document.getElementById("[name]-neural-network");
  if (!container) return;

  setTimeout(() => {
    positionNodes(container);
    createConnections(container);
    animateNodes();
    createParticles(container);
  }, 150);
}
```

2. **Node Positioning**: Calculate orbital positions
```typescript
function positionNodes(container: HTMLElement): void {
  const nodes = container.querySelectorAll(".stat-node");
  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * 0.38;

  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    (node as HTMLElement).style.left = `${x}px`;
    (node as HTMLElement).style.top = `${y}px`;
  });
}
```

3. **SVG Connections**: Draw lines from center to nodes
```typescript
function createConnections(container: HTMLElement): void {
  const svg = container.querySelector(".neural-connections");
  const core = container.querySelector(".neural-core");
  const nodes = container.querySelectorAll(".stat-node");

  nodes.forEach((node) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.classList.add("connection-line");
    // Calculate path...
    svg.appendChild(line);
  });
}
```

4. **GSAP Floating Animation**:
```typescript
gsap.to(".stat-node", {
  y: "+=10",
  duration: 3,
  ease: "sine.inOut",
  yoyo: true,
  repeat: -1,
  stagger: 0.5
});
```

### CSS Keyframe Animations

**Pulse Animation**:
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}
.element { animation: pulse 3s ease-in-out infinite; }
```

**Rotating Rings**:
```css
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.ring-1 { animation: rotate 20s linear infinite; }
.ring-2 { animation: rotate 30s linear infinite reverse; }
```

**Float/Drift**:
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
```

**Card Reveal**:
```css
@keyframes cardReveal {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.card {
  animation: cardReveal 0.6s ease forwards;
  animation-delay: calc(var(--card-index) * 0.15s);
}
```

### Hover Effects

```css
/* Card lift */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Red accent border */
.card:hover {
  border-color: var(--color-primary-subtle);
  transform: translateX(8px);
  box-shadow: -8px 0 0 var(--color-primary);
}

/* Node scale */
.stat-node:hover {
  transform: translate(-50%, -50%) scale(1.08);
}
```

---

## Props & Customization

### Overriding Defaults

All section components accept props to override default content:

```astro
<MeetProductSection
  eyebrow="Custom Eyebrow"
  title="Custom"
  highlightText="Title"
  paragraphs={[
    "Custom paragraph 1...",
    "Custom paragraph 2 with <strong>bold</strong>..."
  ]}
  primaryCta={{ label: "Get Started", href: "/contact" }}
  secondaryCta={{ label: "Learn More", href: "/solutions" }}
  stats={[
    { value: "99.9%", label: "Uptime", icon: "M..." },
    // ... 3 more stats
  ]}
/>
```

### Common Customization Points

| Aspect | How to Customize |
|--------|------------------|
| Section title | Pass `title` and `highlightText` props |
| Body content | Pass `paragraphs` array (supports HTML) |
| CTA buttons | Pass `primaryCta` and `secondaryCta` objects |
| Stats/Cards | Pass array with objects matching interface |
| Icons | Use SVG path data strings |
| Colors | Use CSS variables (don't hardcode!) |

### Adding Custom Sections

1. Copy closest template from `src/templates/subpage/`
2. Rename component and CSS classes
3. Update Props interface
4. Modify HTML structure as needed
5. Import and add to page file

---

## Responsive Breakpoints

### Breakpoint Reference

| Breakpoint | Target | Common Changes |
|------------|--------|----------------|
| `1024px` | Tablet landscape | 2-col → 1-col grids |
| `768px` | Tablet portrait | Font sizes, padding, stacking |
| `640px` | Mobile | Full stack, compact spacing |

### Common Responsive Patterns

**Grid Collapse**:
```css
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

**Neural Network Sizing**:
```css
.neural-network { max-width: 450px; }

@media (max-width: 1024px) {
  .neural-network { max-width: 380px; }
}

@media (max-width: 768px) {
  .neural-network { max-width: 320px; }
  .neural-core { width: 90px; height: 90px; }
}
```

**Button Stacking**:
```css
.actions {
  display: flex;
  gap: var(--space-4);
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
  }
}
```

---

## Common Patterns

### Background Systems

**Light Section Background**:
```css
.section {
  background: #ffffff;
}
.section-bg {
  position: absolute;
  inset: 0;
}
.gradient {
  background:
    radial-gradient(ellipse 100% 80% at 80% 40%, rgba(220, 38, 38, 0.06) 0%, transparent 50%),
    linear-gradient(180deg, #ffffff 0%, #f8f9fa 50%, #f0f1f3 100%);
}
.grid {
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 90% 80% at 70% 50%, black 20%, transparent 70%);
}
```

**Dark Section Background**:
```css
.section {
  background: var(--color-bg-primary);
}
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  background: var(--color-primary);
  opacity: 0.08;
}
```

### Card Patterns

**Dark Card**:
```css
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-10);
}
```

**Light Card**:
```css
.card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}
```

### Eyebrow/Badge Pattern

```css
.eyebrow {
  display: inline-block;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-primary);
  background: var(--color-primary-muted);
  border: 1px solid var(--color-primary-subtle);
  border-radius: 100px;
  padding: var(--space-2) var(--space-5);
}
```

### Title with Highlight

```astro
<h2 class="title">{title} <span>{highlightText}</span></h2>
```
```css
.title span {
  color: var(--color-primary);
}
```

---

## Troubleshooting

### Neural Network Not Animating

1. Check script is imported and initialized:
```astro
<script>
  import { initNeuralNetwork } from "../../../scripts/neural-network-[name]";
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(initNeuralNetwork, 150);
  });
</script>
```

2. Verify container IDs match script selectors
3. Check browser console for GSAP errors
4. Ensure GSAP is installed: `npm install gsap`

### Responsive Layout Breaking

1. Verify media query breakpoints match
2. Check grid-template-columns changes
3. Ensure max-width is set on containers
4. Test with browser DevTools responsive mode

### Colors Not Applying

1. Verify `data-theme="light"` or `data-theme="dark"` attribute
2. Use CSS variables, not hardcoded colors
3. Check CSS specificity (use `:where()` if needed)

### Import Errors

1. Check relative paths from file location
2. Verify component exports (Astro doesn't need explicit exports)
3. Ensure all dependencies are installed

---

## Reference Files

### Page Structure
- `src/pages/solutions/intelligent-network-observability/dart-ai.astro`
- `src/layouts/SubpageLayout.astro`
- `src/components/sections/SubpageHero.astro`

### Section Components
- `src/components/sections/dart-ai/MeetDartSection.astro`
- `src/components/sections/ml-engine/MLCapabilitiesSection.astro`
- `src/components/sections/dart-ai/EnvironmentSection.astro`

### Animation Scripts
- `src/scripts/neural-network-dart.ts`
- `src/scripts/neural-network.ts`

### Design System
- `src/styles/_colors.css`
- `src/styles/_typography.css`
- `src/styles/_spacing.css`
- `src/styles/_animations.css`

### UI Components
- `src/components/ui/Button.astro`
- `src/components/ui/Container.astro`
- `src/components/ui/Badge.astro`

---

## Templates

Ready-to-use templates are available in `src/templates/subpage/`. Copy and customize:

1. `_page-template.astro` - Main page file
2. `_meet-section-template.astro` - Meet section with neural viz
3. `_capabilities-template.astro` - Dark problem/solution section
4. `_features-template.astro` - Light feature grid
5. `_neural-network-template.ts` - Animation script

See `src/templates/subpage/README.md` for detailed usage instructions.
