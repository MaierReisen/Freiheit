<script lang="ts">
	import { addFromFlights, atlas, putFlights, visitedSet } from '$lib/atlas.svelte';
	import { closeFlightsPage, closeSheet, flashRoute, hooks, sheetBack, toast, ui } from '$lib/app.svelte';
	import { tierName } from '$lib/badges';
	import { flightBadges } from '$lib/flightBadges';
	import { appCountry, flag, nameOf } from '$lib/countries';
	import { fd } from '$lib/flightData.svelte';
	import {
		airportProblem,
		flightStats,
		fmtDuration,
		fmtInt,
		gcKm,
		MAX_KM,
		routeKey,
		type Airport,
		type Flight,
		type FlightDetail
	} from '$lib/flights';
	import { editedFlight, formOf, isDay, legInfo as legOf } from '$lib/flightForm';

	/* „Flug hinzufügen“ (Knopf „+ Flug“ im Tab „Flüge“ bzw. auf der Seite einer Strecke): Datum, Von, Nach,
	   optional Flugnummer (z. B. „LH 400“, Airline wird daraus erkannt) und Ortszeiten; auf Wunsch gleich der Rückflug
	   (eigenes Datum, Flugnummer, Zeiten). Flughäfen per Suche (Kürzel, Stadt, Name oder Land; schon besuchte zuerst).
	   Nur Flüge, die es so geben kann: Flughäfen am Datum in Betrieb, Airline flog damals, Flugzeit passt zur Strecke,
	   nicht weiter als der längste Nonstop-Flug, höchstens ein Jahr im Voraus. Danach fliegt der Globus zur neuen Strecke.
	   Mit `edit` (Kennung eines Flugs, „Flughäfen ändern“ auf der Flug-Seite; alles andere ändert man dort direkt): dasselbe Formular;
	   ohne Rückflug und ohne Länder-Schalter; Speichern ersetzt den Flug (Kennung bleibt) und führt zurück zur Flug-Seite. */

	let { from: from0, to: to0, edit: editId }: { from?: string; to?: string; edit?: string } = $props();

	fd.load();
	const ap = $derived(fd.ap);
	const al = $derived(fd.al);

	// svelte-ignore state_referenced_locally
	const old = editId ? atlas.flights.find((f) => f.id === editId) : undefined;
	const old0 = old && formOf(old, fd.al);

	// svelte-ignore state_referenced_locally
	let from = $state(old?.from ?? from0 ?? '');
	// svelte-ignore state_referenced_locally
	let to = $state(old?.to ?? to0 ?? '');
	let date = $state(old0?.date ?? new Date().toLocaleDateString('sv-SE')); // heute, „JJJJ-MM-TT“
	let no = $state(old0?.no ?? '');
	let dep = $state(old0?.dep ?? '');
	let arr = $state(old0?.arr ?? '');
	// Rückflug (optional)
	let back = $state(false);
	let rdate = $state('');
	let rno = $state('');
	let rdep = $state('');
	let rarr = $state('');
	function addBack() {
		back = true;
		// eine Woche später vorschlagen
		if (!rdate && /^\d{4}-\d{2}-\d{2}$/.test(date)) rdate = new Date(Date.parse(date + 'T12:00:00Z') + 7 * 864e5).toISOString().slice(0, 10);
	}
	// svelte-ignore state_referenced_locally
	let active = $state<'from' | 'to' | null>(from0 || old ? null : 'from');
	let q = $state('');
	let qEl = $state<HTMLInputElement>();
	// Suche gleich bereit (am Rechner; iOS öffnet die Tastatur erst beim Antippen)
	$effect(() => {
		if (active && qEl) qEl.focus({ preventScroll: true });
	});

	/* ---------- Flughafen-Suche ---------- */
	const norm = (s: string) =>
		s
			.toLowerCase()
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '');
	// Suchtext je Flughafen einmal aufbereitet
	// Nicht mehr angeflogene (geschlossene) Flughäfen nur für Tage vor der Schließung
	const open = (x: string[]) => !x[6] || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < x[6];
	const index = $derived(ap ? Object.entries(ap).filter(([, x]) => open(x as string[])).map(([c, x]) => ({ c, city: norm(x[0]), name: norm(x[1]), land: norm(nameOf(x[2])) })) : []);
	const visits = $derived(new Map((fd.st?.airports ?? []).map((a) => [a.code, a.n])));
	const results = $derived.by(() => {
		const s = norm(q.trim());
		if (!s) return [...visits.keys()].filter((c) => ap?.[c] && open(ap[c] as string[])).slice(0, 12); // ohne Suche: bisherige Flughäfen
		const up = s.toUpperCase();
		const hits: { c: string; r: number }[] = [];
		for (const x of index) {
			const r =
				x.c === up ? 0 : x.city.startsWith(s) ? 1 : x.name.startsWith(s) ? 2 : x.city.includes(s) || x.name.includes(s) ? 3 : s.length > 2 && x.land.startsWith(s) ? 4 : -1;
			if (r >= 0) hits.push({ c: x.c, r });
		}
		return hits
			.sort((p, k) => p.r - k.r || Number(!!ap?.[p.c][6]) - Number(!!ap?.[k.c][6]) || (visits.get(k.c) ?? 0) - (visits.get(p.c) ?? 0) || p.c.localeCompare(k.c))
			.slice(0, 40)
			.map((h) => h.c);
	});
	function edit(which: 'from' | 'to') {
		// erneuter Tipp auf das offene Feld (mit Wert) schließt die Suche wieder
		if (active === which && (which === 'from' ? from : to)) return closeSearch();
		active = which;
		q = '';
		qEl?.focus();
	}
	function closeSearch() {
		active = null;
		q = '';
	}
	const canClose = $derived(active === 'from' ? !!from : active === 'to' ? !!to : false);
	function choose(c: string) {
		if (active === 'from') from = c;
		else to = c;
		const next = active === 'from' && !to ? 'to' : null;
		if (next) edit(next);
		else {
			active = null;
			q = '';
		}
	}
	function swap() {
		[from, to] = [to, from];
	}

	/* ---------- Flugnummer („LH 400“ → Airline), Ankunftstag, Flugzeit, Gründe: flightForm.ts ---------- */
	const used = $derived(new Set(fd.st?.airlines.map((a) => a.code) ?? []));
	const legInfo = (day: string, noText: string, d: string, a: string, A: Airport | undefined, B: Airport | undefined, km: number) =>
		legOf(day, noText, d, a, A, B, km, al, used);

	const A = $derived(ap?.[from]),
		B = $derived(ap?.[to]);
	// Vorschau: Strecke und Flugzeit, sobald Von und Nach gewählt sind
	const km = $derived(A && B && from !== to ? gcKm(A, B) : 0);
	const out = $derived(legInfo(date, old0 && no === old0.no ? '' : no, dep, arr, A, B, km));
	const ret = $derived(back ? legInfo(rdate, rno, rdep, rarr, B, A, km) : null);
	/** Gründe, warum es die Flüge so nicht geben kann (Knopf bleibt dann aus) */
	const problems = $derived.by(() => {
		if (!ap || !from || !to) return [];
		const e: string[] = [];
		if (from === to) e.push('Abflug und Ziel sind derselbe Flughafen');
		if (km > MAX_KM) e.push(`Nonstop-Flüge über ${fmtInt(MAX_KM)} km gibt es nicht – bitte mit Umsteigen eintragen`);
		const ap1 = isDay(date) ? [airportProblem(from, date, ap), airportProblem(to, date, ap)] : [];
		e.push(...ap1.filter(Boolean), ...out.errs);
		if (ret) {
			if (isDay(rdate) && isDay(date) && rdate < date) e.push('Der Rückflug liegt vor dem Hinflug');
			const ap2 = isDay(rdate) ? [airportProblem(to, rdate, ap), airportProblem(from, rdate, ap)].filter((x) => x && !ap1.includes(x)) : [];
			e.push(...ap2, ...ret.errs.filter((x) => !out.errs.includes(x)).map((x) => `Rückflug: ${x}`));
		}
		return e;
	});
	// Zielland noch nicht bereist: Schalter „als bereist eintragen“ (an; aus bei nur Umsteigen). Flug in der Zukunft:
	// Vermerk am Flug, das Land kommt nach dem Abflug dazu (fd.syncCountries)
	const today = new Date().toLocaleDateString('sv-SE');
	const land = $derived(B ? appCountry(B[2]) : '');
	const askLand = $derived(!old && !!land && from !== to && !visitedSet().has(land));
	const later = $derived(isDay(date) && date > today);
	let mark = $state(true);
	const ready = $derived(!!ap && isDay(date) && !!from && !!to && from !== to && (!back || isDay(rdate)) && !problems.length);
	const label = (c: string) => (ap?.[c] ? `${ap[c][0]}` : c);

	/** Flug aus den Angaben bauen (Kennung wie bei Flighty-Zeilen ohne ID: Datum + Strecke) */
	function build(day: string, a: string, b: string, noText: string, d: string, ar: string, info: ReturnType<typeof legInfo>): Flight {
		const det: FlightDetail = {};
		if (d) det.gds = `${day}T${d}`;
		if (ar) det.gas = `${info.arrDay}T${ar}`;
		const airline = info.p?.airline || '';
		const nr = info.p ? info.p.no : noText.trim();
		const id = `${day}${det.gds ? det.gds.slice(10) : ''}-${a}-${b}-${airline}${nr}`;
		return { id, date: day, from: a, to: b, ...(airline ? { airline } : {}), ...(nr ? { no: nr } : {}), d: det };
	}

	/** Bearbeiteten Flug speichern: Kennung bleibt; geänderte Zeiten ersetzen alle bisherigen (auch die aus Flighty) */
	function save() {
		if (!ready || !ap || !old || !old0) return;
		if (atlas.flights.some((f) => f.id !== old.id && f.date === date && f.from === from && f.to === to)) {
			toast('Diesen Flug gibt es schon');
			return;
		}
		const f = editedFlight(old, old0, { ...old0, from, to, date, no, dep, arr }, out);
		putFlights([f]);
		fd.tick();
		toast('Flug gespeichert');
		sheetBack();
	}

	function add() {
		if (!ready || !ap) return;
		const list = [build(date, from, to, no, dep, arr, out), ...(ret ? [build(rdate, to, from, rno, rdep, rarr, ret)] : [])];
		// gleicher Tag und gleiche Strecke (auch aus Flighty eingelesen, dort mit eigener Kennung) = schon da
		const dup = list.find((g) => atlas.flights.some((f) => f.id === g.id || (f.date === g.date && f.from === g.from && f.to === g.to)));
		if (dup) {
			toast(list.length > 1 && dup !== list[0] ? 'Diesen Rückflug gibt es schon' : 'Diesen Flug gibt es schon');
			return;
		}
		// neue Stufe bei einem Flug-Abzeichen: vorher/nachher vergleichen, Feier-Karte nach dem Flug zur Strecke (je eine, höchstens 3)
		const t = Date.now(),
			was = flightBadges({ st: flightStats(atlas.flights, ap, t), ap, al: fd.al }),
			up = flightBadges({ st: flightStats([...atlas.flights, ...list], ap, t), ap, al: fd.al }).filter((b, i) => b.level > was[i].level);
		up.slice(0, 3).forEach((b, k) =>
			setTimeout(() => {
				ui.unlock = { key: ui.unlock.key + 1, cont: '', n: 0, rank: '', badge: b.name, badgeId: b.id, icon: b.icon, sub: `${tierName(b, b.level)} · ${b.fmt(b.v)} ${b.what}`, added: '', area: '' };
			}, 1800 + k * 3900)
		);
		const markLand = askLand && mark;
		if (markLand && list[0].date > today) list[0].d.vc = true;
		atlas.lastFlightAddedAt = Date.now();
		putFlights(list);
		// geflogene Flüge: Zielland eintragen (Hinflug mit Schalter), Einreisedatum bereits bereister Länder ergänzen
		const visited = visitedSet(),
			found = new Map<string, string>();
		for (const f of list) {
			const c = appCountry(ap[f.to]?.[2] ?? '');
			if (c && f.date <= today && (visited.has(c) || (f === list[0] && markLand)) && !found.has(c)) found.set(c, f.date.slice(0, 7));
		}
		const fresh = addFromFlights(found);
		const msg = list.length > 1 ? `Hin- und Rückflug ${from} ⇄ ${to} hinzugefügt` : `Flug ${from} → ${to} hinzugefügt`;
		toast(fresh.length ? `${msg} · ${nameOf(fresh[0])} als bereist eingetragen` : msg);
		closeSheet();
		closeFlightsPage(); // aus „Meine Flüge“ heraus: Liste schließen, damit der Globus zu sehen ist
		// wie beim neuen Land: Globus fliegt zur neuen Strecke, die wächst; keine Seite öffnet sich
		fd.year = null;
		fd.tick();
		const key = routeKey(from, to);
		hooks.map?.focusRoute(key);
		flashRoute(key);
	}
</script>

<h3 id="sheetTitle">{old ? 'Flug bearbeiten' : 'Flug hinzufügen'}</h3>
<div class="fa-body">
	<div class="fa-card fa-route">
		{#each ['from', 'to'] as const as w (w)}
			{@const c = w === 'from' ? from : to}
			<button type="button" class="fa-row fa-ap" class:on={active === w} onclick={() => edit(w)}>
				<span class="fa-k">{w === 'from' ? 'Von' : 'Nach'}</span>
				{#if c}
					<span class="fa-v"><b>{c}</b><span class="fa-city">{ap?.[c] ? `${flag(ap[c][2])} ${label(c)}` : ''}</span></span>
				{:else}
					<span class="fa-v fa-ph">{w === 'from' ? 'Abflughafen wählen' : 'Zielflughafen wählen'}</span>
				{/if}
			</button>
		{/each}
		<button type="button" class="fa-swap" aria-label="Von und Nach tauschen" onclick={swap} disabled={!from || !to}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v15M4.5 15.5 8 19l3.5-3.5M16 20V5M12.5 8.5 16 5l3.5 3.5" /></svg></button
		>
	</div>

	{#if active}
		<p class="fa-ask">
			{#if !old && !to}<span class="fa-step">Schritt {active === 'from' ? 1 : 2} von 2</span>{/if}
			{active === 'from' ? 'Wo bist du abgeflogen?' : 'Wohin bist du geflogen?'}
		</p>
		<div class="fa-search">
			<input
				class="search"
				type="search"
				placeholder={active === 'from' ? 'Abflughafen: Stadt oder Kürzel' : 'Zielflughafen: Stadt oder Kürzel'}
				autocomplete="off"
				enterkeyhint="done"
				bind:value={q}
				bind:this={qEl}
				onkeydown={(e) => e.key === 'Enter' && results[0] && choose(results[0])}
			/>
			{#if canClose}<button type="button" class="fa-cancel" onclick={closeSearch}>Fertig</button>{/if}
		</div>
		<ul class="pick-list fa-list">
			{#if !ap}
				<li class="empty">Flughäfen werden geladen …</li>
			{:else}
				{#if !q.trim() && results.length}<li class="pick-sub" role="presentation">Deine Flughäfen</li>{/if}
				{#each results as c (c)}
					{@const x = ap[c]}
					<li>
						<button type="button" onclick={() => choose(c)}
							><span class="fa-flag">{flag(x[2])}</span><span class="fa-res"><b>{x[0]}</b><small
									>{x[1] || nameOf(x[2])}{#if x[6]}<em>{` · geschlossen ${x[6].slice(0, 4)}`}</em>{/if}</small
								></span
							><span class="fa-code">{c}</span></button
						>
					</li>
				{/each}
				{#if q.trim() && !results.length}<li class="empty">Kein Flughafen gefunden.</li>{/if}
			{/if}
		</ul>
	{:else}
		{#if km}
			<p class="fa-preview">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18c3-8 13-8 16 0" /><circle cx="4" cy="18" r="1.6" /><circle cx="20" cy="18" r="1.6" /></svg>{fmtInt(km)} km · {fmtDuration(out.min)}
			</p>
		{/if}
		{#snippet legCard(title: string, info: ReturnType<typeof legInfo>, f: { get: () => [string, string, string, string]; set: (i: number, v: string) => void }, remove?: () => void)}
			{@const [d, n, t1, t2] = f.get()}
			<div class="fa-card">
				{#if title}
					<div class="fa-row fa-head"><span class="fa-k">{title}</span>{#if remove}<button type="button" class="fa-x" onclick={remove}>Entfernen</button>{/if}</div>
				{/if}
				<label class="fa-row"><span class="fa-k">Datum</span><input class="fa-in" type="date" value={d} oninput={(e) => f.set(0, e.currentTarget.value)} required /></label>
				<label class="fa-row fa-no"
					><span class="fa-k">Flug-Nr.</span><span class="fa-v fa-col"
						><input
							class="fa-in"
							type="text"
							placeholder="z. B. LH 400"
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
							value={n}
							oninput={(e) => f.set(1, e.currentTarget.value)}
						/>{#if n.trim()}<small class:ok={!!info.p?.airline} class:bad={!!info.p?.err}
								>{info.p?.airline && al ? al[info.p.airline][0] : info.p?.err ? 'Airline nicht gefunden' : ''}</small
							>{/if}</span
					></label
				>
				<label class="fa-row"><span class="fa-k">Abflug</span><input class="fa-in" type="time" value={t1} oninput={(e) => f.set(2, e.currentTarget.value)} /></label>
				<label class="fa-row"
					><span class="fa-k">Ankunft</span>{#if info.plus}<span class="fa-plus">+{info.plus} Tag</span>{/if}<input
						class="fa-in"
						type="time"
						value={t2}
						oninput={(e) => f.set(3, e.currentTarget.value)}
					/></label
				>
			</div>
		{/snippet}
		{#if askLand}
			<div class="fa-card">
				<button type="button" class="fa-row fa-mark" role="switch" aria-checked={mark} onclick={() => (mark = !mark)}
					><span class="fa-flag" aria-hidden="true">{flag(land)}</span><span class="fa-mk"
						><b>{later ? `${nameOf(land)} eintragen, sobald du dort bist` : `${nameOf(land)} als bereist eintragen`}</b><small
							>Nur umgestiegen? Dann ausschalten.</small
						></span
					><span class="fa-sw" class:on={mark} aria-hidden="true"></span></button
				>
			</div>
		{/if}
		{@render legCard(back ? `Hinflug ${from || ''} → ${to || ''}` : '', out, {
			get: () => [date, no, dep, arr],
			set: (i, v) => (i === 0 ? (date = v) : i === 1 ? (no = v) : i === 2 ? (dep = v) : (arr = v))
		})}
		{#if ret}
			{@render legCard(
				`Rückflug ${to || ''} → ${from || ''}`,
				ret,
				{ get: () => [rdate, rno, rdep, rarr], set: (i, v) => (i === 0 ? (rdate = v) : i === 1 ? (rno = v) : i === 2 ? (rdep = v) : (rarr = v)) },
				() => (back = false)
			)}
		{:else if !old}
			<div class="fa-card">
				<button type="button" class="fa-row fa-back" onclick={addBack}
					><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-3.5-3.5M17 17H6l3.5 3.5" /></svg>Rückflug hinzufügen</button
				>
			</div>
		{/if}
		{#if problems.length}
			<ul class="fa-err" role="alert">
				{#each problems as e (e)}<li>{e}</li>{/each}
			</ul>
		{/if}
		<p class="note fa-note">Flugnummer und Uhrzeiten sind freiwillig. Uhrzeiten in Ortszeit, wie auf der Bordkarte. Flüge ab morgen gelten als geplant.</p>
	{/if}
</div>
{#if !active}
	<div class="pick-bar">
		<button type="button" class="btn" onclick={() => (old ? sheetBack() : closeSheet())}>Abbrechen</button>
		{#if old}
			<button type="button" class="btn primary fa-go" disabled={!ready} onclick={save}>Speichern</button>
		{:else}
			<button type="button" class="btn primary fa-go" disabled={!ready} onclick={add}
				>{from && to ? `${from} ${back ? '⇄' : '→'} ${to} hinzufügen` : 'Hinzufügen'}</button
			>
		{/if}
	</div>
{/if}
