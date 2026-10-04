<script lang="ts">
	import { atlas } from '$lib/atlas.svelte';
	import { contOf } from '$lib/countries';
	import { dom, hooks, openPicker, ui } from '$lib/app.svelte';

	let countEl: HTMLSpanElement;
	$effect(() => {
		dom.count = countEl;
		return () => (dom.count = null);
	});

	const n = $derived(atlas.data.countries.length);
	const continents = $derived(new Set(atlas.data.countries.map((c) => contOf(c.code) || 'Sonstige')).size);
</script>

<section class="hero" aria-live="polite">
	<div class="sun-clip" aria-hidden="true"><div class="sun"></div></div>
	<div class="hero-row">
		<button
			type="button"
			class="count-btn"
			class:hint={ui.countHint}
			id="countBtn"
			aria-haspopup="dialog"
			aria-label="{n} {n === 1 ? 'Land' : 'Länder'} bereist. Übersicht öffnen"
			onclick={() => hooks.places?.open(false)}
		>
			<span class="count-wrap"><span class="count" id="count" bind:this={countEl}>{n}</span></span>
			<span class="count-meta">
				<span class="count-label" id="countLabel">{n === 1 ? 'Land bereist' : 'Länder bereist'}</span>
				<span class="count-sub" id="countSub">{continents ? `auf ${continents} Kontinent${continents === 1 ? '' : 'en'}` : ''}</span>
				<span class="count-more">Alle ansehen<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></span>
			</span>
		</button>
		<button type="button" class="hero-add" id="heroAdd" aria-label="Land hinzufügen" onclick={() => openPicker('visited')}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg><span>Land</span></button
		>
	</div>
</section>
