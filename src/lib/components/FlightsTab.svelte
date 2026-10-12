<script lang="ts">
	import { onMount } from 'svelte';
	import { atlas, putFlights } from '$lib/atlas.svelte';
	import { openFlightsPage, toast, ui } from '$lib/app.svelte';
	import { flag, nameOf } from '$lib/countries';
	import { EARTH_KM, MOON_KM, flightStats, fmtDuration, fmtInt, loadAirlines, loadAirports, parseFlighty, type Airlines, type Airports, type Leg } from '$lib/flights';
	import FlightsView from './FlightsView.svelte';

	/* Tab „Flüge“: große Zahl, Werte wie im Flighty-Pass (Strecke, Zeit in der Luft, Flughäfen, Länder, Airlines),
	   darunter Zeilen zu den Listen (Vollbild) und Rekorde. Flüge kommen per Flighty-Datei (CSV) herein.
	   Flughafen- und Airline-Liste werden erst nachgeladen (beim Öffnen des Tabs bzw. im Leerlauf). */

	let ap = $state.raw<Airports | null>(null);
	let al = $state.raw<Airlines | null>(null);
	let loading = false;
	function load() {
		if (ap || loading) return;
		loading = true;
		Promise.all([loadAirports(), loadAirlines()])
			.then(([a, b]) => {
				ap = a;
				al = b;
			})
			.catch(() => {
				loading = false; // z. B. offline: beim nächsten Öffnen des Tabs erneut versuchen
			});
	}
	// „jetzt“ für geplante Flüge: beim Öffnen des Tabs und bei Rückkehr in die App neu (geplante werden so zu geflogenen)
	let now = $state(Date.now());
	$effect(() => {
		if (ui.tab === 'flights') {
			load();
			now = Date.now();
		}
	});
	onMount(() => {
		// im Leerlauf vorbereiten, damit der Tab sofort fertig ist
		const t = setTimeout(() => (window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1)))(load), 4000);
		const onVis = () => {
			if (!document.hidden && ui.tab === 'flights') now = Date.now();
		};
		document.addEventListener('visibilitychange', onVis);
		return () => {
			clearTimeout(t);
			document.removeEventListener('visibilitychange', onVis);
		};
	});

	const st = $derived(ap ? flightStats(atlas.flights, ap, now) : null);
	const n = $derived(st ? st.n : atlas.flights.length);
	const city = (code: string) => ap?.[code]?.[0] || code;
	const route = (l: Leg) => `${city(l.f.from)} → ${city(l.to)}`;
	const dec1 = (x: number) => x.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
	const lastLeg = $derived(st?.legs.find((l) => l.done) ?? null);
	const longDay = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	const topAirport = $derived(st?.airports[0]);
	const topRoute = $derived(st?.routes[0]);

	let fileInput: HTMLInputElement;
	async function onFile() {
		const f = fileInput.files?.[0];
		fileInput.value = '';
		if (!f) return;
		try {
			const list = parseFlighty(await f.text());
			if (!list.length) throw new Error('leer');
			const r = putFlights(list);
			toast(
				r.fresh
					? `${r.fresh} ${r.fresh === 1 ? 'Flug' : 'Flüge'} neu eingelesen`
					: r.changed
						? `${r.changed} ${r.changed === 1 ? 'Flug' : 'Flüge'} aktualisiert`
						: 'Alle Flüge waren schon da'
			);
			load();
		} catch {
			toast('Datei nicht lesbar. Erwartet wird der Export aus Flighty.');
		}
	}
</script>

<main class="tab" id="tab-flights" hidden={ui.tab !== 'flights'}>
	<section class="hero fl-hero">
		<div class="hero-row">
			<button type="button" class="count-btn" aria-label="{n} Flüge. Zur Liste" onclick={() => st && n && openFlightsPage('flights')}>
				<span class="count" class:d3={n >= 100}>{n}</span>
				<span class="count-meta">
					<span class="count-label">{n === 1 ? 'Flug' : 'Flüge'}</span>
					<span class="count-sub">{st && n ? `${fmtInt(st.km)} km · ${fmtDuration(st.min)} in der Luft` : 'aus Flighty'}</span>
				</span>
			</button>
			<button type="button" class="hero-add" aria-label="Flighty-Datei einlesen" onclick={() => fileInput.click()}
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v4h14v-4" /></svg><span>Import</span></button
			>
		</div>
		<input type="file" accept=".csv,text/csv" hidden bind:this={fileInput} onchange={onFile} />
	</section>

	{#if !atlas.flights.length}
		<div class="card fl-empty">
			<h2>Deine Flüge aus Flighty</h2>
			<ol>
				<li>In Flighty die <b>Einstellungen</b> öffnen und deine Flüge <b>exportieren</b> (CSV-Datei).</li>
				<li>Hier auf <b>Import</b> tippen und die Datei wählen.</li>
			</ol>
			<p class="note">Erneutes Einlesen legt nichts doppelt an, neue Flüge kommen dazu. Der Buchungscode wird nicht übernommen.</p>
		</div>
	{:else if st}
		<div class="fl-grid">
			<div class="fl-stat">
				<span class="fl-k">Strecke</span>
				<b>{fmtInt(st.km)} <small>km</small></b>
				<span class="fl-s">{dec1(st.km / EARTH_KM)}× um die Erde · {Math.round((st.km / MOON_KM) * 100)} % zum Mond</span>
			</div>
			<div class="fl-stat">
				<span class="fl-k">In der Luft</span>
				<b>{fmtDuration(st.min)}</b>
				<span class="fl-s">{st.estimated ? `${st.estimated} von ${st.n} Flugzeiten geschätzt` : 'Start bis Landung'}</span>
			</div>
			<div class="fl-stat">
				<span class="fl-k">Flughäfen</span>
				<b>{st.airports.length}</b>
				<span class="fl-s">in {st.countries.length} {st.countries.length === 1 ? 'Land' : 'Ländern'}</span>
			</div>
			<div class="fl-stat">
				<span class="fl-k">Airlines</span>
				<b>{st.airlines.length}</b>
				<span class="fl-s">{st.aircraft.length} Flugzeugtypen</span>
			</div>
		</div>

		<h2 class="blocks-h">Meine Flüge</h2>
		<div class="cats">
			<button type="button" class="cat-row" onclick={() => openFlightsPage('flights')}>
				<span class="cat-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 17h18M4.5 13.5l3 1 11-4.5c1.2-.5 2.3.6 1.4 1.5-.3.3-.6.4-1 .6L7.5 16.5 3.5 14l1-.5zM9 11 6.5 6.5l1.5-.5 5 3.5" /></svg></span>
				<span class="cat-txt">
					<span class="cat-name">Flüge</span>
					<span class="cat-sub">{lastLeg ? `Zuletzt ${route(lastLeg)}` : `${st.n} Flüge`}</span>
				</span>
				{#if st.upcoming}<span class="fl-pill">{st.upcoming} geplant</span>{/if}
			</button>
			<button type="button" class="cat-row" onclick={() => openFlightsPage('airports')}>
				<span class="cat-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 21V10.5h6V21M7 10.5h10L15.5 6h-7zM10.5 6V3.5h3V6M5 21h14" /></svg></span>
				<span class="cat-txt">
					<span class="cat-name">Flughäfen</span>
					<span class="cat-sub">{st.airports.length} Flughäfen · {st.countries.length} Länder</span>
				</span>
				<span class="cat-flags" aria-hidden="true">{#if st.countries.length > 3}<span class="cat-more">…</span>{/if}{#each st.countries.slice(-3) as c (c)}<span>{flag(c)}</span>{/each}</span>
			</button>
			<button type="button" class="cat-row" onclick={() => openFlightsPage('airlines')}>
				<span class="cat-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20h16M7 20 10.5 4h3L12 12.5l6.5 7.5" /></svg></span>
				<span class="cat-txt">
					<span class="cat-name">Airlines</span>
					<span class="cat-sub">{st.airlines[0] ? `Am häufigsten ${al?.[st.airlines[0].code]?.[0] ?? st.airlines[0].code}` : 'keine Angaben'}</span>
				</span>
			</button>
		</div>

		<h2 class="blocks-h">Rekorde</h2>
		<ul class="cats fl-rec">
			{#if st.longest}<li><span class="fl-k">Längster Flug</span><b>{route(st.longest)}</b><span>{fmtInt(st.longest.km)} km · {fmtDuration(st.longest.min)}</span></li>{/if}
			{#if st.shortest}<li><span class="fl-k">Kürzester Flug</span><b>{route(st.shortest)}</b><span>{fmtInt(st.shortest.km)} km · {fmtDuration(st.shortest.min)}</span></li>{/if}
			{#if topRoute}
				{@const [a, b] = topRoute.code.split('-')}
				<li><span class="fl-k">Häufigste Strecke</span><b>{city(a)} ⇄ {city(b)}</b><span>{a} ⇄ {b} · {topRoute.n}× geflogen</span></li>
			{/if}
			{#if topAirport}<li><span class="fl-k">Meistbesuchter Flughafen</span><b>{city(topAirport.code)} ({topAirport.code})</b><span>{topAirport.n} Besuche · {nameOf(ap?.[topAirport.code]?.[2] ?? '')}</span></li>{/if}
			{#if st.legs.length}
				{@const first = st.legs[st.legs.length - 1]}
				<li><span class="fl-k">Erster Flug</span><b>{route(first)}</b><span>{longDay(first.f.date)}</span></li>
			{/if}
		</ul>
		{#if st.unknown.length}<p class="note">Ohne Strecke (Flughafen unbekannt): {st.unknown.join(', ')}</p>{/if}
	{/if}
</main>

{#if st && ap}<FlightsView {st} {ap} {al} />{/if}
