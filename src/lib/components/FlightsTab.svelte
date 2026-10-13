<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { atlas } from '$lib/atlas.svelte';
	import { openFlightsPage, openPass, ui } from '$lib/app.svelte';
	import { badgeLevels, tierName } from '$lib/badges';
	import { flightBadges } from '$lib/flightBadges';
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
	const topAirport = $derived(st?.airports[0]);
	const topAirline = $derived(st?.airlines[0] ? `${st.airlines.length} Airlines · ${al?.[st.airlines[0].code]?.[0] ?? st.airlines[0].code} ${st.airlines[0].n}× geflogen` : 'keine Angaben');
	const topRoute = $derived(st?.routes[0]);
	// nördlichster / südlichster besuchter Flughafen (nach Breitengrad)
	const byLat = $derived(ap && st ? st.airports.filter((a) => ap[a.code]).sort((a, b) => ap[b.code][3] - ap[a.code][3]) : []);
	const north = $derived(byLat[0]?.code);
	// Flug-Abzeichen (Pass, Gruppe „Flüge“): Stand und die am weitesten gekommenen als Vorschau
	const fb = $derived(st && ap ? flightBadges({ st, ap, al }) : []);
	const fbTop = $derived(fb.filter((b) => b.level).sort((a, b) => b.level / b.tiers.length - a.level / a.tiers.length || b.p - a.p).slice(0, 3));
	const fbSub = $derived.by(() => {
		const n = [3, 2, 1].map((t) => fb.filter((b) => b.level && b.level + 3 - b.tiers.length === t).length);
		const parts = ['Gold', 'Silber', 'Bronze'].map((name, i) => (n[i] ? `${n[i]} ${name}` : '')).filter(Boolean);
		return parts.length ? parts.join(' · ') : `${badgeLevels(fb)} von ${fb.reduce((s, b) => s + b.tiers.length, 0)} Stufen`;
	});
	function showBadges() {
		ui.passGroup = 'flug';
		openPass();
	}
	const south = $derived(byLat.length > 1 ? byLat[byLat.length - 1].code : undefined);
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
				<span class="fl-s">Gate bis Gate</span>
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
				<span class="cat-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3.5 8.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v1.9a1.9 1.9 0 0 0 0 3.7v1.9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-1.9a1.9 1.9 0 0 0 0-3.7zM15 7.5v1.2M15 11.4v1.2M15 15.3v1.2M7.5 10.5h4M7.5 13.5h2.5" /></svg></span>
				<span class="cat-txt">
					<span class="cat-name">Airlines</span>
					<span class="cat-sub">{topAirline}</span>
				</span>
			</button>
			{#if fb.length}
				<button type="button" class="cat-row" onclick={showBadges}>
					<span class="cat-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8.5 3h7l-2 6h-3zM12 21a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM12 13l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" /></svg></span>
					<span class="cat-txt">
						<span class="cat-name">Abzeichen</span>
						<span class="cat-sub">{fbSub}</span>
					</span>
					<span class="cat-flags" aria-label={fbTop.map((b) => `${b.name} (${tierName(b, b.level)})`).join(', ')}>{#each fbTop as b (b.id)}<span>{b.icon}</span>{/each}</span>
				</button>
			{/if}
		</div>

		<h2 class="blocks-h">Rekorde</h2>
		<ul class="cats fl-rec">
			{#if st.longest}<li><span class="fl-k">📏 Längster Flug</span><b>{route(st.longest)}</b><span class="fl-d">{fmtInt(st.longest.km)} km · {fmtDuration(st.longest.min)}</span></li>{/if}
			{#if st.shortest}<li><span class="fl-k">🤏 Kürzester Flug</span><b>{route(st.shortest)}</b><span class="fl-d">{fmtInt(st.shortest.km)} km · {fmtDuration(st.shortest.min)}</span></li>{/if}
			{#if topRoute}
				{@const [a, b] = topRoute.code.split('-')}
				<li><span class="fl-k">🔁 Häufigste Strecke</span><b>{city(a)} ⇄ {city(b)}</b><span class="fl-d">{a} ⇄ {b} · {topRoute.n}× geflogen</span></li>
			{/if}
			{#if topAirport}<li><span class="fl-k">📍 Meistbesuchter Flughafen</span><b>{city(topAirport.code)} ({topAirport.code})</b><span class="fl-d">{topAirport.n} Besuche · {nameOf(ap?.[topAirport.code]?.[2] ?? '')}</span></li>{/if}
			{#if north}<li><span class="fl-k">🧭 Nördlichster Flughafen</span><b>{city(north)} ({north})</b><span class="fl-d">{dec1(Math.abs(ap?.[north]?.[3] ?? 0))}° N · {nameOf(ap?.[north]?.[2] ?? '')}</span></li>{/if}
			{#if south}<li><span class="fl-k">🐧 Südlichster Flughafen</span><b>{city(south)} ({south})</b><span class="fl-d">{dec1(Math.abs(ap?.[south]?.[3] ?? 0))}° {(ap?.[south]?.[3] ?? 0) < 0 ? 'S' : 'N'} · {nameOf(ap?.[south]?.[2] ?? '')}</span></li>{/if}
		</ul>
		{#if st.unknown.length}<p class="note">Ohne Strecke (Flughafen unbekannt): {st.unknown.join(', ')}</p>{/if}
	{/if}
</main>

{#if st && ap}<FlightsView {st} {ap} {al} />{/if}
