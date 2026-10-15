import { CONT_VIEW, nameOf, type ContinentCode } from './countries';
import { toast } from './app.svelte';
import { DEFAULT_SCOPE, countsForContinent, inScope, isScope, type CountryScope } from './scope';
import { supabase } from './supabase';
import { isWonder } from './wonders';
import { flightMatch, flightSig, hasFlightyId, type Flight } from './flights';

/* Daten der App: lokal zwischengespeichert (offline nutzbar) und mit Supabase synchronisiert.
   Jede Änderung wirkt sofort lokal und landet als Auftrag in einer Warteschlange, die an Supabase gesendet wird. */

/** Ein Besuch in einem Land. Platz für Jahr, Städte, Kosten und Notizen (wird später ausgebaut). */
export type Visit = Record<string, unknown>;

export interface CountryEntry {
	code: string;
	name: string;
	visits: Visit[];
	/** Reihenfolge in der Datenbank ("Land Nr. X") */
	position?: number;
	/** Erste Einreise (für den Reisepass): "JJJJ-MM" oder "JJJJ" */
	entered?: string;
	/** Seltenheit des Stempels im Pass: 0 = Common, 1 = Rare, 2 = Epic, 3 = Legendary (einmal ausgelost, fehlt = noch nicht ausgelost;
	    true = altes Los bis v1.23 = Rare) */
	special?: number | boolean;
	[key: string]: unknown;
}

export interface WishEntry {
	code: string;
	name: string;
	[key: string]: unknown;
}

export interface Milestone {
	year: number;
	count: number;
}

export interface AtlasData {
	schemaVersion: number;
	countries: CountryEntry[];
	milestones: Milestone[];
	wishlist: WishEntry[];
	[key: string]: unknown;
}

export type SyncStatus = 'idle' | 'saving' | 'offline' | 'error';

/** Nutzereinstellungen, auf allen Geräten gleich (Tabelle user_settings) */
export interface Settings {
	/** Startregion: darauf zoomt die Karte beim Öffnen der App */
	homeContinent: ContinentCode;
	/** Was zählt als Land? (193 / 195 / 197) – andere Gebiete sind markierbar, zählen aber nicht */
	countryScope: CountryScope;
	/** gesammelte Weltwunder (ids aus wonders.ts), Spalte „wonders“ (Migration 007) */
	wonders: string[];
	/** besuchte Hauptstädte (Ländercodes, Hauptstadt aus facts.json), Spalte „capitals“ (Migration 009) */
	capitals: string[];
}
export const defaultSettings = (): Settings => ({ homeContinent: 'EU', countryScope: DEFAULT_SCOPE, wonders: [], capitals: [] });
const wonderList = (v: unknown): string[] | null => (Array.isArray(v) ? [...new Set(v.filter(isWonder))] : null);
const capitalList = (v: unknown): string[] | null =>
	Array.isArray(v) ? [...new Set(v.filter((c): c is string => typeof c === 'string' && /^[A-Z]{2}$/.test(c)))] : null;
const isContinent = (c: unknown): c is ContinentCode => typeof c === 'string' && c in CONT_VIEW;

type Op =
	| { t: 'addCountry'; code: string; name: string; position: number }
	| { t: 'removeCountry'; code: string }
	| { t: 'reorder'; rows: { code: string; name: string; position: number }[] }
	| { t: 'setEntered'; code: string; entered: string | null }
	| { t: 'setSpecial'; code: string; special: number }
	| { t: 'addWish'; code: string; name: string }
	| { t: 'removeWish'; code: string }
	| { t: 'replaceAll'; data: AtlasData }
	| { t: 'settings'; s: Settings }
	| { t: 'putFlights'; flights: Flight[] }
	| { t: 'removeFlights'; ids: string[] };

// Daten der Version ohne Konto: werden beim ersten Login in das Konto übernommen
const LEGACY_KEY = 'freiheit-state-v2';
// Reste der früheren GitHub-/Deal-Anbindung (u. a. der Zugriffstoken), werden beim Start entfernt
const LEGACY_JUNK = ['freiheit-gh', 'freiheit-dirty', 'freiheit-run'];
const cacheKey = (uid: string) => `freiheit-data:${uid}`;
const queueKey = (uid: string) => `freiheit-queue:${uid}`;
const settingsKey = (uid: string) => `freiheit-settings:${uid}`;
const flightsKey = (uid: string) => `freiheit-flights:${uid}`;
// Flüge liegen nur auf dem Gerät, weil die Spalten im Konto fehlten (Migration 008): beim nächsten Abgleich hochladen
const flightsLocalKey = (uid: string) => `freiheit-flights-local:${uid}`;

export const emptyAtlas = (): AtlasData => ({ schemaVersion: 1, countries: [], milestones: [], wishlist: [] });

type Raw = Record<string, unknown>;

export function normalize(d: unknown): AtlasData | null {
	if (!d || typeof d !== 'object' || !Array.isArray((d as Raw).countries)) return null;
	// criteria gehörte zur Deal-Suche und wird nicht übernommen
	const { criteria: _criteria, ...rest } = d as Raw;
	const countries = (rest.countries as unknown[])
		.filter((c): c is Raw => !!c && typeof (c as Raw).code === 'string')
		.map((c) => {
			const code = (c.code as string).toUpperCase();
			return { ...c, code, name: nameOf(code), visits: Array.isArray(c.visits) ? c.visits : [] }; // Anzeige immer mit dem aktuellen deutschen Namen
		});
	const wishlist = (Array.isArray(rest.wishlist) ? rest.wishlist : [])
		.filter((w): w is Raw => !!w && typeof (w as Raw).code === 'string')
		.map((w) => {
			const code = (w.code as string).toUpperCase();
			return { ...w, code, name: nameOf(code) };
		});
	return {
		...rest,
		schemaVersion: (rest.schemaVersion as number) || 1,
		countries,
		milestones: Array.isArray(rest.milestones) ? (rest.milestones as Milestone[]) : [],
		wishlist
	};
}

const readJson = (key: string): unknown => {
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};
const writeJson = (key: string, v: unknown) => {
	try {
		localStorage.setItem(key, JSON.stringify(v));
	} catch {}
};
const removeKey = (key: string) => {
	try {
		localStorage.removeItem(key);
	} catch {}
};

LEGACY_JUNK.forEach(removeKey);

export const atlas = $state<{
	data: AtlasData;
	sync: SyncStatus;
	settings: Settings;
	flights: Flight[];
	lastAddedAt: number;
	lastFlightAddedAt: number;
	lastAddedCode: string;
	lastAddedCodes: string[];
}>({
	data: emptyAtlas(),
	/** Flüge (Tab „Flüge“), Reihenfolge egal (die Anzeige sortiert) */
	flights: [],
	sync: 'idle',
	settings: defaultSettings(),
	/** Zeitpunkt, zu dem zuletzt selbst ein Land hinzugefügt wurde (für die Feier auf der Startseite) */
	lastAddedAt: 0,
	/** Zeitpunkt, zu dem zuletzt selbst ein Flug eingetragen wurde (Flugzeug im Kopf der Flüge) */
	lastFlightAddedAt: 0,
	lastAddedCode: '',
	/** alle Länder der letzten Hinzufügen-Aktion (bei mehreren auf einmal), das zuletzt gewählte steht auch in lastAddedCode */
	lastAddedCodes: []
});

let uid: string | null = null;
/** angemeldetes Konto (für feste Lose wie die Seltenheit der Bordkarten) */
export const userId = () => uid;
let queue: Op[] = [];
let flushing = false;
let retryT: ReturnType<typeof setTimeout> | undefined;

function persist() {
	if (uid) writeJson(cacheKey(uid), atlas.data);
}
function enqueue(...ops: Op[]) {
	if (!uid) return;
	queue.push(...ops);
	writeJson(queueKey(uid), queue);
	flush();
}

export const visitedSet = () => new Set(atlas.data.countries.map((c) => c.code));
/** Zählt dieses Land in der gewählten Länderliste? */
export const isCounted = (code: string) => inScope(code, atlas.settings.countryScope);
/** Bereiste Länder, die in der gewählten Liste zählen (in Reihenfolge = "Land Nr. X") */
export const countedCountries = () => atlas.data.countries.filter((c) => isCounted(c.code));
/** Bereiste Stempel, die für Kontinente und Abzeichen zählen (Länder der Liste plus Antarktis) */
/** besuchte Hauptstädte, die zählen: nur von bereisten Ländern der gewählten Länderliste */
export const countedCapitals = () => {
	const have = new Set(countedCountries().map((c) => c.code));
	return atlas.settings.capitals.filter((c) => have.has(c));
};
export const continentCountries = () => atlas.data.countries.filter((c) => countsForContinent(c.code, atlas.settings.countryScope));
export const isEntered = (v: unknown): v is string => typeof v === 'string' && /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(v);
export const wishSet = () => new Set(atlas.data.wishlist.map((c) => c.code));

/* ---------- Supabase ---------- */
/** Fehler „Spalte gibt es nicht“ (Migration noch nicht ausgeführt) */
const noColumn = (e: { code?: string } | null | undefined) => e?.code === 'PGRST204' || e?.code === '42703';
/** Spalte „special“ noch alt (ja/nein statt Stufe, Migration 006 fehlt) */
const oldSpecial = (e: { code?: string } | null | undefined) => e?.code === '22P02';

async function runOp(op: Op, user: string) {
	const ok = <T extends { error: unknown }>(r: T) => {
		if (r.error) throw r.error;
	};
	switch (op.t) {
		case 'addCountry':
			ok(await supabase.from('visited_countries').upsert({ user_id: user, code: op.code, name: op.name, position: op.position }));
			return;
		case 'setEntered': {
			const r = await supabase.from('visited_countries').update({ entered: op.entered }).eq('user_id', user).eq('code', op.code);
			// Spalte noch nicht angelegt (Migration 004 fehlt): Datum bleibt lokal, Warteschlange nicht blockieren
			if (r.error && r.error.code !== 'PGRST204' && r.error.code !== '42703') throw r.error;
			return;
		}
		case 'setSpecial': {
			// nur setzen, solange noch nicht ausgelost: das erste Gerät gewinnt, alle anderen übernehmen dessen Los
			const r = await supabase.from('visited_countries').update({ special: op.special }).eq('user_id', user).eq('code', op.code).is('special', null);
			// Spalte fehlt oder ist noch alt (Migration 006 fehlt): Los bleibt lokal
			if (r.error && !noColumn(r.error) && !oldSpecial(r.error)) throw r.error;
			return;
		}
		case 'reorder':
			ok(await supabase.from('visited_countries').upsert(op.rows.map((r) => ({ user_id: user, code: r.code, name: r.name, position: r.position }))));
			return;
		case 'removeCountry':
			ok(await supabase.from('visited_countries').delete().eq('user_id', user).eq('code', op.code));
			return;
		case 'addWish':
			ok(await supabase.from('wishlist').upsert({ user_id: user, code: op.code, name: op.name }));
			return;
		case 'removeWish':
			ok(await supabase.from('wishlist').delete().eq('user_id', user).eq('code', op.code));
			return;
		case 'settings': {
			const row = { user_id: user, home_continent: op.s.homeContinent, country_scope: op.s.countryScope, updated_at: new Date().toISOString() };
			let r = await supabase.from('user_settings').upsert({ ...row, wonders: op.s.wonders ?? [], capitals: op.s.capitals ?? [] });
			// Spalte „capitals“ (Migration 009) bzw. „wonders“ (007) fehlt: übrige Einstellungen trotzdem speichern, Rest bleibt auf dem Gerät
			if (r.error && noColumn(r.error)) r = await supabase.from('user_settings').upsert({ ...row, wonders: op.s.wonders ?? [] });
			if (r.error && noColumn(r.error)) r = await supabase.from('user_settings').upsert(row);
			// Tabelle noch nicht angelegt (Migration fehlt): Einstellung bleibt lokal, Warteschlange nicht blockieren
			// bzw. Spalte fehlt (PGRST204): Einstellung bleibt lokal, Warteschlange nicht blockieren
			if (r.error && r.error.code !== 'PGRST205' && r.error.code !== 'PGRST204') throw r.error;
			return;
		}
		case 'putFlights': {
			for (let i = 0; i < op.flights.length; i += 200) {
				const rows = op.flights.slice(i, i + 200).map((f) => ({
					user_id: user,
					ext_id: f.id,
					flight_date: f.date,
					from_airport: f.from,
					to_airport: f.to,
					airline: f.airline ?? null,
					flight_number: f.no ?? null,
					detail: f.d
				}));
				const r = await supabase.from('flights').upsert(rows, { onConflict: 'user_id,ext_id' });
				// Tabelle/Spalten fehlen (Migration 008): Flüge bleiben auf dem Gerät und werden später hochgeladen
				if (r.error && (noColumn(r.error) || r.error.code === 'PGRST205' || r.error.code === '42P10')) {
					writeJson(flightsLocalKey(user), true);
					return;
				}
				ok(r);
			}
			return;
		}
		case 'removeFlights': {
			const r = await supabase.from('flights').delete().eq('user_id', user).in('ext_id', op.ids);
			if (r.error && !noColumn(r.error) && r.error.code !== 'PGRST205') throw r.error;
			return;
		}
		case 'replaceAll': {
			const d = op.data;
			for (const t of ['visited_countries', 'wishlist', 'milestones']) ok(await supabase.from(t).delete().eq('user_id', user));
			if (d.countries.length) {
				const rows = d.countries.map((c, i) => ({
					user_id: user,
					code: c.code,
					name: c.name,
					position: i,
					entered: isEntered(c.entered) ? c.entered : null,
					special: typeof c.special === 'number' ? c.special : c.special === true ? 1 : null
				}));
				let r = await supabase.from('visited_countries').insert(rows);
				// ohne Spalte „special“ (Migration 005/006 fehlt) bzw. „entered“ (004 fehlt) speichern
				if (r.error && (noColumn(r.error) || oldSpecial(r.error))) r = await supabase.from('visited_countries').insert(rows.map(({ special: _s, ...x }) => x));
				if (r.error && noColumn(r.error)) r = await supabase.from('visited_countries').insert(rows.map(({ special: _s, entered: _e, ...x }) => x));
				ok(r);
			}
			if (d.wishlist.length) ok(await supabase.from('wishlist').insert(d.wishlist.map((w) => ({ user_id: user, code: w.code, name: w.name }))));
			if (d.milestones.length)
				ok(await supabase.from('milestones').insert(d.milestones.map((m) => ({ user_id: user, year: m.year, count: m.count }))));
			return;
		}
	}
}

/** Warteschlange der Reihe nach an Supabase senden; bei Fehlern später erneut versuchen */
export async function flush(): Promise<boolean> {
	if (!uid || flushing) return queue.length === 0;
	const user = uid;
	flushing = true;
	clearTimeout(retryT);
	if (queue.length) atlas.sync = 'saving';
	try {
		while (queue.length && uid === user) {
			await runOp(queue[0], user);
			queue.shift();
			writeJson(queueKey(user), queue);
		}
		if (uid === user) atlas.sync = 'idle';
	} catch {
		atlas.sync = navigator.onLine === false ? 'offline' : 'error';
		retryT = setTimeout(flush, 30000);
	} finally {
		flushing = false;
	}
	return queue.length === 0;
}

/** Stand aus Supabase laden (nachdem offene Änderungen gesendet wurden) */
async function pull() {
	const user = uid;
	if (!user || !(await flush())) return;
	const countriesQuery = (cols: string) => supabase.from('visited_countries').select(cols).order('position').order('created_at');
	const [c0, w, m, st, fl] = await Promise.all([
		countriesQuery('code,name,position,created_at,entered,special'),
		supabase.from('wishlist').select('code,name').order('created_at'),
		supabase.from('milestones').select('year,count').order('year'),
		supabase.from('user_settings').select('*').maybeSingle(),
		supabase.from('flights').select('ext_id,flight_date,from_airport,to_airport,airline,flight_number,detail')
	]);
	if (uid === user) syncFlights(user, fl as unknown as { data: FlightRow[] | null; error: { code?: string } | null });
	if (!st.error && st.data && uid === user && !queue.some((o) => o.t === 'settings')) {
		const remote = wonderList(st.data.wonders),
			remoteCaps = capitalList(st.data.capitals);
		const next = {
			...atlas.settings,
			homeContinent: isContinent(st.data.home_continent) ? st.data.home_continent : 'EU',
			countryScope: isScope(st.data.country_scope) ? st.data.country_scope : atlas.settings.countryScope,
			// ohne Spalte bzw. im Konto noch leer: auf dem Gerät gesammelte Weltwunder behalten (und hochladen)
			wonders: remote?.length ? remote : atlas.settings.wonders,
			capitals: remoteCaps?.length ? remoteCaps : atlas.settings.capitals
		};
		if ((remote && !remote.length && next.wonders.length) || (remoteCaps && !remoteCaps.length && next.capitals.length)) enqueue({ t: 'settings', s: { ...next } });
		// nur bei echten Änderungen setzen (sonst wird alles neu aufgebaut und gezeichnet → Ruckler)
		if (JSON.stringify(next) !== JSON.stringify(atlas.settings)) atlas.settings = next;
		writeJson(settingsKey(user), atlas.settings);
	}
	// Spalte „special“ (Migration 005) bzw. „entered“ (004) fehlt noch: ohne laden, diese Angaben bleiben auf diesem Gerät
	let noSpecial = false,
		noEntered = false,
		c1 = c0 as { data: unknown; error: { code?: string } | null };
	if (noColumn(c1.error)) {
		noSpecial = true;
		c1 = await countriesQuery('code,name,position,created_at,entered');
	}
	if (noColumn(c1.error)) {
		noEntered = true;
		c1 = await countriesQuery('code,name,position,created_at');
	}
	const c = c1 as unknown as {
		data: { code: string; position: number; entered?: string | null; special?: number | boolean | null }[];
		error: unknown;
	};
	if (c.error || w.error || m.error) {
		atlas.sync = navigator.onLine === false ? 'offline' : 'error';
		return;
	}
	if (uid !== user || queue.length) return; // inzwischen abgemeldet oder neue Änderungen: nicht überschreiben
	const remoteEmpty = !c.data.length && !w.data.length && !m.data.length;
	const legacy = normalize(readJson(LEGACY_KEY));
	if (remoteEmpty && legacy && (legacy.countries.length || legacy.wishlist.length)) {
		// Erster Login: bisherige Daten von diesem Gerät ins Konto übernehmen
		atlas.data = legacy;
		persist();
		enqueue({ t: 'replaceAll', data: legacy });
		if (await flush()) {
			removeKey(LEGACY_KEY);
			toast(`${legacy.countries.length} Länder in dein Konto übernommen`);
		}
		return;
	}
	const next: AtlasData = {
		schemaVersion: 1,
		countries: c.data.map((r) => {
			const local = atlas.data.countries.find((x) => x.code === r.code);
			const entered = noEntered ? local?.entered : r.entered;
			const special = noSpecial ? local?.special : r.special;
			return {
				code: r.code,
				name: nameOf(r.code),
				visits: [],
				position: r.position,
				...(isEntered(entered) ? { entered } : {}),
				// altes „nein“ (false) gilt als nicht ausgelost: wird neu gelost
				...(typeof special === 'number' || special === true ? { special } : {})
			};
		}),
		wishlist: w.data.map((r) => ({ code: r.code, name: nameOf(r.code) })),
		milestones: m.data.map((r) => ({ year: r.year, count: r.count }))
	};
	// nur bei echten Änderungen ersetzen (z. B. von einem anderen Gerät): sonst kein Neuaufbau von Liste und Globus
	if (JSON.stringify(next) !== JSON.stringify(atlas.data)) atlas.data = next;
	persist();
}

type FlightRow = { ext_id: string | null; flight_date: string | null; from_airport: string; to_airport: string; airline: string | null; flight_number: string | null; detail: Flight['d'] | null };
/** Flüge aus dem Konto übernehmen; fehlt die Tabelle/Spalte (Migration 008), bleiben sie auf dem Gerät */
function syncFlights(user: string, r: { data: FlightRow[] | null; error: { code?: string } | null }) {
	if (r.error || !r.data || queue.some((o) => o.t === 'putFlights' || o.t === 'removeFlights')) return;
	const remote: Flight[] = r.data
		.filter((x) => x.ext_id)
		.map((x) => ({
			id: x.ext_id as string,
			date: x.flight_date ?? '',
			from: x.from_airport,
			to: x.to_airport,
			...(x.airline ? { airline: x.airline } : {}),
			...(x.flight_number ? { no: x.flight_number } : {}),
			d: x.detail ?? {}
		}));
	if (readJson(flightsLocalKey(user))) {
		// vorher nur auf dem Gerät gespeichert, jetzt geht es: alles hochladen
		removeKey(flightsLocalKey(user));
		const ids = new Set(remote.map((f) => f.id));
		const missing = atlas.flights.filter((f) => !ids.has(f.id));
		if (missing.length) {
			atlas.flights = [...remote, ...missing];
			writeJson(flightsKey(user), atlas.flights);
			enqueue({ t: 'putFlights', flights: missing });
			return;
		}
	}
	// gleicher Stand (Reihenfolge und Feld-Reihenfolge egal): nichts ersetzen, sonst rechnet der Tab alles neu
	const sig = (l: Flight[]) => l.map(flightSig).sort().join('\n');
	if (sig(remote) !== sig(atlas.flights)) atlas.flights = remote;
	writeJson(flightsKey(user), atlas.flights);
}

/** Zwischengespeicherte Daten und Einstellungen eines Kontos sofort laden (synchron, vor dem ersten Zeichnen) */
export function loadCache(userId: string) {
	if (uid === userId) return;
	uid = userId;
	atlas.data = normalize(readJson(cacheKey(userId))) ?? emptyAtlas();
	const st = readJson(settingsKey(userId)) as Partial<Settings> | null;
	atlas.settings = {
		...defaultSettings(),
		...(st && isContinent(st.homeContinent) ? { homeContinent: st.homeContinent } : {}),
		...(st && isScope(st.countryScope) ? { countryScope: st.countryScope } : {}),
		wonders: wonderList(st?.wonders) ?? [],
		capitals: capitalList(st?.capitals) ?? []
	};
	const fl = readJson(flightsKey(userId));
	atlas.flights = Array.isArray(fl) ? (fl as Flight[]) : [];
	const q = readJson(queueKey(userId));
	queue = Array.isArray(q) ? (q as Op[]) : [];
	atlas.sync = 'idle';
}

/** Nach dem Login: zwischengespeicherte Daten zeigen, dann mit Supabase abgleichen */
let pulledFor: string | null = null;
export async function startSession(userId: string) {
	loadCache(userId);
	if (pulledFor === userId) return; // weitere Auth-Ereignisse (z. B. Token erneuert): nicht erneut laden
	pulledFor = userId;
	await pull();
}

/** Beim Abmelden: Daten dieses Kontos vom Gerät entfernen (liegen weiter in Supabase) */
export function endSession() {
	if (uid) {
		removeKey(cacheKey(uid));
		removeKey(queueKey(uid));
		removeKey(settingsKey(uid));
		removeKey(flightsKey(uid));
		removeKey(flightsLocalKey(uid));
	}
	uid = null;
	pulledFor = null;
	queue = [];
	clearTimeout(retryT);
	atlas.data = emptyAtlas();
	atlas.settings = defaultSettings();
	atlas.flights = [];
	atlas.sync = 'idle';
}
export const pendingChanges = () => queue.length;

if (typeof window !== 'undefined') {
	window.addEventListener('online', () => flush());
	document.addEventListener('visibilitychange', () => {
		// kurz nach dem Zurückwechseln abgleichen, nicht mitten im Wechsel (der soll flüssig bleiben)
		if (document.visibilityState === 'visible' && uid) setTimeout(() => document.visibilityState === 'visible' && uid && pull(), 700);
	});
}

/* ---------- Änderungen ---------- */
export function addCountry(code: string) {
	addCountries([code]);
}
/** Ein oder mehrere Länder auf einmal hinzufügen (Reihenfolge = Reihenfolge der Liste, daraus folgt „Land Nr. X“).
    Hero, Globus und Pass bekommen die Aktion als eine Einheit mit (siehe lastAddedCodes). */
export function addCountries(codes: string[]) {
	const s = atlas.data;
	const have = new Set(s.countries.map((c) => c.code));
	const fresh = [...new Set(codes)].filter((c) => !have.has(c));
	if (!fresh.length) return;
	const start = Math.max(-1, ...s.countries.map((c, i) => c.position ?? i)) + 1;
	const rows = fresh.map((code, i) => ({ code, name: nameOf(code), position: start + i }));
	const wished = new Set(s.wishlist.map((w) => w.code));
	atlas.lastAddedCodes = fresh;
	atlas.lastAddedCode = fresh[fresh.length - 1];
	atlas.lastAddedAt = Date.now();
	atlas.data = {
		...s,
		countries: [...s.countries, ...rows.map((r) => ({ ...r, visits: [] }))],
		wishlist: s.wishlist.filter((w) => !fresh.includes(w.code))
	};
	persist();
	enqueue(...rows.map((r) => ({ t: 'addCountry', ...r }) as Op), ...fresh.filter((c) => wished.has(c)).map((code) => ({ t: 'removeWish', code }) as Op));
}
export function removeCountry(code: string) {
	atlas.data = { ...atlas.data, countries: atlas.data.countries.filter((c) => c.code !== code) };
	persist();
	enqueue({ t: 'removeCountry', code });
	toast(`${nameOf(code)} entfernt`);
}
/** Mehrere Länder auf einmal entfernen */
export function removeCountries(codes: string[]) {
	const del = new Set(codes);
	const gone = atlas.data.countries.filter((c) => del.has(c.code));
	if (!gone.length) return;
	atlas.data = { ...atlas.data, countries: atlas.data.countries.filter((c) => !del.has(c.code)) };
	persist();
	enqueue(...gone.map((c) => ({ t: 'removeCountry', code: c.code }) as Op));
	toast(gone.length === 1 ? `${nameOf(gone[0].code)} entfernt` : `${gone.length} Länder entfernt`);
}
/** Eigene Reihenfolge der zählenden Länder ("Land Nr. X"): codes = alle zählenden Länder in neuer Reihenfolge.
    Gebiete, die nicht zählen, behalten ihren Platz in der Gesamtliste. Pass, Länderseite und Liste folgen automatisch. */
export function reorderCountries(codes: string[]) {
	const s = atlas.data;
	const byCode = new Map(s.countries.map((c) => [c.code, c]));
	const order = codes.map((c) => byCode.get(c)).filter((c): c is CountryEntry => !!c);
	if (order.length !== countedCountries().length) return;
	let k = 0;
	const next = s.countries.map((c, i) => ({ ...(isCounted(c.code) ? order[k++] : c), position: i }));
	const rows = next.filter((c) => byCode.get(c.code)?.position !== c.position).map((c) => ({ code: c.code, name: c.name, position: c.position }));
	if (!rows.length) return;
	atlas.data = { ...s, countries: next };
	persist();
	enqueue({ t: 'reorder', rows });
}
/** Erste Einreise setzen ("JJJJ-MM" / "JJJJ") oder löschen (null) */
export function setEntered(code: string, entered: string | null) {
	const v = isEntered(entered) ? entered : null;
	const s = atlas.data;
	if (!s.countries.some((c) => c.code === code)) return;
	atlas.data = {
		...s,
		countries: s.countries.map((c) => {
			if (c.code !== code) return c;
			const { entered: _old, ...rest } = c;
			return v ? { ...rest, entered: v } : rest;
		})
	};
	persist();
	enqueue({ t: 'setEntered', code, entered: v });
}
/** Ausgeloste Seltenheit des Stempels merken (nur wenn noch keine da ist) */
export function setSpecial(code: string, special: number) {
	const s = atlas.data;
	if (!s.countries.some((c) => c.code === code && typeof c.special !== 'number' && c.special !== true)) return;
	atlas.data = { ...s, countries: s.countries.map((c) => (c.code === code ? { ...c, special } : c)) };
	persist();
	enqueue({ t: 'setSpecial', code, special });
}
export function addWish(code: string) {
	const s = atlas.data;
	if (s.wishlist.some((w) => w.code === code) || s.countries.some((c) => c.code === code)) return;
	atlas.data = { ...s, wishlist: [...s.wishlist, { code, name: nameOf(code) }] };
	persist();
	enqueue({ t: 'addWish', code, name: nameOf(code) });
	toast(`${nameOf(code)} steht auf der Wunschliste`);
}
export function removeWish(code: string) {
	atlas.data = { ...atlas.data, wishlist: atlas.data.wishlist.filter((w) => w.code !== code) };
	persist();
	enqueue({ t: 'removeWish', code });
	toast(`${nameOf(code)} von der Wunschliste entfernt`);
}

/* ---------- Einstellungen ---------- */
export function setHomeContinent(c: ContinentCode) {
	if (!isContinent(c) || atlas.settings.homeContinent === c) return;
	atlas.settings = { ...atlas.settings, homeContinent: c };
	if (uid) writeJson(settingsKey(uid), atlas.settings);
	enqueue({ t: 'settings', s: { ...atlas.settings } });
}

export function setCountryScope(scope: CountryScope) {
	if (!isScope(scope) || atlas.settings.countryScope === scope) return;
	atlas.settings = { ...atlas.settings, countryScope: scope };
	if (uid) writeJson(settingsKey(uid), atlas.settings);
	enqueue({ t: 'settings', s: { ...atlas.settings } });
}

/** Weltwunder als gesehen eintragen bzw. wieder entfernen */
export function setWonder(id: string, on: boolean) {
	const has = atlas.settings.wonders.includes(id);
	if (!isWonder(id) || has === on) return;
	atlas.settings = { ...atlas.settings, wonders: on ? [...atlas.settings.wonders, id] : atlas.settings.wonders.filter((w) => w !== id) };
	if (uid) writeJson(settingsKey(uid), atlas.settings);
	enqueue({ t: 'settings', s: { ...atlas.settings } });
}

/** Hauptstadt eines Landes als besucht eintragen bzw. wieder entfernen */
export function setCapital(code: string, on: boolean) {
	const has = atlas.settings.capitals.includes(code);
	if (has === on) return;
	atlas.settings = { ...atlas.settings, capitals: on ? [...atlas.settings.capitals, code] : atlas.settings.capitals.filter((c) => c !== code) };
	if (uid) writeJson(settingsKey(uid), atlas.settings);
	enqueue({ t: 'settings', s: { ...atlas.settings } });
}

/** Alle Daten des Kontos zurücksetzen (Länder, Wunschliste, Meilensteine, Stempel-Lose, Weltwunder); Konto, Startregion und Länderliste bleiben.
    Nur für Tests. Stempel-Lose und „Pass gesehen“ löschen die Aufrufer (eigene Module). */
export function resetAccountData() {
	const d = emptyAtlas();
	atlas.data = d;
	atlas.settings = { ...atlas.settings, wonders: [], capitals: [] };
	atlas.lastAddedAt = 0;
	atlas.lastAddedCodes = [];
	const flightIds = atlas.flights.map((f) => f.id);
	atlas.flights = [];
	if (uid) {
		writeJson(settingsKey(uid), atlas.settings);
		writeJson(flightsKey(uid), []);
	}
	persist();
	enqueue({ t: 'replaceAll', data: d }, { t: 'settings', s: { ...atlas.settings } }, ...(flightIds.length ? [{ t: 'removeFlights', ids: flightIds } as Op] : []));
}

/* ---------- Flüge ---------- */
/** Flüge einlesen (z. B. aus Flighty): gleiche Kennung = aktualisieren, sonst neu. Bekommt ein Flug erst jetzt eine Flighty-ID,
    ersetzt er den bisherigen Eintrag ohne ID (gleiches Datum, Strecke, Abflug) statt doppelt zu zählen.
    Gibt zurück, wie viele neu sind und wie viele sich geändert haben. */
export function putFlights(list: Flight[]): { fresh: number; changed: number } {
	const byId = new Map(atlas.flights.map((f) => [f.id, f]));
	// bisherige Einträge ohne Flighty-ID je Datum/Strecke/Abflug; mehrere möglich (z. B. gleiche Strecke, ohne Uhrzeit nachgetragen)
	const noId = new Map<string, string[]>();
	// zusätzlich nur Datum + Strecke: von Hand eingetragene Flüge haben oft keine oder eine andere Uhrzeit als Flighty
	const loose = new Map<string, string[]>();
	const looseKey = (f: Flight) => `${f.date}|${f.from}|${f.to}`;
	for (const f of atlas.flights)
		if (!hasFlightyId(f)) {
			noId.set(flightMatch(f), [...(noId.get(flightMatch(f)) ?? []), f.id]);
			loose.set(looseKey(f), [...(loose.get(looseKey(f)) ?? []), f.id]);
		}
	const takeFrom = (m: Map<string, string[]>, k: string) => {
		const list = m.get(k) ?? [];
		while (list.length) {
			const prevId = list.shift()!;
			if (byId.has(prevId)) return prevId; // noch nicht von einem anderen Flug übernommen
		}
		return undefined;
	};
	let fresh = 0;
	const changed: Flight[] = [],
		gone: string[] = [];
	for (const f of list) {
		let old = byId.get(f.id);
		if (!old && hasFlightyId(f)) {
			const prevId = takeFrom(noId, flightMatch(f)) ?? takeFrom(loose, looseKey(f));
			if (prevId) {
				old = byId.get(prevId);
				byId.delete(prevId);
				gone.push(prevId);
			}
		}
		if (!old) fresh++;
		if (!old || flightSig(old) !== flightSig(f)) changed.push(f);
		byId.set(f.id, f);
	}
	if (!changed.length) return { fresh: 0, changed: 0 };
	atlas.flights = [...byId.values()];
	if (uid) writeJson(flightsKey(uid), atlas.flights);
	enqueue(...(gone.length ? [{ t: 'removeFlights', ids: gone } as Op] : []), { t: 'putFlights', flights: changed });
	return { fresh, changed: changed.length };
}
export function removeFlights(ids: string[]) {
	const del = new Set(ids);
	if (!atlas.flights.some((f) => del.has(f.id))) return;
	atlas.flights = atlas.flights.filter((f) => !del.has(f.id));
	if (uid) writeJson(flightsKey(uid), atlas.flights);
	enqueue({ t: 'removeFlights', ids });
}

/* ---------- Export / Import ---------- */
export function exportJson() {
	const a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([JSON.stringify(atlas.data, null, 2)], { type: 'application/json' }));
	a.download = 'freiheit-laender.json';
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
export async function importJson(file: File) {
	try {
		const d = normalize(JSON.parse(await file.text()));
		if (!d) throw new Error('format');
		d.countries = d.countries.map((c, i) => ({ ...c, position: i }));
		atlas.data = d;
		persist();
		enqueue({ t: 'replaceAll', data: d });
		toast(`${d.countries.length} Länder importiert`);
	} catch {
		toast('Datei nicht lesbar. Erwartet wird ein Export aus dieser App.');
	}
}
