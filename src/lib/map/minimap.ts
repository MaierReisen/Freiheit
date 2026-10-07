/* Kartenausschnitt eines Landes für die Länderseite (Berechnung ohne Darstellung, siehe CountryShape.svelte).
   Ergebnisse werden je Land gemerkt; die Nachbarländer der geöffneten Seite werden in Leerlaufzeiten vorberechnet,
   damit der Wechsel zu einem Nachbarn sofort die fertige Karte zeigt. */
import { geoDistance, geoGraticule10, geoInterpolate, geoOrthographic, geoPath } from 'd3-geo';
import { shapeOf } from './geo';
import { fmtHeight, type Facts, type Water } from '$lib/facts';

export const W = 340,
	H = 210;

export type Label = { x: number; y: number; t: string; cls: string; rot?: number; anchor?: 'start' | 'middle' | 'end'; split?: number };
export interface MiniMap {
	land: string;
	grat: string;
	/** Nachbarschaft je Teil mit Land (für bereist/nicht bereist) */
	around: { id: string; d: string }[];
	rivers: { d: string; w: number }[];
	lakes: string[];
	labels: Label[];
	cap: [number, number] | null;
	peak: [number, number] | null;
	peakDir: number | null;
	/** Länge/Breite → Punkt auf der Minikarte (null, wenn nicht sichtbar) */
	proj: (ll: [number, number]) => [number, number] | null;
}

const inside = (p: [number, number] | null) => !!p && p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H;

/** Linienzug weich zeichnen (Catmull-Rom als Bézier) – Flüsse und Seeufer wirken so natürlicher */
function smooth(p: [number, number][], closed = false) {
	const n = p.length;
	const at = (i: number) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
	const f = (v: number) => v.toFixed(1);
	let d = `M${f(p[0][0])} ${f(p[0][1])}`;
	for (let i = 0; i < (closed ? n : n - 1); i++) {
		const p0 = at(i - 1),
			p1 = at(i),
			p2 = at(i + 1),
			p3 = at(i + 2);
		d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
	}
	return closed ? d + 'Z' : d;
}

const cache = new Map<string, MiniMap | null>();
/** schon berechnet? (dann ohne Verzögerung zeigen) */
export const miniMapCached = (code: string) => cache.get(code);

export function miniMap(code: string, facts: Facts | null, water: Water): MiniMap | null {
	if (cache.has(code)) return cache.get(code)!;
	const m = build(code, facts, water);
	cache.set(code, m);
	return m;
}

/** Nachbarn nacheinander in Leerlaufzeiten vorberechnen (je Land ein Abschnitt). Safari kennt requestIdleCallback
    nicht: dort wartet jeder Schritt, bis seit der letzten Berührung/dem letzten Scrollen etwas Zeit vergangen ist –
    so ruckelt nichts, während man wischt oder scrollt. */
let queue: { code: string; facts: Facts | null }[] = [];
let running = false;
let lastInput = 0;
let listening = false;
function idle(f: () => void) {
	if (window.requestIdleCallback) return void window.requestIdleCallback(f, { timeout: 3000 });
	const wait = () => (performance.now() - lastInput < 700 ? setTimeout(wait, 300) : f());
	setTimeout(wait, 200);
}
export function prefetchMiniMaps(items: { code: string; facts: Facts | null }[], water: Water) {
	if (!listening) {
		listening = true;
		const mark = () => (lastInput = performance.now());
		for (const ev of ['pointerdown', 'touchmove', 'wheel', 'scroll']) window.addEventListener(ev, mark, { passive: true, capture: true });
	}
	queue = items.filter((x) => !cache.has(x.code));
	if (running) return;
	running = true;
	const step = () => {
		const next = queue.shift();
		if (!next) return void (running = false);
		if (!cache.has(next.code)) miniMap(next.code, next.facts, water);
		idle(step);
	};
	idle(step);
}

function build(code: string, facts: Facts | null, water: Water): MiniMap | null {
	const s = shapeOf(code);
	if (!s) return null;
	const ext: [[number, number], [number, number]] = [
		[26, 20],
		[W - 26, H - 20]
	];
	const fit = (o: GeoJSON.Feature | GeoJSON.FeatureCollection) =>
		geoOrthographic()
			.rotate([-s.c[0], -s.c[1]])
			.clipAngle(90)
			.fitExtent(ext, o);
	let P = fit(s.shape);
	// höchster Berg knapp außerhalb (z. B. auf einer Nachbarinsel): Ausschnitt erweitern, solange das Land groß bleibt
	const pk = facts?.peakLL;
	if (pk && !inside(P(pk) as [number, number] | null) && geoDistance(pk, s.c) < 1.2) {
		const P2 = fit({ type: 'FeatureCollection', features: [s.shape, { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: pk } }] });
		if (P2.scale() >= P.scale() * 0.6) P = P2;
	}
	const path = geoPath(P);
	const land = path(s.shape) ?? '';
	const ag = s.around.geometry as GeoJSON.MultiPolygon;
	const around = ag.coordinates.map((coordinates, k) => ({ id: s.aroundIds[k], d: path({ type: 'Polygon', coordinates }) ?? '' })).filter((x) => x.d);
	// Sichtweite in Bogenmaß (für das Vorsortieren der Gewässer)
	const reach = Math.hypot(W, H) / 2 / P.scale() + 0.02;
	const c = s.c;
	const near = (pts: [number, number][]) => {
		const step = Math.max(1, Math.floor(pts.length / 6));
		for (let i = 0; i < pts.length; i += step) if (geoDistance(pts[i], c) < reach) return true;
		return geoDistance(pts[pts.length - 1], c) < reach;
	};
	// Nur die großen, wichtigen Gewässer: Rang-Grenze nach Maßstab (große Länder nur die Hauptströme),
	// dann je Name die sichtbare Länge im Land – die längsten fünf Flüsse, die größten vier Seen
	const ppd = (P.scale() * Math.PI) / 180;
	const rankMax = ppd < 4 ? 4 : ppd < 10 ? 5 : ppd < 25 ? 6 : 8;
	const runsOf = (line: [number, number][]) => {
		const out: [number, number][][] = [];
		let cur: [number, number][] = [];
		for (const q of line) {
			const p = geoDistance(q, c) < reach * 1.4 ? (P(q) as [number, number] | null) : null;
			if (!p) {
				if (cur.length > 1) out.push(cur);
				cur = [];
				continue;
			}
			const last = cur[cur.length - 1];
			if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 1.5) cur.push(p);
		}
		if (cur.length > 1) out.push(cur);
		return out;
	};
	// Liegt ein Bildpunkt im Land? Einmal als Pixelmaske gezeichnet, danach kostet jede Abfrage nur einen Zugriff
	// (die Prüfung auf den Umrissen dauerte bei Russland & Co. auf dem Handy mehrere Sekunden)
	const mask = (() => {
		const cv = document.createElement('canvas');
		cv.width = W;
		cv.height = H;
		const cx = cv.getContext('2d', { willReadFrequently: true });
		if (!cx || !land) return null;
		cx.fill(new Path2D(land));
		return cx.getImageData(0, 0, W, H).data;
	})();
	const inPx = (x: number, y: number) => {
		const xi = Math.round(x),
			yi = Math.round(y);
		return !!mask && xi >= 0 && yi >= 0 && xi < W && yi < H && mask[(yi * W + xi) * 4 + 3] > 0;
	};
	// Länge im Land selbst zählt (Stichproben), Flüsse nur im Nachbarland fallen weg;
	// die ganzen Linien werden erst für die ausgewählten Flüsse berechnet
	const byName = new Map<string, { n: string; r: number; parts: [number, number][][]; len: number }>();
	const rank = (maxR: number, minR = 0) => {
		for (const rv of water.rivers) {
			if (!rv.n || rv.r > maxR || rv.r <= minR || geoDistance(rv.m, c) > reach * 1.4 + rv.rad) continue;
			const parts = rv.c.filter(near);
			if (!parts.length) continue;
			let len = 0;
			for (const part of parts) {
				const step = Math.max(1, Math.floor(part.length / 40));
				for (let i = step; i < part.length; i += step) {
					const a = P(part[i - step]) as [number, number] | null,
						b = P(part[i]) as [number, number] | null;
					if (a && b && inPx(b[0], b[1])) len += Math.hypot(b[0] - a[0], b[1] - a[1]);
				}
			}
			const o = byName.get(rv.n) ?? { n: rv.n, r: rv.r, parts: [], len: 0 };
			o.parts.push(...parts);
			o.len += len;
			o.r = Math.min(o.r, rv.r);
			byName.set(rv.n, o);
		}
	};
	// zuerst nur die Hauptströme; gibt es davon kaum welche im Land (z. B. Japan), auch die kleineren
	rank(rankMax);
	if ([...byName.values()].filter((x) => x.len > 18).length < 2) rank(9, rankMax);
	const ranked = [...byName.values()].filter((x) => x.len > 18).sort((a, b) => b.len * (10 - b.r) ** 2 - a.len * (10 - a.r) ** 2);
	const major = ranked.filter((x) => x.r <= rankMax);
	const top = (major.length >= 2 ? major : ranked).slice(0, 5).map((x) => ({ ...x, runs: x.parts.flatMap(runsOf) }));
	const rivers = top.map((x) => ({ d: x.runs.map((r) => smooth(r)).join(''), w: x.r <= 3 ? 2.1 : x.r <= 5 ? 1.6 : 1.2 }));
	// Beschriftung: mehrere mögliche Stellen je Fluss (Mitte, dann weiter vorn/hinten; längste Abschnitte zuerst –
	// Flüsse sind in den Daten oft gestückelt), Text entlang der Richtung dort
	const cand: { n: string; spots: { at: [number, number]; rot: number }[] }[] = [];
	for (const x of top.slice(0, 3)) {
		const segs: [number, number][][] = [];
		for (const run of x.runs) {
			let i0 = 0;
			for (let i = 0; i <= run.length; i++) {
				if (i < run.length && inside(run[i])) continue;
				if (i - i0 >= 3) segs.push(run.slice(i0, i));
				i0 = i + 1;
			}
		}
		const plen = (g: [number, number][]) => g.reduce((t, q, k) => (k ? t + Math.hypot(q[0] - g[k - 1][0], q[1] - g[k - 1][1]) : 0), 0);
		const long = segs.map((g) => ({ g, len: plen(g) })).filter((o) => o.len > 40).sort((a, b) => b.len - a.len).slice(0, 4);
		if (!long.length) continue;
		const spots = long.flatMap(({ g: best }) =>
			[0.5, 0.32, 0.68, 0.2, 0.8].map((f) => {
				const m = Math.round((best.length - 1) * f),
					a = best[Math.max(0, m - 2)],
					b = best[Math.min(best.length - 1, m + 2)];
				let rot = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
				if (rot > 90) rot -= 180;
				if (rot < -90) rot += 180;
				return { at: best[m], rot };
			})
		);
		cand.push({ n: x.n, spots });
	}
	// Seen im Land oder an seiner Grenze (Bodensee): Stichproben der Uferpunkte und ihr nahes Umfeld prüfen;
	// Fläche nur für die bedeutendsten 16 (Rang ~ Größe), Umrisse nur für die größten vier
	const near3 = (p: [number, number] | null) => !!p && [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]].some(([dx, dy]) => inPx(p[0] + dx, p[1] + dy));
	const lakeList: { parts: [number, number][][]; g: GeoJSON.Polygon; n: string; area: number }[] = [];
	let lakeN = 0;
	for (const lk of lakesByRank(water)) {
		if (lakeN >= 16) break;
		if (lk.r > rankMax + 2 || geoDistance(lk.m, c) > reach * 1.4 + lk.rad) continue;
		const parts = lk.c.filter(near);
		if (!parts.length) continue;
		const hit = parts.some((ring) => {
			const st = Math.max(1, Math.floor(ring.length / 24));
			return ring.some((q, i) => i % st === 0 && near3(P(q) as [number, number] | null));
		});
		if (!hit) continue;
		lakeN++;
		const g: GeoJSON.Polygon = { type: 'Polygon', coordinates: parts };
		const area = path.area(g);
		if (area >= 10) lakeList.push({ parts, g, n: lk.n, area });
	}
	lakeList.sort((a, b) => b.area - a.area);
	const lakesTop = lakeList
		.slice(0, 4)
		.map((l) => ({
			...l,
			d: l.parts
				.flatMap(runsOf)
				.filter((r) => r.length > 2)
				.map((r) => smooth(r, true))
				.join(''),
			at: path.centroid(l.g) as [number, number]
		}))
		.filter((l) => l.d);
	const lakes = lakesTop.map((l) => l.d);
	const lakeLabels = lakesTop.filter((l) => l.n && l.area > 120 && inside(l.at));

	// Beschriftungen: Hauptstadt und Berg zuerst, dann große Seen und Flüsse – ohne Überlappung
	const labels: Label[] = [];
	const boxes: [number, number, number, number][] = [];
	const fits = (b: [number, number, number, number]) =>
		b[0] >= 2 && b[2] <= W - 2 && b[1] >= 2 && b[3] <= H - 2 && !boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
	const tw = (t: string, px: number) => t.length * px * 0.56;
	const place = (x: number, y: number, t: string, cls: string, px: number, opts: { rot?: number; center?: boolean; split?: number } = {}) => {
		const w = tw(t, px);
		const gap = cls === 'lb-peak' ? 9 : 7;
		const tries: [number, number, 'start' | 'middle' | 'end'][] = opts.center
			? [[x, y, 'middle']]
			: [
					[x + gap, y + px * 0.35, 'start'],
					[x - gap, y + px * 0.35, 'end'],
					[x, y - gap - 1, 'middle'],
					[x, y + px + gap - 1, 'middle']
				];
		for (const [tx, ty, anchor] of tries) {
			const x0 = anchor === 'start' ? tx : anchor === 'end' ? tx - w : tx - w / 2;
			if (opts.rot !== undefined) {
				// gedrehte Schrift: kleine Kästchen entlang der Textlinie prüfen und belegen
				const ca = Math.cos((opts.rot * Math.PI) / 180),
					sa = Math.sin((opts.rot * Math.PI) / 180);
				const segs: [number, number, number, number][] = [];
				for (let d = -w / 2; d <= w / 2 + 0.1; d += Math.max(4, w / Math.ceil(w / 6))) {
					const qx = tx + d * ca,
						qy = ty + d * sa;
					segs.push([qx - 3.5, qy - px / 2 - 1, qx + 3.5, qy + px / 2 + 1]);
				}
				if (!segs.every(fits)) continue;
				boxes.push(...segs);
			} else {
				const b: [number, number, number, number] = [x0 - 2, ty - px, x0 + w + 2, ty + 3];
				if (!fits(b)) continue;
				boxes.push(b);
			}
			labels.push({ x: tx, y: ty, t, cls, rot: opts.rot, anchor, split: opts.split });
			return true;
		}
		return false;
	};
	let cap: [number, number] | null = null,
		peak: [number, number] | null = null;
	if (facts?.capLL) {
		const p = P(facts.capLL) as [number, number] | null;
		if (inside(p)) {
			cap = p;
			boxes.push([p![0] - 5, p![1] - 5, p![0] + 5, p![1] + 5]);
		}
	}
	// höchster Berg immer zeigen: zu dicht an der Hauptstadt → leicht weggerückt; außerhalb des Ausschnitts →
	// am Rand mit Pfeil in seine Richtung (z. B. Teide für Spanien, Denali für die USA)
	let peakDir: number | null = null;
	if (facts?.peakLL && facts.peak) {
		let p = geoDistance(facts.peakLL, c) < Math.PI / 2 - 0.02 ? (P(facts.peakLL) as [number, number] | null) : null;
		if (p && inside(p) && p[0] > 10 && p[0] < W - 10 && p[1] > 10 && p[1] < H - 10) {
			if (cap) {
				const dx = p[0] - cap[0],
					dy = p[1] - cap[1],
					dd = Math.hypot(dx, dy);
				if (dd < 13) p = dd < 0.5 ? [cap[0] + 9, cap[1] - 9] : [cap[0] + (dx / dd) * 13, cap[1] + (dy / dd) * 13];
			}
		} else {
			const o = P(c) as [number, number],
				q = P(geoInterpolate(c, facts.peakLL)(0.02)) as [number, number];
			let dx = q[0] - o[0],
				dy = q[1] - o[1];
			const dd = Math.hypot(dx, dy) || 1;
			dx /= dd;
			dy /= dd;
			const m = 13,
				t = Math.min(dx ? Math.abs((dx > 0 ? W - m - o[0] : o[0] - m) / dx) : Infinity, dy ? Math.abs((dy > 0 ? H - m - o[1] : o[1] - m) / dy) : Infinity);
			p = [o[0] + dx * t, o[1] + dy * t];
			peakDir = (Math.atan2(dy, dx) * 180) / Math.PI;
		}
		peak = p;
		boxes.push([p![0] - 7, p![1] - 7, p![0] + 7, p![1] + 7]);
	}
	if (cap && facts?.cap?.[0]) place(cap[0], cap[1], facts.cap[0], 'lb-cap', 11);
	if (peak && facts?.peak) {
		const n = facts.peak[0].replace(/\s*\(.*\)$/, ''); // Zusatz wie „(Teneriffa)“ steht in der Kachel
		place(peak[0], peak[1] - 1, `${n} ${fmtHeight(facts.peak[1])}`, 'lb-peak', 8.5, { split: n.length }) || place(peak[0], peak[1] - 1, n, 'lb-peak', 8.5);
	}
	for (const l of lakeLabels.slice(0, 2)) place(l.at[0], l.at[1], l.n, 'lb-water', 9, { center: true });
	for (const r of cand) r.spots.some((p) => place(p.at[0], p.at[1], r.n, 'lb-water', 9, { rot: p.rot, center: true }));

	return { land, grat: path(geoGraticule10()) ?? '', around, rivers, lakes, labels, cap, peak, peakDir, proj: (ll) => P(ll) as [number, number] | null };
}

let lakesSorted: Water['lakes'] | null = null;
const lakesByRank = (w: Water) => (lakesSorted ??= [...w.lakes].sort((a, b) => a.r - b.r));
