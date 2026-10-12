<script lang="ts">
	import { tick } from 'svelte';
	import { removeFlights } from '$lib/atlas.svelte';
	import { closeSheet, openAddFlight, openCountry, setSheetDetent, toast, ui } from '$lib/app.svelte';
	import { flag, nameOf } from '$lib/countries';
	import { fd } from '$lib/flightData.svelte';
	import { EARTH_KM, flightNo, fmtDuration, fmtInt, routeKey, type Leg } from '$lib/flights';

	/* Seite zu einer Flugstrecke (Bogen auf dem Globus angetippt oder Flug in der Liste): Aufbau wie die Länderseite.
	   Oben die kompakte Karte (Städte, Anzahl, „+ Flug“, drei Schnellwerte) – auch die „peek“-Stufe über dem Globus.
	   Darunter alle Flüge dieser Strecke (beide Richtungen, neueste zuerst; je „Entfernen“) und die beiden Flughäfen. */

	let { key, id }: { key: string; id?: string } = $props();

	const ap = $derived(fd.ap);
	const al = $derived(fd.al);
	const legs = $derived((fd.st?.legs ?? []).filter((l) => routeKey(l.f.from, l.to) === key));
	const done = $derived(legs.filter((l) => l.done));
	// Richtung wie beim angetippten bzw. letzten Flug
	const ref = $derived(legs.find((l) => l.f.id === id) ?? done[0] ?? legs[0]);
	const [a, b] = $derived(ref ? [ref.f.from, ref.to] : key.split('-'));
	const city = (c: string) => ap?.[c]?.[0] || c;
	const km = $derived(ref?.km ?? 0);
	const avgMin = $derived.by(() => {
		const list = done.length ? done : legs;
		return list.length ? list.reduce((s, l) => s + l.min, 0) / list.length : 0;
	});
	const est = $derived((done.length ? done : legs).every((l) => l.est));
	const longDay = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	const shortDay = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
	/** Abflug- und Ankunftszeit (Ortszeit, tatsächlich vor geplant); „+1“, wenn die Ankunft auf einen späteren Tag fällt */
	function times(l: Leg) {
		const d = l.f.d,
			dep = d.gda || d.gds || d.ofa || d.ofs,
			arr = d.gaa || d.gas || d.ona || d.ons;
		if ((!dep || dep.endsWith('T00:00')) && !arr) return ''; // nur Datum, keine Uhrzeit
		const plus = dep && arr ? Math.round((Date.parse(arr.slice(0, 10)) - Date.parse(dep.slice(0, 10))) / 864e5) : 0;
		return `${dep ? dep.slice(11, 16) : '–'} → ${arr ? arr.slice(11, 16) : '–'}${plus > 0 ? ` (+${plus})` : ''}`;
	}
	const extras = (l: Leg) => [l.f.d.ac, l.f.d.cab, l.f.d.seat && `Platz ${l.f.d.seat}`].filter(Boolean).join(' · ');
	const status = (l: Leg) => (l.f.d.cx ? 'gestrichen' : !l.done ? 'geplant' : l.f.d.div ? `umgeleitet nach ${l.to}` : '');

	// Höhe der kompakten Karte melden (für die „peek“-Stufe des Sheets)
	let peekEl: HTMLDivElement;
	$effect(() => {
		const measure = () => (ui.sheetPeek = Math.round(peekEl.offsetTop + peekEl.offsetHeight + 14));
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(peekEl);
		return () => ro.disconnect();
	});
	// Jahr gewählt, Strecke aber in dem Jahr nicht geflogen: Filter aufheben, damit der Bogen sichtbar und hervorgehoben ist
	$effect(() => {
		const y = fd.year;
		if (y !== null && legs.length && !legs.some((l) => +l.f.date.slice(0, 4) === y && l.done && !l.f.d.cx)) fd.year = null;
	});
	// aus der Liste geöffnet: angetippten Flug zeigen
	$effect(() => {
		if (!id || ui.sheetDetent !== 'full') return;
		tick().then(() => document.querySelector(`[data-flight="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' }));
	});

	function remove(l: Leg) {
		const last = legs.length <= 1; // vor dem Löschen zählen (legs wird danach sofort neu berechnet)
		removeFlights([l.f.id]);
		toast(`Flug ${l.f.from} → ${l.to} vom ${shortDay(l.f.date)} entfernt`);
		if (last) closeSheet();
	}
</script>

<div class="cs-peek" bind:this={peekEl}>
	<div class="cs-head">
		<span class="rs-ico" aria-hidden="true"
			><svg viewBox="0 0 24 24"><path d="M3 17h18M4.5 13.5l3 1 11-4.5c1.2-.5 2.3.6 1.4 1.5-.3.3-.6.4-1 .6L7.5 16.5 3.5 14l1-.5zM9 11 6.5 6.5l1.5-.5 5 3.5" /></svg></span
		>
		<div
			class="cs-title"
			role="button"
			tabindex="-1"
			onclick={() => ui.sheetDetent === 'peek' && setSheetDetent('full')}
			onkeydown={(e) => e.key === 'Enter' && ui.sheetDetent === 'peek' && setSheetDetent('full')}
		>
			<h3 id="sheetTitle" class="rs-title" class:long={city(a).length + city(b).length > 16} class:xlong={city(a).length + city(b).length > 24}>{city(a)} – {city(b)}</h3>
			<div class="cs-sub">{a} ⇄ {b}{km ? ` · ${fmtInt(km)} km` : ''}</div>
		</div>
		{#if ui.sheetDetent === 'peek'}
			<button type="button" class="cs-more" aria-label="Alle Flüge anzeigen" onclick={() => setSheetDetent('full')}
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg></button
			>
		{/if}
	</div>

	{#if legs.length}
		<div class="cs-status">
			<span class="cs-badge been"
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{done.length
					? `${done.length}× geflogen`
					: 'geplant'}{legs.length > done.length && done.length ? ` · ${legs.length - done.length} weitere` : ''}</span
			>
			<button type="button" class="cs-badge rs-add" onclick={() => openAddFlight(a, b)}
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Flug hinzufügen</button
			>
			{#if legs.length === 1}
				<button type="button" class="cs-badge cs-del" onclick={() => remove(legs[0])}
					><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>Entfernen</button
				>
			{/if}
		</div>

		<div class="cs-quick">
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18c3-8 13-8 16 0" /><circle cx="4" cy="18" r="1.6" /><circle cx="20" cy="18" r="1.6" /></svg>
				<span class="lbl">Strecke</span>
				<b class="nw">{km ? `${fmtInt(km)} km` : '–'}</b>
				{#if km}<span class="sub">{Math.round((km / EARTH_KM) * 100)} % des Erdumfangs</span>{/if}
			</div>
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
				<span class="lbl">Flugzeit</span>
				<b>{avgMin ? `${est ? '≈ ' : ''}${fmtDuration(avgMin)}` : '–'}</b>
				<span class="sub">{est ? 'geschätzt' : legs.length > 1 ? 'im Schnitt' : 'Gate bis Gate'}</span>
			</div>
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>
				<span class="lbl">{done.length ? 'Zuletzt' : 'Geplant'}</span>
				<b>{shortDay((done[0] ?? legs[legs.length - 1]).f.date)}</b>
				{#if done.length > 1 && done[done.length - 1].f.date !== done[0].f.date}<span class="sub">zuerst {shortDay(done[done.length - 1].f.date)}</span>{/if}
			</div>
		</div>
	{/if}
</div>

<div class="cs-body">
	{#if legs.length}
		<h4 class="cs-h">Flüge <span>{legs.length}</span></h4>
		<div class="rs-list">
			{#each legs as l (l.f.id)}
				<div class="cs-tile wide rs-flight" class:del={legs.length > 1} class:on={l.f.id === id} class:off={!l.done} data-flight={l.f.id}>
					<span class="lbl">{longDay(l.f.date)}</span>
					<b>{l.f.from} → {l.to}{#if flightNo(l.f, al)}<small>{flightNo(l.f, al)}</small>{/if}</b>
					<span class="sub"
						>{[l.f.airline && (al?.[l.f.airline]?.[0] ?? l.f.airline), times(l), l.min ? `${l.est ? '≈ ' : ''}${fmtDuration(l.min)}` : ''].filter(Boolean).join(' · ')}</span
					>
					{#if extras(l)}<span class="sub">{extras(l)}</span>{/if}
					{#if l.f.d.note}<span class="sub">„{l.f.d.note}“</span>{/if}
					{#if status(l)}<span class="sub warn">{status(l)}</span>{/if}
					{#if legs.length > 1}<button type="button" class="cs-badge cs-del rs-del" onclick={() => remove(l)}
							><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>Entfernen</button
						>{/if}
				</div>
			{/each}
		</div>

		<h4 class="cs-h">Flughäfen</h4>
		<div class="cs-grid">
			{#each [a, b] as c (c)}
				{@const x = ap?.[c]}
				<div class="cs-tile">
					<span class="lbl">{c}</span>
					<b>{city(c)}</b>
					{#if x}
						{#if x[1]}<span class="sub">{x[1]}</span>{/if}
						<button type="button" class="cs-chip rs-land" onclick={() => openCountry(x[2])}><span aria-hidden="true">{flag(x[2])}</span>{nameOf(x[2])}</button>
					{:else}
						<span class="sub">unbekannter Flughafen</span>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p class="cs-note">Auf dieser Strecke ist kein Flug mehr eingetragen.</p>
	{/if}
</div>
