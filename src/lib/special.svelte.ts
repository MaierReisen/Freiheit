/* Spezialstempel: selten besuchte Länder können beim ersten Eintrag einen „Folienstempel“ bekommen.
   Ob ein Land besonders wird, wird einmal ausgelost und im Konto gemerkt (Spalte „special“, Migration 005),
   damit alle Geräte dasselbe zeigen. Zusätzlich lokal gemerkt (Stand vor Migration 005 bzw. ohne Verbindung). */
import { atlas, setSpecial } from './atlas.svelte';

/** Wenig besuchte Länder (Touristenzahlen ganz unten): Auslosung mit Chance CHANCE */
const RARE = 'TV NR KI MH FM PW SB VU TO ST KM CF TD SS ER DJ GW GQ BI SL LR MR NE ML BF AF TM TJ KG KP YE SY LY SO BT MM LA MN TL PG GN GM CG GA MW MZ AO ET SD IQ IR CU VE'.split(' ');
/** Die entlegensten Ziele: immer besonders */
const LEGEND = 'TV NR KI KP TM SO SS ER CF TD'.split(' ');
const CHANCE = 1 / 3;

const KEY = 'freiheit-pass-special';

function load(): Record<string, boolean> {
	try {
		const v = JSON.parse(localStorage.getItem(KEY) || '{}');
		return v && typeof v === 'object' ? v : {};
	} catch {
		return {};
	}
}

export const special = $state<{ map: Record<string, boolean> }>({ map: typeof window === 'undefined' ? {} : load() });

/** Vorschau: ?spezial in der Adresse macht alle Stempel zu Spezialstempeln, ?spezial=legende alle zu Legenden */
const preview = () => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('spezial'));

/** Los aus dem Konto, sonst das lokal gemerkte */
const drawn = (code: string): boolean | undefined => atlas.data.countries.find((c) => c.code === code)?.special ?? special.map[code];

export const isSpecial = (code: string) => preview() !== null || drawn(code) === true;

/** 0 = normal, 1 = seltene Briefmarke, 2 = Legende (goldener Rand) */
export const specialLevel = (code: string): 0 | 1 | 2 => (!isSpecial(code) ? 0 : LEGEND.includes(code) || preview() === 'legende' ? 2 : 1);

/** Lost für noch nicht ausgeloste Länder einmal aus; gibt die neu besonderen Codes zurück */
export function rollSpecials(codes: string[]): string[] {
	const won: string[] = [];
	let changed = false;
	for (const c of codes) {
		if (!RARE.includes(c)) continue;
		const remote = atlas.data.countries.find((x) => x.code === c)?.special;
		const known = remote ?? special.map[c];
		const yes = known ?? (LEGEND.includes(c) || Math.random() < CHANCE);
		// Konto noch ohne Los: dieses (auch ein früher nur lokal gemerktes) hochladen
		if (remote === undefined) setSpecial(c, yes);
		if (special.map[c] !== yes) {
			special.map[c] = yes;
			changed = true;
		}
		if (known === undefined && yes) won.push(c);
	}
	if (changed)
		try {
			localStorage.setItem(KEY, JSON.stringify(special.map));
		} catch {}
	return won;
}
