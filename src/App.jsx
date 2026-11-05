import { useEffect, useRef, useState } from 'react';
import { BASEMAPS, REFRESH_EVERY } from './lib/config.js';
import { ETATS, avg, fmtPct } from './lib/utils.js';
import { loadData } from './lib/data.js';
import MapView from './components/MapView.jsx';
import SidePanel from './components/SidePanel.jsx';
import Search from './components/Search.jsx';
import Drawer from './components/Drawer.jsx';
import { Dot, ICON } from './components/ui.jsx';

function Stats({ data }) {
  const villes = new Set(data.sites.map(s => s.ville).filter(Boolean)).size;
  return [
    [data.sites.length, 'Marchés'], [data.zones.length, 'Pôles'], [villes, 'Villes'],
    [fmtPct(avg(data.sites.map(s => s.occupationPct))), 'Occupation moy.']
  ].map(([b, s]) => <div className="stat" key={s}><b>{b}</b><span>{s}</span></div>);
}

const EMPTY = { sites: [], zones: [], activites: {}, communes: [], zoneOfCommune: {}, sync: null };

export default function App() {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState(EMPTY);
  const [zone, setZone] = useState(null);
  const [unplacedView, setUnplacedView] = useState(false);
  const [site, setSite] = useState(null);
  const [drawer, setDrawer] = useState({ s: null, version: 0 }); // dernière fiche affichée (reste visible pendant la fermeture)
  const [cats, setCats] = useState(new Set()); // activités retenues
  const [etats, setEtats] = useState(new Set());
  const [basemap, setBasemap] = useState(() => { try { return BASEMAPS[localStorage.basemap] ? localStorage.basemap : 'sombre'; } catch { return 'sombre'; } });
  const [sideOpen, setSideOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const map = useRef(null);

  // valeurs courantes pour les rappels asynchrones (minuteries, carte, clavier)
  const cur = useRef({});
  cur.current = { data, zone, site };

  const visible = data.sites.filter(s => (!cats.size || [...cats].some(k => s.activiteKeys.has(k))) && (!etats.size || etats.has(s.etatKey)));
  const onMap = zone ? visible.filter(s => s.zone === zone) : visible;

  /* ---------- navigation ---------- */
  const selectZone = z => {
    const { site } = cur.current;
    const keep = site && site.zone === z.key;
    if (!keep) setSite(null);
    setZone(z.key); setUnplacedView(false);
    if (innerWidth < 760 && !keep) setSideOpen(true);
    map.current.fitZone(z, keep);
  };
  // clic sur la carte : une autre zone l'ouvre, la zone déjà ouverte referme simplement la fiche
  const onMapZone = z => { if (cur.current.zone === z.key) closeSite(); else selectZone(z); };
  const back = () => {
    setZone(null); setUnplacedView(false); setSite(null);
    map.current.fitBenin(false);
  };
  const selectSite = s => {
    setSite(s); setDrawer(d => ({ s, version: d.version + 1 }));
    if (s.zone) { setZone(s.zone); setUnplacedView(false); }
    if (s.pos) map.current.flyToSite(s);
    if (innerWidth < 760) setSideOpen(false);
  };
  const closeSite = () => setSite(null);
  // flèche retour de la fiche : on retrouve la liste d'où l'on vient (sur mobile, le panneau se rouvre)
  const backToList = () => { closeSite(); if (innerWidth < 760) setSideOpen(true); };
  // menu (mobile) : toujours la liste des pôles ; un second appui referme le panneau
  const openZoneList = () => {
    if (sideOpen && !zone && !unplacedView) { setSideOpen(false); return; }
    if (zone || unplacedView || site) back();
    setSideOpen(true);
  };
  const escape = () => {
    const { site, zone } = cur.current;
    if (site) closeSite(); else if (zone) back();
  };
  const onPick = r => {
    if (r.type === 'site') selectSite(r.s);
    else if (r.type === 'zone') selectZone(r.z);
    else {
      setSite(null);
      if (r.z) { setZone(r.z.key); setUnplacedView(false); }
      map.current.fitCommune(r.f);
    }
  };

  /* ---------- données ---------- */
  const refresh = async () => {
    setSpinning(true);
    const next = await loadData();
    setData(next);
    // la fiche ouverte est mise à jour sur place
    const id = cur.current.site?.id;
    if (id) {
      const s = next.sites.find(x => x.id === id);
      if (s) { setSite(s); setDrawer(d => ({ ...d, s })); }
    }
    setSpinning(false);
  };
  const refreshRef = useRef(refresh); refreshRef.current = refresh;

  useEffect(() => {
    let timer;
    loadData().then(d => {
      setData(d); setReady(true);
      timer = setInterval(() => refreshRef.current(), REFRESH_EVERY);
    });
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { document.body.classList.toggle('drawer-open', !!site); }, [site]);
  useEffect(() => { try { localStorage.basemap = basemap; } catch { /* stockage indisponible */ } }, [basemap]);

  return <>
    <MapView ref={map} zones={data.zones} communes={data.communes} zoneOfCommune={data.zoneOfCommune} sites={onMap}
      zone={zone} site={site} basemap={basemap} onZoneClick={onMapZone} onSiteClick={selectSite} onBackground={closeSite} />

    <div className={`loader${ready ? ' hide' : ''}`}><div><div className="flagbar"></div>Chargement de la cartographie…</div></div>

    <div className="topbar">
      <div className="brand glass">
        <div className="flagbar"></div>
        <div><h1>Bénin · Marchés modernes</h1><small>Cartographie</small></div>
      </div>
      <div className="stats glass">{ready ? <Stats data={data} /> : null}</div>
      <div className="spacer"></div>
      <button className="toggle-side glass" aria-label="Liste des zones" onClick={openZoneList}>{ICON.menu}</button>
      <Search sites={data.sites} zones={data.zones} communes={data.communes} zoneOfCommune={data.zoneOfCommune} onPick={onPick} onEscape={escape} />
    </div>

    <SidePanel ready={ready} open={sideOpen} zones={data.zones} zone={zone} unplacedView={unplacedView}
      sites={data.sites} activites={data.activites} visible={visible} site={site} cats={cats} etats={etats} sync={data.sync} spinning={spinning}
      onCats={setCats} onEtats={setEtats} onZone={selectZone} onBack={back} onSite={selectSite}
      onUnplaced={() => { setZone(null); setUnplacedView(true); }}
      onRefresh={() => { if (ready) refresh(); }} onClose={() => setSideOpen(false)} />

    <div className="legend glass">
      {ready ? Object.entries(ETATS).filter(([k]) => data.sites.some(s => s.etatKey === k)).map(([k, e]) => (
        <span key={k}><Dot color={e.color} />{e.label}</span>
      )) : null}
    </div>

    <div className="basemaps glass" role="group" aria-label="Fond de carte">
      {ICON.layers}
      {Object.entries(BASEMAPS).map(([k, b]) => (
        <button key={k} className={basemap === k ? 'on' : ''} onClick={() => setBasemap(k)}>{b.label}</button>
      ))}
    </div>

    <Drawer s={drawer.s} open={!!site} version={drawer.version} zones={data.zones} onClose={closeSite} onBack={backToList} onZone={selectZone} onLocate={s => map.current.flyToSite(s)} />
  </>;
}
