<script lang="ts">
	import { atlas } from '$lib/atlas.svelte';

	/* Länder pro Jahr: Meilensteine aus den Daten plus der heutige Stand */
	const pts = $derived.by(() => {
		const ms = (atlas.data.milestones || []).slice().sort((a, b) => a.year - b.year);
		if (!ms.length) return [];
		return [...ms.map((m) => ({ y: String(m.year), n: m.count })), { y: 'Heute', n: atlas.data.countries.length }];
	});
	const max = $derived(Math.max(...pts.map((p) => p.n), 1));
</script>

<section id="tlSection" hidden={!pts.length}>
	<h2 style="margin-top:8px">Länder pro Jahr</h2>
	<div class="timeline" id="timeline">
		{#each pts as p, i (i)}
			<div class="tl"><span class="tl-n">{p.n}</span><div class="tl-bar" style="height:{Math.max(8, (p.n / max) * 100)}px"></div><span class="tl-y">{p.y}</span></div>
		{/each}
	</div>
</section>
