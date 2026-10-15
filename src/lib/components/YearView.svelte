<script lang="ts">
	import { atlas, isCounted } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, flag, nameOf } from '$lib/countries';
	import { EARTH_KM, flightStats, fmtDuration, fmtInt, routeKey } from '$lib/flights';
	import { fd } from '$lib/flightData.svelte';
	import { loadScenes, longDate, stamp, TIER_LABEL } from '$lib/passport';
	import { fade, fly } from 'svelte/transition';
	import { specialLevel } from '$lib/special.svelte';
	import { defaultYear, entryYear, flightsIn, newContinents, travelYears } from '$lib/travelYear';
	import { closeYear, openCountry, openRoute, reduceMotion, ui } from '$lib/app.svelte';
	import { swipeClose } from '$lib/swipeClose';

	/* Seite „Mein Reisejahr“ (öffnet über den Block auf der Startseite): was in einem Jahr neu dazukam –
	   Länder (nach Einreisedatum), neue Kontinente, seltenster neuer Stempel, Flüge des Jahres (Zählregeln wie im Tab „Flüge“). */

	const years = $derived(travelYears(atlas.data.countries, atlas.flights));
	let picked = $state<number | null>(null);
	const y = $derived(picked !== null && years.includes(picked) ? picked : defaultYear(years));
	$effect(() => {
		if (!ui.yearOpen) picked = null;
		else if (atlas.flights.length) fd.load();
	});

	// neue Länder und Gebiete des Jahres, nach Einreisemonat, sonst eigener Reihenfolge
	const fresh = $derived(
		atlas.data.countries
			.filter((c) => entryYear(c) === y)
			.map((c, i) => ({ c, i }))
			.sort((a, b) => (a.c.entered ?? '').localeCompare(b.c.entered ?? '') || a.i - b.i)
			.map((x) => x.c)
	);
	const nNew = $derived(fresh.filter((c) => isCounted(c.code)).length);
	const nArea = $derived(fresh.length - nNew);
	const conts = $derived(newContinents(atlas.data.countries, y));
	const rarest = $derived.by(() => {
		let best: { code: string; t: number } | null = null;
		for (const c of fresh) {
			const t = specialLevel(c.code);
			if (t > (best?.t ?? 0)) best = { code: c.code, t };
		}
		return best;
	});
	const undated = $derived(atlas.data.countries.filter((c) => isCounted(c.code) && !entryYear(c)).length);
	const month = (e?: string) => (e && e.length === 7 ? longDate(e).split(' ')[0] : '');

	// Flüge des Jahres; neue Flughäfen = vorher noch nie angeflogen
	const st = $derived(fd.ap ? flightStats(flightsIn(atlas.flights, y), fd.ap) : null);
	const newAirports = $derived.by(() => {
		if (!st) return 0;
		const seen = new Set<string>();
		for (const f of atlas.flights) if (!f.d.cx && +f.date.slice(0, 4) < y) seen.add(f.from).add(f.d.div || f.to);
		return st.airports.filter((a) => !seen.has(a.code)).length;
	});
	const city = (c: string) => fd.ap?.[c]?.[0] || c;
	const dec1 = (x: number) => x.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

	/* ---------- Teilen: Reisejahr als Bild (Stil wie der Pass-Umschlag, ohne Namen) ---------- */
	let share = $state<{ url: string; png: Blob } | null | 'wait'>(null);
	let shareOpen = $state(false);
	let shareMsg = $state('');
	let ycMod: typeof import('$lib/yearcard') | null = null;
	let sharing = false;
	async function makeCard() {
		const yc = (ycMod ??= await import('$lib/yearcard'));
		await loadScenes();
		if (!fd.ap && atlas.flights.length) fd.load();
		let k = 0;
		const nr = new Map(atlas.data.countries.map((c) => [c.code, isCounted(c.code) ? ++k : 0]));
		const stamps = fresh.map((c) => {
			const sp = specialLevel(c.code);
			return { code: c.code, nr: nr.get(c.code) ?? 0, sp, s: stamp(c.code, nr.get(c.code) ?? 0, c.entered, sp) };
		});
		// Länder ohne Datum gelten wie bei den Kontinenten als „schon früher“
		const nc = new Set(fresh.map((c) => CONT[c.code]).filter(Boolean)).size;
		const upTo = atlas.data.countries.filter((c) => isCounted(c.code) && entryYear(c) <= y).length;
		const since = Math.min(...atlas.data.countries.map(entryYear).filter(Boolean));
		const stats: [string, string][] = st && st.n
			? [[String(st.n), st.n === 1 ? 'Flug' : 'Flüge'], [fmtInt(st.km), 'Kilometer'], [String(st.airports.length), 'Flughäfen']]
			: [[String(nc), nc === 1 ? 'Kontinent' : 'Kontinente'], [String(upTo), `Länder bis ${y}`]];
		if (st && st.n && !nNew) stats[0] = [String(st.airlines.length), st.airlines.length === 1 ? 'Airline' : 'Airlines'];
		const l = st?.longest;
		const png = await yc.yearPng({
			year: y,
			n: nNew,
			areas: nArea,
			conts: conts.map((c) => CONT_NAMES[c]),
			flights: st?.n ?? 0,
			stats,
			stamps,
			fresh: new Set(fresh.map((c) => c.code)),
			prev: new Set(atlas.data.countries.filter((c) => entryYear(c) < y).map((c) => c.code)),
			foot: l ? `Längster Flug ${l.f.from} → ${l.to} · ${fmtInt(l.km)} km` : since < y ? `unterwegs seit ${since}` : ''
		});
		return { url: URL.createObjectURL(png), png };
	}
	function openShare() {
		shareOpen = true;
		shareMsg = '';
		share = 'wait';
		const forY = y;
		makeCard()
			.then((c) => {
				if (shareOpen && share === 'wait' && forY === y) share = c;
				else URL.revokeObjectURL(c.url);
			})
			.catch((e) => {
				console.error(e);
				shareMsg = 'Das Bild konnte nicht erstellt werden.';
			});
	}
	function closeShare() {
		shareOpen = false;
		if (share && share !== 'wait') URL.revokeObjectURL(share.url);
		share = null;
	}
	async function doShare() {
		if (!share || share === 'wait' || sharing) return;
		const sc = await import('$lib/sharecard');
		sharing = true;
		shareMsg = '';
		// sofort aufrufen (Modul ist schon geladen), sonst öffnet Safari das Teilen-Menü nicht
		const r = await sc.shareImage(share.png, `freiheit-reisejahr-${y}.png`);
		sharing = false;
		shareMsg = r === 'saved' ? 'Bild gespeichert.' : '';
	}
	$effect(() => {
		if (!ui.yearOpen && shareOpen) closeShare();
	});
	// Flugdaten fürs Bild: Strecke/Flughäfen brauchen die Flughafen-Liste
	const ready = $derived(!flightsIn(atlas.flights, y).length || !!st);

	let view: HTMLElement;
	$effect(() => {
		if (ui.yearOpen && view) {
			view.style.transform = '';
			view.style.transition = '';
			view.classList.remove('swiping', 'down');
		}
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov set-view" id="yearView" role="dialog" aria-modal="true" aria-labelledby="yearTitle" hidden={!ui.yearOpen} bind:this={view} use:swipeClose={{ onclose: () => closeYear(false), skip: (t) => !!t.closest('.pp-sheet, .pp-scrim') }}>
	<div class="ov-head lv-head">
		<button type="button" class="ov-close" id="yearClose" aria-label="Mein Reisejahr schließen" onclick={() => closeYear(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="yearTitle">Mein Reisejahr <span class="ov-of">{y}</span></h1>
		{#if years.length}
			<button type="button" class="ov-close pp-share" aria-label="Reisejahr als Bild teilen" disabled={!ready} onclick={openShare}
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg></button
			>
		{/if}
	</div>
	{#if ui.yearOpen}
		<div class="ov-body">
			{#if years.length > 1}
				<div class="continents yr-years">
					{#each years as j (j)}
						<button type="button" class="cont" aria-pressed={j === y} onclick={() => (picked = j)}><b>{j}</b></button>
					{/each}
				</div>
			{/if}

			<div class="yr-big">
				<b>{nNew}</b>
				<span>{nNew === 1 ? 'neues Land' : 'neue Länder'} {y}{#if nArea}<br />+ {nArea} {nArea === 1 ? 'Gebiet' : 'Gebiete'}{/if}</span>
			</div>
			{#if conts.length}
				<div class="yr-conts">
					{#each conts as k (k)}<span style="--cc:var(--ct-{k})"><i aria-hidden="true"></i>{CONT_NAMES[k]} – neuer Kontinent</span>{/each}
				</div>
			{/if}
			{#if rarest}
				<button type="button" class="yr-rare t{rarest.t}" onclick={() => openCountry(rarest!.code)}>
					<span class="flag">{flag(rarest.code)}</span>
					<span><small>Seltenster neuer Stempel</small>{nameOf(rarest.code)}</span>
					<em>{TIER_LABEL[rarest.t]}</em>
				</button>
			{/if}

			{#if fresh.length}
				<h2 class="list-sub">Neu im Pass</h2>
				<ul class="list yr-list">
					{#each fresh as c (c.code)}
						<li>
							<button type="button" onclick={() => openCountry(c.code)}>
								<span class="flag">{flag(c.code)}</span>
								<span class="nm">{nameOf(c.code)}</span>
								<span class="yr-m">{month(c.entered)}</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="note">In {y} ist kein neues Land dazugekommen{undated ? ' – oder das Einreisedatum fehlt noch' : ''}.</p>
			{/if}

			{#if flightsIn(atlas.flights, y).length}
				<h2 class="list-sub">Flüge {y}</h2>
				{#if st}
					<div class="fl-grid yr-grid">
						<div class="fl-stat">
							<span class="fl-k">Flüge</span>
							<b>{st.n}</b>
							<span class="fl-s">{st.airlines.length} {st.airlines.length === 1 ? 'Airline' : 'Airlines'}</span>
						</div>
						<div class="fl-stat">
							<span class="fl-k">Flughäfen</span>
							<b>{st.airports.length}</b>
							<span class="fl-s">{newAirports ? `davon ${newAirports} neu` : 'keiner neu'}</span>
						</div>
						<div class="fl-stat">
							<span class="fl-k">Strecke</span>
							<b>{fmtInt(st.km)} <small>km</small></b>
							<span class="fl-s">{dec1(st.km / EARTH_KM)}× um die Erde</span>
						</div>
						<div class="fl-stat">
							<span class="fl-k">Flugzeit</span>
							<b>{fmtDuration(st.min)}</b>
							<span class="fl-s">Gate bis Gate</span>
						</div>
					</div>
					{#if st.longest}
						{@const l = st.longest}
						<ul class="list yr-long">
							<li>
								<button type="button" onclick={() => openRoute(routeKey(l.f.from, l.to), { id: l.f.id })}>
									<span class="flag">📏</span>
									<span class="cp-txt"><span class="nm">{city(l.f.from)} → {city(l.to)}</span><span class="ct">Längster Flug · {fmtInt(l.km)} km · {fmtDuration(l.min)}</span></span>
								</button>
							</li>
						</ul>
					{/if}
				{:else}
					<p class="note">Flüge werden geladen …</p>
				{/if}
			{/if}

			{#if undated}
				<p class="note cv-note">{undated} {undated === 1 ? 'deiner Länder hat' : 'deiner Länder haben'} noch kein Einreisedatum. Trag es auf der Länderseite ein, dann erscheint das Land im richtigen Jahr.</p>
			{/if}
		</div>
	{/if}
	{#if shareOpen}
		<button type="button" class="pp-scrim" aria-label="Schließen" onclick={closeShare} transition:fade={{ duration: reduceMotion() ? 0 : 200 }}></button>
		<div class="pp-sheet pp-leg" role="dialog" aria-labelledby="yrShareT" transition:fly={{ y: 600, duration: reduceMotion() ? 0 : 240 }}>
			<button type="button" class="pp-grab" aria-label="Schließen" onclick={closeShare}><i></i></button>
			<div class="pp-leg-list">
				<h2 id="yrShareT">Reisejahr {y} teilen</h2>
				<p>Als Bild – ohne deinen Namen. Passt für WhatsApp, Instagram & Co.</p>
				<div class="pp-cardslot">
					<div class="pp-card">
						{#if share && share !== 'wait'}<img src={share.url} alt="Mein Reisejahr {y}" width="1080" height="1920" draggable="false" />{:else}<span class="pp-card-wait" aria-label="Bild wird erstellt"></span>{/if}
					</div>
				</div>
				<button type="button" class="pp-sharebtn" disabled={!share || share === 'wait'} onclick={doShare}
					><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>Bild teilen</button
				>
				{#if shareMsg}<p class="pp-sharemsg" role="status">{shareMsg}</p>{/if}
			</div>
		</div>
	{/if}
</section>
