# Design System Consistency Audit Report

## Executive Summary

This audit analyzes design system token usage across all pages, sections, and components in the Cirries codebase. The design system defines comprehensive tokens for colors, spacing, typography, and animations in `src/styles/tokens/`. However, many components use hardcoded values instead of these tokens.

**Reference implementations** (Homepage, DART AI page) set the standard for proper token usage.

---

## Design System Token Reference

### Available Tokens

| Category | Token Pattern | Examples |
|----------|--------------|----------|
| **Colors** | `--color-*` | `--color-primary`, `--color-bg-card`, `--color-text-secondary` |
| **Spacing** | `--space-*` | `--space-4` (16px), `--space-8` (32px), `--space-16` (64px) |
| **Typography** | `--text-*` | `--text-sm`, `--text-base`, `--text-2xl`, `--text-5xl` |
| **Font Family** | `--font-*` | `--font-display`, `--font-body`, `--font-mono` |
| **Font Weight** | `--font-*` | `--font-normal`, `--font-medium`, `--font-bold` |
| **Line Height** | `--leading-*` | `--leading-tight`, `--leading-normal`, `--leading-relaxed` |
| **Border Radius** | `--radius-*` | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full` |
| **Shadows** | `--shadow-*` | `--shadow-sm`, `--shadow-card`, `--shadow-glow` |
| **Z-Index** | `--z-*` | `--z-elevated`, `--z-modal`, `--z-header` |
| **Container** | `--container-*` | `--container-md`, `--container-max` |
| **Section** | `--section-padding-*` | `--section-padding-sm`, `--section-padding`, `--section-padding-lg` |

---

## Violation Categories

### 1. Hardcoded RGBA Colors (CRITICAL - ~200+ instances)

**Issue**: Components use raw `rgba()` values instead of color tokens.

**Files with most violations**:
- `Header.astro` - 23 instances
- `DemoRequestOverlay.astro` - 28 instances
- `Hero.astro` - 22 instances
- `LeadershipSection.astro` - 18 instances
- `AboutStatsSection.astro` - 12 instances
- `MeetAboutSection.astro` - 8 instances
- `ProactiveSection.astro` - 10 instances
- `ZeroTrustSection.astro` - 8 instances
- `FeatureBento.astro` - 4 instances
- `Button.astro` - 4 instances
- `Card.astro` - 2 instances
- `CTABar.astro` - 4 instances
- `FeatureCard.astro` - 6 instances

**Common patterns to fix**:
```css
/* BAD */
background: rgba(10, 10, 10, 0.95);
border: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
color: rgba(255, 255, 255, 0.7);

/* GOOD - Add new tokens or use existing */
background: var(--color-bg-primary-95); /* New token needed */
border: 1px solid var(--color-border-subtle);
box-shadow: var(--shadow-lg);
color: var(--color-text-secondary);
```

**Recommended new tokens to add to `_colors.css`**:
```css
/* Overlay/transparency variants */
--color-bg-overlay: rgba(10, 10, 10, 0.85);
--color-bg-overlay-light: rgba(10, 10, 10, 0.6);
--color-bg-overlay-heavy: rgba(10, 10, 10, 0.95);

/* White transparency variants */
--color-white-5: rgba(255, 255, 255, 0.05);
--color-white-8: rgba(255, 255, 255, 0.08);
--color-white-10: rgba(255, 255, 255, 0.1);
--color-white-15: rgba(255, 255, 255, 0.15);
--color-white-20: rgba(255, 255, 255, 0.2);

/* Black transparency variants */
--color-black-5: rgba(0, 0, 0, 0.05);
--color-black-10: rgba(0, 0, 0, 0.1);
--color-black-20: rgba(0, 0, 0, 0.2);
--color-black-50: rgba(0, 0, 0, 0.5);

/* Primary with transparency */
--color-primary-10: rgba(234, 36, 43, 0.1);
--color-primary-15: rgba(234, 36, 43, 0.15);
--color-primary-20: rgba(234, 36, 43, 0.2);
--color-primary-30: rgba(234, 36, 43, 0.3);
```

---

### 2. Hardcoded Font Sizes (HIGH - ~180+ instances)

**Issue**: Components use raw `rem`, `px`, or `em` values instead of `--text-*` tokens.

**Files with violations**:
- `Header.astro` - `font-size: 9px`
- `LeadershipSection.astro` - multiple raw rem values
- `AboutStatsSection.astro` - `0.7rem`, `0.75rem`, `1.1rem`
- `MeetAboutSection.astro` - `0.7rem`, `2.5rem`, `1rem`, `10rem`
- `ProactiveSection.astro` - many raw values
- `INONavBar.astro` - `0.7rem`, `1.4rem`, `1.1rem`, `0.85rem`, `0.6rem`
- `CPNavBar.astro` - similar issues
- `NDRNavBar.astro` - similar issues
- `StatsBar.astro` - `0.65em`
- Most section components have hardcoded sizes

**Token mapping guide**:
```css
/* Current hardcoded → Should use token */
font-size: 0.5rem;     → var(--text-xs) or smaller custom token
font-size: 0.6rem;     → var(--text-xs)
font-size: 0.65rem;    → var(--text-xs)
font-size: 0.7rem;     → var(--text-xs)
font-size: 0.75rem;    → var(--text-sm)
font-size: 0.8rem;     → var(--text-sm)
font-size: 0.85rem;    → var(--text-sm)
font-size: 0.9rem;     → var(--text-base)
font-size: 0.95rem;    → var(--text-base)
font-size: 1rem;       → var(--text-base)
font-size: 1.1rem;     → var(--text-lg)
font-size: 1.125rem;   → var(--text-lg)
font-size: 1.2rem;     → var(--text-xl)
font-size: 1.25rem;    → var(--text-xl)
font-size: 1.35rem;    → var(--text-2xl)
font-size: 1.5rem;     → var(--text-2xl)
font-size: 2rem;       → var(--text-3xl)
font-size: 2.5rem;     → var(--text-4xl)
font-size: 3rem;       → var(--text-5xl)
```

**Recommended new micro-size tokens**:
```css
/* For very small UI elements like badges, labels */
--text-2xs: clamp(0.5rem, 0.45rem + 0.25vw, 0.625rem);  /* 8-10px */
--text-3xs: clamp(0.4rem, 0.35rem + 0.2vw, 0.5rem);    /* 6-8px */
```

---

### 3. Hardcoded Spacing Values (HIGH - ~500+ instances)

**Issue**: Components use raw `px` values for margins, paddings, gaps, widths, heights instead of `--space-*` tokens.

**Common violations**:
```css
/* BAD */
padding: 6px 14px;
gap: 8px;
width: 48px;
height: 80px;
max-width: 700px;
min-height: 520px;

/* GOOD */
padding: var(--space-1-5) var(--space-3-5);
gap: var(--space-2);
width: var(--space-12);
height: var(--space-20);
max-width: var(--container-lg);
min-height: 520px; /* Some fixed dimensions are OK for visual elements */
```

**Spacing token mapping**:
```css
/* px → token */
1px  → var(--space-px)
2px  → var(--space-0-5)
4px  → var(--space-1)
6px  → var(--space-1-5)
8px  → var(--space-2)
10px → var(--space-2-5)
12px → var(--space-3)
14px → var(--space-3-5)
16px → var(--space-4)
20px → var(--space-5)
24px → var(--space-6)
28px → var(--space-7)
32px → var(--space-8)
36px → var(--space-9)
40px → var(--space-10)
44px → var(--space-11)
48px → var(--space-12)
56px → var(--space-14)
64px → var(--space-16)
80px → var(--space-20)
96px → var(--space-24)
```

---

### 4. Media Query Breakpoints (MEDIUM)

**Issue**: Inconsistent breakpoint values across components.

**Current usage (inconsistent)**:
- `480px`, `600px`, `640px`, `768px`, `900px`, `1024px`, `1200px`, `1280px`

**Recommended**: Add breakpoint tokens to `_spacing.css`:
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1440px;
```

---

### 5. Correct Usage (Reference)

**Font Family**: All components correctly use `var(--font-display)`, `var(--font-body)`, `var(--font-mono)`

**Good patterns observed**:
```css
font-family: var(--font-display);
font-family: var(--font-body);
font-family: var(--font-mono);
border: 1px solid var(--color-border);
background: var(--color-bg-card);
color: var(--color-text-primary);
```

---

## Implementation Plan

### Phase 1: Extend Design Tokens (Priority: HIGH)

1. **Add transparency color tokens** to `src/styles/tokens/_colors.css`:
   - White transparency variants (5%, 8%, 10%, 15%, 20%, 30%, 50%)
   - Black transparency variants (5%, 10%, 20%, 30%, 50%)
   - Primary transparency variants (8%, 10%, 15%, 20%, 30%, 40%)
   - Overlay backgrounds (light, medium, heavy)

2. **Add micro typography tokens** to `src/styles/tokens/_typography.css`:
   - `--text-2xs` for very small labels
   - `--text-3xs` for micro elements

3. **Add breakpoint tokens** to `src/styles/tokens/_spacing.css`

### Phase 2: Fix UI Components (Priority: HIGH)

Fix in order of impact/reuse:
1. `src/components/ui/Button.astro`
2. `src/components/ui/Card.astro`
3. `src/components/ui/CTABar.astro`
4. `src/components/ui/FeatureCard.astro`
5. `src/components/ui/DemoRequestOverlay.astro`
6. `src/components/ui/SectionHeader.astro`
7. `src/components/ui/Badge.astro`
8. `src/components/ui/Container.astro`

### Phase 3: Fix Navigation Components (Priority: HIGH)

1. `src/components/navigation/Header.astro`
2. `src/components/navigation/Footer.astro`

### Phase 4: Fix Section Components (Priority: MEDIUM)

**Core sections** (used across multiple pages):
1. `src/components/sections/Hero.astro`
2. `src/components/sections/SubpageHero.astro`
3. `src/components/sections/StatsBar.astro`
4. `src/components/sections/FeatureBento.astro`
5. `src/components/sections/DartAISection.astro`
6. `src/components/sections/ContentSection.astro`

**Hub navigation sections**:
1. `src/components/sections/intelligent-network/INONavBar.astro`
2. `src/components/sections/connectivity-performance/CPNavBar.astro`
3. `src/components/sections/network-detection-response/NDRNavBar.astro`
4. `src/components/sections/sla-reporting/SLARNavBar.astro`
5. `src/components/sections/cloud-monitoring/CloudNavBar.astro`
6. `src/components/sections/mobile/MobileNavBar.astro`

**About sections**:
1. `src/components/sections/about/MeetAboutSection.astro`
2. `src/components/sections/about/LeadershipSection.astro`
3. `src/components/sections/about/AboutStatsSection.astro`

**DART AI sections** (reference implementation):
1. `src/components/sections/dart-ai/MeetDartSection.astro`
2. `src/components/sections/dart-ai/ProactiveSection.astro`
3. `src/components/sections/dart-ai/EnvironmentSection.astro`

**Case study sections**:
1. `src/components/sections/case-study/CaseStudyHero.astro`
2. `src/components/sections/case-study/CaseStudyOverview.astro`
3. `src/components/sections/case-study/CaseStudyChallenge.astro`
4. `src/components/sections/case-study/CaseStudySolution.astro`
5. `src/components/sections/case-study/CaseStudyResults.astro`
6. `src/components/sections/case-study/CaseStudyTestimonial.astro`
7. `src/components/sections/case-study/CaseStudyCTA.astro`

**Product sections** (alphabetical by folder):
- `agentic-ai/` - 3 sections
- `anomaly-detection/` - 2 sections
- `cloud-monitoring/` - 6 sections
- `connectivity-performance/` - 3 sections
- `home-broadband/` - 4 sections
- `industries/` - 3 sections
- `intelligent-network/` - 3 sections
- `iot/` - 4 sections
- `ml-engine/` - 4 sections
- `mobile/` - 8 sections
- `network-detection-response/` - 3 sections
- `observability/` - 2 sections
- `private-network/` - 4 sections
- `reporting/` - 3 sections
- `sensors/` - 2 sections
- `sla-assurance/` - 3 sections
- `sla-reporting/` - 3 sections

### Phase 5: Fix Three.js Components (Priority: LOW)

These use hardcoded values for WebGL rendering, which is acceptable:
- `src/components/three/Logo3DModel.tsx`
- `src/components/three/LogoLiquidChrome.tsx`
- `src/components/three/LogoMeshNetwork.tsx`
- `src/components/three/LogoThreeState.tsx`

---

## Files to Modify

### Token Files (3 files)
- `src/styles/tokens/_colors.css` - Add transparency variants
- `src/styles/tokens/_typography.css` - Add micro sizes
- `src/styles/tokens/_spacing.css` - Add breakpoints

### UI Components (8 files)
- `src/components/ui/Button.astro`
- `src/components/ui/Card.astro`
- `src/components/ui/CTABar.astro`
- `src/components/ui/FeatureCard.astro`
- `src/components/ui/DemoRequestOverlay.astro`
- `src/components/ui/SectionHeader.astro`
- `src/components/ui/Badge.astro`
- `src/components/ui/Container.astro`

### Navigation Components (2 files)
- `src/components/navigation/Header.astro`
- `src/components/navigation/Footer.astro`

### Section Components (~70 files)
All section components in `src/components/sections/`

---

## Success Criteria

1. No hardcoded hex colors (#XXXXXX) in component styles
2. No hardcoded rgba() values in component styles (use tokens)
3. All font-sizes use `--text-*` tokens
4. All spacing values use `--space-*` tokens where applicable
5. Consistent breakpoint usage across all media queries
6. Visual appearance unchanged after refactoring

---

## Notes

- **Three.js components**: Hardcoded values in WebGL/canvas rendering are acceptable
- **SVG attributes**: Inline SVG color values may need to remain hardcoded or use currentColor
- **Border widths**: 1px, 2px, 3px are acceptable as they're standard line widths
- **Animations**: Pixel values in keyframe animations may be acceptable for precise control

---

## User Decisions

- **Approach**: Full implementation - fix all violations across all components
- **New Tokens**: Yes - create new transparency colors and micro typography tokens
