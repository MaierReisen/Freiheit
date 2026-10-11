import { geoArea, geoCentroid } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import { presimplify, simplify } from 'topojson-simplify';
import ISO_NUMERIC from '../data/iso-numeric.json';

/* Bausteine der Detailstufen (LOD), gemeinsam für die App (geo.ts) und den Hintergrund-Rechner (lod.worker.ts):
   Länderflächen aus den Kartendaten, Teilflächen mit Größe, Grenzlinien – und das Ein-/Auspacken einer fertigen
   Stufe in Zahlenreihen, damit sie ohne teures Kopieren vom Hintergrund-Rechner zur App wandern kann. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Topology = any;
type Ring = [number, number][];
/** je Teilfläche die Ringe in Original-Umlaufrichtung (zum Einpacken) */
export type Src = WeakMap<Poly, Ring[]>;
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

/* --- Formerhaltende Stufen (Visvalingam): Schwelle = Fläche des kleinsten bleibenden Dreiecks in Grad².
   Anders als „jeden n-ten Punkt behalten“ bleiben Buchten, Kaps und Grenzverläufe erhalten – die Formen werden
   nicht zackig. Die Karte wählt je Zoom die gröbste Stufe, deren Fehler auf dem Bildschirm unter ~0,4 px bleibt. --- */
export const SIMP_W = [0.1, 0.03, 0.01, 0.003, 0.001, 0.0003, 0.0001]; // 50m-Daten: 'v0' … 'v6'
export const FINE_W = [0.0003, 0.0001, 0.00003, 0.00001, 0.000003, 0.000001]; // 10m-Daten: 'w0' … 'w5'
export const FINE_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json';

/* Teile ohne ISO-Code in den Kartendaten (sonst Lücken auf dem Globus, die sich nicht antippen lassen): dem Land zuordnen,
   zu dem sie gehören bzw. das sie verwaltet. Die „Indian Ocean Ter.“ werden in Weihnachtsinsel und Kokosinseln geteilt.
   Strittige Riffe (Spratly, Scarborough) bleiben ohne Land. Gilt für die mittleren (50m) und die feinen Daten (10m). */
const NO_ISO: Record<string, string> = {
	Somaliland: 'SO',
	'N. Cyprus': 'CY',
	'Cyprus U.N. Buffer Zone': 'CY',
	Akrotiri: 'CY',
	Dhekelia: 'CY',
	'Siachen Glacier': 'IN',
	Baikonur: 'KZ',
	'USNB Guantanamo Bay': 'CU',
	'Coral Sea Is.': 'AU',
	'Clipperton I.': 'FR',
	'Bajo Nuevo Bank': 'CO',
	'Serranilla Bank': 'CO'
};
type TopoGeom = { id?: string; type: string; arcs: unknown[]; properties?: { name?: string } };
export function assignIds(topo: Topology) {
	const geoms: TopoGeom[] = topo.objects.countries.geometries;
	const out: TopoGeom[] = [];
	for (const g of geoms) {
		const nm = g.properties?.name ?? '';
		if (!g.id && NO_ISO[nm]) g.id = NO_ISO[nm];
		if (!g.id && nm === 'Indian Ocean Ter.') {
			// Weihnachtsinsel liegt bei 105,7° O, die Kokosinseln bei 96,8° O
			const polys = g.type === 'MultiPolygon' ? g.arcs : [g.arcs];
			for (const code of ['CX', 'CC']) {
				const own = polys.filter((a) => {
					const lon = geoCentroid(feature(topo, { type: 'Polygon', arcs: a } as never) as never)[0];
					return code === 'CX' ? lon > 101 : lon <= 101;
				});
				if (own.length) out.push({ ...g, id: code, type: 'MultiPolygon', arcs: own });
			}
			continue;
		}
		out.push(g);
	}
	topo.objects.countries.geometries = out;
}

const NUM2A2 = ISO_NUMERIC as Record<string, string>;
/** Feine Daten (10m): numerische IDs auf Alpha-2 abbilden */
export function prepFineTopo(t: Topology) {
	t.objects.countries.geometries.forEach((g: { id?: string; properties?: { name?: string } }) => {
		g.id = NUM2A2[g.id!] || (g.properties && g.properties.name === 'Kosovo' ? 'XK' : undefined);
	});
	assignIds(t);
}

export const toFeatures = (topo: Topology): CountryFeature[] =>
	(feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection<CountryGeometry>).features as CountryFeature[];

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
export const patch = (f: CountryFeature): CountryFeature => (f.id === 'VA' ? { ...f, geometry: VATICAN } : f);

/** Teilflächen mit Größe; `src` merkt sich je Teilfläche die Ringe in Original-Umlaufrichtung (zum Einpacken) */
export function polysOf(feats: CountryFeature[], src?: Src): Poly[] {
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
			// Kippt bei einer Detailstufe die Umlaufrichtung (winzige/zusammengefallene Ringe), würde d3 „alles außer dem Land“ füllen
			// – dann färbt sich der ganze Globus in der Farbe des Landes. Deshalb hier für jede Stufe umdrehen.
			let g: GeoJSON.Polygon = { type: 'Polygon', coordinates: rings };
			if (geoArea(g) > 2 * Math.PI) g = { type: 'Polygon', coordinates: rings.map((r) => [...r].reverse()) };
			const pg = { id: f.id, g, size: Math.max(mxx - mnx, mxy - mny) };
			src?.set(pg, rings as Ring[]);
			out.push(pg);
		}
	}
	return out;
}
export const bordersOf = (topo: Topology) =>
	mesh(topo, topo.objects.countries, (a, b) => a !== b && a.id !== 'VA' && b.id !== 'VA') as GeoJSON.MultiLineString;
export function makeLod(topo: Topology, ok: (id: string) => boolean, src?: Src): Lod {
	const feats = toFeatures(topo)
		.filter((f) => f.id && ok(f.id))
		.map(patch);
	return { feats, polys: polysOf(feats, src), borders: bordersOf(topo) };
}
/** Vereinfachte Stufe aus vorbereiteten Daten (presimplify) */
export function simpLod(pre: Topology, w: number, ok: (id: string) => boolean, keep?: Lod, src?: Src): Lod {
	const lod = makeLod(simplify(pre, w), ok, src);
	// Die Antarktis umschließt den Südpol: die Vereinfachung (ebene Dreiecksflächen) lässt ihr Festland zu einem Punkt
	// zusammenfallen. Sie behält deshalb die unvereinfachte Form (50m: rund 260 Punkte, kostet beim Zeichnen nichts).
	if (keep) {
		lod.polys = [...lod.polys.filter((pg) => pg.id !== 'AQ'), ...keep.polys.filter((pg) => pg.id === 'AQ')];
		const aq = keep.feats.find((f) => f.id === 'AQ');
		if (aq) lod.feats = lod.feats.map((f) => (f.id === 'AQ' ? aq : f));
	}
	return lod;
}
export { presimplify };

/** Datenfehler der feinen Karte ausgleichen: der Vatikan ist dort zu einer Linie ohne Fläche zusammengefallen.
    Zwergstaaten (`micro`), deren feine Form deutlich kleiner ist als die mittlere (`full`), bekommen die mittlere Form. */
export function fixFine(lod: Lod, full: Lod, micro: (id: string) => boolean, src?: Src) {
	const fullById = new Map(full.feats.map((f) => [f.id, f]));
	let fixed = false;
	lod.feats = lod.feats.map((f) => {
		const ff = fullById.get(f.id);
		if (!ff || !micro(f.id)) return f;
		const a = geoArea(f); // bei zusammengefallenen Ringen kann d3 durch Rundung „fast die ganze Kugel“ liefern
		if (a >= 0.4 * geoArea(ff) && a < Math.PI) return f;
		fixed = true;
		return { ...f, geometry: ff.geometry };
	});
	if (fixed) lod.polys = polysOf(lod.feats, src);
}

/* --- Einpacken/Auspacken: eine Stufe als wenige Zahlenreihen (werden ohne Kopie übergeben) --- */
export interface PackedLod {
	pid: string[];
	size: Float64Array;
	rev: Uint8Array;
	/** Ringe je Teilfläche, Punkte je Ring, Koordinaten (Original-Umlaufrichtung) */
	nR: Int32Array;
	rLen: Int32Array;
	xy: Float64Array;
	fid: string[];
	fMulti: Uint8Array;
	/** Teilflächen je Land und deren Nummern */
	fN: Int32Array;
	fP: Int32Array;
	bLen: Int32Array;
	bxy: Float64Array;
}
export const packBuffers = (p: PackedLod) => [p.size, p.rev, p.nR, p.rLen, p.xy, p.fMulti, p.fN, p.fP, p.bLen, p.bxy].map((a) => a.buffer);

export function packLod(lod: Lod, src: Src): PackedLod {
	const P = lod.polys.length;
	const ringsOf = (pg: Poly) => src.get(pg) ?? (pg.g.coordinates as Ring[]);
	let nRing = 0,
		nPt = 0;
	for (const pg of lod.polys)
		for (const r of ringsOf(pg)) {
			nRing++;
			nPt += r.length;
		}
	const p: PackedLod = {
		pid: new Array(P),
		size: new Float64Array(P),
		rev: new Uint8Array(P),
		nR: new Int32Array(P),
		rLen: new Int32Array(nRing),
		xy: new Float64Array(nPt * 2),
		fid: [],
		fMulti: new Uint8Array(lod.feats.length),
		fN: new Int32Array(lod.feats.length),
		fP: new Int32Array(0),
		bLen: new Int32Array(0),
		bxy: new Float64Array(0)
	};
	const idx = new Map<Ring[], number>();
	let ri = 0,
		o = 0;
	lod.polys.forEach((pg, i) => {
		const rings = ringsOf(pg);
		idx.set(rings, i);
		p.pid[i] = pg.id;
		p.size[i] = pg.size;
		p.rev[i] = rings === pg.g.coordinates ? 0 : 1;
		p.nR[i] = rings.length;
		for (const r of rings) {
			p.rLen[ri++] = r.length;
			for (const q of r) {
				p.xy[o++] = q[0];
				p.xy[o++] = q[1];
			}
		}
	});
	const fP: number[] = [];
	lod.feats.forEach((f, i) => {
		const g = f.geometry,
			list = (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]) as Ring[][];
		p.fid.push(f.id);
		p.fMulti[i] = g.type === 'MultiPolygon' ? 1 : 0;
		p.fN[i] = list.length;
		for (const rings of list) fP.push(idx.get(rings) ?? -1);
	});
	p.fP = Int32Array.from(fP);
	const L = lod.borders.coordinates as Ring[];
	let nb = 0;
	for (const l of L) nb += l.length;
	p.bLen = new Int32Array(L.length);
	p.bxy = new Float64Array(nb * 2);
	o = 0;
	L.forEach((l, i) => {
		p.bLen[i] = l.length;
		for (const q of l) {
			p.bxy[o++] = q[0];
			p.bxy[o++] = q[1];
		}
	});
	return p;
}

/** Auspacken in kleinen Schritten: liefert zwischendurch `undefined` (Zeit für die App), am Ende die fertige Stufe */
export function* unpackLod(p: PackedLod): Generator<undefined, Lod | null> {
	const P = p.pid.length,
		src: Ring[][] = new Array(P),
		polys: Poly[] = new Array(P);
	let ri = 0,
		o = 0,
		work = 0;
	for (let i = 0; i < P; i++) {
		const rings: Ring[] = new Array(p.nR[i]);
		for (let k = 0; k < rings.length; k++) {
			const n = p.rLen[ri++],
				r: Ring = new Array(n);
			for (let j = 0; j < n; j++, o += 2) r[j] = [p.xy[o], p.xy[o + 1]];
			rings[k] = r;
			work += n;
		}
		src[i] = rings;
		polys[i] = {
			id: p.pid[i],
			g: { type: 'Polygon', coordinates: p.rev[i] ? rings.map((r) => [...r].reverse()) : rings },
			size: p.size[i]
		};
		if (work > 4000) {
			work = 0;
			yield;
		}
	}
	const feats: CountryFeature[] = new Array(p.fid.length);
	let k = 0;
	for (let i = 0; i < feats.length; i++) {
		const list: Ring[][] = [];
		for (let j = 0; j < p.fN[i]; j++) {
			const pi = p.fP[k++];
			if (pi < 0) return null;
			list.push(src[pi]);
		}
		feats[i] = {
			type: 'Feature',
			id: p.fid[i],
			properties: {},
			geometry: p.fMulti[i] ? { type: 'MultiPolygon', coordinates: list } : { type: 'Polygon', coordinates: list[0] }
		};
	}
	const lines: Ring[] = new Array(p.bLen.length);
	o = 0;
	for (let i = 0; i < lines.length; i++) {
		const n = p.bLen[i],
			l: Ring = new Array(n);
		for (let j = 0; j < n; j++, o += 2) l[j] = [p.bxy[o], p.bxy[o + 1]];
		lines[i] = l;
		work += n;
		if (work > 4000) {
			work = 0;
			yield;
		}
	}
	return { feats, polys, borders: { type: 'MultiLineString', coordinates: lines } };
}

/* Kartendaten (Topologie) für den Hintergrund-Rechner: Bögen als eine Zahlenreihe, der Rest ist klein */
export interface PackedTopo {
	rest: Topology;
	aLen: Int32Array;
	axy: Float64Array;
}
export function packTopo(t: Topology): PackedTopo {
	const A = t.arcs as number[][][];
	let n = 0;
	for (const a of A) n += a.length;
	const aLen = new Int32Array(A.length),
		axy = new Float64Array(n * 2);
	let o = 0;
	A.forEach((a, i) => {
		aLen[i] = a.length;
		for (const q of a) {
			axy[o++] = q[0];
			axy[o++] = q[1];
		}
	});
	return { rest: { ...t, arcs: [] }, aLen, axy };
}
export function unpackTopo(p: PackedTopo): Topology {
	const arcs: number[][][] = new Array(p.aLen.length);
	let o = 0;
	for (let i = 0; i < arcs.length; i++) {
		const n = p.aLen[i],
			a: number[][] = new Array(n);
		for (let j = 0; j < n; j++, o += 2) a[j] = [p.axy[o], p.axy[o + 1]];
		arcs[i] = a;
	}
	return { ...p.rest, arcs };
}
