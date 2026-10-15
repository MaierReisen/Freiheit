<script lang="ts">
	import { atlas, setCapital } from '$lib/atlas.svelte';
	import { openAirport, openCountry } from '$lib/app.svelte';
	import { flag, nameOf } from '$lib/countries';
	import { capitalNow, climateNow, factsNow, fmtArea, fmtDensity, fmtHeight, fmtPop, loadCapitals, loadClimate, loadFacts, localTime, type CapitalInfo, type Facts } from '$lib/facts';
	import { fd } from '$lib/flightData.svelte';
	import { fmtInt } from '$lib/flights';
	import { INFO } from '$lib/map/geo';
	import CountryShape from './CountryShape.svelte';
	import ClimateCard from './ClimateCard.svelte';

	/* Seite zu einer Hauptstadt (aus der Länderseite oder „Meine Hauptstädte“): Aufbau wie die Länderseite.
	   Oben Name, Land, „Besucht“ zum Abhaken und drei Schnellwerte (Ortszeit, Einwohner, Höhe); darunter Kurzbeschreibung
	   (Wikipedia), Fakten, Lage im Land, Klima der Stadt und Flughäfen in der Nähe (Tipp = Seite des Flughafens).
	   Daten: facts.json (Name, Lage, Einwohner), capitals.json (build-capitals.py), climate.json – alles nachgeladen. */

	let { code }: { code: string } = $props();

	// svelte-ignore state_referenced_locally
	let facts = $state<Facts | null>(factsNow(code));
	// svelte-ignore state_referenced_locally
	let info = $state<CapitalInfo | null | undefined>(capitalNow(code));
	$effect(() => {
		Promise.all([loadFacts(), loadCapitals(), loadClimate()]).then(([f, c]) => {
			facts = f[code] ?? {};
			info = c[code] ?? null;
		});
	});
	fd.load();

	const cap = $derived(facts?.cap?.[0] ?? '');
	const ll = $derived(facts?.capLL ?? info?.ll ?? null);
	const pop = $derived(facts?.capPop ?? (info?.p ? ([info.p, 0] as [number, number]) : null));
	const been = $derived(atlas.data.countries.some((c) => c.code === code));
	const done = $derived(atlas.settings.capitals.includes(code));

	// Ortszeit: Zeitzone der Stadt aus dem Klima (Länder mit mehreren Zonen), sonst die des Landes
	const tz = $derived(climateNow(code)?.find((p) => p[0] === cap)?.[6] ?? facts?.tz ?? null);
	let now = $state(new Date());
	$effect(() => {
		const t = setInterval(() => (now = new Date()), 20000);
		return () => clearInterval(t);
	});
	const lt = $derived(tz ? localTime(tz, now) : null);

	const founded = (y: number) => (y < 0 ? `${fmtInt(-y)} v. Chr.` : y < 1000 ? `${y} n. Chr.` : String(y));
	const wiki = $derived(info?.w ? `https://de.wikipedia.org/wiki/${encodeURIComponent(info.w.replace(/ /g, '_'))}` : '');

	// Flughäfen mit Linienverkehr bis 60 km um die Stadt, nächster zuerst
	const airports = $derived.by(() => {
		const ap = fd.ap;
		if (!ap || !ll) return [];
		const toR = Math.PI / 180;
		const out: { code: string; city: string; name: string; km: number; n: number }[] = [];
		for (const [c, a] of Object.entries(ap)) {
			if (a[6] || Math.abs(a[3] - ll[1]) > 1 || Math.abs(a[4] - ll[0]) > 1.6) continue;
			const dLat = (a[3] - ll[1]) * toR,
				dLon = (a[4] - ll[0]) * toR;
			const h = Math.sin(dLat / 2) ** 2 + Math.cos(ll[1] * toR) * Math.cos(a[3] * toR) * Math.sin(dLon / 2) ** 2;
			const km = 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
			if (km <= 60) out.push({ code: c, city: a[0], name: a[1], km, n: fd.st?.airports.find((x) => x.code === c)?.n ?? 0 });
		}
		return out.sort((a, b) => a.km - b.km).slice(0, 4);
	});
</script>

<div class="cs-peek">
	<div class="cs-head">
		<span class="rs-ico" aria-hidden="true"
			><svg viewBox="0 0 24 24"><path d="M3.5 20.5h17M5.5 20.5V13h13v7.5M9 15.5V18M12 15.5V18M15 15.5V18M8 13a4 4 0 0 1 8 0M12 9V6.5" /></svg></span
		>
		<div class="cs-title">
			<h3 id="sheetTitle" class="rs-title" class:long={cap.length > 16}>{cap}</h3>
			<div class="cs-sub">Hauptstadt · {nameOf(code)}{info?.n ? ` · ${info.n}` : ''}</div>
		</div>
	</div>

	<div class="cs-status">
		{#if been}
			<button type="button" class="cs-badge cp-been" class:been={done} aria-pressed={done} onclick={() => setCapital(code, !done)}
				><svg viewBox="0 0 24 24" aria-hidden="true">{#if done}<path d="M5 12.5l4.5 4.5L19 7.5" />{:else}<path d="M12 5v14M5 12h14" />{/if}</svg>{done ? 'Besucht' : 'Als besucht markieren'}</button
			>
		{/if}
		<button type="button" class="cs-chip rs-land" onclick={() => openCountry(code)}><span aria-hidden="true">{flag(code)}</span>{nameOf(code)}</button>
	</div>
	{#if !been}<p class="cs-note cp-hint">Trag {nameOf(code)} als bereist ein, um die Hauptstadt abzuhaken.</p>{/if}

	{#if facts}
		<div class="cs-quick">
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
				<span class="lbl">Ortszeit</span>
				<b class="nw">{lt?.time ?? '–'}</b>
				{#if lt}<span class="sub">{#if lt.diff}<em>{lt.diff}</em>{:else}wie DE{/if}</span>{/if}
			</div>
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.7.8 2.8 2.6 3 5.2" /></svg>
				<span class="lbl">Einwohner</span>
				<b class="nw">{pop ? fmtPop(pop[0]) : '–'}</b>
				{#if pop?.[1]}<span class="sub">Stand {pop[1]}</span>{/if}
			</div>
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19l6-10 4 6 3-4 5 8z" /></svg>
				<span class="lbl">Höhe</span>
				<b class="nw">{info?.e != null ? fmtHeight(info.e) : '–'}</b>
				<span class="sub">über dem Meer</span>
			</div>
		</div>
	{/if}
</div>

<div class="cs-body">
	{#if info?.x}
		<p class="cp-desc">{info.x}</p>
		<a class="cp-src" href={wiki} target="_blank" rel="noopener">Mehr auf Wikipedia</a>
	{/if}

	{#if info && (info.a || info.f != null || facts?.cap?.length)}
		<h4 class="cs-h">Fakten</h4>
		<div class="cs-grid">
			{#if info.f != null}
				<div class="cs-tile">
					<span class="lbl">Gegründet</span>
					<b>{founded(info.f)}</b>
				</div>
			{/if}
			{#if info.a}
				<div class="cs-tile">
					<span class="lbl">Fläche</span>
					<b>{fmtArea(info.a)}</b>
					{#if pop}<span class="sub">{fmtDensity(pop[0], info.a)}</span>{/if}
				</div>
			{/if}
			{#if facts?.cap && facts.cap.length > 1}
				<div class="cs-tile wide">
					<span class="lbl">Weitere Hauptstädte</span>
					<b class="cs-list">{facts.cap.slice(1).join(', ')}</b>
				</div>
			{/if}
		</div>
	{/if}

	{#if INFO[code] && ll}
		<h4 class="cs-h">Lage im Land</h4>
		<div class="cs-map"><CountryShape {code} {been} {facts} spot={ll} /></div>
	{/if}

	{#if cap}
		<div class="cs-grid cp-clim"><ClimateCard {code} only={cap} /></div>
	{/if}

	{#if airports.length}
		<h4 class="cs-h">Flughäfen in der Nähe</h4>
		<ul class="list fl-list">
			{#each airports as a (a.code)}
				<li>
					<button type="button" class="fl-tap" onclick={() => openAirport(a.code)}>
						<span class="flag cp-iata">{a.code}</span>
						<span class="fl-route"><b>{a.name || a.city}</b><span>{fmtInt(Math.round(a.km))} km vom Zentrum</span></span>
						{#if a.n}<span class="fl-n">{a.n}×</span>{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<p class="cs-src">Daten: Wikidata, Wikipedia (CC BY-SA), TerraClimate, OurAirports</p>
</div>
