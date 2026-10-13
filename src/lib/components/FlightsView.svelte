<script lang="ts">
	import { removeFlights } from '$lib/atlas.svelte';
	import { closeFlightsPage, openFlightsPage, openRoute, toast, ui, type FlightsPage } from '$lib/app.svelte';
	import { flag, nameOf } from '$lib/countries';
	import { flightNo, fmtDuration, fmtInt, routeKey, type Airlines, type Airports, type FlightStats, type Leg } from '$lib/flights';
	import { swipeClose } from '$lib/swipeClose';
	import SwipeRow from './SwipeRow.svelte';

	/* Vollbild-Seite im Tab „Flüge“ mit drei Reitern: Flüge (nach Jahr, neueste zuerst; Tippen = Seite zur Strecke, Wischen = Löschen),
	   Flughäfen (Besuche nach Flighty-Regel, meistbesuchte zuerst) und Airlines. Schließen per Wischen nach unten. */

	let { st, ap, al }: { st: FlightStats; ap: Airports; al: Airlines | null } = $props();

	const PAGES: [FlightsPage, string][] = [
		['flights', 'Flüge'],
		['airports', 'Flughäfen'],
		['airlines', 'Airlines']
	];
	const count = $derived(ui.flightsPage === 'airports' ? st.airports.length : ui.flightsPage === 'airlines' ? st.airlines.length : st.n);

	// Flüge nach Jahr (neueste zuerst)
	const years = $derived.by(() => {
		const m = new Map<string, Leg[]>();
		for (const l of st.legs) {
			const y = l.f.date.slice(0, 4);
			if (!m.has(y)) m.set(y, []);
			m.get(y)!.push(l);
		}
		return [...m];
	});
	const day = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', timeZone: 'UTC' });
	const city = (code: string) => ap[code]?.[0] || code;

	let view: HTMLElement;
	$effect(() => {
		if (ui.flightsPage && view) {
			view.style.transform = '';
			view.style.transition = '';
			view.classList.remove('swiping', 'down');
		}
	});
	function del(l: Leg) {
		removeFlights([l.f.id]);
		toast(`Flug ${l.f.from} → ${l.to} entfernt`);
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov set-view" id="flightsView" role="dialog" aria-modal="true" aria-labelledby="flvTitle" hidden={!ui.flightsPage} bind:this={view} use:swipeClose={{ onclose: closeFlightsPage }}>
	<div class="ov-head lv-head">
		<button type="button" class="ov-close" id="flvClose" aria-label="Schließen" onclick={closeFlightsPage}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="flvTitle">Meine {PAGES.find((p) => p[0] === ui.flightsPage)?.[1] ?? 'Flüge'} <span class="ov-of">{count}</span></h1>
	</div>
	{#if ui.flightsPage}
		<div class="ov-body">
			<div class="seg" role="group" aria-label="Ansicht">
				{#each PAGES as [p, label] (p)}
					<button type="button" aria-pressed={ui.flightsPage === p} onclick={() => openFlightsPage(p)}>{label}</button>
				{/each}
			</div>

			{#if ui.flightsPage === 'flights'}
				{#each years as [y, legs] (y)}
					<h2 class="list-sub">{y} <span class="fl-yn">{legs.filter((l) => l.done).length} Flüge</span></h2>
					<ul class="list fl-list">
						{#each legs as l (l.f.id)}
							<SwipeRow ondelete={() => del(l)}>
								<button type="button" class="fl-tap" class:off={!l.done} onclick={() => openRoute(routeKey(l.f.from, l.to), { id: l.f.id })}>
									<span class="fl-day">{day(l.f.date)}</span>
									<span class="fl-route">
										<b>{l.f.from} → {l.to}</b>
										<span>{city(l.f.from)} → {city(l.to)}{l.f.d.div ? ' (umgeleitet)' : ''}</span>
									</span>
									<span class="fl-meta">
										<span>{l.f.d.cx ? 'gestrichen' : !l.done ? 'geplant' : l.km ? `${fmtInt(l.km)} km` : ''}</span>
										<span>{flightNo(l.f, al) || (l.f.airline && al?.[l.f.airline]?.[0]) || ''}{l.done && l.min ? ` · ${fmtDuration(l.min)}` : ''}</span>
									</span>
								</button>
							</SwipeRow>
						{/each}
					</ul>
				{/each}
			{:else if ui.flightsPage === 'airports'}
				<ul class="list fl-list">
					{#each st.airports as a, i (a.code)}
						{@const x = ap[a.code]}
						<li>
							<button type="button" tabindex="-1">
								<span class="nr">{i + 1}</span>
								<span class="flag">{x ? flag(x[2]) : ''}</span>
								<span class="fl-route"><b>{city(a.code)} <small>{a.code}</small></b><span>{x ? `${x[1] || x[0]} · ${nameOf(x[2])}` : 'unbekannter Flughafen'}</span></span>
								<span class="fl-n">{a.n}×</span>
							</button>
						</li>
					{/each}
				</ul>
				<p class="note">Besuche wie in Flighty: Umsteigen unter 8 Stunden zählt als ein Besuch, längerer Aufenthalt als zwei.</p>
			{:else}
				<ul class="list fl-list">
					{#each st.airlines as a, i (a.code)}
						<li>
							<button type="button" tabindex="-1">
								<span class="nr">{i + 1}</span>
								<span class="fl-route"><b>{al?.[a.code]?.[0] ?? a.code}</b><span>{al?.[a.code]?.[1] || a.code}</span></span>
								<span class="fl-n">{a.n}×</span>
							</button>
						</li>
					{/each}
				</ul>
				{#if st.n > st.airlines.reduce((s, a) => s + a.n, 0)}<p class="note">{st.n - st.airlines.reduce((s, a) => s + a.n, 0)} Flüge ohne Airline-Angabe.</p>{/if}
			{/if}
		</div>
	{/if}
</section>
