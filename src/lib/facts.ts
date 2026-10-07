import { geoCentroid, geoDistance } from 'd3-geo';

/* Länder-Fakten für die Detailseite: Daten werden erst beim ersten Öffnen nachgeladen (eigene Datei, ~50 KB).
   Quellen: Wikidata (CC0), mledoze/countries (ODbL), IANA-Zeitzonen – siehe scripts/build-facts.py */

export interface Facts {
	cap?: string[];
	pop?: number;
	area?: number;
	lang?: string[];
	cur?: { c: string; s: string }[];
	call?: string;
	drive?: 'l' | 'r';
	tz?: string;
	tzn?: number;
	nb?: string[];
	land?: boolean;
	/** höchster Punkt: Name, Höhe in m */
	peak?: [string, number];
	/** Lage des höchsten Punkts [lon, lat] */
	peakLL?: [number, number];
	/** Lage der (ersten) Hauptstadt [lon, lat] */
	capLL?: [number, number];
	/** Einwohner der (ersten) Hauptstadt und Jahr der Angabe */
	capPop?: [number, number | null];
	/** Nachbarn ohne Landgrenze, aber mit fester Verbindung (Brücke, Damm, Tunnel) – zählen als Nachbarländer */
	fix?: Record<string, string>;
	/** Hinweis zur Fläche (z. B. Frankreich mit Überseegebieten) */
	areaNote?: string;
}

/* Gewässer (Natural Earth): Flüsse als Linien, Seen als Flächen – erst beim ersten Öffnen einer Länderseite geladen */
export interface WaterFeature {
	n: string;
	r: number;
	c: [number, number][][];
	/** Mittelpunkt [lon, lat] und Ausdehnung (Bogenmaß) – zum schnellen Aussortieren entfernter Gewässer */
	m: [number, number];
	rad: number;
}
export interface Water {
	rivers: WaterFeature[];
	lakes: WaterFeature[];
}
let water: Water | null = null;
let waterLoading: Promise<Water> | null = null;
type Packed = [string, number, number[][]][];
/** gespeichert als ganze Hundertstelgrad mit Differenzen zum Vorgänger: [x0,y0,dx1,dy1,…] */
const unpack = (list: Packed): WaterFeature[] =>
	list.map(([n, r, parts]) => {
		const c = parts.map((f) => {
			const out: [number, number][] = [];
			let x = 0,
				y = 0;
			for (let i = 0; i < f.length; i += 2) {
				x = i ? x + f[i] : f[i];
				y = i ? y + f[i + 1] : f[i + 1];
				out.push([x / 100, y / 100]);
			}
			return out;
		});
		const all = c.flat();
		const pts = all.filter((_, i) => i % Math.max(1, Math.floor(all.length / 48)) === 0);
		const m = geoCentroid({ type: 'MultiPoint', coordinates: pts }) as [number, number];
		let rad = 0;
		for (const q of pts) rad = Math.max(rad, geoDistance(m, q));
		for (const f of c) rad = Math.max(rad, geoDistance(m, f[0]), geoDistance(m, f[f.length - 1]));
		return { n, r, c, m, rad: rad + 0.01 };
	});
export function loadWater(): Promise<Water> {
	if (water) return Promise.resolve(water);
	waterLoading ??= import('./data/water.json').then((m) => {
		const d = m.default as unknown as { rivers: Packed; lakes: Packed };
		return (water = { rivers: unpack(d.rivers), lakes: unpack(d.lakes) });
	});
	return waterLoading;
}

let cache: Record<string, Facts> | null = null;
let loading: Promise<Record<string, Facts>> | null = null;
export function loadFacts(): Promise<Record<string, Facts>> {
	if (cache) return Promise.resolve(cache);
	loading ??= import('./data/facts.json').then((m) => (cache = m.default as unknown as Record<string, Facts>));
	return loading;
}
export const factsNow = (code: string): Facts | null => cache?.[code] ?? null;

const nf = (o: Intl.NumberFormatOptions) => new Intl.NumberFormat('de-DE', o);

export function fmtPop(n: number) {
	if (n < 10000) return nf({}).format(n);
	if (n < 1e6) return nf({ maximumFractionDigits: 0 }).format(Math.round(n / 1000)) + ' Tsd.';
	if (n < 1e9) return nf({ maximumFractionDigits: n < 1e7 ? 1 : 0 }).format(n / 1e6) + ' Mio.';
	return nf({ maximumFractionDigits: 2 }).format(n / 1e9) + ' Mrd.';
}
export function fmtArea(a: number) {
	return nf({ maximumFractionDigits: a < 10 ? 2 : 0 }).format(a) + ' km²';
}
/** kurz für die Schnellfakten: 513 Tsd. km², 1,2 Mio. km² */
export function fmtAreaShort(a: number) {
	if (a >= 1e6) return nf({ maximumFractionDigits: 1 }).format(a / 1e6) + ' Mio. km²';
	if (a >= 1e5) return nf({ maximumFractionDigits: 0 }).format(a / 1e3) + ' Tsd. km²';
	return fmtArea(a);
}
export function fmtDensity(pop: number, area: number) {
	const d = pop / area;
	if (d > 0 && d < 0.01) return 'unter 0,01 pro km²';
	return nf({ maximumFractionDigits: d < 1 ? 2 : d < 10 ? 1 : 0 }).format(d) + ' pro km²';
}

const DE_AREA = 357588,
	BERLIN = 891;
/** Größenvergleich, für Deutsche greifbar */
export function compareArea(code: string, a: number) {
	if (code === 'DE') return '';
	if (a < BERLIN) {
		const r = BERLIN / a;
		return r < 1.5 ? 'etwa so groß wie Berlin' : `≈ ${nf({ maximumFractionDigits: 0 }).format(r)}-mal in Berlin`;
	}
	const r = a / DE_AREA;
	if (r >= 1.15) return `≈ ${nf({ maximumFractionDigits: r < 10 ? 1 : 0 }).format(r)} × Deutschland`;
	if (r >= 0.87) return 'etwa so groß wie Deutschland';
	return `≈ ${nf({ maximumFractionDigits: r < 0.1 ? 1 : 0 }).format(r * 100)} % von Deutschland`;
}

const langNames = (() => {
	try {
		return new Intl.DisplayNames(['de'], { type: 'language' });
	} catch {
		return null;
	}
})();
const curNames = (() => {
	try {
		return new Intl.DisplayNames(['de'], { type: 'currency' });
	} catch {
		return null;
	}
})();
/** Sprachen auf Deutsch; unbekannte Codes (z. B. Gebärdensprachen ohne Namen) fallen weg */
export function languages(codes: string[] = []) {
	const out: string[] = [];
	for (const c of codes) {
		let n = '';
		try {
			n = langNames?.of(c) ?? '';
		} catch {}
		if (n && n.toLowerCase() !== c.toLowerCase() && !out.includes(n)) out.push(n);
	}
	return out;
}
/** Währungen auf Deutsch; lokale Nebenwährungen ohne Namen (z. B. Tuvalu-Dollar neben dem Australischen Dollar)
    fallen weg, wenn es eine bekannte Hauptwährung gibt */
export function currencies(list: Facts['cur'] = []) {
	const all = list.map((x) => {
		let n = x.c;
		try {
			n = curNames?.of(x.c) ?? x.c;
		} catch {}
		return { name: n, sym: x.s && x.s !== x.c ? x.s : '', code: x.c, known: n !== x.c };
	});
	const known = all.filter((x) => x.known);
	return known.length ? known : all;
}
export const fmtHeight = (m: number) => new Intl.NumberFormat('de-DE').format(m) + ' m';

/** Minuten Versatz einer Zeitzone zu UTC (mit Sommerzeit, zum Zeitpunkt d) */
function tzOffset(tz: string, d: Date) {
	try {
		const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(d).find((x) => x.type === 'timeZoneName')?.value ?? '';
		const m = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(p);
		return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : 0;
	} catch {
		return 0;
	}
}
/** Ortszeit und Zeitverschiebung zu Deutschland, z. B. { time: '14:32', diff: '+5 Std' } (diff leer bei gleicher Zeit) */
export function localTime(tz: string, d = new Date()) {
	let time = '';
	try {
		time = new Intl.DateTimeFormat('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(d);
	} catch {
		return null;
	}
	const m = tzOffset(tz, d) - tzOffset('Europe/Berlin', d);
	if (!m) return { time, diff: '' };
	const h = Math.floor(Math.abs(m) / 60),
		q = ['', '¼', '½', '¾'][Math.round((Math.abs(m) % 60) / 15) % 4];
	return { time, diff: `${m > 0 ? '+' : '−'}${h || !q ? h : ''}${q} Std` };
}

/* Einreise für Deutsche (Auswärtiges Amt, täglich beim Build aktualisiert – siehe scripts/build-entry.py) */
export interface Entry {
	/** eu: Freizügigkeit · free: visumfrei · auth: visumfrei mit Online-Genehmigung (ESTA, ETA …) · arrival: Visum bei
	    Ankunft · evisa: E-Visum vorab · visa: Visum vorab (Botschaft) · special: Sonderregeln */
	k: 'eu' | 'free' | 'auth' | 'arrival' | 'evisa' | 'visa' | 'special';
	/** erlaubte Aufenthaltsdauer in Tagen */
	d?: number;
	/** kurzer Hinweis */
	n?: string;
	/** Regelung befristet bis (JJJJ-MM-TT) */
	u?: string;
	/** eigener Warnhinweis (z. B. Westsahara) */
	wt?: string;
	link?: string;
	/** Seite des Auswärtigen Amts (Inhalts-Nr.), Stand der Seite */
	id?: number;
	lm?: string;
	/** 2 Reisewarnung, 1 Teilreisewarnung */
	w?: 0 | 1 | 2;
	/** Personalausweis / Reisepass: y ja, r ja mit Einschränkungen, n nein */
	pa?: 'y' | 'r' | 'n';
	rp?: 'y' | 'r' | 'n';
	/** Einschränkung im Wortlaut (z. B. „mit ESTA oder Visum“) */
	pat?: string;
	rpt?: string;
	/** Gebiet ohne eigene Seite: Regeln von der Seite dieses Landes */
	par?: string;
	/** Regeln seit der Prüfung geändert: dann gilt der Satz des Amts (s) statt der Einordnung */
	chg?: boolean;
	s?: string;
}
let entryCache: { date: string; c: Record<string, Entry> } | null = null;
let entryLoading: Promise<{ date: string; c: Record<string, Entry> }> | null = null;
export const entryNow = (code: string) => (entryCache ? (entryCache.c[code] ?? null) : undefined);
export const entryDate = () => entryCache?.date ?? '';
export function loadEntry() {
	if (entryCache) return Promise.resolve(entryCache);
	entryLoading ??= import('./data/entry.json').then((m) => (entryCache = m.default as unknown as { date: string; c: Record<string, Entry> }));
	return entryLoading;
}

/* Klima (TerraClimate, Mittel 1991–2020): je Land ein oder mehrere Orte mit Monatswerten –
   [Name, [lon, lat], Tageshöchsttemperatur °C ×12, Tiefsttemperatur °C ×12, Niederschlag mm ×12,
    Wassertemperatur °C ×12 (nur am Meer, sonst null), Zeitzone (sonst null), Wirbelsturmsaison [Bezeichnung, Monate] oder null] */
export type ClimatePlace = [string, [number, number], number[], number[], number[], number[] | null, string | null, [string, number[]] | null];
let climateCache: Record<string, ClimatePlace[]> | null = null;
let climateLoading: Promise<Record<string, ClimatePlace[]>> | null = null;
export const climateNow = (code: string) => (climateCache ? (climateCache[code] ?? null) : undefined);
export function loadClimate() {
	if (climateCache) return Promise.resolve(climateCache);
	climateLoading ??= import('./data/climate.json').then((m) => (climateCache = m.default as unknown as Record<string, ClimatePlace[]>));
	return climateLoading;
}

/** Wie angenehm ist ein Monat zum Reisen (0–1)? Tagestemperatur 22–32 °C ideal (abnehmend bis 10 °C bzw. 39 °C – am
    Strand sind 32 °C noch angenehm), dazu wenig Regen (bis 60 mm voll, ab 250 mm im Monat Regenzeit). Gedacht für Städte-,
    Rund- und Badereisen, nicht für Wintersport. */
export function monthScore(tmax: number, ppt: number) {
	const t = tmax < 22 ? Math.max(0, (tmax - 10) / 12) : tmax > 32 ? Math.max(0, (39 - tmax) / 7) : 1;
	const r = ppt <= 60 ? 1 : ppt >= 250 ? 0 : 1 - (ppt - 60) / 190;
	return t * (0.35 + 0.65 * r);
}
/** beste Monate (0–11): mindestens 80 % des besten Monats. Erreicht kein Monat ein gutes Maß (zu kalt oder ständig
    nass), sind es nur die angenehmsten – bei Kälte das ganze Jahr über die wärmsten Monate (z. B. Spitzbergen: Jul – Aug). */
export function bestMonths(tmax: number[], ppt: number[]) {
	const s = tmax.map((t, i) => monthScore(t, ppt[i]));
	const max = Math.max(...s);
	if (max >= 0.5) {
		const ok = s.map((v) => v >= 0.8 * max);
		// einzelne knapp verfehlte Monate zwischen zwei guten nicht herausreißen (Cusco: Apr – Nov statt Apr – Jun, Aug – Nov)
		const fill = ok.map((o, i) => o || (ok[(i + 11) % 12] && ok[(i + 1) % 12] && s[i] >= 0.65 * max));
		return { months: fill.map((o, i) => (o ? i : -1)).filter((i) => i >= 0), good: true };
	}
	if (max >= 0.12) return { months: s.map((v, i) => (v >= max - 0.08 ? i : -1)).filter((i) => i >= 0), good: false };
	const warm = Math.max(...tmax);
	return { months: tmax.map((t, i) => (t >= warm - 1.5 ? i : -1)).filter((i) => i >= 0), good: false };
}
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
export const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
/** Monate als Zeiträume, auch über den Jahreswechsel, nach Beginn sortiert: „Mai – Sep“, „Nov – Mär“, „Jan – Mär, Jun – Aug“ */
export function monthRanges(ms: number[]) {
	if (!ms.length) return '';
	if (ms.length === 12) return 'ganzjährig';
	const set = new Set(ms);
	const start = [...Array(12).keys()].find((i) => !set.has(i)) ?? 0; // an einer Lücke beginnen, dann zusammenhängend
	const runs: number[][] = [];
	let run: number[] = [];
	for (let k = 1; k <= 12; k++) {
		const i = (start + k) % 12;
		if (set.has(i)) run.push(i);
		else if (run.length) {
			runs.push(run);
			run = [];
		}
	}
	if (run.length) runs.push(run);
	return runs
		.sort((a, b) => a[0] - b[0])
		.map((r) => (r.length === 1 ? MONTHS[r[0]] : `${MONTHS[r[0]]} – ${MONTHS[r[r.length - 1]]}`))
		.join(', ');
}

/** Sonnenauf- und -untergang am 15. des Monats an einem Ort, in dessen Ortszeit (mit Sommerzeit) –
    z. B. { rise: '06:12', set: '18:34' }; bei Mitternachtssonne bzw. Polarnacht { polar: 'day' | 'night' } */
export function sunTimes(lat: number, lon: number, month: number, tz: string) {
	const year = new Date().getFullYear();
	const doy = Math.round((Date.UTC(year, month, 15) - Date.UTC(year, 0, 0)) / 864e5);
	const g = ((2 * Math.PI) / 365) * (doy - 1);
	const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
	const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
	const phi = (lat * Math.PI) / 180;
	const c = (Math.sin((-0.833 * Math.PI) / 180) - Math.sin(phi) * Math.sin(decl)) / (Math.cos(phi) * Math.cos(decl));
	if (c <= -1) return { polar: 'day' as const };
	if (c >= 1) return { polar: 'night' as const };
	const ha = (Math.acos(c) * 180) / Math.PI;
	const at = (minUtc: number) => {
		try {
			return new Intl.DateTimeFormat('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(new Date(Date.UTC(year, month, 15) + minUtc * 6e4));
		} catch {
			return '';
		}
	};
	return { rise: at(720 - 4 * (lon + ha) - eqt), set: at(720 - 4 * (lon - ha) - eqt) };
}

/** Regenzeit: Monate mit viel Regen (ab 120 mm) und deutlich mehr als in der trockenen Zeit (mindestens das Doppelte
    der vier trockensten Monate). Wo es das ganze Jahr ähnlich nass ist, gibt es keine Regenzeit. */
export function rainSeason(ppt: number[]) {
	const dry = [...ppt].sort((a, b) => a - b).slice(0, 4);
	const dryAvg = dry.reduce((a, b) => a + b, 0) / 4;
	const w = ppt.map((v) => v >= 120 && v >= 2 * dryAvg + 20);
	// kurze, etwas trockenere Pausen (bis zwei Monate, noch ab 75 mm) gehören dazu – Karibik: Jun – Okt statt Jun, Sep – Okt
	const fill = w.map((on, i) => {
		if (on || ppt[i] < 75) return on;
		for (const [a, b] of [[1, 1], [1, 2], [2, 1]]) if (w[(i + 12 - a) % 12] && w[(i + b) % 12] && (a + b === 2 || ppt[(i + (a === 2 ? 11 : 1)) % 12] >= 75)) return true;
		return false;
	});
	const wet = fill.map((on, i) => (on ? i : -1)).filter((i) => i >= 0);
	return wet.length === 12 ? [] : wet;
}
/** Länder, in denen die Regenzeit Monsun heißt (Süd- und Südostasien) */
export const MONSOON = new Set(['IN', 'PK', 'NP', 'BT', 'BD', 'LK', 'MV', 'MM', 'TH', 'LA', 'KH', 'VN', 'PH']);

/* Saisonale Highlights je Land (von Hand zusammengestellt und geprüft, siehe data/highlights.json):
   c: Art (fest = Feste aller Art, bluete = Blüte/Laub/Ernte, tier = Tierwelt an Land und im Meer, natur = Naturschauspiel wie Polarlicht, Eis, Wasserstände), t: Titel, r: Ort/Region, m: Monate (0–11),
   v: Termin wechselt je nach Jahr (Mondkalender u. Ä.), d: fester Termin als Text,
   y: ganzjährig möglich (m dann: besonders gute Monate, falls es sie gibt) */
export interface Highlight {
	c: 'fest' | 'bluete' | 'tier' | 'natur';
	t: string;
	r?: string;
	m: number[];
	v?: 1;
	d?: string;
	y?: 1;
}
let hlCache: Record<string, Highlight[]> | null = null;
let hlLoading: Promise<Record<string, Highlight[]>> | null = null;
export const highlightsNow = (code: string) => (hlCache ? (hlCache[code] ?? []) : undefined);
export function loadHighlights() {
	if (hlCache) return Promise.resolve(hlCache);
	hlLoading ??= import('./data/highlights.json').then((m) => (hlCache = m.default as unknown as Record<string, Highlight[]>));
	return hlLoading;
}
