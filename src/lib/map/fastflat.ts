import type { Poly } from './geo';
import type { FastGlobe, PathSink } from './fastglobe';

/* Schnelle Umrisse für die flache Karte (Natural Earth): derselbe Rechenweg wie d3 – Drehen um die Länge, Umrechnen,
   Nachglätten langer Kanten entlang des Großkreises (Genauigkeit 0,6 px, gleiche Regeln wie d3) –, aber ohne den
   allgemeinen Datenstrom von d3 und mit vorberechneten Werten je Ecke. Punkte außerhalb des Bildes entfallen wie beim
   Globus (fastglobe.ts). Teile, die nach dem Drehen über die Datumsgrenze reichen (Russland, Fidschi, Antarktis …),
   und solche Linien bleiben bei d3. */

interface Prep {
	/** je Ecke: Länge (Bogenmaß, ungedreht), Faktor für x, y, cos/sin der Breite, Breite */
	lam: Float64Array;
	fx: Float64Array;
	y: Float64Array;
	cp: Float64Array;
	sp: Float64Array;
	phi: Float64Array;
	/** Anzahl Ecken je Ring/Linie */
	rl: number[];
	mn: number;
	mx: number;
}

const D2R = Math.PI / 180,
	PI = Math.PI,
	TAU = 2 * PI,
	EPS = 1e-6,
	MAX_DEPTH = 16,
	COS_MIN = Math.cos(30 * D2R);

const fxOf = (phi: number) => {
	const phi2 = phi * phi,
		phi4 = phi2 * phi2;
	return 0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4));
};
const yOf = (phi: number) => {
	const phi2 = phi * phi,
		phi4 = phi2 * phi2;
	return phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)));
};

function prepRings(rings: [number, number][][]): Prep {
	let n = 0;
	for (const r of rings) n += r.length;
	const lam = new Float64Array(n),
		fx = new Float64Array(n),
		y = new Float64Array(n),
		cp = new Float64Array(n),
		sp = new Float64Array(n),
		phi = new Float64Array(n),
		rl: number[] = [];
	let o = 0,
		mn = Infinity,
		mx = -Infinity;
	for (const r of rings) {
		rl.push(r.length);
		for (const q of r) {
			const l = q[0] * D2R,
				f = q[1] * D2R;
			lam[o] = l;
			fx[o] = fxOf(f);
			y[o] = yOf(f);
			cp[o] = Math.cos(f);
			sp[o] = Math.sin(f);
			phi[o] = f;
			if (l < mn) mn = l;
			if (l > mx) mx = l;
			o++;
		}
	}
	return { lam, fx, y, cp, sp, phi, rl, mn, mx };
}
const polyCache = new WeakMap<Poly, Prep>();
const prepPoly = (pg: Poly) => {
	let p = polyCache.get(pg);
	if (!p) polyCache.set(pg, (p = prepRings(pg.g.coordinates as [number, number][][])));
	return p;
};
const lineCache = new WeakMap<[number, number][], Prep>();
const prepLine = (l: [number, number][]) => {
	let p = lineCache.get(l);
	if (!p) lineCache.set(l, (p = prepRings([l])));
	return p;
};

/** Ansicht (Länge/Breite der Bildmitte in Grad), Bildmitte, Maßstab (wie d3 `scale()`), Bildgröße;
    `slow` zeichnet ein Teil bzw. eine Linie über d3 (für alles, was über die Datumsgrenze reicht) */
export function fastFlat(
	lon0: number,
	lat0: number,
	cx: number,
	cy: number,
	k: number,
	W: number,
	H: number,
	slow: (g: GeoJSON.Polygon | GeoJSON.LineString) => void
): FastGlobe {
	// wie d3: rotate([-lon0, 0]), center([0, lat0]), translate([cx, cy]), precision(0.6)
	const dl = (-lon0 % 360) * D2R,
		dx = cx - k * (0 * fxOf(lat0 * D2R)),
		dy = cy - -(k * yOf(lat0 * D2R)),
		delta2 = 0.6 * 0.6;
	const wrap = (l: number) => (l > PI ? l - TAU : l < -PI ? l + TAU : l);
	/** gedrehte Längen ohne Sprung an der Datumsgrenze? Dann ist d3s Abschneiden dort wirkungslos */
	const clean = (p: Prep) => {
		const a = wrap(p.mn + dl),
			b = wrap(p.mx + dl);
		return a <= b && a > -PI + EPS && b < PI - EPS;
	};

	// Punkte außerhalb des Bildes weglassen (wie fastglobe.ts)
	const PAD = 3;
	let run = 0,
		pendOn = false,
		pendX = 0,
		pendY = 0,
		first = true;
	const oc = (x: number, y: number, m: number) => (x < -m ? 1 : x > W + m ? 2 : 0) | (y < -m ? 4 : y > H + m ? 8 : 0);
	function pt(c: PathSink, x: number, y: number) {
		if (first) {
			c.moveTo(x, y);
			run = oc(x, y, PAD);
			pendOn = false;
			first = false;
			return;
		}
		const q = oc(x, y, PAD);
		if (q & run) {
			run &= q;
			pendX = x;
			pendY = y;
			pendOn = true;
			return;
		}
		if (pendOn) {
			c.lineTo(pendX, pendY);
			pendOn = false;
		}
		c.lineTo(x, y);
		run = q;
	}
	function flush(c: PathSink) {
		if (pendOn) {
			c.lineTo(pendX, pendY);
			pendOn = false;
		}
	}

	// Nachglätten wie d3 (resample.js): Mitte auf dem Großkreis prüfen, ggf. teilen
	function lineTo(
		c: PathSink,
		x0: number,
		y0: number,
		l0: number,
		a0: number,
		b0: number,
		c0: number,
		x1: number,
		y1: number,
		l1: number,
		a1: number,
		b1: number,
		c1: number,
		depth: number
	) {
		const ddx = x1 - x0,
			ddy = y1 - y0,
			d2 = ddx * ddx + ddy * ddy;
		if (d2 > 4 * delta2 && depth--) {
			// beide Enden weit auf derselben Seite außerhalb: der Bogen dazwischen bleibt unsichtbar
			const m = PAD + Math.abs(ddx) + Math.abs(ddy);
			if (oc(x0, y0, m) & oc(x1, y1, m)) return;
			let a = a0 + a1,
				b = b0 + b1,
				cc = c0 + c1;
			const mm = Math.sqrt(a * a + b * b + cc * cc),
				phi2 = Math.asin((cc /= mm)),
				l2 = Math.abs(Math.abs(cc) - 1) < EPS || Math.abs(l0 - l1) < EPS ? (l0 + l1) / 2 : Math.atan2(b, a),
				x2 = dx + k * (l2 * fxOf(phi2)),
				y2 = dy - k * yOf(phi2),
				dx2 = x2 - x0,
				dy2 = y2 - y0,
				dz = ddy * dx2 - ddx * dy2;
			if ((dz * dz) / d2 > delta2 || Math.abs((ddx * dx2 + ddy * dy2) / d2 - 0.5) > 0.3 || a0 * a1 + b0 * b1 + c0 * c1 < COS_MIN) {
				lineTo(c, x0, y0, l0, a0, b0, c0, x2, y2, l2, (a /= mm), (b /= mm), cc, depth);
				pt(c, x2, y2);
				lineTo(c, x2, y2, l2, a, b, cc, x1, y1, l1, a1, b1, c1, depth);
			}
		}
	}

	/** Ring (closed: letzte Ecke = erste, wird wie bei d3 weggelassen und per Bogen geschlossen) oder Linie */
	function seq(c: PathSink, p: Prep, s: number, n: number, closed: boolean) {
		const e = s + n - (closed ? 1 : 0);
		if (e - s < 1) return;
		first = true;
		let x0 = NaN,
			y0 = NaN,
			l0 = 0,
			a0 = 0,
			b0 = 0,
			c0 = 0,
			x00 = 0,
			y00 = 0,
			l00 = 0,
			a00 = 0,
			b00 = 0,
			c00 = 0;
		for (let i = s; i < e; i++) {
			const l = wrap(p.lam[i] + dl),
				cp = p.cp[i],
				a = cp * Math.cos(l),
				b = cp * Math.sin(l),
				cc = p.sp[i],
				x = dx + k * (l * p.fx[i]),
				y = dy - k * p.y[i];
			if (i > s) lineTo(c, x0, y0, l0, a0, b0, c0, x, y, l, a, b, cc, MAX_DEPTH);
			pt(c, (x0 = x), (y0 = y));
			l0 = l;
			a0 = a;
			b0 = b;
			c0 = cc;
			if (i === s) {
				x00 = x;
				y00 = y;
				l00 = l;
				a00 = a;
				b00 = b;
				c00 = cc;
			}
		}
		if (closed) {
			lineTo(c, x0, y0, l0, a0, b0, c0, x00, y00, l00, a00, b00, c00, MAX_DEPTH);
			flush(c);
			c.closePath();
		} else flush(c);
	}

	return {
		ok: (pg) => clean(prepPoly(pg)),
		add(c, pg) {
			const p = prepPoly(pg);
			let s = 0;
			for (const n of p.rl) {
				seq(c, p, s, n, true);
				s += n;
			}
		},
		lines(c, mls) {
			for (const l of mls.coordinates as [number, number][][]) {
				const p = prepLine(l);
				if (clean(p)) seq(c, p, 0, l.length, false);
				else slow({ type: 'LineString', coordinates: l });
			}
		}
	};
}
