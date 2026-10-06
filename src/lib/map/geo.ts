import { geoArea, geoBounds, geoCentroid, geoDistance } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import { presimplify, simplify } from 'topojson-simplify';
import WORLD_JSON from '../data/world-50m.topo.json';
import ISO_NUMERIC from '../data/iso-numeric.json';
import { nameOf } from '../countries';

/* Geodaten der Weltkarte: Länderflächen, Lage/Größe je Land und Detailstufen (LOD). */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Topology = any;
type Ring = [number, number][];
export type CountryGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon;
export interface CountryFeature extends GeoJSON.Feature<CountryGeometry> {
	id: string;
}
export interface Poly {
	id: string;
	g: GeoJSON.Polygon;
	size: number;
}
export interface Lod {
	feats: CountryFeature[];
	polys: Poly[];
	borders: GeoJSON.MultiLineString;
}

export const WORLD: Topology = WORLD_JSON;
const NUM2A2 = ISO_NUMERIC as Record<string, string>;

export const wrapLon = (l: number) => ((l + 540) % 360) - 180;

const toFeatures = (topo: Topology): CountryFeature[] =>
	(feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection<CountryGeometry>).features as CountryFeature[];

// Tuvalu fehlt in den 50m-Kartendaten: als winzige Fläche um Funafuti ergänzen (wird wie andere Kleinstaaten als Punkt gezeichnet)
const TUVALU: CountryFeature = {
	type: 'Feature',
	id: 'TV',
	properties: { name: 'Tuvalu' },
	geometry: { type: 'Polygon', coordinates: [[[179.17, -8.56], [179.17, -8.48], [179.23, -8.48], [179.23, -8.56], [179.17, -8.56]]] }
};

// Vatikan: in beiden Kartendaten zu grob (50m: rund 1,5 km nach Westen versetzt, 10m: zu einer Linie ohne Fläche
// zusammengefallen). Eigene, genauere Form (Uhrzeigersinn, wie d3 es erwartet); seine Grenzlinien aus den Daten entfallen.
const VATICAN: GeoJSON.Polygon = {
	type: 'Polygon',
	coordinates: [
		[
			[12.4457, 41.9015],
			[12.4462, 41.9041],
			[12.4489, 41.9065],
			[12.4532, 41.9075],
			[12.456, 41.9062],
			[12.4585, 41.9022],
			[12.4566, 41.9006],
			[12.4519, 41.9003],
			[12.4478, 41.9002],
			[12.4457, 41.9015]
		]
	]
};
const patch = (f: CountryFeature): CountryFeature => (f.id === 'VA' ? { ...f, geometry: VATICAN } : f);

export const features = [...toFeatures(WORLD).filter((f) => f.id && f.id !== 'AQ').map(patch), TUVALU];

// Lage und Größe jedes Landes (größtes Teilgebiet, damit z. B. Frankreich nicht in Südamerika zentriert wird)
function mainPoly(f: CountryFeature): GeoJSON.Feature | CountryFeature {
	const g = f.geometry;
	if (!g || g.type !== 'MultiPolygon') return f;
	let best: GeoJSON.Polygon | null = null,
		ba = -1;
	for (const c of g.coordinates) {
		const p: GeoJSON.Polygon = { type: 'Polygon', coordinates: c };
		const a = geoArea(p);
		if (a > ba) {
			ba = a;
			best = p;
		}
	}
	return { type: 'Feature', properties: {}, geometry: best! };
}

/** INFO: Mittelpunkt/Größe für Tippen und Hinfliegen, FC: Begrenzungskreis zum Weglassen unsichtbarer Länder */
export const INFO: Record<string, { c: [number, number]; size: number; area: number }> = {};
export const FC: Record<string, { c: [number, number]; r: number; wLon: number; wLat: number; cLat: number }> = {};
// Teile mit derselben ID zusammenfassen (Australien steht zweimal in den Daten: Festland und Ashmore-/Cartierinseln),
// sonst überschreibt das kleine Teil Mittelpunkt, Größe und Sichtbarkeitsprüfung des Festlands
const merged = new Map<string, CountryFeature>();
for (const f of features) {
	const prev = merged.get(f.id);
	if (!prev) {
		merged.set(f.id, f);
		continue;
	}
	const parts = (g: CountryGeometry) => (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]);
	merged.set(f.id, { ...prev, geometry: { type: 'MultiPolygon', coordinates: [...parts(prev.geometry), ...parts(f.geometry)] } });
}
merged.forEach((f) => {
	const m = mainPoly(f),
		b = geoBounds(m);
	let dl = b[1][0] - b[0][0];
	if (dl < 0) dl += 360;
	INFO[f.id] = { c: geoCentroid(m), size: Math.max(dl, b[1][1] - b[0][1]), area: geoArea(f) };
	const B = geoBounds(f);
	let w = B[1][0] - B[0][0];
	if (w < 0) w += 360;
	const c: [number, number] = [wrapLon(B[0][0] + w / 2), (B[0][1] + B[1][1]) / 2];
	let r = 0;
	for (const q of [
		[B[0][0], B[0][1]],
		[B[1][0], B[0][1]],
		[B[0][0], B[1][1]],
		[B[1][0], B[1][1]]
	] as [number, number][])
		r = Math.max(r, geoDistance(c, q));
	FC[f.id] = { c, r, wLon: w / 2, wLat: (B[1][1] - B[0][1]) / 2, cLat: c[1] };
});
export const small = features.filter((f) => INFO[f.id].area < 0.0004);
export const smallIds = new Set(small.map((f) => f.id));

/* --- Detailstufen: grob (nur beim Bewegen) -> mittel -> voll (50m, in Ruhe) -> fein (10m, nur bei starkem Zoom) --- */
function decimateTopology(topo: Topology, step: number): Topology {
	const tr = topo.transform;
	const arcs = topo.arcs.map((arc: [number, number][]) => {
		let x = 0,
			y = 0;
		const pts = arc.map((p) => {
			x += p[0];
			y += p[1];
			return tr ? [x * tr.scale[0] + tr.translate[0], y * tr.scale[1] + tr.translate[1]] : [p[0], p[1]];
		});
		if (pts.length <= 6) return pts;
		const o = [pts[0]];
		for (let i = step; i < pts.length - 1; i += step) o.push(pts[i]);
		o.push(pts[pts.length - 1]);
		return o;
	});
	return { type: 'Topology', objects: topo.objects, arcs };
}
function polysOf(feats: CountryFeature[]): Poly[] {
	const out: Poly[] = [];
	for (const f of feats) {
		const g = f.geometry,
			list = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
		for (const rings of list) {
			let mnx = 181,
				mxx = -181,
				mny = 91,
				mxy = -91;
			for (const p of rings[0]) {
				if (p[0] < mnx) mnx = p[0];
				if (p[0] > mxx) mxx = p[0];
				if (p[1] < mny) mny = p[1];
				if (p[1] > mxy) mxy = p[1];
			}
			out.push({ id: f.id, g: { type: 'Polygon', coordinates: rings }, size: Math.max(mxx - mnx, mxy - mny) });
		}
	}
	return out;
}
const bordersOf = (topo: Topology) =>
	mesh(topo, topo.objects.countries, (a, b) => a !== b && a.id !== 'VA' && b.id !== 'VA') as GeoJSON.MultiLineString;
function makeLod(topo: Topology): Lod {
	const feats = toFeatures(topo)
		.filter((f) => f.id && f.id !== 'AQ' && FC[f.id])
		.map(patch);
	return { feats, polys: polysOf(feats), borders: bordersOf(topo) };
}
// Flächen füllen: jeden Ring einzeln ausdünnen und prüfen. Kippt die Umlaufrichtung oder schrumpft die Form stark,
// bleibt der Originalring erhalten (sonst würde die Karte die Insel als "alles außer der Insel" füllen).
const ringArea = (r: Ring) => {
	let a = 0;
	for (let i = 0, n = r.length - 1; i < n; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
	return a / 2;
};
function decimateRing(ring: Ring, step: number): Ring {
	if (ring.length <= 24) return ring;
	const o = [ring[0]];
	for (let i = step; i < ring.length - 1; i += step) o.push(ring[i]);
	o.push(ring[ring.length - 1]);
	if (o.length < 6) return ring;
	const a0 = ringArea(ring),
		a1 = ringArea(o);
	return a0 * a1 > 0 && Math.abs(a1) > 0.6 * Math.abs(a0) ? o : ring;
}
function decimateFeatures(feats: CountryFeature[], step: number): CountryFeature[] {
	return feats.map((f) => {
		const g = f.geometry,
			polys = (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]) as Ring[][];
		return {
			type: 'Feature',
			id: f.id,
			properties: f.properties,
			geometry: { type: 'MultiPolygon', coordinates: polys.map((poly) => poly.map((r) => decimateRing(r, step))) }
		};
	});
}

/* --- Formerhaltende Stufen (Visvalingam): Schwelle = Fläche des kleinsten bleibenden Dreiecks in Grad².
   Anders als „jeden n-ten Punkt behalten“ bleiben Buchten, Kaps und Grenzverläufe erhalten – die Formen werden
   nicht zackig. Die Karte wählt je Zoom die gröbste Stufe, deren Fehler auf dem Bildschirm unter ~0,4 px bleibt. --- */
export const SIMP_W = [0.1, 0.03, 0.01, 0.003, 0.001, 0.0003, 0.0001]; // 50m-Daten: 'v0' … 'v6'
export const FINE_W = [0.0003, 0.0001, 0.00003, 0.00001, 0.000003, 0.000001]; // 10m-Daten: 'w0' … 'w5'
let PRE: Topology | null = null,
	PRE_FINE: Topology | null = null;
function simpLod(pre: Topology, w: number): Lod {
	const lod = makeLod(simplify(pre, w));
	// sehr kleine Ringe können beim Vereinfachen die Umlaufrichtung verlieren; d3 würde dann „alles außer der Insel“ füllen
	for (const pg of lod.polys) if (geoArea(pg.g) > 2 * Math.PI) pg.g = { type: 'Polygon', coordinates: pg.g.coordinates.map((r) => [...r].reverse()) };
	return lod;
}

const LODS: Record<string, Lod> = {};
let FINE_TOPO: Topology | null = null;
export function getLod(name: string): Lod | null {
	if (LODS[name]) return LODS[name];
	if (/^v\d$/.test(name)) {
		PRE ??= presimplify(WORLD);
		return (LODS[name] = simpLod(PRE, SIMP_W[Number(name[1])]));
	}
	if (/^w\d$/.test(name)) {
		if (!FINE_TOPO) return null;
		PRE_FINE ??= presimplify(FINE_TOPO);
		return (LODS[name] = simpLod(PRE_FINE, FINE_W[Number(name[1])]));
	}
	// 'f3', 'f6' …: ausgedünnte Fassung der feinen Daten für die Bewegung bei starkem Zoom (erst nach dem Laden)
	if (/^f\d+$/.test(name)) {
		const base = LODS.fine;
		if (!base || !FINE_TOPO) return null;
		const step = Number(name.slice(1));
		const feats = decimateFeatures(base.feats, step);
		return (LODS[name] = { feats, polys: polysOf(feats), borders: bordersOf(decimateTopology(FINE_TOPO, step)) });
	}
	if (name === 'full') return (LODS.full = makeLod(WORLD));
	if (name[0] === 's') {
		const step = Number(name.slice(1));
		const feats = decimateFeatures(getLod('full')!.feats, step);
		return (LODS[name] = { feats, polys: polysOf(feats), borders: bordersOf(decimateTopology(WORLD, step)) });
	}
	return null;
}

const FINE_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json';
/** Feine Grenzen (10m) für starken Zoom nachladen; numerische IDs auf Alpha-2 abbilden */
export async function fetchFineLod(): Promise<Lod> {
	const r = await fetch(FINE_URL);
	if (!r.ok) throw new Error('http');
	const t = await r.json();
	t.objects.countries.geometries.forEach((g: { id?: string; properties?: { name?: string } }) => {
		g.id = NUM2A2[g.id!] || (g.properties && g.properties.name === 'Kosovo' ? 'XK' : undefined);
	});
	FINE_TOPO = t;
	const lod = makeLod(t);
	// Datenfehler der feinen Karte ausgleichen: der Vatikan ist dort zu einer Linie ohne Fläche zusammengefallen.
	// Zwergstaaten, deren feine Form deutlich kleiner ist als die mittlere, bekommen die mittlere Form.
	const full = getLod('full');
	if (full) {
		const fullById = new Map(full.feats.map((f) => [f.id, f]));
		let fixed = false;
		lod.feats = lod.feats.map((f) => {
			const ff = fullById.get(f.id);
			if (!ff || INFO[f.id]?.area >= 0.0001) return f;
			const a = geoArea(f); // bei zusammengefallenen Ringen kann d3 durch Rundung „fast die ganze Kugel“ liefern
			if (a >= 0.4 * geoArea(ff) && a < Math.PI) return f;
			fixed = true;
			return { ...f, geometry: ff.geometry };
		});
		if (fixed) lod.polys = polysOf(lod.feats);
	}
	return (LODS.fine = lod);
}
export const fineLod = () => LODS.fine as Lod | undefined;
/** Ist die Detailstufe schon gebaut? (so lässt sich vermeiden, sie mitten in einer Geste zu erzeugen) */
export const lodReady = (name: string) => !!LODS[name];

/** Alle Länder der Karte, alphabetisch nach deutschem Namen (für die Länderauswahl) */
export const ALL = [...new Set(features.map((f) => f.id))].sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'de'));
