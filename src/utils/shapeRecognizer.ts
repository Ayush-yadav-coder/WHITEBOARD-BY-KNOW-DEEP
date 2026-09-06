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
 */
export function recognizeShape(points: Point[]): RecognizedShape | null {
  if (!points || points.length < 5) return null;

  // 1. Simplify points using Ramer-Douglas-Peucker
  const simplified = simplifyPath(points, 5);
  
  // Compute bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let totalLength = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) totalLength += dist(points[i-1], p);
  }

  const width = Math.max(10, maxX - minX);
  const height = Math.max(10, maxY - minY);
  const start = points[0];
  const end = points[points.length - 1];
  const distStartEnd = dist(start, end);
  const isClosed = distStartEnd < Math.max(40, Math.min(width, height) * 0.4);

  // 2. Check for Line
  if (!isClosed) {
    const directDist = dist(start, end);
    if (totalLength / directDist < 1.15 && directDist > 30) {
      return { type: 'line', x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y };
    }
    
    // Check for Arrow (Look for a "hook" or "head" at the end)
    if (points.length > 15) {
      const lastFew = points.slice(-10);
      const directionVector = { x: end.x - points[points.length - 15].x, y: end.y - points[points.length - 15].y };
      const arrowHeadDist = dist(points[points.length - 10], end);
      if (arrowHeadDist > 15 && totalLength / distStartEnd > 1.25) {
        return { type: 'arrow', x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y };
      }
    }
  }

  // 3. Closed Shapes
  if (isClosed) {
    const simplifiedClosed = simplifyPath(points, 8);
    // Number of vertices in simplified path (ignoring the last point if it closes to start)
    const vertices = simplifiedClosed.length - 1;

    // Circle/Ellipse Check (Radial Variance)
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;
    let radialVariance = 0;
    for (const p of points) {
      const normX = (p.x - centerX) / (radiusX || 1);
      const normY = (p.y - centerY) / (radiusY || 1);
      radialVariance += Math.abs(Math.hypot(normX, normY) - 1.0);
    }
    const avgRadialVariance = radialVariance / points.length;
    if (avgRadialVariance < 0.18) {
      return { type: 'circle', x: minX, y: minY, width, height };
    }

    // Triangle Check
    if (vertices === 3 || (vertices === 4 && dist(simplifiedClosed[0], simplifiedClosed[simplifiedClosed.length-1]) < 20)) {
       return { type: 'triangle', x: minX, y: minY, width, height };
    }

    // Rectangle Check
    if (vertices === 4 || vertices === 5) {
       return { type: 'rectangle', x: minX, y: minY, width, height };
    }

    // Star Check (Usually has about 10 vertices after simplification and high "concavity")
    if (vertices >= 8 && vertices <= 12) {
       return { type: 'star', x: minX, y: minY, width, height };
    }

    // Default to rectangle for generic closed shapes
    return { type: 'rectangle', x: minX, y: minY, width, height };
  }

  // Fallback for non-closed paths that might be arrows
  if (totalLength > 100 && totalLength / distStartEnd > 1.3) {
      return { type: 'arrow', x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y };
  }

  return null;
}

function dist(p1: Point, p2: Point) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function simplifyPath(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance * tolerance;

  function simplifyRecursive(pts: Point[], start: number, end: number, sqTol: number, result: Point[]) {
    let maxSqDist = sqTol;
    let index = -1;

    for (let i = start + 1; i < end; i++) {
      const sqDist = getSqSegDist(pts[i], pts[start], pts[end]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (index !== -1) {
      simplifyRecursive(pts, start, index, sqTol, result);
      result.push(pts[index]);
      simplifyRecursive(pts, index, end, sqTol, result);
    }
  }

  const result = [points[0]];
  simplifyRecursive(points, 0, points.length - 1, sqTolerance, result);
  result.push(points[points.length - 1]);
  return result;
}

function getSqSegDist(p: Point, p1: Point, p2: Point) {
  let x = p1.x;
  let y = p1.y;
  let dx = p2.x - x;
  let dy = p2.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2.x;
      y = p2.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;
  return dx * dx + dy * dy;
}
