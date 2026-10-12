import type { Poly } from './geo';
import type { FastGlobe, PathSink } from './fastglobe';

/* Schnelle Umrisse für die flache Karte (Natural Earth): derselbe Rechenweg wie d3 – Drehen um die Länge, Umrechnen,
   Nachglätten langer Kanten entlang des Großkreises (Genauigkeit 0,6 px, gleiche Regeln wie d3) –, aber ohne den
   allgemeinen Datenstrom von d3 und mit vorberechneten Werten je Ecke. Punkte außerhalb des Bildes entfallen wie beim
   Globus (fastglobe.ts). Linien über die Datumsgrenze werden wie bei d3 dort geteilt; Flächen, die nach dem Drehen
   über die Datumsgrenze reichen (Russland, Fidschi, Antarktis …), bleiben bei d3. */

interface Prep {
	/** je Ecke: Länge (Bogenmaß, ungedreht), Faktor für x, y, cos/sin der Breite, Breite */
	lam: Float64Array;
	fx: Float64Array;
	y: Float64Array;
	cp: Float64Array;
	sp: Float64Array;
	phi: Float64Array;
	/** Einheitsvektor (x, y) ungedreht – Abstände ändern sich beim Drehen um die Erdachse nicht */
	ua: Float64Array;
	ub: Float64Array;
	/** Schranke für die Abweichung Bogen ↔ Sehne nach Breite (siehe `edge`) */
	cb: Float64Array;
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
		ua = new Float64Array(n),
		ub = new Float64Array(n),
		cb = new Float64Array(n),
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
			ua[o] = cp[o] * Math.cos(l);
			ub[o] = cp[o] * Math.sin(l);
			// gemessen: Abweichung ≤ 2,5 · Maßstab · Sehne² bis 80° Breite, ≤ 19 bis 85° – hier mit doppelter Reserve
			const af = Math.abs(q[1]);
			cb[o] = af <= 80 ? 5 : af <= 85 ? 40 : Infinity;
			if (l < mn) mn = l;
			if (l > mx) mx = l;
			o++;
		}
	}
	return { lam, fx, y, cp, sp, phi, ua, ub, cb, rl, mn, mx };
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

/** Ansicht (Länge/Breite der Bildmitte in Grad), Bildmitte, Maßstab (wie d3 `scale()`), Bildgröße, Genauigkeit wie d3 */
export function fastFlat(
	lon0: number,
	lat0: number,
	cx: number,
	cy: number,
	k: number,
	W: number,
	H: number,
	prec = 0.6
): FastGlobe {
	// wie d3: rotate([-lon0, 0]), center([0, lat0]), translate([cx, cy]), precision(prec) – 0 = ohne Nachglätten
	const dl = (-lon0 % 360) * D2R,
		dx = cx - k * (0 * fxOf(lat0 * D2R)),
		dy = cy - -(k * yOf(lat0 * D2R)),
		delta2 = prec * prec;
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

	/** Kante von Ecke j nach Ecke i nachglätten wie d3. Vorab: Bei kurzen Kanten liegt die Mitte des Großkreises
	    nachweislich so nah an der Sehne (< 0,3 px), dass d3 nie teilt – dann entfällt die Rechnung mit Winkelfunktionen. */
	function edge(c: PathSink, p: Prep, j: number, xj: number, yj: number, lj: number, i: number, x: number, y: number, l: number) {
		const ddx = x - xj,
			ddy = y - yj;
		if (ddx * ddx + ddy * ddy <= 4 * delta2) return;
		const da = p.ua[i] - p.ua[j],
			db = p.ub[i] - p.ub[j],
			dc = p.sp[i] - p.sp[j],
			ch2 = da * da + db * db + dc * dc;
		if (ch2 < 0.25 && Math.max(p.cb[i], p.cb[j]) * k * ch2 < 0.3) return;
		const cj = p.cp[j],
			ci = p.cp[i];
		lineTo(c, xj, yj, lj, cj * Math.cos(lj), cj * Math.sin(lj), p.sp[j], x, y, l, ci * Math.cos(l), ci * Math.sin(l), p.sp[i], MAX_DEPTH);
	}

	/** Ring (closed: letzte Ecke = erste, wird wie bei d3 weggelassen und per Bogen geschlossen) oder Linie */
	function seq(c: PathSink, p: Prep, s: number, n: number, closed: boolean) {
		const e = s + n - (closed ? 1 : 0);
		if (e - s < 1) return;
		first = true;
		let x0 = 0,
			y0 = 0,
			l0 = 0,
			x00 = 0,
			y00 = 0,
			l00 = 0;
		for (let i = s; i < e; i++) {
			const l = wrap(p.lam[i] + dl),
				x = dx + k * (l * p.fx[i]),
				y = dy - k * p.y[i];
			if (i > s && delta2) edge(c, p, i - 1, x0, y0, l0, i, x, y, l);
			else if (i === s) {
				x00 = x;
				y00 = y;
				l00 = l;
			}
			pt(c, (x0 = x), (y0 = y));
			l0 = l;
		}
		if (closed) {
			if (delta2) edge(c, p, e - 1, x0, y0, l0, s, x00, y00, l00);
			flush(c);
			c.closePath();
		} else flush(c);
	}

	/* Linie, die nach dem Drehen über die Datumsgrenze reicht: wie d3 (clipAntimeridianLine) an der Grenze teilen –
	   Schnittpunkt auf dem Großkreis, dann auf der anderen Seite weiter. Danach wie oben nachglätten und umrechnen. */
	let hx = NaN,
		hy = 0,
		hl = 0,
		ha = 0,
		hb = 0,
		hc = 0;
	function rp(c: PathSink, l: number, f: number) {
		const cf = Math.cos(f),
			a = cf * Math.cos(l),
			b = cf * Math.sin(l),
			cc = Math.sin(f),
			x = dx + k * (l * fxOf(f)),
			y = dy - k * yOf(f);
		if (!isNaN(hx) && delta2) lineTo(c, hx, hy, hl, ha, hb, hc, x, y, l, a, b, cc, MAX_DEPTH);
		pt(c, x, y);
		hx = x;
		hy = y;
		hl = l;
		ha = a;
		hb = b;
		hc = cc;
	}
	const segStart = () => {
		first = true;
		hx = NaN;
	};
	const cross = (l0: number, f0: number, l1: number, f1: number) => {
		const s01 = Math.sin(l0 - l1);
		let c0: number, c1: number;
		return Math.abs(s01) > EPS
			? Math.atan((Math.sin(f0) * (c1 = Math.cos(f1)) * Math.sin(l1) - Math.sin(f1) * (c0 = Math.cos(f0)) * Math.sin(l0)) / (c0 * c1 * s01))
			: (f0 + f1) / 2;
	};
	function cutLine(c: PathSink, p: Prep) {
		let l0 = NaN,
			f0 = NaN,
			s0 = NaN;
		segStart();
		for (let i = 0; i < p.lam.length; i++) {
			let l1 = wrap(p.lam[i] + dl);
			const f1 = p.phi[i],
				s1 = l1 > 0 ? PI : -PI,
				d = Math.abs(l1 - l0);
			if (Math.abs(d - PI) < EPS) {
				// über einen Pol
				rp(c, l0, (f0 = (f0 + f1) / 2 > 0 ? PI / 2 : -PI / 2));
				rp(c, s0, f0);
				flush(c);
				segStart();
				rp(c, s1, f0);
				rp(c, l1, f0);
			} else if (s0 !== s1 && d >= PI) {
				if (Math.abs(l0 - s0) < EPS) l0 -= s0 * EPS;
				if (Math.abs(l1 - s1) < EPS) l1 -= s1 * EPS;
				f0 = cross(l0, f0, l1, f1);
				rp(c, s0, f0);
				flush(c);
				segStart();
				rp(c, s1, f0);
			}
			rp(c, (l0 = l1), (f0 = f1));
			s0 = s1;
		}
		flush(c);
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
				else cutLine(c, p);
			}
		}
	};
}
