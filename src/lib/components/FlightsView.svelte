<script lang="ts">
	import { onMount } from 'svelte';
	import { removeFlights } from '$lib/atlas.svelte';
	import { closeFlightsPage, openAirport, openRoute, toast, ui, type FlightsPage } from '$lib/app.svelte';
	import { compareNames, flag, nameOf } from '$lib/countries';
	import { flightNo, fmtDuration, fmtInt, routeKey, type Airlines, type Airports, type FlightStats, type Leg } from '$lib/flights';
	import { swipeClose } from '$lib/swipeClose';
	import SwipeRow from './SwipeRow.svelte';

	/* Vollbild-Seiten im Tab „Flüge“, je eine für Flüge, Flughäfen und Airlines (wie „Meine Länder“ auf der Welt-Seite):
	   jede mit eigener Sortierung (wird gemerkt) und Suche. Flüge: nach Jahr, Tippen = Seite zur Strecke, Wischen = Löschen,
	   „Auswählen“ = mehrere Flüge zusammen löschen. Flughäfen: Besuche nach Flighty-Regel. Schließen per Wischen nach unten. */

	let { st, ap, al }: { st: FlightStats; ap: Airports; al: Airlines | null } = $props();

	const TITLE: Record<FlightsPage, string> = { flights: 'Flüge', airports: 'Flughäfen', airlines: 'Airlines' };
	const SORTS: Record<FlightsPage, { id: string; label: string }[]> = {
		flights: [
			{ id: 'new', label: 'Neueste' },
			{ id: 'old', label: 'Älteste' },
			{ id: 'km', label: 'Längste' }
		],
		airports: [
			{ id: 'n', label: 'Besuche' },
			{ id: 'az', label: 'A–Z' },
			{ id: 'land', label: 'Land' },
			{ id: 'new', label: 'Zuletzt' }
		],
		airlines: [
			{ id: 'n', label: 'Flüge' },
			{ id: 'az', label: 'A–Z' }
		]
	};
	const SORT_KEY = 'freiheit-flights-sort';
	let sorts = $state<Record<FlightsPage, string>>({ flights: 'new', airports: 'n', airlines: 'n' });
	let filter = $state('');
	let selecting = $state(false);
	let picked = $state<string[]>([]);

	const page = $derived(ui.flightsPage || 'flights');
	const sort = $derived(sorts[page]);
	function setSort(s: string) {
		sorts[page] = s;
		try {
			localStorage.setItem(SORT_KEY, JSON.stringify(sorts));
		} catch {}
	}
	const q = $derived(filter.trim().toLowerCase());
	const has = (...t: (string | undefined)[]) => !q || t.some((x) => x && x.toLowerCase().includes(q));
	const city = (code: string) => ap[code]?.[0] || code;
	const airlineName = (c: string) => al?.[c]?.[0] ?? c;

	// Flüge
	const legs = $derived.by(() => {
		const list = st.legs.filter((l) =>
			has(l.f.from, l.to, city(l.f.from), city(l.to), l.f.date.slice(0, 4), flightNo(l.f, al), l.f.airline ? airlineName(l.f.airline) : '')
		);
		if (sort === 'old') return [...list].reverse();
		if (sort === 'km') return [...list].sort((a, b) => (b.km || 0) - (a.km || 0));
		return list;
	});
	const years = $derived.by(() => {
		if (sort === 'km') return [['', legs]] as [string, Leg[]][];
		const m = new Map<string, Leg[]>();
		for (const l of legs) {
			const y = l.f.date.slice(0, 4);
			if (!m.has(y)) m.set(y, []);
			m.get(y)!.push(l);
		}
		return [...m];
	});
	const day = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', timeZone: 'UTC' });
	const dayY = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'UTC' });

	// Flughäfen: Besuche mit Nr. nach Besuchen (feste Nummer), Anzeige nach Sortierung
	const lastVisit = $derived.by(() => {
		const m = new Map<string, string>();
		for (const l of st.legs) {
			if (!l.done) continue;
			for (const c of [l.f.from, l.to]) if (!m.has(c) || m.get(c)! < l.f.date) m.set(c, l.f.date);
		}
		return m;
	});
	const airports = $derived.by(() => {
		const list = st.airports
			.map((a, i) => ({ ...a, nr: i + 1 }))
			.filter((a) => has(a.code, city(a.code), ap[a.code]?.[1], ap[a.code] ? nameOf(ap[a.code][2]) : ''));
		const cn = (a: { code: string }) => (ap[a.code] ? nameOf(ap[a.code][2]) : '');
		if (sort === 'az') return [...list].sort((a, b) => compareNames(city(a.code), city(b.code)));
		if (sort === 'new') return [...list].sort((a, b) => (lastVisit.get(b.code) ?? '').localeCompare(lastVisit.get(a.code) ?? ''));
		if (sort === 'land') return [...list].sort((a, b) => compareNames(cn(a), cn(b)) || compareNames(city(a.code), city(b.code)));
		return list;
	});
	const airportGroups = $derived.by(() => {
		if (sort !== 'land') return [{ name: '', list: airports }];
		const m = new Map<string, typeof airports>();
		for (const a of airports) {
			const k = ap[a.code]?.[2] ?? '';
			if (!m.has(k)) m.set(k, []);
			m.get(k)!.push(a);
		}
		return [...m].map(([k, list]) => ({ name: k ? `${flag(k)} ${nameOf(k)}` : 'Unbekannt', list }));
	});

	// Airlines
	const airlines = $derived.by(() => {
		const list = st.airlines.map((a, i) => ({ ...a, nr: i + 1 })).filter((a) => has(a.code, airlineName(a.code), al?.[a.code]?.[1]));
		return sort === 'az' ? [...list].sort((a, b) => compareNames(airlineName(a.code), airlineName(b.code))) : list;
	});

	const count = $derived(page === 'airports' ? st.airports.length : page === 'airlines' ? st.airlines.length : st.n);

	const allPicked = $derived(legs.length > 0 && legs.every((l) => picked.includes(l.f.id)));
	function toggle(id: string) {
		picked = picked.includes(id) ? picked.filter((c) => c !== id) : [...picked, id];
	}
	function stopSelecting() {
		selecting = false;
		picked = [];
	}
	function deletePicked() {
		const n = picked.length;
		if (!n) return;
		if (!confirm(n === 1 ? 'Diesen Flug löschen?' : `${n} Flüge löschen?`)) return;
		removeFlights(picked);
		toast(n === 1 ? 'Flug entfernt' : `${n} Flüge entfernt`);
		stopSelecting();
	}

	let view: HTMLElement;
	$effect(() => {
		if (ui.flightsPage && view) {
			view.style.transform = '';
			view.style.transition = '';
			view.classList.remove('swiping', 'down');
		}
	});
	// Seitenwechsel bzw. Schließen: Suche und Auswahl zurücksetzen (Sortierung bleibt)
	$effect(() => {
		ui.flightsPage;
		stopSelecting();
		filter = '';
	});
	onMount(() => {
		try {
			const v = JSON.parse(localStorage.getItem(SORT_KEY) || '{}');
			for (const k of Object.keys(sorts) as FlightsPage[]) if (SORTS[k].some((x) => x.id === v[k])) sorts[k] = v[k];
		} catch {}
	});
	function del(l: Leg) {
		removeFlights([l.f.id]);
		toast(`Flug ${l.f.from} → ${l.to} entfernt`);
	}
</script>

{#snippet leg(l: Leg, withYear: boolean)}
	{@const info = [l.f.d.cx ? 'gestrichen' : !l.done ? 'geplant' : l.km ? `${fmtInt(l.km)} km` : '', (flightNo(l.f, al) || (l.f.airline && al?.[l.f.airline]?.[0]) || '') + (l.done && l.min ? ` · ${fmtDuration(l.min)}` : '')]}
	{#if selecting}
		<li class="sel-li" class:on={picked.includes(l.f.id)}>
			<button type="button" class="fl-tap" class:off={!l.done} aria-pressed={picked.includes(l.f.id)} onclick={() => toggle(l.f.id)}>
				<span class="chk" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
				<span class="fl-day">{withYear ? dayY(l.f.date) : day(l.f.date)}</span>
				<span class="fl-route"><b>{l.f.from} → {l.to}</b><span>{city(l.f.from)} → {city(l.to)}</span></span>
			</button>
		</li>
	{:else}
		<SwipeRow ondelete={() => del(l)}>
			<button type="button" class="fl-tap" class:off={!l.done} onclick={() => openRoute(routeKey(l.f.from, l.to), { id: l.f.id })}>
				<span class="fl-day">{withYear ? dayY(l.f.date) : day(l.f.date)}</span>
				<span class="fl-route">
					<b>{l.f.from} → {l.to}</b>
					<span>{city(l.f.from)} → {city(l.to)}{l.f.d.div ? ' (umgeleitet)' : ''}</span>
				</span>
				<span class="fl-meta"><span>{info[0]}</span><span>{info[1]}</span></span>
			</button>
		</SwipeRow>
	{/if}
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov set-view" id="flightsView" role="dialog" aria-modal="true" aria-labelledby="flvTitle" hidden={!ui.flightsPage} bind:this={view} use:swipeClose={{ onclose: closeFlightsPage }}>
	<div class="ov-head lv-head">
		<button type="button" class="ov-close" id="flvClose" aria-label="Schließen" onclick={closeFlightsPage}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="flvTitle">Meine {TITLE[page]} <span class="ov-of">{count}</span></h1>
		{#if page === 'flights' && st.n}
			<button type="button" class="lv-sel" onclick={() => (selecting ? stopSelecting() : (selecting = true))}>{selecting ? 'Fertig' : 'Auswählen'}</button>
		{/if}
	</div>
	{#if ui.flightsPage}
		<div class="ov-body lv-body" class:withbar={selecting}>
			<div class="seg sort-seg" role="group" aria-label="Sortierung">
				{#each SORTS[page] as s (s.id)}
					<button type="button" aria-pressed={sort === s.id} onclick={() => setSort(s.id)}>{s.label}</button>
				{/each}
			</div>
			<input class="search" type="search" placeholder={page === 'flights' ? 'Flug, Stadt oder Airline suchen' : page === 'airports' ? 'Flughafen suchen' : 'Airline suchen'} autocomplete="off" bind:value={filter} />

			{#if page === 'flights'}
				{#each years as [y, ls] (y)}
					{#if y}<h2 class="list-sub">{y} <span class="fl-yn">{ls.filter((l) => l.done).length} Flüge</span></h2>{/if}
					<ul class="list fl-list">
						{#each ls as l (l.f.id)}{@render leg(l, !y)}{/each}
					</ul>
				{/each}
				{#if !legs.length}<p class="empty">Kein Treffer.</p>{/if}
			{:else if page === 'airports'}
				{#each airportGroups as g (g.name)}
					{#if g.name}<h3 class="list-sub">{g.name} <span class="h-count">{g.list.length}</span></h3>{/if}
					<ul class="list fl-list">
						{#each g.list as a (a.code)}
							{@const x = ap[a.code]}
							<li>
								<button type="button" class="fl-tap" onclick={() => openAirport(a.code)}>
									<span class="nr">{a.nr}</span>
									<span class="flag">{x ? flag(x[2]) : ''}</span>
									<span class="fl-route"><b>{city(a.code)} <small>{a.code}</small></b><span>{x ? `${x[1] || x[0]} · ${nameOf(x[2])}` : 'unbekannter Flughafen'}</span></span>
									<span class="fl-n">{a.n}×</span>
								</button>
							</li>
						{/each}
					</ul>
				{/each}
				{#if !airports.length}<p class="empty">Kein Treffer.</p>{/if}
				<p class="note">Besuche wie in Flighty: Umsteigen unter 8 Stunden zählt als ein Besuch, längerer Aufenthalt als zwei.</p>
			{:else}
				<ul class="list fl-list">
					{#each airlines as a (a.code)}
						<li>
							<button type="button" tabindex="-1">
								<span class="nr">{a.nr}</span>
								<span class="fl-route"><b>{airlineName(a.code)}</b><span>{al?.[a.code]?.[1] || a.code}</span></span>
								<span class="fl-n">{a.n}×</span>
							</button>
						</li>
					{/each}
				</ul>
				{#if !airlines.length}<p class="empty">Kein Treffer.</p>{/if}
				{#if st.n > st.airlines.reduce((s, a) => s + a.n, 0)}<p class="note">{st.n - st.airlines.reduce((s, a) => s + a.n, 0)} Flüge ohne Airline-Angabe.</p>{/if}
			{/if}
		</div>
	{/if}
	{#if selecting}
		<div class="lv-bar" role="region" aria-label="Auswahl">
			<span class="lv-bar-n">{picked.length ? `${picked.length} ausgewählt` : 'Flüge antippen'}</span>
			<button type="button" class="btn" onclick={() => (picked = allPicked ? [] : legs.map((l) => l.f.id))}>{allPicked ? 'Keine' : 'Alle'}</button>
			<button type="button" class="btn danger" disabled={!picked.length} onclick={deletePicked}>Löschen</button>
		</div>
	{/if}
</section>
