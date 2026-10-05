import { CONT_VIEW, nameOf, type ContinentCode } from './countries';
import { toast } from './app.svelte';
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
}
export const defaultSettings = (): Settings => ({ homeContinent: 'EU' });
const isContinent = (c: unknown): c is ContinentCode => typeof c === 'string' && c in CONT_VIEW;

type Op =
	| { t: 'addCountry'; code: string; name: string; position: number }
	| { t: 'removeCountry'; code: string }
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
			return { ...c, code, name: (c.name as string) || nameOf(code), visits: Array.isArray(c.visits) ? c.visits : [] };
		});
	const wishlist = (Array.isArray(rest.wishlist) ? rest.wishlist : [])
		.filter((w): w is Raw => !!w && typeof (w as Raw).code === 'string')
		.map((w) => {
			const code = (w.code as string).toUpperCase();
			return { ...w, code, name: (w.name as string) || nameOf(code) };
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

export const atlas = $state<{ data: AtlasData; sync: SyncStatus; settings: Settings }>({
	data: emptyAtlas(),
	sync: 'idle',
	settings: defaultSettings()
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
export const wishSet = () => new Set(atlas.data.wishlist.map((c) => c.code));

/* ---------- Supabase ---------- */
async function runOp(op: Op, user: string) {
	const ok = <T extends { error: unknown }>(r: T) => {
		if (r.error) throw r.error;
	};
	switch (op.t) {
		case 'addCountry':
			ok(await supabase.from('visited_countries').upsert({ user_id: user, code: op.code, name: op.name, position: op.position }));
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
			const r = await supabase
				.from('user_settings')
				.upsert({ user_id: user, home_continent: op.s.homeContinent, updated_at: new Date().toISOString() });
			// Tabelle noch nicht angelegt (Migration fehlt): Einstellung bleibt lokal, Warteschlange nicht blockieren
			if (r.error && r.error.code !== 'PGRST205') throw r.error;
			return;
		}
		case 'replaceAll': {
			const d = op.data;
			for (const t of ['visited_countries', 'wishlist', 'milestones']) ok(await supabase.from(t).delete().eq('user_id', user));
			if (d.countries.length)
				ok(await supabase.from('visited_countries').insert(d.countries.map((c, i) => ({ user_id: user, code: c.code, name: c.name, position: i }))));
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
	const [c, w, m, st] = await Promise.all([
		supabase.from('visited_countries').select('code,name,position,created_at').order('position').order('created_at'),
		supabase.from('wishlist').select('code,name').order('created_at'),
		supabase.from('milestones').select('year,count').order('year'),
		supabase.from('user_settings').select('home_continent').maybeSingle()
	]);
	if (!st.error && st.data && uid === user && !queue.some((o) => o.t === 'settings')) {
		atlas.settings = { ...atlas.settings, homeContinent: isContinent(st.data.home_continent) ? st.data.home_continent : 'EU' };
		writeJson(settingsKey(user), atlas.settings);
	}
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
	atlas.data = {
		schemaVersion: 1,
		countries: c.data.map((r) => ({ code: r.code, name: r.name || nameOf(r.code), visits: [], position: r.position })),
		wishlist: w.data.map((r) => ({ code: r.code, name: r.name || nameOf(r.code) })),
		milestones: m.data.map((r) => ({ year: r.year, count: r.count }))
	};
	persist();
}

/** Zwischengespeicherte Daten und Einstellungen eines Kontos sofort laden (synchron, vor dem ersten Zeichnen) */
export function loadCache(userId: string) {
	if (uid === userId) return;
	uid = userId;
	atlas.data = normalize(readJson(cacheKey(userId))) ?? emptyAtlas();
	const st = readJson(settingsKey(userId)) as Partial<Settings> | null;
	atlas.settings = { ...defaultSettings(), ...(st && isContinent(st.homeContinent) ? { homeContinent: st.homeContinent } : {}) };
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
		if (document.visibilityState === 'visible' && uid) pull();
	});
}

/* ---------- Änderungen ---------- */
export function addCountry(code: string) {
	const s = atlas.data;
	if (s.countries.some((c) => c.code === code)) return;
	const wasWish = s.wishlist.some((w) => w.code === code);
	const position = Math.max(-1, ...s.countries.map((c, i) => c.position ?? i)) + 1;
	atlas.data = {
		...s,
		countries: [...s.countries, { code, name: nameOf(code), visits: [], position }],
		wishlist: s.wishlist.filter((w) => w.code !== code)
	};
	persist();
	enqueue({ t: 'addCountry', code, name: nameOf(code), position }, ...(wasWish ? [{ t: 'removeWish', code } as Op] : []));
	toast(`${nameOf(code)} hinzugefügt – Land Nr. ${atlas.data.countries.length}`);
}
export function removeCountry(code: string) {
	atlas.data = { ...atlas.data, countries: atlas.data.countries.filter((c) => c.code !== code) };
	persist();
	enqueue({ t: 'removeCountry', code });
	toast(`${nameOf(code)} entfernt`);
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
