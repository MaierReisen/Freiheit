import { geoArea, geoCentroid, geoDistance } from 'd3-geo';
import WORLD_JSON from '../data/world-50m.topo.json';
import GEOINFO from '../data/geoinfo.json';
import { TUVALU, baseFeatures, computeInfo, wrapLon, type Fc, type Info } from './geoinfo';
import { compareNames, nameOf } from '../countries';
import {
	FINE_URL,
	FINE_W,
	SIMP_W,
	assignIds,
	bordersOf,
	fixFine,
	makeLod as makeLodOf,
	packTopo,
	polysOf,
	prepFineTopo,
	presimplify,
	simpLod as simpLodOf,
	unpackLod,
	type CountryFeature,
	type CountryGeometry,
	type Lod,
	type PackedLod,
	type Poly,
	type Topology
} from './lodcore';

/* Geodaten der Weltkarte: Länderflächen, Lage/Größe je Land und Detailstufen (LOD). */

export type { CountryFeature, CountryGeometry, Lod, Poly };
export { FINE_W, SIMP_W };
type Ring = [number, number][];

export const WORLD: Topology = WORLD_JSON;

export { wrapLon };

assignIds(WORLD_JSON);

export const features = baseFeatures(WORLD);

/** INFO: Mittelpunkt/Größe für Tippen und Hinfliegen, FC: Begrenzungskreis zum Weglassen unsichtbarer Länder.
    Vorberechnet in data/geoinfo.json (node scripts/build-geoinfo.mjs) – das Ausrechnen kostet beim Start sonst spürbar Zeit. */
export const INFO = GEOINFO.info as unknown as Info;
export const FC = GEOINFO.fc as unknown as Fc;
if (import.meta.env.DEV)
	setTimeout(() => {
		// Rundungen der Rechenumgebung (letzte Stellen) zählen nicht
		const flat = (o: unknown): number[] => (typeof o === 'number' ? [o] : Object.values(o as object).flatMap(flat));
		const a = flat(computeInfo(features)),
			b = flat({ info: INFO, fc: FC });
		if (a.length !== b.length || a.some((v, i) => Math.abs(v - b[i]) > 1e-5))
			console.warn('geoinfo.json passt nicht mehr zu den Kartendaten: node scripts/build-geoinfo.mjs ausführen');
	}, 3000);
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
const makeLod = (topo: Topology) => makeLodOf(topo, (id) => !!FC[id]);
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

let PRE: Topology | null = null,
	PRE_FINE: Topology | null = null;
const simpLod = (pre: Topology, w: number, keep?: Lod) => simpLodOf(pre, w, (id) => !!FC[id], keep);

const LODS: Record<string, Lod> = {};
let FINE_TOPO: Topology | null = null;
export function getLod(name: string): Lod | null {
	if (LODS[name]) return LODS[name];
	if (/^v\d$/.test(name)) {
		PRE ??= presimplify(WORLD);
		return (LODS[name] = simpLod(PRE, SIMP_W[Number(name[1])], getLod('full')!));
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
	// volle Stufe: dieselben Länderflächen wie `features` (ohne die ergänzte Tuvalu-Fläche) – spart beim Start das zweite Umwandeln
	if (name === 'full') {
		const feats = features.filter((f) => f !== TUVALU && FC[f.id]);
		return (LODS.full = { feats, polys: polysOf(feats), borders: bordersOf(WORLD) });
	}
	if (name[0] === 's') {
		const step = Number(name.slice(1));
		const feats = decimateFeatures(getLod('full')!.feats, step);
		return (LODS[name] = { feats, polys: polysOf(feats), borders: bordersOf(decimateTopology(WORLD, step)) });
	}
	return null;
}

/** Feine Grenzen (10m) für starken Zoom nachladen – im Hintergrund-Rechner, sonst hier */
export async function fetchFineLod(): Promise<Lod> {
	if (lodWorker()) {
		await requestLod('fine', true);
		if (LODS.fine) return LODS.fine;
	}
	const r = await fetch(FINE_URL);
	if (!r.ok) throw new Error('http');
	const t = await r.json();
	prepFineTopo(t);
	FINE_TOPO = t;
	const lod = makeLod(t);
	fixFine(lod, getLod('full')!, (id) => INFO[id]?.area < 0.0001);
	return (LODS.fine = lod);
}

/* --- Hintergrund-Rechner (lod.worker.ts): baut die vereinfachten ('v…', 'w…') und feinen Stufen, ohne dass die App
   dabei stockt. Das fertige Ergebnis kommt als Zahlenreihen und wird hier in kleinen Schritten ausgepackt. --- */
let worker: Worker | null | undefined;
const waiting = new Map<string, { ok: () => void; fail: (e: Error) => void }[]>();
function lodWorker(): Worker | null {
	if (worker !== undefined) return worker;
	worker = null;
	if (typeof Worker === 'undefined') return null;
	try {
		const w = new Worker(new URL('./lod.worker.ts', import.meta.url), { type: 'module' });
		const micro = Object.keys(INFO).filter((id) => INFO[id].area < 0.0001);
		const topo = packTopo(WORLD);
		w.postMessage({ t: 'init', topo, ids: Object.keys(FC), micro }, [topo.aLen.buffer, topo.axy.buffer]);
		w.onmessage = (e) => onWorker(e.data);
		w.onerror = () => {
			// Hintergrund-Rechner fällt aus: ab jetzt wie früher hier rechnen
			worker = null;
			const all = [...waiting.values()].flat();
			waiting.clear();
			all.forEach((c) => c.fail(new Error('worker')));
		};
		worker = w;
	} catch {
		worker = null;
	}
	return worker;
}
function settle(name: string, err?: Error) {
	const cs = waiting.get(name) || [];
	waiting.delete(name);
	cs.forEach((c) => (err ? c.fail(err) : c.ok()));
}
function onWorker(m: { t: string; name: string; p?: PackedLod; net?: boolean; msg?: string }) {
	if (m.t === 'err') return settle(m.name, new Error(m.msg));
	const it = unpackLod(m.p!);
	const step = () => {
		const t0 = performance.now();
		for (;;) {
			const r = it.next();
			if (r.done) {
				if (r.value) LODS[m.name] = r.value;
				return settle(m.name, r.value ? undefined : new Error('unpack'));
			}
			if (performance.now() - t0 > 6) return void setTimeout(step, 0);
		}
	};
	step();
}
const idle = (f: () => void) => (typeof requestIdleCallback !== 'undefined' ? requestIdleCallback(f, { timeout: 1200 }) : setTimeout(f, 60));
/** Detailstufe bauen lassen (ohne die App zu blockieren); ohne Hintergrund-Rechner hier im Leerlauf.
    `strict`: Fehler (z. B. kein Netz für die feinen Daten) weitergeben statt hier nachzurechnen. */
export function requestLod(name: string, strict = false): Promise<void> {
	if (LODS[name]) return Promise.resolve();
	const local = () => new Promise<void>((ok) => idle(() => (getLod(name), ok())));
	const w = lodWorker();
	if (!w) return name === 'fine' ? Promise.reject(new Error('worker')) : local();
	return new Promise<void>((ok, fail) => {
		const cs = waiting.get(name);
		const c = { ok, fail: (e: Error) => (strict || name === 'fine' || name[0] === 'w' ? fail(e) : local().then(ok)) };
		if (cs) return void cs.push(c);
		waiting.set(name, [c]);
		w.postMessage({ t: 'lod', name });
	});
}
export const fineLod = () => LODS.fine as Lod | undefined;
/** Ist die Detailstufe schon gebaut? (so lässt sich vermeiden, sie mitten in einer Geste zu erzeugen) */
export const lodReady = (name: string) => !!LODS[name];

/** Alle Länder der Karte, alphabetisch nach deutschem Namen (für die Länderauswahl) */
export const ALL = [...new Set(features.map((f) => f.id))].sort((a, b) => compareNames(nameOf(a), nameOf(b)));

/** Form eines Landes für Vorschaubilder: alle Teile nahe am Hauptgebiet (weit Entferntes wie Alaska, Hawaii oder
    Französisch-Guayana bleibt weg, damit das Land groß genug erscheint) – plus die Nachbarschaft als Umgebung. */
type Shape = { shape: GeoJSON.Feature; around: GeoJSON.Feature; aroundIds: string[]; aroundPolys: Poly[]; c: [number, number] };
// Mittelpunkte und fertige Formen merken: das Durchsuchen aller Länderteile kostet sonst bei jedem Öffnen spürbar Zeit
const centroids = new WeakMap<GeoJSON.Polygon, [number, number]>();
const centroidOf = (g: GeoJSON.Polygon) => {
	let c = centroids.get(g);
	if (!c) centroids.set(g, (c = geoCentroid(g) as [number, number]));
	return c;
};
const shapes = new WeakMap<Lod, Map<string, Shape | null>>();
export function shapeOf(id: string): Shape | null {
	const i = INFO[id];
	// kleine Länder mit den feinen Daten (sofern schon geladen), sonst wären Singapur & Co. nur grobe Vielecke
	let lod = (i && i.size < 8 && LODS.fine) || getLod('full');
	if (!i || !lod) return null;
	// große Länder (Russland, Kanada …) erscheinen klein: vereinfachte Umrisse reichen und sparen viel Rechenzeit
	const coarse = i.size > 40 ? 'v2' : i.size > 20 ? 'v3' : '';
	if (coarse && lodReady(coarse)) lod = getLod(coarse)!;
	let cache = shapes.get(lod);
	if (!cache) shapes.set(lod, (cache = new Map()));
	if (!cache.has(id)) cache.set(id, buildShape(id, i, lod));
	return cache.get(id)!;
}
function buildShape(id: string, i: (typeof INFO)[string], lod: Lod): Shape | null {
	let own = lod.polys.filter((p) => p.id === id);
	if (!own.length && lod !== LODS.full) own = getLod('full')!.polys.filter((p) => p.id === id);
	// Hauptgebiet = größte Fläche; dazu große Teile (≥ 25 % davon, z. B. Indonesiens Inseln) und alles in seiner Nähe
	// (Korsika ja, Azoren/Kanaren/Alaska nein – die würden das Festland klein an den Rand drücken)
	const areas = own.map((p) => geoArea(p.g));
	const mainIdx = areas.indexOf(Math.max(...areas, 0));
	const main = own[mainIdx];
	const mc = main ? centroidOf(main.g) : i.c;
	const near = (Math.max(6, Math.min(20, (main?.size ?? i.size) * 0.9)) * Math.PI) / 180;
	const parts = own.filter((p, k) => k === mainIdx || areas[k] >= 0.25 * areas[mainIdx] || geoDistance(centroidOf(p.g), mc) < near);
	const R = (Math.max(25, i.size * 1.5) * Math.PI) / 180;
	const geom: GeoJSON.Geometry = parts.length
		? { type: 'MultiPolygon', coordinates: parts.map((p) => p.g.coordinates) }
		: (features.find((f) => f.id === id)?.geometry ?? { type: 'MultiPolygon', coordinates: [] });
	// Umgebung: andere Länder in der Nähe (für den Kartenausschnitt)
	const R2 = R * 2.2;
	// Weit Entferntes erst mit einer Ecke grob aussortieren (der Mittelpunkt liegt höchstens ~1,5 Teilgrößen davon entfernt) –
	// den Mittelpunkt für alle ~1600 Teile zu berechnen kostete beim ersten Öffnen eines Landes mehrere hundert Millisekunden
	const others = lod.polys.filter((p) => {
		if (p.id === id) return false;
		const sz = (p.size * Math.PI) / 180;
		if (p.size < 60 && geoDistance(p.g.coordinates[0][0] as [number, number], i.c) > R2 + 2.5 * sz + 0.01) return false;
		return geoDistance(centroidOf(p.g), i.c) < R2 + sz;
	});
	return {
		shape: { type: 'Feature', properties: {}, geometry: geom },
		around: { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: others.map((p) => p.g.coordinates) } },
		aroundIds: others.map((p) => p.id), // je Teil das Land (z. B. für bereiste Nachbarn in Türkis)
		aroundPolys: others,
		c: parts.length ? (geoCentroid({ type: 'MultiPolygon', coordinates: parts.map((p) => p.g.coordinates) }) as [number, number]) : i.c
	};
}
