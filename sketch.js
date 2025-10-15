// Sashiko Pattern Designer
let gridSize = 20;
let showGrid = true;
let stitches = [];
let currentStitch = null;
let stitchColor;
let bgColor;
let stitchLength = 10; // Configurable stitch length
let stitchLock = false; // Lock stitch length to grid size
let freehandMode = false; // Draw without snapping to grid
let drawingMode = 'line'; // Current drawing tool: line, circle, box, curve, pen

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
let toggleGridBtn, clearBtn, saveBtn, gridSizeSlider, colorPicker, stitchLengthSlider, stitchLockCheckbox, freehandCheckbox;
let selectBtn, deleteBtn, undoBtn;
let toolButtons = {};

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container');

  bgColor = color(20, 30, 60); // Traditional indigo-like background
  stitchColor = color(255); // White stitches

  // Get UI elements
  toggleGridBtn = select('#toggleGrid');
  clearBtn = select('#clear');
  saveBtn = select('#savePattern');
  gridSizeSlider = select('#gridSize');
  colorPicker = select('#stitchColor');
  stitchLengthSlider = select('#stitchLength');
  stitchLockCheckbox = select('#stitchLock');
  freehandCheckbox = select('#freehand');

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

  // Add event listeners
  toggleGridBtn.mousePressed(toggleGrid);
  clearBtn.mousePressed(clearCanvas);
  saveBtn.mousePressed(savePattern);
  selectBtn.mousePressed(toggleSelectionMode);
  //deleteBtn.mousePressed(deleteSelectedStitch);
  undoBtn.mousePressed(undo);
  gridSizeSlider.input(() => {
    gridSize = gridSizeSlider.value();
    if (stitchLock) {
      stitchLength = gridSize;
      stitchLengthSlider.value(stitchLength);
    }
  });
  colorPicker.input(() => {
    stitchColor = color(colorPicker.value());
    // If a stitch is selected, change its color too
    if (selectedStitch) {
      saveUndoState();
      selectedStitch.color = stitchColor;
    }
  });
  stitchLengthSlider.input(() => {
    stitchLength = stitchLengthSlider.value();
  });
  stitchLockCheckbox.changed(() => {
    stitchLock = stitchLockCheckbox.checked();
    if (stitchLock) {
      stitchLength = gridSize;
      stitchLengthSlider.value(stitchLength);
      stitchLengthSlider.attribute('disabled', '');
    } else {
      stitchLengthSlider.removeAttribute('disabled');
    }
  });
  freehandCheckbox.changed(() => {
    freehandMode = freehandCheckbox.checked();
  });

  // Tool selection
  for (let tool in toolButtons) {
    toolButtons[tool].mousePressed(() => setDrawingMode(tool));
  }
}

function draw() {
  background(bgColor);

  // Draw grid
  if (showGrid) {
    drawGrid();
  }

  // Draw all stitches
  drawStitches();

  // Draw selected stitch with highlight
  if (selectedStitch) {
    drawSelectedStitchHighlight();
    drawControlPoints();

    // Show instructions for path point editing
    if (selectedStitch.type === 'path' && draggingPoint &&
      typeof draggingPoint === 'object' && draggingPoint.type === 'pathPoint') {
      let point = selectedStitch.points[draggingPoint.index];
      fill(255);
      noStroke();
      textSize(12);
      textAlign(LEFT, BOTTOM);
      text('(Del): Delete Point  |  (M): Merge with Next', point.x + 10, point.y - 10);
    }
  }

  // Draw current stitch being created
  if (currentStitch) {
    let previewX = mouseX;
    let previewY = mouseY;

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
    }
  }

  // Draw current pen path being drawn
  if (isDrawingPath && currentPath.length > 1) {
    drawPathPreview(currentPath, stitchColor);
  }
}

function drawGrid() {
  stroke(255, 255, 255, 40);
  strokeWeight(1);

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    line(x, 0, x, height);
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    line(0, y, width, y);
  }

  // Grid points
  fill(255, 255, 255, 80);
  noStroke();
  for (let x = 0; x <= width; x += gridSize) {
    for (let y = 0; y <= height; y += gridSize) {
      circle(x, y, 3);
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
    }
  }
}

function drawDashedLine(x1, y1, x2, y2, col, isFreehand = false) {
  stroke(col);
  strokeWeight(3);
  strokeCap(ROUND);

  // Calculate line properties
  let distance = dist(x1, y1, x2, y2);
  let angle = atan2(y2 - y1, x2 - x1);

  if (isFreehand) {
    // Freehand mode: pixel-based dashing for smooth, non-grid-aligned lines
    let dashLength = stitchLength;
    let gapLength = stitchLength * 0.8;
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
  } else {
    // Grid-aligned mode: snap dashes to grid points
    let stepDistance = gridSize;
    let numSteps = floor(distance / stepDistance);

    let dashSteps = max(1, round(stitchLength / gridSize));
    let gapSteps = max(1, round((stitchLength * 0.8) / gridSize));
    let patternLength = dashSteps + gapSteps;

    let patternIndex = 0;

    for (let i = 0; i <= numSteps; i++) {
      let currentDist = i * stepDistance;
      let nextDist = min((i + 1) * stepDistance, distance);

      let inDashPart = (patternIndex % patternLength) < dashSteps;

      if (inDashPart && currentDist < distance) {
        let x1Seg = x1 + cos(angle) * currentDist;
        let y1Seg = y1 + sin(angle) * currentDist;
        let x2Seg = x1 + cos(angle) * nextDist;
        let y2Seg = y1 + sin(angle) * nextDist;

        line(x1Seg, y1Seg, x2Seg, y2Seg);
      }

      patternIndex++;
    }
  }
}

function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {

    // Selection mode - check for stitch selection or control point dragging
    if (selectionMode) {
      // Check if clicking on a control point first
      if (selectedStitch) {
        draggingPoint = getControlPointAt(mouseX, mouseY, selectedStitch);
        if (draggingPoint) {
          return; // Start dragging
        }
      }

      // Check if clicking on an existing stitch
      let clickedStitch = getStitchAt(mouseX, mouseY);
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
      currentPath.push({ x: mouseX, y: mouseY });
      return;
    }

    // Drawing mode
    let pos = freehandMode ? { x: mouseX, y: mouseY } : snapToGrid(mouseX, mouseY);

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

  if (currentStitch && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    let pos = freehandMode ? { x: mouseX, y: mouseY } : snapToGrid(mouseX, mouseY);

    // For curves, need to wait for control point
    if (drawingMode === 'curve' && currentStitch.controlX === undefined) {
      return; // Wait for control point click
    }

    // Check if shape has valid size
    let hasSize = false;
    if (drawingMode === 'circle') {
      hasSize = dist(currentStitch.x1, currentStitch.y1, pos.x, pos.y) > 5;
    } else if (drawingMode === 'curve') {
      hasSize = currentStitch.controlX !== undefined;
    } else {
      hasSize = dist(currentStitch.x1, currentStitch.y1, pos.x, pos.y) > 5;
    }

    if (hasSize) {
      saveUndoState();

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

    currentStitch = null;
  }
}

function mouseDragged() {
  // Handle pen tool - add points to path
  if (isDrawingPath && drawingMode === 'pen') {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
      // Only add point if it's far enough from the last point (reduces noise)
      let lastPoint = currentPath[currentPath.length - 1];
      if (dist(mouseX, mouseY, lastPoint.x, lastPoint.y) > 3) {
        currentPath.push({ x: mouseX, y: mouseY });
      }
    }
    return;
  }

  // Handle dragging control points in selection mode
  if (selectionMode && draggingPoint && selectedStitch) {
    let pos = freehandMode ? { x: mouseX, y: mouseY } : snapToGrid(mouseX, mouseY);

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
  let gapLength = dashLength * 0.8;
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
  let gapLength = dashLength * 0.8;
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
  let gapLength = dashLength * 0.8;
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
  }
}

function drawControlPoints() {
  if (!selectedStitch) return;

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
