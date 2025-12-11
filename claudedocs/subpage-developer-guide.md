# Cirries Subpage Developer Guide

A comprehensive guide for developers and AI agents to build subpages for the Cirries website. This guide emphasizes **content-first design** — let the client's content dictate the page structure, not the other way around.

---

## Table of Contents

1. [Philosophy: Content-First Design](#philosophy-content-first-design)
2. [Quick Start Workflow](#quick-start-workflow)
3. [Folder Structure](#folder-structure)
4. [Page Architecture](#page-architecture)
5. [Section Patterns](#section-patterns)
6. [Visualization Guidelines](#visualization-guidelines)
7. [Design System Reference](#design-system-reference)
8. [Animation Patterns](#animation-patterns)
9. [Responsive Breakpoints](#responsive-breakpoints)
10. [Reference Examples](#reference-examples)

---

## Philosophy: Content-First Design

### The Golden Rule

**Read the client's content FIRST. Design sections that fit the content — never force content into a template.**

### Common Mistakes to Avoid

| Mistake | Better Approach |
|---------|-----------------|
| Copying templates blindly | Analyze content structure, then choose/create appropriate sections |
| Forcing 4-section pattern on all pages | Use as many or few sections as the content requires |
| Generic "neural network" visualization | Create visualizations that represent what the product actually does |
| Making up stats/features | Only use what the client provided |
| Problem/Solution cards for everything | Match section format to content format |

### Content Analysis Process

Before writing any code:

1. **Read the source content completely** (usually in `docs/content/`)
2. **Identify the narrative structure**:
   - What's the main headline/hook?
   - What are the key sections/themes?
   - What are the specific stats/specs mentioned?
   - What's the closing message?
3. **Map content to sections**:
   - Each distinct theme = potential section
   - Key specs = highlight opportunities
   - Don't invent sections that aren't in the content

### Example: Sensors Page Analysis

**Source content themes:**
1. "Clarity at the Speed of 5G" — The 5G challenge (intro)
2. "Purpose-Built for 5G" — DART Sensors solution
3. "Taming the 5G Data Deluge" — Processing capabilities with 2 key specs
4. Closing statement about foundation of excellence

**Resulting page structure:**
- Hero: "DART Sensors"
- MeetSensorsSection: Intro content + packet stream visualization
- DataDelugeSection: Processing specs (100 Gbps, Millions/sec)
- CTA (from layout)

**NOT a generic 4-section template** — just 2 custom sections that match the content.

---

## Quick Start Workflow

### Phase 1: Content Analysis (Do This First!)

- [ ] Read source content file completely (`docs/content/[category]/[page].md`)
- [ ] Identify main headline and subtitle
- [ ] List distinct content sections/themes
- [ ] Note specific stats, specs, or data points
- [ ] Determine what visualization would represent the product

### Phase 2: Planning

- [ ] Decide number of sections (based on content, not template)
- [ ] Plan visualization that relates to product function
- [ ] Check navigation.ts for correct route path
- [ ] Sketch section purposes

### Phase 3: Implementation

- [ ] Create page file at correct route
- [ ] Create section components folder
- [ ] Build sections that match content structure
- [ ] Create product-relevant visualization (if needed)

### Phase 4: Refinement

- [ ] Remove any decorative elements that don't serve the content
- [ ] Verify all text matches client's source content
- [ ] Test responsive layouts
- [ ] Check for unnecessary animations/effects

---

## Folder Structure

```
src/
├── pages/solutions/[category]/
│   └── [page-name].astro              # Main page file
│
├── components/sections/[page-name]/
│   ├── Meet[Product]Section.astro     # Primary intro section
│   └── [ContentTheme]Section.astro    # Additional sections as needed
│
└── assets/logos/
    └── [product]-lightmode.svg        # Product logo (if available)
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Page file | `kebab-case.astro` | `sensors.astro` |
| Section folder | `kebab-case/` | `sensors/` |
| Section component | `PascalCase.astro` | `MeetSensorsSection.astro` |
| CSS classes | `kebab-case` | `.meet-sensors-section` |

### Route Verification

**Always check `src/data/navigation.ts`** for the correct route path before creating pages. The navigation defines where users expect to find the page.

---

## Page Architecture

### Flexible Section Pattern

Pages should have **as many sections as the content requires**:

```
┌─────────────────────────────────────────┐
│           SubpageHero (dark)            │  ← Always present
├─────────────────────────────────────────┤
│      Section 1 (light or dark)          │  ← Based on content
├─────────────────────────────────────────┤
│      Section 2 (alternate theme)        │  ← If content warrants
├─────────────────────────────────────────┤
│      ... more sections as needed        │
├─────────────────────────────────────────┤
│          CTABar (dark)                  │  ← Provided by layout
└─────────────────────────────────────────┘
```

### Theme Alternation

Sections should alternate between light and dark themes for visual rhythm:
- `data-theme="light"` — White/light gray background
- `data-theme="dark"` — Near-black background

### Page File Structure

```astro
---
import SubpageLayout from "../../../layouts/SubpageLayout.astro";
import SubpageHero from "../../../components/sections/SubpageHero.astro";

// Import your custom section components
import MeetProductSection from "../../../components/sections/[page-name]/MeetProductSection.astro";
import OtherSection from "../../../components/sections/[page-name]/OtherSection.astro";
---

<SubpageLayout
  title="[Product Name] - Cirries Technologies"
  description="[SEO description from content]"
>
  <Fragment slot="hero">
    <SubpageHero
      title="[Product] <span>[Highlight]</span>"
      subtitle="[From client content]"
      align="left"
    />
  </Fragment>

  <MeetProductSection />
  <OtherSection />
  <!-- Add sections as content requires -->
</SubpageLayout>
```

---

## Section Patterns

### Primary Intro Section (Light Theme)

Two-column layout: content left, visualization right.

**Use when:** Introducing a product with explanatory content.

**Structure:**
```
┌──────────────────────────────────────────────────┐
│ [Light Background]                                │
│  ┌─────────────────┬────────────────────────┐    │
│  │ Eyebrow         │                        │    │
│  │ Title + Highlight│    Visualization      │    │
│  │ Paragraphs...    │    (product-specific) │    │
│  │ [CTA] [CTA]     │                        │    │
│  └─────────────────┴────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

### Spec Highlight Section (Dark Theme)

For showcasing key specifications or metrics.

**Use when:** Content has specific numbers/specs to emphasize.

**Structure:**
```
┌──────────────────────────────────────────────────┐
│ [Dark Background with subtle glow orbs]          │
│                                                  │
│            [Badge]                               │
│       Title: Highlight                           │
│       Intro paragraph                            │
│                                                  │
│  ┌─────────────────────┐ ┌─────────────────────┐│
│  │  BIG SPEC VALUE     │ │  BIG SPEC VALUE     ││
│  │  Label              │ │  Label              ││
│  │  Description...     │ │  Description...     ││
│  └─────────────────────┘ └─────────────────────┘│
│                                                  │
│         [Closing statement]                      │
└──────────────────────────────────────────────────┘
```

### Problem/Solution Cards (Dark Theme)

For content structured around challenges and solutions.

**Use when:** Content explicitly presents problems and their solutions.

**Don't use when:** Content is narrative/descriptive without clear problem framing.

### Feature Grid (Light Theme)

3-column grid for feature lists.

**Use when:** Content has 3+ distinct features with descriptions.

**Don't use when:** Content is narrative or has fewer than 3 features.

---

## Visualization Guidelines

### The Key Principle

**Visualizations should represent what the product actually does, not be generic decorative elements.**

### Good Visualization Examples

| Product | Visualization | Why It Works |
|---------|---------------|--------------|
| DART Sensors | Packet stream flow (chaotic → clean) | Shows data capture and processing |
| AI Engine | Processing/analysis animation | Shows intelligence/computation |
| Monitoring | Dashboard/metrics display | Shows observability |

### Bad Visualization Examples

| Avoid | Why |
|-------|-----|
| Generic neural network for everything | Doesn't represent specific product function |
| Orbiting stats unrelated to product | Decorative, not informative |
| Random animated lines/particles | Visual noise without meaning |

### Packet Stream Visualization (Sensors Example)

For data processing products, show the transformation:

```
┌─────────────────────────────────────────────────────┐
│  [Throughput Counter: 100 Gbps]                     │
│                                                     │
│  ┌──────────┐   ┌─────────┐   ┌──────────┐        │
│  │ Raw Data │ → │ SENSOR  │ → │ Clean    │        │
│  │ (chaotic)│   │ (core)  │   │ (ordered)│        │
│  └──────────┘   └─────────┘   └──────────┘        │
│                                                     │
│  [Stats: Line Rate | Flow Records | Packet Loss]   │
└─────────────────────────────────────────────────────┘
```

**Key elements:**
- Live counter showing throughput
- Input zone with chaotic/random packets
- Central processing element (the product)
- Output zone with organized/clean data
- Stats bar with key metrics

### Animation Best Practices

1. **Use Intersection Observer** — Only animate when visible
2. **Vanilla JS preferred** — No GSAP needed for simple animations
3. **Web Animations API** — For packet/element movement
4. **CSS animations** — For continuous effects (rotation, pulse)
5. **Remove unnecessary effects** — If it doesn't serve the content, delete it

---

## Design System Reference

### Color Tokens

**Primary Brand:**
```css
--color-primary: #EA242B;           /* Brand red */
--color-primary-hover: #FF3B42;
--color-primary-muted: rgba(234, 36, 43, 0.1);
--color-primary-subtle: rgba(234, 36, 38, 0.2);
```

**Dark Theme:**
```css
--color-bg-primary: #0A0A0A;
--color-bg-card: #141414;
--color-text-primary: #FFFFFF;
--color-text-secondary: #A0A0A0;
--color-border: #2A2A2A;
```

**Light Theme:**
```css
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F8F9FA;
--color-text-primary: #111111;
--color-text-secondary: #555555;
--color-border: #E0E0E0;
```

### Typography

```css
--font-display: 'Outfit';        /* Headings */
--font-body: 'DM Sans';          /* Body text */
--font-mono: 'JetBrains Mono';   /* Code/technical/counters */
```

### Spacing Scale

```css
--space-4: 1rem;    /* 16px */
--space-6: 1.5rem;  /* 24px */
--space-8: 2rem;    /* 32px */
--space-12: 3rem;   /* 48px */
--space-16: 4rem;   /* 64px */
--space-20: 5rem;   /* 80px */
--space-24: 6rem;   /* 96px */
```

### Components

**Button:**
```astro
<Button variant="primary">Primary</Button>      <!-- Red bg -->
<Button variant="outline-dark">Outline</Button> <!-- For light backgrounds -->
```

**Container:**
```astro
<Container size="xl">...</Container>  <!-- max-width: 1440px -->
```

---

## Animation Patterns

### Counter Animation

For animated statistics:

```typescript
function animateCounter(element: HTMLElement, target: number) {
  let current = 0;
  function update() {
    current += target * 0.02;
    if (current >= target) {
      element.textContent = target.toString();
      return;
    }
    element.textContent = Math.floor(current).toString();
    requestAnimationFrame(update);
  }
  update();
}
```

### Packet/Element Flow

For moving elements across a container:

```typescript
function createPacket(container: HTMLElement) {
  const packet = document.createElement('div');
  packet.classList.add('packet');
  container.appendChild(packet);

  packet.animate([
    { left: '0%', opacity: 0 },
    { left: '50%', opacity: 1 },
    { left: '100%', opacity: 0 }
  ], {
    duration: 1000,
    easing: 'linear'
  }).onfinish = () => packet.remove();
}
```

### CSS Keyframes

```css
/* Rotation for sensor/radar effects */
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Pulse for emphasis */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* Card reveal on load */
@keyframes reveal {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### What to Avoid

- Random red lines/accents that don't serve a purpose
- Hover effects that add visual noise (colored borders, sliding accents)
- Animations that distract from content
- GSAP for simple animations (vanilla JS is sufficient)

---

## Responsive Breakpoints

| Breakpoint | Target | Common Changes |
|------------|--------|----------------|
| `1024px` | Tablet | 2-col → 1-col grids |
| `768px` | Tablet portrait | Font sizes, padding |
| `480px` | Mobile | Compact spacing |

### Grid Collapse Pattern

```css
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
}

@media (max-width: 1024px) {
  .grid { grid-template-columns: 1fr; }
}
```

### Visualization Scaling

```css
.visualization {
  max-width: 500px;
}

@media (max-width: 768px) {
  .visualization { max-width: 100%; }
}
```

---

## Reference Examples

### Sensors Page (Content-Driven Design)

**Source:** `docs/content/network-detection/sensors.md`
**Route:** `/solutions/network-detection-response/sensors`

**Sections created:**
1. `MeetSensorsSection.astro` — Intro with packet stream visualization
2. `DataDelugeSection.astro` — Spec highlights (100 Gbps, Millions/sec)

**Key decisions:**
- Replaced generic neural network with packet flow visualization
- Only 2 content sections (not forced 4-section pattern)
- Specs from content became prominent visual elements
- No invented features/capabilities

### DART AI Page (Existing Reference)

**Route:** `/solutions/intelligent-network-observability/dart-ai`

**Sections:**
- `MeetDartSection.astro` — Neural network visualization (appropriate for AI product)
- Additional capability sections

### Files to Reference

```
src/pages/solutions/network-detection-response/sensors.astro
src/components/sections/sensors/MeetSensorsSection.astro
src/components/sections/sensors/DataDelugeSection.astro
src/components/sections/dart-ai/MeetDartSection.astro
src/layouts/SubpageLayout.astro
src/components/sections/SubpageHero.astro
src/data/navigation.ts
```

---

## Checklist Before Shipping

- [ ] All text matches client's source content exactly
- [ ] No invented stats, features, or capabilities
- [ ] Visualization represents product function (not generic)
- [ ] No unnecessary decorative animations/effects
- [ ] Route matches navigation.ts
- [ ] Responsive at all breakpoints
- [ ] Theme alternation (light/dark) creates visual rhythm
- [ ] CTA buttons have correct hrefs
