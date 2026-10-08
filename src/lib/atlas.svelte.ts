import { CONT_VIEW, nameOf, type ContinentCode } from './countries';
import { toast } from './app.svelte';
import { DEFAULT_SCOPE, inScope, isScope, type CountryScope } from './scope';
import { supabase } from './supabase';

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
	/** Seltene Briefmarke im Pass: einmal ausgelost (fehlt = noch nicht ausgelost) */
	special?: boolean;
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
}
export const defaultSettings = (): Settings => ({ homeContinent: 'EU', countryScope: DEFAULT_SCOPE });
const isContinent = (c: unknown): c is ContinentCode => typeof c === 'string' && c in CONT_VIEW;

type Op =
	| { t: 'addCountry'; code: string; name: string; position: number }
	| { t: 'removeCountry'; code: string }
	| { t: 'setEntered'; code: string; entered: string | null }
	| { t: 'setSpecial'; code: string; special: boolean }
	| { t: 'addWish'; code: string; name: string }
	| { t: 'removeWish'; code: string }
	| { t: 'replaceAll'; data: AtlasData }
	| { t: 'settings'; s: Settings };

// Daten der Version ohne Konto: werden beim ersten Login in das Konto übernommen
const LEGACY_KEY = 'freiheit-state-v2';
// Reste der früheren GitHub-/Deal-Anbindung (u. a. der Zugriffstoken), werden beim Start entfernt
const LEGACY_JUNK = ['freiheit-gh', 'freiheit-dirty', 'freiheit-run'];
const cacheKey = (uid: string) => `freiheit-data:${uid}`;
const queueKey = (uid: string) => `freiheit-queue:${uid}`;
const settingsKey = (uid: string) => `freiheit-settings:${uid}`;

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

export const atlas = $state<{ data: AtlasData; sync: SyncStatus; settings: Settings; lastAddedAt: number; lastAddedCode: string }>({
	data: emptyAtlas(),
	sync: 'idle',
	settings: defaultSettings(),
	/** Zeitpunkt, zu dem zuletzt selbst ein Land hinzugefügt wurde (für die Feier auf der Startseite) */
	lastAddedAt: 0,
	lastAddedCode: ''
});

let uid: string | null = null;
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
export const isEntered = (v: unknown): v is string => typeof v === 'string' && /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(v);
export const wishSet = () => new Set(atlas.data.wishlist.map((c) => c.code));

/* ---------- Supabase ---------- */
/** Fehler „Spalte gibt es nicht“ (Migration noch nicht ausgeführt) */
const noColumn = (e: { code?: string } | null | undefined) => e?.code === 'PGRST204' || e?.code === '42703';

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
			// Spalte noch nicht angelegt (Migration 005 fehlt): Los bleibt lokal
			if (r.error && !noColumn(r.error)) throw r.error;
			return;
		}
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
			const r = await supabase
				.from('user_settings')
				.upsert({ user_id: user, home_continent: op.s.homeContinent, country_scope: op.s.countryScope, updated_at: new Date().toISOString() });
			// Tabelle noch nicht angelegt (Migration fehlt): Einstellung bleibt lokal, Warteschlange nicht blockieren
			// bzw. Spalte fehlt (PGRST204): Einstellung bleibt lokal, Warteschlange nicht blockieren
			if (r.error && r.error.code !== 'PGRST205' && r.error.code !== 'PGRST204') throw r.error;
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
					special: typeof c.special === 'boolean' ? c.special : null
				}));
				let r = await supabase.from('visited_countries').insert(rows);
				// ohne Spalte „special“ (Migration 005 fehlt) bzw. „entered“ (004 fehlt) speichern
				if (r.error && noColumn(r.error)) r = await supabase.from('visited_countries').insert(rows.map(({ special: _s, ...x }) => x));
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
	const [c0, w, m, st] = await Promise.all([
		countriesQuery('code,name,position,created_at,entered,special'),
		supabase.from('wishlist').select('code,name').order('created_at'),
		supabase.from('milestones').select('year,count').order('year'),
		supabase.from('user_settings').select('*').maybeSingle()
	]);
	if (!st.error && st.data && uid === user && !queue.some((o) => o.t === 'settings')) {
		const next = {
			...atlas.settings,
			homeContinent: isContinent(st.data.home_continent) ? st.data.home_continent : 'EU',
			countryScope: isScope(st.data.country_scope) ? st.data.country_scope : atlas.settings.countryScope
		};
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
		data: { code: string; position: number; entered?: string | null; special?: boolean | null }[];
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
				...(typeof special === 'boolean' ? { special } : {})
			};
		}),
		wishlist: w.data.map((r) => ({ code: r.code, name: nameOf(r.code) })),
		milestones: m.data.map((r) => ({ year: r.year, count: r.count }))
	};
	// nur bei echten Änderungen ersetzen (z. B. von einem anderen Gerät): sonst kein Neuaufbau von Liste und Globus
	if (JSON.stringify(next) !== JSON.stringify(atlas.data)) atlas.data = next;
	persist();
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
		...(st && isScope(st.countryScope) ? { countryScope: st.countryScope } : {})
	};
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
	}
	uid = null;
	pulledFor = null;
	queue = [];
	clearTimeout(retryT);
	atlas.data = emptyAtlas();
	atlas.settings = defaultSettings();
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
	const s = atlas.data;
	if (s.countries.some((c) => c.code === code)) return;
	const wasWish = s.wishlist.some((w) => w.code === code);
	const position = Math.max(-1, ...s.countries.map((c, i) => c.position ?? i)) + 1;
	atlas.lastAddedCode = code;
	atlas.lastAddedAt = Date.now();
	atlas.data = {
		...s,
		countries: [...s.countries, { code, name: nameOf(code), visits: [], position }],
		wishlist: s.wishlist.filter((w) => w.code !== code)
	};
	persist();
	enqueue({ t: 'addCountry', code, name: nameOf(code), position }, ...(wasWish ? [{ t: 'removeWish', code } as Op] : []));
}
export function removeCountry(code: string) {
	atlas.data = { ...atlas.data, countries: atlas.data.countries.filter((c) => c.code !== code) };
	persist();
	enqueue({ t: 'removeCountry', code });
	toast(`${nameOf(code)} entfernt`);
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
/** Ausgelostes Los der seltenen Briefmarke merken (nur wenn noch keins da ist) */
export function setSpecial(code: string, special: boolean) {
	const s = atlas.data;
	if (!s.countries.some((c) => c.code === code && c.special === undefined)) return;
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
