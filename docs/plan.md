# Cirries Website - Comprehensive Implementation Plan

## Overview
Enterprise website for Cirries network visibility platform using **Astro 5.16.5** with a **custom CSS design system** (no Tailwind).

**Design Reference**: `src/assets/homepage.png`
**Theme**: Dark (#0A0A0A) with red accent (#E53935)

---

## 1. Project Structure

```
src/
├── assets/                          # [EXISTS] - All assets provided
│   ├── ai-hand.png                  # DART AI floating hand
│   ├── cirries-hero.mp4             # Hero video background
│   ├── hero-bg.jpg                  # Hero fallback (red particle wave)
│   ├── core-features.jpg            # Server room image
│   ├── intelligent-network-management.png  # Globe network image
│   ├── connectivity-performance.png # World map network
│   ├── hospital.jpg                 # Healthcare use case
│   ├── home-network.jpg             # Home router use case
│   ├── gaming.jpg                   # Gaming use case
│   ├── radial-gradient.png          # Red glow overlay
│   ├── icons/                       # Feature icons (SVG)
│   │   ├── anomoly-detection.svg
│   │   ├── cost-effective.svg
│   │   ├── infrastructure.svg
│   │   └── scalability.svg
│   ├── logos/                       # Brand logos
│   │   ├── cirries-logo-darkmode.svg
│   │   ├── dart-darkmode.svg
│   │   ├── tech-mahindra.svg
│   │   ├── ikusi.svg
│   │   └── ixia.png
│   └── bg/
│       └── lightmode-bg.jpg
│
├── components/
│   ├── ui/                          # Atomic components
│   │   ├── Button.astro
│   │   ├── Card.astro
│   │   ├── Icon.astro
│   │   ├── Logo.astro
│   │   ├── Badge.astro
│   │   └── Container.astro
│   ├── navigation/
│   │   ├── Header.astro
│   │   ├── MegaMenu.astro
│   │   ├── DropdownMenu.astro
│   │   ├── MobileNav.astro
│   │   └── Footer.astro
│   └── sections/                    # Homepage sections
│       ├── Hero.astro
│       ├── StatsBar.astro
│       ├── FeatureBento.astro
│       ├── PartnerLogos.astro
│       ├── DartAISection.astro
│       ├── UseCaseCards.astro
│       └── CTASection.astro
│
├── layouts/
│   ├── BaseLayout.astro
│   └── PageLayout.astro
│
├── pages/
│   └── index.astro
│
├── styles/
│   ├── tokens/
│   │   ├── _colors.css
│   │   ├── _typography.css
│   │   ├── _spacing.css
│   │   └── _animations.css
│   ├── base/
│   │   ├── _reset.css
│   │   └── _global.css
│   └── main.css
│
├── data/
│   └── navigation.ts
│
└── types/
    └── index.ts
```

---

## 2. Design System Tokens

### Colors
```css
:root {
  /* Brand */
  --color-primary: #E53935;
  --color-primary-hover: #EF5350;
  --color-primary-dark: #C62828;

  /* Backgrounds */
  --color-bg-primary: #0A0A0A;
  --color-bg-secondary: #0F0F0F;
  --color-bg-card: #141414;
  --color-bg-card-hover: #1A1A1A;

  /* Text */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A0A0A0;
  --color-text-muted: #666666;

  /* Borders */
  --color-border: #2A2A2A;
  --color-border-subtle: #1A1A1A;
}
```

### Typography
```css
:root {
  --font-sans: 'Inter', -apple-system, sans-serif;

  /* Scale */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 2rem;        /* 32px */
  --text-4xl: 2.5rem;      /* 40px */
  --text-5xl: 3.5rem;      /* 56px */
  --text-6xl: 4.5rem;      /* 72px - Hero headline */
}
```

### Spacing
```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */

  --container-max: 1280px;
  --container-padding: var(--space-6);
}
```

---

## 3. Homepage Sections - Detailed Specifications

### SECTION 1: Header
**Component**: `Header.astro`
**Position**: Fixed, top: 0, z-index: 1000
**Height**: 80px
**Background**: Transparent (over hero), transitions to `rgba(10,10,10,0.95)` with backdrop-blur on scroll

**Layout**: CSS Grid - `grid-template-columns: auto 1fr auto`
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]          [Nav Links Center]           [Contact CTA] │
│  cirries-logo    Solutions|UseCases|Resources|About         │
│  darkmode.svg    ↓mega    ↓drop    ↓drop     ↓drop   [Red] │
└─────────────────────────────────────────────────────────────┘
```

**Logo**: `logos/cirries-logo-darkmode.svg` (width: ~120px)
**Nav Items**:
- Solutions (MegaMenu trigger)
- Use Cases (Dropdown)
- Resources (Dropdown)
- About (Dropdown)
**CTA Button**: "Contact Us" - Red background, white text, rounded

---

### SECTION 2: Hero
**Component**: `Hero.astro`
**Height**: 100vh (minimum 700px)
**Background**:
- **Layer 1**: Video `cirries-hero.mp4` (autoplay, muted, loop, playsinline)
- **Layer 2**: Fallback image `hero-bg.jpg` (red particle wave)
- **Layer 3**: Gradient overlay `linear-gradient(180deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.8) 100%)`
- **Layer 4**: Radial red glow (CSS or `radial-gradient.png`) centered, subtle

**Layout**: Flexbox, center content vertically and horizontally
**Content Container**: max-width 900px, text-align center

```
┌─────────────────────────────────────────────────────────────┐
│                     [VIDEO BACKGROUND]                       │
│                                                              │
│              Experience Unparalleled                         │
│           Network Visibility and Control    ← text-6xl      │
│              (red)   (red)                                   │
│                                                              │
│     Subtitle text about the platform capabilities            │
│     spanning 2 lines maximum here                            │
│                                                              │
│         [Get Started]  [Learn More]                          │
│          ↑ Red fill     ↑ Outline/ghost                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Headline**:
- "Experience Unparalleled" (white)
- "Network Visibility and Control" (red - `--color-primary`)
- Font: var(--text-6xl), font-weight: 700, line-height: 1.1

**Subtitle**: var(--text-lg), color: var(--color-text-secondary), max-width: 600px, margin: 0 auto

**CTAs** (gap: 16px):
- Primary: "Get Started" - bg: red, color: white, padding: 14px 32px, border-radius: 8px
- Secondary: "Learn More" - border: 1px solid white, color: white, same padding

---

### SECTION 3: Stats Bar
**Component**: `StatsBar.astro`
**Height**: ~120px
**Background**: `--color-bg-secondary` (#0F0F0F)
**Border**: Top border 3px solid `--color-primary` (red accent line)

**Layout**: CSS Grid - `grid-template-columns: repeat(4, 1fr)`
**Container**: max-width 1100px, centered

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ← 3px red line
┌──────────┬──────────┬──────────┬──────────┐
│  99.9%   │   30%    │    2x    │   24/7   │
│ Uptime   │ Cost     │ Faster   │ Support  │
│ Guarantee│ Reduction│ Deploy   │ Available│
└──────────┴──────────┴──────────┴──────────┘
```

**Stats Data**:
1. `99.9%` - "Uptime Guarantee"
2. `30%` - "Cost Reduction"
3. `2x` - "Faster Deployment"
4. `24/7` - "Support Available"

**Typography**:
- Number: var(--text-4xl), font-weight: 700, color: white
- Label: var(--text-sm), color: var(--color-text-secondary)

**Animation**: Numbers count up from 0 when section enters viewport (Intersection Observer)

---

### SECTION 4: Feature Bento Grid
**Component**: `FeatureBento.astro`
**Padding**: var(--space-24) top/bottom
**Background**: `--color-bg-primary` (#0A0A0A)

**Layout**: CSS Grid
```css
grid-template-columns: repeat(2, 1fr);
grid-template-rows: auto auto;
gap: var(--space-6);
```

```
┌─────────────────────────────────────────────────────────────┐
│ SECTION PADDING: 96px top/bottom                            │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │ [IMAGE: server room] │  │ [IMAGE: globe/hand]  │         │
│  │  core-features.jpg   │  │  connectivity-       │         │
│  │                      │  │  performance.png     │         │
│  │  Intelligent Network │  │  Connectivity &      │         │
│  │  Management          │  │  Performance         │         │
│  │                      │  │                      │         │
│  │  Description text... │  │  Description text... │         │
│  │                      │  │                      │         │
│  │  [Explore →]         │  │  [Explore →]         │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  (Below cards row)        │
│  │ Hyperscalers│  │  Embedded   │                           │
│  │  [badge]    │  │   [badge]   │                           │
│  └─────────────┘  └─────────────┘                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Feature Cards**:
- **Card 1**:
  - Image: `core-features.jpg` (server room)
  - Title: "Intelligent Network Management"
  - Link: `/solutions/intelligent-network-management`

- **Card 2**:
  - Image: `connectivity-performance.png` (world map network)
  - Title: "Connectivity & Performance"
  - Link: `/solutions/connectivity-performance`

**Card Specifications**:
- Background: `--color-bg-card` (#141414)
- Border: 1px solid `--color-border` (#2A2A2A)
- Border-radius: 16px
- Image: aspect-ratio 16/9, object-fit: cover, border-radius: 12px (top)
- Padding: var(--space-6) for content area
- Hover: border-color lightens, subtle translateY(-4px)

**Badge Row** (below cards):
- Two small badges: "Hyperscalers" and "Embedded"
- Background: `--color-bg-card`, border, small text
- Positioned left-aligned below the grid

---

### SECTION 5: Partner Logos
**Component**: `PartnerLogos.astro`
**Height**: ~100px
**Background**: `--color-bg-secondary`
**Padding**: var(--space-8) top/bottom

**Layout**: Flexbox, justify-content: center, align-items: center, gap: var(--space-16)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│     [Tech Mahindra]    [ikusi]    [ixia/Keysight]          │
│        logo.svg        logo.svg      logo.png               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Logos** (all white/grayscale):
1. `logos/tech-mahindra.svg` - height: 40px
2. `logos/ikusi.svg` - height: 40px
3. `logos/ixia.png` - height: 40px

**Styling**: opacity: 0.7, filter: grayscale(100%), hover: opacity 1, filter none

---

### SECTION 6: DART AI Section (COMPLEX)
**Component**: `DartAISection.astro`
**Height**: ~600px minimum
**Background**: `--color-bg-primary` with subtle radial gradient (red glow bottom-left)
**Padding**: var(--space-24) top/bottom

**Layout**: CSS Grid - Split layout with floating hand effect
```css
grid-template-columns: 1fr 1fr;
align-items: center;
overflow: hidden; /* For hand overflow effect */
```

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │                     │  │  [DART Logo]                │   │
│  │   [AI HAND IMAGE]   │  │   dart-darkmode.svg         │   │
│  │                     │  │                             │   │
│  │   Floating from     │  │  DART AI: Real-Time         │   │
│  │   LEFT edge of      │  │  Network Insights,          │   │
│  │   screen            │  │  Immediate Action.          │   │
│  │                     │  │  (red underline on some)    │   │
│  │   position:         │  │                             │   │
│  │   absolute or       │  │  Description paragraph...   │   │
│  │   negative margin   │  │                             │   │
│  │   to overflow       │  │  ┌────────┐ ┌────────┐      │   │
│  │   container         │  │  │Icon+   │ │Icon+   │      │   │
│  │                     │  │  │Feature1│ │Feature2│      │   │
│  │   ai-hand.png       │  │  └────────┘ └────────┘      │   │
│  │                     │  │  ┌────────┐ ┌────────┐      │   │
│  │                     │  │  │Icon+   │ │Icon+   │      │   │
│  │                     │  │  │Feature3│ │Feature4│      │   │
│  │                     │  │  └────────┘ └────────┘      │   │
│  │                     │  │                             │   │
│  │                     │  │  [Discover DART AI →]       │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Left Side - AI Hand**:
- Image: `ai-hand.png` (robotic hand pointing)
- Position: Extends from LEFT edge of viewport
- CSS: `position: relative` with negative `margin-left` or `transform: translateX(-20%)`
- The hand should appear to "come in" from outside the container
- Width: ~50% of viewport, max reasonable size
- Drop shadow for depth

**Right Side - Content**:
- **DART Logo**: `logos/dart-darkmode.svg` (width: ~200px)
- **Headline**: "DART AI: Real-Time Network Insights," (then new line) "Immediate Action."
  - "Immediate Action" has red underline decoration
  - Font: var(--text-4xl), font-weight: 700
- **Description**: 1-2 paragraphs, var(--text-base), color: secondary

**4 Feature Boxes** (2x2 grid, gap: 16px):
```css
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: var(--space-4);
```
Each box:
- Background: `--color-bg-card`
- Border: 1px solid `--color-border`
- Border-radius: 12px
- Padding: var(--space-4)
- Contains: Icon (from `icons/`) + Feature title
- Icons: `anomoly-detection.svg`, `cost-effective.svg`, `infrastructure.svg`, `scalability.svg`

**CTA**: "Discover DART AI" with arrow → , text link style (red)

---

### SECTION 7: Use Case Cards
**Component**: `UseCaseCards.astro`
**Background**: `--color-bg-secondary`
**Padding**: var(--space-24) top/bottom

**Layout**: CSS Grid - `grid-template-columns: repeat(3, 1fr)`, gap: var(--space-6)

```
┌─────────────────────────────────────────────────────────────┐
│  SECTION PADDING: 96px                                       │
│                                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│  │ [IMAGE]        │ │ [IMAGE]        │ │ [IMAGE]        │   │
│  │ hospital.jpg   │ │ home-network   │ │ gaming.jpg     │   │
│  │                │ │ .jpg           │ │                │   │
│  │                │ │                │ │                │   │
│  │────────────────│ │────────────────│ │────────────────│   │
│  │ Hospital       │ │ Optimizing     │ │ Enhancing      │   │
│  │ Network        │ │ Home Networks  │ │ Online Gaming  │   │
│  │ Optimization   │ │ for Remote     │ │ Experience     │   │
│  │ with DART AI   │ │ Work           │ │ With DART AI   │   │
│  │                │ │                │ │                │   │
│  │ [Discover →]   │ │ [Discover →]   │ │ [Discover →]   │   │
│  └────────────────┘ └────────────────┘ └────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Cards**:
1. **Healthcare**: `hospital.jpg`, "Hospital Network Optimization with DART AI"
2. **Home**: `home-network.jpg`, "Optimizing Home Networks for Remote Work"
3. **Gaming**: `gaming.jpg`, "Enhancing Online Gaming Experience With DART AI"

**Card Specifications**:
- Background: `--color-bg-card`
- Border: 1px solid `--color-border`
- Border-radius: 16px
- Image: Full width, aspect-ratio: 4/3, object-fit: cover
- Content padding: var(--space-6)
- Title: var(--text-xl), font-weight: 600
- CTA: "Discover →" red text link
- Hover: Card lifts slightly, border lightens

---

### SECTION 8: Footer
**Component**: `Footer.astro`
**Background**: `--color-bg-primary` (#0A0A0A)
**Border-top**: 1px solid `--color-border`
**Padding**: var(--space-16) top, var(--space-8) bottom

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Cirries Logo]                                              │
│                                                              │
│  Solutions    Use Cases    Resources    Company              │
│  - DART AI    - Enterprise - Docs       - About              │
│  - Gen AI     - Providers  - Blog       - Careers            │
│  - ML AI      - Carriers   - Webinars   - News               │
│  - etc...     - Government - Papers     - Contact            │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  © 2025 Cirries. All rights reserved.    [Social Icons]     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Responsive Breakpoints

```css
/* Mobile first approach */
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
```

**Key Responsive Changes**:
- **Header**: Hamburger menu below 1024px
- **Hero**: text-4xl on mobile, reduce padding
- **Stats**: 2x2 grid on tablet, stack on mobile
- **Feature Bento**: Stack to single column below 768px
- **DART AI**: Stack vertically, hand above content on mobile
- **Use Cases**: Single column on mobile, 2-col on tablet

---

## 5. Animation Specifications

### Scroll Animations (Intersection Observer)
```typescript
// Animation triggers at 20% visibility
const observer = new IntersectionObserver(callback, { threshold: 0.2 });
```

**Fade In Up**: Default for sections
```css
.animate-fade-in-up {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.animate-fade-in-up.is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Stats Counter**: Animate numbers from 0 to target
**Stagger Cards**: Each card delays 100ms after previous

---

## 6. Implementation Order

### Phase 1: Foundation
1. `astro.config.mjs` - Configure aliases, image optimization
2. `styles/tokens/*.css` - All design tokens
3. `styles/base/_reset.css` - Modern CSS reset
4. `styles/base/_global.css` - Base element styles
5. `styles/main.css` - @layer imports

### Phase 2: Layout & UI Components
1. `layouts/BaseLayout.astro` - HTML shell, Google Fonts
2. `components/ui/Container.astro` - Max-width wrapper
3. `components/ui/Button.astro` - All variants
4. `components/ui/Logo.astro` - Cirries + DART logos

### Phase 3: Navigation
1. `data/navigation.ts` - Nav structure data
2. `components/navigation/Header.astro` - Fixed header
3. `components/navigation/MegaMenu.astro` - Solutions dropdown
4. `components/navigation/Footer.astro`

### Phase 4: Homepage Sections (in order)
1. `components/sections/Hero.astro`
2. `components/sections/StatsBar.astro`
3. `components/sections/FeatureBento.astro`
4. `components/sections/PartnerLogos.astro`
5. `components/sections/DartAISection.astro`
6. `components/sections/UseCaseCards.astro`

### Phase 5: Assembly
1. `pages/index.astro` - Import and compose all sections

---

## 7. Asset Mapping Reference

| Section | Asset File | Usage |
|---------|-----------|-------|
| Header | `logos/cirries-logo-darkmode.svg` | Main logo |
| Hero | `cirries-hero.mp4` | Video background |
| Hero | `hero-bg.jpg` | Video fallback |
| Feature 1 | `core-features.jpg` | Server room card |
| Feature 2 | `connectivity-performance.png` | Network globe card |
| Partners | `logos/tech-mahindra.svg` | Partner logo |
| Partners | `logos/ikusi.svg` | Partner logo |
| Partners | `logos/ixia.png` | Partner logo |
| DART AI | `ai-hand.png` | Floating hand |
| DART AI | `logos/dart-darkmode.svg` | DART logo |
| DART AI | `icons/anomoly-detection.svg` | Feature icon |
| DART AI | `icons/cost-effective.svg` | Feature icon |
| DART AI | `icons/infrastructure.svg` | Feature icon |
| DART AI | `icons/scalability.svg` | Feature icon |
| Use Case 1 | `hospital.jpg` | Healthcare card |
| Use Case 2 | `home-network.jpg` | Home network card |
| Use Case 3 | `gaming.jpg` | Gaming card |

---

## 8. Critical Implementation Notes

### Hero Video
```html
<video
  autoplay
  muted
  loop
  playsinline
  poster="/assets/hero-bg.jpg"
  class="hero__video"
>
  <source src="/assets/cirries-hero.mp4" type="video/mp4">
</video>
```

### DART AI Hand Floating Effect
```css
.dart-ai__hand {
  position: absolute;
  left: 0;
  transform: translateX(-15%);
  width: 55%;
  max-width: 600px;
}
```

### Stats Counter Animation
Use `client:visible` directive with vanilla JS Intersection Observer

---

## 9. Confirmed Decisions

| Decision | Choice |
|----------|--------|
| Font loading | Google Fonts CDN (Inter) |
| Hero background | Video with image fallback |
| Animations | Yes - fade in, counter, stagger |
| Form backend | Custom API endpoint |
| CSS methodology | BEM + CSS custom properties |
| Island architecture | MobileNav only (client:load) |
