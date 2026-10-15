import { isEntered, type CountryEntry } from './atlas.svelte';
import { CONT, type ContinentCode } from './countries';
import type { Flight } from './flights';

/* „Mein Reisejahr“: was in einem Jahr neu dazukam – Länder nach Einreisedatum (`entered`), Flüge nach Datum.
   Länder ohne Einreisedatum gehören keinem Jahr an (zählen für neue Kontinente als „schon früher da“). */

export const entryYear = (c: CountryEntry) => (isEntered(c.entered) ? +c.entered.slice(0, 4) : 0);

const today = () => new Date().toISOString().slice(0, 10);
/** Flüge, die in dem Jahr stattgefunden haben (nicht gestrichen, nicht in der Zukunft) */
export const flightsIn = (flights: Flight[], y: number) => {
	const t = today();
	return flights.filter((f) => !f.d.cx && f.date <= t && +f.date.slice(0, 4) === y);
};

/** Jahre mit neuen Ländern oder Flügen, neueste zuerst */
export function travelYears(countries: CountryEntry[], flights: Flight[]): number[] {
	const t = today();
	const s = new Set<number>();
	for (const c of countries) if (entryYear(c)) s.add(entryYear(c));
	for (const f of flights) if (!f.d.cx && f.date <= t) s.add(+f.date.slice(0, 4));
	return [...s].sort((a, b) => b - a);
}

/** Jahr, das die Seite zuerst zeigt: das laufende, wenn darin schon etwas war, sonst das neueste */
export const defaultYear = (years: number[]) => (years.includes(new Date().getFullYear()) ? new Date().getFullYear() : (years[0] ?? new Date().getFullYear()));

/** Kontinente, die im Jahr zum ersten Mal betreten wurden (kein Land des Kontinents früher oder ohne Datum) */
export function newContinents(all: CountryEntry[], y: number): ContinentCode[] {
	const before = new Set<ContinentCode>(),
		now = new Set<ContinentCode>();
	for (const c of all) {
		const k = CONT[c.code],
			e = entryYear(c);
		if (!k) continue;
		if (!e || e < y) before.add(k);
		else if (e === y) now.add(k);
	}
	return [...now].filter((k) => !before.has(k));
}
