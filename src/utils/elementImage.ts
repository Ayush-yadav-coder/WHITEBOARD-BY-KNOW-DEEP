export function generateElementImage(el: any): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" style="background: white; border: 2px solid black;">
    <text x="5" y="20" font-family="sans-serif" font-size="16" font-weight="bold">${el.number}</text>
    <text x="50" y="60" font-family="sans-serif" font-size="40" font-weight="bold" text-anchor="middle">${el.symbol}</text>
    <text x="50" y="85" font-family="sans-serif" font-size="12" text-anchor="middle">${el.name}</text>
    <text x="50" y="98" font-family="sans-serif" font-size="10" text-anchor="middle">${el.mass}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}
