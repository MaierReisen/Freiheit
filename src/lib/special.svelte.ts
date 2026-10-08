/* Seltenheit der Stempel: jedes Land wird beim ersten Öffnen des Passes einmal ausgelost –
   Common (normaler Stempel), Rare (Briefmarke), Super Rare (Briefmarke mit Silberrand). Die entlegensten Ziele sind immer
   Legendary (Goldrand). Das Los wird im Konto gemerkt (Spalte „special“, Migration 006), damit alle Geräte dasselbe zeigen.
   Zusätzlich lokal gemerkt (ohne Spalte bzw. ohne Verbindung). */
import { atlas, setSpecial, type CountryEntry } from './atlas.svelte';

/** 0 = Common, 1 = Rare, 2 = Super Rare, 3 = Legendary */
export type Tier = 0 | 1 | 2 | 3;

/** Die entlegensten Ziele: immer Legendary */
export const LEGEND = 'TV NR KI KP TM SO SS ER CF TD MH FM SB KM AF YE SY LY GQ GW'.split(' ');
/** Chancen beim Auslosen (Rest = Common) */
export const CHANCE = { rare: 0.22, super: 0.08 };

const KEY = 'freiheit-pass-tier';
const OLD_KEY = 'freiheit-pass-special'; // bis v1.23: true = seltene Marke

/** Gespeicherter Wert → Stufe. Altes Los (true/false): bisherige Marke = Rare, sonst neu auslosen */
export const tierOf = (v: unknown): Tier | undefined =>
	v === true ? 1 : typeof v === 'number' && v >= 0 && v <= 2 ? (Math.round(v) as Tier) : undefined;

function load(): Record<string, Tier> {
	const out: Record<string, Tier> = {};
	try {
		const old = JSON.parse(localStorage.getItem(OLD_KEY) || '{}');
		const cur = JSON.parse(localStorage.getItem(KEY) || '{}');
		for (const v of [old, cur])
			if (v && typeof v === 'object')
				for (const [c, x] of Object.entries(v)) {
					const t = tierOf(x);
					if (t !== undefined) out[c] = t;
				}
	} catch {}
	return out;
}

export const special = $state<{ map: Record<string, Tier> }>({ map: typeof window === 'undefined' ? {} : load() });

/** Vorschau: ?spezial in der Adresse macht alle Stempel zu Rare, ?spezial=super zu Super Rare, ?spezial=legende zu Legendary */
const preview = (): Tier | null => {
	const p = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('spezial');
	return p === null ? null : p === 'legende' ? 3 : p === 'super' ? 2 : 1;
};

const entry = (code: string): CountryEntry | undefined => atlas.data.countries.find((c) => c.code === code);
/** Los aus dem Konto, sonst das lokal gemerkte */
const drawn = (code: string): Tier | undefined => tierOf(entry(code)?.special) ?? special.map[code];

export const specialLevel = (code: string): Tier => (LEGEND.includes(code) ? 3 : (preview() ?? drawn(code) ?? 0));

/** Lost für noch nicht ausgeloste Länder einmal aus */
export function rollSpecials(codes: string[]) {
	let changed = false;
	for (const c of codes) {
		if (LEGEND.includes(c)) continue;
		const remote = tierOf(entry(c)?.special);
		const t: Tier = remote ?? special.map[c] ?? roll();
		// Konto noch ohne Los: dieses (auch ein früher nur lokal gemerktes) hochladen
		if (remote === undefined) setSpecial(c, t);
		if (special.map[c] !== t) {
			special.map[c] = t;
			changed = true;
		}
	}
	if (changed)
		try {
			localStorage.setItem(KEY, JSON.stringify(special.map));
			localStorage.removeItem(OLD_KEY);
		} catch {}
}

function roll(): Tier {
	const r = Math.random();
	return r < CHANCE.super ? 2 : r < CHANCE.super + CHANCE.rare ? 1 : 0;
}
