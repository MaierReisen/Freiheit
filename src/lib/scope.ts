import { CONT, contOf, type ContinentCode } from './countries';

/* Was zählt als Land? Grundlage für Länderzahl, Fortschritt, Nummerierung und für das, was auf der Karte markierbar ist.
   Gebiete (z. B. Grönland, Puerto Rico) zählen in keiner Liste: man kann sie trotzdem als bereist markieren und sie bekommen einen
   Stempel im Pass (ohne Nr.), gehen aber nicht in Länderzahl, Rang, Fortschritt und Abzeichen ein. */

export type CountryScope = 'un' | 'un_observer' | 'sovereign';

// 193 Mitgliedsstaaten der Vereinten Nationen (ISO 3166-1 Alpha-2)
const UN = new Set(
	('AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ ' +
		'EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ ' +
		'LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PT PW PY ' +
		'QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TZ UA UG US UY UZ VC VE VN VU WS YE ZA ZM ZW').split(' ')
);
const OBSERVERS = ['VA', 'PS']; // Beobachterstaaten: Vatikanstadt, Palästina
const DE_FACTO = ['XK', 'TW']; // Kosovo, Taiwan
const EXTRA = ['AQ']; // Antarktis: kein Staat, also ein Gebiet: zählt nie als Land, wird aber als Kontinent gewertet (sieben Kontinente)

const LISTS: Record<CountryScope, Set<string>> = {
	un: new Set([...UN]),
	un_observer: new Set([...UN, ...OBSERVERS]),
	sovereign: new Set([...UN, ...OBSERVERS, ...DE_FACTO])
};

export const DEFAULT_SCOPE: CountryScope = 'sovereign';
export const isScope = (s: unknown): s is CountryScope => typeof s === 'string' && s in LISTS;

export const SCOPES: { id: CountryScope; label: string; tag: string; desc: string }[] = [
	{ id: 'un', label: 'UN-Mitglieder', tag: 'UN', desc: 'Nur die Mitgliedsstaaten der Vereinten Nationen. Die Antarktis zählt nur für die Kontinente.' },
	{ id: 'un_observer', label: 'UN + Beobachter', tag: 'UN+2', desc: 'UN-Mitglieder plus die Beobachterstaaten Vatikanstadt und Palästina.' },
	{ id: 'sovereign', label: 'Alle Staaten', tag: 'UN+4', desc: 'Alle oben genannten sowie Kosovo und Taiwan. Gebiete wie Grönland zählen nie als Land.' }
];

export const inScope = (code: string, scope: CountryScope) => LISTS[scope].has(code);
export const scopeTotal = (scope: CountryScope) => LISTS[scope].size;
/** Zählt dieser Stempel für den Kontinent (Länder der Liste plus Antarktis)? Für die Länderzahl gilt nur inScope. */
export const countsForContinent = (code: string, scope: CountryScope) => LISTS[scope].has(code) || EXTRA.includes(code);
/** Länder der Liste plus Antarktis (Grundlage für Kontinente und Abzeichen) */
export const contCodes = (scope: CountryScope): ReadonlySet<string> => new Set([...LISTS[scope], ...EXTRA]);
export function scopeTotalIn(scope: CountryScope, cont: ContinentCode) {
	let n = 0;
	for (const c of contCodes(scope)) if (CONT[c] === cont) n++;
	return n;
}
/* Gebiete: zählen in keiner Liste, bekommen aber einen Stempel. Überall gleich beschriftet: „Gebiet · Dänemark“
   (statt Kontinent), auf dem Stempel „Gebiet“ statt „Nr.“. Westsahara ist umstritten und steht ohne Staat da. */
const DK = 'Dänemark', GB = 'Großbritannien', US = 'USA', FR = 'Frankreich', NL = 'Niederlande', NZ = 'Neuseeland', AU = 'Australien', NO = 'Norwegen';
const PARENT: Record<string, string> = {
	GL: DK, FO: DK, AX: 'Finnland', HK: 'China', MO: 'China', SJ: NO, BV: NO,
	AI: GB, BM: GB, FK: GB, GG: GB, GI: GB, GS: GB, IM: GB, IO: GB, JE: GB, KY: GB, MS: GB, PN: GB, SH: GB, TC: GB, VG: GB,
	AS: US, GU: US, MP: US, PR: US, UM: US, VI: US,
	BL: FR, GF: FR, GP: FR, MF: FR, MQ: FR, NC: FR, PF: FR, PM: FR, RE: FR, TF: FR, WF: FR, YT: FR,
	AW: NL, BQ: NL, CW: NL, SX: NL,
	CK: NZ, NU: NZ, TK: NZ,
	CC: AU, CX: AU, HM: AU, NF: AU
};
/** Gebiet = zählt in keiner Länderliste (z. B. Grönland, Hongkong) */
export const isTerritory = (code: string) => !LISTS.sovereign.has(code);
// (Antarktis steht in keiner Liste, ist also automatisch ein Gebiet)
/** Kurze Beschriftung eines Gebiets, z. B. „Gebiet · Dänemark“ */
export const areaLabel = (code: string) => (PARENT[code] ? `Gebiet · ${PARENT[code]}` : 'Gebiet');
/** Zweite Zeile unter einem Ländernamen (Auswahl, Liste, Länderseite): Kontinent, bei Gebieten „Gebiet · Dänemark“ */
export const placeLabel = (code: string) => (isTerritory(code) ? areaLabel(code) : contOf(code));
/** Ab welcher Liste ein Land zählt, für die Auswahl: „UN“, „UN+2“ (Beobachter), „UN+4“ (Kosovo, Taiwan); Gebiete und Antarktis leer */
export const listTag = (code: string) => (UN.has(code) ? 'UN' : OBSERVERS.includes(code) ? 'UN+2' : DE_FACTO.includes(code) ? 'UN+4' : '');
/** Alle Länder der Liste */
export const scopeCodes = (scope: CountryScope): ReadonlySet<string> => LISTS[scope];
