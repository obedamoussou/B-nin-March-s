import { feature, merge } from 'topojson-client';
import communesTopo from '../data/communes.topo.json';
import { SHEET_ID, TABS, ZONE_COLORS, ZONE_FALLBACK_COLORS } from './config.js';
import { SNAPSHOT } from './snapshot.js';
import { norm, isTbd, parseCSV, etatOf, activitesOf, pct, MONTH_KEYS } from './utils.js';

/* ---------- lecture des onglets ---------- */
async function fetchTab(tab) {
  const urls = [
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${tab.gid}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(tab.name)}`
  ];
  for (const u of urls) {
    try {
      // au-delà de 8 s on passe à l'essai suivant, puis à la copie de secours
      const r = await fetch(u + '&_=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const t = await r.text();
      if (t.trim().startsWith('<')) continue; // page de connexion → accès non public
      return parseCSV(t);
    } catch { /* essai suivant */ }
  }
  throw new Error('inaccessible');
}

/* Transforme un tableau brut en objets, en repérant la ligne d'en-tête (celle dont une cellule vaut l'une des clés) */
function toRecords(rows, keys) {
  const hi = rows.findIndex(r => r.some(c => keys.includes(norm(c))));
  if (hi < 0) return [];
  const headers = rows[hi].map(h => (h || '').trim());
  const ki = headers.findIndex(h => keys.includes(norm(h)));
  return rows.slice(hi + 1)
    .filter(r => (r[ki] || '').trim())
    .map(r => {
      const o = { _cells: {}, _key: headers[ki] };
      headers.forEach((h, i) => { if (h) o._cells[h] = (r[i] || '').trim(); });
      return o;
    });
}
/* Associe chaque champ connu à la première colonne dont l'en-tête normalisé commence par l'un des préfixes */
function mapFields(rec, spec) {
  const o = { _cells: rec._cells, _used: new Set([rec._key]) };
  for (const [k, prefixes] of Object.entries(spec)) {
    for (const [h, v] of Object.entries(rec._cells)) {
      if (!o._used.has(h) && prefixes.some(p => norm(h).startsWith(p))) { o[k] = v; o._used.add(h); break; }
    }
    o[k] ??= '';
  }
  return o;
}

const MARCHE_FIELDS = {
  ville: ['ville', 'commune'], pole: ['pole', 'zone'], activites: ['activite'],
  occupation: ['tauxdoccupation', 'occupation'], recouvrement: ['tauxderecouvrement', 'recouvrement'],
  etat: ['etat', 'niveau'], lastEval: ['datedeladerniere', 'derniereevaluation'], nextEval: ['datedelaprochaine', 'prochaineevaluation'],
  actions: ['actions'], gps: ['coordonnees', 'gps', 'position'], lat: ['latitude', 'lat'], lng: ['longitude', 'lng', 'lon']
};
const MARCHE_KEYS = ['marches', 'marche', 'nom', 'sites', 'site'];

/* ---------- statistiques mensuelles ----------
   Une ligne d'en-tête nomme les marchés (« Marché 1 »… ou leur nom), chacun sur deux colonnes
   (taux d'occupation, taux de recouvrement) ; une ligne par mois.
   « Marché N » désigne le N-ième marché de l'onglet « Général ». */
function readStats(rows, marchesInOrder) {
  const byId = new Map(marchesInOrder.map(m => [m.id, m]));
  const hi = rows.findIndex(r => r.some(c => /^marche\d+$/.test(norm(c)) || byId.has(norm(c))));
  if (hi < 0) return;
  const names = rows[hi], metrics = rows[hi + 1] || [];
  const cols = [];
  names.forEach((c, i) => {
    const n = norm(c); if (!n) return;
    const num = n.match(/^marche(\d+)$/);
    const m = byId.get(n) || (num ? marchesInOrder[+num[1] - 1] : null);
    if (!m) return;
    // les colonnes du marché vont jusqu'au marché suivant
    for (let j = i; j < names.length && (j === i || !norm(names[j])); j++) {
      const k = norm(metrics[j]);
      if (k.startsWith('tauxdoccupation') || k.startsWith('occupation')) cols.push([m, 'occupation', j]);
      else if (k.includes('recouvrement')) cols.push([m, 'recouvrement', j]);
    }
  });
  for (const r of rows.slice(hi + 2)) {
    const mi = r.findIndex(c => MONTH_KEYS.includes(norm(c)));
    if (mi < 0) continue;
    const month = MONTH_KEYS.indexOf(norm(r[mi]));
    cols.forEach(([m, k, j]) => { m.mois[month][k] = pct(r[j]); });
  }
}

/* ---------- communes et zones ---------- */
// orthographes différentes entre les données et le fond de carte
const COMMUNE_ALIASES = { akpromisserete: 'akpomisserete', boukoumbe: 'boukombe', cobly: 'kobli', toribosito: 'toribossito', toucoutouna: 'toucountouna', ouake: 'ouake', djidja: 'djidja' };
const communeKey = name => { const n = norm(name); return COMMUNE_ALIASES[n] || n; };
const zoneKey = name => norm(name).replace(/^pole/, '');
const zoneLabel = name => (name || '').trim().replace(/^p[oô]le\s+/i, '');

const COMMUNES = feature(communesTopo, communesTopo.objects.communes).features.map(f => {
  f.key = norm(f.properties.name);
  f.center = centroid(f.geometry);
  return f;
});
const COMMUNE_BY_KEY = Object.fromEntries(COMMUNES.map(f => [f.key, f]));
const GEOMS = communesTopo.objects.communes.geometries;

/* centre de gravité du plus grand polygone (en degrés, suffisant à l'échelle d'une commune) */
function centroid(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let best = null, bestA = -1;
  for (const p of polys) {
    const ring = p[0]; let a = 0, x = 0, y = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      a += f; x += (ring[j][0] + ring[i][0]) * f; y += (ring[j][1] + ring[i][1]) * f;
    }
    if (Math.abs(a) > bestA) { bestA = Math.abs(a); best = { lng: x / (3 * a), lat: y / (3 * a) }; }
  }
  return best;
}

/* Position d'un site : coordonnées fournies, sinon disposition en spirale autour du centre de sa commune */
function coords(s) {
  const nums = (s.gps || '').match(/-?\d+(?:[.,]\d+)?/g);
  const lat = parseFloat((s.lat || (nums && nums[0]) || '').replace(',', '.'));
  const lng = parseFloat((s.lng || (nums && nums[1]) || '').replace(',', '.'));
  return isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 ? { lat, lng } : null;
}
function spread(sites, commune) {
  const c = commune.center;
  sites.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).forEach((s, i) => {
    if (sites.length === 1) { s.pos = { ...c }; return; }
    const r = 0.0042 * Math.sqrt(i + 0.6), t = i * 2.39996; // angle d'or
    s.pos = { lat: c.lat + r * Math.sin(t), lng: c.lng + r * Math.cos(t) / Math.cos(c.lat * Math.PI / 180) };
  });
}

/* ---------- assemblage ---------- */
export async function loadData() {
  let raw, live = true;
  try {
    const [marches, stats, zones] = await Promise.all([fetchTab(TABS.marches), fetchTab(TABS.stats), fetchTab(TABS.zones)]);
    raw = { marches, stats, zones };
  } catch { raw = SNAPSHOT; live = false; }

  // Zones : la colonne « Pôles » n'est remplie que sur la première ville de chaque groupe
  const zones = {}; const zoneOfCommune = {};
  const addZone = name => {
    const k = zoneKey(name); if (!k) return null;
    zones[k] ??= { key: k, name: zoneLabel(name), communes: [], sites: [] };
    return zones[k];
  };
  const zh = raw.zones.findIndex(r => r.some(c => norm(c) === 'villes' || norm(c) === 'ville'));
  if (zh >= 0) {
    const vi = raw.zones[zh].findIndex(c => /^villes?$/.test(norm(c)));
    const pi = raw.zones[zh].findIndex(c => /^poles?$|^zones?$/.test(norm(c)));
    let cur = null;
    for (const r of raw.zones.slice(zh + 1)) {
      if ((r[pi] || '').trim()) cur = addZone(r[pi]);
      const v = (r[vi] || '').trim();
      if (cur && v && !zoneOfCommune[communeKey(v)]) { cur.communes.push(v); zoneOfCommune[communeKey(v)] = cur.key; }
    }
  }

  // Marchés (« sites » dans le reste du code : un marché = un point sur la carte)
  const sites = toRecords(raw.marches, MARCHE_KEYS).map(r => {
    const s = mapFields(r, MARCHE_FIELDS);
    s.nom = r._cells[r._key];
    s.cat = 'marche';
    s.etatKey = etatOf(s.etat);
    s.activiteList = activitesOf(s.activites);
    s.occupationPct = pct(s.occupation);
    s.recouvrementPct = pct(s.recouvrement);
    s.mois = MONTH_KEYS.map(() => ({ occupation: null, recouvrement: null }));
    s.commune = s.ville ? COMMUNE_BY_KEY[communeKey(s.ville)] || null : null;
    const z = s.pole && !isTbd(s.pole) ? addZone(s.pole) : (s.ville && zones[zoneOfCommune[communeKey(s.ville)]]) || null;
    s.zone = z ? z.key : null;
    if (z) z.sites.push(s);
    s.exact = coords(s);
    s.id = norm(s.nom);
    return s;
  });
  readStats(raw.stats, sites); // avant le tri : « Marché N » suit l'ordre du classeur
  sites.forEach(s => { s.hasStats = s.mois.some(m => m.occupation !== null || m.recouvrement !== null); });
  sites.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  // Positions : exactes si fournies, sinon autour du centre de la commune
  const byCommune = {};
  sites.forEach(s => {
    if (s.exact) s.pos = s.exact;
    else if (s.commune) (byCommune[s.commune.key] ??= []).push(s);
  });
  Object.entries(byCommune).forEach(([k, list]) => spread(list, COMMUNE_BY_KEY[k]));

  // Activités présentes, pour les filtres (libellé tel qu'écrit la première fois)
  const activites = {};
  sites.forEach(s => s.activiteList.forEach(a => { activites[norm(a)] ??= a; }));
  sites.forEach(s => { s.activiteKeys = new Set(s.activiteList.map(norm)); });

  // Géométrie des zones : fusion des communes qui les composent
  const zoneList = Object.values(zones).map((z, i) => {
    const keys = new Set(z.communes.map(communeKey));
    const geoms = GEOMS.filter(g => keys.has(norm(g.properties.name)));
    z.geometry = geoms.length ? merge(communesTopo, geoms) : null;
    z.center = z.geometry ? centroid(z.geometry) : null;
    z.color = ZONE_COLORS[z.key] || ZONE_FALLBACK_COLORS[i % ZONE_FALLBACK_COLORS.length];
    z.communeFeatures = COMMUNES.filter(f => keys.has(f.key));
    z.sites.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    return z;
  });
  const order = Object.keys(ZONE_COLORS);
  zoneList.sort((a, b) => (order.indexOf(a.key) + 1 || 99) - (order.indexOf(b.key) + 1 || 99));

  const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return { sites, zones: zoneList, activites, communes: COMMUNES, zoneOfCommune, sync: { live, time } };
}
