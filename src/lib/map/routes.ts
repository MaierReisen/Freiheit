import type { GeoProjection } from 'd3-geo';

/* Flugstrecken auf Globus und Karte (Tab „Flüge“): Großkreisbögen zwischen den Flughäfen und Punkte für die Flughäfen.
   Vorberechnet wird einmal je Datenstand (Punkte entlang des Bogens als Einheitsvektoren); beim Zeichnen wird nur noch
   umgerechnet – ein paar tausend Punkte, unter 1 ms. Auf dem Globus endet ein Bogen am Horizont (Rückseite bleibt leer),
   auf der Karte wird er an der Datumsgrenze geteilt. */

interface Arc {
	/** Längen-/Breitengrade (lon, lat, lon, lat …) und Einheitsvektoren (x, y, z …) der Stützpunkte */
	ll: Float64Array;
	u: Float64Array;
	n: number;
	planned: boolean;
	/** Strecke als Flughafen-Paar („FRA-JFK“, alphabetisch): öffnet beim Antippen die Seite zur Strecke */
	key: string;
}
export interface RouteSet {
	arcs: Arc[];
	/** zum Zeichnen vorsortiert: geplante, geflogene nach Linienstärke (häufige Strecken kräftiger) */
	planned: Arc[];
	flown: { w: number; arcs: Arc[] }[];
	/** Flughäfen (lon, lat, Einheitsvektor) mit Anzahl Besuche */
	airports: { c: [number, number]; u: [number, number, number]; n: number }[];
	/** Mittelpunkt und Streuung (Grad) für den Übersichts-Flug */
	fit: { c: [number, number]; spread: number } | null;
}

const D2R = Math.PI / 180;
const TAU = Math.PI * 2;
/** Abstand der Stützpunkte entlang des Bogens (Grad): fein genug, dass der Bogen auch stark gezoomt rund bleibt */
const STEP = 1.2;

const unit = (lon: number, lat: number): [number, number, number] => {
	const a = lon * D2R,
		b = lat * D2R,
		cb = Math.cos(b);
	return [cb * Math.cos(a), cb * Math.sin(a), Math.sin(b)];
};

/** Strecken (Paare von [lon, lat], richtungsunabhängig zusammengefasst) → vorberechnete Bögen */
export function buildRoutes(legs: { a: [number, number]; b: [number, number]; planned: boolean; key: string }[]): RouteSet {
	const byKey = new Map<string, { a: [number, number]; b: [number, number]; n: number; planned: boolean; key: string }>();
	const ports = new Map<string, { c: [number, number]; n: number }>();
	for (const l of legs) {
		const ka = l.a.join(','),
			kb = l.b.join(','),
			key = l.key + (l.planned ? '|p' : '');
		const r = byKey.get(key);
		if (r) r.n++;
		else byKey.set(key, { a: l.a, b: l.b, n: 1, planned: l.planned, key: l.key });
		for (const [k, c] of [[ka, l.a] as const, [kb, l.b] as const]) {
			const p = ports.get(k);
			if (p) p.n++;
			else ports.set(k, { c, n: 1 });
		}
	}
	const arcs: RouteSet['arcs'] = [];
	for (const r of byKey.values()) {
		const ua = unit(r.a[0], r.a[1]),
			ub = unit(r.b[0], r.b[1]);
		const dot = Math.max(-1, Math.min(1, ua[0] * ub[0] + ua[1] * ub[1] + ua[2] * ub[2])),
			w = Math.acos(dot);
		if (w < 1e-6) continue;
		const steps = Math.max(2, Math.ceil(w / D2R / STEP)),
			sw = Math.sin(w);
		const ll = new Float64Array((steps + 1) * 2),
			u = new Float64Array((steps + 1) * 3);
		for (let i = 0; i <= steps; i++) {
			// Kugel-Interpolation (slerp) zwischen den beiden Flughäfen
			const t = i / steps,
				ka = Math.sin((1 - t) * w) / sw,
				kb = Math.sin(t * w) / sw;
			const x = ka * ua[0] + kb * ub[0],
				y = ka * ua[1] + kb * ub[1],
				z = ka * ua[2] + kb * ub[2];
			u[i * 3] = x;
			u[i * 3 + 1] = y;
			u[i * 3 + 2] = z;
			ll[i * 2] = Math.atan2(y, x) / D2R;
			ll[i * 2 + 1] = Math.atan2(z, Math.hypot(x, y)) / D2R;
		}
		arcs.push({ ll, u, n: r.n, planned: r.planned, key: r.key });
	}
	// selten geflogene zuerst zeichnen, häufige liegen obenauf
	arcs.sort((a, b) => Number(b.planned) - Number(a.planned) || a.n - b.n);
	const airports = [...ports.values()].map((p) => ({ ...p, u: unit(p.c[0], p.c[1]) }));
	const flown = arcs.filter((a) => !a.planned);
	const buckets = (
		[
			[1, 1, 1.3],
			[2, 3, 1.9],
			[4, Infinity, 2.6]
		] as const
	)
		.map(([min, max, w]) => ({ w, arcs: flown.filter((a) => a.n >= min && a.n <= max) }))
		.filter((b) => b.arcs.length);
	let fit: RouteSet['fit'] = null;
	if (airports.length) {
		let x = 0,
			y = 0,
			z = 0;
		for (const p of airports) {
			const v = p.u;
			x += v[0];
			y += v[1];
			z += v[2];
		}
		const c: [number, number] = [Math.atan2(y, x) / D2R, Math.atan2(z, Math.hypot(x, y)) / D2R];
		const uc = unit(c[0], c[1]);
		let spread = 4;
		// Streuung über alle Bogenpunkte (ein Flug über den Pol reicht weiter hinaus als seine beiden Flughäfen)
		for (const a of arcs)
			for (let i = 0; i < a.u.length; i += 3) {
				const d = Math.acos(Math.max(-1, Math.min(1, a.u[i] * uc[0] + a.u[i + 1] * uc[1] + a.u[i + 2] * uc[2]))) / D2R;
				if (d > spread) spread = d;
			}
		fit = { c, spread };
	}
	return { arcs, planned: arcs.filter((a) => a.planned), flown: buckets, airports, fit };
}

/** Strecke unter einem Bildschirmpunkt (nächster Bogen im Umkreis r, Rückseite des Globus zählt nicht) mit Abstand in px */
export function routeAt(P: GeoProjection, rs: RouteSet, view: { globe: [number, number, number] | null; lon0: number }, x: number, y: number, r: number): { key: string; d: number } | null {
	const front = view.globe;
	let best: string | null = null,
		bestD = r;
	for (const a of rs.arcs) {
		let px = NaN,
			py = NaN,
			pr = 0;
		for (let i = 0; i < a.ll.length / 2; i++) {
			if (front && a.u[i * 3] * front[0] + a.u[i * 3 + 1] * front[1] + a.u[i * 3 + 2] * front[2] < 0.02) {
				px = NaN;
				continue;
			}
			const p = P([a.ll[i * 2], a.ll[i * 2 + 1]]);
			if (!p) {
				px = NaN;
				continue;
			}
			const rr = (((a.ll[i * 2] - view.lon0) % 360) + 540) % 360 - 180;
			if (!front && Math.abs(rr - pr) > 180) px = NaN;
			pr = rr;
			// Abstand zum Teilstück (px,py)–p
			let d: number;
			if (isNaN(px)) d = Math.hypot(p[0] - x, p[1] - y);
			else {
				const dx = p[0] - px,
					dy = p[1] - py,
					l2 = dx * dx + dy * dy,
					k = l2 ? Math.max(0, Math.min(1, ((x - px) * dx + (y - py) * dy) / l2)) : 0;
				d = Math.hypot(px + k * dx - x, py + k * dy - y);
			}
			if (d < bestD) {
				bestD = d;
				best = a.key;
			}
			px = p[0];
			py = p[1];
		}
	}
	return best ? { key: best, d: bestD } : null;
}

export const ROUTE_COLOR = '#F6C445';

/**
 * Bögen und Flughäfen zeichnen. globe: Blickrichtung als Einheitsvektor (Punkte dahinter werden ausgelassen);
 * lon0: Kartenmitte (flache Karte: Schnitt bei lon0 + 180°);
 * t: Anteil des Aufbaus (0–1, jeder Bogen wächst vom Start zum Ziel), 1 = fertig; sel: ausgewählte Strecke (hell hervorgehoben).
 */
export function drawRoutes(c: CanvasRenderingContext2D, P: GeoProjection, rs: RouteSet, view: { globe: [number, number, number] | null; lon0: number; sel?: string | null }, t = 1) {
	const front = view.globe;
	// Horizont minimal nach innen, damit der Bogen nicht über den Kugelrand hinaus gezeichnet wird
	const H = 0.02;
	const trace = (a: Arc) => {
		const last = Math.max(1, Math.round((a.ll.length / 2 - 1) * Math.min(1, t)));
		let pen = false,
			pr = 0;
		for (let i = 0; i <= last; i++) {
			if (front && a.u[i * 3] * front[0] + a.u[i * 3 + 1] * front[1] + a.u[i * 3 + 2] * front[2] < H) {
				pen = false;
				continue;
			}
			const p = P([a.ll[i * 2], a.ll[i * 2 + 1]]);
			if (!p) {
				pen = false;
				continue;
			}
			// flache Karte: über den Kartenrand (gegenüber der Kartenmitte) springen = neu ansetzen
			const r = (((a.ll[i * 2] - view.lon0) % 360) + 540) % 360 - 180;
			if (pen && !front && Math.abs(r - pr) > 180) pen = false;
			if (pen) c.lineTo(p[0], p[1]);
			else c.moveTo(p[0], p[1]);
			pen = true;
			pr = r;
		}
	};
	c.save();
	c.lineCap = 'round';
	c.lineJoin = 'round';
	// geplante Flüge: gestrichelt, dünn
	if (rs.planned.length) {
		c.beginPath();
		for (const a of rs.planned) trace(a);
		c.setLineDash([3, 4]);
		c.lineWidth = 1.2;
		c.strokeStyle = 'rgba(255,244,214,.7)';
		c.stroke();
		c.setLineDash([]);
	}
	// geflogene: weicher Schein, darüber die Linie (häufige Strecken kräftiger)
	for (const { w, arcs } of rs.flown) {
		c.beginPath();
		for (const a of arcs) trace(a);
		c.lineWidth = w + 3;
		c.strokeStyle = 'rgba(246,196,69,.22)';
		c.stroke();
		c.lineWidth = w;
		c.strokeStyle = ROUTE_COLOR;
		c.stroke();
	}
	// ausgewählte Strecke: weiß mit kräftigem Schein, obenauf
	if (view.sel) {
		const sel = rs.arcs.filter((a) => a.key === view.sel);
		if (sel.length) {
			c.beginPath();
			for (const a of sel) trace(a);
			c.lineWidth = 9;
			c.strokeStyle = 'rgba(255,246,220,.3)';
			c.stroke();
			c.lineWidth = 3.2;
			c.strokeStyle = '#FFF6DC';
			c.stroke();
		}
	}
	// Flughäfen: kleiner heller Punkt mit dunklem Rand (erst wenn der Aufbau dort angekommen ist: am Ende sichtbar)
	if (t >= 1) {
		for (const ap of rs.airports) {
			if (front && ap.u[0] * front[0] + ap.u[1] * front[1] + ap.u[2] * front[2] < H) continue;
			const p = P(ap.c);
			if (!p) continue;
			const r = ap.n >= 10 ? 3.6 : ap.n >= 3 ? 3 : 2.4;
			c.beginPath();
			c.arc(p[0], p[1], r, 0, TAU);
			c.fillStyle = '#FFF6DC';
			c.fill();
			c.lineWidth = 1.4;
			c.strokeStyle = 'rgba(7,20,31,.85)';
			c.stroke();
		}
	}
	c.restore();
}
