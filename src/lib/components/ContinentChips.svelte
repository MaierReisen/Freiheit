<script lang="ts">
	import { atlas, isCounted } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, CONT_VIEW, type ContinentCode } from '$lib/countries';
	import { hooks, ui } from '$lib/app.svelte';

	/** all: alle Kontinente zeigen (Vollbild-Panel), sonst nur bereiste plus den gewählten, nach Anzahl sortiert.
	    Gewählt (gedrückt) ist der zuletzt angetippte Kontinent, anfangs die Startregion aus den Einstellungen. */
	let { id, all = false }: { id: string; all?: boolean } = $props();

	const keys = Object.keys(CONT_VIEW) as ContinentCode[];
	const counts = $derived.by(() => {
		const c: Partial<Record<ContinentCode, number>> = {};
		atlas.data.countries.forEach((x) => {
			const k = CONT[x.code];
			if (k && isCounted(x.code)) c[k] = (c[k] || 0) + 1;
		});
		return c;
	});
	const home = $derived(atlas.settings.homeContinent);
	const active = $derived((ui.focusContinent as ContinentCode | null) ?? home);
	const shown = $derived(all ? keys : keys.filter((k) => counts[k] || k === active).sort((a, b) => (counts[b] || 0) - (counts[a] || 0)));

	function onClick(k: ContinentCode) {
		ui.focusContinent = k;
		hooks.map?.flyToContinent(k);
		if (!ui.full) hooks.map?.scrollIntoView();
	}
</script>

<div class="continents" {id}>
	{#each shown as k (k)}
		<button type="button" class="cont" data-cont={k} aria-pressed={k === active} title={k === home ? 'Startregion' : undefined} onclick={() => onClick(k)}
			><b>{counts[k] || 0}</b>{CONT_NAMES[k]}{#if k === home}<span class="sr-only"> (Startregion)</span>{/if}</button
		>
	{/each}
</div>
