import { describe, it, expect } from 'vitest';
import airports from '../../src/lib/data/airports.json';
import { flightStats, gcKm, legOf, parseFlighty, localToUtc, durationProblem, fmtDuration, routeKey, type Airports, type Flight } from '../../src/lib/flights';

const ap = airports as unknown as Airports;
const NOW = Date.parse('2026-06-01T12:00:00Z');
const fl = (id: string, date: string, from: string, to: string, d: Flight['d'] = {}): Flight => ({ id, date, from, to, d });

describe('Strecke', () => {
	it('FRA–JFK ca. 6200 km', () => {
		const km = gcKm(ap.FRA, ap.JFK);
		expect(km).toBeGreaterThan(6150);
		expect(km).toBeLessThan(6250);
	});
	it('Richtung egal', () => {
		expect(gcKm(ap.MUC, ap.LIS)).toBeCloseTo(gcKm(ap.LIS, ap.MUC), 6);
	});
	it('routeKey ist richtungsunabhängig', () => {
		expect(routeKey('MUC', 'LIS')).toBe(routeKey('LIS', 'MUC'));
	});
});

describe('Zeit', () => {
	it('Ortszeit → UTC (Winter und Sommer)', () => {
		expect(localToUtc('2026-01-15T12:00', 'Europe/Berlin')).toBe(Date.parse('2026-01-15T11:00:00Z'));
		expect(localToUtc('2026-07-15T12:00', 'Europe/Berlin')).toBe(Date.parse('2026-07-15T10:00:00Z'));
		expect(localToUtc('2026-07-15T12:00', 'America/New_York')).toBe(Date.parse('2026-07-15T16:00:00Z'));
	});
	it('Dauer formatieren', () => {
		expect(fmtDuration(45)).toBe('45 Min');
		expect(fmtDuration(125)).toBe('2 Std 5 Min');
		expect(fmtDuration(1440 * 3 + 240)).toBe('3 T 4 Std');
	});
	it('unmögliche Flugzeiten werden erkannt', () => {
		expect(durationProblem(6200, 5)).not.toBe('');
		expect(durationProblem(6200, 60)).not.toBe('');
		expect(durationProblem(6200, 600)).toBe('');
	});
});

describe('Flugzeit pro Flug', () => {
	it('tatsächliche Gate-Zeiten haben Vorrang vor geplanten', () => {
		const f = fl('a', '2026-03-01', 'MUC', 'LIS', { gds: '2026-03-01T10:00', gas: '2026-03-01T12:00', gda: '2026-03-01T10:10', gaa: '2026-03-01T12:40' });
		const l = legOf(f, ap, NOW);
		expect(l.min).toBe(210); // 10:10 München → 12:40 Lissabon (1 Std früher) = 3:30 Std
		expect(l.est).toBe(false);
	});
	it('ohne Zeiten wird aus der Strecke geschätzt', () => {
		const l = legOf(fl('b', '2026-03-01', 'MUC', 'LIS'), ap, NOW);
		expect(l.est).toBe(true);
		expect(l.min).toBeGreaterThan(150);
		expect(l.min).toBeLessThan(260);
	});
	it('Umleitung zählt zum tatsächlichen Ziel', () => {
		const l = legOf(fl('c', '2026-03-01', 'FRA', 'JFK', { div: 'BOS' }), ap, NOW);
		expect(l.to).toBe('BOS');
	});
});

describe('Statistik', () => {
	it('gestrichene und zukünftige Flüge zählen nicht', () => {
		const s = flightStats(
			[fl('1', '2026-03-01', 'FRA', 'JFK'), fl('2', '2026-03-05', 'JFK', 'FRA', { cx: true }), fl('3', '2027-01-01', 'FRA', 'LIS')],
			ap,
			NOW
		);
		expect(s.n).toBe(1);
		expect(s.upcoming).toBe(1);
		expect(s.countries).toEqual(['DE', 'US']);
	});
	it('kurzes Umsteigen = 1 Besuch, nicht 2', () => {
		const s = flightStats(
			[
				fl('1', '2026-03-01', 'LIS', 'MUC', { gds: '2026-03-01T08:00', gas: '2026-03-01T12:00' }),
				fl('2', '2026-03-01', 'MUC', 'JFK', { gds: '2026-03-01T14:00', gas: '2026-03-01T22:00' })
			],
			ap,
			NOW
		);
		expect(s.airports.find((x) => x.code === 'MUC')?.n).toBe(1);
	});
	it('Aufenthalt über 8 h = 2 Besuche', () => {
		const s = flightStats(
			[
				fl('1', '2026-03-01', 'LIS', 'MUC', { gds: '2026-03-01T08:00', gas: '2026-03-01T12:00' }),
				fl('2', '2026-03-02', 'MUC', 'JFK', { gds: '2026-03-02T09:00', gas: '2026-03-02T17:00' })
			],
			ap,
			NOW
		);
		expect(s.airports.find((x) => x.code === 'MUC')?.n).toBe(2);
	});
	it('Hin und zurück am Wendepunkt = 2 Besuche', () => {
		const s = flightStats(
			[
				fl('1', '2026-03-01', 'FRA', 'LIS', { gds: '2026-03-01T08:00', gas: '2026-03-01T11:00' }),
				fl('2', '2026-03-01', 'LIS', 'FRA', { gds: '2026-03-01T13:00', gas: '2026-03-01T17:00' })
			],
			ap,
			NOW
		);
		expect(s.airports.find((x) => x.code === 'LIS')?.n).toBe(2);
	});
	it('Summe der Strecken stimmt', () => {
		const s = flightStats([fl('1', '2026-03-01', 'FRA', 'JFK'), fl('2', '2026-03-10', 'JFK', 'FRA')], ap, NOW);
		expect(s.km).toBeCloseTo(2 * gcKm(ap.FRA, ap.JFK), 3);
		expect(s.routes).toEqual([{ code: 'FRA-JFK', n: 2 }]);
	});
});

describe('Flighty-Datei', () => {
	const csv = 'Date,Airline,Flight,From,To,Canceled,Diverted To,Gate Departure (Scheduled),Flight Flighty ID\n' +
		'2026-03-01,DLH,2827,MUC,LIS,false,,2026-03-01T08:00:00,abc\n' +
		'2026-03-02,DLH,1,"FRA",JFK,true,,,\n' +
		'kaputt,,,,,,,,\n';
	it('liest Flüge, Streichung und überspringt kaputte Zeilen', () => {
		const r = parseFlighty(csv);
		expect(r).toHaveLength(2);
		expect(r[0]).toMatchObject({ id: 'abc', from: 'MUC', to: 'LIS', airline: 'DLH', no: '2827' });
		expect(r[1].d.cx).toBe(true);
	});
	it('falsches Format wirft Fehler', () => {
		expect(() => parseFlighty('a,b\n1,2')).toThrow();
	});
});
