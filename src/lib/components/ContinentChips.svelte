<script lang="ts">
	import { atlas } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, CONT_VIEW, type ContinentCode } from '$lib/countries';
	import { hooks, ui } from '$lib/app.svelte';

	/** all: alle Kontinente zeigen (Vollbild-Panel), sonst nur bereiste, nach Anzahl sortiert */
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
	const shown = $derived(all ? keys : keys.filter((k) => counts[k]).sort((a, b) => counts[b]! - counts[a]!));

	function onClick(k: ContinentCode) {
		hooks.map?.flyToContinent(k);
		if (!ui.full) hooks.map?.scrollIntoView();
	}
</script>

<div class="continents" {id}>
	{#each shown as k (k)}
		<button type="button" class="cont" data-cont={k} onclick={() => onClick(k)}><b>{counts[k] || 0}</b>{CONT_NAMES[k]}</button>
	{/each}
</div>
