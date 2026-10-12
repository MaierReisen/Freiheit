import type { Poly } from './geo';

/* Schnelle Umrisse für den Globus: statt des allgemeinen Umrechnens von d3 (Abschneiden am Horizont, Nachglätten, Strom
   durch mehrere Stufen) rechnet eine direkte Formel auf Einheitsvektoren jede Ecke in wenigen Schritten um – rund
   zehnmal schneller. Das Bild bleibt dasselbe: Kanten folgen weiter dem Großkreis (lange Kanten werden so fein
   unterteilt, dass die Abweichung unter ~0,2 px bleibt), am Horizont wird exakt abgeschnitten und der Rand der Kugel
   entlang des Randkreises gefolgt. Nur Teile, die einen Pol umschließen (Antarktis), bleiben bei d3. */

interface Prep {
	/** Ecken als Einheitsvektoren (x, y, z) aller Ringe hintereinander */
	u: Float32Array;
	/** Anzahl Ecken je Ring (geschlossen: erste = letzte) */
	rl: number[];
}

const D2R = Math.PI / 180;
const TAU = Math.PI * 2;
const cache = new WeakMap<Poly, Prep | null>();

function prep(pg: Poly): Prep | null {
	let p = cache.get(pg);
	if (p !== undefined) return p;
	const rings = pg.g.coordinates as [number, number][][];
	// Pol-Teile (Antarktis) umschließen den Pol: dafür taugt die einfache Abschneidung nicht
	const outer = rings[0];
	let wind = 0,
		polar = false;
	for (let i = 0; i < outer.length; i++) {
		if (Math.abs(outer[i][1]) > 85) polar = true;
		if (i) {
			let d = outer[i][0] - outer[i - 1][0];
			if (d > 180) d -= 360;
			else if (d < -180) d += 360;
			wind += d;
		}
	}
	if (polar || Math.abs(wind) > 180) {
		cache.set(pg, null);
		return null;
	}
	let n = 0;
	for (const r of rings) n += r.length;
	const u = new Float32Array(n * 3),
		rl: number[] = [];
	let o = 0;
	for (const r of rings) {
		rl.push(r.length);
		for (const q of r) {
			const a = q[0] * D2R,
				b = q[1] * D2R,
				cb = Math.cos(b);
			u[o++] = cb * Math.cos(a);
			u[o++] = cb * Math.sin(a);
			u[o++] = Math.sin(b);
		}
	}
	p = { u, rl };
	cache.set(pg, p);
	return p;
}

const lineCache = new WeakMap<object, Prep>();
function prepLines(mls: GeoJSON.MultiLineString): Prep {
	let p = lineCache.get(mls);
	if (p) return p;
	const L = mls.coordinates as [number, number][][];
	let n = 0;
	for (const r of L) n += r.length;
	const u = new Float32Array(n * 3),
		rl: number[] = [];
	let o = 0;
	for (const r of L) {
		rl.push(r.length);
		for (const q of r) {
			const a = q[0] * D2R,
				b = q[1] * D2R,
				cb = Math.cos(b);
			u[o++] = cb * Math.cos(a);
			u[o++] = cb * Math.sin(a);
			u[o++] = Math.sin(b);
		}
	}
	p = { u, rl };
	lineCache.set(mls, p);
	return p;
}

let depth = new Float64Array(4096);
/** Zwischenspeicher für angeschnittene Ringe: Bildpunkte (x, y) der sichtbaren Ketten hintereinander */
let pts = new Float64Array(8192);
let np = 0;
const chainStart: number[] = [],
	chainEnd: number[] = [],
	aIn: number[] = [],
	aOut: number[] = [],
	succ: number[] = [],
	done: boolean[] = [];

/** Ziel für die Punkte: ein Zeichenkontext oder (Minikarte) ein Pfadtext-Sammler */
export type PathSink = Pick<CanvasRenderingContext2D, 'moveTo' | 'lineTo' | 'closePath'>;

export interface FastGlobe {
	/** Teil geeignet für den schnellen Weg? (sonst über d3) */
	ok(pg: Poly): boolean;
	/** Teil zum aktuellen Pfad des Zeichenkontexts hinzufügen (Unsichtbares wird weggelassen) */
	add(c: PathSink, pg: Poly): void;
	/** Linien (Grenzen, Gitter) zum aktuellen Pfad hinzufügen */
	lines(c: PathSink, mls: GeoJSON.MultiLineString): void;
}

/** Blickpunkt (Länge/Breite in Grad), Mittelpunkt des Bildes, Kugelradius und Bildgröße in Pixeln;
    `smooth = false`: Kanten gerade, ohne dem Großkreis zu folgen (wie d3 mit precision 0, für die Seen) */
export function fastGlobe(lon0: number, lat0: number, mx: number, my: number, R: number, W: number, H: number, smooth = true): FastGlobe {
	const l = lon0 * D2R,
		f = lat0 * D2R,
		sl = Math.sin(l),
		cl = Math.cos(l),
		sf = Math.sin(f),
		cf = Math.cos(f);
	// Blickrichtung (zum Betrachter), nach Osten, nach Norden
	const ox = cf * cl,
		oy = cf * sl,
		oz = sf,
		ex = -sl,
		ey = cl,
		nx = -sf * cl,
		ny = -sf * sl,
		nz = cf;
	// Abweichung einer Sehne vom Bogen ≤ R·θ²/8 → θ so wählen, dass es unter ~0,2 px bleibt
	const step = Math.min(0.5, Math.sqrt(1.6 / R)),
		cosStep = Math.cos(step);

	/* Punkte außerhalb des Bildes: liegt eine ganze Folge von Punkten auf derselben Seite außerhalb (alle links, alle
	   oberhalb …), kann der Weg dazwischen das Bild nie berühren – nur der letzte Punkt der Folge bleibt. Das spart bei
	   starkem Zoom fast alle Punkte, ohne dass sich im Bild etwas ändert. `run` = Seiten, auf denen noch ALLE Punkte
	   seit dem letzten gezeichneten liegen. */
	const PAD = 3;
	let run = 0,
		pendOn = false,
		pendX = 0,
		pendY = 0;
	const oc = (x: number, y: number) => (x < -PAD ? 1 : x > W + PAD ? 2 : 0) | (y < -PAD ? 4 : y > H + PAD ? 8 : 0);
	function mv(c: PathSink, x: number, y: number) {
		c.moveTo(x, y);
		run = oc(x, y);
		pendOn = false;
	}
	function ln(c: PathSink, x: number, y: number) {
		const k = oc(x, y);
		if (k & run) {
			run &= k;
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
		run = k;
	}
	/** zurückgehaltenen letzten Punkt ausgeben (vor dem Schließen/Beenden) */
	function fl(c: PathSink) {
		if (pendOn) {
			c.lineTo(pendX, pendY);
			pendOn = false;
		}
	}

	const put = (x: number, y: number) => {
		if (np + 2 > pts.length) {
			const g = new Float64Array(pts.length * 2);
			g.set(pts);
			pts = g;
		}
		pts[np++] = x;
		pts[np++] = y;
	};

	/** Kante a → b bis einschließlich b (der Anfangspunkt ist schon gezeichnet); buf: in den Zwischenspeicher statt auf den Kontext */
	function edge(c: PathSink, buf: boolean, px: number, py: number, pz: number, qx: number, qy: number, qz: number) {
		const d = px * qx + py * qy + pz * qz;
		if (smooth && d < cosStep) {
			const th = Math.acos(Math.max(-1, d)),
				s = Math.sin(th),
				m = Math.ceil(th / step);
			for (let i = 1; i < m; i++) {
				const w1 = Math.sin(th * (1 - i / m)) / s,
					w2 = Math.sin((th * i) / m) / s,
					x = w1 * px + w2 * qx,
					y = w1 * py + w2 * qy,
					z = w1 * pz + w2 * qz;
				if (buf) put(mx + R * (x * ex + y * ey), my - R * (x * nx + y * ny + z * nz));
				else ln(c, mx + R * (x * ex + y * ey), my - R * (x * nx + y * ny + z * nz));
			}
		}
		if (buf) put(mx + R * (qx * ex + qy * ey), my - R * (qx * nx + qy * ny + qz * nz));
		else ln(c, mx + R * (qx * ex + qy * ey), my - R * (qx * nx + qy * ny + qz * nz));
	}

	/** Ring, der den Horizont schneidet: sichtbare Ketten sammeln, jede am Horizont exakt kürzen und die Enden
	    entlang des Randkreises verbinden (Austritt → nächster Eintritt im Uhrzeigersinn: dort liegt das Innere) */
	function collect(c: PathSink, u: Float32Array, base: number, m: number, first: number) {
		for (let s = 0; s < m; s++) {
			const ia = (first - 1 + s + m) % m,
				ib = (first + s) % m,
				ja = base + ia * 3,
				jb = base + ib * 3,
				da = depth[ia],
				db = depth[ib];
			if (da < 0 && db < 0) continue;
			const px = u[ja],
				py = u[ja + 1],
				pz = u[ja + 2],
				qx = u[jb],
				qy = u[jb + 1],
				qz = u[jb + 2];
			if (da >= 0 && db >= 0) {
				edge(c, true, px, py, pz, qx, qy, qz);
				continue;
			}
			// Schnittpunkt der Kante mit dem Horizont (Tiefe 0)
			const t = da / (da - db);
			let xx = px + t * (qx - px),
				xy = py + t * (qy - py),
				xz = pz + t * (qz - pz);
			const len = Math.hypot(xx, xy, xz);
			xx /= len;
			xy /= len;
			xz /= len;
			const a = Math.atan2(xx * nx + xy * ny + xz * nz, xx * ex + xy * ey);
			if (da >= 0) {
				edge(c, true, px, py, pz, xx, xy, xz);
				chainEnd.push(np);
				aOut.push(a);
			} else {
				chainStart.push(np);
				aIn.push(a);
				put(mx + R * Math.cos(a), my - R * Math.sin(a));
				edge(c, true, xx, xy, xz, qx, qy, qz);
			}
		}
	}
	/** alle gesammelten Ketten eines Teils (auch aus mehreren Ringen: Löcher am Rand gehören dazu) verbinden und zeichnen */
	function link(c: PathSink) {
		const K = chainStart.length;
		if (!K || chainEnd.length !== K) return;
		// zu jedem Austritt der nächste Eintritt im Uhrzeigersinn (fallender Winkel)
		for (let i = 0; i < K; i++) {
			let best = 0,
				bd = 9;
			for (let j = 0; j < K; j++) {
				let d = (aOut[i] - aIn[j]) % TAU;
				if (d < 0) d += TAU;
				if (d > TAU - 1e-6) d = 0; // gleicher Punkt (Rundung)
				if (d < bd) {
					bd = d;
					best = j;
				}
			}
			succ[i] = best;
			done[i] = false;
		}
		for (let i0 = 0; i0 < K; i0++) {
			if (done[i0]) continue;
			let i = i0;
			mv(c, pts[chainStart[i]], pts[chainStart[i] + 1]);
			for (let guard = 0; guard <= K; guard++) {
				done[i] = true;
				for (let q = chainStart[i] + 2; q < chainEnd[i]; q += 2) ln(c, pts[q], pts[q + 1]);
				const j = succ[i];
				// Randkreis von hier bis zum nächsten Eintritt, im Uhrzeigersinn
				let d = (aOut[i] - aIn[j]) % TAU;
				if (d < 0) d += TAU;
				if (d > TAU - 1e-6) d = 0;
				const cnt = Math.ceil(d / step);
				for (let k = 1; k < cnt; k++) {
					const aa = aOut[i] - (d * k) / cnt;
					ln(c, mx + R * Math.cos(aa), my - R * Math.sin(aa));
				}
				if (j === i0 || done[j]) break;
				ln(c, pts[chainStart[j]], pts[chainStart[j] + 1]);
				i = j;
			}
			fl(c);
			c.closePath();
		}
	}

	return {
		lines(c, mls) {
			const P = prepLines(mls),
				u = P.u,
				rl = P.rl;
			let o = 0;
			for (let k = 0; k < rl.length; k++) {
				const m = rl[k],
					base = o;
				o += m * 3;
				if (m < 2) continue;
				if (depth.length < m) depth = new Float64Array(m * 2);
				let hidden = 0;
				for (let i = 0; i < m; i++) {
					const j = base + i * 3,
						d = u[j] * ox + u[j + 1] * oy + u[j + 2] * oz;
					depth[i] = d;
					if (d < 0) hidden++;
				}
				if (hidden === m) continue;
				let on = false;
				for (let i = 0; i < m; i++) {
					const j = base + i * 3,
						qx = u[j],
						qy = u[j + 1],
						qz = u[j + 2],
						dq = depth[i];
					if (!i) {
						if (dq >= 0) {
							mv(c, mx + R * (qx * ex + qy * ey), my - R * (qx * nx + qy * ny + qz * nz));
							on = true;
						}
						continue;
					}
					const jp = j - 3,
						px = u[jp],
						py = u[jp + 1],
						pz = u[jp + 2],
						dp = depth[i - 1];
					if (dp >= 0 && dq >= 0) edge(c, false, px, py, pz, qx, qy, qz);
					else if (dp >= 0 || dq >= 0) {
						const t = dp / (dp - dq);
						let xx = px + t * (qx - px),
							xy = py + t * (qy - py),
							xz = pz + t * (qz - pz);
						const len = Math.hypot(xx, xy, xz);
						xx /= len;
						xy /= len;
						xz /= len;
						if (dp >= 0) {
							edge(c, false, px, py, pz, xx, xy, xz);
							fl(c);
							on = false;
						} else {
							mv(c, mx + R * (xx * ex + xy * ey), my - R * (xx * nx + xy * ny + xz * nz));
							edge(c, false, xx, xy, xz, qx, qy, qz);
							on = true;
						}
					}
				}
				if (on) fl(c);
			}
		},
		ok: (pg) => prep(pg) !== null,
		add(c, pg) {
			const P = prep(pg)!,
				u = P.u,
				rl = P.rl;
			let o = 0;
			np = 0;
			chainStart.length = chainEnd.length = aIn.length = aOut.length = 0;
			for (let k = 0; k < rl.length; k++) {
				const n = rl[k],
					m = n - 1, // verschiedene Ecken (die letzte ist die erste)
					base = o;
				o += n * 3;
				if (m < 3) continue;
				if (depth.length < n) depth = new Float64Array(n * 2);
				let first = -1,
					hidden = 0;
				for (let i = 0; i < m; i++) {
					const j = base + i * 3,
						d = u[j] * ox + u[j + 1] * oy + u[j + 2] * oz;
					depth[i] = d;
					if (d < 0) hidden++;
				}
				if (hidden === m) continue; // ganz auf der Rückseite
				if (!hidden) {
					// ganz sichtbar: direkt umrechnen
					let px = u[base],
						py = u[base + 1],
						pz = u[base + 2];
					mv(c, mx + R * (px * ex + py * ey), my - R * (px * nx + py * ny + pz * nz));
					for (let i = 1; i <= m; i++) {
						const j = base + (i % m) * 3,
							qx = u[j],
							qy = u[j + 1],
							qz = u[j + 2];
						edge(c, false, px, py, pz, qx, qy, qz);
						px = qx;
						py = qy;
						pz = qz;
					}
					fl(c);
					c.closePath();
					continue;
				}
				// erste sichtbare Ecke direkt nach einer verdeckten: dort beginnt eine Kette
				for (let i = 0; i < m; i++)
					if (depth[i] >= 0 && depth[(i + m - 1) % m] < 0) {
						first = i;
						break;
					}
				collect(c, u, base, m, first);
			}
			if (chainStart.length) link(c);
		}
	};
}
