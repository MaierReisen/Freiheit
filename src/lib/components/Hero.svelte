<script lang="ts">
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { scopeTotal } from '$lib/scope';
	import { contOf } from '$lib/countries';
	import { dom, hooks, openPicker, ui } from '$lib/app.svelte';
	import HeroFlight from './HeroFlight.svelte';

	let countEl: HTMLSpanElement;
	$effect(() => {
		dom.count = countEl;
		return () => (dom.count = null);
	});

	// gezählt wird nur, was in der gewählten Länderliste (Einstellungen) als Land gilt
	const counted = $derived(countedCountries());
	const n = $derived(counted.length);
	const total = $derived(scopeTotal(atlas.settings.countryScope));
	const pct = $derived(total ? Math.round((n / total) * 100) : 0);
	const continents = $derived(new Set(counted.map((c) => contOf(c.code) || 'Sonstige')).size);
</script>

<section class="hero" aria-live="polite">
	<div class="sun-clip" aria-hidden="true"><div class="sun"></div></div>
	<HeroFlight progress={total ? n / total : 0} label="{pct} % der Welt" />
	<div class="hero-row">
		<button
			type="button"
			class="count-btn"
			class:hint={ui.countHint}
			id="countBtn"
			aria-haspopup="dialog"
			aria-label="{n} von {total} Ländern bereist, {pct} Prozent. Übersicht öffnen"
			onclick={() => hooks.places?.open(false)}
		>
			<span class="count-wrap"><span class="count" class:d3={n >= 100} id="count" bind:this={countEl}>{n}</span></span>
			<span class="count-meta">
				<span class="count-label" id="countLabel">{n === 1 ? 'Land bereist' : 'Länder bereist'}</span>
				<span class="count-sub" id="countSub">von {total}{continents ? ` · auf ${continents} Kontinent${continents === 1 ? '' : 'en'}` : ''}</span>
				<span class="count-more">Alle ansehen<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></span>
			</span>
		</button>
		<button type="button" class="hero-add" id="heroAdd" aria-label="Land hinzufügen" onclick={() => openPicker('visited')}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg><span>Land</span></button
		>
	</div>
</section>
