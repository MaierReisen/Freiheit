<script lang="ts">
	import { addCountry, atlas, countedCountries, isCounted, removeCountry, visitedSet } from '$lib/atlas.svelte';
	import { SCOPES, inScope } from '$lib/scope';
	import { contOf, flag, nameOf } from '$lib/countries';
	import { closeSheet, hooks, openCountry, reduceMotion, setSheetDetent, ui } from '$lib/app.svelte';
	import { compareArea, currencies, factsNow, fmtArea, fmtAreaShort, fmtDensity, fmtHeight, fmtPop, languages, loadFacts, localTime, type Facts } from '$lib/facts';
	import { fmtMoney, fmtRateDate, getRates, type Rates } from '$lib/rates';
	import CountryShape from './CountryShape.svelte';

	/* Länderseite: oben die kompakte Karte (Name, Status, „Als bereist markieren“, drei Schnellfakten) – sie ist auch
	   die „peek“-Stufe über dem Globus. Darunter (nach oben ziehen) Kartenausschnitt, Fakten und Nachbarländer. */

	let { code }: { code: string } = $props();

	const entry = $derived(atlas.data.countries.find((c) => c.code === code));
	const been = $derived(!!entry);
	const counted = $derived(isCounted(code));
	const nr = $derived(countedCountries().findIndex((c) => c.code === code) + 1);
	// Gebiet (zählt in keiner Liste) oder Staat außerhalb der gewählten Liste (z. B. Kosovo bei „UN-Mitglieder“)
	const why = $derived(
		counted
			? ''
			: inScope(code, 'sovereign')
				? `zählt bei „${SCOPES.find((x) => x.id === atlas.settings.countryScope)?.label}“ nicht als Land`
				: 'Gebiet, zählt nicht als eigenes Land'
	);
	const name = $derived(entry?.name || nameOf(code));

	// Fakten (beim ersten Mal nachgeladen)
	// svelte-ignore state_referenced_locally
	let facts = $state<Facts | null>(factsNow(code));
	$effect(() => {
		if (facts) return;
		loadFacts().then((all) => (facts = all[code] ?? {}));
	});
	let now = $state(new Date());
	$effect(() => {
		const t = setInterval(() => (now = new Date()), 20000);
		return () => clearInterval(t);
	});
	const lt = $derived(facts?.tz ? localTime(facts.tz, now) : null);
	const langs = $derived(languages(facts?.lang));
	const curs = $derived(currencies(facts?.cur));
	const visited = $derived(visitedSet());
	// Währungsrechner: tagesaktueller Kurs zum Euro (erste Währung mit Kurs)
	let rates = $state<Rates | null>(null);
	let ratesFailed = $state(false);
	$effect(() => {
		if (!curs.length || curs.every((c) => c.code === 'EUR')) return;
		getRates().then((r) => (r ? (rates = r) : (ratesFailed = true)));
	});
	const fx = $derived.by(() => {
		if (!rates) return null;
		const c = curs.find((x) => x.code !== 'EUR' && rates!.rates[x.code.toLowerCase()]);
		return c ? { ...c, rate: rates.rates[c.code.toLowerCase()] } : null;
	});
	let amount = $state('100');
	let fromEur = $state(true);
	const amountNum = $derived(Number(amount.replace(/\./g, '').replace(',', '.')) || 0);
	const converted = $derived(fx ? (fromEur ? amountNum * fx.rate : amountNum / fx.rate) : 0);
	const unit = (eur: boolean) => (eur ? '€' : fx?.sym || fx?.code || '');

	const neighbours = $derived((facts?.nb ?? []).map((c) => ({ code: c, name: nameOf(c), been: visited.has(c) })).sort((a, b) => a.name.localeCompare(b.name, 'de')));
	const nbBeen = $derived(neighbours.filter((n) => n.been).length);

	// Höhe der kompakten Karte melden (für die „peek“-Stufe des Sheets)
	let peekEl: HTMLDivElement;
	$effect(() => {
		const measure = () => (ui.sheetPeek = Math.round(peekEl.offsetTop + peekEl.offsetHeight + 14));
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(peekEl);
		return () => ro.disconnect();
	});

	let busy = $state(false);
	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
	/** Sheet gleitet weg, die Seite rollt nach oben – dann laufen Länderzahl, Flugkurve und Globus-Leuchten sichtbar */
	async function markVisited() {
		if (busy) return;
		busy = true;
		await sleep(reduceMotion() ? 0 : 160); // kurz die gedrückte Taste zeigen
		closeSheet();
		if (!ui.full && window.scrollY > 4) {
			window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
			await sleep(reduceMotion() ? 0 : 480);
		}
		addCountry(code);
	}
	function remove() {
		removeCountry(code);
		closeSheet();
	}
	function goNeighbour(c: string) {
		hooks.map?.flyToCountry(c, { ms: 900 });
		openCountry(c, { peek: true });
	}
</script>

<div class="cs-peek" bind:this={peekEl}>
	<div class="cs-head">
		<span class="cs-flag" aria-hidden="true">{flag(code)}</span>
		<div class="cs-title">
			<h3 id="sheetTitle">{name}</h3>
			<div class="cs-sub">{contOf(code)}{facts?.cap?.length ? ` · ${facts.cap[0]}` : ''}</div>
		</div>
		{#if ui.sheetDetent === 'peek'}
			<button type="button" class="cs-more" aria-label="Alle Fakten anzeigen" onclick={() => setSheetDetent('full')}
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg></button
			>
		{/if}
	</div>

	<div class="cs-status">
		{#if been}
			<span class="cs-badge been"
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Bereist{counted ? ` · Land Nr. ${nr}` : ''}</span
			>
		{:else}
			<span class="cs-badge">Noch nicht bereist</span>
		{/if}
		{#if why}<span class="cs-why">{why}</span>{/if}
	</div>

	{#if !been}
		<button type="button" class="cs-mark" class:busy disabled={busy} onclick={markVisited}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Als bereist markieren</button
		>
	{/if}

	{#if facts && (facts.pop || facts.area || lt)}
		<div class="cs-quick">
			{#if facts.pop}<div><b>{fmtPop(facts.pop)}</b><span>Einwohner</span></div>{/if}
			{#if facts.area}<div><b>{fmtAreaShort(facts.area)}</b><span>Fläche</span></div>{/if}
			{#if lt}<div><b>{lt.time}</b><span>Ortszeit</span></div>{/if}
		</div>
	{/if}
</div>

<div class="cs-body">
	<div class="cs-map"><CountryShape {code} {been} /></div>

	{#if facts}
		<div class="cs-grid">
			{#if facts.cap?.length}
				<div class="cs-tile wide">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" /></svg>
					<span class="lbl">Hauptstadt</span>
					<b>{facts.cap.join(', ')}</b>
					{#if lt}<span class="sub">Ortszeit {lt.time} · {lt.diff}</span>{/if}
				</div>
			{/if}
			{#if facts.pop}
				<div class="cs-tile">
					<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.7.8 2.8 2.6 3 5.2" /></svg>
					<span class="lbl">Einwohner</span>
					<b>{fmtPop(facts.pop)}</b>
					{#if facts.area}<span class="sub">{fmtDensity(facts.pop, facts.area)}</span>{/if}
				</div>
			{/if}
			{#if facts.area}
				<div class="cs-tile">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6M15 4h5v5M9 20H4v-5" /></svg>
					<span class="lbl">Fläche</span>
					<b>{fmtArea(facts.area)}</b>
					{#if compareArea(code, facts.area)}<span class="sub">{compareArea(code, facts.area)}</span>{/if}
				</div>
			{/if}
			{#if facts.peak}
				<div class="cs-tile">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20l6.5-11 4 6.5L16 12l5 8z" /><path d="M8 11.5l1.5 1.5L11 11.5" /></svg>
					<span class="lbl">Höchster Berg</span>
					<b class="cs-list">{facts.peak[0]}</b>
					<span class="sub">{fmtHeight(facts.peak[1])}</span>
				</div>
			{/if}
			{#if langs.length}
				<div class="cs-tile">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></svg>
					<span class="lbl">{langs.length > 1 ? 'Sprachen' : 'Sprache'}</span>
					<b class="cs-list">{langs.slice(0, 4).join(', ')}{langs.length > 4 ? ` +${langs.length - 4}` : ''}</b>
				</div>
			{/if}
			{#if curs.length}
				<div class="cs-tile wide cs-fx">
					<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M14.8 9.2c-.6-.8-1.6-1.2-2.8-1.2-1.7 0-3 .9-3 2.2 0 2.9 6 1.4 6 4.4 0 1.3-1.3 2.2-3 2.2-1.3 0-2.4-.5-3-1.4M12 6v2M12 16.8V18" /></svg>
					<span class="lbl">Währung</span>
					<b class="cs-list">{curs.map((c) => c.name + (c.sym ? ` (${c.sym})` : '')).join(', ')}</b>
					{#if curs.every((c) => c.code === 'EUR')}
						<span class="sub">wie zu Hause – kein Umrechnen nötig</span>
					{:else if fx}
						<span class="sub">1 € = {fmtMoney(fx.rate)} {unit(false)} · 1 {unit(false)} = {fmtMoney(1 / fx.rate)} €</span>
						<div class="fx-row">
							<label class="fx-in"
								><input type="text" inputmode="decimal" aria-label="Betrag in {fromEur ? 'Euro' : fx.name}" bind:value={amount} /><span>{unit(fromEur)}</span></label
							>
							<button type="button" class="fx-swap" aria-label="Richtung tauschen" onclick={() => (fromEur = !fromEur)}
								><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h12l-3-3M17 17H5l3 3" /></svg></button
							>
							<div class="fx-out"><b>{fmtMoney(converted)}</b><span>{unit(!fromEur)}</span></div>
						</div>
						<span class="sub fx-date">Kurs vom {fmtRateDate(rates!.date)}{rates!.stale ? ' (offline, letzter Stand)' : ''}</span>
					{:else if ratesFailed}
						<span class="sub">Kurs gerade nicht verfügbar</span>
					{:else}
						<span class="sub">Kurs wird geladen …</span>
					{/if}
				</div>
			{/if}
			{#if facts.drive}
				<div class="cs-tile">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21L9 3M18 21L15 3M12 4v3M12 10v3M12 16v3" /></svg>
					<span class="lbl">Verkehr</span>
					<b>{facts.drive === 'l' ? 'Linksverkehr' : 'Rechtsverkehr'}</b>
					{#if facts.drive === 'l'}<span class="sub warn">anders als in Deutschland</span>{/if}
				</div>
			{/if}
			{#if facts.call}
				<div class="cs-tile">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" /></svg>
					<span class="lbl">Vorwahl</span>
					<b>{facts.call}</b>
				</div>
			{/if}
			{#if (facts.tzn ?? 0) > 1 || facts.land}
				<div class="cs-tile">
					<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
					<span class="lbl">{(facts.tzn ?? 0) > 1 ? 'Zeitzonen' : 'Lage'}</span>
					<b>{(facts.tzn ?? 0) > 1 ? `${facts.tzn} Zeitzonen` : 'Binnenland'}</b>
					{#if (facts.tzn ?? 0) > 1 && facts.land}<span class="sub">Binnenland</span>{/if}
				</div>
			{/if}
		</div>

		{#if neighbours.length}
			<h4 class="cs-h">Nachbarländer <span>{nbBeen} von {neighbours.length} bereist</span></h4>
			<div class="cs-nb">
				{#each neighbours as n (n.code)}
					<button type="button" class="cs-chip" class:been={n.been} onclick={() => goNeighbour(n.code)}><span aria-hidden="true">{flag(n.code)}</span>{n.name}</button>
				{/each}
			</div>
		{:else if facts.cap}
			<p class="cs-note">Keine Landgrenzen – nur über See oder Luft erreichbar</p>
		{/if}
	{:else}
		<p class="cs-note">Fakten werden geladen …</p>
	{/if}

	{#if been}
		<button type="button" class="cs-remove" onclick={remove}>Aus Liste entfernen</button>
	{/if}
	<p class="cs-src">Daten: Wikidata, mledoze/countries (ODbL), IANA-Zeitzonen · Kurse: fawazahmed0/currency-api</p>
</div>
