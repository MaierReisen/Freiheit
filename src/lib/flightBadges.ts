import { evalDefs, num, type Badge, type BadgeDetail, type Def, type DetailItem } from './badges';
import { CONT, CONT_NAMES, nameOf, type ContinentCode } from './countries';
import { EARTH_KM, MOON_KM, fmtDuration, fmtInt, type Airlines, type Airports, type FlightStats, type Leg } from './flights';

/* Flug-Abzeichen (Gruppe „Flüge“ in der Abzeichen-Übersicht des Passes): aus der Flug-Statistik (flightStats),
   gezählt werden nur geflogene Flüge – gleiche Regeln wie im Tab „Flüge“ (wie Flighty). */

export interface FlightCtx {
	st: FlightStats;
	ap: Airports;
	al: Airlines | null;
}

const done = (x: FlightCtx) => x.st.legs.filter((l) => l.done);
const city = (x: FlightCtx, c: string) => x.ap[c]?.[0] || c;
const legItem = (x: FlightCtx, l: Leg, icon: string, sub?: string): DetailItem => ({
	icon,
	label: `${city(x, l.f.from)} → ${city(x, l.to)}`,
	sub: sub ?? `${l.f.date.split('-').reverse().join('.')} · ${fmtInt(l.km)} km`
});
const NO_FLIGHTS = 'Füge Flüge hinzu (Tab „Flüge“ → „+ Flug“ oder Import aus Flighty) – dann zählen sie mit.';
/** Liste von Flügen, die etwas erfüllen (neueste zuerst) */
const legList =
	(test: (x: FlightCtx, l: Leg) => boolean, icon: string, haveT: string, hint: string) =>
	(x: FlightCtx): BadgeDetail => {
		const have = done(x).filter((l) => test(x, l));
		return { haveT, have: have.slice(0, 50).map((l) => legItem(x, l, icon)), missT: '', miss: [], note: have.length ? undefined : hint };
	};
/** Je Jahr: Anzahl, Strecke oder Flugzeit */
const perYear = (x: FlightCtx) => {
	const m = new Map<number, Leg[]>();
	for (const l of done(x)) {
		const y = +l.f.date.slice(0, 4);
		m.set(y, [...(m.get(y) ?? []), l]);
	}
	return [...m].sort((a, b) => b[0] - a[0]);
};
const yearList =
	(sub: (ls: Leg[]) => string, haveT = 'Je Jahr') =>
	(x: FlightCtx): BadgeDetail => ({
		haveT,
		have: perYear(x).map(([y, ls]): DetailItem => ({ icon: '📅', label: String(y), sub: sub(ls) })),
		missT: '',
		miss: [],
		note: done(x).length ? undefined : NO_FLIGHTS
	});
const flightsN = (n: number) => (n === 1 ? '1 Flug' : `${n} Flüge`);
const hour = (l: Leg) => {
	const t = l.f.d.gds || l.f.d.ofs || l.f.d.gda || l.f.d.ofa;
	return t ? +t.slice(11, 13) : NaN;
};
/** Nachtflug: Abflug zwischen 22 und 5 Uhr Ortszeit */
const night = (_: FlightCtx, l: Leg) => hour(l) >= 22 || hour(l) < 5;
const lat = (x: FlightCtx, c: string) => x.ap[c]?.[3];
const lon = (x: FlightCtx, c: string) => x.ap[c]?.[4];
const equator = (x: FlightCtx, l: Leg) => {
	const a = lat(x, l.f.from),
		b = lat(x, l.to);
	return a !== undefined && b !== undefined && Math.sign(a) !== Math.sign(b);
};
// Großkreis kreuzt den 180. Längengrad, wenn der kürzere Weg über ihn führt (Längen-Unterschied über 180°)
const dateline = (x: FlightCtx, l: Leg) => {
	const a = lon(x, l.f.from),
		b = lon(x, l.to);
	return a !== undefined && b !== undefined && Math.abs(a - b) > 180;
};
const contOf = (x: FlightCtx, c: string) => CONT[x.ap[c]?.[2] ?? ''] as ContinentCode | undefined;
const CONT_ICON: Record<ContinentCode, string> = { EU: '🏰', AS: '🐉', AF: '🦁', NA: '🗽', SA: '🦙', OC: '🌺', AN: '🐧' };
const kmFmt = (v: number) => num(Math.round(v)) + ' km';

const LIST: Def<FlightCtx>[] = [
	{
		id: 'fN',
		group: 'flug',
		name: 'Vielflieger',
		icon: '✈️',
		what: 'Flüge',
		tiers: [10, 50, 150],
		val: (x) => x.st.n,
		detail: yearList((ls) => flightsN(ls.length), 'Flüge je Jahr')
	},
	{
		id: 'fKm',
		group: 'flug',
		name: 'Bis zum Mond',
		icon: '🌙',
		what: 'geflogen',
		tiers: [EARTH_KM, MOON_KM / 2, MOON_KM],
		val: (x) => Math.round(x.st.km),
		fmt: kmFmt,
		detail: (x) => ({
			...yearList((ls) => kmFmt(ls.reduce((s, l) => s + l.km, 0)), 'Strecke je Jahr')(x),
			note: `Bronze = einmal um die Erde (${fmtInt(EARTH_KM)} km), Silber = halbe Strecke zum Mond, Gold = bis zum Mond (${fmtInt(MOON_KM)} km).`
		})
	},
	{
		id: 'fMin',
		group: 'flug',
		name: 'Über den Wolken',
		icon: '☁️',
		what: 'Stunden in der Luft',
		tiers: [24, 168, 500],
		val: (x) => Math.floor(x.st.min / 60),
		detail: yearList((ls) => fmtDuration(ls.reduce((s, l) => s + l.min, 0)), 'Flugzeit je Jahr')
	},
	{
		id: 'fYear',
		group: 'flug',
		name: 'Flugjahr',
		icon: '🗓️',
		what: 'Flüge in einem Jahr',
		tiers: [10, 30, 60],
		val: (x) => Math.max(0, ...perYear(x).map(([, ls]) => ls.length)),
		detail: yearList((ls) => flightsN(ls.length), 'Flüge je Jahr')
	},
	{
		id: 'fAp',
		group: 'flug',
		name: 'Flughafen-Sammler',
		icon: '🛫',
		what: 'Flughäfen',
		tiers: [10, 30, 75],
		val: (x) => x.st.airports.length,
		detail: (x) => ({
			haveT: 'Besuchte Flughäfen',
			have: x.st.airports.map((a): DetailItem => ({ icon: '📍', label: `${city(x, a.code)} (${a.code})`, sub: `${a.n === 1 ? '1 Besuch' : a.n + ' Besuche'} · ${nameOf(x.ap[a.code]?.[2] ?? '')}` })),
			missT: '',
			miss: [],
			note: x.st.n ? undefined : NO_FLIGHTS
		})
	},
	{
		id: 'fAl',
		group: 'flug',
		name: 'Airline-Sammler',
		icon: '🎫',
		what: 'Airlines',
		tiers: [5, 15, 30],
		val: (x) => x.st.airlines.length,
		detail: (x) => ({
			haveT: 'Geflogene Airlines',
			have: x.st.airlines.map((a): DetailItem => ({ icon: '🎫', label: x.al?.[a.code]?.[0] ?? a.code, sub: `${a.n}× geflogen` })),
			missT: '',
			miss: [],
			note: x.st.n ? (x.st.airlines.length ? undefined : 'Airlines zählen, wenn beim Flug eine Flugnummer eingetragen ist (z. B. „LH 400“).') : NO_FLIGHTS
		})
	},
	{
		id: 'fCont',
		group: 'flug',
		name: 'Kontinent-Hopper',
		icon: '🌐',
		what: 'Kontinente angeflogen',
		tiers: [2, 4, 6],
		val: (x) => new Set(x.st.airports.map((a) => contOf(x, a.code)).filter(Boolean)).size,
		detail: (x) => {
			const by = new Map<ContinentCode, string[]>();
			for (const a of x.st.airports) {
				const k = contOf(x, a.code);
				if (k) by.set(k, [...(by.get(k) ?? []), a.code]);
			}
			const ks = (Object.keys(CONT_NAMES) as ContinentCode[]).filter((k) => k !== 'AN');
			const it = (k: ContinentCode, sub?: string): DetailItem => ({ icon: CONT_ICON[k], label: CONT_NAMES[k], sub });
			return {
				haveT: 'Angeflogen',
				have: ks.filter((k) => by.has(k)).map((k) => it(k, by.get(k)!.join(', '))),
				missT: 'Fehlt noch',
				miss: ks.filter((k) => !by.has(k)).map((k) => it(k))
			};
		}
	},
	{
		id: 'fLong',
		group: 'flug',
		name: 'Langstrecke',
		icon: '🦘',
		what: 'längster Flug',
		tiers: [4000, 8000, 12000],
		val: (x) => Math.round(x.st.longest?.km ?? 0),
		fmt: kmFmt,
		detail: (x) => {
			const ls = done(x)
				.filter((l) => l.km > 0)
				.sort((a, b) => b.km - a.km)
				.slice(0, 10);
			return { haveT: 'Deine längsten Flüge', have: ls.map((l) => legItem(x, l, '📏', `${fmtInt(l.km)} km · ${fmtDuration(l.min)}`)), missT: '', miss: [], note: ls.length ? undefined : NO_FLIGHTS };
		}
	},
	{
		id: 'fEq',
		group: 'flug',
		name: 'Über den Äquator',
		icon: '🌞',
		what: 'Flüge über den Äquator',
		tiers: [1, 5, 15],
		val: (x) => done(x).filter((l) => equator(x, l)).length,
		detail: legList(equator, '🌞', 'Flüge über den Äquator', 'Zählt, wenn ein Flug von der Nord- auf die Südhalbkugel geht oder umgekehrt.')
	},
	{
		id: 'fDl',
		group: 'flug',
		name: 'Datumsgrenze',
		icon: '🌅',
		what: 'Flüge über die Datumsgrenze',
		tiers: [1, 3, 10],
		val: (x) => done(x).filter((l) => dateline(x, l)).length,
		detail: legList(dateline, '🌅', 'Flüge über die Datumsgrenze', 'Zählt, wenn ein Flug über den Pazifik den 180. Längengrad kreuzt, z. B. Asien ⇄ Amerika.')
	},
	{
		id: 'fNight',
		group: 'flug',
		name: 'Nachteule',
		icon: '🦉',
		what: 'Nachtflüge (Abflug 22–5 Uhr)',
		tiers: [1, 10, 25],
		val: (x) => done(x).filter((l) => night(x, l)).length,
		detail: legList(night, '🦉', 'Nachtflüge', 'Zählt, wenn der Abflug zwischen 22 und 5 Uhr Ortszeit liegt (dafür die Abflugzeit beim Flug eintragen).')
	},
	{
		id: 'fRoute',
		group: 'flug',
		name: 'Stammstrecke',
		icon: '🔁',
		what: 'Flüge auf derselben Strecke',
		tiers: [3, 5, 10],
		val: (x) => x.st.routes[0]?.n ?? 0,
		detail: (x) => ({
			haveT: 'Häufigste Strecken',
			have: x.st.routes
				.filter((r) => r.n > 1)
				.slice(0, 15)
				.map((r): DetailItem => {
					const [a, b] = r.code.split('-');
					return { icon: '🔁', label: `${city(x, a)} ⇄ ${city(x, b)}`, sub: `${r.code.replace('-', ' ⇄ ')} · ${r.n}× geflogen` };
				}),
			missT: '',
			miss: [],
			note: x.st.routes.some((r) => r.n > 1) ? 'Hin- und Rückflug zählen als dieselbe Strecke.' : 'Zählt, wenn du dieselbe Strecke mehrmals fliegst (Hin und Rück zählen beide).'
		})
	}
];
const DEFS = LIST.map((d) => ({ ...d, tiers: [...new Set(d.tiers)] }));

/** Flug-Abzeichen mit Stand (ohne Flug-Daten: leer) */
export const flightBadges = (x: FlightCtx | null): Badge[] => (x ? evalDefs(DEFS, x) : []);
