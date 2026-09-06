import { jsPDF } from 'jspdf';
import { CanvasPage, WhiteboardSettings } from '../types';
import { renderSlideToGraphicDataUrl } from './slideRenderer';
import { ActivePresentationState } from '../components/PPTPresentationOverlay';

/**
 * Generates an offline rendered canvas image of a single whiteboard page
 * including background, strokes, shapes, AI images, notes, and active PPT slide.
 */
export async function renderPageToDataUrl(
  page: CanvasPage,
  settings: WhiteboardSettings,
  presentation?: ActivePresentationState | null,
  pageWidth = 1920,
  pageHeight = 1080
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Draw Background
  const bgColors: Record<string, string> = {
    white: '#ffffff',
    black: '#0f172a',
    chalkboard: '#1b4332',
    midnight: '#0b1528',
    graphite: '#181d24',
    beige: '#f7f5eb',
    mint: '#f0f9f4',
    yellow: '#fdfcf0',
    skyblue: '#e0f2fe',
    peach: '#ffedd5',
    lavender: '#f3e8ff',
    rose: '#ffe4e6',
  };
  ctx.fillStyle = bgColors[settings.background] || '#ffffff';
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  // 2. Draw Active PPT Slide (if present and active)
  if (presentation && presentation.slides.length > 0) {
    const currentSlide =
      presentation.slides[presentation.currentSlideIndex] || presentation.slides[0];
    const slideUrl = renderSlideToGraphicDataUrl(
      currentSlide,
      presentation.currentSlideIndex,
      presentation.slides.length,
      presentation.theme
    );

    try {
      const slideImg = await loadImage(slideUrl);
      ctx.drawImage(slideImg, 0, 0, pageWidth, pageHeight);
    } catch (e) {
      console.warn('Could not load PPT slide for PDF export:', e);
    }
  }

  // 3. Draw Shapes & AI Images
  for (const shape of page.shapes) {
    if (shape.type === 'image' && shape.imageUrl) {
      try {
        const img = await loadImage(shape.imageUrl);
        ctx.save();
        if (shape.rotation) {
          ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
          ctx.rotate((shape.rotation * Math.PI) / 180);
          ctx.drawImage(img, -shape.width / 2, -shape.height / 2, shape.width, shape.height);
        } else {
          ctx.drawImage(img, shape.x, shape.y, shape.width, shape.height);
        }
        ctx.restore();
      } catch (e) {
        console.warn('Could not load image shape for PDF:', e);
      }
    } else {
      // Draw geometric shape
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth || 2;
      ctx.fillStyle = shape.fill || 'transparent';

      if (shape.type === 'rectangle') {
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        if (shape.fill && shape.fill !== 'transparent') ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === 'circle') {
        ctx.beginPath();
        const rx = shape.width / 2;
        const ry = shape.height / 2;
        ctx.ellipse(shape.x + rx, shape.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
        ctx.stroke();
        if (shape.fill && shape.fill !== 'transparent') ctx.fill();
      } else if (shape.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.stroke();
      } else if (shape.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.stroke();
      } else if (shape.type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(shape.x + shape.width / 2, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.lineTo(shape.x, shape.y + shape.height);
        ctx.closePath();
        ctx.stroke();
        if (shape.fill && shape.fill !== 'transparent') ctx.fill();
      }
    }
  }

  // 4. Draw Strokes
  for (const stroke of page.strokes) {
    if (stroke.points.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stroke.tool === 'highlighter') {
      ctx.globalAlpha = 0.4;
    }

    ctx.beginPath();
    const pts = stroke.points;
    if (pts.length < 3) {
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    } else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      const lastIdx = pts.length - 1;
      ctx.quadraticCurveTo(
        pts[lastIdx - 1].x,
        pts[lastIdx - 1].y,
        pts[lastIdx].x,
        pts[lastIdx].y
      );
    }
    ctx.stroke();
    ctx.restore();
  }

  // 5. Draw Sticky Notes
  for (const note of page.notes) {
    ctx.save();
    ctx.fillStyle = note.color === 'yellow' ? '#fef08a' : note.color === 'blue' ? '#bae6fd' : '#bbf7d0';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 8;
    ctx.fillRect(note.x, note.y, 220, 160);
    ctx.strokeRect(note.x, note.y, 220, 160);

    // Note text
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(note.title || 'Note', note.x + 12, note.y + 24);

    ctx.font = '12px system-ui, sans-serif';
    const lines = (note.text || '').split('\n').slice(0, 5);
    lines.forEach((line, lIdx) => {
      ctx.fillText(line.slice(0, 28), note.x + 12, note.y + 50 + lIdx * 18);
    });
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Exports the active page or all pages to a real downloadable PDF file.
 */
export async function exportWhiteboardToPDF(
  pages: CanvasPage[],
  currentPageIndex: number,
  settings: WhiteboardSettings,
  presentation?: ActivePresentationState | null,
  exportAllPages = false
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const pagesToExport = exportAllPages ? pages : [pages[currentPageIndex] || pages[0]];

  for (let i = 0; i < pagesToExport.length; i++) {
    if (i > 0) {
      pdf.addPage('a4', 'landscape');
    }

    const page = pagesToExport[i];
    const dataUrl = await renderPageToDataUrl(
      page,
      settings,
      i === currentPageIndex ? presentation : null
    );

    if (dataUrl) {
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `Whiteboard_Note_Export_${timestamp}.pdf`;
  pdf.save(fileName);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
