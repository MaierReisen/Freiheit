import { nameOf } from './countries';
import { toast } from './app.svelte';

/** Ein Besuch in einem Land. Platz für Jahr, Städte, Kosten und Notizen (wird später ausgebaut). */
export type Visit = Record<string, unknown>;

export interface CountryEntry {
	code: string;
	name: string;
	visits: Visit[];
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

// Gleicher Schlüssel wie die bisherige Einzeldatei: vorhandene Daten auf dem Gerät bleiben erhalten
const LS_KEY = 'freiheit-state-v2';
// Reste der früheren GitHub-/Deal-Anbindung (u. a. der Zugriffstoken), werden beim Start entfernt
const LEGACY_KEYS = ['freiheit-gh', 'freiheit-dirty', 'freiheit-run'];

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

function load(): AtlasData {
	try {
		LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
	} catch {}
	try {
		const raw = localStorage.getItem(LS_KEY);
		const parsed = raw && JSON.parse(raw);
		const d = normalize(parsed);
		if (d) {
			if ('criteria' in parsed) localStorage.setItem(LS_KEY, JSON.stringify(d));
			return d;
		}
	} catch {}
	return emptyAtlas();
}

export const atlas = $state<{ data: AtlasData }>({ data: load() });

function persist() {
	try {
		localStorage.setItem(LS_KEY, JSON.stringify(atlas.data));
	} catch {}
}

export const visitedSet = () => new Set(atlas.data.countries.map((c) => c.code));
export const wishSet = () => new Set(atlas.data.wishlist.map((c) => c.code));

/* ---------- Änderungen ---------- */
export function addCountry(code: string) {
	const s = atlas.data;
	if (s.countries.some((c) => c.code === code)) return;
	atlas.data = { ...s, countries: [...s.countries, { code, name: nameOf(code), visits: [] }], wishlist: s.wishlist.filter((w) => w.code !== code) };
	persist();
	toast(`${nameOf(code)} hinzugefügt – Land Nr. ${atlas.data.countries.length}`);
}
export function removeCountry(code: string) {
	atlas.data = { ...atlas.data, countries: atlas.data.countries.filter((c) => c.code !== code) };
	persist();
	toast(`${nameOf(code)} entfernt`);
}
export function addWish(code: string) {
	const s = atlas.data;
	if (s.wishlist.some((w) => w.code === code) || s.countries.some((c) => c.code === code)) return;
	atlas.data = { ...s, wishlist: [...s.wishlist, { code, name: nameOf(code) }] };
	persist();
	toast(`${nameOf(code)} steht auf der Wunschliste`);
}
export function removeWish(code: string) {
	atlas.data = { ...atlas.data, wishlist: atlas.data.wishlist.filter((w) => w.code !== code) };
	persist();
	toast(`${nameOf(code)} von der Wunschliste entfernt`);
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
		atlas.data = d;
		persist();
		toast(`${d.countries.length} Länder importiert`);
	} catch {
		toast('Datei nicht lesbar. Erwartet wird ein Export aus dieser App.');
	}
}
