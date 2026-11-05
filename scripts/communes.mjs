/* Régénère src/data/communes.topo.json — limites des 77 communes du Bénin.
   Source : geoBoundaries (gbOpen, BEN ADM2, version simplifiée), licence CC BY 4.0.
   Usage : npm run communes */
import { writeFileSync } from 'node:fs';
import { topology } from 'topojson-server';

const SRC = 'https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/BEN/ADM2/geoBoundaries-BEN-ADM2_simplified.geojson';

const geo = await (await fetch(SRC)).json();
geo.features = geo.features.map(f => ({ type: 'Feature', properties: { name: f.properties.shapeName }, geometry: f.geometry }));
const topo = topology({ communes: geo }, 1e5);
writeFileSync(new URL('../src/data/communes.topo.json', import.meta.url), JSON.stringify(topo));
console.log(`${geo.features.length} communes écrites dans src/data/communes.topo.json`);
