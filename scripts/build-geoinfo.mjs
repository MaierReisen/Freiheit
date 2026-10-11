// Lage/Größe je Land (INFO) und Begrenzungskreise (FC) für die Weltkarte → src/lib/data/geoinfo.json
// Dieselbe Rechnung wie in der App (src/lib/map/geoinfo.ts), nur einmalig statt bei jedem Start.
// Aufruf: node scripts/build-geoinfo.mjs (nach Änderungen an den Kartendaten oder an geoinfo.ts/lodcore.ts)
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

const entry = `
import WORLD from './src/lib/data/world-50m.topo.json';
import { assignIds } from './src/lib/map/lodcore';
import { baseFeatures, computeInfo } from './src/lib/map/geoinfo';
assignIds(WORLD);
export default computeInfo(baseFeatures(WORLD));
`;
const out = await build({
	stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
	bundle: true,
	platform: 'node',
	format: 'esm',
	write: false,
	logLevel: 'error'
});
const mod = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
writeFileSync('src/lib/data/geoinfo.json', JSON.stringify(mod.default));
console.log('geoinfo.json:', Object.keys(mod.default.info).length, 'Länder');
