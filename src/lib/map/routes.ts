import type { GeoProjection } from 'd3-geo';

/* Flugstrecken auf Globus und Karte (Tab „Flüge“): Großkreisbögen zwischen den Flughäfen und Punkte für die Flughäfen.
   Vorberechnet wird einmal je Datenstand (Punkte entlang des Bogens als Einheitsvektoren); beim Zeichnen wird nur noch
   umgerechnet – ein paar tausend Punkte, unter 1 ms. Auf dem Globus endet ein Bogen am Horizont (Rückseite bleibt leer),
   auf der Karte wird er an der Datumsgrenze geteilt. */

export interface RouteSet {
	/** Bögen: Längen-/Breitengrade (lon, lat, lon, lat …) und Einheitsvektoren (x, y, z …) der Stützpunkte */
	arcs: { ll: Float64Array; u: Float64Array; n: number; planned: boolean }[];
	/** Flughäfen (lon, lat) mit Anzahl Besuche */
	airports: { c: [number, number]; n: number }[];
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
export function buildRoutes(legs: { a: [number, number]; b: [number, number]; planned: boolean }[]): RouteSet {
	const byKey = new Map<string, { a: [number, number]; b: [number, number]; n: number; planned: boolean }>();
	const ports = new Map<string, { c: [number, number]; n: number }>();
	for (const l of legs) {
		const ka = l.a.join(','),
			kb = l.b.join(','),
			key = (ka < kb ? ka + '|' + kb : kb + '|' + ka) + (l.planned ? '|p' : '');
		const r = byKey.get(key);
		if (r) r.n++;
		else byKey.set(key, { a: l.a, b: l.b, n: 1, planned: l.planned });
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
		arcs.push({ ll, u, n: r.n, planned: r.planned });
	}
	// selten geflogene zuerst zeichnen, häufige liegen obenauf
	arcs.sort((a, b) => Number(b.planned) - Number(a.planned) || a.n - b.n);
	const airports = [...ports.values()];
	let fit: RouteSet['fit'] = null;
	if (airports.length) {
		let x = 0,
			y = 0,
			z = 0;
		for (const p of airports) {
			const v = unit(p.c[0], p.c[1]);
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
	return { arcs, airports, fit };
}

export const ROUTE_COLOR = '#F6C445';

/**
 * Bögen und Flughäfen zeichnen. globe: Blickrichtung als Einheitsvektor (Punkte dahinter werden ausgelassen);
 * t: Anteil des Aufbaus (0–1, jeder Bogen wächst vom Start zum Ziel), 1 = fertig.
 */
export function drawRoutes(c: CanvasRenderingContext2D, P: GeoProjection, rs: RouteSet, view: { globe: [number, number, number] | null; cw: number }, t = 1) {
	const front = view.globe;
	// Horizont minimal nach innen, damit der Bogen nicht über den Kugelrand hinaus gezeichnet wird
	const H = 0.02;
	const jump = view.cw * 0.5;
	const trace = (a: RouteSet['arcs'][number]) => {
		const last = Math.max(1, Math.round((a.ll.length / 2 - 1) * Math.min(1, t)));
		let pen = false,
			px = 0;
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
			// flache Karte: über die Datumsgrenze springen = neu ansetzen
			if (pen && !front && Math.abs(p[0] - px) > jump) pen = false;
			if (pen) c.lineTo(p[0], p[1]);
			else c.moveTo(p[0], p[1]);
			pen = true;
			px = p[0];
		}
	};
	c.save();
	c.lineCap = 'round';
	c.lineJoin = 'round';
	// geplante Flüge: gestrichelt, dünn
	const planned = rs.arcs.filter((a) => a.planned);
	if (planned.length) {
		c.beginPath();
		for (const a of planned) trace(a);
		c.setLineDash([3, 4]);
		c.lineWidth = 1.2;
		c.strokeStyle = 'rgba(255,244,214,.7)';
		c.stroke();
		c.setLineDash([]);
	}
	// geflogene: weicher Schein, darüber die Linie (häufige Strecken kräftiger)
	const flown = rs.arcs.filter((a) => !a.planned);
	for (const [min, max, w] of [
		[1, 1, 1.3],
		[2, 3, 1.9],
		[4, Infinity, 2.6]
	] as const) {
		const list = flown.filter((a) => a.n >= min && a.n <= max);
		if (!list.length) continue;
		c.beginPath();
		for (const a of list) trace(a);
		c.lineWidth = w + 3;
		c.strokeStyle = 'rgba(246,196,69,.22)';
		c.stroke();
		c.lineWidth = w;
		c.strokeStyle = ROUTE_COLOR;
		c.stroke();
	}
	// Flughäfen: kleiner heller Punkt mit dunklem Rand (erst wenn der Aufbau dort angekommen ist: am Ende sichtbar)
	if (t >= 1) {
		for (const ap of rs.airports) {
			if (front) {
				const v = unit(ap.c[0], ap.c[1]);
				if (v[0] * front[0] + v[1] * front[1] + v[2] * front[2] < H) continue;
			}
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
