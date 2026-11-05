/* ---------- utilitaires ---------- */
export const norm = s => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const isTbd = v => !v || /^(a|à)\s*preciser$/i.test(v.normalize('NFD').replace(/[̀-ͯ]/g, '').trim()) || /^(n\/?a|-|—|nd|non\s*determine)$/i.test(v.normalize('NFD').replace(/[̀-ͯ]/g, '').trim());
export const plural = (n, word, many = word + 's') => `${n} ${n > 1 ? many : word}`;

export function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export function parseDate(v) {
  if (isTbd(v)) return null;
  const m = v.trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(y, +m[2] - 1, +m[1]); }
  const iso = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  return null;
}
export function fmtDate(v) {
  const d = parseDate(v);
  if (!d) return isTbd(v) ? null : v;
  return `${d.getDate() === 1 ? '1er' : d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
export function since(v) {
  const d = parseDate(v); if (!d) return '';
  const days = Math.round((Date.now() - d) / 864e5);
  if (days < -45) { const m = Math.round(-days / 30.4); return m < 12 ? `dans ${m} mois` : `dans ${plural(Math.round(m / 12), 'an')}`; }
  if (days < 0) return `dans ${plural(-days, 'jour')}`;
  if (days < 1) return "aujourd'hui";
  if (days < 45) return `il y a ${plural(days, 'jour')}`;
  const m = Math.round(days / 30.4);
  return m < 12 ? `il y a ${m} mois` : `il y a ${plural(Math.round(m / 12), 'an')}`;
}
/* Pourcentage : « 60,00% », « 60 » ou « 0,6 » → 60 ; vide ou « A préciser » → null */
export function pct(v) {
  if (isTbd(v)) return null;
  const s = v.toString().replace(/[\s\u00a0\u202f]/g, '');
  const n = parseFloat(s.replace('%', '').replace(',', '.'));
  if (!isFinite(n)) return null;
  return !s.includes('%') && /[.,]/.test(s) && n <= 1 ? n * 100 : n;
}
export const fmtPct = n => n === null ? '—' : `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
export const avg = list => { const v = list.filter(n => n !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

/* Mois de l'onglet « Statistiques » */
export const MONTH_KEYS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
export const MONTH_SHORT = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
export const link = v => !isTbd(v) && /^https?:\/\//i.test(v) ? v : null;

/* ---------- état des infrastructures ---------- */
export const ETATS = {
  bon: { label: 'Bon', color: '#2fd08a', rank: 0 },
  satisfaisant: { label: 'Satisfaisant', color: '#9be15d', rank: 1 },
  moyen: { label: 'Moyen', color: '#f4c542', rank: 2 },
  mauvais: { label: 'Mauvais', color: '#ff7a59', rank: 3 },
  critique: { label: 'Critique', color: '#ff3b5c', rank: 4 },
  nd: { label: 'Non déterminé', color: '#7f8db0', rank: 5 }
};
export function etatOf(v) {
  const n = norm(v);
  if (!n || isTbd(v)) return 'nd';
  if (/^(bon|tresbon|excellent)/.test(n)) return 'bon';
  if (/^(satisf|correct|acceptable)/.test(n)) return 'satisfaisant';
  if (/^(moyen|passable|modere)/.test(n)) return 'moyen';
  if (/^(mauvais|degrade|vetuste)/.test(n)) return 'mauvais';
  if (/^(critique|ruine|tresmauvais|urgent)/.test(n)) return 'critique';
  return 'nd';
}

/* ---------- type d'infrastructure (un seul : le marché) ---------- */
export const CATEGORIES = {
  marche: { label: 'Marché moderne', color: '#fcd116', icon: 'marche' }
};

/* Activités d'un marché : « Boucherie et Volaille, Poissonnerie, … » */
export const activitesOf = v => isTbd(v) ? [] : v.split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);
