# Subpage Templates

Ready-to-use templates for creating consistent subpages following the INO (Intelligent Network Observability) pattern.

## Quick Start

### 1. Create Your Page Structure

```bash
# Create section components folder
mkdir src/components/sections/[your-page-name]

# Create page file
touch src/pages/solutions/[category]/[your-page-name].astro

# Create animation script
touch src/scripts/neural-network-[your-page-name].ts
```

### 2. Copy & Customize Templates

| Template | Copy To | Purpose |
|----------|---------|---------|
| `_page-template.astro` | `src/pages/solutions/[category]/[name].astro` | Main page file |
| `_meet-section-template.astro` | `src/components/sections/[name]/Meet[Product]Section.astro` | Light intro section |
| `_capabilities-template.astro` | `src/components/sections/[name]/CapabilitiesSection.astro` | Dark capabilities |
| `_features-template.astro` | `src/components/sections/[name]/FeaturesSection.astro` | Light feature grid |
| `_neural-network-template.ts` | `src/scripts/neural-network-[name].ts` | Animation script |

### 3. Find & Replace

In each copied file, search for these markers and replace:

| Marker | Replace With |
|--------|--------------|
| `[PRODUCT_NAME]` | Your product name (e.g., "DART AI") |
| `[PAGE_NAME]` | kebab-case page name (e.g., "dart-ai") |
| `[COMPONENT_NAME]` | PascalCase name (e.g., "MeetDart") |
| `[ROUTE_PATH]` | Full route (e.g., "/solutions/intelligent-network-observability/dart-ai") |

### 4. Customize Content

Each template has `<!-- CUSTOMIZE: -->` comments marking where to add your content:

```astro
<!-- CUSTOMIZE: Update these default values -->
const {
  eyebrow = "Your Eyebrow Text",
  title = "Your Title",
  ...
} = Astro.props;
```

## Template Overview

### _page-template.astro

The main page file that assembles all sections:

```astro
<SubpageLayout title="..." description="...">
  <Fragment slot="hero">
    <SubpageHero title="..." subtitle="..." />
  </Fragment>

  <MeetSection />
  <CapabilitiesSection />
  <FeaturesSection />
</SubpageLayout>
```

**Customization Points:**
- Page title and description (SEO)
- Hero title and subtitle
- Section component imports

---

### _meet-section-template.astro

Light-themed "Meet [Product]" section with neural network visualization.

**Structure:**
- Left: Content (eyebrow, title, paragraphs, CTAs)
- Right: Neural network visualization with 4 orbiting stat nodes

**Customization Points:**
- Eyebrow text
- Title + highlighted portion
- Multiple paragraphs (supports HTML `<strong>`)
- Primary and secondary CTA buttons
- 4 stat objects (value, label, icon SVG path)

**Animation:**
- Requires matching `neural-network-[name].ts` script
- Update script import path and function name

---

### _capabilities-template.astro

Dark-themed capabilities section with problem/solution cards.

**Structure:**
- Header with badge and title
- Stacked numbered cards
- Each card has: number, title, problem, solution
- Closing statement

**Customization Points:**
- Badge text
- Title + highlighted portion
- Capability objects array
- Closing statement text

**Features:**
- Automatic staggered reveal animation
- Hover effects (red border accent)
- Large number watermarks

---

### _features-template.astro

Light-themed 3-column feature grid.

**Structure:**
- Header with eyebrow and title
- 3-column responsive grid
- Each card: icon, title, description

**Customization Points:**
- Eyebrow text
- Title + highlighted portion
- Feature objects array (icon path, title, description)

---

### _neural-network-template.ts

GSAP animation script for neural network visualization.

**Customization Points:**
- Container ID selector (line 8)
- Function export name (line 7)
- Node positioning radius (line 23)
- Animation durations and easing

**Dependencies:**
```bash
npm install gsap
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Page file | `kebab-case.astro` | `smart-analytics.astro` |
| Section folder | `kebab-case/` | `smart-analytics/` |
| Section component | `PascalCase.astro` | `MeetSmartAnalyticsSection.astro` |
| Animation script | `neural-network-[name].ts` | `neural-network-smart-analytics.ts` |
| CSS classes | `kebab-case` | `.meet-smart-analytics-section` |
| Container IDs | `[name]-neural-network` | `smart-analytics-neural-network` |

## Common Patterns

### Adding a Logo to Neural Core

```astro
import productLogo from "../../../assets/logos/[product]-lightmode.svg";

<!-- In .core-logo -->
<Image
  src={productLogo}
  alt="[Product Name]"
  width={80}
  height={26}
/>
```

### Custom Stat Icons

Use Lucide or similar icon SVG path data:

```typescript
stats={[
  {
    value: "24/7",
    label: "Always-on",
    icon: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zM12 6v6l4 2"  // Clock
  }
]}
```

### Adding More Sections

1. Create new section component in `src/components/sections/[name]/`
2. Import in page file
3. Add between existing sections

### Changing Theme

```astro
<!-- Light theme -->
<section data-theme="light">

<!-- Dark theme -->
<section data-theme="dark">
```

## Troubleshooting

### Neural Network Not Appearing

1. Check IDs match between HTML and script
2. Verify script import path is correct
3. Check browser console for errors

### Styles Not Applying

1. Ensure CSS classes match template
2. Check `data-theme` attribute
3. Verify design tokens are used (not hardcoded colors)

### Animation Not Working

1. Verify GSAP is installed: `npm install gsap`
2. Check script initialization timing
3. Ensure container has correct dimensions

## Full Documentation

See `claudedocs/subpage-developer-guide.md` for comprehensive documentation including:
- Complete design system reference
- All CSS token values
- Animation deep dives
- Responsive breakpoint patterns
