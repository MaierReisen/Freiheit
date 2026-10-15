<script lang="ts">
	import { openAddFlight, openCountry, openRoute } from '$lib/app.svelte';
	import { flag, nameOf } from '$lib/countries';
	import { fd } from '$lib/flightData.svelte';
	import { fmtInt, loadAirportInfo, routeKey, type AirportInfo } from '$lib/flights';

	/* Seite zu einem Flughafen (aus der Strecken-Seite oder der Liste „Flughäfen“): Aufbau wie die Länderseite.
	   Oben Name, Besuche, „Flug ab hier“ und drei Schnellwerte (Ortszeit, Passagiere, Höhe); darunter die eigenen
	   Strecken von/nach hier (Tipp = Seite der Strecke), erster/letzter Besuch, Airlines und Fakten (Größe, Landebahnen,
	   Eröffnung, Wikipedia). Fakten kommen aus airportinfo.json (nachgeladen, erst beim Öffnen). */

	let { code }: { code: string } = $props();

	fd.load();
	const ap = $derived(fd.ap);
	const al = $derived(fd.al);
	const x = $derived(ap?.[code]);
	let info = $state<AirportInfo | null>(null);
	$effect(() => {
		loadAirportInfo()
			.then((m) => (info = m[code] ?? null))
			.catch(() => {});
	});

	const visits = $derived(fd.st?.airports.find((a) => a.code === code)?.n ?? 0);
	// geflogene Flüge von/nach hier (älteste zuerst)
	const legs = $derived((fd.st?.legs ?? []).filter((l) => l.done && (l.f.from === code || l.to === code)).reverse());
	const routes = $derived(
		(fd.st?.routes ?? [])
			.filter((r) => r.code.split('-').includes(code))
			.map((r) => ({ key: r.code, n: r.n, other: r.code.split('-').find((c) => c !== code) ?? code, km: legs.find((l) => routeKey(l.f.from, l.to) === r.code)?.km ?? 0 }))
	);
	const airlines = $derived.by(() => {
		const m = new Map<string, number>();
		for (const l of legs) if (l.f.airline) m.set(l.f.airline, (m.get(l.f.airline) ?? 0) + 1);
		return [...m].sort((a, b) => b[1] - a[1]).map(([c]) => al?.[c]?.[0] ?? c);
	});
	const day = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
	const city = (c: string) => ap?.[c]?.[0] || c;

	// Ortszeit, jede halbe Minute neu
	let now = $state(Date.now());
	$effect(() => {
		const t = setInterval(() => (now = Date.now()), 30000);
		return () => clearInterval(t);
	});
	const localTime = $derived(x ? new Date(now).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: x[5] }) : '');
	/** Zeitunterschied zu hier (Stunden) */
	const diff = $derived.by(() => {
		if (!x) return 0;
		const at = (tz?: string) => Date.parse(new Date(now).toLocaleString('en-US', { timeZone: tz }));
		try {
			return Math.round(((at(x[5]) - at()) / 36e5) * 2) / 2;
		} catch {
			return 0;
		}
	});
	const fmtDiff = (h: number) => (h ? `${h > 0 ? '+' : '−'}${String(Math.abs(h)).replace('.', ',')} Std zu dir` : 'gleiche Zeit wie bei dir');
	const pax = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mio.` : fmtInt(n));
	const SIZE = { L: 'Großflughafen', M: 'Mittlerer Flughafen', S: 'Kleiner Flughafen' };
	const wiki = $derived(info?.[7] ? (info[7].startsWith('en:') ? `https://en.wikipedia.org/wiki/${encodeURIComponent(info[7].slice(3))}` : `https://de.wikipedia.org/wiki/${encodeURIComponent(info[7])}`) : '');
</script>

<div class="cs-peek">
	<div class="cs-head">
		<span class="rs-ico" aria-hidden="true"
			><svg viewBox="0 0 24 24"><path d="M10 21V11h4v10M8.5 11h7l-1-3h-5zM12 8V5M9 5h6M5 21h14" /></svg></span
		>
		<div class="cs-title">
			<h3 id="sheetTitle" class="rs-title" class:long={city(code).length > 16}>{city(code)}</h3>
			<div class="cs-sub">{x?.[1] ? `${x[1]} · ` : ''}{code}{info?.[4] ? ` / ${info[4]}` : ''}</div>
		</div>
	</div>

	{#if x}
		<div class="cs-status">
			{#if visits}
				<span class="cs-badge been"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{visits}× besucht</span>
			{/if}
			{#if !x[6]}
				<button type="button" class="cs-badge rs-add" onclick={() => openAddFlight(code)}
					><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Flug ab hier</button
				>
			{/if}
			<button type="button" class="cs-chip rs-land" onclick={() => openCountry(x[2])}><span aria-hidden="true">{flag(x[2])}</span>{nameOf(x[2])}</button>
		</div>

		<div class="cs-quick">
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
				<span class="lbl">Ortszeit</span>
				<b class="nw">{localTime}</b>
				<span class="sub">{fmtDiff(diff)}</span>
			</div>
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M16 5.5a3 3 0 0 1 0 5.5M17.5 14c1.8.6 2.8 2.3 3 5" /></svg>
				<span class="lbl">Passagiere</span>
				<b class="nw">{info?.[5] ? pax(info[5]) : '–'}</b>
				{#if info?.[5]}<span class="sub">im Jahr {info[6]}</span>{/if}
			</div>
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19l6-10 4 6 3-4 5 8z" /></svg>
				<span class="lbl">Höhe</span>
				<b class="nw">{info?.[1] != null ? `${fmtInt(info[1])} m` : '–'}</b>
				<span class="sub">über dem Meer</span>
			</div>
		</div>
	{/if}
</div>

<div class="cs-body">
	{#if x?.[6]}
		<p class="cs-note">Dieser Flughafen ist seit {day(x[6])} geschlossen.</p>
	{/if}

	{#if routes.length}
		<h4 class="cs-h">Deine Strecken <span>{routes.length}</span></h4>
		<ul class="list fl-list">
			{#each routes as r (r.key)}
				{@const o = ap?.[r.other]}
				<li>
					<button type="button" class="fl-tap" onclick={() => openRoute(r.key)}>
						<span class="flag">{o ? flag(o[2]) : ''}</span>
						<span class="fl-route"><b>{city(r.other)} <small>{r.other}</small></b><span>{r.km ? `${fmtInt(r.km)} km` : ''}</span></span>
						<span class="fl-n">{r.n}×</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if legs.length}
		<h4 class="cs-h">Deine Besuche</h4>
		<div class="cs-grid">
			<div class="cs-tile">
				<span class="lbl">Zuerst</span>
				<b>{day(legs[0].f.date)}</b>
			</div>
			<div class="cs-tile">
				<span class="lbl">Zuletzt</span>
				<b>{day(legs[legs.length - 1].f.date)}</b>
			</div>
			{#if airlines.length}
				<div class="cs-tile wide">
					<span class="lbl">Airlines</span>
					<b class="cs-list">{airlines.slice(0, 5).join(', ')}{airlines.length > 5 ? ` und ${airlines.length - 5} weitere` : ''}</b>
				</div>
			{/if}
		</div>
	{/if}

	{#if info || x?.[7]}
		<h4 class="cs-h">Fakten</h4>
		<div class="cs-grid">
			{#if info}
				<div class="cs-tile">
					<span class="lbl">Größe</span>
					<b>{SIZE[info[0]]}</b>
				</div>
				<div class="cs-tile">
					<span class="lbl">Landebahnen</span>
					<b>{info[2] || '–'}</b>
					{#if info[3]}<span class="sub">längste {fmtInt(info[3])} m</span>{/if}
				</div>
			{/if}
			{#if x?.[7]}
				<div class="cs-tile">
					<span class="lbl">Eröffnet</span>
					<b>{day(x[7])}</b>
				</div>
			{/if}
			{#if wiki}
				<div class="cs-tile" class:wide={!x?.[7]}>
					<span class="lbl">Mehr lesen</span>
					<a class="cs-chip rs-land" href={wiki} target="_blank" rel="noopener">Wikipedia{info?.[7].startsWith('en:') ? ' (englisch)' : ''}</a>
				</div>
			{/if}
		</div>
	{/if}
</div>
