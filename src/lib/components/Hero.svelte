<script lang="ts">
	import { untrack } from 'svelte';
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { scopeTotal } from '$lib/scope';
	import { CONT, CONT_NAMES, contOf } from '$lib/countries';
	import { reduceMotion, dom, easeOutCubic, hooks, introProgress, openPicker, openPlaces, ui } from '$lib/app.svelte';
	import { rankIndex, ranks } from '$lib/passport';
	import { badges, tierName } from '$lib/badges';
	import { loadFacts } from '$lib/facts';
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
		bumpT: ReturnType<typeof setTimeout> | undefined,
		rankT: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const now = n,
			cont = continents;
		untrack(() => {
			const before = prevN,
				contBefore = prevCont,
				addedAll = [...atlas.lastAddedCodes];
			prevN = now;
			prevCont = cont;
			if (before < 0 || now <= before || t < 1 || Date.now() - atlas.lastAddedAt > 2000) return;
			const newCont = cont > contBefore && contBefore >= 0;
			if (newCont) {
				// mehrere Länder auf einmal: alle neuen Kontinente in einer Karte
				const had = new Set(counted.filter((c) => !addedAll.includes(c.code)).map((c) => CONT[c.code]));
				const names = [...new Set(addedAll.map((c) => CONT[c]).filter((k) => k && !had.has(k)))].map((k) => CONT_NAMES[k]);
				ui.unlock = { key: ui.unlock.key + 1, cont: names.join(' · ') || (CONT[atlas.lastAddedCode] ? CONT_NAMES[CONT[atlas.lastAddedCode]] : ''), n: cont, rank: '', badge: '', icon: '', sub: '' };
			}
			let delay = newCont ? 3900 : 0;
			// neuer Rang im Reisepass: eigene Feier-Karte (nach der Kontinent-Karte, falls beides zugleich)
			const ri = rankIndex(now, total);
			if (ri > rankIndex(before, total)) {
				clearTimeout(rankT);
				const r = ranks(total)[ri];
				rankT = setTimeout(() => (ui.unlock = { key: ui.unlock.key + 1, cont: '', n: now, rank: r.name, badge: '', icon: r.icon, sub: '' }), delay);
				delay += 3900;
			}
			// neues Abzeichen bzw. neue Stufe: vorher/nachher vergleichen (Länderfakten werden dafür nachgeladen)
			const list = counted;
			loadFacts().then((facts) => {
				const scope = atlas.settings.countryScope,
					entered = Object.fromEntries(list.map((c) => [c.code, c.entered]));
				const codes = list.map((c) => c.code);
				const was = badges({ codes: codes.filter((c) => !addedAll.includes(c)), facts, entered }, scope);
				const up = badges({ codes, facts, entered }, scope).filter((b, i) => b.level > was[i].level);
				if (!up.length) return;
				const b = up[up.length - 1],
					more = up.length > 1 ? ` · +${up.length - 1} weitere` : '';
				setTimeout(
					() => (ui.unlock = { key: ui.unlock.key + 1, cont: '', n: now, rank: '', badge: b.name, icon: b.icon, sub: `${tierName(b, b.level)} · ${b.fmt(b.v)} ${b.what}${more}` }),
					delay
				);
			});
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
			onclick={() => openPlaces()}
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
