import continents from './data/continents.json';

export type ContinentCode = 'EU' | 'AS' | 'AF' | 'NA' | 'SA' | 'OC' | 'AN';

export const CONT = continents.byCountry as Record<string, ContinentCode>;
export const CONT_NAMES = continents.names as Record<ContinentCode, string>;
/** Kartenausschnitt je Kontinent (Mittelpunkt lon/lat und Zoomstufe) */
export const CONT_VIEW = continents.views as Partial<Record<ContinentCode, { c: [number, number]; k: number }>>;

const dn = (() => {
	try {
		return new Intl.DisplayNames(['de'], { type: 'region' });
	} catch {
		return null;
	}
})();

export const nameOf = (c: string): string => {
	if (c === 'XK') return 'Kosovo';
	try {
		return (dn ? dn.of(c) : c) ?? c;
	} catch {
		return c;
	}
};

export const flag = (c: string): string =>
	/^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map((ch) => 127397 + ch.charCodeAt(0))) : '🏳️';

export const contOf = (c: string): string => CONT_NAMES[CONT[c]] || '';
