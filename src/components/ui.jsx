import { isTbd, CATEGORIES, ETATS } from '../lib/utils.js';

export const Val = ({ v }) => isTbd(v) ? <span className="tbd">À préciser</span> : v;

export const Dot = ({ color }) => <i className="dot" style={{ color, background: color }}></i>;

export const EtatBadge = ({ s }) => {
  const e = ETATS[s.etatKey];
  return <span className="badge etat" style={{ '--c': e.color }}><Dot color={e.color} />{isTbd(s.etat) ? e.label : s.etat}</span>;
};

/* Pictogrammes des catégories : chemins SVG partagés avec les marqueurs de la carte */
export const GLYPHS = {
  // étal de marché : auvent festonné et comptoir
  marche: '<path d="M3 9l1.6-5h14.8L21 9M3 9h18M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v9h14v-9M10 21v-5h4v5"/>'
};
export const glyphSvg = (cat, size = 14, width = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[CATEGORIES[cat] ? cat : 'marche']}</svg>`;

export const CatIcon = ({ cat, size = 14, className = 'cat-ico' }) => (
  <span className={className} style={{ '--c': CATEGORIES[cat].color }} dangerouslySetInnerHTML={{ __html: glyphSvg(cat, size) }} />
);

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
export const ICON = {
  close: <svg width="16" height="16" {...svg}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  search: <svg width="16" height="16" {...svg}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  menu: <svg width="18" height="18" {...svg}><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
  refresh: <svg width="13" height="13" {...svg} strokeWidth="2.2"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>,
  back: <svg width="15" height="15" {...svg}><path d="M15 18l-6-6 6-6" /></svg>,
  chevron: <svg width="14" height="14" {...svg}><path d="M9 6l6 6-6 6" /></svg>,
  pin: <svg width="15" height="15" {...svg}><circle cx="12" cy="10" r="3" /><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /></svg>,
  target: <svg width="14" height="14" {...svg}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>,
  layers: <svg width="14" height="14" {...svg}><path d="M12 3 2 8l10 5 10-5z" /><path d="m2 13 10 5 10-5" /></svg>,
  calendar: <svg width="15" height="15" {...svg}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  zone: <svg width="15" height="15" {...svg}><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z" /><path d="M9 3v15M15 6v15" /></svg>,
  tools: <svg width="15" height="15" {...svg}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" /></svg>,
  city: <svg width="15" height="15" {...svg}><path d="M3 21h18M5 21V8l6-4v17M11 21V10h8v11M8 9v.01M8 13v.01M8 17v.01M15 14v.01M15 17v.01" /></svg>
};
