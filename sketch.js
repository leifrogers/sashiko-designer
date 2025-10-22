// Sashiko Pattern Designer
// Fixed world space constants
const WORLD_GRID_SIZE = 20;
const WORLD_STITCH_LENGTH = 10;

// === AUTHENTIC SASHIKO MODE PARAMETERS (Phase 1.1) ===
// Conversion constant: 96 DPI standard (1mm = 3.78 pixels)
const MM_TO_PX = 3.78;

// Authentic sashiko stitch parameters
let authenticSashikoMode = false; // Toggle for authentic sashiko parameters
let authenticStitchLengthMM = 3.5; // Front stitch length in mm (3-5mm standard, 3.5mm typical)
let authenticBackRatio = 2/3; // Back stitch ratio: back = front × (2/3), creating 3:2 ratio
let authenticGapRatio = 1/3; // Gap = stitch length × (1/3)
let authenticStitchDensity = 2.5; // Stitches per cm (2-3 range, 2.5 typical)

// Calculated authentic parameters (in pixels)
let authenticFrontStitchPx = authenticStitchLengthMM * MM_TO_PX; // ~13.23px
let authenticBackStitchPx = authenticFrontStitchPx * authenticBackRatio; // ~8.82px
let authenticGapPx = authenticFrontStitchPx * authenticGapRatio; // ~4.41px

let gridSize = WORLD_GRID_SIZE; // Keep for compatibility, now constant
let showGrid = true;
let showStitchMarkers = false; // Show stitch length and gap markers on grid (feature back-burnered)
let stitches = [];
let currentStitch = null;
let stitchColor;
let bgColor;
let stitchLength = WORLD_STITCH_LENGTH; // Keep for compatibility, now constant
let stitchLock = false; // Lock stitch length to grid size
let freehandMode = true; // Default to freehand mode (no grid snapping)
let drawingMode = 'line'; // Current drawing tool: line, circle, box, curve, pen
let gapRatio = 0.5; // Ratio of gap to stitch length (0.5 = 1/2, 0.33 = 1/3)

// Camera system for zoom and pan
let camera = {
  x: 0,           // Camera position in world space (center of view)
  y: 0,
  zoom: 1.0,      // Zoom level: 1.0 = 100%, 2.0 = 200%, 0.5 = 50%
  minZoom: 0.1,   // 10% minimum zoom
  maxZoom: 5.0    // 500% maximum zoom
};

// Pan controls
let isPanning = false;
let panStartMouse = { x: 0, y: 0 };
let panStartCamera = { x: 0, y: 0 };

// Pen tool (freehand drawing)
let isDrawingPath = false;
let currentPath = [];

// Selection and editing
let selectedStitch = null;
let selectionMode = false;
let draggingPoint = null; // 'start' or 'end' or 'control'
let undoStack = [];
const MAX_UNDO = 50;

// UI Elements
let toggleGridBtn, clearBtn, saveBtn, gridSizeSlider, colorPicker, stitchLengthSlider, stitchLockCheckbox;
let selectBtn, deleteBtn, undoBtn;
let toolButtons = {};
let gapRadioButtons = {};
let customGapControl, customGapSlider, gapRatioValueDisplay;

// Authentic Sashiko Mode UI elements
let authenticModeCheckbox;
let authenticStitchLengthSlider, authenticStitchLengthValue;
let authenticDensitySlider, authenticDensityValue;
let authenticSettingsPanel;// ===== COORDINATE TRANSFORMATION FUNCTIONS =====

/**
 * Convert world coordinates to screen coordinates
 */
function worldToScreen(worldX, worldY) {
  return {
    x: (worldX - camera.x) * camera.zoom + width / 2,
    y: (worldY - camera.y) * camera.zoom + height / 2
  };
}

/**
 * Convert screen coordinates to world coordinates
 */
function screenToWorld(screenX, screenY) {
  return {
    x: (screenX - width / 2) / camera.zoom + camera.x,
    y: (screenY - height / 2) / camera.zoom + camera.y
  };
}

/**
 * Snap world coordinates to grid
 */
function snapToGrid(worldX, worldY) {
  if (freehandMode) {
    return { x: worldX, y: worldY };
  }
  return {
    x: round(worldX / WORLD_GRID_SIZE) * WORLD_GRID_SIZE,
    y: round(worldY / WORLD_GRID_SIZE) * WORLD_GRID_SIZE
  };
}

// ===== CAMERA CONTROL FUNCTIONS =====

function zoomIn() {
  camera.zoom = min(camera.zoom * 1.2, camera.maxZoom);
}

function zoomOut() {
  camera.zoom = max(camera.zoom / 1.2, camera.minZoom);
}

function resetView() {
  camera.x = 0;
  camera.y = 0;
  camera.zoom = 1.0;
}

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container');

  bgColor = color(20, 30, 60); // Traditional indigo-like background
  stitchColor = color(255); // White stitches

  // Get UI elements
  toggleGridBtn = select('#toggleGrid');
  clearBtn = select('#clear');
  saveBtn = select('#savePattern');
  // gridSizeSlider = select('#gridSize'); // Removed - grid size now constant
  colorPicker = select('#stitchColor');
  // stitchLengthSlider = select('#stitchLength'); // Removed - stitch length now constant
  stitchLockCheckbox = select('#stitchLock');
  // let showStitchMarkersCheckbox = select('#showStitchMarkers'); // Back-burnered

  // Selection and editing buttons
  selectBtn = select('#selectMode');
  //deleteBtn = select('#deleteStitch');
  undoBtn = select('#undo');

  // Help modal
  let helpBtn = select('#helpBtn');
  let helpModal = select('#helpModal');
  let closeBtn = select('.close');

  if (helpBtn) {
    helpBtn.mousePressed(() => {
      helpModal.style('display', 'block');
    });
  }

  if (closeBtn) {
    closeBtn.mousePressed(() => {
      helpModal.style('display', 'none');
    });
  }

  // Close modal when clicking outside of it
  window.onclick = function (event) {
    if (event.target == helpModal.elt) {
      helpModal.style('display', 'none');
    }
  };

  // Tool buttons
  toolButtons.line = select('#toolLine');
  toolButtons.circle = select('#toolCircle');
  toolButtons.box = select('#toolBox');
  toolButtons.curve = select('#toolCurve');
  toolButtons.pen = select('#toolPen');
  toolButtons.fillCircle = select('#toolFillCircle');
  toolButtons.fillBox = select('#toolFillBox');
  toolButtons.fillTriangle = select('#toolFillTriangle');

  // Add event listeners
  toggleGridBtn.mousePressed(toggleGrid);
  clearBtn.mousePressed(clearCanvas);
  saveBtn.mousePressed(savePattern);
  selectBtn.mousePressed(toggleSelectionMode);
  //deleteBtn.mousePressed(deleteSelectedStitch);
  undoBtn.mousePressed(undo);

  // Grid size and stitch length sliders removed - now constants
  // gridSizeSlider.input(() => { ... });
  // stitchLengthSlider.input(() => { ... });

  colorPicker.input(() => {
    stitchColor = color(colorPicker.value());
    // If a stitch is selected, change its color too
    if (selectedStitch) {
      saveUndoState();
      selectedStitch.color = stitchColor;
    }
  });

  stitchLockCheckbox.changed(() => {
    stitchLock = stitchLockCheckbox.checked();
    // When "Lock to Grid" is checked, disable freehand mode (snap to grid)
    // When unchecked, enable freehand mode (no snapping)
    freehandMode = !stitchLock;
  });

  // Back-burnered: Stitch markers feature
  // showStitchMarkersCheckbox.changed(() => {
  //   showStitchMarkers = showStitchMarkersCheckbox.checked();
  // });

  // Gap ratio controls
  gapRadioButtons.oneThird = select('#gap1-3');
  gapRadioButtons.oneHalf = select('#gap1-2');
  gapRadioButtons.custom = select('#gapCustom');
  customGapControl = select('#customGapControl');
  customGapSlider = select('#customGapRatio');
  gapRatioValueDisplay = select('#gapRatioValue');

  // Gap ratio event listeners
  gapRadioButtons.oneThird.changed(() => {
    gapRatio = 0.33;
    customGapControl.style('display', 'none');
  });

  gapRadioButtons.oneHalf.changed(() => {
    gapRatio = 0.5;
    customGapControl.style('display', 'none');
  });

  gapRadioButtons.custom.changed(() => {
    customGapControl.style('display', 'block');
    gapRatio = parseFloat(customGapSlider.value());
    gapRatioValueDisplay.html(gapRatio.toFixed(2));
  });

  customGapSlider.input(() => {
    gapRatio = parseFloat(customGapSlider.value());
    gapRatioValueDisplay.html(gapRatio.toFixed(2));
  });

  // === AUTHENTIC SASHIKO MODE UI SETUP (Phase 1.1) ===
  authenticModeCheckbox = select('#authenticMode');
  authenticSettingsPanel = select('#authenticSettings');
  authenticStitchLengthSlider = select('#authenticStitchLength');
  authenticStitchLengthValue = select('#authenticStitchLengthValue');
  authenticDensitySlider = select('#authenticDensity');
  authenticDensityValue = select('#authenticDensityValue');

  if (authenticModeCheckbox) {
    authenticModeCheckbox.changed(() => {
      authenticSashikoMode = authenticModeCheckbox.checked();
      updateAuthenticParameters();
      
      // Show/hide authentic settings panel
      if (authenticSettingsPanel) {
        authenticSettingsPanel.style('display', authenticSashikoMode ? 'block' : 'none');
      }
    });
  }

  if (authenticStitchLengthSlider) {
    authenticStitchLengthSlider.input(() => {
      authenticStitchLengthMM = parseFloat(authenticStitchLengthSlider.value());
      authenticStitchLengthValue.html(authenticStitchLengthMM.toFixed(1) + 'mm');
      updateAuthenticParameters();
    });
  }

  if (authenticDensitySlider) {
    authenticDensitySlider.input(() => {
      authenticStitchDensity = parseFloat(authenticDensitySlider.value());
      authenticDensityValue.html(authenticStitchDensity.toFixed(1) + ' stitches/cm');
      updateAuthenticParameters();
    });
  }

  // Tool selection
  for (let tool in toolButtons) {
    toolButtons[tool].mousePressed(() => setDrawingMode(tool));
  }
}

// === AUTHENTIC SASHIKO MODE FUNCTIONS (Phase 1.1) ===

/**
 * Update calculated authentic sashiko parameters based on user settings
 */
function updateAuthenticParameters() {
  // Calculate pixel values from mm settings
  authenticFrontStitchPx = authenticStitchLengthMM * MM_TO_PX;
  authenticBackStitchPx = authenticFrontStitchPx * authenticBackRatio;
  authenticGapPx = authenticFrontStitchPx * authenticGapRatio;
  
  // Log for debugging
  if (authenticSashikoMode) {
    console.log('Authentic Sashiko Parameters Updated:');
    console.log(`  Front stitch: ${authenticStitchLengthMM}mm (${authenticFrontStitchPx.toFixed(2)}px)`);
    console.log(`  Back stitch: ${(authenticStitchLengthMM * authenticBackRatio).toFixed(2)}mm (${authenticBackStitchPx.toFixed(2)}px)`);
    console.log(`  Gap: ${(authenticStitchLengthMM * authenticGapRatio).toFixed(2)}mm (${authenticGapPx.toFixed(2)}px)`);
    console.log(`  3:2 ratio verified: ${(authenticFrontStitchPx / authenticBackStitchPx).toFixed(3)} (should be ~1.5)`);
    console.log(`  Density: ${authenticStitchDensity} stitches/cm`);
  }
}

/**
 * Get the appropriate stitch length based on current mode
 * @returns {number} Stitch length in pixels
 */
function getActiveStitchLength() {
  return authenticSashikoMode ? authenticFrontStitchPx : stitchLength;
}

/**
 * Get the appropriate gap ratio based on current mode
 * @returns {number} Gap ratio (fraction)
 */
function getActiveGapRatio() {
  return authenticSashikoMode ? authenticGapRatio : gapRatio;
}

function draw() {
  background(bgColor);

  // Apply camera transformation
  push();
  translate(width / 2, height / 2);
  scale(camera.zoom);
  translate(-camera.x, -camera.y);

  // Draw grid in world coordinates
  if (showGrid) {
    drawGrid();
  }

  // Draw all stitches in world coordinates
  drawStitches();

  // Draw selected stitch with highlight
  if (selectedStitch) {
    drawSelectedStitchHighlight();
    drawControlPoints();
  }

  // Draw current stitch being created
  if (currentStitch) {
    let worldMouse = screenToWorld(mouseX, mouseY);
    let previewX = worldMouse.x;
    let previewY = worldMouse.y;

    if (drawingMode === 'line') {
      drawDashedLine(currentStitch.x1, currentStitch.y1, previewX, previewY, stitchColor, freehandMode);
    } else if (drawingMode === 'circle') {
      let radius = dist(currentStitch.x1, currentStitch.y1, previewX, previewY);
      drawDashedCircle(currentStitch.x1, currentStitch.y1, radius, stitchColor, freehandMode);
    } else if (drawingMode === 'box') {
      drawDashedBox(currentStitch.x1, currentStitch.y1, previewX, previewY, stitchColor, freehandMode);
    } else if (drawingMode === 'curve') {
      // For curves, we need control points - for now, use a simple quadratic
      if (currentStitch.controlX !== undefined) {
        drawDashedCurve(currentStitch.x1, currentStitch.y1, currentStitch.controlX, currentStitch.controlY, previewX, previewY, stitchColor, freehandMode);
      } else {
        // First click to second click - show line to where control point will be
        drawDashedLine(currentStitch.x1, currentStitch.y1, previewX, previewY, color(255, 255, 255, 100), freehandMode);
      }
    } else if (drawingMode === 'fillCircle') {
      let radius = dist(currentStitch.x1, currentStitch.y1, previewX, previewY);
      // Preview the filled circle
      let previewStitch = {
        type: 'filledShape',
        shapeType: 'circle',
        x1: currentStitch.x1,
        y1: currentStitch.y1,
        radius: radius,
        fillSpacing: gridSize,
        color: color(stitchColor.levels[0], stitchColor.levels[1], stitchColor.levels[2], 100),
        freehand: freehandMode
      };
      drawFilledShape(previewStitch);
    } else if (drawingMode === 'fillBox') {
      // Preview the filled box
      let previewStitch = {
        type: 'filledShape',
        shapeType: 'box',
        x1: currentStitch.x1,
        y1: currentStitch.y1,
        x2: previewX,
        y2: previewY,
        fillSpacing: gridSize,
        color: color(stitchColor.levels[0], stitchColor.levels[1], stitchColor.levels[2], 100),
        freehand: freehandMode
      };
      drawFilledShape(previewStitch);
    } else if (drawingMode === 'fillTriangle') {
      // Triangle has multiple stages
      if (currentStitch.points && currentStitch.points.length === 1) {
        // First point placed, show line to cursor
        stroke(stitchColor);
        strokeWeight(2);
        line(currentStitch.points[0].x, currentStitch.points[0].y, previewX, previewY);
      } else if (currentStitch.points && currentStitch.points.length === 2) {
        // Two points placed, show preview triangle
        let previewStitch = {
          type: 'filledShape',
          shapeType: 'triangle',
          points: [
            currentStitch.points[0],
            currentStitch.points[1],
            { x: previewX, y: previewY }
          ],
          fillSpacing: gridSize,
          color: color(stitchColor.levels[0], stitchColor.levels[1], stitchColor.levels[2], 100),
          freehand: freehandMode
        };
        drawFilledShape(previewStitch);
      }
    }
  }

  // Draw current pen path being drawn (outside currentStitch check)
  if (isDrawingPath && currentPath.length > 0) {
    // Draw the path so far
    if (currentPath.length > 1) {
      drawPathPreview(currentPath, stitchColor);
    }

    // Draw live preview line from last point to cursor
    if (currentPath.length > 0) {
      let lastPoint = currentPath[currentPath.length - 1];
      let worldMouse = screenToWorld(mouseX, mouseY);
      stroke(stitchColor);
      strokeWeight(3);
      strokeCap(ROUND);
      line(lastPoint.x, lastPoint.y, worldMouse.x, worldMouse.y);
    }
  }

  pop(); // End camera transformation

  // Draw UI elements in screen space (not affected by camera)
  drawUI();
}

function drawUI() {
  // Draw zoom level indicator
  push();
  fill(255);
  noStroke();
  textSize(14);
  textAlign(RIGHT, TOP);
  text(`Zoom: ${round(camera.zoom * 100)}%`, width - 10, 10);

  // Draw pan instructions
  if (isPanning) {
    textAlign(CENTER, TOP);
    text('Panning... (Release Space)', width / 2, 10);
  } else {
    textAlign(LEFT, BOTTOM);
    textSize(12);
    fill(255, 255, 255, 150);
    text('Space+Drag: Pan  |  Scroll: Zoom  |  0: Reset View', 10, height - 10);
  }

  // Draw path point editing instructions if needed
  if (selectedStitch && selectedStitch.type === 'path' && draggingPoint &&
    typeof draggingPoint === 'object' && draggingPoint.type === 'pathPoint') {
    let point = selectedStitch.points[draggingPoint.index];
    let screenPos = worldToScreen(point.x, point.y);
    fill(255);
    noStroke();
    textSize(12);
    textAlign(LEFT, BOTTOM);
    text('(Del): Delete Point  |  (M): Merge with Next', screenPos.x + 10, screenPos.y - 10);
  }
  pop();
}

function drawGrid() {
  stroke(255, 255, 255, 40);
  strokeWeight(1);

  // Calculate visible world bounds
  let topLeft = screenToWorld(0, 0);
  let bottomRight = screenToWorld(width, height);

  // Extend bounds to ensure grid covers entire visible area
  let minX = floor(topLeft.x / gridSize) * gridSize - gridSize;
  let maxX = ceil(bottomRight.x / gridSize) * gridSize + gridSize;
  let minY = floor(topLeft.y / gridSize) * gridSize - gridSize;
  let maxY = ceil(bottomRight.y / gridSize) * gridSize + gridSize;

  // Vertical lines
  for (let x = minX; x <= maxX; x += gridSize) {
    line(x, minY, x, maxY);
  }

  // Horizontal lines
  for (let y = minY; y <= maxY; y += gridSize) {
    line(minX, y, maxX, y);
  }

  // Grid points
  fill(255, 255, 255, 80);
  noStroke();
  for (let x = minX; x <= maxX; x += gridSize) {
    for (let y = minY; y <= maxY; y += gridSize) {
      circle(x, y, 3);
    }
  }

  // Draw stitch length and gap markers if enabled
  if (showStitchMarkers) {
    drawStitchMarkers();
  }
}

function drawStitchMarkers() {
  // Calculate stitch and gap lengths in grid units
  let dashSteps = max(1, round(stitchLength / gridSize));
  let gapSteps = max(1, round((stitchLength * gapRatio) / gridSize));
  let patternLength = dashSteps + gapSteps;

  // Draw horizontal markers
  for (let y = 0; y <= height; y += gridSize) {
    let patternIndex = 0;
    for (let x = 0; x <= width; x += gridSize) {
      let posInPattern = patternIndex % patternLength;

      // Stitch start marker (cyan, bright)
      if (posInPattern === 0) {
        fill(0, 255, 255, 200); // Cyan
        noStroke();
        circle(x, y, 5);
      }
      // Stitch end marker (cyan, bright)
      else if (posInPattern === dashSteps - 1) {
        fill(0, 255, 255, 200); // Cyan
        noStroke();
        circle(x, y, 5);
      }
      // Gap markers (gray, dim)
      else if (posInPattern >= dashSteps) {
        fill(150, 150, 150, 60); // Dim gray
        noStroke();
        circle(x, y, 4);
      }

      patternIndex++;
    }
  }

  // Draw vertical markers
  for (let x = 0; x <= width; x += gridSize) {
    let patternIndex = 0;
    for (let y = 0; y <= height; y += gridSize) {
      let posInPattern = patternIndex % patternLength;

      // Stitch start/end markers (cyan)
      if (posInPattern === 0 || posInPattern === dashSteps - 1) {
        fill(0, 255, 255, 200);
        noStroke();
        circle(x, y, 5);
      }
      // Gap markers (gray)
      else if (posInPattern >= dashSteps) {
        fill(150, 150, 150, 60);
        noStroke();
        circle(x, y, 4);
      }

      patternIndex++;
    }
  }
}

function drawStitches() {
  for (let i = 0; i < stitches.length; i++) {
    let stitch = stitches[i];
    // Default to line if no type specified (backward compatibility)
    let type = stitch.type || 'line';

    if (type === 'line') {
      drawDashedLine(stitch.x1, stitch.y1, stitch.x2, stitch.y2, stitch.color, stitch.freehand);
    } else if (type === 'circle') {
      drawDashedCircle(stitch.x1, stitch.y1, stitch.radius, stitch.color, stitch.freehand);
    } else if (type === 'box') {
      drawDashedBox(stitch.x1, stitch.y1, stitch.x2, stitch.y2, stitch.color, stitch.freehand);
    } else if (type === 'curve') {
      drawDashedCurve(stitch.x1, stitch.y1, stitch.controlX, stitch.controlY, stitch.x2, stitch.y2, stitch.color, stitch.freehand);
    } else if (type === 'path') {
      drawDashedPath(stitch.points, stitch.color, stitch.freehand);
    } else if (type === 'filledShape') {
      drawFilledShape(stitch);
    }
  }
}

function drawDashedLine(x1, y1, x2, y2, col, isFreehand = false, forFill = false) {
  stroke(col);
  strokeWeight(3);
  strokeCap(ROUND);

  // Calculate line properties
  let distance = dist(x1, y1, x2, y2);
  let angle = atan2(y2 - y1, x2 - x1);

  // Use authentic sashiko parameters if mode is enabled
  let dashLength = authenticSashikoMode ? authenticFrontStitchPx : stitchLength;
  let gapLength = dashLength * (authenticSashikoMode ? authenticGapRatio : gapRatio);

  if (isFreehand || forFill) {
    // Freehand mode: pixel-based dashing for smooth, non-grid-aligned lines

    // For fill lines, center a stitch at the midpoint for cross-hatch intersections
    if (forFill) {
      let totalSegment = dashLength + gapLength;
      let midpoint = distance / 2;

      // Draw center stitch (this creates the intersection point)
      let centerStart = midpoint - dashLength / 2;
      let centerEnd = midpoint + dashLength / 2;

      let cx1 = x1 + cos(angle) * centerStart;
      let cy1 = y1 + sin(angle) * centerStart;
      let cx2 = x1 + cos(angle) * centerEnd;
      let cy2 = y1 + sin(angle) * centerEnd;

      line(cx1, cy1, cx2, cy2);

      // Draw stitches before center
      let pos = centerStart - totalSegment;
      while (pos >= 0) {
        let sx1 = x1 + cos(angle) * pos;
        let sy1 = y1 + sin(angle) * pos;
        let sx2 = x1 + cos(angle) * (pos + dashLength);
        let sy2 = y1 + sin(angle) * (pos + dashLength);
        line(sx1, sy1, sx2, sy2);
        pos -= totalSegment;
      }

      // Draw stitches after center
      pos = centerEnd + gapLength;
      while (pos + dashLength <= distance) {
        let sx1 = x1 + cos(angle) * pos;
        let sy1 = y1 + sin(angle) * pos;
        let sx2 = x1 + cos(angle) * (pos + dashLength);
        let sy2 = y1 + sin(angle) * (pos + dashLength);
        line(sx1, sy1, sx2, sy2);
        pos += totalSegment;
      }
    } else {
      // Standard freehand dashing
      let steps = distance / (dashLength + gapLength);

      for (let i = 0; i < steps; i++) {
        let start = i * (dashLength + gapLength);
        let end = start + dashLength;

        if (start < distance) {
          let x1Dash = x1 + cos(angle) * start;
          let y1Dash = y1 + sin(angle) * start;
          let x2Dash = x1 + cos(angle) * min(end, distance);
          let y2Dash = y1 + sin(angle) * min(end, distance);

          line(x1Dash, y1Dash, x2Dash, y2Dash);
        }
      }
    }
  } else {
    // Grid-aligned mode: Use same pixel-based measurements as freehand, but snap to grid
    // (dashLength and gapLength already set above based on authenticSashikoMode)
    let totalSegment = dashLength + gapLength;
    let steps = distance / totalSegment;

    for (let i = 0; i < steps; i++) {
      let start = i * totalSegment;
      let end = start + dashLength;

      if (start < distance) {
        let x1Dash = x1 + cos(angle) * start;
        let y1Dash = y1 + sin(angle) * start;
        let x2Dash = x1 + cos(angle) * min(end, distance);
        let y2Dash = y1 + sin(angle) * min(end, distance);

        line(x1Dash, y1Dash, x2Dash, y2Dash);
      }
    }
  }
}

function mouseWheel(event) {
  // Zoom centered on mouse position
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    let worldPosBefore = screenToWorld(mouseX, mouseY);

    // Zoom in or out based on wheel direction
    let zoomFactor = event.delta > 0 ? 0.9 : 1.1;
    camera.zoom = constrain(camera.zoom * zoomFactor, camera.minZoom, camera.maxZoom);

    // Adjust camera position to keep mouse point stationary
    let worldPosAfter = screenToWorld(mouseX, mouseY);
    camera.x += worldPosBefore.x - worldPosAfter.x;
    camera.y += worldPosBefore.y - worldPosAfter.y;

    return false; // Prevent page scrolling
  }
}

function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {

    // Check for spacebar pan mode
    if (keyIsDown(32)) { // Spacebar
      isPanning = true;
      panStartMouse = { x: mouseX, y: mouseY };
      panStartCamera = { x: camera.x, y: camera.y };
      return; // Don't start drawing while panning
    }

    // Convert mouse to world coordinates for all drawing operations
    let worldMouse = screenToWorld(mouseX, mouseY);
    let snapped = snapToGrid(worldMouse.x, worldMouse.y);

    // Selection mode - check for stitch selection or control point dragging
    if (selectionMode) {
      // Check if clicking on a control point first
      if (selectedStitch) {
        // Handle fill line selection differently
        if (selectedStitch.type === 'fillLine') {
          // Can't drag control points on individual fill lines
          draggingPoint = null;
        } else {
          draggingPoint = getControlPointAt(worldMouse.x, worldMouse.y, selectedStitch);
          if (draggingPoint) {
            return; // Start dragging
          }
        }
      }

      // Check if clicking on an existing stitch
      let clickedStitch = getStitchAt(worldMouse.x, worldMouse.y);
      if (clickedStitch) {
        saveUndoState();
        selectedStitch = clickedStitch;
      } else {
        selectedStitch = null;
      }
      return;
    }

    // Pen tool - start drawing path
    if (drawingMode === 'pen') {
      isDrawingPath = true;
      currentPath = [];
      currentPath.push({ x: worldMouse.x, y: worldMouse.y });
      return;
    }

    // Drawing mode
    let pos = freehandMode ? { x: worldMouse.x, y: worldMouse.y } : snapped;

    // Triangle tool - multi-click interaction
    if (drawingMode === 'fillTriangle') {
      if (!currentStitch) {
        // First click
        currentStitch = {
          points: [pos]
        };
      } else if (currentStitch.points.length === 1) {
        // Second click
        currentStitch.points.push(pos);
      } else if (currentStitch.points.length === 2) {
        // Third click - complete triangle
        currentStitch.points.push(pos);

        saveUndoState();
        let newStitch = {
          type: 'filledShape',
          shapeType: 'triangle',
          points: currentStitch.points,
          fillSpacing: gridSize,
          color: stitchColor,
          freehand: freehandMode
        };
        stitches.push(newStitch);
        currentStitch = null;
      }
      return;
    }

    if (drawingMode === 'curve' && currentStitch && currentStitch.controlX === undefined) {
      // Second click for curve: set control point
      currentStitch.controlX = pos.x;
      currentStitch.controlY = pos.y;
    } else {
      // First click for any shape or line
      currentStitch = {
        x1: pos.x,
        y1: pos.y
      };
    }
  }
}

function mouseReleased() {
  // Handle pen tool - finish drawing path
  if (isDrawingPath && drawingMode === 'pen') {
    isDrawingPath = false;

    if (currentPath.length > 2) {
      saveUndoState();

      // Smooth the path
      let smoothedPath = smoothPath(currentPath);

      // Optionally snap to grid if not in freehand mode
      if (!freehandMode) {
        smoothedPath = snapPathToGrid(smoothedPath);
      }

      // Create path stitch
      let newStitch = {
        type: 'path',
        points: smoothedPath,
        color: stitchColor,
        freehand: freehandMode
      };

      stitches.push(newStitch);
    }

    currentPath = [];
    return;
  }

  // Handle control point dragging release
  if (draggingPoint) {
    draggingPoint = null;
    return;
  }

  // Triangle tool - handled in mousePressed
  if (drawingMode === 'fillTriangle') {
    return;
  }

  if (currentStitch && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    let worldMouse = screenToWorld(mouseX, mouseY);
    let pos = freehandMode ? { x: worldMouse.x, y: worldMouse.y } : snapToGrid(worldMouse.x, worldMouse.y);

    // For curves, need to wait for control point
    if (drawingMode === 'curve' && currentStitch.controlX === undefined) {
      return; // Wait for control point click
    }

    // Check if shape has valid size
    let hasSize = false;
    if (drawingMode === 'circle' || drawingMode === 'fillCircle') {
      hasSize = dist(currentStitch.x1, currentStitch.y1, pos.x, pos.y) > 5;
    } else if (drawingMode === 'curve') {
      hasSize = currentStitch.controlX !== undefined;
    } else {
      hasSize = dist(currentStitch.x1, currentStitch.y1, pos.x, pos.y) > 5;
    }

    if (hasSize) {
      saveUndoState();

      // Check if it's a filled shape
      if (drawingMode === 'fillCircle') {
        let newStitch = {
          type: 'filledShape',
          shapeType: 'circle',
          x1: currentStitch.x1,
          y1: currentStitch.y1,
          x2: pos.x,
          y2: pos.y,
          radius: dist(currentStitch.x1, currentStitch.y1, pos.x, pos.y),
          fillSpacing: gridSize,
          color: stitchColor,
          freehand: freehandMode
        };
        stitches.push(newStitch);
      } else if (drawingMode === 'fillBox') {
        let newStitch = {
          type: 'filledShape',
          shapeType: 'box',
          x1: currentStitch.x1,
          y1: currentStitch.y1,
          x2: pos.x,
          y2: pos.y,
          fillSpacing: gridSize,
          color: stitchColor,
          freehand: freehandMode
        };
        stitches.push(newStitch);
      } else {
        // Regular shapes
        let newStitch = {
          type: drawingMode,
          x1: currentStitch.x1,
          y1: currentStitch.y1,
          x2: pos.x,
          y2: pos.y,
          color: stitchColor,
          freehand: freehandMode
        };

        if (drawingMode === 'circle') {
          newStitch.radius = dist(currentStitch.x1, currentStitch.y1, pos.x, pos.y);
        } else if (drawingMode === 'curve') {
          newStitch.controlX = currentStitch.controlX;
          newStitch.controlY = currentStitch.controlY;
        }

        stitches.push(newStitch);
      }
    }

    currentStitch = null;
  }
}

function mouseDragged() {
  // Handle camera panning with spacebar + drag
  if (isPanning) {
    let dx = mouseX - panStartMouse.x;
    let dy = mouseY - panStartMouse.y;
    camera.x = panStartCamera.x - dx / camera.zoom;
    camera.y = panStartCamera.y - dy / camera.zoom;
    return;
  }

  // Handle pen tool - add points to path
  if (isDrawingPath && drawingMode === 'pen') {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
      let worldMouse = screenToWorld(mouseX, mouseY);
      // Only add point if it's far enough from the last point (reduces noise)
      let lastPoint = currentPath[currentPath.length - 1];
      if (dist(worldMouse.x, worldMouse.y, lastPoint.x, lastPoint.y) > 3) {
        currentPath.push({ x: worldMouse.x, y: worldMouse.y });
      }
    }
    return;
  }

  // Handle dragging control points in selection mode
  if (selectionMode && draggingPoint && selectedStitch) {
    let worldMouse = screenToWorld(mouseX, mouseY);
    let pos = freehandMode ? { x: worldMouse.x, y: worldMouse.y } : snapToGrid(worldMouse.x, worldMouse.y);

    // Handle filled shape control points
    if (selectedStitch.type === 'filledShape') {
      if (draggingPoint === 'start') {
        selectedStitch.x1 = pos.x;
        selectedStitch.y1 = pos.y;
        // Update radius for circles
        if (selectedStitch.shapeType === 'circle') {
          selectedStitch.radius = dist(selectedStitch.x1, selectedStitch.y1, selectedStitch.x2, selectedStitch.y2);
        }
      } else if (draggingPoint === 'end') {
        selectedStitch.x2 = pos.x;
        selectedStitch.y2 = pos.y;
        // Update radius for circles
        if (selectedStitch.shapeType === 'circle') {
          selectedStitch.radius = dist(selectedStitch.x1, selectedStitch.y1, selectedStitch.x2, selectedStitch.y2);
        }
      } else if (draggingPoint && typeof draggingPoint === 'object' && draggingPoint.type === 'trianglePoint') {
        // Dragging a triangle vertex
        if (selectedStitch.points && draggingPoint.index < selectedStitch.points.length) {
          selectedStitch.points[draggingPoint.index] = { x: pos.x, y: pos.y };
        }
      }
      return;
    }

    if (draggingPoint === 'start') {
      selectedStitch.x1 = pos.x;
      selectedStitch.y1 = pos.y;
      // Update radius for circles
      if (selectedStitch.type === 'circle') {
        selectedStitch.radius = dist(selectedStitch.x1, selectedStitch.y1, selectedStitch.x2, selectedStitch.y2);
      }
    } else if (draggingPoint === 'end') {
      selectedStitch.x2 = pos.x;
      selectedStitch.y2 = pos.y;
      // Update radius for circles
      if (selectedStitch.type === 'circle') {
        selectedStitch.radius = dist(selectedStitch.x1, selectedStitch.y1, selectedStitch.x2, selectedStitch.y2);
      }
    } else if (draggingPoint === 'control' && selectedStitch.type === 'curve') {
      selectedStitch.controlX = pos.x;
      selectedStitch.controlY = pos.y;
    } else if (draggingPoint && typeof draggingPoint === 'object' && draggingPoint.type === 'pathPoint') {
      // Dragging a path point
      if (selectedStitch.points && draggingPoint.index < selectedStitch.points.length) {
        selectedStitch.points[draggingPoint.index] = { x: pos.x, y: pos.y };
      }
    }
  }
}

function drawDashedCircle(cx, cy, radius, col, isFreehand = false) {
  stroke(col);
  strokeWeight(3);
  strokeCap(ROUND);
  noFill();

  let circumference = TWO_PI * radius;
  let dashLength = isFreehand ? stitchLength : stitchLength;
  let gapLength = dashLength * gapRatio;
  let totalSegment = dashLength + gapLength;
  let numSegments = circumference / totalSegment;

  for (let i = 0; i < numSegments; i++) {
    let startAngle = (i * totalSegment) / radius;
    let endAngle = startAngle + (dashLength / radius);

    let x1 = cx + cos(startAngle) * radius;
    let y1 = cy + sin(startAngle) * radius;
    let x2 = cx + cos(endAngle) * radius;
    let y2 = cy + sin(endAngle) * radius;

    line(x1, y1, x2, y2);
  }
}

function drawDashedBox(x1, y1, x2, y2, col, isFreehand = false) {
  // Draw four sides of the box
  drawDashedLine(x1, y1, x2, y1, col, isFreehand); // Top
  drawDashedLine(x2, y1, x2, y2, col, isFreehand); // Right
  drawDashedLine(x2, y2, x1, y2, col, isFreehand); // Bottom
  drawDashedLine(x1, y2, x1, y1, col, isFreehand); // Left
}

function drawDashedCurve(x1, y1, cx, cy, x2, y2, col, isFreehand = false) {
  stroke(col);
  strokeWeight(3);
  strokeCap(ROUND);
  noFill();

  // Calculate approximate curve length using multiple points
  let steps = 50;
  let curveLength = 0;
  let prevX = x1;
  let prevY = y1;

  for (let i = 1; i <= steps; i++) {
    let t = i / steps;
    let x = quadraticPoint(x1, cx, x2, t);
    let y = quadraticPoint(y1, cy, y2, t);
    curveLength += dist(prevX, prevY, x, y);
    prevX = x;
    prevY = y;
  }

  // Draw dashed pattern along curve
  let dashLength = stitchLength;
  let gapLength = dashLength * gapRatio;
  let totalSegment = dashLength + gapLength;
  let numSegments = curveLength / totalSegment;

  let currentLength = 0;
  let drawing = true;
  let segmentStart = 0;

  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let x = quadraticPoint(x1, cx, x2, t);
    let y = quadraticPoint(y1, cy, y2, t);

    if (i > 0) {
      let segmentLength = dist(prevX, prevY, x, y);
      currentLength += segmentLength;

      let segmentProgress = currentLength % totalSegment;
      let shouldDraw = segmentProgress < dashLength;

      if (shouldDraw) {
        line(prevX, prevY, x, y);
      }
    }

    prevX = x;
    prevY = y;
  }
}

function quadraticPoint(p0, p1, p2, t) {
  // Quadratic Bezier curve formula
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

// ========== Filled Shape Functions ==========

/**
 * Generate cross-hatch fill pattern for a shape
 * Returns array of line segments to be drawn with dashing
 */
function generateCrossHatchFill(stitch) {
  let fillLines = [];
  let spacing = stitch.fillSpacing || gridSize;

  if (stitch.shapeType === 'box') {
    fillLines = generateBoxFill(stitch, spacing);
  } else if (stitch.shapeType === 'circle') {
    fillLines = generateCircleFill(stitch, spacing);
  } else if (stitch.shapeType === 'triangle') {
    fillLines = generateTriangleFill(stitch, spacing);
  }

  return fillLines;
}

/**
 * Generate fill lines for a box - radiating from center point
 */
function generateBoxFill(stitch, spacing) {
  let lines = [];
  let minX = min(stitch.x1, stitch.x2);
  let maxX = max(stitch.x1, stitch.x2);
  let minY = min(stitch.y1, stitch.y2);
  let maxY = max(stitch.y1, stitch.y2);

  // Calculate center point of the box
  let centerX = (minX + maxX) / 2;
  let centerY = (minY + maxY) / 2;

  // Use double spacing (2 grid units) for proper cross-hatch intersection
  let effectiveSpacing = spacing * 2;

  // Vertical lines - radiating from center horizontally
  // Center line
  lines.push({ x1: centerX, y1: minY, x2: centerX, y2: maxY });

  // Lines to the left of center
  for (let x = centerX - effectiveSpacing; x >= minX; x -= effectiveSpacing) {
    lines.push({ x1: x, y1: minY, x2: x, y2: maxY });
  }

  // Lines to the right of center
  for (let x = centerX + effectiveSpacing; x <= maxX; x += effectiveSpacing) {
    lines.push({ x1: x, y1: minY, x2: x, y2: maxY });
  }

  // Horizontal lines - radiating from center vertically
  // Center line
  lines.push({ x1: minX, y1: centerY, x2: maxX, y2: centerY });

  // Lines above center
  for (let y = centerY - effectiveSpacing; y >= minY; y -= effectiveSpacing) {
    lines.push({ x1: minX, y1: y, x2: maxX, y2: y });
  }

  // Lines below center
  for (let y = centerY + effectiveSpacing; y <= maxY; y += effectiveSpacing) {
    lines.push({ x1: minX, y1: y, x2: maxX, y2: y });
  }

  return lines;
}

/**
 * Generate fill lines for a circle - radiating from center point
 */
function generateCircleFill(stitch, spacing) {
  let lines = [];
  let cx = stitch.x1;
  let cy = stitch.y1;
  let radius = stitch.radius;

  // Calculate bounding box
  let minX = cx - radius;
  let maxX = cx + radius;
  let minY = cy - radius;
  let maxY = cy + radius;

  // Use double spacing (2 grid units) for proper cross-hatch intersection
  let effectiveSpacing = spacing * 2;

  // Vertical lines - radiating from center horizontally
  // Center line
  let centerLine = clipLineToCircle(cx, minY, cx, maxY, cx, cy, radius);
  if (centerLine) lines.push(centerLine);

  // Lines to the left of center
  for (let x = cx - effectiveSpacing; x >= minX; x -= effectiveSpacing) {
    let clipped = clipLineToCircle(x, minY, x, maxY, cx, cy, radius);
    if (clipped) lines.push(clipped);
  }

  // Lines to the right of center
  for (let x = cx + effectiveSpacing; x <= maxX; x += effectiveSpacing) {
    let clipped = clipLineToCircle(x, minY, x, maxY, cx, cy, radius);
    if (clipped) lines.push(clipped);
  }

  // Horizontal lines - radiating from center vertically
  // Center line
  centerLine = clipLineToCircle(minX, cy, maxX, cy, cx, cy, radius);
  if (centerLine) lines.push(centerLine);

  // Lines above center
  for (let y = cy - effectiveSpacing; y >= minY; y -= effectiveSpacing) {
    let clipped = clipLineToCircle(minX, y, maxX, y, cx, cy, radius);
    if (clipped) lines.push(clipped);
  }

  // Lines below center
  for (let y = cy + effectiveSpacing; y <= maxY; y += effectiveSpacing) {
    let clipped = clipLineToCircle(minX, y, maxX, y, cx, cy, radius);
    if (clipped) lines.push(clipped);
  }

  return lines;
}

/**
 * Generate fill lines for a triangle - radiating from center point
 */
function generateTriangleFill(stitch, spacing) {
  let lines = [];

  if (!stitch.points || stitch.points.length < 3) return lines;

  // Calculate bounding box
  let minX = min(stitch.points[0].x, stitch.points[1].x, stitch.points[2].x);
  let maxX = max(stitch.points[0].x, stitch.points[1].x, stitch.points[2].x);
  let minY = min(stitch.points[0].y, stitch.points[1].y, stitch.points[2].y);
  let maxY = max(stitch.points[0].y, stitch.points[1].y, stitch.points[2].y);

  // Calculate center point (centroid) of triangle
  let centerX = (stitch.points[0].x + stitch.points[1].x + stitch.points[2].x) / 3;
  let centerY = (stitch.points[0].y + stitch.points[1].y + stitch.points[2].y) / 3;

  // Use double spacing (2 grid units) for proper cross-hatch intersection
  let effectiveSpacing = spacing * 2;

  // Vertical lines - radiating from center horizontally
  // Center line
  let centerLine = clipLineToTriangle(centerX, minY, centerX, maxY, stitch.points);
  if (centerLine) lines.push(centerLine);

  // Lines to the left of center
  for (let x = centerX - effectiveSpacing; x >= minX; x -= effectiveSpacing) {
    let clipped = clipLineToTriangle(x, minY, x, maxY, stitch.points);
    if (clipped) lines.push(clipped);
  }

  // Lines to the right of center
  for (let x = centerX + effectiveSpacing; x <= maxX; x += effectiveSpacing) {
    let clipped = clipLineToTriangle(x, minY, x, maxY, stitch.points);
    if (clipped) lines.push(clipped);
  }

  // Horizontal lines - radiating from center vertically
  // Center line
  centerLine = clipLineToTriangle(minX, centerY, maxX, centerY, stitch.points);
  if (centerLine) lines.push(centerLine);

  // Lines above center
  for (let y = centerY - effectiveSpacing; y >= minY; y -= effectiveSpacing) {
    let clipped = clipLineToTriangle(minX, y, maxX, y, stitch.points);
    if (clipped) lines.push(clipped);
  }

  // Lines below center
  for (let y = centerY + effectiveSpacing; y <= maxY; y += effectiveSpacing) {
    let clipped = clipLineToTriangle(minX, y, maxX, y, stitch.points);
    if (clipped) lines.push(clipped);
  }

  return lines;
}

/**
 * Clip a line to a circle boundary
 * Returns clipped line segment or null if no intersection
 */
function clipLineToCircle(x1, y1, x2, y2, cx, cy, radius) {
  // Translate so circle is at origin
  let dx = x2 - x1;
  let dy = y2 - y1;
  let fx = x1 - cx;
  let fy = y1 - cy;

  // Quadratic equation coefficients for line-circle intersection
  let a = dx * dx + dy * dy;
  let b = 2 * (fx * dx + fy * dy);
  let c = fx * fx + fy * fy - radius * radius;

  let discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return null; // No intersection
  }

  let sqrtDisc = sqrt(discriminant);
  let t1 = (-b - sqrtDisc) / (2 * a);
  let t2 = (-b + sqrtDisc) / (2 * a);

  // Clamp to [0, 1] range (line segment)
  t1 = constrain(t1, 0, 1);
  t2 = constrain(t2, 0, 1);

  if (t1 > t2) return null; // No valid intersection

  // Calculate intersection points
  let ix1 = x1 + t1 * dx;
  let iy1 = y1 + t1 * dy;
  let ix2 = x1 + t2 * dx;
  let iy2 = y1 + t2 * dy;

  return { x1: ix1, y1: iy1, x2: ix2, y2: iy2 };
}

/**
 * Clip a line to a triangle boundary
 * Returns clipped line segment or null if no intersection
 */
function clipLineToTriangle(x1, y1, x2, y2, trianglePoints) {
  let intersections = [];

  // Check intersection with each edge of the triangle
  for (let i = 0; i < 3; i++) {
    let p1 = trianglePoints[i];
    let p2 = trianglePoints[(i + 1) % 3];

    let intersection = lineLineIntersection(x1, y1, x2, y2, p1.x, p1.y, p2.x, p2.y);
    if (intersection) {
      intersections.push(intersection);
    }
  }

  // Also check if endpoints are inside the triangle
  if (pointInTriangle(x1, y1, trianglePoints)) {
    intersections.push({ x: x1, y: y1 });
  }
  if (pointInTriangle(x2, y2, trianglePoints)) {
    intersections.push({ x: x2, y: y2 });
  }

  // Remove duplicate points
  intersections = removeDuplicatePoints(intersections);

  if (intersections.length < 2) {
    return null; // No valid clipped segment
  }

  // Return the first two intersection points
  return {
    x1: intersections[0].x,
    y1: intersections[0].y,
    x2: intersections[1].x,
    y2: intersections[1].y
  };
}

/**
 * Calculate intersection point between two line segments
 */
function lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  let denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (abs(denom) < 0.001) {
    return null; // Lines are parallel
  }

  let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  // Check if intersection is within both line segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  return null;
}

/**
 * Check if a point is inside a triangle using barycentric coordinates
 */
function pointInTriangle(px, py, trianglePoints) {
  let p0 = trianglePoints[0];
  let p1 = trianglePoints[1];
  let p2 = trianglePoints[2];

  let area = 0.5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
  let s = 1 / (2 * area) * (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * px + (p0.x - p2.x) * py);
  let t = 1 / (2 * area) * (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * px + (p1.x - p0.x) * py);

  return s >= 0 && t >= 0 && (1 - s - t) >= 0;
}

/**
 * Remove duplicate points from an array
 */
function removeDuplicatePoints(points) {
  let unique = [];
  let threshold = 0.1; // Points closer than this are considered duplicates

  for (let p of points) {
    let isDuplicate = false;
    for (let u of unique) {
      if (dist(p.x, p.y, u.x, u.y) < threshold) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      unique.push(p);
    }
  }

  return unique;
}

/**
 * Draw a filled shape with cross-hatch pattern
 */
function drawFilledShape(stitch) {
  let fillLines = generateCrossHatchFill(stitch);

  // Draw each fill line with dashing - use special fill mode for proper intersections
  // forFill flag ensures stitches are centered and spaced for proper cross-hatch
  for (let line of fillLines) {
    drawDashedLine(line.x1, line.y1, line.x2, line.y2, stitch.color, true, true);
  }

  // Outline is not drawn - filled shapes only show the cross-hatch pattern
}

function drawPathPreview(points, col) {
  // Draw the current path being drawn (before smoothing)
  stroke(col);
  strokeWeight(3);
  strokeCap(ROUND);
  noFill();

  beginShape();
  for (let point of points) {
    vertex(point.x, point.y);
  }
  endShape();
}

function drawDashedPath(points, col, isFreehand = false) {
  // Draw a dashed line along the path
  stroke(col);
  strokeWeight(3);
  strokeCap(ROUND);
  noFill();

  let dashLength = stitchLength;
  let gapLength = dashLength * gapRatio;
  let totalSegment = dashLength + gapLength;

  let currentLength = 0;
  let segmentProgress = 0;

  for (let i = 1; i < points.length; i++) {
    let x1 = points[i - 1].x;
    let y1 = points[i - 1].y;
    let x2 = points[i].x;
    let y2 = points[i].y;

    let segmentLength = dist(x1, y1, x2, y2);
    let steps = ceil(segmentLength / 2); // Fine-grained steps for smooth dashes

    for (let j = 0; j < steps; j++) {
      let t1 = j / steps;
      let t2 = (j + 1) / steps;

      let px1 = lerp(x1, x2, t1);
      let py1 = lerp(y1, y2, t1);
      let px2 = lerp(x1, x2, t2);
      let py2 = lerp(y1, y2, t2);

      let microLength = dist(px1, py1, px2, py2);
      let shouldDraw = (currentLength % totalSegment) < dashLength;

      if (shouldDraw) {
        line(px1, py1, px2, py2);
      }

      currentLength += microLength;
    }
  }
}

function smoothPath(points) {
  // Reduce points using Douglas-Peucker algorithm
  let simplified = douglasPeucker(points, 5); // Tolerance of 5 pixels

  // Apply Chaikin's corner cutting for smoothness
  let smoothed = chaikinSmooth(simplified, 2); // 2 iterations

  return smoothed;
}

function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;

  // Find the point with maximum distance from line between first and last
  let maxDist = 0;
  let index = 0;
  let end = points.length - 1;

  for (let i = 1; i < end; i++) {
    let d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    let left = douglasPeucker(points.slice(0, index + 1), tolerance);
    let right = douglasPeucker(points.slice(index), tolerance);

    // Combine results (remove duplicate point at index)
    return left.slice(0, -1).concat(right);
  } else {
    return [points[0], points[end]];
  }
}

function perpendicularDistance(point, lineStart, lineEnd) {
  let dx = lineEnd.x - lineStart.x;
  let dy = lineEnd.y - lineStart.y;

  let numerator = abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  let denominator = sqrt(dx * dx + dy * dy);

  return denominator === 0 ? dist(point.x, point.y, lineStart.x, lineStart.y) : numerator / denominator;
}

function chaikinSmooth(points, iterations) {
  if (points.length < 3) return points;

  let smoothed = points.slice();

  for (let iter = 0; iter < iterations; iter++) {
    let newPoints = [smoothed[0]]; // Keep first point

    for (let i = 0; i < smoothed.length - 1; i++) {
      let p0 = smoothed[i];
      let p1 = smoothed[i + 1];

      // Create two new points at 1/4 and 3/4 along the line
      newPoints.push({
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y
      });
      newPoints.push({
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y
      });
    }

    newPoints.push(smoothed[smoothed.length - 1]); // Keep last point
    smoothed = newPoints;
  }

  return smoothed;
}

function snapPathToGrid(points) {
  // Snap each point in the path to the nearest grid point
  return points.map(point => {
    return {
      x: round(point.x / gridSize) * gridSize,
      y: round(point.y / gridSize) * gridSize
    };
  });
}

function setDrawingMode(mode) {
  drawingMode = mode;
  selectionMode = false;
  selectedStitch = null;

  // Reset pen tool state
  isDrawingPath = false;
  currentPath = [];

  // Update select button state
  if (selectBtn) {
    selectBtn.removeClass('active');
  }

  // Update button active states
  for (let tool in toolButtons) {
    if (tool === mode) {
      toolButtons[tool].addClass('active');
    } else {
      toolButtons[tool].removeClass('active');
    }
  }
}

function toggleSelectionMode() {
  selectionMode = !selectionMode;

  if (selectionMode) {
    selectBtn.addClass('active');
    // Deactivate drawing tools
    for (let tool in toolButtons) {
      toolButtons[tool].removeClass('active');
    }
    currentStitch = null;
  } else {
    selectBtn.removeClass('active');
    selectedStitch = null;
    draggingPoint = null;
  }
}

function getStitchAt(x, y) {
  const threshold = 10;

  // Check in reverse order (most recent first)
  for (let i = stitches.length - 1; i >= 0; i--) {
    let stitch = stitches[i];
    let type = stitch.type || 'line';

    // Check filled shapes - both the shape itself and individual fill lines
    if (type === 'filledShape') {
      // First check if clicking on individual fill lines
      let fillLines = generateCrossHatchFill(stitch);
      for (let line of fillLines) {
        if (distToSegment(x, y, line.x1, line.y1, line.x2, line.y2) < threshold) {
          // Return a special object indicating we selected a fill line
          return {
            stitch: stitch,
            fillLine: line,
            type: 'fillLine'
          };
        }
      }

      // Then check the outline
      if (stitch.shapeType === 'circle') {
        let radius = stitch.radius;
        let distToCenter = dist(x, y, stitch.x1, stitch.y1);
        if (abs(distToCenter - radius) < threshold) {
          return stitch;
        }
      } else if (stitch.shapeType === 'box') {
        // Check all four sides
        if (distToSegment(x, y, stitch.x1, stitch.y1, stitch.x2, stitch.y1) < threshold ||
          distToSegment(x, y, stitch.x2, stitch.y1, stitch.x2, stitch.y2) < threshold ||
          distToSegment(x, y, stitch.x2, stitch.y2, stitch.x1, stitch.y2) < threshold ||
          distToSegment(x, y, stitch.x1, stitch.y2, stitch.x1, stitch.y1) < threshold) {
          return stitch;
        }
      } else if (stitch.shapeType === 'triangle' && stitch.points && stitch.points.length >= 3) {
        // Check all three sides
        for (let j = 0; j < 3; j++) {
          let p1 = stitch.points[j];
          let p2 = stitch.points[(j + 1) % 3];
          if (distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) < threshold) {
            return stitch;
          }
        }
      }
      continue;
    }

    if (type === 'line') {
      if (distToSegment(x, y, stitch.x1, stitch.y1, stitch.x2, stitch.y2) < threshold) {
        return stitch;
      }
    } else if (type === 'circle') {
      let distToCenter = dist(x, y, stitch.x1, stitch.y1);
      if (abs(distToCenter - stitch.radius) < threshold) {
        return stitch;
      }
    } else if (type === 'box') {
      // Check all four sides
      if (distToSegment(x, y, stitch.x1, stitch.y1, stitch.x2, stitch.y1) < threshold ||
        distToSegment(x, y, stitch.x2, stitch.y1, stitch.x2, stitch.y2) < threshold ||
        distToSegment(x, y, stitch.x2, stitch.y2, stitch.x1, stitch.y2) < threshold ||
        distToSegment(x, y, stitch.x1, stitch.y2, stitch.x1, stitch.y1) < threshold) {
        return stitch;
      }
    } else if (type === 'curve') {
      // Approximate curve with line segments
      let steps = 20;
      for (let j = 0; j < steps; j++) {
        let t1 = j / steps;
        let t2 = (j + 1) / steps;
        let x1 = quadraticPoint(stitch.x1, stitch.controlX, stitch.x2, t1);
        let y1 = quadraticPoint(stitch.y1, stitch.controlY, stitch.y2, t1);
        let x2 = quadraticPoint(stitch.x1, stitch.controlX, stitch.x2, t2);
        let y2 = quadraticPoint(stitch.y1, stitch.controlY, stitch.y2, t2);

        if (distToSegment(x, y, x1, y1, x2, y2) < threshold) {
          return stitch;
        }
      }
    } else if (type === 'path') {
      // Check distance to any segment in the path
      if (stitch.points && stitch.points.length > 1) {
        for (let j = 1; j < stitch.points.length; j++) {
          let p1 = stitch.points[j - 1];
          let p2 = stitch.points[j];
          if (distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) < threshold) {
            return stitch;
          }
        }
      }
    } else if (type === 'filledShape') {
      // Check if point is inside the shape
      if (stitch.shapeType === 'circle') {
        let distToCenter = dist(x, y, stitch.x1, stitch.y1);
        if (distToCenter <= stitch.radius) {
          return stitch;
        }
      } else if (stitch.shapeType === 'box') {
        let minX = min(stitch.x1, stitch.x2);
        let maxX = max(stitch.x1, stitch.x2);
        let minY = min(stitch.y1, stitch.y2);
        let maxY = max(stitch.y1, stitch.y2);
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          return stitch;
        }
      } else if (stitch.shapeType === 'triangle' && stitch.points) {
        if (pointInTriangle(x, y, stitch.points)) {
          return stitch;
        }
      }
    }
  }

  return null;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  let len = dx * dx + dy * dy;

  if (len === 0) return dist(px, py, x1, y1);

  let t = ((px - x1) * dx + (py - y1) * dy) / len;
  t = constrain(t, 0, 1);

  let closestX = x1 + t * dx;
  let closestY = y1 + t * dy;

  return dist(px, py, closestX, closestY);
}

function getControlPointAt(x, y, stitch) {
  const threshold = 15;

  if (!stitch) return null;

  // For filled shapes, check control points based on shape type
  if (stitch.type === 'filledShape') {
    if (stitch.shapeType === 'circle') {
      // Center point
      if (dist(x, y, stitch.x1, stitch.y1) < threshold) {
        return 'start';
      }
      // Edge point (for radius control)
      if (dist(x, y, stitch.x2, stitch.y2) < threshold) {
        return 'end';
      }
    } else if (stitch.shapeType === 'box') {
      // Check corners
      if (dist(x, y, stitch.x1, stitch.y1) < threshold) {
        return 'start';
      }
      if (dist(x, y, stitch.x2, stitch.y2) < threshold) {
        return 'end';
      }
    } else if (stitch.shapeType === 'triangle' && stitch.points) {
      // Check all three vertices
      for (let i = 0; i < stitch.points.length; i++) {
        if (dist(x, y, stitch.points[i].x, stitch.points[i].y) < threshold) {
          return { type: 'trianglePoint', index: i };
        }
      }
    }
    return null;
  }

  // Check start point
  if (dist(x, y, stitch.x1, stitch.y1) < threshold) {
    return 'start';
  }

  // Check end point (for non-circle shapes)
  if (stitch.type !== 'circle' && dist(x, y, stitch.x2, stitch.y2) < threshold) {
    return 'end';
  }

  // Check control point for curves
  if (stitch.type === 'curve' && dist(x, y, stitch.controlX, stitch.controlY) < threshold) {
    return 'control';
  }

  // Check path points
  if (stitch.type === 'path' && stitch.points) {
    for (let i = 0; i < stitch.points.length; i++) {
      if (dist(x, y, stitch.points[i].x, stitch.points[i].y) < threshold) {
        return { type: 'pathPoint', index: i };
      }
    }
  }

  return null;
}

function drawSelectedStitchHighlight() {
  if (!selectedStitch) return;

  let type = selectedStitch.type || 'line';

  // Draw highlight
  strokeWeight(6);
  stroke(255, 255, 0, 100);
  noFill();

  // Handle individual fill line selection
  if (type === 'fillLine') {
    let fillLine = selectedStitch.fillLine;
    line(fillLine.x1, fillLine.y1, fillLine.x2, fillLine.y2);

    // Also draw control points at endpoints
    fill(255, 255, 0);
    noStroke();
    circle(fillLine.x1, fillLine.y1, 10);
    circle(fillLine.x2, fillLine.y2, 10);
    return;
  }

  if (type === 'line') {
    line(selectedStitch.x1, selectedStitch.y1, selectedStitch.x2, selectedStitch.y2);
  } else if (type === 'circle') {
    circle(selectedStitch.x1, selectedStitch.y1, selectedStitch.radius * 2);
  } else if (type === 'box') {
    rect(min(selectedStitch.x1, selectedStitch.x2),
      min(selectedStitch.y1, selectedStitch.y2),
      abs(selectedStitch.x2 - selectedStitch.x1),
      abs(selectedStitch.y2 - selectedStitch.y1));
  } else if (type === 'curve') {
    noFill();
    beginShape();
    for (let t = 0; t <= 1; t += 0.05) {
      let x = quadraticPoint(selectedStitch.x1, selectedStitch.controlX, selectedStitch.x2, t);
      let y = quadraticPoint(selectedStitch.y1, selectedStitch.controlY, selectedStitch.y2, t);
      vertex(x, y);
    }
    endShape();
  } else if (type === 'path') {
    if (selectedStitch.points && selectedStitch.points.length > 0) {
      beginShape();
      for (let point of selectedStitch.points) {
        vertex(point.x, point.y);
      }
      endShape();
    }
  } else if (type === 'filledShape') {
    // Highlight the outline of filled shapes
    if (selectedStitch.shapeType === 'circle') {
      circle(selectedStitch.x1, selectedStitch.y1, selectedStitch.radius * 2);
    } else if (selectedStitch.shapeType === 'box') {
      rect(min(selectedStitch.x1, selectedStitch.x2),
        min(selectedStitch.y1, selectedStitch.y2),
        abs(selectedStitch.x2 - selectedStitch.x1),
        abs(selectedStitch.y2 - selectedStitch.y1));
    } else if (selectedStitch.shapeType === 'triangle' && selectedStitch.points) {
      beginShape();
      for (let point of selectedStitch.points) {
        vertex(point.x, point.y);
      }
      endShape(CLOSE);
    }
  }
}

function drawControlPoints() {
  if (!selectedStitch) return;

  // Fill lines don't have draggable control points
  if (selectedStitch.type === 'fillLine') {
    return;
  }

  // Handle filled shapes
  if (selectedStitch.type === 'filledShape') {
    fill(255, 255, 0);
    noStroke();

    if (selectedStitch.shapeType === 'circle') {
      // Center point
      circle(selectedStitch.x1, selectedStitch.y1, 10);
      // Edge point for radius control
      circle(selectedStitch.x2, selectedStitch.y2, 10);
    } else if (selectedStitch.shapeType === 'box') {
      // Two corner points
      circle(selectedStitch.x1, selectedStitch.y1, 10);
      circle(selectedStitch.x2, selectedStitch.y2, 10);
    } else if (selectedStitch.shapeType === 'triangle' && selectedStitch.points) {
      // All three vertices
      for (let i = 0; i < selectedStitch.points.length; i++) {
        let point = selectedStitch.points[i];
        if (draggingPoint && typeof draggingPoint === 'object' &&
          draggingPoint.type === 'trianglePoint' && draggingPoint.index === i) {
          fill(255, 100, 100);
          circle(point.x, point.y, 14);
        } else {
          fill(255, 255, 0);
          circle(point.x, point.y, 10);
        }
      }
    }
    return;
  }

  if (selectedStitch.type === 'path') {
    // Draw all path points
    if (selectedStitch.points) {
      for (let i = 0; i < selectedStitch.points.length; i++) {
        let point = selectedStitch.points[i];

        // Highlight the currently selected/dragging point
        if (draggingPoint && typeof draggingPoint === 'object' &&
          draggingPoint.type === 'pathPoint' && draggingPoint.index === i) {
          fill(255, 100, 100); // Red for selected point
          noStroke();
          circle(point.x, point.y, 14);

          // Draw indicator showing merge direction
          stroke(255, 100, 100, 150);
          strokeWeight(2);
          if (i < selectedStitch.points.length - 1) {
            let nextPoint = selectedStitch.points[i + 1];
            line(point.x, point.y, nextPoint.x, nextPoint.y);
          }
        } else {
          fill(255, 255, 0);
          noStroke();
          circle(point.x, point.y, 10);
        }
      }
    }
  } else {
    fill(255, 255, 0);
    noStroke();

    // Draw start point
    circle(selectedStitch.x1, selectedStitch.y1, 10);

    // Draw end point (for non-circle shapes)
    if (selectedStitch.type !== 'circle') {
      circle(selectedStitch.x2, selectedStitch.y2, 10);
    }

    // Draw control point for curves
    if (selectedStitch.type === 'curve') {
      fill(255, 150, 0);
      circle(selectedStitch.controlX, selectedStitch.controlY, 10);

      // Draw control lines
      stroke(255, 150, 0, 100);
      strokeWeight(1);
      line(selectedStitch.x1, selectedStitch.y1, selectedStitch.controlX, selectedStitch.controlY);
      line(selectedStitch.controlX, selectedStitch.controlY, selectedStitch.x2, selectedStitch.y2);
    }
  }
}

function deleteSelectedStitch() {
  if (selectedStitch) {
    saveUndoState();
    let index = stitches.indexOf(selectedStitch);
    if (index > -1) {
      stitches.splice(index, 1);
      selectedStitch = null;
    }
  }
}

function saveUndoState() {
  // Deep copy of stitches array
  let state = JSON.parse(JSON.stringify(stitches));
  undoStack.push(state);

  // Limit undo stack size
  if (undoStack.length > MAX_UNDO) {
    undoStack.shift();
  }
}

function deletePathPoint() {
  // Delete a specific point from a path
  if (selectedStitch && selectedStitch.type === 'path' &&
    draggingPoint && typeof draggingPoint === 'object' &&
    draggingPoint.type === 'pathPoint') {

    // Need at least 2 points to keep a path
    if (selectedStitch.points.length <= 2) {
      alert('Cannot delete point - path needs at least 2 points. Delete the entire path instead.');
      return;
    }

    saveUndoState();
    selectedStitch.points.splice(draggingPoint.index, 1);
    draggingPoint = null;
  }
}

function mergePathPoints() {
  // Merge two adjacent points in a path
  if (selectedStitch && selectedStitch.type === 'path' &&
    draggingPoint && typeof draggingPoint === 'object' &&
    draggingPoint.type === 'pathPoint') {

    let index = draggingPoint.index;

    // Can't merge if we're at the last point
    if (index >= selectedStitch.points.length - 1) {
      alert('Cannot merge - this is the last point. Select an earlier point to merge with the next one.');
      return;
    }

    // Need at least 3 points to merge
    if (selectedStitch.points.length <= 2) {
      alert('Cannot merge - path needs at least 3 points.');
      return;
    }

    saveUndoState();

    // Calculate midpoint between current and next point
    let p1 = selectedStitch.points[index];
    let p2 = selectedStitch.points[index + 1];
    let midpoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };

    // Replace current point with midpoint and remove next point
    selectedStitch.points[index] = midpoint;
    selectedStitch.points.splice(index + 1, 1);

    // Update dragging point index
    draggingPoint = { type: 'pathPoint', index: index };
  }
}

function undo() {
  if (undoStack.length > 0) {
    let previousState = undoStack.pop();

    // Restore color objects from serialized data
    stitches = previousState.map(stitch => {
      if (stitch.color && typeof stitch.color === 'object') {
        let c = stitch.color;
        stitch.color = color(c.levels[0], c.levels[1], c.levels[2], c.levels[3] || 255);
      }
      return stitch;
    });

    selectedStitch = null;
  }
}

function snapToGrid(x, y) {
  return {
    x: round(x / gridSize) * gridSize,
    y: round(y / gridSize) * gridSize
  };
}

function toggleGrid() {
  showGrid = !showGrid;
}

function clearCanvas() {
  if (stitches.length > 0) {
    saveUndoState();
  }
  stitches = [];
  currentStitch = null;
  selectedStitch = null;
}

function savePattern() {
  saveCanvas('sashiko-pattern', 'png');
}

// Keyboard shortcuts
function keyPressed() {
  // Camera controls
  if (key === '0') {
    // Reset view with '0' key
    resetView();
    return false;
  } else if (key === '+' || key === '=') {
    // Zoom in with + key
    zoomIn();
    return false;
  } else if (key === '-' || key === '_') {
    // Zoom out with - key
    zoomOut();
    return false;
  }

  // Existing keyboard shortcuts
  if (key === 'g' || key === 'G') {
    toggleGrid();
  } else if (key === 'c' || key === 'C') {
    clearCanvas();
  } else if (key === 's' || key === 'S') {
    savePattern();
  } else if ((key === 'z' || key === 'Z') && (keyIsDown(CONTROL) || keyIsDown(91))) {
    // Ctrl+Z or Cmd+Z for undo
    undo();
  } else if (key === 'v' || key === 'V') {
    // Toggle selection mode with 'v'
    toggleSelectionMode();
  } else if ((key === 'Delete' || key === 'Backspace') && selectedStitch) {
    // Delete selected stitch or path point
    if (selectedStitch.type === 'path' && draggingPoint &&
      typeof draggingPoint === 'object' && draggingPoint.type === 'pathPoint') {
      // Delete specific path point
      deletePathPoint();
    } else {
      // Delete entire stitch
      deleteSelectedStitch();
    }
  } else if ((key === 'm' || key === 'M') && selectedStitch && selectedStitch.type === 'path') {
    // Merge path points with 'm'
    mergePathPoints();
  } else if (key === 'Escape') {
    // Deselect
    selectedStitch = null;
    selectionMode = false;
    draggingPoint = null;
    if (selectBtn) selectBtn.removeClass('active');
  }
}

function keyReleased() {
  // Stop panning when spacebar is released
  if (keyCode === 32) {
    isPanning = false;
  }
}