<script lang="ts">
	import { atlas, putFlights } from '$lib/atlas.svelte';
	import { closeFlightsPage, closeSheet, hooks, openRoute, toast } from '$lib/app.svelte';
	import { flag, nameOf } from '$lib/countries';
	import { fd } from '$lib/flightData.svelte';
	import { localToUtc, routeKey, type Flight, type FlightDetail } from '$lib/flights';

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
		active = which;
		q = '';
		qEl?.focus();
	}
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

	const ready = $derived(!!ap && /^\d{4}-\d{2}-\d{2}$/.test(date) && !!from && !!to && from !== to);
	const label = (c: string) => (ap?.[c] ? `${ap[c][0]}` : c);

	function add() {
		if (!ready || !ap) return;
		const d: FlightDetail = {};
		if (dep) d.gds = `${date}T${dep}`;
		if (arr) {
			// Ankunft (Ortszeit am Ziel): am selben Tag oder – falls das vor dem Abflug läge – an einem der nächsten Tage
			const depMs = dep ? localToUtc(d.gds!, ap[from][5]) : 0;
			let day = date;
			for (let i = 0; i < 2 && dep && localToUtc(`${day}T${arr}`, ap[to][5]) <= depMs; i++)
				day = new Date(Date.parse(day + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10);
			d.gas = `${day}T${arr}`;
		}
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
		putFlights([f]);
		toast(`Flug ${from} → ${to} hinzugefügt`);
		closeSheet();
		closeFlightsPage(); // aus „Meine Flüge“ heraus: Liste schließen, damit der Globus zu sehen ist
		// wie beim neuen Land: Globus fliegt zur neuen Strecke, die wächst; darunter die Seite zur Strecke (kompakt)
		fd.year = null;
		fd.tick();
		const key = routeKey(from, to);
		openRoute(key, { peek: true, id });
		hooks.map?.focusRoute(key);
	}
</script>

<h3 id="sheetTitle">Flug hinzufügen</h3>
<div class="fa-body">
	<div class="fa-route">
		{#each ['from', 'to'] as const as w (w)}
			{@const c = w === 'from' ? from : to}
			<button type="button" class="fa-ap" class:on={active === w} onclick={() => edit(w)}>
				<span class="fa-k">{w === 'from' ? 'Von' : 'Nach'}</span>
				{#if c}
					<b>{c}</b><span class="fa-city">{ap?.[c] ? `${flag(ap[c][2])} ${label(c)}` : ''}</span>
				{:else}
					<span class="fa-ph">Flughafen wählen</span>
				{/if}
			</button>
		{/each}
		<button type="button" class="fa-swap" aria-label="Von und Nach tauschen" onclick={swap} disabled={!from && !to}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v15M4.5 15.5 8 19l3.5-3.5M16 20V5M12.5 8.5 16 5l3.5 3.5" /></svg></button
		>
	</div>

	{#if active}
		<input
			class="search"
			type="search"
			placeholder="Kürzel, Stadt oder Flughafen"
			autocomplete="off"
			style="margin-top:12px"
			bind:value={q}
			bind:this={qEl}
			onkeydown={(e) => e.key === 'Enter' && results[0] && choose(results[0])}
		/>
		<ul class="pick-list fa-list">
			{#if !ap}
				<li class="empty">Flughäfen werden geladen …</li>
			{:else}
				{#if !q.trim() && results.length}<li class="pick-sub" role="presentation">Deine Flughäfen</li>{/if}
				{#each results as c (c)}
					{@const x = ap[c]}
					<li>
						<button type="button" onclick={() => choose(c)}
							><span>{flag(x[2])}</span><span class="fa-res"><b>{x[0]}</b>{#if x[1]}<small>{x[1]}</small>{/if}</span><span class="ct">{c}</span></button
						>
					</li>
				{/each}
				{#if q.trim() && !results.length}<li class="empty">Kein Flughafen gefunden.</li>{/if}
			{/if}
		</ul>
	{:else}
		<div class="fa-grid">
			<label class="fa-field wide"><span class="fa-k">Datum</span><input type="date" bind:value={date} required /></label>
			<label class="fa-field wide"
				><span class="fa-k">Flugnummer <i>optional</i></span><input type="text" placeholder="z. B. LH 400" autocomplete="off" autocapitalize="characters" bind:value={no} />
				{#if flightNoParts?.airline && al}<span class="fa-hint">{al[flightNoParts.airline][0]}</span>{/if}</label
			>
			<label class="fa-field"><span class="fa-k">Abflug <i>Ortszeit</i></span><input type="time" bind:value={dep} /></label>
			<label class="fa-field"><span class="fa-k">Ankunft <i>Ortszeit</i></span><input type="time" bind:value={arr} /></label>
		</div>
		<p class="note">Ohne Uhrzeiten wird die Flugzeit aus der Strecke geschätzt. Flüge in der Zukunft gelten als geplant.</p>
	{/if}
</div>
{#if !active}
	<div class="pick-bar">
		<span class="lv-bar-n">{from && to ? `${from} → ${to}` : 'Von und Nach wählen'}</span>
		<button type="button" class="btn" onclick={closeSheet}>Abbrechen</button>
		<button type="button" class="btn primary" disabled={!ready} onclick={add}>Hinzufügen</button>
	</div>
{/if}
