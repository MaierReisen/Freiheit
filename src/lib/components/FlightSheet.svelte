<script lang="ts">
	import { removeFlights } from '$lib/atlas.svelte';
	import { closeSheet, openAirport, openEditFlight, openRoute, sheetBack, toast, ui } from '$lib/app.svelte';
	import { fd } from '$lib/flightData.svelte';
	import { EARTH_KM, flightNo, fmtDuration, fmtInt, routeKey } from '$lib/flights';

	/* Seite zu einem einzelnen Flug (Tipp auf einen Flug in „Meine Flüge“, auf der Strecken-Seite oder im Reisejahr):
	   Abflug/Ziel (Tipp = Flughafen-Seite), Strecke, Flugzeit, darunter alle Angaben zum Flug (Datum, Zeiten, Airline,
	   Flug-Nr., Flugzeug, Platz, Klasse, Notiz) und ein Verweis auf die ganze Strecke. „Bearbeiten“ öffnet das Formular. */

	let { id }: { id: string } = $props();

	fd.load();
	const ap = $derived(fd.ap);
	const al = $derived(fd.al);
	const l = $derived(fd.st?.legs.find((x) => x.f.id === id));
	const key = $derived(l ? routeKey(l.f.from, l.to) : '');
	const n = $derived(l ? (fd.st?.legs ?? []).filter((x) => x.done && !x.f.d.cx && routeKey(x.f.from, x.to) === key).length : 0);
	const city = (c: string) => ap?.[c]?.[0] || c;
	const longDay = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	const hm = (t?: string) => (t && !t.endsWith('T00:00') ? t.slice(11, 16) : '');
	const dep = $derived(l ? hm(l.f.d.gda || l.f.d.gds || l.f.d.ofa || l.f.d.ofs) : '');
	const arrT = $derived(l ? l.f.d.gaa || l.f.d.gas || l.f.d.ona || l.f.d.ons || '' : '');
	const plus = $derived(l && dep && arrT ? Math.round((Date.parse(arrT.slice(0, 10)) - Date.parse(l.f.date)) / 864e5) : 0);
	const status = $derived(!l ? '' : l.f.d.cx ? 'Gestrichen' : !l.done ? 'Geplant' : l.f.d.div ? `Umgeleitet nach ${l.to}` : 'Geflogen');
	const missing = $derived(l ? [!l.f.no && 'Flugnummer', !dep && 'Uhrzeiten', !l.f.d.seat && 'Platz', !l.f.d.cab && 'Klasse'].filter(Boolean) : []);

	function remove() {
		if (!l) return;
		removeFlights([l.f.id]);
		toast(`Flug ${l.f.from} → ${l.to} entfernt`);
		if (ui.sheetBack.length) sheetBack();
		else closeSheet();
	}
</script>

{#if l}
	<div class="cs-peek">
		<div class="cs-head">
			<span class="rs-ico" aria-hidden="true"
				><svg viewBox="0 0 24 24"><path d="M3 17h18M4.5 13.5l3 1 11-4.5c1.2-.5 2.3.6 1.4 1.5-.3.3-.6.4-1 .6L7.5 16.5 3.5 14l1-.5zM9 11 6.5 6.5l1.5-.5 5 3.5" /></svg></span
			>
			<div class="cs-title">
				<h3 id="sheetTitle" class="rs-title" class:long={city(l.f.from).length + city(l.to).length > 16} class:xlong={city(l.f.from).length + city(l.to).length > 24}>
					{city(l.f.from)} → {city(l.to)}
				</h3>
				<div class="cs-sub">{[`${l.f.from} → ${l.to}`, flightNo(l.f, al)].filter(Boolean).join(' · ')}</div>
			</div>
		</div>

		<div class="cs-status">
			<span class="cs-badge been"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{status}</span>
			<button type="button" class="cs-badge rs-add" onclick={() => openEditFlight(l.f.id)}
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" /></svg>Bearbeiten</button
			>
		</div>

		<div class="cs-quick rs-quick">
			<div class="rs-aps">
				{#each [[l.f.from, 'Abflug'], [l.to, 'Ziel']] as [c, t] (t)}
					<button type="button" class="rs-ap" onclick={() => openAirport(c)} aria-label="{t} {city(c)} ({c}) öffnen">
						<span class="lbl">{t}</span>
						<b>{c}</b>
						<span class="sub">{city(c)}</span>
						<span class="rs-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg></span>
					</button>
				{/each}
			</div>
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18c3-8 13-8 16 0" /><circle cx="4" cy="18" r="1.6" /><circle cx="20" cy="18" r="1.6" /></svg>
				<span class="lbl">Strecke</span>
				<b class="nw">{l.km ? `${fmtInt(l.km)} km` : '–'}</b>
				{#if l.km}<span class="sub">{Math.round((l.km / EARTH_KM) * 100)} % des Erdumfangs</span>{/if}
			</div>
			<div>
				<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
				<span class="lbl">Flugzeit</span>
				<b>{l.min ? fmtDuration(l.min) : '–'}</b>
				<span class="sub">{l.est ? 'geschätzt' : 'Gate bis Gate'}</span>
			</div>
		</div>
	</div>

	<div class="cs-body">
		<h4 class="cs-h">Dein Flug</h4>
		<div class="cs-grid">
			<div class="cs-tile wide">
				<span class="lbl">Datum</span>
				<b>{longDay(l.f.date)}</b>
			</div>
			{#if dep || arrT}
				<div class="cs-tile">
					<span class="lbl">Abflug</span>
					<b>{dep || '–'}</b>
					<span class="sub">Ortszeit {l.f.from}</span>
				</div>
				<div class="cs-tile">
					<span class="lbl">Ankunft</span>
					<b>{hm(arrT) || '–'}{plus > 0 ? ` (+${plus})` : ''}</b>
					<span class="sub">Ortszeit {l.to}</span>
				</div>
			{/if}
			{#if l.f.airline}
				<div class="cs-tile" class:wide={!l.f.no}>
					<span class="lbl">Airline</span>
					<b>{al?.[l.f.airline]?.[0] ?? l.f.airline}</b>
				</div>
			{/if}
			{#if l.f.no}
				<div class="cs-tile" class:wide={!l.f.airline}>
					<span class="lbl">Flug-Nr.</span>
					<b>{flightNo(l.f, al)}</b>
				</div>
			{/if}
			{#if l.f.d.ac}
				<div class="cs-tile wide">
					<span class="lbl">Flugzeug</span>
					<b>{l.f.d.ac}{l.f.d.tail ? ` · ${l.f.d.tail}` : ''}</b>
				</div>
			{/if}
			{#if l.f.d.seat}
				<div class="cs-tile">
					<span class="lbl">Platz</span>
					<b>{l.f.d.seat}</b>
					{#if l.f.d.st}<span class="sub">{l.f.d.st}</span>{/if}
				</div>
			{/if}
			{#if l.f.d.cab}
				<div class="cs-tile">
					<span class="lbl">Klasse</span>
					<b>{l.f.d.cab}</b>
				</div>
			{/if}
			{#if l.f.d.note || l.f.d.why}
				<div class="cs-tile wide">
					<span class="lbl">Notiz</span>
					<b class="cs-list">{[l.f.d.why, l.f.d.note].filter(Boolean).join(' · ')}</b>
				</div>
			{/if}
		</div>
		{#if missing.length}
			<p class="cs-note">Noch nicht eingetragen: {missing.join(', ')}. Über „Bearbeiten“ nachtragen.</p>
		{/if}

		<h4 class="cs-h">Strecke</h4>
		<ul class="list fl-list">
			<li>
				<button type="button" class="fl-tap" onclick={() => openRoute(key, { id: l.f.id })}>
					<span class="fl-route"><b>{city(l.f.from)} – {city(l.to)}</b><span>Alle Flüge dieser Strecke</span></span>
					<span class="fl-n">{n}×</span>
				</button>
			</li>
		</ul>
		<p class="fs-del">
			<button type="button" class="cs-badge cs-del" onclick={remove}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>Flug entfernen</button>
		</p>
	</div>
{:else}
	<h3 id="sheetTitle">Flug</h3>
	<p class="cs-note">{fd.st ? 'Diesen Flug gibt es nicht mehr.' : 'Wird geladen …'}</p>
{/if}
