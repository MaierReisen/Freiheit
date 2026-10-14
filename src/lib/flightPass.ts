import { nameOf } from './countries';
import { fmtDuration, fmtInt, routeKey, type Airlines, type Airports, type FlightStats, type Leg } from './flights';
import type { Rank } from './passport';
import { preview, tierOf01, type Tier } from './special.svelte';

/* Flugpass (Tab „Flüge“): Status nach Zahl der Flüge (wie eine Vielflieger-Karte, die Farbe der Karte steigt mit),
   Rekorde und Hilfen für die Bordkarten. Zahlen kommen aus flightStats (gleiche Regeln wie Flighty). */

export const FLIGHT_RANKS: Rank[] = [
	{ n: 1, name: 'Fluggast', icon: '🎫', say: 'Der erste Flug im Pass – willkommen an Bord.' },
	{ n: 10, name: 'Fensterplatz', icon: '🪟', say: 'Zehn Flüge: Die Welt von oben wird zur Gewohnheit.' },
	{ n: 25, name: 'Lounge-Gast', icon: '🛋️', say: 'Du kennst die Wege zum Gate inzwischen im Schlaf.' },
	{ n: 50, name: 'Meilensammler', icon: '🧭', say: 'Fünfzig Flüge – deine Bordkarten füllen eine ganze Mappe.' },
	{ n: 100, name: 'Kapitän', icon: '🧑‍✈️', say: 'Hundert Flüge. Viele Crews kennen dich schon vom Sehen.' },
	{ n: 200, name: 'Jetsetter', icon: '🛩️', say: 'Zweihundert Flüge – du lebst zwischen den Zeitzonen.' },
	{ n: 350, name: 'Überflieger', icon: '🚀', say: 'Mehr Starts und Landungen als manche Flugschüler.' },
	{ n: 500, name: 'Legende der Lüfte', icon: '👑', say: 'Fünfhundert Flüge. Der Himmel ist dein Zuhause.' }
];
/** Farbe der Karte je Rang: 0 = noch kein Flug, 1 Blau, 2 Silber, 3 Gold, 4 Platin, 5 Schwarz */
const CARD = [1, 1, 2, 2, 3, 3, 4, 5];
export const CARD_NAME = ['', 'Blau', 'Silber', 'Gold', 'Platin', 'Schwarz'];

/** Stand für Kachel und Pass: Rang, nächster Rang, Fortschritt 0..1 dazwischen, Kartenfarbe */
export function flightRankInfo(n: number) {
	const i = FLIGHT_RANKS.filter((r) => n >= r.n).length - 1;
	const rank = i >= 0 ? FLIGHT_RANKS[i] : null;
	const next = FLIGHT_RANKS[i + 1] ?? null;
	const from = rank?.n ?? 0;
	const p = next ? (n - from) / (next.n - from) : 1;
	return { i, rank, next, left: next ? next.n - n : 0, p: Math.max(0, Math.min(1, p)), card: i < 0 ? 0 : CARD[i] };
}

/** Kurz-, Mittel-, Langstrecke (Farbe der Bordkarte) */
export const haul = (km: number) => (km < 1500 ? 'kurz' : km < 4000 ? 'mittel' : 'lang');
export const HAUL_NAME = { kurz: 'Kurzstrecke', mittel: 'Mittelstrecke', lang: 'Langstrecke' };

/* Seltenheit der Bordkarten (eine Bordkarte je Strecke, Hin- und Rückflug zusammen): gleiche Stufen und Chancen wie die Stempel.
   Das Los ergibt sich fest aus Konto + Strecke – auf allen Geräten gleich, ohne Datenbank-Spalte, und Löschen + neu Eintragen
   lost nicht neu. Gezogen wird mit dem ersten geflogenen Flug der Strecke (geplante haben noch keine Stufe). */
function unit(s: string) {
	// cyrb53: gut verteilter 53-Bit-Wert → 0..1
	let h1 = 0xdeadbeef,
		h2 = 0x41c6ce57;
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i);
		h1 = Math.imul(h1 ^ c, 2654435761);
		h2 = Math.imul(h2 ^ c, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
	return (4294967296 * (2097151 & h2) + (h1 >>> 0)) / 2 ** 53;
}
export function ticketTier(user: string | null, key: string): Tier {
	// Vorschau wie bei den Stempeln: ?spezial (alle Rare), ?spezial=epic, ?spezial=legende
	return preview() ?? tierOf01(unit(`${user ?? ''}|bordkarte|${key}`));
}
export const TICKET_TIER = ['Common', 'Rare', 'Epic', 'Legendary'];

/** „2024-05-17“ → „17.05.2024“ */
export const dateDe = (d: string) => d.split('-').reverse().join('.');

export interface FlightRecord {
	icon: string;
	k: string;
	v: string;
	d: string;
	/** Strecke (antippen öffnet sie), sonst Land (Flughafen) */
	route?: string;
	id?: string;
	country?: string;
}

/** Rekorde für die Seite „Rekorde“ im Flugpass */
export function flightRecords(st: FlightStats, ap: Airports, al: Airlines | null): FlightRecord[] {
	const city = (c: string) => ap[c]?.[0] || c;
	const leg = (l: Leg) => ({ route: routeKey(l.f.from, l.to), id: l.f.id, v: `${city(l.f.from)} → ${city(l.to)}` });
	const done = st.legs.filter((l) => l.done);
	const out: FlightRecord[] = [];
	if (st.longest) out.push({ icon: '📏', k: 'Längster Flug', ...leg(st.longest), d: `${fmtInt(st.longest.km)} km · ${fmtDuration(st.longest.min)}` });
	if (st.shortest && st.shortest !== st.longest) out.push({ icon: '🤏', k: 'Kürzester Flug', ...leg(st.shortest), d: `${fmtInt(st.shortest.km)} km · ${fmtDuration(st.shortest.min)}` });
	const slow = done.reduce<Leg | null>((m, l) => (!m || l.min > m.min ? l : m), null);
	// nur, wenn es nicht dieselbe Strecke wie der längste Flug ist (Hin- und Rückflug zählen gleich)
	if (slow && (!st.longest || routeKey(slow.f.from, slow.to) !== routeKey(st.longest.f.from, st.longest.to))) out.push({ icon: '⏳', k: 'Längste Flugzeit', ...leg(slow), d: `${fmtDuration(slow.min)} · ${fmtInt(slow.km)} km` });
	const top = st.routes[0];
	if (top && top.n > 1) {
		const [a, b] = top.code.split('-');
		out.push({ icon: '🔁', k: 'Häufigste Strecke', v: `${city(a)} ⇄ ${city(b)}`, d: `${a} ⇄ ${b} · ${top.n}× geflogen`, route: top.code });
	}
	const ap0 = st.airports[0];
	if (ap0) out.push({ icon: '📍', k: 'Meistbesuchter Flughafen', v: `${city(ap0.code)} (${ap0.code})`, d: `${ap0.n} Besuche · ${nameOf(ap[ap0.code]?.[2] ?? '')}`, country: ap[ap0.code]?.[2] });
	const al0 = st.airlines[0];
	if (al0) out.push({ icon: '🎫', k: 'Lieblings-Airline', v: al?.[al0.code]?.[0] ?? al0.code, d: `${al0.n}× geflogen · ${st.airlines.length} Airlines insgesamt` });
	// Rekordjahr: meiste Flüge in einem Jahr
	const per = new Map<string, Leg[]>();
	for (const l of done) per.set(l.f.date.slice(0, 4), [...(per.get(l.f.date.slice(0, 4)) ?? []), l]);
	const best = [...per].sort((x, y) => y[1].length - x[1].length || +y[0] - +x[0])[0];
	if (best && per.size > 1) out.push({ icon: '🚀', k: 'Rekordjahr', v: best[0], d: `${best[1].length} Flüge · ${fmtInt(best[1].reduce((s, l) => s + l.km, 0))} km` });
	const byLat = st.airports.filter((a) => ap[a.code]).sort((a, b) => ap[b.code][3] - ap[a.code][3]);
	const dec1 = (x: number) => x.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
	const lat = (c: string, ico: string, k: string): FlightRecord => {
		const y = ap[c][3];
		return { icon: ico, k, v: `${city(c)} (${c})`, d: `${dec1(Math.abs(y))}° ${y < 0 ? 'S' : 'N'} · ${nameOf(ap[c][2])}`, country: ap[c][2] };
	};
	if (byLat.length) out.push(lat(byLat[0].code, '🧭', 'Nördlichster Flughafen'));
	if (byLat.length > 1) out.push(lat(byLat[byLat.length - 1].code, '🐧', 'Südlichster Flughafen'));
	const first = done[done.length - 1];
	if (first) out.push({ icon: '🐣', k: 'Erster Flug im Pass', ...leg(first), d: dateDe(first.f.date) });
	return out;
}
