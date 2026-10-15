import { describe, it, expect } from 'vitest';
import airports from '../../src/lib/data/airports.json';
import { CONT, CONT_NAMES, nameOf, compareNames, flag, appCountry, contOf } from '../../src/lib/countries';

describe('Länder', () => {
	it('jedes Land hat Kontinent und deutschen Namen', () => {
		for (const c of Object.keys(CONT)) {
			expect(CONT_NAMES[CONT[c]], c).toBeTruthy();
			expect(nameOf(c), c).toBeTruthy();
			expect(nameOf(c), c).not.toBe(c);
		}
	});
	it('Namen: Beispiele', () => {
		expect(nameOf('DE')).toBe('Deutschland');
		expect(contOf('DE')).toBeTruthy();
	});
	it('Sortierung: Umlaute nach a/o/u, ß = ss', () => {
		const sorted = ['Südafrika', 'Sudan', 'Spanien'].sort(compareNames);
		expect(sorted).toEqual(['Spanien', 'Sudan', 'Südafrika']);
		expect(compareNames('Straße', 'Strasse')).not.toBe(NaN);
	});
	it('Flagge', () => {
		expect(flag('DE')).toBe('🇩🇪');
		expect(flag('xx')).toBe('🏳️');
	});
	it('Überseegebiete gehören zum Mutterland', () => {
		expect(appCountry('RE')).toBe('FR');
		expect(appCountry('DE')).toBe('DE');
		expect(appCountry('ZZ')).toBe('');
	});
	it('jeder Flughafen liegt in einem bekannten Land', () => {
		const bad = new Set<string>();
		for (const a of Object.values(airports as Record<string, string[]>)) if (!appCountry(a[2])) bad.add(a[2]);
		expect([...bad]).toEqual([]);
	});
});
