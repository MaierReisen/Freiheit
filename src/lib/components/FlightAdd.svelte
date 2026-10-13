<script lang="ts">
	import { atlas, putFlights } from '$lib/atlas.svelte';
	import { closeFlightsPage, closeSheet, flashRoute, hooks, toast } from '$lib/app.svelte';
	import { flag, nameOf } from '$lib/countries';
	import { fd } from '$lib/flightData.svelte';
	import { estFlightMin, fmtDuration, fmtInt, gcKm, localToUtc, routeKey, type Flight, type FlightDetail } from '$lib/flights';

	/* „Flug hinzufügen“ (Knopf „+ Flug“ im Tab „Flüge“ bzw. auf der Seite einer Strecke): Datum, Von, Nach,
	   optional Flugnummer (z. B. „LH 400“, Airline wird daraus erkannt) und Ortszeiten. Flughäfen per Suche
	   (Kürzel, Stadt, Name oder Land; schon besuchte zuerst). Danach fliegt der Globus zur neuen Strecke. */

	let { from: from0, to: to0 }: { from?: string; to?: string } = $props();

	fd.load();
	const ap = $derived(fd.ap);
	const al = $derived(fd.al);

	// svelte-ignore state_referenced_locally
	let from = $state(from0 ?? '');
	// svelte-ignore state_referenced_locally
	let to = $state(to0 ?? '');
	let date = $state(new Date().toLocaleDateString('sv-SE')); // heute, „JJJJ-MM-TT“
	let no = $state('');
	let dep = $state('');
	let arr = $state('');
	// svelte-ignore state_referenced_locally
	let active = $state<'from' | 'to' | null>(from0 ? null : 'from');
	let q = $state('');
	let qEl = $state<HTMLInputElement>();
	// Suche gleich bereit (am Rechner; iOS öffnet die Tastatur erst beim Antippen)
	$effect(() => {
		if (active && qEl) qEl.focus({ preventScroll: true });
	});

	/* ---------- Flughafen-Suche ---------- */
	const norm = (s: string) =>
		s
			.toLowerCase()
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '');
	// Suchtext je Flughafen einmal aufbereitet
	const index = $derived(ap ? Object.entries(ap).map(([c, x]) => ({ c, city: norm(x[0]), name: norm(x[1]), land: norm(nameOf(x[2])) })) : []);
	const visits = $derived(new Map((fd.st?.airports ?? []).map((a) => [a.code, a.n])));
	const results = $derived.by(() => {
		const s = norm(q.trim());
		if (!s) return [...visits.keys()].filter((c) => ap?.[c]).slice(0, 12); // ohne Suche: bisherige Flughäfen
		const up = s.toUpperCase();
		const hits: { c: string; r: number }[] = [];
		for (const x of index) {
			const r =
				x.c === up ? 0 : x.city.startsWith(s) ? 1 : x.name.startsWith(s) ? 2 : x.city.includes(s) || x.name.includes(s) ? 3 : s.length > 2 && x.land.startsWith(s) ? 4 : -1;
			if (r >= 0) hits.push({ c: x.c, r });
		}
		return hits
			.sort((p, k) => p.r - k.r || (visits.get(k.c) ?? 0) - (visits.get(p.c) ?? 0) || p.c.localeCompare(k.c))
			.slice(0, 40)
			.map((h) => h.c);
	});
	function edit(which: 'from' | 'to') {
		// erneuter Tipp auf das offene Feld (mit Wert) schließt die Suche wieder
		if (active === which && (which === 'from' ? from : to)) return closeSearch();
		active = which;
		q = '';
		qEl?.focus();
	}
	function closeSearch() {
		active = null;
		q = '';
	}
	const canClose = $derived(active === 'from' ? !!from : active === 'to' ? !!to : false);
	function choose(c: string) {
		if (active === 'from') from = c;
		else to = c;
		const next = active === 'from' && !to ? 'to' : null;
		if (next) edit(next);
		else {
			active = null;
			q = '';
		}
	}
	function swap() {
		[from, to] = [to, from];
	}

	/* ---------- Flugnummer: „LH 400“ / „LH400“ / „DLH 400“ → Airline (ICAO) + Nummer ---------- */
	const flightNoParts = $derived.by(() => {
		const m = no.trim().toUpperCase().replace(/\s+/g, ' ').match(/^([A-Z0-9]{2}|[A-Z]{3}) ?(\d{1,4}[A-Z]?)$/);
		if (!m || !al) return null;
		const [, code, nr] = m;
		if (code.length === 3 && al[code]) return { airline: code, no: nr };
		// IATA-Kürzel ist nicht eindeutig (auch eingestellte Airlines): zuerst schon geflogene, dann ohne Zusatz in Klammern
		const used = new Set(fd.st?.airlines.map((a) => a.code) ?? []);
		const cand = Object.entries(al).filter(([, x]) => x[1] === code);
		cand.sort((p, k) => Number(used.has(k[0])) - Number(used.has(p[0])) || Number(p[1][0].includes('(')) - Number(k[1][0].includes('(')));
		return cand[0] ? { airline: cand[0][0], no: nr } : { airline: '', no: `${code} ${nr}` };
	});

	// Vorschau: Strecke und Flugzeit, sobald Von und Nach gewählt sind
	const km = $derived(ap && from && to && from !== to && ap[from] && ap[to] ? gcKm(ap[from], ap[to]) : 0);
	/** Ankunftstag (Ortszeit am Ziel): selber Tag oder – falls das vor dem Abflug läge – einer der nächsten Tage */
	const arrDay = $derived.by(() => {
		if (!arr || !ap?.[from] || !ap?.[to] || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { day: date, plus: 0 };
		const depMs = dep ? localToUtc(`${date}T${dep}`, ap[from][5]) : 0;
		let day = date,
			plus = 0;
		while (dep && plus < 2 && localToUtc(`${day}T${arr}`, ap[to][5]) <= depMs) {
			day = new Date(Date.parse(day + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10);
			plus++;
		}
		return { day, plus };
	});
	/** Flugzeit aus den Uhrzeiten (über Zeitzonen hinweg), sonst geschätzt */
	const minutes = $derived.by(() => {
		if (dep && arr && ap?.[from] && ap?.[to]) {
			const m = Math.round((localToUtc(`${arrDay.day}T${arr}`, ap[to][5]) - localToUtc(`${date}T${dep}`, ap[from][5])) / 60000);
			if (m > 0) return { m, est: false };
		}
		return { m: km ? estFlightMin(km) : 0, est: true };
	});
	const ready = $derived(!!ap && /^\d{4}-\d{2}-\d{2}$/.test(date) && !!from && !!to && from !== to);
	const label = (c: string) => (ap?.[c] ? `${ap[c][0]}` : c);

	function add() {
		if (!ready || !ap) return;
		const d: FlightDetail = {};
		if (dep) d.gds = `${date}T${dep}`;
		if (arr) d.gas = `${arrDay.day}T${arr}`;
		const p = flightNoParts;
		const airline = p?.airline || '';
		const nr = p ? p.no : no.trim();
		const id = `${date}${d.gds ? d.gds.slice(10) : ''}-${from}-${to}-${airline}${nr}`;
		// gleicher Tag und gleiche Strecke (auch aus Flighty eingelesen, dort mit eigener Kennung) = schon da
		if (atlas.flights.some((f) => f.id === id || (f.date === date && f.from === from && f.to === to))) {
			toast('Diesen Flug gibt es schon');
			return;
		}
		const f: Flight = { id, date, from, to, ...(airline ? { airline } : {}), ...(nr ? { no: nr } : {}), d };
		atlas.lastFlightAddedAt = Date.now();
		putFlights([f]);
		toast(`Flug ${from} → ${to} hinzugefügt`);
		closeSheet();
		closeFlightsPage(); // aus „Meine Flüge“ heraus: Liste schließen, damit der Globus zu sehen ist
		// wie beim neuen Land: Globus fliegt zur neuen Strecke, die wächst; keine Seite öffnet sich
		fd.year = null;
		fd.tick();
		const key = routeKey(from, to);
		hooks.map?.focusRoute(key);
		flashRoute(key);
	}
</script>

<h3 id="sheetTitle">Flug hinzufügen</h3>
<div class="fa-body">
	<div class="fa-card fa-route">
		{#each ['from', 'to'] as const as w (w)}
			{@const c = w === 'from' ? from : to}
			<button type="button" class="fa-row fa-ap" class:on={active === w} onclick={() => edit(w)}>
				<span class="fa-k">{w === 'from' ? 'Von' : 'Nach'}</span>
				{#if c}
					<span class="fa-v"><b>{c}</b><span class="fa-city">{ap?.[c] ? `${flag(ap[c][2])} ${label(c)}` : ''}</span></span>
				{:else}
					<span class="fa-v fa-ph">Flughafen wählen</span>
				{/if}
			</button>
		{/each}
		<button type="button" class="fa-swap" aria-label="Von und Nach tauschen" onclick={swap} disabled={!from || !to}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v15M4.5 15.5 8 19l3.5-3.5M16 20V5M12.5 8.5 16 5l3.5 3.5" /></svg></button
		>
	</div>

	{#if active}
		<div class="fa-search">
			<input
				class="search"
				type="search"
				placeholder="Kürzel, Stadt oder Flughafen"
				autocomplete="off"
				enterkeyhint="done"
				bind:value={q}
				bind:this={qEl}
				onkeydown={(e) => e.key === 'Enter' && results[0] && choose(results[0])}
			/>
			{#if canClose}<button type="button" class="fa-cancel" onclick={closeSearch}>Fertig</button>{/if}
		</div>
		<ul class="pick-list fa-list">
			{#if !ap}
				<li class="empty">Flughäfen werden geladen …</li>
			{:else}
				{#if !q.trim() && results.length}<li class="pick-sub" role="presentation">Deine Flughäfen</li>{/if}
				{#each results as c (c)}
					{@const x = ap[c]}
					<li>
						<button type="button" onclick={() => choose(c)}
							><span class="fa-flag">{flag(x[2])}</span><span class="fa-res"><b>{x[0]}</b><small>{x[1] || nameOf(x[2])}</small></span><span class="fa-code">{c}</span></button
						>
					</li>
				{/each}
				{#if q.trim() && !results.length}<li class="empty">Kein Flughafen gefunden.</li>{/if}
			{/if}
		</ul>
	{:else}
		{#if km}
			<p class="fa-preview">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18c3-8 13-8 16 0" /><circle cx="4" cy="18" r="1.6" /><circle cx="20" cy="18" r="1.6" /></svg>{fmtInt(km)} km · {fmtDuration(minutes.m)}
			</p>
		{/if}
		<div class="fa-card">
			<label class="fa-row"><span class="fa-k">Datum</span><input class="fa-in" type="date" bind:value={date} required /></label>
			<label class="fa-row fa-no"
				><span class="fa-k">Flug-Nr.</span><span class="fa-v fa-col"
					><input class="fa-in" type="text" placeholder="z. B. LH 400" autocomplete="off" autocapitalize="characters" spellcheck="false" bind:value={no} />{#if no.trim()}<small
							class:ok={!!flightNoParts?.airline}>{flightNoParts?.airline && al ? al[flightNoParts.airline][0] : 'Airline nicht erkannt'}</small
						>{/if}</span
				></label
			>
			<label class="fa-row"><span class="fa-k">Abflug</span><input class="fa-in" type="time" bind:value={dep} /></label>
			<label class="fa-row"
				><span class="fa-k">Ankunft</span>{#if arrDay.plus}<span class="fa-plus">+{arrDay.plus} Tag</span>{/if}<input class="fa-in" type="time" bind:value={arr} /></label
			>
		</div>
		<p class="note fa-note">Flugnummer und Uhrzeiten sind freiwillig. Uhrzeiten in Ortszeit, wie auf der Bordkarte. Flüge in der Zukunft gelten als geplant.</p>
	{/if}
</div>
{#if !active}
	<div class="pick-bar">
		<button type="button" class="btn" onclick={closeSheet}>Abbrechen</button>
		<button type="button" class="btn primary fa-go" disabled={!ready} onclick={add}>{from && to ? `${from} → ${to} hinzufügen` : 'Hinzufügen'}</button>
	</div>
{/if}
