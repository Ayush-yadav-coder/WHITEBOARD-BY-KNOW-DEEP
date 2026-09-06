export type ToolType =
  | 'select'
  | 'pen'
  | 'calligraphy'
  | 'highlighter'
  | 'shape-pen'
  | 'text-pen'
  | 'eraser'
  | 'shape'
  | 'pan'
  | 'lasso'
  | 'sticky-note';

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'star' | 'hexagon' | 'pentagon' | 'heart' | 'diamond' | 'cube' | 'sphere' | 'pyramid' | 'cylinder' | 'cone' | 'prism' | 'torus' | 'text';

export type WhiteboardBackground = 'white' | 'chalkboard' | 'black' | 'grid' | 'ruled' | 'beige' | 'mint' | 'yellow';

export type SplitZoneCount = 1 | 2 | 3 | 4;

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  tool: 'pen' | 'highlighter' | 'eraser' | 'calligraphy' | 'text-pen';
  color: string;
  width: number;
  points: Point[];
  opacity?: number;
  zoneId?: number; // 0, 1, 2, 3 for split student zones
}

export interface ShapeElement {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  fill?: string;
  zoneId?: number;
  rotation?: number; // rotation angle in degrees
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface CanvasNote {
  id: string;
  x: number;
  y: number;
  title?: string;
  text: string;
  timestamp: number;
  color?: string; // yellow, blue, green, pink, purple
  isAiGenerated?: boolean;
  fontSize?: 12 | 24 | 36;
  fontFamily?: 'sans' | 'serif' | 'mono';
  textColor?: string;
}

export interface CanvasPage {
  id: string;
  title: string;
  strokes: Stroke[];
  shapes: ShapeElement[];
  notes: CanvasNote[];
}

export interface WhiteboardSettings {
  multiTouchEnabled: boolean; // up to 20 touch points
  background: WhiteboardBackground;
  penColor: string;
  penWidth: number;
  eraserSize: number;
  gridSize: number;
  autoRecognizeShapes: boolean;
  handwritingToText: boolean;
}

export interface RulerState {
  visible: boolean;
  x: number;
  y: number;
  angle: number; // degrees
  length: number; // pixels
}

export interface ProtractorState {
  visible: boolean;
  x: number;
  y: number;
  radius: number;
  angle: number;
}

export interface ClassroomSpotlightState {
  active: boolean;
  mode: 'none' | 'spotlight' | 'curtain';
  x: number;
  y: number;
  radius: number;
  curtainTop: number; // 0 to 100 percentage
}

export interface DualPenConfig {
  activePen: 'penA' | 'penB';
  penA: {
    color: string;
    width: number;
    type: 'pen' | 'shape-pen' | 'text-pen' | 'highlighter';
  };
  penB: {
    color: string;
    width: number;
    type: 'pen' | 'shape-pen' | 'text-pen' | 'highlighter';
  };
}

export interface MathStep {
  stepNumber: number;
  title: string;
  explanation: string;
  mathExpression?: string;
}

export interface MathSolution {
  recognizedEquation: string;
  topic?: string;
  steps: MathStep[];
  finalAnswer: string;
  keyConcepts?: string[];
  explanationSummary?: string;
}

export interface CircleToSearchPayload {
  prompt: string;
  imageBase64?: string;
  isMathEquation?: boolean;
  selectionBounds?: { minX: number; minY: number; maxX: number; maxY: number };
}
