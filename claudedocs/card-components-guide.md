# Card Components Usage Guide

This guide documents the reusable card components in the Cirries design system and how to properly use them across pages.

## Section Theme vs Card Theme

**Important**: The section's `data-theme` attribute and the card's `theme` prop are independent and serve different purposes.

### Section `data-theme` Attribute

Sections use `data-theme="light"` or `data-theme="dark"` to set the overall section context:

```astro
<section class="meet-dart-section" data-theme="light">
  <!-- Light background section -->
</section>

<section class="capabilities-section" data-theme="dark">
  <!-- Dark background section -->
</section>
```

This attribute:
- Sets CSS custom property context for the section
- Determines background colors, text colors, borders
- Affects child elements that inherit theme variables

### Card `theme` Prop

Card components have their own `theme` prop that controls the card's appearance:

```astro
<StatCard theme="dark" ... />   <!-- Dark card background -->
<CapabilityCard theme="light" ... /> <!-- Light/white card background -->
```

### Theme Combinations

| Section `data-theme` | Card `theme` | Result | Use Case |
|---------------------|--------------|--------|----------|
| `light` | `light` | White card on light bg | Feature cards, industry cards |
| `light` | `dark` | Dark card on light bg | **Meet sections** (neural network) |
| `dark` | `dark` | Dark card on dark bg | Capability sections |
| `dark` | `light` | White card on dark bg | Rare, high contrast needs |

### Key Pattern: Meet Sections

The Meet sections are the primary example where section theme ≠ card theme:

```astro
<section class="meet-dart-section" data-theme="light">
  <!-- Section has light/white background -->

  <StatCard
    theme="dark"  <!-- Card uses DARK theme for visibility -->
    ...
  />
</section>
```

This creates dark, translucent cards that "float" visually over the light neural network background.

---

## Available Card Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CapabilityCard` | `src/components/ui/CapabilityCard.astro` | Feature cards, navigation cards, capability displays |
| `StatCard` | `src/components/ui/StatCard.astro` | Metric/stat displays, neural network nodes |
| `WorkflowCard` | `src/components/ui/WorkflowCard.astro` | Step-based workflow/process cards |
| `InterfaceWindow` | `src/components/ui/InterfaceWindow.astro` | Terminal/monitor style windows with macOS dots |

---

## CapabilityCard

The primary card component for feature displays, navigation, and capability sections.

### Props

```typescript
interface Props {
  icon?: string;              // FontAwesome class OR SVG path data
  iconType?: "fa" | "svg";    // Default: "fa"
  title: string;              // Card title (required)
  description: string;        // Card description (required)
  badges?: string[];          // Optional array of badge labels
  accent?: string;            // CSS color value (default: var(--color-primary))
  theme?: "light" | "dark";   // Default: "dark"
  size?: "sm" | "md" | "lg";  // Default: "md"
  href?: string;              // Optional link (makes card clickable)
  showArrow?: boolean;        // Show navigation arrow (default: false)
  accentPosition?: "top" | "bottom"; // Hover accent line position (default: "bottom")
  class?: string;             // Additional CSS classes
}
```

### Usage Patterns

#### 1. Feature/Industry Cards (Light Theme)

Used in: `EnvironmentSection.astro`, `IndustriesSection.astro`

```astro
import CapabilityCard from "../../ui/CapabilityCard.astro";

{cards.map((card) => (
  <CapabilityCard
    icon={card.icon}
    iconType="svg"
    title={card.title}
    description={card.text}
    theme="light"
    size="lg"
  />
))}
```

#### 2. Navigation Cards with Badges (Light Theme)

Used in: `INONavBar.astro`

```astro
import CapabilityCard from "../../ui/CapabilityCard.astro";

{navItems.map((item) => (
  <CapabilityCard
    icon={item.faIcon}
    iconType="fa"
    title={item.title}
    description={item.description}
    badges={item.badges}
    accent={item.accent}
    theme="light"
    size="md"
    href={item.href}
    showArrow={true}
    accentPosition="bottom"
  />
))}
```

#### 3. Capability Cards (Dark Theme)

Used in: `INOCapabilitiesSection.astro`

```astro
import CapabilityCard from "../../ui/CapabilityCard.astro";

{capabilities.map((cap) => (
  <CapabilityCard
    icon={cap.icon}
    iconType="fa"
    title={cap.title}
    description={cap.description}
    accent={cap.accent}
    theme="dark"
    size="md"
  />
))}
```

### Theme Guidelines

| Theme | Background | Use Case |
|-------|------------|----------|
| `light` | White card on light section | Feature sections, navigation bars |
| `dark` | Dark translucent card | Dark sections, hero areas |

### Size Guidelines

| Size | Padding | Icon Size | Use Case |
|------|---------|-----------|----------|
| `sm` | `--space-5` | 44px | Compact displays |
| `md` | `--space-7` | 54px | Standard cards |
| `lg` | `--space-8` | 64px | Feature highlights |

---

## StatCard

Compact stat/metric display cards, primarily used in neural network visualizations.

### Props

```typescript
interface Props {
  icon?: string;              // SVG path data
  value: string;              // Stat value (required)
  label: string;              // Stat label (required)
  theme?: "light" | "dark";   // Default: "dark"
  variant?: "default" | "bordered" | "dashed"; // Default: "default"
  size?: "sm" | "md" | "lg";  // Default: "md"
  animated?: boolean;         // Enable float animation (default: false)
  animationDelay?: number;    // Animation delay in seconds
  class?: string;
}
```

### Usage Pattern

Used in: `MeetDartSection.astro`, `MeetMLSection.astro`, `MeetAgenticSection.astro`

```astro
import StatCard from "../../ui/StatCard.astro";

{stats.map((stat, index) => (
  <div class="stat-node-wrapper" data-node-index={index}>
    <StatCard
      icon={stat.icon}
      value={stat.value}
      label={stat.label}
      theme="dark"
      variant="dashed"
      size="md"
    />
  </div>
))}
```

### Important Notes

1. **Wrapper Required for Neural Networks**: When used with neural network animations, wrap StatCard in a positioned div with class `stat-node-wrapper` and `data-node-index` attribute.

2. **Script Selectors**: Neural network scripts (e.g., `neural-network-dart.ts`) must target `.stat-node-wrapper`, NOT `.stat-node`.

3. **Dark Theme Required for Meet Sections**: The "Meet" sections (MeetDartSection, MeetMLSection, MeetAgenticSection) have **light backgrounds** but the StatCards must use `theme="dark"`. This is intentional:
   - The neural network visualization sits on a light/white background
   - The stat cards orbit around the central logo
   - Dark cards (`theme="dark"`) provide contrast and visibility against the light background
   - The dark theme gives cards a dark translucent background (`var(--color-black-92)`) with light text

4. **Why Not Light Theme?**: Using `theme="light"` would make the cards white/transparent, causing them to disappear against the light section background. The dark cards "pop" visually and match the premium neural network aesthetic.

---

## Meet Section Animation Pattern

The "Meet" sections feature an animated neural network visualization with orbiting stat cards. Here's how they work:

### Structure

```
section.meet-*-section (data-theme="light")
├── .neural-bg (light gradient background)
├── Container
│   ├── Content (title, paragraphs, CTAs)
│   └── .neural-viz-container
│       └── .neural-network
│           ├── SVG (connection lines)
│           ├── .neural-core (central logo)
│           ├── .stat-node-wrapper (×4) ← StatCard components
│           └── .data-particles
```

### CSS Requirements

The parent section must include positioning styles for the wrapper:

```css
/* Stat Node Wrappers - positioning for neural network */
.stat-node-wrapper {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 5;
}

.stat-node-wrapper:hover {
  z-index: 20;
}

/* Floating Animations */
.stat-node-wrapper[data-node-index="0"] {
  animation: nodeFloat0 8s ease-in-out infinite;
}
/* ... additional keyframes for indices 1-3 */
```

### Script Integration

Each Meet section imports its corresponding neural network script:

```astro
<script>
  import { initDartNeuralNetwork } from "../../../scripts/neural-network-dart";
  // or initMLNeuralNetwork, initAgenticNeuralNetwork

  function init(): void {
    setTimeout(initDartNeuralNetwork, 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
</script>
```

### Script Selector Pattern

The neural network scripts use GSAP to position and animate the cards. They MUST use the correct selector:

```typescript
// CORRECT
const nodes = document.querySelectorAll("#dart-neural-network .stat-node-wrapper");
gsap.killTweensOf("#dart-neural-network .stat-node-wrapper, .data-particle, .data-pulse");

// WRONG - will not find elements
const nodes = document.querySelectorAll("#dart-neural-network .stat-node");
```

---

## WorkflowCard

Step-based workflow/process cards with numbered steps.

### Props

```typescript
interface Props {
  number?: string;            // Step number (e.g., "01")
  title: string;              // Step title (required)
  description: string;        // Step description (required)
  theme?: "light" | "dark";   // Default: "dark"
  size?: "sm" | "md" | "lg";  // Default: "md"
  class?: string;
}
```

### Usage Pattern

Used in: `ProactiveSection.astro`

```astro
import WorkflowCard from "../../ui/WorkflowCard.astro";

{steps.map((step) => (
  <WorkflowCard
    number={step.number}
    title={step.title}
    description={step.description}
    theme="dark"
    size="md"
  />
))}
```

---

## InterfaceWindow

Terminal/monitor style window component with macOS-style dots.

### Props

```typescript
interface Props {
  title?: string;             // Window title
  badge?: string;             // Status badge text
  badgeVariant?: "default" | "critical" | "success" | "warning" | "info";
  theme?: "light" | "dark";   // Default: "dark"
  showDots?: boolean;         // Show macOS dots (default: true)
  class?: string;
}
```

### Usage Pattern

Used in: `ProactiveSection.astro`

```astro
import InterfaceWindow from "../../ui/InterfaceWindow.astro";

<InterfaceWindow
  title="Network Monitor"
  badge="ALERT"
  badgeVariant="critical"
  theme="dark"
  class="trigger-window"
>
  <!-- Slot content goes here -->
  <div class="alert-content">...</div>
</InterfaceWindow>
```

---

## Migration Checklist

When updating a section to use card components:

### 1. Identify Current Pattern
- [ ] Check if section uses inline card styles (`.feature-card`, `.industry-card`, `.stat-node`, etc.)
- [ ] Determine appropriate component (CapabilityCard, StatCard, WorkflowCard)
- [ ] Note the theme context (light/dark section)

### 2. Update Imports
```astro
---
import CapabilityCard from "../../ui/CapabilityCard.astro";
// or
import StatCard from "../../ui/StatCard.astro";
---
```

### 3. Replace Markup
- Replace inline card markup with component usage
- Map existing data to component props
- Remove inline card styles from `<style>` block

### 4. Update Scripts (if applicable)
- For neural network sections, update selectors from `.stat-node` to `.stat-node-wrapper`
- Update `gsap.killTweensOf()` selectors

### 5. Keep Grid Styles
- Keep the grid container styles (`.feature-grid`, `.industry-grid`, etc.)
- Keep responsive grid adjustments
- Remove individual card styles (handled by component)

---

## File Reference

### Sections Using CapabilityCard
- `src/components/sections/intelligent-network/INOCapabilitiesSection.astro`
- `src/components/sections/intelligent-network/INONavBar.astro`
- `src/components/sections/dart-ai/EnvironmentSection.astro`
- `src/components/sections/agentic-ai/IndustriesSection.astro`

### Sections Using StatCard
- `src/components/sections/dart-ai/MeetDartSection.astro`
- `src/components/sections/ml-engine/MeetMLSection.astro`
- `src/components/sections/agentic-ai/MeetAgenticSection.astro`

### Sections Using WorkflowCard + InterfaceWindow
- `src/components/sections/dart-ai/ProactiveSection.astro`

### Neural Network Scripts
- `src/scripts/neural-network-dart.ts`
- `src/scripts/neural-network-ml.ts`
- `src/scripts/neural-network-agentic.ts`

---

## Common Mistakes to Avoid

1. **Wrong Theme**: Using `theme="light"` on dark backgrounds or vice versa
2. **Missing Wrapper**: Using StatCard without wrapper div in neural network sections
3. **Wrong Selector**: Scripts targeting `.stat-node` instead of `.stat-node-wrapper`
4. **Redundant Styles**: Keeping inline card styles after migrating to component
5. **Wrong Icon Type**: Using `iconType="fa"` with SVG path data or `iconType="svg"` with FontAwesome classes
6. **Missing Accent**: Navigation cards should have explicit `accent` color for hover effects
