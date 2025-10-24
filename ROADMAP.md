# Sashiko Pattern Designer - Development Roadmap

> **Updated**: October 21, 2025 - New comprehensive roadmap based on authentic Sashiko design principles

This document outlines the planned development phases for the Sashiko Pattern Designer, integrating traditional Japanese embroidery techniques with modern computational tools. The roadmap is organized into 5 major phases prioritizing authenticity, algorithmic generation, and creative freedom.

## Overview: Three-Tier System

The designer will support three operational modes:

1. **Tier 1: Authentic Sashiko Mode** - Lock in traditional rules, offer pattern library
2. **Tier 2: Adaptive Mode** - Traditional proportions with creative freedom  
3. **Tier 3: Generative/Experimental Mode** - Algorithmic patterns with controlled randomness

---

## Previous Work (Complete)

- ✅ Camera system (zoom, pan, infinite canvas)
- ✅ Selection and editing
- ✅ Undo system
- ✅ Path point editing (delete, merge)
- ✅ Control point dragging
- ✅ Filled shape tools

---

## Phase 1: Foundation Enhancement (Weeks 1-2)

**Status**: Planned | **Priority**: Must-Have (MVP)

### 1.1 Authentic Stitch Parameters ([#17](../../issues/17))
**Estimate**: ~8-12 hours

**Description**: Implement traditional sashiko stitch ratios and measurements

**Features**:
- 3:2 front/back stitch ratio (3.5mm front, 2.3mm back typical)
- Configurable stitch length (3-5mm standard range)
- Gap ratio of 1/3 between consecutive stitches
- Density control (2-3 stitches per cm)
- MM to pixel conversion (96 DPI: 1mm ≈ 3.78px)
- Settings panel toggle for "Authentic Sashiko Mode"
- Apply parameters to all new stitches when mode enabled

**Key Principles**:
- Consistency matters more than absolute measurements
- All front stitches must match length throughout project
- All back stitches must match their length

### 1.2 Perlin Noise Variation ([#18](../../issues/18))
**Estimate**: ~6-10 hours

**Description**: Add organic variation to prevent mechanical appearance

**Features**:
- 2-5% Perlin noise applied to all geometric coordinates
- Adjustable "Imperfection Slider" (0-15%)
  - 2% = barely perceptible (subtle)
  - 5% = clearly hand-made
  - 10% = deliberately rustic
  - 15% = maximum before pattern breaks down
- Micro-wobble on lines (0.1-0.3mm amplitude)
- Grain-based variation following fabric weave direction
- Optional intentional offset at grid intersections (0.1-0.5mm)

**Critical**: Never exceed 15% - pattern recognition breaks down

### 1.3 Measurement System ([#19](../../issues/19))
**Estimate**: ~5-8 hours

**Description**: Real-world scale with ruler overlay

**Features**:
- Unit selection: mm, cm, inches
- Configurable pixels-per-unit scale
- Ruler overlay showing measurements
- Updates dynamically with zoom level
- Traditional 5mm grid size option
- Display physical dimensions of design
- Scale factor configuration (e.g., 1px = 1mm)

### 1.4 Traditional Color Presets ([#20](../../issues/20))
**Estimate**: ~4-6 hours

**Description**: Authentic sashiko color palettes with contrast validation

**Features**:
- Traditional palette: White (#FFFFFF) on Indigo (#1A2B4A)
- Contrast ratio calculator (WCAG-based)
- Warning when contrast < 3:1 (visibility issues)
- Validation for contrast ≥ 4:1 (recommended minimum)
- Quick preset buttons for traditional combinations
- Color picker respects contrast rules in Authentic Mode

**Historical Context**: White-on-indigo emerged from Edo-period sumptuary laws

---

## Phase 2: Traditional Pattern Library (Weeks 3-4)

**Status**: Planned | **Priority**: Must-Have (MVP)

### 2.1 Hitomezashi Generator ([#21](../../issues/21))
**Estimate**: ~10-15 hours

**Description**: Binary sequence-based algorithmic pattern (HIGHEST PRIORITY)

**Why First**: Simplest algorithmic implementation with powerful results

**Features**:
- Grid-based system (5mm default)
- Binary sequence encoding for rows/columns (e.g., "01011001")
- Complex emergent patterns from simple rules
- Each stitch equals grid size
- Stitching order: horizontal rows → vertical rows → diagonals
- Random sequence generator
- Parameter controls:
  - Grid spacing (5-30mm)
  - Row sequence input
  - Column sequence input
  - Generate random sequences
- Pattern preview before applying

**Mathematical Basis**: Hayes & Seaton (2023) - patterns encode as words in binary alphabet

### 2.2 Pattern Generator Architecture ([#22](../../issues/22))
**Estimate**: ~8-12 hours

**Description**: Base pattern system for all traditional motifs

**Features**:
- `SashikoPattern` base class
- Pattern types: asanoha, seigaiha, shippo, kagome, hitomezashi
- `generate()` method override system
- `addVariation()` method for applying noise
- Parameter configuration per pattern
- Continuous line stitching path optimization
- Edge-to-edge tiling compatibility
- Transform support (translate, rotate, reflect)

**Architecture**:
```javascript
class SashikoPattern {
  constructor(type, params)
  generate()  // Override in subclasses
  addVariation(amount = 0.02)
  render()
}
```

### 2.3 Asanoha (Hemp Leaf) Generator ([#23](../../issues/23))
**Estimate**: ~12-18 hours

**Description**: Hexagonal pattern with six-pointed star motifs

**Features**:
- Hexagonal pattern generation
- **CRITICAL**: 70% ratio for connecting lines (proper diamond proportions)
- Grid interval parameter (50mm default)
- All angles multiples of 60°
- Construction steps:
  1. Horizontal parallel lines at G intervals
  2. Center dots with 2.5cm offset on alternating rows
  3. Diagonal line connections
  4. Connecting lines at 70% of G from dots
- Variations: kaku-asanoha (square), rokkaku-asanoha (open centers)
- Works on equilateral triangular grids

**Symbolism**: Growth, health, protection from evil spirits

### 2.4 Seigaiha (Waves) Generator ([#24](../../issues/24))
**Estimate**: ~10-14 hours

**Description**: Overlapping concentric arc pattern (blue sea waves)

**Features**:
- Overlapping concentric circle arcs
- Arcs 1 square high × 2 squares wide
- Brick-by-row tiling with 1/2-brick offset
- Turn cloth 90° technique for second overlay
- Standard repeat: 10cm width × 5cm height
- Scallop-shell / fish-scale appearance
- Parameters:
  - Arc radius
  - Spacing between rows
  - Offset amount

**Symbolism**: Peaceful seas, calm strength, good fortune

### 2.5 Shippo (Seven Treasures) Generator ([#25](../../issues/25))
**Estimate**: ~10-14 hours

**Description**: Interlocking circles forming quatrefoil motifs

**Features**:
- Square grid foundation
- Tangent circles (4-square diameter, 2-square radius)
- Second set positioned in voids of first set
- **KEY TECHNIQUE**: Stitch as continuous S-curves (not circle-by-circle)
- Circle centers at 0°, 90°, 180°, 270°
- Creates petal/star formations at overlaps
- Variations: shippo-tsunagi (connected), kaku-shippo (squared), maru-shippo (double)

**Symbolism**: Seven Buddhist treasures, harmony, never-ending connections

### 2.6 Kagome (Basket Weave) Generator ([#26](../../issues/26))
**Estimate**: ~10-14 hours

**Description**: Trihexagonal tiling with interlaced triangles and hexagons

**Features**:
- Three sets of parallel lines intersecting at 120° angles
- Trihexagonal tiling classification: (3.6.3.6)
- Chiral wallpaper group symmetry (p6/632)
- Quasiregular tiling properties
- Each crossing point has four neighbors
- Construction on triangular/isometric grid
- Three directional line sets each at 60° from others

**Symbolism**: "Eyes" ward off evil spirits, balance of opposing forces

### 2.7 Pattern UI Panel ([#27](../../issues/27))
**Estimate**: ~6-9 hours

**Description**: User interface for pattern library

**Features**:
- Pattern selection buttons with thumbnails
- Parameter controls appear when pattern selected
- Real-time preview canvas
- Apply/Cancel buttons
- Context-aware parameter controls per pattern type
- "Insert Pattern" workflow
- Pattern positioning on canvas
- Integration with undo system

---

## Phase 3: Generative/Algorithmic Features (Weeks 5-6)

**Status**: Planned | **Priority**: Should-Have (v2.0)

### 3.1 Generate Variation Button ([#28](../../issues/28))
**Estimate**: ~6-10 hours

**Description**: Create variations of existing patterns

**Features**:
- "Generate Variation" button for selected patterns
- Variation parameters:
  - Noise: 1-5% Perlin noise
  - Rotation: ±5° slight rotation
  - Scale: 90-110% size variation
  - Color shift: ±20° hue shift
  - Asymmetry: 1-2% to break perfect symmetry
- Maintains pattern recognizability
- Saves each variation to undo stack
- Generate multiple variations for comparison

### 3.2 Random Hitomezashi Generator ([#29](../../issues/29))
**Estimate**: ~4-7 hours

**Description**: Generate random binary sequences for hitomezashi

**Features**:
- Random binary sequence generation (8-16 length)
- "Randomize" button in hitomezashi controls
- Preview multiple random variations
- Save favorite sequences
- Seed-based generation for reproducibility
- Export sequences for sharing

### 3.3 Evolutionary Pattern System ([#30](../../issues/30))
**Estimate**: ~15-25 hours

**Description**: User-guided pattern evolution through selective breeding

**Features**:
- `PatternEvolver` class
- Mutation: Change 10% of binary sequence or adjust ratios ±5%
- Crossover: Splice binary sequences from two patterns
- Evolution over generations (10+ generations, population of 5)
- User selects favorites to breed next generation
- Fitness tracking
- Gallery view of population
- Save evolution history

**Use Case**: Discover novel traditional-feeling patterns through guided evolution

### 3.4 Imperfection Slider (Covered in #18)

Already included in Phase 1.2 - see Perlin Noise Variation

---

## Phase 4: Creative Freedom Tools (Weeks 7-8)

**Status**: Planned | **Priority**: Should-Have (v2.0)

### 4.1 Layer System ([#31](../../issues/31))
**Estimate**: ~12-18 hours

**Description**: Multiple layers for mixing traditional patterns and freehand work

**Features**:
- Multiple layer support
- Layer types: 'pattern', 'freehand'
- Layer properties:
  - Name
  - Locked/unlocked state
  - Visible/hidden
  - Opacity control (0-100%)
- Layer panel UI:
  - Drag to reorder (z-index)
  - Lock/unlock toggle
  - Show/hide toggle
  - Delete layer
  - Duplicate layer
- Active layer selection
- Drawing only affects active layer
- Lock traditional patterns while sketching over them

### 4.2 Pattern Deformation Tools ([#32](../../issues/32))
**Estimate**: ~10-16 hours

**Description**: Warp and distort patterns after generation

**Features**:
- Deformation types:
  - Wave: Sine wave distortion
  - Spiral: Radial distortion from center
  - Perspective: Vanishing point perspective
  - Organic: Perlin noise field deformation
- Deformation intensity control
- Real-time preview
- Apply to selected patterns only
- Maintains stitch continuity
- Undo support

### 4.3 Color System Overhaul ([#33](../../issues/33))
**Estimate**: ~8-14 hours

**Description**: Comprehensive color management with 70+ authentic colors

**Features**:
- 70+ authentic sashiko thread colors (Olympus, Cosmo Hidamari)
- Color palette manager
- Save/load custom palettes
- Traditional palettes (white-on-indigo, red-on-indigo)
- Modern palettes with full spectrum
- Contrast ratio calculator with warnings
- Tone-on-tone subtle options
- Multi-color gradiated bursts
- Mirrored color sequences
- Color themes (light/dark mode)

**Modern Philosophy**: "Anything goes" - contemporary artists aged 30-40 drive colorful trend

### 4.4 Random Colorway Generator ([#34](../../issues/34))
**Estimate**: ~6-10 hours

**Description**: Generate random color combinations with contrast validation

**Features**:
- Pick from 70+ authentic thread colors
- Automatic fabric color selection
- Ensure contrast ratio ≥ 4:1
- Gradiated burst option (mirrored sequences)
- "Randomize Colors" button
- Lock specific colors while randomizing others
- Save favorite colorways
- Export color palettes

---

## Phase 5: Advanced Features (Weeks 9-10)

**Status**: Planned | **Priority**: Nice-to-Have (v3.0+)

### 5.1 Kogin-zashi Support ([#35](../../issues/35))
**Estimate**: ~15-22 hours

**Description**: Counted-thread embroidery with ODD numbers only rule

**Features**:
- **CRITICAL RULE**: Count only ODD numbers (1, 3, 5, 7 threads)
- 1:1 grid aspect ratio
- Horizontal stitching along weft
- Count vertical warp threads
- Blunt-tipped needle simulation (scoop between threads)
- 300+ modoko (foundation patterns):
  - tekonako (butterfly)
  - neko no managu (cat's eyes)
  - sakasakobu (upside-down kelp)
- Diamond-shaped patterns shifted one stitch at a time
- Regional variations: Nishi, Higashi, Mishima
- Traditional: white cotton on deep indigo hemp

**Historical Context**: Edo-period workaround for cotton prohibition

### 5.2 Hishizashi Support ([#36](../../issues/36))
**Estimate**: ~15-22 hours

**Description**: Nanbu diamond stitch with EVEN numbers only rule

**Features**:
- **CRITICAL RULE**: Count only EVEN numbers (2, 4, 6 threads)
- 1:2 grid aspect ratio (horizontal elongation)
- Horizontally elongated diamonds
- 400+ katakko unit patterns:
  - ume no hana (plum blossom)
  - uroko-mon (scale crests)
  - sorobandama (abacus beads)
- Curved/circular silhouettes from straight stitches
- Traditional: light pale blue hemp with colorful threads
- Single-layer densification (fills fabric gaps)

**Historical Context**: Southeastern Aomori/northern Iwate cold region technique

### 5.3 Cellular Automata Generator ([#37](../../issues/37))
**Estimate**: ~12-18 hours

**Description**: Game of Life principles adapted for sashiko

**Features**:
- Conway's Game of Life rule system
- Custom rule sets for sashiko-specific patterns
- Each cell = grid intersection
- Living cells = stitch placement
- Emergent patterns from simple rules
- Configurable:
  - Grid size (20x20 to 60x60)
  - Initial seed pattern
  - Number of generations to simulate
  - Rule set selection
- Convert simulation results to stitches
- Animate simulation process (optional)

### 5.4 Wave Function Collapse Generator ([#38](../../issues/38))
**Estimate**: ~20-30 hours

**Description**: Study existing patterns to generate coherent variations

**Features**:
- Analyze example patterns to extract tiles
- Learn compatibility rules between tiles
- Generate novel patterns maintaining traditional symmetries
- Tile-based generation system
- Coherent variation that feels authentic
- Parameters:
  - Tile size
  - Output dimensions
  - Constraint strictness
- Use traditional patterns as training data
- Generate infinite variations

**Research Basis**: Novel but authentic-feeling results through constraint satisfaction

### 5.5 Glitch/Digital Aesthetics Mode ([#39](../../issues/39))
**Estimate**: ~8-14 hours

**Description**: Contemporary digital aesthetic (Sawako Ninomiya approach)

**Features**:
- Intentional distortion effects
- Fragmented, pixelated appearances
- Deliberately break smooth line aesthetic
- Digital artifacts and glitches
- Intensity control (0-100%)
- Random displacement of stitches
- Fragmentation into pieces
- Visual noise and grain
- Modern pop culture integration
- 3D embroidery hints (raised surfaces)

**Artistic Inspiration**: Contemporary Japanese embroidery artists breaking traditional rules

---

## Mode Selector & Context-Aware UI

### Mode Selector Implementation ([#40](../../issues/40))
**Estimate**: ~6-10 hours

**Description**: Three-tier mode system with context-aware controls

**Features**:
- Mode selection buttons:
  - Freehand Mode (Tier 1)
  - Traditional Mode (Tier 2)
  - Generative Mode (Tier 3)
- Context-aware settings panels:
  
**Freehand Mode**:
- All drawing tools available
- Color picker (full spectrum)
- Grid lock optional
- Free rotation
- No pattern constraints

**Traditional Mode**:
- Authentic stitch ratios enforced
- Pattern library access
- Grid lock required
- Traditional colors only
- Historical accuracy validation

**Generative Mode**:
- Random seed control
- Variation amount slider
- Pattern type selection
- Evolve generation controls
- Imperfection level slider
- Algorithmic tools (CA, WFC)

---

## Architecture Refactor

### File Structure Reorganization ([#41](../../issues/41))
**Estimate**: ~8-12 hours

**Description**: Modularize codebase for maintainability

**New Structure**:
```
sashiko-designer/
├── sketch.js           (main p5.js sketch)
├── camera.js           (zoom/pan system)
├── stitches/
│   ├── stitch.js       (base Stitch class)
│   ├── line.js
│   ├── circle.js
│   ├── path.js
│   └── filled.js
├── patterns/
│   ├── pattern.js      (base Pattern class)
│   ├── hitomezashi.js
│   ├── asanoha.js
│   ├── seigaiha.js
│   ├── shippo.js
│   ├── kagome.js
│   ├── kogin.js
│   └── hishizashi.js
├── generators/
│   ├── random.js       (randomization utilities)
│   ├── cellular.js     (CA generator)
│   ├── wfc.js          (Wave Function Collapse)
│   └── evolution.js    (Pattern breeding)
├── utils/
│   ├── noise.js        (Perlin noise implementation)
│   ├── geometry.js     (geometric calculations)
│   └── color.js        (contrast checking, palettes)
└── ui/
    ├── controls.js
    ├── modal.js
    └── pattern-library.js
```

---

## Testing & Validation

### Traditional Authenticity Tests ([#42](../../issues/42))
**Estimate**: ~10-15 hours

**Test Coverage**:
- [ ] 3:2 front/back stitch ratio verified
- [ ] 5mm grid generates correct traditional scale
- [ ] Asanoha 70% ratio produces proper diamonds
- [ ] Hitomezashi binary sequences work correctly
- [ ] Contrast ratio checker prevents invisible patterns
- [ ] Odd numbers only for Kogin, even for Hishizashi
- [ ] Pattern tiling seamless at edges
- [ ] All angles correct (60° for asanoha, 120° for kagome)

### Generative Quality Tests ([#43](../../issues/43))
**Estimate**: ~8-12 hours

**Test Coverage**:
- [ ] Random patterns recognizably sashiko
- [ ] Variation maintains pattern identity
- [ ] Imperfection slider: 2% subtle, 5% clear, 10% rustic, 15% max
- [ ] Patterns tile seamlessly at edges
- [ ] Evolutionary breeding produces coherent results
- [ ] CA patterns follow rule sets correctly
- [ ] WFC maintains coherency

### Creative Freedom Tests ([#44](../../issues/44))
**Estimate**: ~6-10 hours

**Test Coverage**:
- [ ] Freehand tools work independent of patterns
- [ ] Layers allow mixing traditional + custom
- [ ] All 70+ colors available in non-traditional mode
- [ ] Deformation tools don't break stitches
- [ ] Export maintains pattern integrity
- [ ] Locked layers cannot be edited
- [ ] Opacity controls work correctly

---

## Implementation Priority Summary

### Must-Have (MVP) - Weeks 1-4
Target: Functional traditional sashiko designer with algorithmic capabilities

**Phase 1 (Weeks 1-2)**:
1. ✅ #17 - Authentic Stitch Parameters
2. ✅ #18 - Perlin Noise Variation
3. ✅ #19 - Measurement System  
4. ✅ #20 - Traditional Color Presets

**Phase 2 (Weeks 3-4)**:
5. ✅ #21 - Hitomezashi Generator (HIGHEST PRIORITY)
6. ✅ #22 - Pattern Generator Architecture
7. ✅ #23 - Asanoha Generator
8. ✅ #24 - Seigaiha Generator
9. ✅ #25 - Shippo Generator
10. ✅ #26 - Kagome Generator
11. ✅ #27 - Pattern UI Panel

### Should-Have (v2.0) - Weeks 5-8
Target: Creative tools and variation capabilities

**Phase 3 (Weeks 5-6)**:
12. ✅ #28 - Generate Variation Button
13. ✅ #29 - Random Hitomezashi Generator
14. ✅ #30 - Evolutionary Pattern System

**Phase 4 (Weeks 7-8)**:
15. ✅ #31 - Layer System
16. ✅ #32 - Pattern Deformation Tools
17. ✅ #33 - Color System Overhaul
18. ✅ #34 - Random Colorway Generator

### Nice-to-Have (v3.0+) - Weeks 9-12
Target: Advanced techniques and experimental features

**Phase 5 (Weeks 9-10)**:
19. ✅ #35 - Kogin-zashi Support
20. ✅ #36 - Hishizashi Support
21. ✅ #37 - Cellular Automata Generator
22. ✅ #38 - Wave Function Collapse Generator
23. ✅ #39 - Glitch/Digital Aesthetics Mode

**Infrastructure (Ongoing)**:
24. ✅ #40 - Mode Selector & Context-Aware UI
25. ✅ #41 - Architecture Refactor
26. ✅ #42 - Traditional Authenticity Tests
27. ✅ #43 - Generative Quality Tests
28. ✅ #44 - Creative Freedom Tests

---

## Key Design Principles (From AI Design Rules)

1. **"Start with hitomezashi for algorithmic simplicity"** - Binary sequences generate complex emergent patterns with minimal code complexity

2. **"Respect the running stitch foundation"** - All innovations should maintain this core technique as the identifier

3. **"Apply 2-5% Perlin noise to all geometric coordinates"** - Computational perfection looks mechanical; controlled imperfection creates authenticity

4. **"The 70% ratio is mathematically critical"** - For asanoha connecting lines, this specific proportion creates proper diamond shapes

5. **"Maintain stitch density at 2-3 per centimeter"** - Never exceed 3 overlapping stitch layers to prevent puckering

6. **"Contrast ratio ≥4:1 for pattern visibility"** - Validate all color combinations to ensure stitches are visible

---

## Contributing to the Roadmap

### How to Suggest Features

1. Check existing [GitHub Issues](https://github.com/leifrogers/sashiko-p5/issues) first
2. Open a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Mockups or examples (if applicable)
   - Reference to design rules (if applicable)
3. Label appropriately: `enhancement`, `feature-request`, `traditional-pattern`, `generative`, `creative-freedom`
4. Participate in discussion

### Feature Prioritization Criteria

Features are prioritized based on:

1. **Authentic Sashiko Value**: Alignment with traditional techniques and principles
2. **User Value**: How many users benefit?
3. **Implementation Effort**: Time required vs. value delivered
4. **Dependencies**: What other features are needed first?
5. **Community Interest**: GitHub reactions and discussion
6. **Three-Tier Integration**: Fit within Authentic/Adaptive/Generative framework

---

## Phase 2: Eraser & Protection System 

**Status**: Previous Roadmap - Lower Priority

These features from the previous roadmap remain valuable but are deprioritized in favor of authentic sashiko pattern generation:

- Click Eraser Tool ([#13](https://github.com/leifrogers/sashiko-designer/issues/13))
- Drag Eraser with Brush ([#14](https://github.com/leifrogers/sashiko-designer/issues/14))
- Selective Eraser Filtering ([#15](https://github.com/leifrogers/sashiko-designer/issues/15))
- Lock/Protect Stitches ([#16](https://github.com/leifrogers/sashiko-designer/issues/16))

These may be integrated in later phases alongside the layer system (#31).

---

## Resources

- [AI Design Rules](./ai-design-rules.md) - Comprehensive sashiko principles
- [Implementation Plan](./plan.md) - Detailed technical specifications
- [GitHub Issues](https://github.com/leifrogers/sashiko-p5/issues) - Track progress

---

**Last Updated**: October 21, 2025  
**Next Review**: After Phase 1 completion (Week 2)

### High Priority

#### Click Eraser Tool ([#13](https://github.com/leifrogers/sashiko-designer/issues/13))
**Estimate**: ~6-9 hours

**Description**: Basic single-stitch deletion by clicking

**Features**:
- Click individual stitches to delete instantly
- Hover highlight shows target stitch (red)
- Keyboard shortcut: `E` key
- Custom eraser cursor for clear mode indication
- Works with all stitch types (line, circle, box, curve, path, filled)
- Compatible with camera zoom/pan
- Each click = separate undo action

**Implementation Priority**: Foundation for all eraser features

### Medium Priority

#### Drag Eraser with Brush ([#14](https://github.com/leifrogers/sashiko-designer/issues/14))
**Estimate**: ~11-18 hours

**Description**: Continuous drag-to-erase multiple stitches

**Features**:
- Click and drag to erase multiple stitches continuously
- Circular brush with configurable radius (5-50px)
- Visual brush circle shows erase area
- Real-time multi-stitch highlighting
- All stitches erased in one drag = one undo action
- Keyboard shortcuts: `[` and `]` to adjust brush size
- Geometric intersection tests for all stitch types
- Performance optimizations (spatial partitioning, frame limiting)

**Dependencies**: Requires #13 as foundation

#### Lock/Protect Stitches ([#16](https://github.com/leifrogers/sashiko-designer/issues/16))
**Estimate**: ~6.5-10.5 hours

**Description**: Prevent accidental deletion of important design elements

**Features**:
- `locked` property on each stitch
- Lock/unlock individual stitches or groups
- Keyboard shortcut: `L` to toggle lock
- Visual lock indicators (padlock icon, blue tint)
- Locked stitches cannot be erased
- Batch operations: Lock All, Unlock All, Lock by Type
- Lock state persists in undo/redo
- Lock state saved/loaded with design

**Use Cases**:
- Protect background patterns while adding details
- Lock finished sections during iterative refinement
- Prevent accidental deletion of construction guides

### Lower Priority

#### Selective Eraser Filtering ([#15](https://github.com/leifrogers/sashiko-designer/issues/15))
**Estimate**: ~7-11 hours

**Description**: Advanced filtering to erase only specific types of stitches

**Features**:
- Filter by stitch type (lines, circles, boxes, curves, paths, filled shapes)
- Filter by drawing mode (freehand vs grid-aligned)
- Filter by color with tolerance slider
- UI checkbox filters with presets:
  - All (erase everything)
  - None (erase nothing)
  - Construction (only grid-aligned guides)
- Visual feedback: Red highlight = erasable, Gray = protected
- Keyboard shortcuts: `Shift+L`, `Shift+C`, `Shift+P`, `Shift+F`, etc.

**Workflows**:
- Remove all construction guides after design complete
- Clean up filled shapes without affecting outlines
- Erase experimental sketches while keeping main design

**Dependencies**: Requires #13, enhanced by #14

## Phase 3: Filled Shape Enhancements 

**Status**: Planned

### Adjustable Fill Spacing ([#9](https://github.com/leifrogers/sashiko-designer/issues/9))
**Estimate**: ~3-5 hours

**Description**: Control the density of cross-hatch fill patterns

**Features**:
- Global `fillSpacing` variable (5-30px range)
- UI slider for real-time adjustment
- Default: 10px spacing
- Applies to all new filled shapes
- Affects circle, box, and triangle fills

### Edit Individual Fill Spacing ([#10](https://github.com/leifrogers/sashiko-designer/issues/10))
**Estimate**: ~4-7 hours

**Description**: Customize spacing for individual filled shapes after creation

**Features**:
- Select filled shape to show current spacing
- Slider updates to show selected shape's spacing
- Real-time preview while adjusting
- Changes saved to undo stack
- Works with all filled shape types
- Multiple shapes can have different spacings

**Dependencies**: Built on #9

### Pattern Angle Control ([#11](https://github.com/leifrogers/sashiko-designer/issues/11))
**Estimate**: ~5-8 hours

**Description**: Rotate and customize fill pattern angles

**Features**:
- Angle presets: 0° (horizontal), 45° (diagonal), 90° (vertical)
- Custom angle input (0-360°)
- Diagonal cross-hatch patterns
- Per-shape angle control
- UI: Preset buttons + numeric input
- Visual preview during angle selection

**Pattern Types**:
- Single direction (0°, 45°, 90°)
- Cross-hatch (0° + 90°, 45° + 135°)
- Custom combined angles

## Phase 4: Performance & Scale

**Status**: Future

### Performance Optimization ([#12](https://github.com/leifrogers/sashiko-designer/issues/12))
**Estimate**: ~8-14 hours

**Description**: Optimize for very large designs (100+ stitches)

**Optimizations**:
- **Level-of-Detail (LOD)**: Simplify rendering at lower zoom levels
- **Viewport Culling**: Only render stitches visible in current view
- **Spatial Partitioning**: Quadtree for efficient stitch lookup
- **Path Caching**: Cache complex path calculations
- **Incremental Rendering**: Spread rendering across multiple frames
- **WebGL Rendering**: GPU acceleration for large designs (optional)

**Performance Targets**:
- 500+ stitches at 60 FPS
- <100ms interaction latency at all zoom levels
- Smooth pan/zoom even with complex designs

**Implementation Strategy**:
1. Profile and identify bottlenecks
2. Implement viewport culling first (biggest impact)
3. Add spatial partitioning for selection/eraser
4. Implement LOD if needed
5. Consider WebGL only if necessary

## Phase 5: Advanced Features 

**Status**: Exploratory

These features are under consideration for future development. No specific issues created yet.

### Layer System
- Multiple pattern layers
- Show/hide individual layers
- Lock layers to prevent editing
- Reorder layer z-index
- Export individual layers

### Pattern Library
- Pre-built traditional Sashiko motifs
  - Seigaiha (waves)
  - Asanoha (hemp leaf)
  - Shippo (seven treasures)
  - Kagome (bamboo basket)
- Save custom patterns as templates
- Pattern browser with thumbnails
- Import/export pattern collections

### Vector Export
- SVG export for scalable graphics
- PDF export for printing
- DXF export for embroidery machines
- Preserve layers and colors in export
- Adjustable export resolution/scale

### Symmetry Tools
- Mirror (horizontal, vertical, diagonal)
- Rotate (90°, 180°, 270°, custom)
- Tile/repeat patterns
- Radial symmetry (4-way, 6-way, 8-way)
- Live symmetry mode (draw once, mirror automatically)

### Measurement & Guides
- Ruler overlay showing dimensions
- Units: pixels, cm, inches
- Custom scale factor (e.g., 1px = 1mm)
- Ruler guides (horizontal/vertical lines)
- Snap to guides
- Angle snap (15°, 30°, 45°, 90°)

### Mobile Optimization
- Touch gesture support
  - Pinch to zoom
  - Two-finger pan
  - Long press for context menu
- Mobile-optimized UI layout
- Responsive toolbar
- Touch-friendly control point sizes

### Pattern Sharing
- Online gallery of shared patterns
- Upload/download community patterns
- Rating and comments
- Pattern attribution and licensing
- Search by tags/categories

### Color System
- Color palette management
- Traditional Sashiko color schemes
- Save/load custom palettes
- Color themes (light/dark mode)
- Color harmony suggestions

### Advanced Path Editing
- Bezier curve handles
- Path boolean operations (union, subtract, intersect)
- Path offsetting (create parallel paths)
- Convert between path types
- Simplify paths (reduce point count)

## Contributing to the Roadmap

### How to Suggest Features

1. Check existing [GitHub Issues](https://github.com/leifrogers/sashiko-p5/issues) first
2. Open a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Mockups or examples (if applicable)
3. Label appropriately: `enhancement`, `feature-request`
4. Participate in discussion

### Feature Prioritization Criteria

Features are prioritized based on:

1. **User Value**: How many users benefit?
2. **Implementation Effort**: Time required vs. value delivered
3. **Dependencies**: What other features are needed first?
4. **Community Interest**: GitHub reactions and discussion
5. **Project Vision**: Alignment with Sashiko design goals
