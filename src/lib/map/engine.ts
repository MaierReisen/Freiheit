import { geoContains, geoDistance, geoGraticule10, geoNaturalEarth1, geoOrthographic, geoPath, type GeoProjection } from 'd3-geo';
import { CONT_VIEW, nameOf, type ContinentCode } from '../countries';
import { FC, INFO, features, fetchFineLod, fineLod, getLod, lodReady, smallIds, wrapLon, type Lod } from './geo';

/* Weltkarte auf zwei Canvas-Ebenen: Globus (orthografisch) und flache Karte (Natural Earth).
   cvB: Karte (ändert sich selten), cvT: Punkte kleiner Länder und Beschriftung. */

export type MapMode = 'globe' | 'flat';
export type FineState = 'idle' | 'loading' | 'ready' | 'failed';

export interface MapSync {
	mode: MapMode;
	spin: boolean;
	fineState: FineState;
}

export interface MapOptions {
	cvB: HTMLCanvasElement;
	cvT: HTMLCanvasElement;
	reduce: () => boolean;
	getVisited(): Set<string>;
	/** Zählt das Land in der gewählten Länderliste? Bereiste, nicht gezählte Gebiete werden schraffiert gezeichnet */
	isCounted(code: string): boolean;
	getWish(): Set<string>;
	getSelected(): string | null;
	/** Karte sichtbar (Startseite oder Vollbild) */
	isVisible(): boolean;
	isFull(): boolean;
	/** Globus per Tipp aktiviert? Nur dann reagiert er bei Touch auf Ziehen (sonst scrollt die Seite) */
	isActive(): boolean;
	/** Tipp auf den inaktiven Globus (Touch): aktivieren */
	onActivate(): void;
	/** Startregion: Mittelpunkt und Zoom, auf die die Karte beim Start fliegt */
	getStartView(): { c: [number, number]; k: number } | null | undefined;
	onTapCountry(code: string): void;
	onTapEmpty(): void;
	/** Modus, Drehen oder Ladezustand haben sich geändert */
	onSync(s: MapSync): void;
}

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const GRAT = geoGraticule10();
const MAP_PREFS_KEY = 'freiheit-map';

// Farben der Karte (bewusst unabhängig vom Hell/Dunkel-Modus: die Karte ist eine dunkle Bühne)
const PAL = {
	oceanA: '#1D5A7A',
	oceanB: '#0C2E45',
	oceanFlat: '#10364F',
	halo: 'rgba(96,200,225,.28)',
	land: '#4B6F82',
	border: '#0D2A3D',
	grat: 'rgba(255,255,255,.07)',
	visited: '#34D1BF',
	visitedSoft: 'rgba(52,209,191,.32)', // bereist, zählt nicht (Grundfarbe unter der Schraffur)
	wish: '#F6C445',
	sel: '#FFFFFF',
	label: 'rgba(7,20,31,.92)'
};

const MOVE_STEPS = [3, 6, 10]; // von fein nach grob; wird je nach Gerätegeschwindigkeit angepasst

export function createWorldMap(o: MapOptions) {
	const { cvB, cvT, reduce } = o;
	const cv = cvT;
	const ctxB = cvB.getContext ? cvB.getContext('2d') : null,
		ctxT = cvT.getContext ? cvT.getContext('2d') : null;

	const view = { mode: 'globe' as MapMode, lon: 10, lat: 30, k: 1, spin: false };
	try {
		const p = JSON.parse(localStorage.getItem(MAP_PREFS_KEY) || '{}');
		if (p.mode === 'flat' || p.mode === 'globe') view.mode = p.mode;
		if (typeof p.spin === 'boolean') view.spin = p.spin;
	} catch {}
	const saveMapPrefs = () => {
		try {
			localStorage.setItem(MAP_PREFS_KEY, JSON.stringify({ mode: view.mode, spin: view.spin }));
		} catch {}
	};

	let stepIdx = 0,
		emaMove = 8,
		calmFrames = 0;
	// Neu hinzugefügtes Land kurz hervorheben (Sonnen-Leuchten, Sonar-Ringe, Name)
	let hl: { code: string; t0: number; polys: GeoJSON.Polygon[] } | null = null;
	const HL_MS = 2800;
	// weicher Übergang von der groben (Bewegung) zur feinen Darstellung statt sichtbarem Umspringen
	let fadeCv: HTMLCanvasElement | null = null,
		fadeT0 = 0,
		lastDrawMoving = false;
	const FADE_MS = 260;
	let fineState: FineState = 'idle',
		fineTry = 0;
	let cw = 0,
		ch = 0,
		dpr = 1,
		flatBase = 1;
	let interacting = false,
		lastTs = 0,
		drawQueued = false,
		introDone = false,
		destroyed = false;
	let fly: {
		from: { lon: number; lat: number; k: number };
		to: { lon: number; lat: number; k: number };
		dl: number;
		t0: number;
		ms: number;
		easeOut?: boolean;
	} | null = null;
	let pendingIntro: { delay: number; ms: number } | null = null;
	let inertia: { vx: number; vy: number; freeLat: boolean } | null = null;
	let baseDirty = true,
		topDirty = true,
		refineT: ReturnType<typeof setTimeout> | undefined;

	// Schraffur für bereiste Gebiete, die nicht zählen
	let hatch: CanvasPattern | null = null;
	function hatchPattern(c: CanvasRenderingContext2D) {
		if (hatch) return hatch;
		const t = document.createElement('canvas');
		t.width = t.height = 6;
		const g = t.getContext('2d');
		if (!g) return null;
		g.strokeStyle = PAL.visited;
		g.lineWidth = 1.3;
		g.beginPath();
		g.moveTo(-1, 7);
		g.lineTo(7, -1);
		g.moveTo(5, 7);
		g.lineTo(7, 5);
		g.moveTo(-1, 1);
		g.lineTo(1, -1);
		g.stroke();
		return (hatch = c.createPattern(t, 'repeat'));
	}

	const sync = () => o.onSync({ mode: view.mode, spin: view.spin, fineState });

	function fineK() {
		return view.mode === 'globe' ? 6 : 4;
	}
	async function loadFine() {
		if (fineState === 'loading' || fineState === 'ready') return;
		if (fineState === 'failed' && Date.now() - fineTry < 30000) return;
		fineState = 'loading';
		sync();
		try {
			await fetchFineLod();
			fineState = 'ready';
			// ausgedünnte Bewegungsstufen der feinen Daten im Leerlauf bauen (nicht mitten in einer Geste)
			const later = (f: () => void) => (window.requestIdleCallback ? window.requestIdleCallback(f, { timeout: 3000 }) : setTimeout(f, 200));
			later(() => !destroyed && getLod('f' + MOVE_STEPS[stepIdx]) && later(() => !destroyed && MOVE_STEPS.forEach((s) => getLod('f' + s))));
		} catch {
			fineState = 'failed';
			fineTry = Date.now();
		}
		sync();
		markDirty(true);
	}

	const clampFlatLat = (l: number, k = view.k) => {
		const m = Math.max(0, 72 - 62 / k);
		return clamp(l, -m, m);
	};
	const kRange = () => (view.mode === 'globe' ? [0.8, 16] : [1, 16]);

	function baseScale() {
		return view.mode === 'globe' ? (Math.min(cw, ch) / 2) * 0.86 : flatBase;
	}
	function makeProj(prec = 0.6): GeoProjection {
		if (view.mode === 'globe')
			return geoOrthographic()
				.rotate([-view.lon, -view.lat])
				.scale(baseScale() * view.k)
				.translate([cw / 2, ch / 2])
				.clipAngle(90)
				.precision(prec);
		return geoNaturalEarth1()
			.rotate([-view.lon, 0])
			.center([0, view.lat])
			.scale(baseScale() * view.k)
			.translate([cw / 2, ch / 2])
			.precision(prec);
	}
	let projKey = '',
		projCache: GeoProjection | null = null;
	function curProj(prec = 0.6) {
		const key = view.mode + '|' + view.lon + '|' + view.lat + '|' + view.k + '|' + cw + '|' + ch + '|' + prec;
		if (key !== projKey) {
			projKey = key;
			projCache = makeProj(prec);
		}
		return projCache!;
	}
	function onFront(p: [number, number]) {
		return view.mode !== 'globe' || geoDistance(p, [view.lon, view.lat]) < Math.PI / 2 - 0.03;
	}

	// Ist ein Land im sichtbaren Ausschnitt? Unsichtbare Länder werden gar nicht erst berechnet.
	type Cull = { globe: true; va: number; vc: [number, number] } | { globe: false; hLon: number; hLat: number };
	function cullInfo(): Cull {
		if (view.mode === 'globe') {
			const S = baseScale() * view.k,
				d = Math.hypot(cw, ch) / 2;
			return { globe: true, va: (d >= S ? Math.PI / 2 : Math.asin(d / S)) + 0.05, vc: [view.lon, view.lat] };
		}
		const S = baseScale() * view.k;
		return { globe: false, hLon: (cw / 2 / (S * 0.87)) * 57.2958 * 1.4 + 4, hLat: (ch / 2 / S) * 57.2958 * 1.15 + 4 };
	}
	function inView(id: string, ci: Cull) {
		const f = FC[id];
		if (!f) return false;
		if (ci.globe) return geoDistance(f.c, ci.vc) - f.r < ci.va;
		const dl = Math.abs(wrapLon(f.c[0] - view.lon));
		return dl - f.wLon < ci.hLon && Math.abs(f.cLat - view.lat) - f.wLat < ci.hLat;
	}

	function resize() {
		dpr = Math.min(2, window.devicePixelRatio || 1);
		cw = cvB.clientWidth;
		ch = cvB.clientHeight;
		if (!cw || !ch) return;
		for (const c of [cvB, cvT]) {
			c.width = Math.round(cw * dpr);
			c.height = Math.round(ch * dpr);
		}
		flatBase = geoNaturalEarth1().fitWidth(cw * 0.98, { type: 'Sphere' }).scale();
		if (pendingIntro) {
			const pi = pendingIntro;
			pendingIntro = null;
			intro(pi.delay, pi.ms);
		} else if (!introDone) startPose();
		markDirty(true);
	}
	function introTarget() {
		const sv = o.getStartView();
		const target = sv
			? { lon: sv.c[0], lat: sv.c[1], k: view.mode === 'flat' ? sv.k * 1.4 : sv.k }
			: { lon: 10, lat: 41, k: 1 };
		target.lat = view.mode === 'flat' ? clampFlatLat(target.lat, target.k) : clamp(target.lat, -85, 85);
		return target;
	}
	/** Ausgangslage vor dem Einflug: weit herausgezoomt und gedreht (bei reduzierter Bewegung gleich am Ziel) */
	function startPose() {
		const target = introTarget();
		if (reduce()) {
			Object.assign(view, target);
			return;
		}
		view.lon = wrapLon(target.lon + 80);
		view.lat = target.lat;
		view.k = 0.82;
	}
	/** Einflug auf die Startregion: beginnt nach `delay` ms und endet nach weiteren `ms` (schnell, dann langsamer) */
	function intro(delay = 0, ms = 1500) {
		if (!cw || !ch) {
			pendingIntro = { delay, ms };
			return;
		}
		introDone = true;
		cancelMotion();
		startPose();
		markDirty(true);
		if (reduce()) return;
		// fester Startzeitpunkt (nicht per Zeitgeber): endet exakt gleichzeitig mit Zählern und Flugkurve
		flyTo(introTarget(), ms, true, performance.now() + delay);
	}

	/* --- Zeichenschleife: Karte nur bei Änderungen neu --- */
	function markDirty(base: boolean) {
		if (base) baseDirty = true;
		topDirty = true;
		requestDraw();
	}
	function requestDraw() {
		if (drawQueued || !ctxB || destroyed) return;
		drawQueued = true;
		requestAnimationFrame(frame);
	}
	function pickLodName(moving: boolean) {
		if (moving) {
			// bei starkem Zoom auch in Bewegung die (ausgedünnten) feinen Daten, damit beim Loslassen nichts Neues auftaucht
			const f = fineState === 'ready' && view.k >= fineK() ? 'f' + MOVE_STEPS[stepIdx] : '';
			return f && lodReady(f) ? f : 's' + MOVE_STEPS[stepIdx];
		}
		return fineState === 'ready' && fineLod() && view.k >= fineK() ? 'fine' : 'full';
	}
	function scheduleRefine() {
		clearTimeout(refineT);
		refineT = setTimeout(() => {
			if (interacting || fly || inertia) return;
			baseDirty = true;
			requestDraw();
			if (view.k >= fineK() && fineState !== 'ready') loadFine();
		}, 150);
	}
	function frame(ts: number) {
		drawQueued = false;
		if (destroyed) return;
		const dt = lastTs ? Math.min(64, ts - lastTs) : 16;
		lastTs = ts;
		let moving = false;
		if (fly) {
			const p = Math.max(0, Math.min(1, (ts - fly.t0) / fly.ms)),
				e = fly.easeOut ? 1 - Math.pow(1 - p, 3) : p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
			view.lon = wrapLon(fly.from.lon + fly.dl * e);
			view.lat = fly.from.lat + (fly.to.lat - fly.from.lat) * e;
			view.k = fly.from.k * Math.pow(fly.to.k / fly.from.k, e);
			if (p >= 1) fly = null;
			// Auslauf (langsam): schon in Endqualität, sofern das Gerät schnell genug ist
			moving = !(p > 0.72 && stepIdx < MOVE_STEPS.length - 1);
			baseDirty = true;
			if (!moving && fly) requestDraw();
		} else if (inertia) {
			dragBy(inertia.vx * dt, inertia.vy * dt, inertia.freeLat);
			const f = Math.pow(0.94, dt / 16);
			inertia.vx *= f;
			inertia.vy *= f;
			if (Math.hypot(inertia.vx, inertia.vy) < 0.01) inertia = null;
			moving = true;
			baseDirty = true;
		} else if (view.spin && view.mode === 'globe' && !interacting && o.isVisible() && !document.hidden) {
			view.lon = wrapLon(view.lon + dt * 0.006);
			moving = true;
			baseDirty = true;
		}
		if (interacting) moving = true;

		if (baseDirty) {
			// erster ruhiger Frame nach Bewegung: altes Bild merken und darüber ausblenden
			if (!moving && lastDrawMoving && !fly && !reduce() && cw && ch) {
				fadeCv ??= document.createElement('canvas');
				if (fadeCv.width !== cvB.width || fadeCv.height !== cvB.height) {
					fadeCv.width = cvB.width;
					fadeCv.height = cvB.height;
				}
				const fc = fadeCv.getContext('2d');
				if (fc) {
					fc.clearRect(0, 0, fadeCv.width, fadeCv.height);
					fc.drawImage(cvB, 0, 0);
					fadeT0 = ts;
				}
			}
			lastDrawMoving = moving;
			const t0 = performance.now();
			drawBase(moving);
			const ms = performance.now() - t0;
			if (moving) {
				emaMove = 0.8 * emaMove + 0.2 * ms; // Qualität an die Geschwindigkeit des Geräts anpassen
				calmFrames++;
				if (emaMove > 22 && stepIdx < MOVE_STEPS.length - 1) {
					stepIdx++;
					calmFrames = 0;
					emaMove = 14;
				} else if (emaMove < 7 && stepIdx > 0 && calmFrames > 45) {
					stepIdx--;
					calmFrames = 0;
					emaMove = 12;
				}
				scheduleRefine();
			}
			baseDirty = false;
			topDirty = true;
		}
		const animTop = (fadeT0 && ts - fadeT0 < FADE_MS) || (hl && ts - hl.t0 < HL_MS);
		if (topDirty || animTop) {
			drawTop(ts);
			topDirty = false;
		}
		if (!animTop) {
			fadeT0 = 0;
			if (hl && ts - hl.t0 >= HL_MS) hl = null;
		}
		if (moving || animTop) requestDraw();
	}

	function pill(c: CanvasRenderingContext2D, text: string, x: number, y: number, color?: string) {
		c.font = '600 13px Figtree, system-ui, sans-serif';
		const w = c.measureText(text).width + 18,
			h = 26,
			rx = x - w / 2,
			ry = y - h;
		c.fillStyle = PAL.label;
		c.beginPath();
		if (c.roundRect) c.roundRect(rx, ry, w, h, 13);
		else c.rect(rx, ry, w, h);
		c.fill();
		c.fillStyle = color || '#fff';
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.fillText(text, x, ry + h / 2 + 0.5);
	}

	function drawBase(moving: boolean) {
		const c = ctxB;
		if (!c || !cw || !ch) return;
		const globe = view.mode === 'globe';
		c.setTransform(dpr, 0, 0, dpr, 0, 0);
		c.clearRect(0, 0, cw, ch);
		const P = curProj(moving ? 0 : 0.6),
			path = geoPath(P, c);
		// Gitternetz und Grenzen kosten kaum Zeit: immer in voller Glättung, sonst sind sie in Bewegung eckig und springen danach rund
		const pathQ = moving ? geoPath(curProj(0.6), c) : path;
		const lod: Lod = getLod(pickLodName(moving)) || getLod('full')!;
		const ci = cullInfo();
		const visited = o.getVisited(),
			wish = o.getWish(),
			selected = o.getSelected();
		const cx = cw / 2,
			cy = ch / 2,
			R = P.scale();

		if (globe) {
			let g = c.createRadialGradient(cx, cy, R * 0.98, cx, cy, R * 1.28);
			g.addColorStop(0, PAL.halo);
			g.addColorStop(1, 'rgba(0,0,0,0)');
			c.fillStyle = g;
			c.beginPath();
			c.arc(cx, cy, R * 1.28, 0, TAU);
			c.fill();
			g = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
			g.addColorStop(0, PAL.oceanA);
			g.addColorStop(1, PAL.oceanB);
			c.fillStyle = g;
			c.beginPath();
			c.arc(cx, cy, R, 0, TAU);
			c.fill();
		} else {
			c.fillStyle = PAL.oceanFlat;
			c.beginPath();
			path({ type: 'Sphere' });
			c.fill();
		}
		c.strokeStyle = PAL.grat;
		c.lineWidth = 0.6;
		c.beginPath();
		pathQ(GRAT);
		c.stroke();

		// Beim Bewegen: Inseln unter ~1 Pixel weglassen (unsichtbar)
		const pxPerDeg = ((baseScale() * view.k) / 57.2958) * (globe ? 1 : 0.87),
			minDeg = moving ? 1 / pxPerDeg : 0;
		const seenIds: Record<string, boolean> = {},
			base: GeoJSON.Polygon[] = [],
			vis: GeoJSON.Polygon[] = [],
			soft: GeoJSON.Polygon[] = [],
			wsh: GeoJSON.Polygon[] = [];
		for (const pg of lod.polys) {
			let ok = seenIds[pg.id];
			if (ok === undefined) ok = seenIds[pg.id] = inView(pg.id, ci);
			if (!ok || pg.size < minDeg) continue;
			(visited.has(pg.id) ? (o.isCounted(pg.id) ? vis : soft) : wish.has(pg.id) ? wsh : base).push(pg.g);
		}
		const fillGroup = (arr: GeoJSON.Polygon[], ...fills: (string | CanvasPattern | null)[]) => {
			if (!arr.length) return;
			c.beginPath();
			for (const g of arr) path(g);
			for (const f of fills) {
				if (!f) continue;
				c.fillStyle = f;
				c.fill();
			}
		};
		fillGroup(base, PAL.land);
		fillGroup(wsh, PAL.wish);
		fillGroup(soft, PAL.land, PAL.visitedSoft, hatchPattern(c));
		fillGroup(vis, PAL.visited);
		c.beginPath();
		pathQ(lod.borders);
		c.strokeStyle = PAL.border;
		c.lineWidth = 0.7;
		c.stroke();

		if (globe) {
			c.save();
			c.beginPath();
			c.arc(cx, cy, R, 0, TAU);
			c.clip();
			const g = c.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.35, cx, cy, R * 1.02);
			g.addColorStop(0, 'rgba(0,0,0,0)');
			g.addColorStop(1, 'rgba(2,10,18,.5)');
			c.fillStyle = g;
			c.fillRect(cx - R, cy - R, R * 2, R * 2);
			c.restore();
			c.strokeStyle = 'rgba(170,230,245,.35)';
			c.lineWidth = 1;
			c.beginPath();
			c.arc(cx, cy, R, 0, TAU);
			c.stroke();
		}
		if (selected) {
			c.beginPath();
			for (const pg of lod.polys) if (pg.id === selected) path(pg.g);
			c.lineWidth = 2.4;
			c.strokeStyle = PAL.sel;
			c.lineJoin = 'round';
			c.stroke();
		}
	}

	function drawHighlight(c: CanvasRenderingContext2D, P: GeoProjection, t: number) {
		if (!hl || t >= 1) return;
		const i = INFO[hl.code];
		// Leuchten: schnell an, dann weich aus (zweimal kurz nachpulsend)
		const env = t < 0.12 ? t / 0.12 : Math.pow(1 - (t - 0.12) / 0.88, 1.6);
		const pulse = 0.82 + 0.18 * Math.cos(t * Math.PI * 6);
		const path = geoPath(P, c);
		c.save();
		c.beginPath();
		for (const g of hl.polys) path(g);
		c.globalAlpha = env * pulse * 0.85;
		c.fillStyle = PAL.wish;
		c.shadowColor = PAL.wish;
		c.shadowBlur = 18;
		c.fill();
		c.shadowBlur = 0;
		c.globalAlpha = env;
		c.lineWidth = 1.6;
		c.strokeStyle = '#FFF4CC';
		c.lineJoin = 'round';
		c.stroke();
		c.restore();
		if (!i || !onFront(i.c)) return;
		const p = P(i.c);
		if (!p) return;
		// zwei Sonar-Ringe vom Mittelpunkt aus
		if (!reduce()) {
			const R0 = Math.max(10, Math.min(60, i.size * pxPerDeg() * 0.5));
			for (const d of [0, 0.22]) {
				const k = (t - d) / 0.55;
				if (k <= 0 || k >= 1) continue;
				c.beginPath();
				c.arc(p[0], p[1], R0 + k * 70, 0, TAU);
				c.lineWidth = 2.5 * (1 - k) + 0.5;
				c.strokeStyle = `rgba(246,196,69,${0.75 * (1 - k)})`;
				c.stroke();
			}
		}
		// Name des neuen Landes
		c.globalAlpha = Math.min(1, env * 1.4);
		pill(c, nameOf(hl.code), p[0], p[1] - (i.size * pxPerDeg() < 7 ? 14 : 10), PAL.wish);
		c.globalAlpha = 1;
	}

	/** Neu hinzugefügtes Land hervorheben, beginnend nach `delay` ms (z. B. wenn der Flug ankommt) */
	function highlight(code: string, delay = 0) {
		const lod = getLod('full');
		if (!lod || !INFO[code]) return;
		hl = { code, t0: performance.now() + delay, polys: lod.polys.filter((pg) => pg.id === code).map((pg) => pg.g) };
		markDirty(false);
	}

	function drawTop(now = performance.now()) {
		const c = ctxT;
		if (!c || !cw || !ch) return;
		c.setTransform(1, 0, 0, 1, 0, 0);
		c.clearRect(0, 0, cv.width, cv.height);
		if (fadeT0 && fadeCv) {
			const a = 1 - (now - fadeT0) / FADE_MS;
			if (a > 0) {
				c.globalAlpha = a * a;
				c.drawImage(fadeCv, 0, 0);
				c.globalAlpha = 1;
			}
		}
		c.setTransform(dpr, 0, 0, dpr, 0, 0);
		const P = curProj();
		if (hl && now >= hl.t0) drawHighlight(c, P, (now - hl.t0) / HL_MS);
		const visited = o.getVisited(),
			wish = o.getWish(),
			selected = o.getSelected();

		// Länder, die auf dem Bildschirm zu klein zum Erkennen sind, als leuchtende Punkte (nur bereiste und das gewählte);
		// beim Hineinzoomen verschwindet der Punkt und die echte Form ist zu sehen
		const ppd = pxPerDeg();
		for (const f of features) {
			const isSel = f.id === selected,
				been = visited.has(f.id);
			if (!been && !isSel) continue;
			const i = INFO[f.id];
			if (i.size * ppd >= 7 || !onFront(i.c)) continue;
			const p = P(i.c);
			if (!p) continue;
			const counted = o.isCounted(f.id);
			if (been) {
				const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 9);
				g.addColorStop(0, counted ? 'rgba(52,209,191,.55)' : 'rgba(52,209,191,.3)');
				g.addColorStop(1, 'rgba(52,209,191,0)');
				c.fillStyle = g;
				c.beginPath();
				c.arc(p[0], p[1], 9, 0, TAU);
				c.fill();
				c.beginPath();
				c.arc(p[0], p[1], 3, 0, TAU);
				if (counted) {
					c.fillStyle = PAL.visited;
					c.fill();
				} else {
					c.lineWidth = 1.5;
					c.strokeStyle = PAL.visited;
					c.stroke();
				}
			}
			if (isSel) {
				c.beginPath();
				c.arc(p[0], p[1], 6.5, 0, TAU);
				c.lineWidth = 2;
				c.strokeStyle = PAL.sel;
				c.stroke();
			}
		}
		if (selected && INFO[selected] && hl?.code !== selected) {
			const ctr = INFO[selected].c;
			if (onFront(ctr)) {
				const p = P(ctr);
				if (p) pill(c, nameOf(selected), p[0], p[1] - (INFO[selected].size * ppd < 7 ? 12 : 8));
			}
		}
	}

	/* --- Steuerung --- */
	function dragBy(dx: number, dy: number, freeLat: boolean) {
		const S = baseScale() * view.k;
		if (view.mode === 'globe') {
			const f = 57.2958 / S;
			view.lon -= dx * f;
			if (freeLat) view.lat = clamp(view.lat + dy * f, -85, 85);
		} else {
			const f = 57.2958 / (S * 0.87);
			view.lon -= dx * f;
			view.lat = clampFlatLat(view.lat + dy * f);
		}
		view.lon = wrapLon(view.lon);
	}
	function setK(k: number) {
		const [a, b] = kRange();
		view.k = clamp(k, a, b);
		if (view.mode === 'flat') view.lat = clampFlatLat(view.lat);
	}
	function cancelMotion() {
		fly = null;
		inertia = null;
	}
	function flyTo(t: { lon?: number; lat?: number; k?: number }, ms = 900, easeOut = false, t0 = performance.now()) {
		const to = { lon: t.lon !== undefined ? t.lon : view.lon, lat: t.lat !== undefined ? t.lat : view.lat, k: t.k !== undefined ? t.k : view.k };
		const [a, b] = kRange();
		to.k = clamp(to.k, a, b);
		to.lat = view.mode === 'flat' ? clampFlatLat(to.lat, to.k) : clamp(to.lat, -85, 85);
		if (reduce() || ms <= 0) {
			Object.assign(view, to);
			view.lon = wrapLon(view.lon);
			markDirty(true);
			scheduleRefine();
			return;
		}
		const from = { lon: view.lon, lat: view.lat, k: view.k };
		inertia = null;
		fly = { from, to, dl: ((to.lon - from.lon + 540) % 360) - 180, t0, ms, easeOut };
		markDirty(true);
	}
	/** zoom < 1: weiter herausgezoomt (Land mit Umgebung), dann auch herauszoomen statt nur hinein */
	function flyToCountry(code: string, opts: { keepK?: boolean; ms?: number; zoom?: number } = {}) {
		const i = INFO[code];
		if (!i) return;
		const f = opts.zoom ?? 1;
		const target = view.mode === 'globe' ? clamp((90 * f) / Math.max(i.size, 6), 1.3, 10) : clamp((150 * f) / Math.max(i.size, 6), 1.5, 12);
		// mit Umgebung, aber große Länder (Australien, Brasilien …) nicht so weit draußen, dass es wie der ganze Kontinent wirkt
		const minK = view.mode === 'globe' ? 1.8 : 2.2;
		const k = opts.keepK ? Math.max(view.k, 1) : opts.zoom ? Math.max(target, minK) : Math.max(target, view.k);
		flyTo({ lon: i.c[0], lat: i.c[1], k }, opts.ms || 1000);
	}
	function flyToContinent(code: string) {
		const v = CONT_VIEW[code as ContinentCode];
		if (!v) return;
		flyTo({ lon: v.c[0], lat: v.c[1], k: view.mode === 'flat' ? v.k * 1.4 : v.k }, 1000);
	}

	/** Pixel pro Grad am Kartenmittelpunkt (für die Bildschirmgröße eines Landes) */
	const pxPerDeg = () => ((baseScale() * view.k) / 57.2958) * (view.mode === 'globe' ? 1 : 0.87);
	/** Land unter einem Bildschirmpunkt (exakt) */
	function at(x: number, y: number): string | null {
		const P = curProj();
		const g = P.invert!([x, y]);
		if (!g || isNaN(g[0]) || isNaN(g[1])) return null;
		if (view.mode === 'globe' && geoDistance(g, [view.lon, view.lat]) > Math.PI / 2) return null;
		for (const f of features) if (geoContains(f, g)) return f.id;
		return null;
	}
	/** Land für einen Tipp; r = Fingerreichweite in Pixeln.
	    - Kleinststaaten (auf dem Bildschirm unter 7 px): im Meer im ganzen Umkreis,
	      auf Land nur ganz nah an ihrem sichtbaren Punkt (bereist oder ausgewählt)
	    - sonst das Land unter dem Finger, knapp daneben das nächste Land im Umkreis */
	function pick(x: number, y: number, r = 8): string | null {
		const P = curProj(),
			ppd = pxPerDeg();
		let near: string | null = null,
			nearD = Infinity;
		for (const f of features) {
			const i = INFO[f.id],
				sz = i.size * ppd;
			if (sz >= 7 || !onFront(i.c)) continue; // nur Länder, die als Punkt gezeigt werden
			const p = P(i.c);
			if (!p) continue;
			const dd = Math.hypot(p[0] - x, p[1] - y);
			if (dd <= r + sz / 2 && dd < nearD) {
				near = f.id;
				nearD = dd;
			}
		}
		const hit = at(x, y);
		if (hit && smallIds.has(hit)) return hit;
		const dotShown = (id: string) => o.getVisited().has(id) || o.getSelected() === id;
		if (near && (!hit || (nearD <= 4 && dotShown(near)))) return near;
		if (hit) return hit;
		// knapp neben einem Land: Ringe um den Tipp absuchen
		for (const rr of [r * 0.5, r])
			for (let k = 0; k < 12; k++) {
				const a = (k / 12) * TAU,
					h = at(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
				if (h) return h;
			}
		return null;
	}
	function tap(cx: number, cy: number, touch = false) {
		const r = cv.getBoundingClientRect(),
			hit = pick(cx - r.left, cy - r.top, touch ? 16 : 8);
		if (!hit) {
			o.onTapEmpty();
			markDirty(false);
			return;
		}
		flyToCountry(hit, { keepK: true, ms: 650 });
		o.onTapCountry(hit);
	}

	/* --- Zeiger: Ziehen, Pinch, Tippen, Schwung --- */
	const ptrs = new Map<number, { x: number; y: number }>();
	let gest: {
		t0: number;
		moved: number;
		lt: number;
		vx: number;
		vy: number;
		pinch: boolean;
		freeLat: boolean;
		touch: boolean;
		x0: number;
		y0: number;
		dist: number; // größter Abstand vom Startpunkt (für die Tipp-Erkennung)
		d0?: number;
		k0?: number;
	} | null = null;
	// Touch auf dem inaktiven Globus: nicht ziehen (die Seite scrollt), nur einen Tipp erkennen
	let tapOnly: { id: number; x: number; y: number; t: number; moved: number } | null = null;
	const passiveTouch = (e: PointerEvent) => e.pointerType === 'touch' && !o.isFull() && !o.isActive();
	const onDown = (e: PointerEvent) => {
		if (passiveTouch(e)) {
			tapOnly = ptrs.size === 0 && !tapOnly ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 } : null;
			return;
		}
		try {
			cv.setPointerCapture(e.pointerId);
		} catch {}
		cancelMotion();
		ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
		const now = performance.now();
		if (ptrs.size === 1) gest = { t0: now, moved: 0, lt: now, vx: 0, vy: 0, pinch: false, freeLat: true, touch: e.pointerType === 'touch', x0: e.clientX, y0: e.clientY, dist: 0 }; // Touch erreicht das nur im Vollbild oder aktiviert
		else if (ptrs.size === 2 && gest) {
			const [a, b] = [...ptrs.values()];
			gest.pinch = true;
			gest.d0 = Math.hypot(a.x - b.x, a.y - b.y) || 1;
			gest.k0 = view.k;
			gest.moved = 99;
		}
		interacting = true;
		markDirty(false);
	};
	const onMove = (e: PointerEvent) => {
		if (tapOnly && tapOnly.id === e.pointerId) {
			tapOnly.moved = Math.max(tapOnly.moved, Math.hypot(e.clientX - tapOnly.x, e.clientY - tapOnly.y));
			return;
		}
		const p = ptrs.get(e.pointerId);
		if (!p || !gest) return;
		if (gest.pinch && ptrs.size >= 2) {
			p.x = e.clientX;
			p.y = e.clientY;
			const [a, b] = [...ptrs.values()];
			setK((gest.k0! * (Math.hypot(a.x - b.x, a.y - b.y) || 1)) / gest.d0!);
			markDirty(true);
			return;
		}
		const dx = e.clientX - p.x,
			dy = e.clientY - p.y;
		p.x = e.clientX;
		p.y = e.clientY;
		gest.moved += Math.abs(dx) + Math.abs(dy);
		gest.dist = Math.max(gest.dist, Math.hypot(e.clientX - gest.x0, e.clientY - gest.y0));
		if (gest.dist < (gest.touch ? 8 : 4) && gest.moved < 40) return; // kleines Wackeln beim Tippen dreht nicht
		dragBy(dx, dy, gest.freeLat);
		const now = performance.now(),
			dt = Math.max(1, now - gest.lt);
		gest.vx = 0.75 * gest.vx + (0.25 * dx) / dt;
		gest.vy = 0.75 * gest.vy + (0.25 * dy) / dt;
		gest.lt = now;
		markDirty(true);
	};
	function endPtr(e: PointerEvent, cancelled: boolean) {
		if (!ptrs.has(e.pointerId)) return;
		const g = gest;
		ptrs.delete(e.pointerId);
		if (ptrs.size === 0) {
			interacting = false;
			const touch = e.pointerType === 'touch';
			if (g && !cancelled && !g.pinch && g.dist < (touch ? 14 : 8) && performance.now() - g.t0 < 500) tap(e.clientX, e.clientY, touch);
			else if (g && !cancelled && !reduce() && !g.pinch && Math.hypot(g.vx, g.vy) > 0.05 && performance.now() - g.lt < 80)
				inertia = { vx: g.vx, vy: g.vy, freeLat: g.freeLat };
			const changed = g && (g.dist >= 4 || g.pinch);
			gest = null;
			if (changed) scheduleRefine(); // scharf zeichnen erst kurz nach dem Loslassen
			markDirty(false);
		}
	}
	const onUp = (e: PointerEvent) => {
		if (tapOnly && tapOnly.id === e.pointerId) {
			const t = tapOnly;
			tapOnly = null;
			if (t.moved < 14 && performance.now() - t.t < 500) {
				o.onActivate();
				tap(e.clientX, e.clientY, true);
			}
			return;
		}
		endPtr(e, false);
	};
	const onCancel = (e: PointerEvent) => {
		if (tapOnly && tapOnly.id === e.pointerId) tapOnly = null; // Browser scrollt die Seite
		endPtr(e, true);
	};
	const onWheel = (e: WheelEvent) => {
		if (!o.isFull() && !o.isActive() && !e.ctrlKey) return;
		e.preventDefault();
		cancelMotion();
		setK(view.k * Math.exp(-e.deltaY * 0.0015));
		markDirty(true);
		scheduleRefine();
	};
	cv.addEventListener('pointerdown', onDown);
	cv.addEventListener('pointermove', onMove);
	cv.addEventListener('pointerup', onUp);
	cv.addEventListener('pointercancel', onCancel);
	cv.addEventListener('wheel', onWheel, { passive: false });

	const ro = window.ResizeObserver ? new ResizeObserver(() => resize()) : null;
	ro?.observe(cvB);
	const onVis = () => {
		if (!document.hidden) markDirty(true);
	};
	window.addEventListener('resize', resize);
	document.addEventListener('visibilitychange', onVis);
	sync();
	resize();

	// Detailstufen im Leerlauf vorbereiten, damit das erste Ziehen nicht ruckelt
	let prewarmT: ReturnType<typeof setTimeout> | undefined;
	(function prewarm() {
		const names = ['full', 's6', 's10', 's3'];
		let i = 0;
		const later = (f: () => void) => (window.requestIdleCallback ? window.requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 80));
		const next = () => {
			if (destroyed) return;
			if (i >= names.length) {
				// danach die feinen Grenzen für starken Zoom im Hintergrund holen (werden vom Service Worker zwischengespeichert)
				prewarmT = setTimeout(() => later(() => !destroyed && loadFine()), 4000);
				return;
			}
			try {
				getLod(names[i++]);
			} catch {}
			later(next);
		};
		prewarmT = setTimeout(() => later(next), 500);
	})();

	return {
		/** Bildschirmposition (clientX/Y) eines Landes – für Tests */
		screenOf(code: string) {
			const i = INFO[code];
			if (!i || !onFront(i.c)) return null;
			const p = curProj()(i.c),
				r = cv.getBoundingClientRect();
			return p ? { x: r.left + p[0], y: r.top + p[1] } : null;
		},
		markDirty,
		resize,
		intro,
		highlight,
		flyToCountry,
		flyToContinent,
		zoomBy(m: number) {
			cancelMotion();
			flyTo({ k: view.k * m }, 350);
		},
		setMode(m: MapMode) {
			if (m === view.mode) return;
			cancelMotion();
			view.mode = m;
			view.k = 1;
			if (m === 'flat') view.lat = clampFlatLat(view.lat, 1);
			saveMapPrefs();
			sync();
			markDirty(true);
			scheduleRefine();
		},
		toggleSpin() {
			view.spin = !view.spin;
			saveMapPrefs();
			sync();
			markDirty(false);
		},
		destroy() {
			destroyed = true;
			clearTimeout(refineT);
			clearTimeout(prewarmT);
				ro?.disconnect();
			window.removeEventListener('resize', resize);
			document.removeEventListener('visibilitychange', onVis);
			cv.removeEventListener('pointerdown', onDown);
			cv.removeEventListener('pointermove', onMove);
			cv.removeEventListener('pointerup', onUp);
			cv.removeEventListener('pointercancel', onCancel);
			cv.removeEventListener('wheel', onWheel);
		}
	};
}

export type WorldMap = ReturnType<typeof createWorldMap>;
