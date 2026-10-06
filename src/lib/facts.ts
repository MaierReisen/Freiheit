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
export interface Water {
	rivers: { n: string; r: number; c: [number, number][][] }[];
	lakes: { n: string; r: number; c: [number, number][][] }[];
}
let water: Water | null = null;
let waterLoading: Promise<Water> | null = null;
type Packed = [string, number, number[][]][];
/** gespeichert als ganze Hundertstelgrad mit Differenzen zum Vorgänger: [x0,y0,dx1,dy1,…] */
const unpack = (list: Packed) =>
	list.map(([n, r, parts]) => ({
		n,
		r,
		c: parts.map((f) => {
			const out: [number, number][] = [];
			let x = 0,
				y = 0;
			for (let i = 0; i < f.length; i += 2) {
				x = i ? x + f[i] : f[i];
				y = i ? y + f[i + 1] : f[i + 1];
				out.push([x / 100, y / 100]);
			}
			return out;
		})
	}));
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
	return nf({ maximumFractionDigits: d < 10 ? 1 : 0 }).format(d) + ' pro km²';
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
/** Ortszeit und Unterschied zur eigenen Zeit, z. B. { time: '14:32', diff: '+1 Std' } (diff leer bei gleicher Zeit) */
export function localTime(tz: string, d = new Date()) {
	let time = '';
	try {
		time = new Intl.DateTimeFormat('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(d);
	} catch {
		return null;
	}
	const m = tzOffset(tz, d) + d.getTimezoneOffset(); // getTimezoneOffset ist umgekehrt gepolt
	if (!m) return { time, diff: '' };
	const h = Math.floor(Math.abs(m) / 60),
		q = ['', '¼', '½', '¾'][Math.round((Math.abs(m) % 60) / 15) % 4];
	return { time, diff: `${m > 0 ? '+' : '−'}${h || !q ? h : ''}${q} Std` };
}
