<script lang="ts">
	import { untrack } from 'svelte';
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { scopeTotal } from '$lib/scope';
	import { contOf } from '$lib/countries';
	import { reduceMotion, dom, easeOutCubic, hooks, introProgress, openPicker, ui } from '$lib/app.svelte';
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

	// Start-Animation: Länderzahl und Kontinente zählen hoch (schnell, dann langsamer) und enden
	// gleichzeitig mit Globus und Flugkurve. Nachgeladene Länder werden unterwegs mitgezählt.
	let t = $state(reduceMotion() ? 1 : 0);
	$effect(() => {
		const it = ui.intro;
		if (!it.key) return;
		let raf = 0;
		const step = () => {
			t = introProgress();
			if (t < 1) raf = requestAnimationFrame(step);
		};
		step();
		// Absicherung, falls keine Animationsbilder kommen (App im Hintergrund)
		const done = setTimeout(() => (t = 1), Math.max(0, it.end - performance.now()) + 300);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(done);
		};
	});
	const shownN = $derived(t >= 1 ? n : Math.round(easeOutCubic(t) * n));
	const shownCont = $derived(t >= 1 ? continents : Math.round(easeOutCubic(t) * continents));

	// Selbst hinzugefügtes Land: alte Zahl rollt weg, neue rollt mit Glanz nach (nicht beim Laden/Sync)
	let bump = $state({ key: 0, from: 0 });
	let prevN = -1;
	$effect(() => {
		const now = n;
		untrack(() => {
			const before = prevN;
			prevN = now;
			if (before < 0 || now <= before || t < 1 || reduceMotion() || Date.now() - atlas.lastAddedAt > 2000) return;
			bump = { key: bump.key + 1, from: before };
			navigator.vibrate?.(12);
		});
	});
</script>

<section class="hero" aria-live="polite">
	<div class="hero-row">
		<button
			type="button"
			class="count-btn"
			id="countBtn"
			aria-label="{n} von {total} Ländern bereist, {pct} Prozent. Zur Länderliste"
			onclick={() => hooks.places?.open(false)}
		>
			<span class="count-wrap"><span class="count" class:d3={n >= 100} id="count" bind:this={countEl}
					>{#if bump.key}{#key bump.key}<span class="count-out" aria-hidden="true">{bump.from}</span>{/key}{/if}{#key bump.key}<span
							class="count-in"
							class:bump={bump.key > 0}>{shownN}</span
						>{/key}</span
				></span>
			<span class="count-meta">
				<span class="count-label" id="countLabel">{shownN === 1 ? 'Land bereist' : 'Länder bereist'}</span>
				<span class="count-sub" id="countSub">von {total}{continents ? ` · auf ${shownCont} Kontinent${shownCont === 1 ? '' : 'en'}` : ''}</span>
			</span>
		</button>
		<button type="button" class="hero-add" id="heroAdd" aria-label="Land hinzufügen" onclick={() => openPicker('visited')}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg><span>Land</span></button
		>
	</div>
	<HeroFlight progress={total ? n / total : 0} />
</section>
