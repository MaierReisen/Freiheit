import { describe, it, expect } from 'vitest';
import airports from '../../src/lib/data/airports.json';
import airlines from '../../src/lib/data/airlines.json';
import { editedFlight, formOf, legInfo, parseNo } from '../../src/lib/flightForm';
import { gcKm, type Airlines, type Airports, type Flight } from '../../src/lib/flights';

const ap = airports as unknown as Airports;
const al = airlines as unknown as Airlines;
const none = new Set<string>();

describe('Flug-Angaben', () => {
	it('Flugnummer erkennen', () => {
		expect(parseNo('lh400', '2024-05-01', al, none)).toEqual({ airline: 'DLH', no: '400', err: '' });
		expect(parseNo('ZZ 12', '2024-05-01', al, none)?.err).toBeTruthy();
		expect(parseNo('', '2024-05-01', al, none)).toBeNull();
	});
	it('Ankunft am Folgetag', () => {
		const i = legInfo('2024-05-01', '', '22:00', '06:00', ap.FRA, ap.JFK, gcKm(ap.FRA, ap.JFK), al, none);
		expect(i.plus).toBe(1);
		expect(i.arrDay).toBe('2024-05-02');
	});
	it('Ändern: Kennung bleibt, Zeiten ersetzt, Platz groß, leere Felder entfernt', () => {
		const old: Flight = { id: 'x1', date: '2024-05-01', from: 'FRA', to: 'JFK', airline: 'DLH', no: '400', d: { gda: '2024-05-01T10:05', gaa: '2024-05-01T12:40', note: 'alt', ac: 'A340' } };
		const was = formOf(old, al);
		expect(was.dep).toBe('10:05');
		const v = { ...was, dep: '11:00', seat: '23a', note: '' };
		const nf = editedFlight(old, was, v, legInfo(v.date, '', v.dep, v.arr, ap.FRA, ap.JFK, 6200, al, none));
		expect(nf.id).toBe('x1');
		expect(nf.d.gda).toBeUndefined();
		expect(nf.d.gds).toBe('2024-05-01T11:00');
		expect(nf.d.gas).toBe('2024-05-01T12:40');
		expect(nf.d.seat).toBe('23A');
		expect(nf.d.note).toBeUndefined();
		expect(nf.d.ac).toBe('A340');
		expect(nf.airline).toBe('DLH');
	});
});
