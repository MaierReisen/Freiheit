<script lang="ts">
	import { atlas, putFlights, removeFlights } from '$lib/atlas.svelte';
	import { closeSheet, openAirport, openEditFlight, openRoute, sheetBack, toast, ui } from '$lib/app.svelte';
	import { fd } from '$lib/flightData.svelte';
	import { airportProblem, flightNo, fmtDuration, gcKm, routeKey } from '$lib/flights';
	import { editedFlight, formOf, isDay, legInfo, type FlightForm } from '$lib/flightForm';

	/* Seite zu einem einzelnen Flug (Tipp auf einen Flug in „Meine Flüge“, auf der Strecken-Seite oder im Reisejahr).
	   Sieht bewusst anders aus als die Strecken-Seite: oben eine Bordkarte (Abflug/Ziel mit Uhrzeit – Tipp = Flughafen-Seite –,
	   Flugzeit, Datum, Platz, Klasse), darunter die Angaben als Formular, das man direkt ändert (kein Bearbeiten-Modus):
	   gespeichert wird beim Verlassen eines Felds, nur wenn es den Flug so geben kann (Regeln wie „Flug hinzufügen“).
	   Abflug/Ziel ändern über „Flughäfen ändern“ (Formular von „Flug hinzufügen“). */

	let { id }: { id: string } = $props();

	fd.load();
	const ap = $derived(fd.ap);
	const al = $derived(fd.al);
	const used = $derived(new Set(fd.st?.airlines.map((a) => a.code) ?? []));
	const l = $derived(fd.st?.legs.find((x) => x.f.id === id));
	const key = $derived(l ? routeKey(l.f.from, l.to) : '');
	const n = $derived(l ? (fd.st?.legs ?? []).filter((x) => routeKey(x.f.from, x.to) === key).length : 0);
	const city = (c: string) => ap?.[c]?.[0] || c;
	const longDay = (d: string, weekday = true) =>
		new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { ...(weekday ? { weekday: 'short' } : {}), day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	const status = $derived(!l ? '' : l.f.d.cx ? 'Gestrichen' : !l.done ? 'Geplant' : l.f.d.div ? `Umgeleitet nach ${l.to}` : 'Geflogen');

	/* ---------- Angaben direkt ändern ---------- */
	const CABINS = ['Economy', 'Premium Economy', 'Business', 'First'];
	let v = $state<FlightForm | null>(null);
	let was = null as FlightForm | null; // zuletzt gespeicherter Stand
	$effect(() => {
		if (!v && l && al) {
			was = formOf(l.f, al);
			v = { ...was };
		}
	});
	const A = $derived(l && ap ? ap[l.f.from] : undefined),
		B = $derived(l && ap ? ap[l.f.to] : undefined);
	const info = $derived(v && was && l && isDay(v.date) ? legInfo(v.date, v.no.trim() === was.no.trim() ? '' : v.no, v.dep, v.arr, A, B, A && B ? gcKm(A, B) : 0, al, used) : null);
	let errs = $state<string[]>([]);
	let saved = $state(0);
	let savedT: ReturnType<typeof setTimeout>;

	function commit() {
		if (!v || !was || !l || !ap) return;
		const f = l.f;
		if (JSON.stringify(v) === JSON.stringify(was)) return void (errs = []);
		if (!isDay(v.date)) return void (errs = ['Bitte ein Datum wählen']);
		if (!info) return;
		const timesChanged = v.date !== was.date || v.dep !== was.dep || v.arr !== was.arr;
		// Flighty-Flüge: Zeiten, die schon drin sind, nicht neu prüfen; nur was geändert wurde
		const e = timesChanged ? [...info.errs] : info.p?.err ? [info.p.err] : [];
		if (v.date !== was.date) {
			e.push(...[airportProblem(f.from, v.date, ap), airportProblem(f.to, v.date, ap)].filter(Boolean));
			if (atlas.flights.some((x) => x.id !== f.id && x.date === v!.date && x.from === f.from && x.to === f.to)) e.push('An diesem Tag ist diese Strecke schon eingetragen');
		}
		errs = e;
		if (e.length) return;
		const nf = editedFlight(f, was, v, info);
		putFlights([nf]);
		fd.tick();
		was = formOf(nf, al);
		v = { ...was };
		saved++;
		clearTimeout(savedT);
		const k = saved;
		savedT = setTimeout(() => saved === k && (saved = 0), 2200);
	}
	const blurOnEnter = (e: KeyboardEvent) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur();

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
				><svg viewBox="0 0 24 24"><path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM14 7v10" stroke-dasharray="2 2" /></svg></span
			>
			<div class="cs-title">
				<span class="sh-kind">Einzelner Flug</span>
				<h3 id="sheetTitle" class="rs-title" class:long={city(l.f.from).length + city(l.to).length > 16} class:xlong={city(l.f.from).length + city(l.to).length > 24}>
					{city(l.f.from)} → {city(l.to)}
				</h3>
				<div class="cs-sub">{longDay(l.f.date)}</div>
			</div>
		</div>
	</div>

	<div class="cs-body">
		<!-- Bordkarte -->
		<div class="fs-pass" class:plan={!l.done}>
			<div class="fs-top">
				<span>{(l.f.airline && (al?.[l.f.airline]?.[0] ?? l.f.airline)) || 'Flug'}</span>
				<b>{flightNo(l.f, al)}</b>
			</div>
			<div class="fs-mid">
				<button type="button" class="fs-ap" onclick={() => openAirport(l.f.from)} aria-label="Abflughafen {city(l.f.from)} öffnen">
					<small>Von</small><b>{l.f.from}</b><span>{city(l.f.from)}</span><em>{v?.dep || '–'}</em>
				</button>
				<div class="fs-line" aria-hidden="true">
					<svg viewBox="0 0 24 24"><path d="M3 17h18M4.5 13.5l3 1 11-4.5c1.2-.5 2.3.6 1.4 1.5-.3.3-.6.4-1 .6L7.5 16.5 3.5 14l1-.5zM9 11 6.5 6.5l1.5-.5 5 3.5" /></svg>
					<span>{l.min ? fmtDuration(l.min) : ''}</span>
				</div>
				<button type="button" class="fs-ap r" onclick={() => openAirport(l.to)} aria-label="Zielflughafen {city(l.to)} öffnen">
					<small>Nach</small><b>{l.to}</b><span>{city(l.to)}</span><em>{v?.arr || '–'}{info?.plus ? ` +${info.plus}` : ''}</em>
				</button>
			</div>
			<div class="fs-cut" aria-hidden="true"></div>
			<div class="fs-bot">
				<div><small>Datum</small><b>{longDay(l.f.date, false)}</b></div>
				<div><small>Platz</small><b>{l.f.d.seat || '–'}</b></div>
				<div><small>Klasse</small><b>{l.f.d.cab || '–'}</b></div>
				<div><small>Status</small><b>{status}</b></div>
			</div>
		</div>

		<h4 class="cs-h">
			Angaben
			{#if saved}<span class="fs-saved">✓ Gespeichert</span>{:else}<span>Antippen zum Ändern</span>{/if}
		</h4>
		{#if v}
			<div class="fa-card">
				<label class="fa-row"><span class="fa-k">Datum</span><input class="fa-in" type="date" bind:value={v.date} onchange={commit} required /></label>
				<label class="fa-row fa-no"
					><span class="fa-k">Flug-Nr.</span><span class="fa-v fa-col"
						><input class="fa-in" type="text" placeholder="z. B. LH 400" autocomplete="off" autocapitalize="characters" bind:value={v.no} onchange={commit} onkeydown={blurOnEnter} />{#if info?.p}<small
								class:ok={!!info.p.airline}
								class:bad={!!info.p.err}>{info.p.airline && al ? al[info.p.airline][0] : info.p.err ? 'Airline nicht gefunden' : ''}</small
							>{/if}</span
					></label
				>
				<label class="fa-row"><span class="fa-k">Abflug</span><input class="fa-in" type="time" bind:value={v.dep} onchange={commit} /></label>
				<label class="fa-row"
					><span class="fa-k">Ankunft</span>{#if info?.plus}<span class="fa-plus">+{info.plus} Tag</span>{/if}<input class="fa-in" type="time" bind:value={v.arr} onchange={commit} /></label
				>
				<label class="fa-row"><span class="fa-k">Platz</span><input class="fa-in" type="text" placeholder="z. B. 23A" maxlength="5" autocomplete="off" autocapitalize="characters" bind:value={v.seat} onchange={commit} onkeydown={blurOnEnter} /></label>
				<label class="fa-row"
					><span class="fa-k">Klasse</span><select class="fa-in" bind:value={v.cab} onchange={commit}
						>{#each ['', ...CABINS, ...(v.cab && !CABINS.includes(v.cab) ? [v.cab] : [])] as c (c)}<option value={c}>{c || '–'}</option>{/each}</select
					></label
				>
				<label class="fa-row"><span class="fa-k">Notiz</span><input class="fa-in" type="text" placeholder="z. B. Hochzeitsreise" maxlength="120" autocomplete="off" bind:value={v.note} onchange={commit} onkeydown={blurOnEnter} /></label>
				{#if l.f.d.ac}
					<div class="fa-row"><span class="fa-k">Flugzeug</span><span class="fa-v fs-ro">{l.f.d.ac}{l.f.d.tail ? ` · ${l.f.d.tail}` : ''}</span></div>
				{/if}
			</div>
			{#if errs.length}
				<ul class="fa-err" role="alert">
					{#each errs as e (e)}<li>{e} – nicht gespeichert.</li>{/each}
				</ul>
			{/if}
			<p class="note fa-note">Änderungen werden sofort gespeichert. Uhrzeiten in Ortszeit, wie auf der Bordkarte.</p>
		{/if}

		<ul class="list fl-list fs-links">
			<li>
				<button type="button" class="fl-tap" onclick={() => openRoute(key, { id: l.f.id })}>
					<span class="fl-route"><b>Ganze Strecke ansehen</b><span>Alle Flüge {city(l.f.from)} – {city(l.to)}</span></span>
					<span class="fl-n">{n}×</span>
				</button>
			</li>
			<li>
				<button type="button" class="fl-tap" onclick={() => openEditFlight(l.f.id)}>
					<span class="fl-route"><b>Flughäfen ändern</b><span>Falscher Abflug- oder Zielflughafen?</span></span>
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
