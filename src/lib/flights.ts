/* Tab „Flüge“: Datentyp, Einlesen der Flighty-Datei (CSV) und alle Zahlen (Strecke, Flugzeit, Flughafen-Besuche …).
   Gezählt wird nach den Regeln von Flighty (Hilfe-Seite „Connections and layovers“):
   - Umsteigen: Ankunft und Weiterflug am selben Flughafen, 0–8 h dazwischen (planmäßig) → 1 Besuch
   - Aufenthalt 8–24 h (oder länger) → 2 Besuche (Ankunft + Abflug)
   - Hin und zurück (Weiterflug zurück zum Abflughafen des ersten Flugs) → am Wendepunkt 2 Besuche
   - Ankunft an einem, Abflug von einem anderen Flughafen → je 1 Besuch
   Gestrichene Flüge und Flüge in der Zukunft zählen nicht; umgeleitete Flüge zählen zum tatsächlichen Ziel.
   Strecke = kürzester Weg über die Erdkugel (Großkreis). Flugzeit wie Flighty = Gate bis Gate (tatsächlich, sonst geplant), ohne Zeiten aus der Strecke geschätzt
   (an Patricks Flighty-Werten abgeglichen: QR 59 DOH–MUC 6:10 = echte Gate-Zeiten, MUC–SSH ohne Zeiten 4:07, Summe 10 T 13 Std). */

export interface FlightDetail {
	/** Zeiten als Ortszeit „JJJJ-MM-TTTHH:MM“: Gate ab (gds/gda), Start (ofs/ofa), Landung (ons/ona), Gate an (gas/gaa); s = geplant, a = tatsächlich */
	gds?: string;
	gda?: string;
	ofs?: string;
	ofa?: string;
	ons?: string;
	ona?: string;
	gas?: string;
	gaa?: string;
	/** umgeleitet nach (IATA) */
	div?: string;
	/** gestrichen */
	cx?: boolean;
	/** Flugzeugtyp, Kennzeichen */
	ac?: string;
	tail?: string;
	seat?: string;
	/** Sitzart (Fenster/Gang …), Klasse, Reisegrund, Notiz */
	st?: string;
	cab?: string;
	why?: string;
	note?: string;
	/** Terminal und Gate ab/an */
	dt?: string;
	dg?: string;
	at?: string;
	ag?: string;
}

export interface Flight {
	/** eigene Kennung: Flighty-ID bzw. Datum + Strecke + Abflugzeit (verhindert Doppelte beim erneuten Einlesen) */
	id: string;
	/** Abflugdatum „JJJJ-MM-TT“ (Ortszeit) */
	date: string;
	from: string;
	to: string;
	/** Airline als ICAO-Code (z. B. DLH), wie in Flighty */
	airline?: string;
	/** Flugnummer ohne Airline-Kürzel (z. B. 2827) */
	no?: string;
	d: FlightDetail;
}

/** [Stadt, Name ('' = wie die Stadt), Land (ISO), Breite, Länge, Zeitzone, geschlossen am ('' = offen), eröffnet am (ab 1990)] – nur Flughäfen mit Linienverkehr */
export type Airport = [string, string, string, number, number, string, string?, string?];
export type Airports = Record<string, Airport>;
/** [Name, IATA-Kürzel, Gründungsjahr (0 = unbekannt), letztes Jahr (0 = fliegt noch)] */
export type Airlines = Record<string, [string, string, number?, number?]>;
/** Fakten für die Flughafen-Seite: [Größe L/M/S, Höhe m, Landebahnen, längste m, ICAO, Passagiere, Jahr, Wikipedia-Artikel („en:“ = englisch)] */
export type AirportInfo = ['L' | 'M' | 'S', number | null, number, number, string, number, number, string];

let apP: Promise<Airports> | null = null;
let alP: Promise<Airlines> | null = null;
/** Flughäfen (~6000, nachgeladen) */
// bei Fehler (z. B. offline) nicht merken, damit der nächste Versuch neu lädt
export const loadAirports = () =>
	(apP ??= import('./data/airports.json').then((m) => m.default as unknown as Airports).catch((e) => ((apP = null), Promise.reject(e))));
export const loadAirlines = () =>
	(alP ??= import('./data/airlines.json').then((m) => m.default as unknown as Airlines).catch((e) => ((alP = null), Promise.reject(e))));
let aiP: Promise<Record<string, AirportInfo>> | null = null;
/** Fakten zu den Flughäfen (erst beim Öffnen einer Flughafen-Seite geladen) */
export const loadAirportInfo = () =>
	(aiP ??= import('./data/airportinfo.json').then((m) => m.default as unknown as Record<string, AirportInfo>).catch((e) => ((aiP = null), Promise.reject(e))));

/* ---------- Prüfen, ob es einen Flug so geben kann (von Hand eingetragene Flüge) ---------- */

/** Längster Nonstop-Linienflug (Singapur–New York, 15.349 km) mit etwas Luft */
export const MAX_KM = 15600;
/** Airline zur Flugnummer: „LH“ (IATA) oder „DLH“ (ICAO). IATA-Kürzel werden neu vergeben: die Airline, die am Datum flog;
    dann schon geflogene, dann ohne Zusatz in Klammern. null = Kürzel unbekannt, '' = keine Airline flog damals unter dem Kürzel */
export function airlineFor(code: string, date: string, al: Airlines, used: Set<string>): string | null {
	const y = +date.slice(0, 4);
	const flies = (c: string) => {
		const [, , from = 0, to = 0] = al[c];
		return !(from && y < from) && !(to && y > to);
	};
	if (code.length === 3 && al[code]) return flies(code) ? code : '';
	const cand = Object.keys(al).filter((c) => al[c][1] === code);
	if (!cand.length) return null;
	const ok = cand.filter(flies);
	ok.sort((p, k) => Number(used.has(k)) - Number(used.has(p)) || Number(al[p][0].includes('(')) - Number(al[k][0].includes('(')));
	return ok[0] ?? '';
}
/** Flughafen am Datum in Betrieb? Text des Grundes, sonst '' */
export function airportProblem(c: string, date: string, ap: Airports): string {
	const a = ap[c];
	if (!a) return `${c} ist kein Flughafen mit Linienflügen`;
	const fmt = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	if (a[6] && date >= a[6]) return `${a[1] || a[0]} ist seit ${fmt(a[6])} geschlossen`;
	if (a[7] && date < a[7]) return `${a[1] || a[0]} wurde erst am ${fmt(a[7])} eröffnet`;
	return '';
}
/** Flugzeit (Gate bis Gate, Minuten) passt zur Strecke? Text des Grundes, sonst '' */
export function durationProblem(km: number, min: number): string {
	if (min < 15) return 'So kurz kann ein Flug nicht sein – stimmen die Uhrzeiten?';
	if (km / (min / 60) > 1000) return 'So schnell fliegt kein Linienflugzeug – stimmen die Uhrzeiten (Ortszeit)?';
	if (min > estFlightMin(km) * 1.6 + 90) return 'Für diese Strecke ist die Flugzeit viel zu lang – stimmen die Uhrzeiten (Ortszeit)?';
	return '';
}

/** Vergleichbare Textform eines Flugs (Felder sortiert): Postgres (jsonb) liefert die Felder in anderer Reihenfolge zurück */
export function flightSig(f: Flight): string {
	const d = f.d as Record<string, unknown>;
	const det = Object.keys(d)
		.sort()
		.map((k) => [k, d[k]]);
	return JSON.stringify([f.id, f.date, f.from, f.to, f.airline ?? '', f.no ?? '', det]);
}
/** Strecke unabhängig von der Richtung („FRA-JFK“, alphabetisch) */
export const routeKey = (a: string, b: string) => [a, b].sort().join('-');
/** Gleicher Flug auch ohne gleiche Kennung (Flighty vergibt manchen Flügen erst später eine ID): Datum, Strecke, geplanter Abflug */
export const flightMatch = (f: Flight) => `${f.date}|${f.d.gds ?? ''}|${f.from}|${f.to}`;
/** Kennung stammt von Flighty (sonst selbst gebildet: beginnt mit dem Datum) */
export const hasFlightyId = (f: Flight) => !/^\d{4}-\d{2}-\d{2}/.test(f.id);

/* ---------- Flighty-Datei einlesen ---------- */

/** CSV nach RFC 4180 (Anführungszeichen, Kommas und Zeilenumbrüche in Feldern) */
function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [],
		f = '',
		q = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (q) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					f += '"';
					i++;
				} else q = false;
			} else f += c;
		} else if (c === '"') q = true;
		else if (c === ',') {
			row.push(f);
			f = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(f);
			rows.push(row);
			row = [];
			f = '';
		} else f += c;
	}
	if (f || row.length) {
		row.push(f);
		rows.push(row);
	}
	return rows.filter((r) => r.some((x) => x.trim()));
}

const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const iata = (s: string) => (/^[A-Z]{3}$/.test(s.trim().toUpperCase()) ? s.trim().toUpperCase() : '');

/** Liest den Export aus Flighty (Einstellungen → Flüge exportieren). Buchungscode (PNR) wird bewusst nicht übernommen. */
export function parseFlighty(text: string): Flight[] {
	const rows = parseCsv(text.replace(/^﻿/, ''));
	if (rows.length < 1) return [];
	const head = rows[0].map((h) => h.trim());
	const col = (name: string) => head.indexOf(name);
	const need = ['Date', 'From', 'To'].map(col);
	if (need.some((i) => i < 0)) throw new Error('format');
	const I = {
		date: col('Date'), airline: col('Airline'), flight: col('Flight'), from: col('From'), to: col('To'),
		dt: col('Dep Terminal'), dg: col('Dep Gate'), at: col('Arr Terminal'), ag: col('Arr Gate'),
		cx: col('Canceled'), div: col('Diverted To'),
		gds: col('Gate Departure (Scheduled)'), gda: col('Gate Departure (Actual)'),
		ofs: col('Take off (Scheduled)'), ofa: col('Take off (Actual)'),
		ons: col('Landing (Scheduled)'), ona: col('Landing (Actual)'),
		gas: col('Gate Arrival (Scheduled)'), gaa: col('Gate Arrival (Actual)'),
		ac: col('Aircraft Type Name'), tail: col('Tail Number'), seat: col('Seat'), st: col('Seat Type'),
		cab: col('Cabin Class'), why: col('Flight Reason'), note: col('Notes'), fid: col('Flight Flighty ID')
	};
	const out: Flight[] = [];
	const seen = new Set<string>();
	for (const r of rows.slice(1)) {
		const v = (i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
		const date = v(I.date).slice(0, 10);
		const from = iata(v(I.from)),
			to = iata(v(I.to));
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !from || !to) continue;
		const d: FlightDetail = {};
		for (const k of ['gds', 'gda', 'ofs', 'ofa', 'ons', 'ona', 'gas', 'gaa'] as const) {
			const t = v(I[k]);
			if (TIME.test(t)) d[k] = t.slice(0, 16);
		}
		for (const k of ['dt', 'dg', 'at', 'ag', 'ac', 'tail', 'seat', 'st', 'cab', 'why', 'note'] as const) {
			const t = v(I[k]);
			if (t) d[k] = t;
		}
		const div = iata(v(I.div));
		if (div) d.div = div;
		if (/^(true|yes|1)$/i.test(v(I.cx))) d.cx = true;
		const airline = v(I.airline).toUpperCase();
		const no = v(I.flight);
		let id = v(I.fid) || `${date}${d.gds ? d.gds.slice(10) : ''}-${from}-${to}-${airline}${no}`;
		while (seen.has(id)) id += '+';
		seen.add(id);
		out.push({ id, date, from, to, ...(airline ? { airline } : {}), ...(no ? { no } : {}), d });
	}
	return out;
}

/* ---------- Zeit ---------- */

const fmts = new Map<string, Intl.DateTimeFormat>();
/** Abstand der Zeitzone zu UTC in Minuten zum Zeitpunkt ms */
function tzOffset(tz: string, ms: number): number {
	let f = fmts.get(tz);
	if (!f) {
		try {
			f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
		} catch {
			f = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
		}
		fmts.set(tz, f);
	}
	const p: Record<string, number> = {};
	for (const x of f.formatToParts(ms)) if (x.type !== 'literal') p[x.type] = +x.value;
	return (Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute) - Math.floor(ms / 60000) * 60000) / 60000;
}
/** Ortszeit „JJJJ-MM-TTTHH:MM“ in der Zeitzone tz → Zeitpunkt (ms, UTC) */
export function localToUtc(local: string, tz: string | undefined): number {
	const [y, mo, d, h, mi] = local.split(/[-T:]/).map(Number);
	const guess = Date.UTC(y, mo - 1, d, h || 0, mi || 0);
	if (!tz) return guess;
	const u = guess - tzOffset(tz, guess) * 60000;
	return guess - tzOffset(tz, u) * 60000;
}

/* ---------- Strecke und Dauer ---------- */

const R = 6371; // Erdradius in km
export const EARTH_KM = 40075;
export const MOON_KM = 384400;
export function gcKm(a: Airport, b: Airport): number {
	const toR = Math.PI / 180;
	const dLat = (b[3] - a[3]) * toR,
		dLon = (b[4] - a[4]) * toR;
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[3] * toR) * Math.cos(b[3] * toR) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
/** geschätzte Flugzeit (Gate bis Gate) in Minuten aus der Strecke, wenn die Datei keine Zeiten hat – wie Flighty: rund 730 km/h im Schnitt */
export const estFlightMin = (km: number) => Math.round(1.5 + km / 12.15);
/** geschätzte Rollzeit (Gate ↔ Start/Landung) zusammen, Minuten */
const TAXI = 22; // Rollzeit Gate ↔ Start/Landung zusammen (Mittel der Flüge mit allen Zeiten)

export interface Leg {
	f: Flight;
	/** tatsächlicher Zielflughafen (bei Umleitung) */
	to: string;
	km: number;
	/** Flugzeit (Gate bis Gate) in Minuten */
	min: number;
	/** Zeit geschätzt (keine Start-/Landezeiten in der Datei) */
	est: boolean;
	/** Abflug und Ankunft (planmäßig, ms UTC) für die Umsteige-Regel */
	dep: number;
	arr: number;
	/** ab wann der Flug als geflogen zählt (ms UTC): Abflug; von Hand eingetragene schon ab Beginn des Abflugtags */
	doneAt: number;
	done: boolean;
}

const diffMin = (a?: string, b?: string, ta?: string, tb?: string) => (a && b ? Math.round((localToUtc(b, tb) - localToUtc(a, ta)) / 60000) : NaN);

/** Strecke, Dauer und Zeiten je Flug (Flughafen unbekannt: Strecke 0) */
export function legOf(f: Flight, ap: Airports, now = Date.now()): Leg {
	const to = f.d.div || f.to;
	const A = ap[f.from],
		B = ap[to];
	const ta = A?.[5],
		tb = B?.[5];
	const km = A && B ? gcKm(A, B) : 0;
	const d = f.d;
	// Flugzeit wie Flighty: Gate bis Gate tatsächlich, sonst geplant, sonst Start bis Landung plus Rollzeit, sonst geschätzt
	let min = diffMin(d.gda, d.gaa, ta, tb);
	if (!(min > 0)) min = diffMin(d.gds, d.gas, ta, tb);
	if (!(min > 0)) min = diffMin(d.ofa, d.ona, ta, tb) + TAXI;
	if (!(min > 0)) min = diffMin(d.ofs, d.ons, ta, tb) + TAXI;
	const est = !(min > 0);
	if (est) min = km ? estFlightMin(km) : 0;
	const depLocal = d.gds || d.ofs || d.gda || d.ofa || f.date + 'T12:00';
	const dep = localToUtc(depLocal, ta);
	const arrLocal = d.gas || d.ons;
	const arr = arrLocal ? localToUtc(arrLocal, tb) : dep + min * 60000;
	// von Hand eingetragen: am Abflugtag schon geflogen (man trägt ihn meist nach der Landung ein), nur spätere Tage sind geplant
	const doneAt = hasFlightyId(f) ? dep : localToUtc(f.date + 'T00:00', ta);
	return { f, to, km, min, est, dep, arr, doneAt, done: !d.cx && doneAt <= now };
}

/* ---------- Statistik ---------- */

export interface Count {
	code: string;
	n: number;
}
export interface FlightStats {
	/** alle Flüge mit Strecke/Dauer, neueste zuerst (auch geplante und gestrichene) */
	legs: Leg[];
	/** zählende Flüge (stattgefunden, nicht gestrichen) */
	n: number;
	upcoming: number;
	km: number;
	min: number;
	/** wie viele Flugzeiten geschätzt sind */
	estimated: number;
	/** Flughäfen mit Anzahl Besuche (meistbesuchte zuerst) */
	airports: Count[];
	/** Länder der Flughäfen in Reihenfolge des ersten Besuchs */
	countries: string[];
	airlines: Count[];
	/** Flugzeugtypen (Name) */
	aircraft: Count[];
	/** Strecken unabhängig von der Richtung („MUC-LIS“, alphabetisch) */
	routes: Count[];
	longest: Leg | null;
	shortest: Leg | null;
	/** Flughafen-Codes, die in der Liste fehlen (ohne Strecke) */
	unknown: string[];
}

const CONNECT_MS = 8 * 3600000;
const tally = (m: Map<string, number>, k: string, by = 1) => m.set(k, (m.get(k) ?? 0) + by);
const sorted = (m: Map<string, number>): Count[] => [...m].map(([code, n]) => ({ code, n })).sort((a, b) => b.n - a.n || a.code.localeCompare(b.code));

export function flightStats(flights: Flight[], ap: Airports, now = Date.now()): FlightStats {
	const legs = flights.map((f) => legOf(f, ap, now)).sort((a, b) => b.dep - a.dep);
	const done = legs.filter((l) => l.done).reverse(); // älteste zuerst
	const visits = new Map<string, number>(),
		airlines = new Map<string, number>(),
		aircraft = new Map<string, number>(),
		routes = new Map<string, number>();
	const countries: string[] = [];
	const unknown = new Set<string>();
	let km = 0,
		min = 0,
		estimated = 0;
	const seeCountry = (code: string) => {
		const a = ap[code];
		if (!a) unknown.add(code);
		else if (a[2] && !countries.includes(a[2])) countries.push(a[2]);
	};
	done.forEach((l, i) => {
		km += l.km;
		min += l.min;
		if (l.est) estimated++;
		seeCountry(l.f.from);
		seeCountry(l.to);
		tally(visits, l.f.from);
		tally(visits, l.to);
		// Umsteigen (< 8 h am selben Flughafen, nicht zurück zum Ausgangspunkt): Ankunft und Abflug sind zusammen ein Besuch
		// (wie Flighty: 0–8 h Bodenzeit; nur mit bekannter Zeitzone, sonst stimmt die Bodenzeit nicht)
		const prev = done[i - 1];
		if (prev && ap[prev.f.from] && ap[l.f.from] && ap[l.to] && prev.to === l.f.from && l.to !== prev.f.from && l.dep - prev.arr < CONNECT_MS && l.dep - prev.arr >= 0) tally(visits, l.f.from, -1);
		if (l.f.airline) tally(airlines, l.f.airline);
		if (l.f.d.ac) tally(aircraft, l.f.d.ac);
		tally(routes, routeKey(l.f.from, l.to));
	});
	const withKm = done.filter((l) => l.km > 0);
	const longest = withKm.reduce<Leg | null>((m, l) => (!m || l.km > m.km ? l : m), null);
	const shortest = withKm.reduce<Leg | null>((m, l) => (!m || l.km < m.km ? l : m), null);
	return {
		legs,
		n: done.length,
		upcoming: legs.filter((l) => !l.done && !l.f.d.cx).length,
		km,
		min,
		estimated,
		airports: sorted(visits),
		countries,
		airlines: sorted(airlines),
		aircraft: sorted(aircraft),
		routes: sorted(routes),
		longest,
		shortest,
		unknown: [...unknown]
	};
}

/** Länder, in denen man laut den Flügen `ids` war, mit frühestem Monat („JJJJ-MM“): Abflug- und Zielland geflogener Flüge,
    ohne kurzes Umsteigen (< 8 h am selben Flughafen, nicht zurück zum Ausgangspunkt – gleiche Regel wie in flightStats).
    Nachbarflüge kommen aus allen Flügen, damit auch ein Umsteigen auf einen älteren Flug erkannt wird. */
export function flightCountries(flights: Flight[], ap: Airports, ids: Set<string>, now = Date.now()): Map<string, string> {
	const done = flights
		.map((f) => legOf(f, ap, now))
		.filter((l) => l.done)
		.sort((a, b) => a.dep - b.dep);
	const transfer = (a: Leg | undefined, b: Leg | undefined) =>
		!!a && !!b && a.to === b.f.from && b.to !== a.f.from && b.dep - a.arr < CONNECT_MS && b.dep - a.arr >= 0;
	const out = new Map<string, string>();
	const see = (code: string, day: string) => {
		const c = ap[code]?.[2],
			m = day.slice(0, 7);
		if (c && (!out.has(c) || m < out.get(c)!)) out.set(c, m);
	};
	done.forEach((l, i) => {
		if (!ids.has(l.f.id)) return;
		if (!transfer(done[i - 1], l)) see(l.f.from, l.f.date);
		if (!transfer(l, done[i + 1])) see(l.to, l.f.d.gaa || l.f.d.gas || l.f.d.ona || l.f.date);
	});
	return out;
}

/* ---------- Anzeige ---------- */

export const fmtInt = (n: number) => Math.round(n).toLocaleString('de-DE');
/** „3 T 4 Std“ bzw. „12 Std 5 Min“ */
export function fmtDuration(min: number): string {
	const m = Math.round(min);
	const d = Math.floor(m / 1440),
		h = Math.floor((m % 1440) / 60),
		mm = m % 60;
	if (d) return `${d} T ${h} Std`;
	if (h) return `${h} Std ${mm} Min`;
	return `${mm} Min`;
}
/** Flugnummer wie auf der Bordkarte: „LH 1234“ (IATA-Kürzel der Airline), sonst ICAO-Code */
export function flightNo(f: Flight, al: Airlines | null): string {
	if (!f.no) return '';
	const code = (f.airline && al?.[f.airline]?.[1]) || f.airline || '';
	return `${code} ${f.no}`.trim();
}
