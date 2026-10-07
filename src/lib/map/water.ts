import { geoArea, geoDistance } from 'd3-geo';
import { loadWater, type WaterFeature } from '../facts';
import { wrapLon } from './geo';

/* Große Seen für Globus und Karte (dieselben Daten wie die Minikarte). Einmal nach dem Laden vorbereitet:
   je See mehrere Detailstufen (formerhaltend ausgedünnt), Lage/Ausdehnung zum schnellen Weglassen. */

type Line = [number, number][];
export interface WaterItem {
	r: number;
	/** Mittelpunkt und Ausdehnung (Bogenmaß) für den Globus */
	m: [number, number];
	rad: number;
	/** Größe ohne Zuschlag (Bogenmaß) – entscheidet, ab wann ein See zu sehen ist */
	sz: number;
	/** flache Karte: Mitte und halbe Breite/Höhe in Grad (wLon < 0: über die Datumsgrenze, immer prüfen) */
	cLon: number;
	cLat: number;
	wLon: number;
	wLat: number;
	/** Detailstufen grob → fein, je Ring ein Polygon */
	lv: GeoJSON.Polygon[][];
}
export interface WaterLayer {
	/** nach Rang sortiert (wichtigste zuerst) */
	lakes: WaterItem[];
}
/** nur Seen bis zu diesem Rang (kleinere zeigt die Weltkarte nie) */
const MAX_RANK = 5;
/** Toleranz der Stufen in Grad; die letzte Stufe sind die Originaldaten (0,019°) */
export const WATER_TOL = [0.4, 0.15, 0.06, 0];

/** Douglas-Peucker ohne Rekursion */
function dp(pts: Line, tol: number): Line {
	const n = pts.length;
	if (n < 3 || !tol) return pts;
	const keep = new Uint8Array(n);
	keep[0] = keep[n - 1] = 1;
	const stack = [0, n - 1];
	while (stack.length) {
		const b = stack.pop()!,
			a = stack.pop()!;
		const [ax, ay] = pts[a],
			[bx, by] = pts[b],
			L = Math.hypot(bx - ax, by - ay) || 1e-12;
		let dmax = 0,
			idx = -1;
		for (let i = a + 1; i < b; i++) {
			const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L;
			if (d > dmax) {
				dmax = d;
				idx = i;
			}
		}
		if (dmax > tol) {
			keep[idx] = 1;
			stack.push(a, idx, idx, b);
		}
	}
	return pts.filter((_, i) => keep[i]);
}
/** Ring ausdünnen (am weitesten entfernten Punkt teilen, sonst fiele ein geschlossener Ring zusammen) */
function dpRing(ring: Line, tol: number): Line | null {
	if (!tol) return ring;
	const a = ring[0];
	let k = 0,
		dk = -1;
	for (let i = 0; i < ring.length; i++) {
		const d = Math.hypot(ring[i][0] - a[0], ring[i][1] - a[1]);
		if (d > dk) {
			dk = d;
			k = i;
		}
	}
	const out = [...dp(ring.slice(0, k + 1), tol).slice(0, -1), ...dp(ring.slice(k), tol)];
	return out.length >= 4 ? out : null;
}
/** d3 füllt Ringe mit falscher Umlaufrichtung als „alles außer dem See“ – dann umdrehen */
function poly(ring: Line): GeoJSON.Polygon {
	const g: GeoJSON.Polygon = { type: 'Polygon', coordinates: [ring] };
	if (geoArea(g) > 2 * Math.PI) g.coordinates = [[...ring].reverse()];
	return g;
}
function extent(f: WaterFeature) {
	let x0 = 181,
		x1 = -181,
		y0 = 91,
		y1 = -91;
	for (const l of f.c)
		for (const [x, y] of l) {
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;
		}
	const cross = x1 - x0 > 180;
	return { cLon: wrapLon((x0 + x1) / 2), cLat: (y0 + y1) / 2, wLon: cross ? -1 : (x1 - x0) / 2, wLat: (y1 - y0) / 2 };
}
function base(f: WaterFeature) {
	return { r: f.r, m: f.m, rad: f.rad, sz: Math.max(0, f.rad - 0.01), ...extent(f) };
}

let layer: WaterLayer | null = null,
	loading = false;
export const waterLayer = () => layer;
/** Seen laden und vorbereiten (in Häppchen, damit nichts ruckelt); `done` wird danach aufgerufen */
export function loadWaterLayer(idle: (f: () => void) => void, done: () => void) {
	if (layer || loading) return;
	loading = true;
	loadWater()
		.then((w) => {
			const lakes: WaterItem[] = [];
			const ls = w.lakes.filter((f) => f.r <= MAX_RANK).sort((a, b) => a.r - b.r);
			let i = 0;
			const step = () => {
				const t0 = performance.now();
				for (; i < ls.length && performance.now() - t0 < 8; i++) {
					const f = ls[i];
					lakes.push({ ...base(f), lv: WATER_TOL.map((t) => f.c.map((r) => dpRing(r, t)).filter((r): r is Line => !!r).map(poly)) });
				}
				if (i < ls.length) return idle(step);
				layer = { lakes };
				done();
			};
			idle(step);
		})
		.catch(() => (loading = false));
}

/** Liegt das Gewässer im sichtbaren Ausschnitt? (wie bei den Ländern: Globus über den Abstand, Karte über Länge/Breite) */
export function waterInView(
	w: WaterItem,
	ci: { globe: true; va: number; vc: [number, number] } | { globe: false; hLon: number; hLat: number },
	vLon: number,
	vLat: number
) {
	if (ci.globe) return geoDistance(w.m, ci.vc) - w.rad < ci.va;
	if (Math.abs(w.cLat - vLat) - w.wLat >= ci.hLat) return false;
	return w.wLon < 0 || Math.abs(wrapLon(w.cLon - vLon)) - w.wLon < ci.hLon;
}
