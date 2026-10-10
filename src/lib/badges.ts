import { CONT, CONT_NAMES, compareNames, nameOf, type ContinentCode } from './countries';
import type { Facts } from './facts';
import { contCodes, scopeTotalIn, type CountryScope } from './scope';

/* Abzeichen (Visa-Seiten im Reisepass): Sonderauszeichnungen in bis zu drei Stufen (Bronze, Silber, Gold).
   Berechnet aus den bereisten Ländern, den Länderfakten (facts.json) und den Einreisedaten. */

export interface BadgeCtx {
	codes: string[];
	facts: Record<string, Facts>;
	/** Einreisedatum je Land ("JJJJ-MM" oder "JJJJ") */
	entered: Record<string, string | undefined>;
}
interface Def {
	id: string;
	name: string;
	icon: string;
	/** Was gezählt wird, z. B. „Inselstaaten“ */
	what: string;
	tiers: number[];
	val: (x: BadgeCtx) => number;
	fmt?: (v: number) => string;
	/** Was zählt schon, was fehlt noch (erst beim Aufklappen berechnet) */
	detail?: (x: BadgeCtx) => BadgeDetail;
}
/** Eintrag der Detail-Liste: Land (code) oder sonstiger Punkt (icon) */
export interface DetailItem {
	code?: string;
	icon?: string;
	label: string;
	sub?: string;
}
export interface BadgeDetail {
	haveT: string;
	have: DetailItem[];
	missT: string;
	miss: DetailItem[];
	/** weitere, nicht aufgeführte fehlende Punkte */
	missMore?: number;
	/** Hinweis statt/zu der Fehlt-Liste */
	note?: string;
}
export interface Badge {
	id: string;
	name: string;
	icon: string;
	what: string;
	tiers: number[];
	/** erreichte Stufe: 0 = noch keine, tiers.length = voll */
	level: number;
	v: number;
	/** Fortschritt bis zur nächsten Stufe 0..1 */
	p: number;
	/** „3 / 10“ bzw. erreichter Wert */
	prog: string;
	fmt: (v: number) => string;
	/** Fortschritt je Stufe 0..1 (für die Stufenleiste) */
	seg: number[];
	detail: () => BadgeDetail;
}

export const TIER_NAMES = ['Bronze', 'Silber', 'Gold'];
/** Name der Stufe (Abzeichen mit nur einer Stufe sind gleich Gold) */
export const tierName = (b: { tiers: number[] }, level: number) => TIER_NAMES[level - 1 + 3 - b.tiers.length] ?? '';

const set = (s: string) => new Set(s.split(' '));
const ISLANDS = set(
	'AG AU BS BB BH CV KM CU CY DM DO FJ GD HT IS ID IE JM JP KI LK MG MV MT MH FM MU NR NZ PW PG PH KN LC VC WS ST SC SG SB TL TO TT TV GB VU TW BN'
);
const EQUATOR = set('EC CO BR GA CG CD UG KE SO ID KI MV ST');
const POLAR = set('NO SE FI IS RU CA US AQ');
const MICRO = set('VA SM MC LI AD LU MT');
const count = (x: BadgeCtx, s: Set<string>) => x.codes.filter((c) => s.has(c)).length;
const distinct = (x: BadgeCtx, f: (fa: Facts) => string[] | undefined) => new Set(x.codes.flatMap((c) => f(x.facts[c] ?? {}) ?? [])).size;
const num = (v: number) => new Intl.NumberFormat('de-DE').format(v);
const popFmt = (v: number) => (v >= 1e9 ? (v / 1e9).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' Mrd.' : v >= 1e6 ? Math.round(v / 1e6) + ' Mio.' : num(Math.round(v / 1000)) + ' Tsd.');
const dn = (type: 'language' | 'currency') => {
	try {
		return new Intl.DisplayNames(['de'], { type });
	} catch {
		return null;
	}
};
const langDn = dn('language'),
	curDn = dn('currency');
const nm = (d: Intl.DisplayNames | null, c: string) => {
	try {
		return d?.of(c) || c;
	} catch {
		return c;
	}
};
const byName = (a: DetailItem, b: DetailItem) => compareNames(a.label, b.label);
const land = (c: string, sub?: string): DetailItem => ({ code: c, label: nameOf(c), sub });
/** Liste aus einer Länder-Menge: besuchte zählen, übrige fehlen */
const pool =
	(f: (x: BadgeCtx) => Iterable<string>, sub?: (c: string, x: BadgeCtx) => string | undefined) =>
	(x: BadgeCtx): BadgeDetail => {
		const v = new Set(x.codes),
			all = [...new Set(f(x))];
		return {
			haveT: 'Zählt schon',
			have: all.filter((c) => v.has(c)).map((c) => land(c, sub?.(c, x))).sort(byName),
			missT: 'Noch offen',
			miss: all.filter((c) => !v.has(c)).map((c) => land(c, sub?.(c, x))).sort(byName)
		};
	};
/** Abzeichen mit verschiedenen Dingen (Währungen, Sprachen): gesammelte Dinge + Länder, die etwas Neues bringen */
const collect =
	(all: string[], key: (fa: Facts) => string[] | undefined, name: (k: string) => string, unit: string) =>
	(x: BadgeCtx): BadgeDetail => {
		const got = new Map<string, string[]>();
		for (const c of x.codes) for (const k of key(x.facts[c] ?? {}) ?? []) got.set(k, [...(got.get(k) ?? []), nameOf(c)]);
		const v = new Set(x.codes);
		const miss = all.flatMap((c) => {
			if (v.has(c)) return [];
			const ks = [...new Set((key(x.facts[c] ?? {}) ?? []).filter((k) => !got.has(k)))];
			return ks.length ? [land(c, 'neu: ' + ks.map(name).join(', '))] : [];
		});
		return {
			haveT: unit + ' gesammelt',
			have: [...got].map(([k, cs]): DetailItem => ({ label: name(k), sub: cs.join(', ') })).sort(byName),
			missT: 'Bringen etwas Neues',
			miss: miss.sort(byName)
		};
	};
/** Rangliste nach Größe (Einwohner, Fläche): eigene Länder und die größten noch fehlenden */
const ranked =
	(all: string[], val: (c: string) => number, f: (v: number) => string) =>
	(x: BadgeCtx): BadgeDetail => {
		const v = new Set(x.codes),
			sorted = all.filter((c) => val(c) > 0).sort((a, b) => val(b) - val(a)),
			miss = sorted.filter((c) => !v.has(c));
		return {
			haveT: 'Zählt schon',
			have: x.codes.filter((c) => val(c) > 0).sort((a, b) => val(b) - val(a)).map((c) => land(c, f(val(c)))),
			missT: 'Die größten fehlenden',
			miss: miss.slice(0, 30).map((c) => land(c, f(val(c)))),
			missMore: Math.max(0, miss.length - 30)
		};
	};
const NO_DATE = 'Land antippen und das Datum der ersten Einreise eintragen – dann zählt es mit.';
const undated = (x: BadgeCtx) => x.codes.filter((c) => !+(x.entered[c] ?? '').slice(0, 4)).map((c) => land(c)).sort(byName);
const utc = (h: number) => 'UTC' + (h < 0 ? '−' : '+') + Math.floor(Math.abs(h)) + (Math.abs(h) % 1 ? ':' + String(Math.round((Math.abs(h) % 1) * 60)).padStart(2, '0') : '');

/* Zeitzonen-Versatz in Stunden (einmal je Zeitzone berechnet) */
const tzCache = new Map<string, number>();
function offsetH(tz: string) {
	let h = tzCache.get(tz);
	if (h === undefined) {
		try {
			const s = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date(2024, 0, 15)).find((p) => p.type === 'timeZoneName')?.value ?? '';
			const m = /([+-])(\d{2}):(\d{2})/.exec(s);
			h = m ? (m[1] === '-' ? -1 : 1) * (+m[2] + +m[3] / 60) : 0;
		} catch {
			h = 0;
		}
		tzCache.set(tz, h);
	}
	return h;
}

/** Neue Länder je Kalenderjahr (aus den Einreisedaten) */
function perYear(x: BadgeCtx) {
	const m = new Map<number, number>();
	for (const c of x.codes) {
		const y = +(x.entered[c] ?? '').slice(0, 4);
		if (y) m.set(y, (m.get(y) ?? 0) + 1);
	}
	return m;
}

const quadOf = (x: BadgeCtx, c: string) => {
	const ll = x.facts[c]?.ll ?? [0, 0];
	return (ll[0] >= 0 ? 'N' : 'S') + (ll[1] >= 0 ? 'O' : 'W');
};
const QUADS: Record<string, [string, string, string]> = {
	NO: ['🌏', 'Nordosten', 'z. B. Europa, Asien'],
	NW: ['🌎', 'Nordwesten', 'z. B. Nordamerika, Karibik, Westafrika'],
	SO: ['🌏', 'Südosten', 'z. B. Australien, Südafrika'],
	SW: ['🌎', 'Südwesten', 'z. B. Südamerika']
};
/** Länder je Jahr (aus den Einreisedaten); Länder ohne Datum zählen hier nicht */
function yearDetail(x: BadgeCtx): BadgeDetail {
	const by = new Map<number, string[]>();
	for (const c of x.codes) {
		const y = +(x.entered[c] ?? '').slice(0, 4);
		if (y) by.set(y, [...(by.get(y) ?? []), nameOf(c)]);
	}
	const miss = undated(x);
	return {
		haveT: 'Neue Länder je Jahr',
		have: [...by].sort((a, b) => b[0] - a[0]).map(([y, cs]): DetailItem => ({ icon: '📅', label: `${y}: ${cs.length === 1 ? '1 Land' : cs.length + ' Länder'}`, sub: cs.join(', ') })),
		missT: 'Ohne Einreisedatum',
		miss,
		note: miss.length ? NO_DATE : by.size ? undefined : 'Trage bei deinen Ländern das Datum der ersten Einreise ein.'
	};
}

export const CONT_BADGES: Record<Exclude<ContinentCode, 'AN'>, [string, string]> = {
	EU: ['Alter Kontinent', '🏰'],
	AS: ['Seidenstraße', '🐉'],
	AF: ['Safari-Seele', '🦁'],
	NA: ['Neue Welt', '🗽'],
	SA: ['Kondorflug', '🦙'],
	OC: ['Südsee', '🌺']
};

function defs(scope: CountryScope, facts: Record<string, Facts>): Def[] {
	const all = [...contCodes(scope)];
	const area = (c: string) => facts[c]?.area ?? 0;
	const giants = new Set([...all].filter((c) => c !== 'AQ').sort((a, b) => area(b) - area(a)).slice(0, 10));
	const eight = new Set(all.filter((c) => (facts[c]?.peak?.[1] ?? 0) >= 8000));
	const worldArea = all.reduce((s, c) => s + area(c), 0) || 1;
	const out: Def[] = [
		{ id: 'cont', name: 'Sieben Kontinente', icon: '🌐', what: 'Kontinente', tiers: [3, 5, 7], val: (x) => new Set(x.codes.map((c) => CONT[c]).filter(Boolean)).size,
			detail: (x) => {
				const n = new Map<ContinentCode, number>();
				for (const c of x.codes) if (CONT[c]) n.set(CONT[c], (n.get(CONT[c]) ?? 0) + 1);
				const it = (k: ContinentCode, sub?: string): DetailItem => ({ icon: k === 'AN' ? '🐧' : CONT_BADGES[k][1], label: CONT_NAMES[k], sub });
				const ks = Object.keys(CONT_NAMES) as ContinentCode[];
				return {
					haveT: 'Bereist',
					have: ks.filter((k) => n.has(k)).map((k) => it(k, n.get(k) === 1 ? '1 Land' : n.get(k) + ' Länder')),
					missT: 'Fehlt noch',
					miss: ks.filter((k) => !n.has(k)).map((k) => it(k))
				};
			} },
		...(Object.keys(CONT_BADGES) as (keyof typeof CONT_BADGES)[]).map((k): Def => {
			const n = scopeTotalIn(scope, k);
			return {
				id: 'c' + k,
				name: CONT_BADGES[k][0],
				icon: CONT_BADGES[k][1],
				what: `Länder in ${CONT_NAMES[k]}`,
				tiers: [Math.ceil(n / 4), Math.ceil(n / 2), n],
				val: (x) => x.codes.filter((c) => CONT[c] === k).length,
				detail: pool(() => all.filter((c) => CONT[c] === k))
			};
		}),
		{ id: 'island', name: 'Inselhüpfer', icon: '🏝️', what: 'Inselstaaten', tiers: [3, 10, 25], val: (x) => count(x, ISLANDS), detail: pool(() => all.filter((c) => ISLANDS.has(c))) },
		{ id: 'landlocked', name: 'Landratte', icon: '🏕️', what: 'Länder ohne Meer', tiers: [3, 10, 25], val: (x) => x.codes.filter((c) => x.facts[c]?.land).length, detail: pool((x) => all.filter((c) => x.facts[c]?.land)) },
		{ id: 'left', name: 'Linksfahrer', icon: '🚗', what: 'Länder mit Linksverkehr', tiers: [3, 10, 25], val: (x) => x.codes.filter((c) => x.facts[c]?.drive === 'l').length, detail: pool((x) => all.filter((c) => x.facts[c]?.drive === 'l')) },
		{ id: 'cur', name: 'Devisenjongleur', icon: '💱', what: 'Währungen', tiers: [5, 15, 40], val: (x) => distinct(x, (f) => f.cur?.map((c) => c.c)), detail: collect(all, (f) => f.cur?.map((c) => c.c), (k) => nm(curDn, k), 'Währungen') },
		{ id: 'lang', name: 'Sprachenbabel', icon: '🗣️', what: 'Amtssprachen', tiers: [5, 15, 40], val: (x) => distinct(x, (f) => f.lang), detail: collect(all, (f) => f.lang, (k) => nm(langDn, k), 'Sprachen') },
		{ id: 'micro', name: 'Zwergstaaten', icon: '🏯', what: 'Zwergstaaten Europas', tiers: [3, 5, MICRO.size], val: (x) => count(x, MICRO), detail: pool(() => MICRO) },
		{ id: 'giant', name: 'Giganten', icon: '🐘', what: 'der 10 größten Länder', tiers: [3, 6, 10], val: (x) => count(x, giants), detail: pool(() => [...giants].sort((a, b) => area(b) - area(a)), (c) => num(Math.round(area(c) / 1000) * 1000) + ' km²') },
		{ id: 'pop', name: 'Milliarden-Club', icon: '👥', what: 'Menschen leben dort', tiers: [1e9, 3e9, 5e9], val: (x) => x.codes.reduce((s, c) => s + (x.facts[c]?.pop ?? 0), 0), fmt: popFmt, detail: ranked(all, (c) => facts[c]?.pop ?? 0, popFmt) },
		{ id: 'area', name: 'Landnahme', icon: '📐', what: 'der Landfläche der Erde', tiers: [10, 25, 50], val: (x) => Math.floor((x.codes.reduce((s, c) => s + area(c), 0) / worldArea) * 100), fmt: (v) => v + ' %', detail: ranked(all, area, (a) => (a / worldArea * 100).toLocaleString('de-DE', { maximumFractionDigits: a / worldArea < 0.001 ? 2 : 1 }) + ' %') },
		{ id: 'eq', name: 'Äquatortaufe', icon: '🌞', what: 'Länder am Äquator', tiers: [1, 3, 6], val: (x) => count(x, EQUATOR), detail: pool(() => all.filter((c) => EQUATOR.has(c))) },
		{ id: 'polar', name: 'Polarkreise', icon: '🐧', what: 'Länder an den Polarkreisen (mit Antarktis)', tiers: [1, 4, POLAR.size], val: (x) => count(x, POLAR), detail: pool(() => POLAR) },
		{ id: 'k8', name: 'Dach der Welt', icon: '🏔️', what: 'Länder mit Achttausender', tiers: [1, 2, eight.size], val: (x) => count(x, eight), detail: pool(() => eight, (c, x) => x.facts[c]?.peak && `${x.facts[c].peak![0]} · ${num(x.facts[c].peak![1])} m`) },
		{
			id: 'quad',
			name: 'Vier Himmelsrichtungen',
			icon: '🧭',
			what: 'Erdviertel (Nord/Süd × Ost/West)',
			tiers: [2, 3, 4],
			val: (x) => new Set(x.codes.filter((c) => c !== 'AQ').map((c) => quadOf(x, c))).size,
			detail: (x) => {
				const by = new Map<string, string[]>();
				for (const c of x.codes) if (c !== 'AQ') by.set(quadOf(x, c), [...(by.get(quadOf(x, c)) ?? []), nameOf(c)]);
				const it = (q: string, sub?: string): DetailItem => ({ icon: QUADS[q][0], label: QUADS[q][1], sub });
				const qs = Object.keys(QUADS);
				return {
					haveT: 'Bereist',
					have: qs.filter((q) => by.has(q)).map((q) => it(q, by.get(q)!.join(', '))),
					missT: 'Fehlt noch',
					miss: qs.filter((q) => !by.has(q)).map((q) => it(q, QUADS[q][2]))
				};
			}
		},
		{
			id: 'tz',
			name: 'Zeitreisender',
			icon: '⏰',
			what: 'Stunden Zeitunterschied',
			tiers: [6, 12, 18],
			val: (x) => {
				const hs = x.codes.flatMap((c) => (x.facts[c]?.tz ? [offsetH(x.facts[c].tz!)] : []));
				return hs.length ? Math.floor(Math.max(...hs) - Math.min(...hs)) : 0;
			},
			detail: (x) => {
				const off = (c: string) => (x.facts[c]?.tz ? offsetH(x.facts[c].tz!) : null);
				const hs = x.codes.flatMap((c) => (off(c) === null ? [] : [off(c)!]));
				const lo = Math.min(...hs),
					hi = Math.max(...hs),
					v = new Set(x.codes);
				const gain = (c: string) => (hs.length ? Math.max(0, off(c)! - hi, lo - off(c)!) : 0);
				const miss = all.filter((c) => !v.has(c) && off(c) !== null && gain(c) >= 1).sort((a, b) => gain(b) - gain(a));
				return {
					haveT: 'Deine Zeitzonen',
					have: x.codes.filter((c) => off(c) !== null).sort((a, b) => off(a)! - off(b)!).map((c) => land(c, utc(off(c)!))),
					missT: 'Vergrößern den Abstand',
					miss: miss.slice(0, 30).map((c) => land(c, `${utc(off(c)!)} · +${Math.floor(gain(c))} Std.`)),
					missMore: Math.max(0, miss.length - 30)
				};
			}
		},
		{ id: 'year', name: 'Rekordjahr', icon: '🚀', what: 'neue Länder in einem Jahr', tiers: [3, 5, 10], val: (x) => Math.max(0, ...perYear(x).values()), detail: yearDetail },
		{
			id: 'streak',
			name: 'Jahr für Jahr',
			icon: '📅',
			what: 'Jahre in Folge ein neues Land',
			tiers: [3, 5, 10],
			val: (x) => {
				const ys = [...perYear(x).keys()].sort((a, b) => a - b);
				let best = 0,
					run = 0;
				ys.forEach((y, i) => {
					run = i && y === ys[i - 1] + 1 ? run + 1 : 1;
					best = Math.max(best, run);
				});
				return best;
			},
			detail: yearDetail
		}
	];
	return out.map((d) => ({ ...d, tiers: [...new Set(d.tiers.filter((t) => t > 0))] }));
}

const defCache = new Map<string, Def[]>();
/** Alle Abzeichen mit Stand (sortiert wie definiert) */
export function badges(ctx: BadgeCtx, scope: CountryScope): Badge[] {
	let ds = defCache.get(scope);
	if (!ds) defCache.set(scope, (ds = defs(scope, ctx.facts)));
	return ds.map((d) => {
		const v = d.val(ctx),
			fmt = d.fmt ?? num,
			level = d.tiers.filter((t) => v >= t).length,
			next = d.tiers[level],
			from = d.tiers[level - 1] ?? 0;
		return {
			id: d.id,
			name: d.name,
			icon: d.icon,
			what: d.what,
			tiers: d.tiers,
			level,
			v,
			p: next ? Math.max(0, Math.min(1, (v - from) / (next - from))) : 1,
			prog: next ? `${fmt(Math.min(v, next))} / ${fmt(next)}` : fmt(v),
			fmt,
			seg: d.tiers.map((t, i) => Math.max(0, Math.min(1, (v - (d.tiers[i - 1] ?? 0)) / (t - (d.tiers[i - 1] ?? 0))))),
			detail: () => d.detail?.(ctx) ?? { haveT: '', have: [], missT: '', miss: [] }
		};
	});
}

/** Gesamtzahl erreichter Stufen */
export const badgeLevels = (bs: Badge[]) => bs.reduce((s, b) => s + b.level, 0);
