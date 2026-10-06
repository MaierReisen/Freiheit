<script lang="ts">
	import { atlas, isCounted } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, CONT_VIEW, type ContinentCode } from '$lib/countries';
	import { hooks, reduceMotion, ui } from '$lib/app.svelte';

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

	// gedrückter Knopf außerhalb der sichtbaren Leiste: Leiste sanft dorthin rollen (nur waagerecht, Seite bleibt stehen)
	let bar: HTMLDivElement;
	$effect(() => {
		const k = active;
		const btn = bar?.querySelector<HTMLElement>(`[data-cont="${k}"]`);
		if (!btn) return;
		const l = btn.offsetLeft - bar.offsetLeft,
			r = l + btn.offsetWidth;
		if (l < bar.scrollLeft || r > bar.scrollLeft + bar.clientWidth)
			bar.scrollTo({ left: Math.max(0, l - 16), behavior: reduceMotion() ? 'auto' : 'smooth' });
	});

	function onClick(k: ContinentCode) {
		ui.focusContinent = k;
		hooks.map?.flyToContinent(k);
		if (!ui.full) hooks.map?.scrollIntoView();
	}
</script>

<div class="continents" {id} bind:this={bar}>
	{#each shown as k (k)}
		<button type="button" class="cont" class:fresh={ui.unlock.key > 0 && ui.unlock.cont === CONT_NAMES[k]} data-cont={k} aria-pressed={k === active} title={k === home ? 'Startregion' : undefined} onclick={() => onClick(k)}
			><b>{counts[k] || 0}</b>{CONT_NAMES[k]}{#if k === home}<span class="sr-only"> (Startregion)</span>{/if}</button
		>
	{/each}
</div>
