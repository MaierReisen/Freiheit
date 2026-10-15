import { airlineFor, durationProblem, estFlightMin, flightNo, localToUtc, type Airlines, type Airport, type Flight, type FlightDetail } from './flights';

/* Angaben zu einem Flug von Hand (Formular „Flug hinzufügen“ und Flug-Seite): Flugnummer erkennen, Ankunftstag und
   Flugzeit aus Ortszeiten, Gründe, warum es den Flug so nicht geben kann, und einen geänderten Flug bauen. */

export const isDay = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
const nextDay = (d: string) => new Date(Date.parse(d + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10);
/** „HH:MM“ aus „JJJJ-MM-TTTHH:MM“ ('' ohne Uhrzeit) */
export const hm = (t?: string) => (t && !t.endsWith('T00:00') ? t.slice(11, 16) : '');

export type NoParts = { airline: string; no: string; err: string } | null;
/** Flugnummer: „LH 400“ / „LH400“ / „DLH 400“ → Airline (ICAO) + Nummer; used = schon geflogene Airlines (bei mehrdeutigem Kürzel zuerst) */
export function parseNo(text: string, day: string, al: Airlines | null, used: Set<string>): NoParts {
	const t = text.trim().toUpperCase().replace(/\s+/g, ' ');
	if (!t || !al) return null;
	const m = t.match(/^([A-Z0-9]{2}|[A-Z]{3}) ?(\d{1,4}[A-Z]?)$/);
	if (!m) return { airline: '', no: t, err: 'Flugnummer bitte wie auf der Bordkarte, z. B. „LH 400“' };
	const [, code, nr] = m;
	const c = airlineFor(code, day, al, used);
	if (c === null) return { airline: '', no: nr, err: `Eine Airline mit dem Kürzel ${code} gibt es nicht` };
	if (!c) return { airline: '', no: nr, err: `Unter dem Kürzel ${code} flog ${day.slice(0, 4)} keine Airline` };
	return { airline: c, no: nr, err: '' };
}

export type LegInfo = { p: NoParts; arrDay: string; plus: number; min: number; est: boolean; errs: string[] };
/** Alles zu einem Flug A → B: Ankunftstag (Ortszeit am Ziel; liegt die Uhrzeit vor dem Abflug, einer der nächsten Tage),
    Flugzeit aus den Uhrzeiten (über Zeitzonen hinweg, sonst geschätzt), Airline und Gründe, warum es den Flug so nicht geben kann */
export function legInfo(
	day: string,
	noText: string,
	d: string,
	a: string,
	A: Airport | undefined,
	B: Airport | undefined,
	km: number,
	al: Airlines | null,
	used: Set<string>
): LegInfo {
	const p = parseNo(noText, day, al, used);
	let arrDay = day,
		plus = 0;
	if (a && d && A && B && isDay(day)) {
		const depMs = localToUtc(`${day}T${d}`, A[5]);
		while (plus < 2 && localToUtc(`${arrDay}T${a}`, B[5]) <= depMs) {
			arrDay = nextDay(arrDay);
			plus++;
		}
	}
	let min = 0,
		est = true;
	if (d && a && A && B && isDay(day)) {
		const m = Math.round((localToUtc(`${arrDay}T${a}`, B[5]) - localToUtc(`${day}T${d}`, A[5])) / 60000);
		if (m > 0) (min = m), (est = false);
	}
	if (est) min = km ? estFlightMin(km) : 0;
	const errs: string[] = [];
	if (isDay(day)) {
		if (day < '1950-01-01') errs.push('Das Datum liegt zu weit zurück');
		if (day > new Date(Date.now() + 365 * 864e5).toLocaleDateString('sv-SE')) errs.push('Flüge lassen sich höchstens ein Jahr im Voraus buchen');
	}
	if (p?.err) errs.push(p.err);
	if (!est && km) {
		const e = durationProblem(km, min);
		if (e) errs.push(e);
	}
	return { p, arrDay, plus, min, est, errs };
}

export type FlightForm = { from: string; to: string; date: string; no: string; dep: string; arr: string; seat: string; cab: string; note: string };
/** Angaben eines vorhandenen Flugs, wie sie im Formular stehen */
export function formOf(f: Flight, al: Airlines | null): FlightForm {
	return {
		from: f.from,
		to: f.to,
		date: f.date,
		no: flightNo(f, al),
		dep: hm(f.d.gda || f.d.gds || f.d.ofa || f.d.ofs),
		arr: hm(f.d.gaa || f.d.gas || f.d.ona || f.d.ons),
		seat: f.d.seat ?? '',
		cab: f.d.cab ?? '',
		note: f.d.note ?? ''
	};
}
/** Geänderter Flug: Kennung bleibt; geänderte Datum/Zeiten/Strecke ersetzen alle bisherigen Zeiten (auch die aus Flighty),
    unveränderte Flugnummer bleibt wie sie war (frühere Airlines werden nicht neu erkannt). was = formOf(old) vor der Änderung. */
export function editedFlight(old: Flight, was: FlightForm, v: FlightForm, info: LegInfo): Flight {
	const d: FlightDetail = { ...old.d };
	if (v.date !== was.date || v.dep !== was.dep || v.arr !== was.arr || v.from !== old.from || v.to !== old.to) {
		for (const k of ['gds', 'gda', 'ofs', 'ofa', 'ons', 'ona', 'gas', 'gaa'] as const) delete d[k];
		if (v.dep) d.gds = `${v.date}T${v.dep}`;
		if (v.arr) d.gas = `${info.arrDay}T${v.arr}`;
	}
	if (v.from !== old.from || v.to !== old.to) delete d.div;
	for (const k of ['seat', 'cab', 'note'] as const) {
		const t = k === 'seat' ? v[k].trim().toUpperCase() : v[k].trim();
		if (t) d[k] = t;
		else delete d[k];
	}
	const f: Flight = { id: old.id, date: v.date, from: v.from, to: v.to, d };
	if (v.no.trim() === was.no.trim()) {
		if (old.airline) f.airline = old.airline;
		if (old.no) f.no = old.no;
	} else {
		if (info.p?.airline) f.airline = info.p.airline;
		const nr = info.p ? info.p.no : v.no.trim();
		if (nr) f.no = nr;
	}
	return f;
}
