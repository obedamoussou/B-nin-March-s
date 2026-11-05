import { useEffect, useRef, useState } from 'react';
import { norm, plural } from '../lib/utils.js';
import { CatIcon, ICON } from './ui.jsx';

/* ---------- recherche : marchés, activités, zones et villes ---------- */
export default function Search({ sites, zones, communes, zoneOfCommune, onPick, onEscape }) {
  const input = useRef(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  const show = r => { setResults(r); setOpen(r.length > 0); };
  const all = () => [
    ...sites.map(s => ({ type: 'site', s, name: s.nom, sub: s.ville || 'Ville non renseignée', words: `${s.nom} ${s.ville} ${s.activites}` })),
    ...zones.map(z => ({ type: 'zone', z, name: `Pôle ${z.name}`, sub: plural(z.sites.length, 'marché'), words: `pole ${z.name}` })),
    ...communes.map(f => {
      const z = zones.find(x => x.key === zoneOfCommune[f.key]);
      const n = sites.filter(s => s.commune === f).length;
      return { type: 'commune', f, z, name: f.properties.name, sub: `Commune${z ? ` · Pôle ${z.name}` : ''}${n ? ` · ${plural(n, 'marché')}` : ''}`, words: f.properties.name };
    })
  ];
  const go = r => {
    if (!r) return;
    setQ(''); show([]); input.current.blur();
    onPick(r);
  };

  const onChange = e => {
    const v = e.target.value; setQ(v);
    const words = v.split(/\s+/).map(norm).filter(Boolean); setIdx(0);
    const rank = { site: 0, zone: 1, commune: 2 };
    show(words.length ? all()
      .filter(r => { const t = norm(r.words); return words.every(w => t.includes(w)); })
      .sort((a, b) => rank[a.type] - rank[b.type] || norm(a.name).indexOf(words[0]) - norm(b.name).indexOf(words[0]))
      .slice(0, 9) : []);
  };
  const onKeyDown = e => {
    if (e.key === 'ArrowDown') { setIdx(Math.min(idx + 1, results.length - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setIdx(Math.max(idx - 1, 0)); e.preventDefault(); }
    else if (e.key === 'Enter') go(results[idx]);
    else if (e.key === 'Escape') { setQ(''); show([]); }
  };

  // raccourcis : Échap ferme la fiche, « / » place le curseur dans la recherche
  const escape = useRef(onEscape); escape.current = onEscape;
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' && document.activeElement !== input.current) escape.current();
      if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); input.current.focus(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="search">
      {ICON.search}
      <input ref={input} placeholder="Rechercher un marché, une activité, une ville…" autoComplete="off" value={q}
        onChange={onChange} onKeyDown={onKeyDown} onBlur={() => setTimeout(() => setOpen(false), 100)} onFocus={() => setOpen(results.length > 0)} />
      <div className={`suggest glass${open ? ' open' : ''}`}>
        {results.map((r, i) => (
          <button key={i} className={i === idx ? 'active' : ''} onMouseDown={e => { e.preventDefault(); go(r); }}>
            {r.type === 'site' ? <CatIcon cat={r.s.cat} size={13} className="cat-ico lg" />
              : <span className="cat-ico lg" style={{ '--c': r.type === 'zone' ? r.z.color : r.z?.color || '#7f8db0' }}>{r.type === 'zone' ? ICON.zone : ICON.city}</span>}
            <span className="sg-t"><b>{r.name}</b><small>{r.sub}</small></span>
            <em>{r.type === 'site' ? 'Marché' : r.type === 'zone' ? 'Zone' : 'Ville'}</em>
          </button>
        ))}
      </div>
    </div>
  );
}
