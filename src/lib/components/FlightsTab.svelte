<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { atlas } from '$lib/atlas.svelte';
	import { openFlightsPage, ui } from '$lib/app.svelte';
	import { flag, nameOf } from '$lib/countries';
	import { fd } from '$lib/flightData.svelte';
	import { EARTH_KM, MOON_KM, fmtDuration, fmtInt, type Leg } from '$lib/flights';
	import FlightsView from './FlightsView.svelte';

	/* Tab „Flüge“ unter dem Globus: 4 Werte wie im Flighty-Pass (Strecke, Flugzeit, Flughäfen, Airlines),
	   darunter Zeilen zu den Listen (Vollbild) und Rekorde. Kopf mit Zahl und „+ Flug“: FlightsHero.
	   Flughafen- und Airline-Liste werden erst nachgeladen (beim Öffnen des Tabs bzw. im Leerlauf). */

	$effect(() => {
		if (ui.tab === 'flights') {
			untrack(() => {
				fd.load();
				fd.tick();
			});
		}
	});
	onMount(() => {
		// im Leerlauf vorbereiten, damit der Tab sofort fertig ist
		const t = setTimeout(() => (window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1)))(() => fd.load()), 4000);
		const onVis = () => {
			if (!document.hidden && ui.tab === 'flights') fd.tick();
		};
		document.addEventListener('visibilitychange', onVis);
		return () => {
			clearTimeout(t);
			document.removeEventListener('visibilitychange', onVis);
		};
	});

	const st = $derived(fd.st);
	const ap = $derived(fd.ap);
	const al = $derived(fd.al);
	const city = (code: string) => ap?.[code]?.[0] || code;
	const route = (l: Leg) => `${city(l.f.from)} → ${city(l.to)}`;
	const dec1 = (x: number) => x.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
	const lastLeg = $derived(st?.legs.find((l) => l.done) ?? null);
	const longDay = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	const topAirport = $derived(st?.airports[0]);
	const topRoute = $derived(st?.routes[0]);
</script>

<main class="tab" id="tab-flights" data-pane="flights" hidden={ui.tab !== 'flights'}>
	{#if !atlas.flights.length}
		<div class="card fl-empty">
			<h2>Deine Flüge</h2>
			<ol>
				<li>Oben auf <b>+ Flug</b> tippen und Datum, Von und Nach eintragen.</li>
				<li>Oder alle Flüge aus Flighty übernehmen: in Flighty die Flüge <b>exportieren</b> (CSV-Datei), dann hier <b>Einstellungen → Flüge → Aus Flighty importieren</b>.</li>
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
				<span class="fl-k">Flugzeit</span>
				<b>{fmtDuration(st.min)}</b>
				<span class="fl-s">{st.estimated ? `${st.estimated} von ${st.n} Flugzeiten geschätzt` : 'Gate bis Gate'}</span>
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
