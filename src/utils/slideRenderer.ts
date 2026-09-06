import { PPTSlide } from '../components/PPTUploaderModal';

/**
 * Generates a high-resolution 1920x1080 SVG Data URL representation of a slide.
 * Produces crisp, beautiful graphic slides suitable for presentation cover and PDF export.
 */
export function renderSlideToGraphicDataUrl(
  slide: PPTSlide,
  slideIndex: number,
  totalSlides: number,
  theme: 'modern-blue' | 'dark-slate' | 'emerald' | 'warm-amber' = 'modern-blue'
): string {
  // If slide already has a rendered image / screenshot, return it
  if (slide.images && slide.images.length > 0 && slide.images[0].startsWith('data:image')) {
    return slide.images[0];
  }

  const themes = {
    'modern-blue': {
      bgGrad1: '#0f172a',
      bgGrad2: '#1e293b',
      accent: '#06b6d4',
      accentLight: '#38bdf8',
      titleColor: '#ffffff',
      textColor: '#cbd5e1',
      cardBg: 'rgba(30, 41, 59, 0.7)',
      cardBorder: '#334155',
      bulletBg: '#0284c7',
    },
    'dark-slate': {
      bgGrad1: '#090d16',
      bgGrad2: '#111827',
      accent: '#818cf8',
      accentLight: '#a5b4fc',
      titleColor: '#ffffff',
      textColor: '#e2e8f0',
      cardBg: 'rgba(17, 24, 39, 0.75)',
      cardBorder: '#1f2937',
      bulletBg: '#6366f1',
    },
    'emerald': {
      bgGrad1: '#062018',
      bgGrad2: '#0b3528',
      accent: '#10b981',
      accentLight: '#34d399',
      titleColor: '#ffffff',
      textColor: '#d1fae5',
      cardBg: 'rgba(6, 45, 33, 0.7)',
      cardBorder: '#065f46',
      bulletBg: '#059669',
    },
    'warm-amber': {
      bgGrad1: '#1c1307',
      bgGrad2: '#2c1e0e',
      accent: '#f59e0b',
      accentLight: '#fbbf24',
      titleColor: '#ffffff',
      textColor: '#fef3c7',
      cardBg: 'rgba(44, 30, 14, 0.75)',
      cardBorder: '#78350f',
      bulletBg: '#d97706',
    },
  };

  const currentTheme = themes[theme] || themes['modern-blue'];

  // Format bullets with clean spacing
  const bulletItems = (slide.bullets && slide.bullets.length > 0)
    ? slide.bullets
    : slide.fullText
    ? slide.fullText.split(/\. |\n/).filter((s) => s.trim().length > 3).slice(0, 6)
    : ['Interactive Whiteboard Classroom Presentation Slide'];

  const bulletSvgList = bulletItems
    .slice(0, 7)
    .map((bullet, idx) => {
      const yOffset = 380 + idx * 95;
      const cleanBullet = bullet
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `
        <g transform="translate(180, ${yOffset})">
          <!-- Bullet Pill / Icon -->
          <circle cx="20" cy="18" r="14" fill="${currentTheme.accent}" opacity="0.2" />
          <circle cx="20" cy="18" r="7" fill="${currentTheme.accentLight}" />
          <!-- Bullet Text -->
          <text x="60" y="26" font-size="32" font-weight="600" fill="${currentTheme.textColor}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
            ${cleanBullet}
          </text>
        </g>
      `;
    })
    .join('');

  const cleanTitle = (slide.title || `Slide ${slideIndex + 1}`)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="slideBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${currentTheme.bgGrad1}"/>
        <stop offset="100%" stop-color="${currentTheme.bgGrad2}"/>
      </linearGradient>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${currentTheme.accent}"/>
        <stop offset="100%" stop-color="${currentTheme.accentLight}"/>
      </linearGradient>
      <filter id="cardGlow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.4"/>
      </filter>
    </defs>

    <!-- Slide Background -->
    <rect width="1920" height="1080" fill="url(#slideBg)"/>

    <!-- Geometric Grid Accent Lines -->
    <g stroke="rgba(255,255,255,0.03)" stroke-width="1.5">
      <line x1="0" y1="180" x2="1920" y2="180" />
      <line x1="0" y1="980" x2="1920" y2="980" />
      <line x1="120" y1="0" x2="120" y2="1080" />
      <line x1="1800" y1="0" x2="1800" y2="1080" />
    </g>

    <!-- Top Header Ribbon -->
    <rect x="120" y="60" width="8" height="90" rx="4" fill="url(#headerGrad)"/>
    
    <!-- Category & Slide Indicator -->
    <text x="148" y="90" font-size="20" font-weight="800" fill="${currentTheme.accentLight}" letter-spacing="4" text-transform="uppercase" font-family="system-ui, -apple-system, sans-serif">
      LESSON SLIDE DECK
    </text>

    <!-- Slide Title -->
    <text x="148" y="145" font-size="46" font-weight="900" fill="${currentTheme.titleColor}" font-family="system-ui, -apple-system, sans-serif">
      ${cleanTitle}
    </text>

    <!-- Content Card -->
    <rect x="120" y="220" width="1680" height="740" rx="32" fill="${currentTheme.cardBg}" stroke="${currentTheme.cardBorder}" stroke-width="2" filter="url(#cardGlow)"/>

    <!-- Subtle Content Header -->
    <rect x="160" y="270" width="180" height="40" rx="10" fill="${currentTheme.accent}" fill-opacity="0.15"/>
    <text x="250" y="296" font-size="18" font-weight="700" fill="${currentTheme.accentLight}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">
      KEY CONCEPTS
    </text>

    <!-- Bullet Points -->
    ${bulletSvgList}

    <!-- Bottom Footer Bar -->
    <g transform="translate(140, 1025)">
      <!-- Know Deep Whiteboard watermark -->
      <circle cx="16" cy="-8" r="8" fill="${currentTheme.accent}" opacity="0.8"/>
      <text x="36" y="0" font-size="18" font-weight="700" fill="rgba(255,255,255,0.4)" font-family="system-ui, -apple-system, sans-serif">
        Whiteboard • Know Deep Presentation Mode
      </text>

      <!-- Slide Counter -->
      <text x="1640" y="0" font-size="20" font-weight="800" fill="${currentTheme.accentLight}" text-anchor="end" font-family="system-ui, -apple-system, sans-serif">
        SLIDE ${slideIndex + 1} OF ${totalSlides}
      </text>
    </g>
  </svg>
  `;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
