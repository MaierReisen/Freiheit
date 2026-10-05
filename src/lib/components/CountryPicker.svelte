<script lang="ts">
	import { addCountry, isCounted, visitedSet } from '$lib/atlas.svelte';
	import { contOf, flag, nameOf } from '$lib/countries';
	import { ALL } from '$lib/map/geo';
	import { closeSheet, hooks, openCountry, type PickerMode } from '$lib/app.svelte';

	/* mode "fly": Land auf der Karte suchen (alle Länder und Gebiete),
	   sonst Land als bereist hinzufügen – nur Länder, die in der gewählten Länderliste zählen */
	let { mode }: { mode: PickerMode } = $props();

	// Das Sheet wird bei jedem Öffnen neu aufgebaut: mode ist während der Lebensdauer fest
	// svelte-ignore state_referenced_locally
	const flyMode = mode === 'fly';
	let q = $state('');
	const visited = visitedSet();

	const items = $derived.by(() => {
		const s = q.trim().toLowerCase();
		return ALL.filter((c) => (flyMode || (!visited.has(c) && isCounted(c))) && (!s || nameOf(c).toLowerCase().includes(s)));
	});

	function choose(code: string) {
		if (flyMode) {
			closeSheet();
			hooks.map?.flyToCountry(code, { ms: 1100 });
			openCountry(code);
			return;
		}
		addCountry(code);
		closeSheet();
	}
</script>

<h3 id="sheetTitle">{flyMode ? 'Land auf der Karte suchen' : 'Land hinzufügen'}</h3>
<input class="search" id="pickSearch" type="search" placeholder="Land suchen" autocomplete="off" style="margin-top:12px" bind:value={q} />
<ul class="pick-list" id="pickList">
	{#each items as c (c)}
		<li>
			<button data-code={c} onclick={() => choose(c)}
				><span>{flag(c)}</span>{flyMode && visited.has(c) ? '✓ ' : ''}{nameOf(c)}<span class="ct">{contOf(c)}{flyMode && !isCounted(c) ? ' · zählt nicht' : ''}</span></button
			>
		</li>
	{:else}
		<li class="empty">Kein Land gefunden.</li>
	{/each}
</ul>
