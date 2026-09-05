import { Point, ShapeType } from '../types';

interface RecognizedShape {
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Recognizes geometric shapes from freehand stroke points.
 * Converts hand-drawn sketches to crisp geometric shapes:
 * Rectangle, Circle/Ellipse, Triangle, Straight Line, Arrow.
 */
export function recognizeShape(points: Point[]): RecognizedShape | null {
  if (!points || points.length < 5) return null;

  const n = points.length;
  const start = points[0];
  const end = points[n - 1];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  let totalLength = 0;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;

    if (i > 0) {
      const prev = points[i - 1];
      totalLength += Math.hypot(p.x - prev.x, p.y - prev.y);
    }
  }

  const width = Math.max(10, maxX - minX);
  const height = Math.max(10, maxY - minY);
  const distStartEnd = Math.hypot(end.x - start.x, end.y - start.y);
  const isClosed = distStartEnd < Math.max(35, Math.min(width, height) * 0.35);

  // 1. Check for Straight Line
  // If not closed, and total path length is very close to direct Euclidean distance
  if (!isClosed && distStartEnd > 30) {
    const directDist = Math.hypot(end.x - start.x, end.y - start.y);
    if (totalLength / directDist < 1.18) {
      return {
        type: 'line',
        x: start.x,
        y: start.y,
        width: end.x - start.x,
        height: end.y - start.y,
      };
    }
  }

  // 2. Closed Shapes: Circle vs Rectangle vs Triangle
  if (isClosed) {
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;

    // Check circularity
    let radialVariance = 0;
    for (let i = 0; i < n; i++) {
      const p = points[i];
      const normX = (p.x - centerX) / (radiusX || 1);
      const normY = (p.y - centerY) / (radiusY || 1);
      const normRadius = Math.hypot(normX, normY);
      radialVariance += Math.abs(normRadius - 1.0);
    }
    const avgRadialVariance = radialVariance / n;

    // A circle has very low radial variance from normalized center
    if (avgRadialVariance < 0.22) {
      return {
        type: 'circle',
        x: minX,
        y: minY,
        width,
        height,
      };
    }

    // Check for Triangle (stroke points clustered around 3 dominant corners)
    // Simplify polygon using Douglas-Peucker or corner detection
    const corners = detectCorners(points, 35);
    if (corners.length === 3 || corners.length === 4) {
      return {
        type: 'triangle',
        x: minX,
        y: minY,
        width,
        height,
      };
    }

    // Default closed shape: Rectangle
    return {
      type: 'rectangle',
      x: minX,
      y: minY,
      width,
      height,
    };
  }

  // Default fallback: if wide line with arrow hook
  if (distStartEnd > 50) {
    return {
      type: 'arrow',
      x: start.x,
      y: start.y,
      width: end.x - start.x,
      height: end.y - start.y,
    };
  }

  return null;
}

function detectCorners(points: Point[], angleThresholdDeg = 35): Point[] {
  const corners: Point[] = [];
  const step = Math.max(3, Math.floor(points.length / 15));

  for (let i = step; i < points.length - step; i += step) {
    const pPrev = points[i - step];
    const pCurr = points[i];
    const pNext = points[i + step];

    const v1x = pCurr.x - pPrev.x;
    const v1y = pCurr.y - pPrev.y;
    const v2x = pNext.x - pCurr.x;
    const v2y = pNext.y - pCurr.y;

    const angle1 = Math.atan2(v1y, v1x);
    const angle2 = Math.atan2(v2y, v2x);
    let diff = Math.abs((angle2 - angle1) * (180 / Math.PI));
    if (diff > 180) diff = 360 - diff;

    if (diff > angleThresholdDeg) {
      corners.push(pCurr);
    }
  }

  return corners;
}
