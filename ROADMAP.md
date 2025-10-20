# Sashiko Pattern Designer - Development Roadmap

This document outlines the planned development phases for the Sashiko Pattern Designer. Features are organized by priority and estimated effort to help guide implementation.

## Phase 1: Core Editing Tools 

**Status**: Complete

- ✅ Camera system (zoom, pan, infinite canvas)
- ✅ Selection and editing
- ✅ Undo system
- ✅ Path point editing (delete, merge)
- ✅ Control point dragging
- ✅ Filled shape tools

## Phase 2: Eraser & Protection System 

**Status**: Planned ([View All Issues](https://github.com/leifrogers/sashiko-p5/issues))

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
