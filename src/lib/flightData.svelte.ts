import { toast } from './app.svelte';
import { addFromFlights, atlas, flightsMarked, setFlightsMarked, synced, userId } from './atlas.svelte';
import { nameOf } from './countries';
import { flightCountries, flightStats, legOf, loadAirlines, loadAirports, routeKey, type Airlines, type Airports } from './flights';
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
		const legs: { a: [number, number]; b: [number, number]; planned: boolean; key: string }[] = [];
		for (const l of st.legs) {
			if (l.f.d.cx || (!l.done && y !== null) || (y !== null && +l.f.date.slice(0, 4) !== y)) continue;
			const A = ap[l.f.from],
				B = ap[l.to];
			if (A && B) legs.push({ a: [A[4], A[3]], b: [B[4], B[3]], planned: !l.done, key: routeKey(l.f.from, l.to) });
		}
		return legs.length ? buildRoutes(legs) : null;
	});
	/** „jetzt“ nur weiterstellen, wenn dadurch ein geplanter Flug zum geflogenen wird – sonst würden Statistik und
	    Strecken bei jedem Tabwechsel ohne Änderung neu berechnet */
	tick() {
		const t = Date.now();
		if (!this.st || this.st.legs.some((l) => !l.done && !l.f.d.cx && l.doneAt <= t)) this.now = t;
		this.syncCountries(); // geplanter Flug hat inzwischen stattgefunden: Land eintragen
	}
	/** Länder geflogener Flüge als bereist eintragen (samt Einreisedatum) – je Flug nur einmal, auch für Flüge,
	    die stattgefunden haben, während die App zu war. Erst nach dem Abgleich mit dem Konto. `msg`: Meldung des Aufrufers,
	    wird um die neuen Länder ergänzt. */
	async syncCountries(msg = '') {
		const user = userId();
		if (!user || !atlas.flights.length) return;
		await synced();
		const ap = this.ap ?? (await this.load());
		if (!ap || userId() !== user) return;
		const seen = flightsMarked() ?? new Set<string>(),
			t = Date.now();
		const todo = atlas.flights.filter((f) => !seen.has(f.id) && legOf(f, ap, t).done).map((f) => f.id);
		if (!todo.length) return;
		const fresh = addFromFlights(flightCountries(atlas.flights, ap, new Set(todo), t));
		// nur noch vorhandene Flüge merken, damit die Liste nicht wächst
		const ids = new Set(atlas.flights.map((f) => f.id));
		setFlightsMarked(new Set([...seen, ...todo].filter((id) => ids.has(id))));
		if (!fresh.length) return;
		const land = fresh.length === 1 ? `${nameOf(fresh[0])} als bereist eingetragen` : `${fresh.length} Länder als bereist eingetragen`;
		toast(msg ? `${msg} · ${land}` : land);
	}
	private loading: Promise<Airports | null> | null = null;
	load(): Promise<Airports | null> {
		if (this.ap) return Promise.resolve(this.ap);
		if (this.loading) return this.loading;
		return (this.loading = Promise.all([loadAirports(), loadAirlines()])
			.then(([a, b]) => {
				this.ap = a;
				this.al = b;
				return a;
			})
			.catch(() => {
				this.loading = null; // z. B. offline: beim nächsten Öffnen des Tabs erneut versuchen
				return null;
			}));
	}
}

export const fd = new FlightData();
