import { atlas } from './atlas.svelte';
import { flightStats, loadAirlines, loadAirports, type Airlines, type Airports } from './flights';
import { buildRoutes } from './map/routes';

/* Gemeinsamer Stand für den Tab „Flüge“ (Kopf, Inhalt, Globus): Flughafen-/Airline-Liste (nachgeladen),
   Statistik und die Flugstrecken für den Globus – einmal je Datenstand berechnet, nicht bei jedem Zeichnen. */

class FlightData {
	ap = $state.raw<Airports | null>(null);
	al = $state.raw<Airlines | null>(null);
	/** „jetzt“ für geplante Flüge: beim Öffnen des Tabs und bei Rückkehr in die App neu (geplante werden so zu geflogenen) */
	now = $state(Date.now());
	/** gewähltes Jahr für den Globus (null = alle) */
	year = $state<number | null>(null);
	st = $derived(this.ap ? flightStats(atlas.flights, this.ap, this.now) : null);
	/** Jahre mit Flügen (neueste zuerst) und Anzahl geflogener Flüge je Jahr */
	years = $derived.by(() => {
		const m = new Map<number, number>();
		for (const l of this.st?.legs ?? []) if (l.done) m.set(+l.f.date.slice(0, 4), (m.get(+l.f.date.slice(0, 4)) ?? 0) + 1);
		return [...m].sort((a, b) => b[0] - a[0]);
	});
	/** Strecken für den Globus: geflogene (im gewählten Jahr) und – ohne Jahr – geplante */
	routes = $derived.by(() => {
		const st = this.st,
			ap = this.ap,
			y = this.year;
		if (!st || !ap) return null;
		const legs: { a: [number, number]; b: [number, number]; planned: boolean }[] = [];
		for (const l of st.legs) {
			if (l.f.d.cx || (!l.done && y !== null) || (y !== null && +l.f.date.slice(0, 4) !== y)) continue;
			const A = ap[l.f.from],
				B = ap[l.to];
			if (A && B) legs.push({ a: [A[4], A[3]], b: [B[4], B[3]], planned: !l.done });
		}
		return legs.length ? buildRoutes(legs) : null;
	});
	/** „jetzt“ nur weiterstellen, wenn dadurch ein geplanter Flug zum geflogenen wird – sonst würden Statistik und
	    Strecken bei jedem Tabwechsel ohne Änderung neu berechnet */
	tick() {
		const t = Date.now();
		if (!this.st || this.st.legs.some((l) => !l.done && !l.f.d.cx && l.dep <= t)) this.now = t;
	}
	private loading = false;
	load() {
		if (this.ap || this.loading) return;
		this.loading = true;
		Promise.all([loadAirports(), loadAirlines()])
			.then(([a, b]) => {
				this.ap = a;
				this.al = b;
			})
			.catch(() => {
				this.loading = false; // z. B. offline: beim nächsten Öffnen des Tabs erneut versuchen
			});
	}
}

export const fd = new FlightData();
