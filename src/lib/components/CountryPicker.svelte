<script lang="ts">
	import { addCountries, isCounted, visitedSet } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, compareNames, contOf, flag, nameOf } from '$lib/countries';
	import { ALL } from '$lib/map/geo';
	import { closeSheet, hooks, openCountry, toast, type PickerMode } from '$lib/app.svelte';

	/* mode "fly": Land auf der Karte suchen (alle Länder und Gebiete).
	   Sonst Länder als bereist hinzufügen – auch Gebiete (bekommen einen Stempel, zählen aber nicht, Hinweis „zählt nicht“). Wie „Auswählen“ in der Länderliste:
	   Länder antippen = markieren (Haken), unten „Alle“ / „Hinzufügen“. Die Reihenfolge des Antippens bestimmt „Land Nr. X“.
	   Suche und Auswahl bleiben unabhängig: markierte Länder bleiben auch nach neuer Suche markiert. */
	let { mode }: { mode: PickerMode } = $props();

	// Das Sheet wird bei jedem Öffnen neu aufgebaut: mode ist während der Lebensdauer fest
	// svelte-ignore state_referenced_locally
	const flyMode = mode === 'fly';
	let q = $state('');
	const visited = visitedSet();

	// Sortierung wie in der Länderliste (Nr./Neueste gibt es hier nicht, die Länder sind ja noch nicht bereist); gemerkt für nächstes Mal
	type Sort = 'az' | 'cont';
	const SORTS: { id: Sort; label: string }[] = [
		{ id: 'az', label: 'A–Z' },
		{ id: 'cont', label: 'Kontinent' }
	];
	const SORT_KEY = 'freiheit-pick-sort';
	let sort = $state<Sort>('az');
	try {
		if (localStorage.getItem(SORT_KEY) === 'cont') sort = 'cont';
	} catch {}
	function setSort(s: Sort) {
		sort = s;
		try {
			localStorage.setItem(SORT_KEY, s);
		} catch {}
	}

	const items = $derived.by(() => {
		const s = q.trim().toLowerCase();
		const list = ALL.filter((c) => (flyMode || !visited.has(c)) && (!s || nameOf(c).toLowerCase().includes(s)));
		return list.sort((a, b) => compareNames(nameOf(a), nameOf(b)));
	});
	// Nach Kontinent: Gruppen nach Anzahl, innerhalb alphabetisch (wie in der Länderliste)
	const groups = $derived.by(() => {
		const m = new Map<string, string[]>();
		for (const c of items) {
			const k = CONT[c] || '';
			if (!m.has(k)) m.set(k, []);
			m.get(k)!.push(c);
		}
		return [...m.entries()]
			.map(([k, list]) => ({ name: CONT_NAMES[k as keyof typeof CONT_NAMES] || 'Sonstige', list }))
			.sort((a, b) => b.list.length - a.list.length || compareNames(a.name, b.name));
	});

	let picked = $state<string[]>([]);
	const allShownPicked = $derived(items.length > 0 && items.every((c) => picked.includes(c)));

	function choose(code: string) {
		if (flyMode) {
			closeSheet();
			hooks.map?.flyToCountry(code, { ms: 1100 });
			openCountry(code, { peek: true });
			return;
		}
		picked = picked.includes(code) ? picked.filter((c) => c !== code) : [...picked, code];
	}
	function toggleAll() {
		picked = allShownPicked ? picked.filter((c) => !items.includes(c)) : [...picked, ...items.filter((c) => !picked.includes(c))];
	}
	function addPicked() {
		const n = picked.length;
		if (!n) return;
		closeSheet();
		addCountries(picked);
		if (n > 1) toast(`${n} Länder hinzugefügt`);
	}
</script>

<h3 id="sheetTitle">{flyMode ? 'Land auf der Karte suchen' : 'Land hinzufügen'}</h3>
<input class="search" id="pickSearch" type="search" placeholder="Land suchen" autocomplete="off" style="margin-top:12px" bind:value={q} />
<div class="seg sort-seg" role="group" aria-label="Sortierung">
	{#each SORTS as o (o.id)}
		<button type="button" aria-pressed={sort === o.id} onclick={() => setSort(o.id)}>{o.label}</button>
	{/each}
</div>
<ul class="pick-list" id="pickList">
	{#if sort === 'cont'}
		{#each groups as g (g.name)}
			<li class="pick-sub" role="presentation">{g.name} <span class="h-count">{g.list.length}</span></li>
			{#each g.list as c (c)}{@render row(c)}{/each}
		{/each}
	{:else}
		{#each items as c (c)}{@render row(c)}{/each}
	{/if}
	{#if !items.length}
		<li class="empty">Kein Land gefunden.</li>
	{/if}
</ul>
{#snippet row(c: string)}
	<li class:sel-li={!flyMode} class:on={picked.includes(c)}>
		<button data-code={c} aria-pressed={flyMode ? undefined : picked.includes(c)} onclick={() => choose(c)}
			>{#if !flyMode}<span class="chk" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>{/if}<span>{flag(c)}</span>{flyMode && visited.has(c) ? '✓ ' : ''}{nameOf(c)}<span class="ct">{contOf(c)}{!isCounted(c) ? ' · zählt nicht' : ''}</span></button
		>
	</li>
{/snippet}
{#if !flyMode}
	<div class="pick-bar">
		<span class="lv-bar-n">{picked.length ? `${picked.length} ausgewählt` : 'Länder antippen'}</span>
		<button type="button" class="btn" onclick={toggleAll} disabled={!items.length}>{allShownPicked ? 'Keine' : 'Alle'}</button>
		<button type="button" class="btn primary" disabled={!picked.length} onclick={addPicked}>Hinzufügen</button>
	</div>
{/if}
