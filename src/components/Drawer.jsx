import { Fragment, useEffect, useState } from 'react';
import { norm, isTbd, parseDate, fmtDate, since, link, ETATS, fmtPct, MONTH_SHORT } from '../lib/utils.js';
import { Val, Dot, EtatBadge, CatIcon, ICON } from './ui.jsx';

function Hero({ s, zone, compact, onClose, onBack }) {
  return (
    <div className={`hero${compact ? ' compact' : ''}`} style={{ '--accent': ETATS[s.etatKey].color }}>
      <button className="back hero-back" aria-label="Retour à la liste" onClick={onBack}>{ICON.back}<span>{zone ? `Pôle ${zone.name}` : 'Liste des marchés'}</span></button>
      <button className="close" aria-label="Fermer" onClick={onClose}>{ICON.close}</button>
      <CatIcon cat={s.cat} size={22} className="cat-ico xl" />
      <h2>{s.nom}</h2>
      <div className="cap">{[s.ville, zone && `Pôle ${zone.name}`].filter(Boolean).join(' · ') || ' '}</div>
      <div className="badges">
        <span className="badge"><CatIcon cat={s.cat} size={11} />Marché moderne</span>
        <EtatBadge s={s} />
      </div>
    </div>
  );
}

/* Taux en anneau qui se remplit ; couleur selon la valeur, vide tant qu'il n'est pas renseigné */
function Ring({ n }) {
  const R = 26, C = 2 * Math.PI * R;
  const ratio = n === null ? 0 : Math.max(0, Math.min(1, n / 100));
  const color = ratio >= .8 ? '#2fd08a' : ratio >= .6 ? '#9be15d' : ratio >= .4 ? '#f4c542' : ratio >= .2 ? '#ff7a59' : '#ff3b5c';
  return (
    <div className="ring" style={{ '--c': color }}>
      <svg viewBox="0 0 64 64" width="64" height="64">
        <circle className="ring-track" cx="32" cy="32" r={R} />
        {n === null ? null : <circle className="ring-fill" cx="32" cy="32" r={R} strokeDasharray={C} style={{ '--off': C * (1 - ratio), '--len': C }} />}
      </svg>
      <b>{n === null ? '—' : n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}<small>%</small></b>
    </div>
  );
}

function Performance({ s }) {
  return (
    <div className="card"><h3>Performance <span className="n">trimestre en cours</span></h3>
      <div className="grid2" style={{ marginTop: 0 }}>
        <div className="kv ind note"><span>Taux d'occupation</span><Ring n={s.occupationPct} /></div>
        <div className="kv ind note"><span>Taux de recouvrement des redevances</span><Ring n={s.recouvrementPct} /></div>
      </div>
    </div>
  );
}

/* Évolution mensuelle (onglet « Statistiques ») : deux courbes sur la même échelle 0–100 %, survol mois par mois */
const SERIES = [
  { key: 'occupation', label: "Taux d'occupation", color: '#3987e5' },
  { key: 'recouvrement', label: 'Taux de recouvrement', color: '#d95926' }
];
function Evolution({ s }) {
  const [hover, setHover] = useState(null);
  const [table, setTable] = useState(false);
  const W = 360, H = 170, L = 34, R = 8, T = 10, B = 22;
  const x = i => L + i * (W - L - R) / 11, y = v => T + (1 - v / 100) * (H - T - B);
  // tracé interrompu là où le mois n'est pas renseigné
  const path = k => s.mois.reduce((d, m, i) => {
    if (m[k] === null) return d;
    const prev = i > 0 && s.mois[i - 1][k] !== null;
    return d + `${prev ? 'L' : 'M'}${x(i).toFixed(1)},${y(m[k]).toFixed(1)}`;
  }, '');
  if (!s.hasStats) return (
    <div className="card"><h3>Évolution mensuelle</h3><div className="none">Aucune donnée mensuelle renseignée pour ce marché.</div></div>
  );
  return (
    <div className="card"><h3>Évolution mensuelle <button className="link-btn" onClick={() => setTable(t => !t)}>{table ? 'Voir le graphique' : 'Voir les valeurs'}</button></h3>
      <div className="legend-row">{SERIES.map(c => <span key={c.key}><i style={{ background: c.color }}></i>{c.label}</span>)}</div>
      {table ? (
        <table className="vals">
          <thead><tr><th>Mois</th>{SERIES.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>{s.mois.map((m, i) => <tr key={i}><td>{MONTH_SHORT[i]}</td>{SERIES.map(c => <td key={c.key}>{fmtPct(m[c.key])}</td>)}</tr>)}</tbody>
        </table>
      ) : (
        <div className="chart">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Évolution mensuelle des taux d'occupation et de recouvrement de ${s.nom}`} onMouseLeave={() => setHover(null)}>
            {[0, 50, 100].map(v => <g key={v}><line className="grid-l" x1={L} x2={W - R} y1={y(v)} y2={y(v)} /><text className="ax" x={L - 6} y={y(v) + 3.5} textAnchor="end">{v} %</text></g>)}
            {[0, 3, 6, 9].map(i => <text key={i} className="ax" x={x(i)} y={H - 6} textAnchor="start">{['T1', 'T2', 'T3', 'T4'][i / 3]}</text>)}
            {hover !== null ? <line className="cross" x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} /> : null}
            {SERIES.map(c => <path key={c.key} d={path(c.key)} fill="none" stroke={c.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
            {SERIES.map(c => s.mois.map((m, i) => m[c.key] === null ? null
              : <circle key={c.key + i} className="pt" cx={x(i)} cy={y(m[c.key])} r={hover === i ? 4.5 : 3} fill={c.color} />))}
            {/* zones de survol plus larges que les points */}
            {s.mois.map((_, i) => <rect key={i} x={x(i) - (W - L - R) / 22} y={T} width={(W - L - R) / 11} height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />)}
          </svg>
          {hover !== null ? (
            <div className="tip" style={{ left: `${x(hover) / W * 100}%` }}>
              <b>{MONTH_SHORT[hover]}</b>
              {SERIES.map(c => <span key={c.key}><i style={{ background: c.color }}></i>{c.label}<em>{fmtPct(s.mois[hover][c.key])}</em></span>)}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* Jauge de l'état des infrastructures : de « Bon » à « Critique » */
function EtatGauge({ s }) {
  const scale = ['bon', 'satisfaisant', 'moyen', 'mauvais', 'critique'];
  const i = scale.indexOf(s.etatKey);
  return (
    <div className="gauge">
      {scale.map((k, j) => <i key={k} className={j === i ? 'on' : ''} style={{ '--c': ETATS[k].color }} title={ETATS[k].label}></i>)}
      <div className="gauge-l"><span>Bon</span><span>Critique</span></div>
    </div>
  );
}

function Etat({ s }) {
  const last = fmtDate(s.lastEval), next = fmtDate(s.nextEval);
  const late = parseDate(s.nextEval) && parseDate(s.nextEval) < Date.now();
  return (
    <div className="card"><h3>État des infrastructures</h3>
      <div className="etat-big" style={{ '--c': ETATS[s.etatKey].color }}>
        <Dot color={ETATS[s.etatKey].color} /><b>{isTbd(s.etat) ? ETATS[s.etatKey].label : s.etat}</b>
      </div>
      {s.etatKey !== 'nd' ? <EtatGauge s={s} /> : null}
      <div className="grid2">
        <div className="kv"><span>Dernière évaluation</span><b>{last || <Val v="" />}</b>{since(s.lastEval) ? <small>{since(s.lastEval)}</small> : null}</div>
        <div className={`kv${late ? ' late' : ''}`}><span>Prochaine évaluation</span><b>{next || <Val v="" />}</b>{since(s.nextEval) ? <small>{late ? `en retard · ${since(s.nextEval)}` : since(s.nextEval)}</small> : null}</div>
      </div>
    </div>
  );
}

function Activites({ s }) {
  return (
    <div className="card"><h3>Activités <span className="n">{s.activiteList.length || ''}</span></h3>
      {s.activiteList.length ? <div className="tags">{s.activiteList.map(a => <span key={a} className="tag">{a}</span>)}</div> : <Val v="" />}
    </div>
  );
}

function Actions({ s }) {
  const items = isTbd(s.actions) ? [] : s.actions.split(/\n+|;\s*/).map(x => x.replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean);
  return (
    <div className="card"><h3>{ICON.tools}Actions à entreprendre</h3>
      {items.length > 1 ? <ul className="todo">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
        : items.length ? <p className="txt">{items[0]}</p> : <Val v="" />}
    </div>
  );
}

/* Colonnes ajoutées plus tard : affichées automatiquement */
function Extra({ s }) {
  const extra = Object.entries(s._cells).filter(([h, v]) => !s._used.has(h) && norm(h) && v);
  if (!extra.length) return null;
  return (
    <div className="card"><h3>Autres informations</h3><div className="grid2" style={{ marginTop: 0 }}>{extra.map(([h, v]) => (
      <div className="kv" key={h}><span>{h}</span><b>{link(v) ? <a href={v} target="_blank" rel="noopener">{v}</a> : <Val v={v} />}</b></div>
    ))}</div></div>
  );
}

export default function Drawer({ s, open, version, zones, onClose, onBack, onZone, onLocate }) {
  const zone = s && zones.find(z => z.key === s.zone);
  // mobile : en-tête réduit (icône + nom sur une ligne) dès qu'on fait défiler la fiche
  const [compact, setCompact] = useState(false);
  useEffect(() => setCompact(false), [version]);
  const onScroll = e => {
    const b = e.currentTarget;
    if (b.scrollTop < 4) setCompact(false);
    // seulement s'il reste assez à faire défiler, sinon l'en-tête rétréci ramènerait le défilement à zéro
    else if (b.scrollTop > 24 && b.scrollHeight - b.clientHeight > 160) setCompact(true);
  };
  return (
    <aside className={`drawer glass${open ? ' open' : ''}`} aria-live="polite">
      {/* la clé force un rendu neuf (animations, défilement en haut) à chaque ouverture */}
      <Fragment key={version}>{s ? <>
        <Hero s={s} zone={zone} compact={compact} onClose={onClose} onBack={onBack} />
        <div className="body" onScroll={onScroll}>
          <Performance s={s} />
          <Evolution s={s} />
          <Etat s={s} />
          <Activites s={s} />
          <Actions s={s} />
          <Extra s={s} />
        </div>
        <div className="actions">
          <button className="btn" disabled={!s.pos} onClick={() => onLocate(s)}>{ICON.target} Centrer sur la carte</button>
          <button className="btn primary" disabled={!zone} onClick={() => onZone(zone)}>{ICON.zone} Voir la zone</button>
        </div>
      </> : null}</Fragment>
    </aside>
  );
}
