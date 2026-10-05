<script lang="ts">
	import { atlas } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, CONT_VIEW, type ContinentCode } from '$lib/countries';
	import { hooks, ui } from '$lib/app.svelte';

	/** all: alle Kontinente zeigen (Vollbild-Panel), sonst nur bereiste plus die Startregion, nach Anzahl sortiert */
	let { id, all = false }: { id: string; all?: boolean } = $props();

	const keys = Object.keys(CONT_VIEW) as ContinentCode[];
	const counts = $derived.by(() => {
		const c: Partial<Record<ContinentCode, number>> = {};
		atlas.data.countries.forEach((x) => {
			const k = CONT[x.code];
			if (k) c[k] = (c[k] || 0) + 1;
		});
		return c;
	});
	const home = $derived(atlas.settings.homeContinent);
	const shown = $derived(all ? keys : keys.filter((k) => counts[k] || k === home).sort((a, b) => (counts[b] || 0) - (counts[a] || 0)));

	function onClick(k: ContinentCode) {
		hooks.map?.flyToContinent(k);
		if (!ui.full) hooks.map?.scrollIntoView();
	}
</script>

<div class="continents" {id}>
	{#each shown as k (k)}
		<button type="button" class="cont" class:home={k === home} data-cont={k} title={k === home ? 'Startregion' : undefined} onclick={() => onClick(k)}
			><b>{counts[k] || 0}</b>{CONT_NAMES[k]}{#if k === home}<span class="sr-only"> (Startregion)</span>{/if}</button
		>
	{/each}
</div>
