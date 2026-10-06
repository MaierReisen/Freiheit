<script lang="ts">
	import { untrack } from 'svelte';
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { scopeTotal } from '$lib/scope';
	import { CONT, CONT_NAMES, contOf } from '$lib/countries';
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

	// Selbst hinzugefügtes Land: geänderte Ziffern rollen wie ein Zählwerk (von rechts nach links versetzt),
	// dahinter leuchtet die Sonne kurz auf. Nicht beim Laden/Sync. Neuer Kontinent → Feier-Karte.
	let bump = $state({ key: 0, from: 0, on: false });
	let prevN = -1,
		prevCont = -1,
		bumpT: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const now = n,
			cont = continents;
		untrack(() => {
			const before = prevN,
				contBefore = prevCont;
			prevN = now;
			prevCont = cont;
			if (before < 0 || now <= before || t < 1 || Date.now() - atlas.lastAddedAt > 2000) return;
			if (cont > contBefore && contBefore >= 0) {
				const k = CONT[atlas.lastAddedCode];
				ui.unlock = { key: ui.unlock.key + 1, cont: k ? CONT_NAMES[k] : '', n: cont };
			}
			if (reduceMotion()) return;
			clearTimeout(bumpT);
			bump = { key: bump.key + 1, from: before, on: true };
			bumpT = setTimeout(() => (bump = { ...bump, on: false }), 1400);
			navigator.vibrate?.(cont > contBefore ? [14, 70, 24] : 12);
		});
	});
	// Ziffern für das Zählwerk: rechtsbündig gegen die alte Zahl verglichen
	const digits = $derived.by(() => {
		const nw = String(shownN),
			od = String(bump.from).padStart(nw.length, ' ').slice(-nw.length);
		return [...nw].map((d, i) => ({ d, old: bump.on && od[i] !== d ? od[i] : null, delay: (nw.length - 1 - i) * 90 }));
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
			<span class="count-wrap" class:bump={bump.on}
				>{#if bump.on}{#key bump.key}<span class="count-halo" aria-hidden="true"></span>{/key}{/if}<span class="count" class:d3={n >= 100} id="count" bind:this={countEl}
					>{#key bump.key}{#each digits as g, i (i)}{#if g.old !== null}<span
									class="dg roll"
									style="--d:{g.delay}ms"><span class="dg-old" aria-hidden="true">{g.old}</span><span class="dg-new">{g.d}</span></span
								>{:else}{g.d}{/if}{/each}{/key}</span
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
