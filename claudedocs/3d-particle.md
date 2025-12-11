# 3D Logo Particle Explosion Effect - Implementation Plan

## Overview
Transform the homepage hero Three.js scene from a "skinny" extruded SVG to a **3D particle system** that explodes and reassembles based on mouse proximity.

## User Requirements
- **3D Model**: Create new optimized geometry (not use existing OBJ)
- **Effect**: Particle burst explosion
- **Trigger**: Mouse proximity (intensity based on distance)

---

## Problem Analysis

### Current Issues (`LogoMeshNetwork.tsx:154`)
```javascript
solidMesh.scale.set(scale, -scale, scale * 0.5);  // Z-axis halved = skinny
```
- Z-scale at 50% causes flat appearance
- No beveling = harsh edges
- Multiple meshes per shape = inefficient for particles

### Logo Structure (`logomark.svg`)
- **Path 1**: Swoosh ribbon (complex bezier)
- **Path 2**: Circular dot (right side)
- ViewBox: 1137 x 278

---

## Implementation Plan

### Phase 1: Create LogoParticleExplosion Component
**File**: `src/components/three/LogoParticleExplosion.tsx`

1. Copy base structure from `LogoMeshNetwork.tsx`
2. Fix extrude settings:
   ```typescript
   const extrudeSettings = {
     depth: 0.3,
     bevelEnabled: true,
     bevelThickness: 0.02,
     bevelSize: 0.02,
     bevelSegments: 2,
     curveSegments: 8,
   };
   ```
3. Remove `scale * 0.5` on Z-axis (use uniform scaling)

### Phase 2: Particle System Setup

1. **Extract vertices** from ExtrudeGeometry for particle positions
2. **Generate surface particles** for visual density (target: 3000-5000)
3. **Create InstancedMesh** (single draw call for all particles):
   ```typescript
   const mesh = new THREE.InstancedMesh(
     new THREE.SphereGeometry(0.008, 4, 4),
     particleShaderMaterial,
     particleCount
   );
   ```
4. **Store per-particle data**:
   - `aOriginalPosition` - home position in logo
   - `aRandomSeed` - unique variation per particle
   - `velocities` - explosion direction vectors

### Phase 3: Custom Shaders

**Vertex Shader** - Handles displacement:
```glsl
uniform float uExplosionProgress;  // 0 = assembled, 1 = exploded
uniform float uTime;

attribute vec3 aOriginalPosition;
attribute float aRandomSeed;

void main() {
  // Calculate explosion direction (outward from center)
  vec3 explosionDir = normalize(aOriginalPosition);

  // Unique magnitude per particle
  float magnitude = (0.5 + aRandomSeed * 1.5) * uExplosionProgress;

  // Add turbulence for organic motion
  vec3 turbulence = vec3(
    sin(uTime * 2.0 + aRandomSeed * 6.28) * 0.1,
    cos(uTime * 1.5 + aRandomSeed * 8.14) * 0.1,
    sin(uTime * 1.8 + aRandomSeed * 4.71) * 0.1
  ) * uExplosionProgress;

  vec3 displacedPos = aOriginalPosition + explosionDir * magnitude + turbulence;
  // ... apply transforms
}
```

**Fragment Shader** - Color based on proximity:
```glsl
uniform vec3 uBaseColor;      // #666666
uniform vec3 uHighlightColor; // #E7001A (Cirries red)
uniform float uMouseRadius;

varying float vDistanceToMouse;

void main() {
  float mouseInfluence = 1.0 - smoothstep(0.0, uMouseRadius, vDistanceToMouse);
  vec3 color = mix(uBaseColor, uHighlightColor, mouseInfluence * 0.7);
  // ...
}
```

### Phase 4: Mouse Proximity Animation

1. **Calculate explosion intensity**:
   ```typescript
   function calculateExplosionIntensity(mousePos, logoCenter, maxRadius = 2.0) {
     const distance = mousePos.distanceTo(logoCenter);
     const normalized = Math.min(distance / maxRadius, 1);
     return 1 - (normalized * normalized * (3 - 2 * normalized)); // smoothstep
   }
   ```

2. **Smooth interpolation** in animation loop:
   ```typescript
   // Faster explosion, slower return
   const speed = targetExplosion > currentProgress ? 3.0 : 1.5;
   explosionProgress += (targetExplosion - explosionProgress) * deltaTime * speed;
   ```

3. **Update shader uniforms** each frame:
   - `uExplosionProgress`
   - `uMousePosition`
   - `uTime`

### Phase 5: Integration

**Modify `Hero.astro`** (line 34):
```astro
// Replace:
<LogoMeshNetwork client:load />
// With:
<LogoParticleExplosion client:load />
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/three/LogoParticleExplosion.tsx` | CREATE | New particle system component |
| `src/components/sections/Hero.astro` | MODIFY | Import new component |
| `src/components/three/LogoMeshNetwork.tsx` | KEEP | Preserve as fallback |

---

## Performance Strategy

| Device | Particle Count | FPS Target |
|--------|---------------|------------|
| Desktop | 5000 | 60fps |
| Laptop/Tablet | 2500 | 60fps |
| Mobile | 1000 | 30fps |

**Key optimizations**:
- Single InstancedMesh (1 draw call vs N)
- GPU-based animation via shaders
- DynamicDrawUsage for instance matrices
- Additive blending (no depth sorting needed)

---

## Testing Checklist
- [ ] Logo has proper depth (not skinny)
- [ ] Particles cover entire logo shape
- [ ] Explosion triggers on mouse approach
- [ ] Smooth return when mouse leaves
- [ ] Brand red (#E7001A) visible on interaction
- [ ] 60fps on desktop, 30fps on mobile
- [ ] Memory cleanup on unmount
- [ ] `prefers-reduced-motion` respected

---

## Estimated Effort
- Phase 1 (Foundation): 2-3 hours
- Phase 2 (Particles): 3-4 hours
- Phase 3 (Shaders): 2-3 hours
- Phase 4 (Animation): 2-3 hours
- Phase 5 (Integration): 1 hour
- **Total**: ~12-14 hours
