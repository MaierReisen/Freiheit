import continents from './data/continents.json';
import names from './data/names.json';

export type ContinentCode = 'EU' | 'AS' | 'AF' | 'NA' | 'SA' | 'OC' | 'AN';

export const CONT = continents.byCountry as Record<string, ContinentCode>;
export const CONT_NAMES = continents.names as Record<ContinentCode, string>;
/** Kartenausschnitt je Kontinent (Mittelpunkt lon/lat und Zoomstufe) */
export const CONT_VIEW = continents.views as Partial<Record<ContinentCode, { c: [number, number]; k: number }>>;

/* Deutsche Ländernamen fest hinterlegt (aus den CLDR-Daten, einige angepasst: „Demokratische Republik Kongo“ statt
   „Kongo-Kinshasa“, „Hongkong“ statt „Sonderverwaltungsregion Hongkong“ …) – so heißen Länder in jedem Browser gleich */
const NAMES = names as Record<string, string>;
const dn = (() => {
	try {
		return new Intl.DisplayNames(['de'], { type: 'region' });
	} catch {
		return null;
	}
})();

export const nameOf = (c: string): string => {
	if (NAMES[c]) return NAMES[c];
	try {
		return (dn ? dn.of(c) : c) ?? c;
	} catch {
		return c;
	}
};

/** Sortierschlüssel für Namen, auf jedem Gerät gleich: Umlaute (ä ö ü å) sind eigene Buchstaben direkt nach a/o/u und
    werden nicht mit ihnen vermischt (Sudan, dann Südafrika), übrige Akzente und Satzzeichen zählen nicht, ß = ss */
const sortKey = (s: string) =>
	s
		.toLowerCase()
		.replace(/[äå]/g, 'a~')
		.replace(/ö/g, 'o~')
		.replace(/ü/g, 'u~')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/ß/g, 'ss')
		.replace(/-/g, ' ')
		.replace(/[^\p{L}\p{N} ~]/gu, '');
/** Alphabetisch vergleichen (für sort), unabhängig von den Sprachdaten des Geräts */
export const compareNames = (a: string, b: string): number => {
	const x = sortKey(a),
		y = sortKey(b);
	return x < y ? -1 : x > y ? 1 : a < b ? -1 : a > b ? 1 : 0;
};

export const flag = (c: string): string =>
	/^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map((ch) => 127397 + ch.charCodeAt(0))) : '🏳️';

export const contOf = (c: string): string => CONT_NAMES[CONT[c]] || '';
