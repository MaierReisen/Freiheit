import { geoContains, geoDistance, geoGraticule10, geoNaturalEarth1, geoOrthographic, geoPath, type GeoProjection } from 'd3-geo';
import { CONT_VIEW, nameOf, type ContinentCode } from '../countries';
import { FC, FINE_W, INFO, SIMP_W, features, fetchFineLod, fineLod, getLod, lodReady, smallIds, wrapLon, type Lod } from './geo';

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
	/** Bedienelemente über der Karte (relativ zur Zeichenfläche): Namen weichen ihnen aus */
	getAvoid?(): [number, number, number, number][];
	/** Globus per Tipp aktiviert? Nur dann reagiert er bei Touch auf Ziehen (sonst scrollt die Seite) */
	isActive(): boolean;
	/** Tipp auf den inaktiven Globus (Touch): aktivieren */
	onActivate(): void;
	/** Startregion: Mittelpunkt und Zoom, auf die die Karte beim Start fliegt */
	getStartView(): { c: [number, number]; k: number } | null | undefined;
	onTapCountry(code: string): void;
	/** erster Tipp auf die (noch nicht aktive) Karte: Land nur hervorheben, keine Detailseite */
	onFocusCountry(code: string): void;
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

const MOVE_STEPS = [3, 6, 10];
const MICRO_K = 1.6; // ab diesem Zoom alle Zwergstaaten als Punkt (darunter nur bereiste)
const LABEL_K = 5; // Namen erst bei regionalem Zoom (etwa doppelte Europa-Startansicht), sonst wirkt die Karte überladen
// echte Zwergstaaten (unter etwa 4.000 km²: Vatikan, Monaco, Malta, Singapur, Karibik- und Pazifikinseln …)
const microIds = new Set(features.filter((f) => INFO[f.id].area < 0.0001).map((f) => f.id));
// Teilflächen je Land und Detailstufe (für Umrisse, ohne jedes Mal alle Flächen zu durchsuchen)
const polyIndex = new WeakMap<Lod, Map<string, GeoJSON.Polygon[]>>();
function polysFor(lod: Lod, id: string) {
	let m = polyIndex.get(lod);
	if (!m) {
		m = new Map();
		for (const pg of lod.polys) {
			const a = m.get(pg.id);
			if (a) a.push(pg.g);
			else m.set(pg.id, [pg.g]);
		}
		polyIndex.set(lod, m);
	}
	return m.get(id) || [];
} // von fein nach grob; wird je nach Gerätegeschwindigkeit angepasst

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
	let fadeMs = FADE_MS,
		fadeMode: MapMode = 'globe';
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
			// die feinen Stufen ('w…') werden bei Bedarf im Leerlauf gebaut (pickLodName)
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
	const K_MAX = 1500; // so weit, dass auch der Vatikan (0,01°) als Fläche gut erkennbar wird
	const kRange = () => (view.mode === 'globe' ? [0.8, K_MAX] : [1, K_MAX]);

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
				.clipExtent(view.k > 6 ? clipBox() : null)
				.precision(prec);
		return geoNaturalEarth1()
			.rotate([-view.lon, 0])
			.center([0, view.lat])
			.scale(baseScale() * view.k)
			.translate([cw / 2, ch / 2])
			.clipExtent(view.k > 6 ? clipBox() : null)
			.precision(prec);
	}
	function clipBox(): [[number, number], [number, number]] {
		return [
			[-40, -40],
			[cw + 40, ch + 40]
		];
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
		const ndpr = Math.min(2, window.devicePixelRatio || 1),
			ncw = cvB.clientWidth,
			nch = cvB.clientHeight;
		if (!ncw || !nch) return;
		// iOS meldet beim Scrollen (Leisten ein/aus) und beim Zurückwechseln in die App „resize“, oft ohne echte Änderung.
		// Die Zeichenfläche neu anzulegen löscht sie – dann blitzt kurz der Hintergrund auf. Nur bei echter Änderung.
		const changed = ncw !== cw || nch !== ch || ndpr !== dpr;
		if (!changed && !pendingIntro) return;
		dpr = ndpr;
		cw = ncw;
		ch = nch;
		if (changed) {
			for (const c of [cvB, cvT]) {
				c.width = Math.round(cw * dpr);
				c.height = Math.round(ch * dpr);
			}
			flatBase = geoNaturalEarth1().fitWidth(cw * 0.98, { type: 'Sphere' }).scale();
		}
		if (pendingIntro) {
			const pi = pendingIntro;
			pendingIntro = null;
			intro(pi.delay, pi.ms);
		} else if (!introDone) startPose();
		markDirty(true);
		// sofort neu zeichnen, damit nie ein leerer Frame zu sehen ist
		if (changed && ctxB && !destroyed) {
			drawBase(!!(fly || interacting || inertia));
			drawTop();
			baseDirty = topDirty = false;
		}
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
	/** Detailstufe nach Bildschirmfehler: die gröbste, deren Abweichung unter ~0,4 px bleibt – in Bewegung dieselbe
	    wie in Ruhe (nichts springt um). Nur auf langsamen Geräten wird in Bewegung eine gröbere genommen. */
	const MOVE_ERR = [1, 3, 9];
	const building = new Set<string>();
	function pickLodName(moving: boolean) {
		const ppd = pxPerDeg(),
			need = (0.35 * (moving ? MOVE_ERR[stepIdx] : 1)) / (ppd * ppd);
		const fine = fineState === 'ready' && !!fineLod() && view.k >= fineK();
		const W = fine ? FINE_W : SIMP_W;
		let name = fine ? 'fine' : 'full';
		for (let i = 0; i < W.length; i++)
			if (W[i] <= need) {
				name = (fine ? 'w' : 'v') + i;
				break;
			}
		if (name === 'full' || name === 'fine' || lodReady(name)) return name;
		// Stufe noch nicht gebaut: im Leerlauf bauen, bis dahin Rückfall (in Bewegung grob, in Ruhe die volle Stufe)
		if (!building.has(name)) {
			building.add(name);
			idle(() => {
				if (destroyed) return;
				getLod(name);
				building.delete(name);
				markDirty(true);
			});
		}
		return moving ? (fine && lodReady('f' + MOVE_STEPS[stepIdx]) ? 'f' + MOVE_STEPS[stepIdx] : 's' + MOVE_STEPS[stepIdx]) : fine ? 'fine' : 'full';
	}
	const idle = (f: () => void) => (window.requestIdleCallback ? window.requestIdleCallback(f, { timeout: 1200 }) : setTimeout(f, 60));
	function scheduleRefine() {
		clearTimeout(refineT);
		refineT = setTimeout(() => {
			if (interacting || fly || inertia) return;
			baseDirty = true;
			requestDraw();
			if (view.k >= fineK() && fineState !== 'ready') loadFine();
		}, 150);
	}
	/** Maßstab in der Bildmitte (Pixel für ein halbes Grad, Nord-Süd und Ost-West gemittelt) */
	function localScale() {
		const P = curProj(),
			c: [number, number] = [view.lon, clamp(view.lat, -80, 80)];
		const p = P(c),
			n = P([c[0], c[1] + 0.5]),
			e = P([c[0] + 0.5, c[1]]);
		if (!p || !n || !e) return 0;
		return Math.sqrt(Math.hypot(n[0] - p[0], n[1] - p[1]) * Math.hypot(e[0] - p[0], e[1] - p[1]));
	}
	/** aktuelles Bild merken und in den nächsten Frames weich über dem neuen ausblenden */
	function snapshotFade(ts = performance.now(), ms = FADE_MS) {
		if (reduce() || !cw || !ch) return;
		fadeCv ??= document.createElement('canvas');
		if (fadeCv.width !== cvB.width || fadeCv.height !== cvB.height) {
			fadeCv.width = cvB.width;
			fadeCv.height = cvB.height;
		}
		const fc = fadeCv.getContext('2d');
		if (!fc) return;
		fc.clearRect(0, 0, fadeCv.width, fadeCv.height);
		fc.drawImage(cvB, 0, 0);
		fadeT0 = ts;
		fadeMs = ms;
		fadeMode = view.mode;
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
			if (!moving && lastDrawMoving && !fly) snapshotFade(ts);
			// bewegt sich die Karte wieder, darf kein altes Bild darüber stehen bleiben
			if (moving) fadeT0 = 0;
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
		const animTop = (fadeT0 && ts - fadeT0 < fadeMs) || (hl && ts - hl.t0 < HL_MS);
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
		// immer dieselbe Glättung: das Bild in Bewegung und in Ruhe ist damit gleich (kein Umspringen nach dem Loslassen)
		const P = curProj(0.6),
			path = geoPath(P, c),
			pathQ = path;
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

		// Inseln unter ~0,6 Pixel weglassen (unsichtbar) – in Bewegung und in Ruhe gleich, damit nach dem Loslassen nichts auftaucht
		const pxPerDeg = ((baseScale() * view.k) / 57.2958) * (globe ? 1 : 0.87),
			minDeg = 0.6 / pxPerDeg;
		const seenIds: Record<string, boolean> = {},
			base: GeoJSON.Polygon[] = [],
			vis: GeoJSON.Polygon[] = [],
			soft: GeoJSON.Polygon[] = [],
			wsh: GeoJSON.Polygon[] = [],
			// Zwergstaaten zuletzt (obenauf), damit sie nicht vom umgebenden Land (Italien → Vatikan) überdeckt werden
			mBase: GeoJSON.Polygon[] = [],
			mVis: GeoJSON.Polygon[] = [],
			mSoft: GeoJSON.Polygon[] = [];
		for (const pg of lod.polys) {
			let ok = seenIds[pg.id];
			if (ok === undefined) ok = seenIds[pg.id] = inView(pg.id, ci);
			if (!ok || pg.size < minDeg) continue;
			const mi = microIds.has(pg.id);
			(visited.has(pg.id) ? (o.isCounted(pg.id) ? (mi ? mVis : vis) : mi ? mSoft : soft) : wish.has(pg.id) ? wsh : mi ? mBase : base).push(pg.g);
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
		fillGroup(mBase, PAL.land);
		fillGroup(mSoft, PAL.land, PAL.visitedSoft, hatchPattern(c));
		fillGroup(mVis, PAL.visited);
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

	/** Namen der Zwergstaaten neben dem Punkt; bereiste zuerst, überlappende werden weggelassen */
	function drawMicroLabels(c: CanvasRenderingContext2D, list: { id: string; x: number; y: number; been: boolean }[]) {
		list.sort((a, b) => Number(b.been) - Number(a.been) || INFO[b.id].area - INFO[a.id].area);
		c.font = '600 11px Figtree, system-ui, sans-serif';
		c.textBaseline = 'middle';
		c.textAlign = 'left';
		c.lineJoin = 'round';
		const taken: [number, number, number, number][] = o.getAvoid?.() ?? [];
		for (const l of list) {
			const t = nameOf(l.id),
				w = c.measureText(t).width;
			// rechts vom Punkt, sonst links, darüber oder darunter – je nachdem, wo Platz ist
			let pos: [number, number] | null = null;
			for (const [x, y] of [
				[l.x + 9, l.y],
				[l.x - 9 - w, l.y],
				[l.x - w / 2, l.y - 15],
				[l.x - w / 2, l.y + 15]
			] as [number, number][]) {
				const box: [number, number, number, number] = [x - 2, y - 8, x + w + 2, y + 8];
				if (box[0] < 4 || box[2] > cw - 4 || box[1] < 4 || box[3] > ch - 4) continue;
				if (taken.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
				// auch keine anderen Punkte überdecken
				if (list.some((o) => o !== l && o.x > box[0] - 3 && o.x < box[2] + 3 && o.y > box[1] - 3 && o.y < box[3] + 3)) continue;
				taken.push(box);
				pos = [x, y];
				break;
			}
			if (!pos) continue;
			const [x, y] = pos;
			c.lineWidth = 3;
			c.strokeStyle = 'rgba(7,20,31,.8)';
			c.strokeText(t, x, y);
			c.fillStyle = l.been ? '#7FE8DA' : 'rgba(255,255,255,.78)';
			c.fillText(t, x, y);
		}
	}

	function drawTop(now = performance.now()) {
		const c = ctxT;
		if (!c || !cw || !ch) return;
		c.setTransform(1, 0, 0, 1, 0, 0);
		c.clearRect(0, 0, cv.width, cv.height);
		if (fadeT0 && fadeCv) {
			const a = 1 - (now - fadeT0) / fadeMs;
			if (a > 0) {
				c.save();
				// Nur die Kugel bzw. Kartenfläche überblenden: der halbtransparente Lichtschein drumherum würde sich sonst
				// mit dem neuen Bild addieren und kurz weiß aufleuchten
				if (fadeMode === view.mode) {
					c.setTransform(dpr, 0, 0, dpr, 0, 0);
					c.beginPath();
					if (view.mode === 'globe') c.arc(cw / 2, ch / 2, Math.max(0, curProj().scale() - 1), 0, TAU);
					else geoPath(curProj(), c)({ type: 'Sphere' });
					c.clip();
					c.setTransform(1, 0, 0, 1, 0, 0);
				}
				c.globalAlpha = a * a;
				c.drawImage(fadeCv, 0, 0);
				c.restore();
			}
		}
		c.setTransform(dpr, 0, 0, dpr, 0, 0);
		const P = curProj();
		if (hl && now >= hl.t0) drawHighlight(c, P, (now - hl.t0) / HL_MS);
		const visited = o.getVisited(),
			wish = o.getWish(),
			selected = o.getSelected();

		// Zwergstaaten und andere winzige Länder:
		// - unter ~7 px als Punkt (bereist: leuchtend türkis, sonst dezenter heller Ring), der beim Hineinzoomen
		//   weich in die echte Form übergeht (bis ~13 px)
		// - solange die Form klein ist (unter ~36 px), mit Umriss, damit sie sich vom Nachbarland abhebt
		// - erst bei regionalem Zoom (LABEL_K) mit Namen (ohne Überlappung, bereiste zuerst)
		const ppd = pxPerDeg();
		const showMicro = view.k >= MICRO_K;
		const labels: { id: string; x: number; y: number; been: boolean }[] = [];
		let outlined: string[] | null = null;
		for (const f of features) {
			const isSel = f.id === selected,
				been = visited.has(f.id),
				// unbereiste nur, wenn sie in der gewählten Länderliste zählen (keine Färöer, Jersey … als Extra-Punkte)
				micro = microIds.has(f.id) && (been || o.isCounted(f.id));
			if (!been && !isSel && !(micro && showMicro)) continue;
			const i = INFO[f.id],
				sz = i.size * ppd;
			if (!onFront(i.c)) continue;
			if (sz >= 36) {
				if (micro) (outlined ??= []).push(f.id); // große Darstellung: nur noch Umriss
				continue;
			}
			const p = P(i.c);
			if (!p || p[0] < -20 || p[1] < -20 || p[0] > cw + 20 || p[1] > ch + 20) continue;
			const dotA = sz < 7 ? 1 : sz < 13 ? (13 - sz) / 6 : 0;
			if (micro && sz >= 5) (outlined ??= []).push(f.id);
			if (dotA > 0) {
				const counted = o.isCounted(f.id);
				c.globalAlpha = dotA;
				if (been) {
					const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 11);
					g.addColorStop(0, counted ? 'rgba(52,209,191,.6)' : 'rgba(52,209,191,.32)');
					g.addColorStop(1, 'rgba(52,209,191,0)');
					c.fillStyle = g;
					c.beginPath();
					c.arc(p[0], p[1], 11, 0, TAU);
					c.fill();
					c.beginPath();
					c.arc(p[0], p[1], 4.2, 0, TAU);
					c.lineWidth = 1.6;
					c.strokeStyle = 'rgba(7,20,31,.85)';
					c.stroke();
					if (counted) {
						c.fillStyle = PAL.visited;
						c.fill();
						c.lineWidth = 1.2;
						c.strokeStyle = 'rgba(255,255,255,.9)';
						c.stroke();
					} else {
						c.lineWidth = 2;
						c.strokeStyle = PAL.visited;
						c.stroke();
					}
				} else if (micro) {
					// deutlich erkennbar auch über hellem/bereistem Land: heller Kern mit dunklem Rand
					c.beginPath();
					c.arc(p[0], p[1], 3.8, 0, TAU);
					c.fillStyle = 'rgba(255,255,255,.92)';
					c.fill();
					c.lineWidth = 1.6;
					c.strokeStyle = 'rgba(7,20,31,.85)';
					c.stroke();
				}
				if (isSel) {
					c.beginPath();
					c.arc(p[0], p[1], 6.5, 0, TAU);
					c.lineWidth = 2;
					c.strokeStyle = PAL.sel;
					c.stroke();
				}
				c.globalAlpha = 1;
			}
			if (micro && view.k >= LABEL_K && !isSel && hl?.code !== f.id) labels.push({ id: f.id, x: p[0], y: p[1], been });
		}
		// kleine Formen umranden (bereist türkis, sonst hell), damit Vatikan & Co. nicht im Nachbarland verschwinden
		if (outlined) {
			const lod = getLod(pickLodName(false)) || getLod('full')!;
			const path = geoPath(P, c);
			c.lineJoin = 'round';
			for (const id of outlined) {
				c.beginPath();
				for (const g of polysFor(lod, id)) path(g);
				const big = INFO[id].size * ppd >= 36;
				c.lineWidth = big ? 1.2 : 1.4;
				c.strokeStyle = big ? 'rgba(255,255,255,.4)' : visited.has(id) ? 'rgba(160,245,232,.95)' : 'rgba(255,255,255,.55)';
				c.stroke();
			}
		}
		if (labels.length) drawMicroLabels(c, labels);
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
		let target = view.mode === 'globe' ? clamp((90 * f) / Math.max(i.size, 6), 1.3, 10) : clamp((150 * f) / Math.max(i.size, 6), 1.5, 12);
		// Zwergstaaten: so nah, dass die Form gut erkennbar ist (mit Umgebung etwa 40 px, sonst 70 px breit)
		if (smallIds.has(code)) target = Math.max(target, clamp((opts.zoom ? 40 : 70) / ((baseScale() / 57.2958) * Math.max(i.size, 0.004)), 1, K_MAX));
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
			if (sz >= (smallIds.has(f.id) ? 13 : 7) || !onFront(i.c)) continue; // nur Länder, die als Punkt gezeigt werden
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
		const dotShown = (id: string) => o.getVisited().has(id) || o.getSelected() === id || (microIds.has(id) && o.isCounted(id) && view.k >= MICRO_K);
		if (near && (!hit || (dotShown(near) && nearD <= r * 0.85))) return near;
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
	/** focusOnly (erster Tipp, der die Karte aktiviert): nur auf das Land bzw. die Stelle schwenken, keine Detailseite */
	function tap(cx: number, cy: number, touch = false, focusOnly = false) {
		const r = cv.getBoundingClientRect(),
			x = cx - r.left,
			y = cy - r.top,
			hit = pick(x, y, touch ? 16 : 8);
		if (!hit) {
			o.onTapEmpty();
			if (focusOnly) {
				// Meer o. Ä.: die angetippte Stelle in die Mitte holen
				const g = curProj().invert?.([x, y]);
				if (g && !isNaN(g[0]) && !isNaN(g[1]) && (view.mode !== 'globe' || geoDistance(g, [view.lon, view.lat]) < Math.PI / 2))
					flyTo({ lon: g[0], lat: g[1] }, 600);
			}
			markDirty(false);
			return;
		}
		flyToCountry(hit, { keepK: true, ms: 650 });
		if (focusOnly) o.onFocusCountry(hit);
		else o.onTapCountry(hit);
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
	// Wer die Seite gerade scrollt und zum Anhalten auf den Globus tippt, will ihn nicht aktivieren
	let lastScroll = 0;
	const onScroll = () => (lastScroll = performance.now());
	window.addEventListener('scroll', onScroll, { passive: true });
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
		fadeT0 = 0;
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
			if (g && !cancelled && !g.pinch && g.dist < (touch ? 14 : 8) && performance.now() - g.t0 < 500) {
				const first = !o.isFull() && !o.isActive();
				if (first) o.onActivate();
				tap(e.clientX, e.clientY, touch, first);
			}
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
			if (t.moved < 14 && performance.now() - t.t < 500 && t.t - lastScroll > 350 && lastScroll < t.t) {
				o.onActivate();
				tap(e.clientX, e.clientY, true, true);
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
		if (document.hidden) return;
		lastTs = 0; // sonst „springt“ ein laufendes Drehen um die Zeit im Hintergrund
		requestDraw();
	};
	// falls der Browser die Zeichenfläche im Hintergrund verworfen hat
	cvB.addEventListener('contextrestored', () => markDirty(true));
	window.addEventListener('resize', resize);
	document.addEventListener('visibilitychange', onVis);
	sync();
	resize();

	// Detailstufen im Leerlauf vorbereiten, damit das erste Ziehen nicht ruckelt
	let prewarmT: ReturnType<typeof setTimeout> | undefined;
	(function prewarm() {
		const names = ['v1', 'v2', 'v3', 'full', 'v0', 'v4', 's3', 'v5', 'v6'];
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
			// gleicher Maßstab in der Bildmitte: dort gemessen, wie groß ein halbes Grad in beiden Ansichten ist
			const s0 = localScale(),
				k0 = view.k;
			snapshotFade(performance.now(), 380);
			view.mode = m;
			view.k = 1;
			const s1 = localScale();
			const [a, b] = kRange();
			view.k = clamp(s0 && s1 ? s0 / s1 : k0, a, b);
			if (m === 'flat') view.lat = clampFlatLat(view.lat, view.k);
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
			window.removeEventListener('scroll', onScroll);
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
