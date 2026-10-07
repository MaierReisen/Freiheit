import { CONT, CONT_NAMES, type ContinentCode } from './countries';
import type { Facts } from './facts';
import { scopeCodes, scopeTotalIn, type CountryScope } from './scope';

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
}

export const TIER_NAMES = ['Bronze', 'Silber', 'Gold'];
/** Name der Stufe (Abzeichen mit nur einer Stufe sind gleich Gold) */
export const tierName = (b: { tiers: number[] }, level: number) => TIER_NAMES[level - 1 + 3 - b.tiers.length] ?? '';

const set = (s: string) => new Set(s.split(' '));
const ISLANDS = set(
	'AG AU BS BB BH CV KM CU CY DM DO FJ GD HT IS ID IE JM JP KI LK MG MV MT MH FM MU NR NZ PW PG PH KN LC VC WS ST SC SG SB TL TO TT TV GB VU TW BN'
);
const EQUATOR = set('EC CO BR GA CG CD UG KE SO ID KI MV ST');
const POLAR = set('NO SE FI IS RU CA US');
const MICRO = set('VA SM MC LI AD LU MT');
const count = (x: BadgeCtx, s: Set<string>) => x.codes.filter((c) => s.has(c)).length;
const distinct = (x: BadgeCtx, f: (fa: Facts) => string[] | undefined) => new Set(x.codes.flatMap((c) => f(x.facts[c] ?? {}) ?? [])).size;
const num = (v: number) => new Intl.NumberFormat('de-DE').format(v);

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

const CONT_BADGES: Record<Exclude<ContinentCode, 'AN'>, [string, string]> = {
	EU: ['Alter Kontinent', '🏰'],
	AS: ['Seidenstraße', '🐉'],
	AF: ['Safari-Seele', '🦁'],
	NA: ['Neue Welt', '🗽'],
	SA: ['Kondorflug', '🦙'],
	OC: ['Südsee', '🌺']
};

function defs(scope: CountryScope, facts: Record<string, Facts>): Def[] {
	const all = [...scopeCodes(scope)];
	const area = (c: string) => facts[c]?.area ?? 0;
	const giants = new Set([...all].filter((c) => c !== 'AQ').sort((a, b) => area(b) - area(a)).slice(0, 10));
	const eight = new Set(all.filter((c) => (facts[c]?.peak?.[1] ?? 0) >= 8000));
	const worldArea = all.reduce((s, c) => s + area(c), 0) || 1;
	const out: Def[] = [
		{ id: 'cont', name: 'Sieben Kontinente', icon: '🌐', what: 'Kontinente', tiers: [3, 5, 7], val: (x) => new Set(x.codes.map((c) => CONT[c]).filter(Boolean)).size },
		...(Object.keys(CONT_BADGES) as (keyof typeof CONT_BADGES)[]).map((k): Def => {
			const n = scopeTotalIn(scope, k);
			return {
				id: 'c' + k,
				name: CONT_BADGES[k][0],
				icon: CONT_BADGES[k][1],
				what: `Länder in ${CONT_NAMES[k]}`,
				tiers: [Math.ceil(n / 4), Math.ceil(n / 2), n],
				val: (x) => x.codes.filter((c) => CONT[c] === k).length
			};
		}),
		{ id: 'island', name: 'Inselhüpfer', icon: '🏝️', what: 'Inselstaaten', tiers: [3, 10, 25], val: (x) => count(x, ISLANDS) },
		{ id: 'landlocked', name: 'Landratte', icon: '🏕️', what: 'Länder ohne Meer', tiers: [3, 10, 25], val: (x) => x.codes.filter((c) => x.facts[c]?.land).length },
		{ id: 'left', name: 'Linksfahrer', icon: '🚗', what: 'Länder mit Linksverkehr', tiers: [3, 10, 25], val: (x) => x.codes.filter((c) => x.facts[c]?.drive === 'l').length },
		{ id: 'cur', name: 'Devisenjongleur', icon: '💱', what: 'Währungen', tiers: [5, 15, 40], val: (x) => distinct(x, (f) => f.cur?.map((c) => c.c)) },
		{ id: 'lang', name: 'Sprachenbabel', icon: '🗣️', what: 'Amtssprachen', tiers: [5, 15, 40], val: (x) => distinct(x, (f) => f.lang) },
		{ id: 'micro', name: 'Zwergstaaten', icon: '🏯', what: 'Zwergstaaten Europas', tiers: [3, 5, MICRO.size], val: (x) => count(x, MICRO) },
		{ id: 'giant', name: 'Giganten', icon: '🐘', what: 'der 10 größten Länder', tiers: [3, 6, 10], val: (x) => count(x, giants) },
		{ id: 'pop', name: 'Milliarden-Club', icon: '👥', what: 'Menschen leben dort', tiers: [1e9, 3e9, 5e9], val: (x) => x.codes.reduce((s, c) => s + (x.facts[c]?.pop ?? 0), 0), fmt: (v) => (v >= 1e9 ? (v / 1e9).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' Mrd.' : Math.round(v / 1e6) + ' Mio.') },
		{ id: 'area', name: 'Landnahme', icon: '📐', what: 'der Landfläche der Erde', tiers: [10, 25, 50], val: (x) => Math.floor((x.codes.reduce((s, c) => s + area(c), 0) / worldArea) * 100), fmt: (v) => v + ' %' },
		{ id: 'eq', name: 'Äquatortaufe', icon: '🌞', what: 'Land am Äquator', tiers: [1], val: (x) => count(x, EQUATOR) },
		{ id: 'polar', name: 'Polarkreis', icon: '🌌', what: 'Länder am Polarkreis', tiers: [1, 4, POLAR.size], val: (x) => count(x, POLAR) },
		{ id: 'ice', name: 'Ewiges Eis', icon: '🐧', what: 'Antarktis', tiers: [1], val: (x) => (x.codes.includes('AQ') ? 1 : 0) },
		{ id: 'k8', name: 'Dach der Welt', icon: '🏔️', what: 'Länder mit Achttausender', tiers: [1, eight.size], val: (x) => count(x, eight) },
		{
			id: 'quad',
			name: 'Vier Himmelsrichtungen',
			icon: '🧭',
			what: 'Erdviertel (Nord/Süd × Ost/West)',
			tiers: [4],
			val: (x) => new Set(x.codes.filter((c) => c !== 'AQ').map((c) => { const ll = x.facts[c]?.ll ?? [0, 0]; return (ll[0] >= 0 ? 'N' : 'S') + (ll[1] >= 0 ? 'O' : 'W'); })).size
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
			}
		},
		{ id: 'year', name: 'Rekordjahr', icon: '🚀', what: 'neue Länder in einem Jahr', tiers: [3, 5, 10], val: (x) => Math.max(0, ...perYear(x).values()) },
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
			}
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
			fmt
		};
	});
}

/** Gesamtzahl erreichter Stufen */
export const badgeLevels = (bs: Badge[]) => bs.reduce((s, b) => s + b.level, 0);
