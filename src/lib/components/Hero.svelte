<script lang="ts">
	import { untrack } from 'svelte';
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { scopeTotal } from '$lib/scope';
	import { CONT, CONT_NAMES, contOf, flag } from '$lib/countries';
	import { tourPlan } from '$lib/addTour';
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
	// Mehrere Länder auf einmal: Zahl (und Kontinente) zählen im Takt der Globus-Tour hoch (Plan: addTour.ts)
	let tourN = $state<number | null>(null),
		tourCont = $state<number | null>(null);
	const shownN = $derived(tourN ?? (t >= 1 ? n : Math.round(easeOutCubic(t) * n)));
	const shownCont = $derived(tourCont ?? (t >= 1 ? continents : Math.round(easeOutCubic(t) * continents)));

	// Selbst hinzugefügtes Land: geänderte Ziffern rollen wie ein Zählwerk (von rechts nach links versetzt),
	// dahinter leuchtet die Sonne kurz auf. Nicht beim Laden/Sync. Danach Feier-Karten nacheinander (je 3,9 s, nie überlappend):
	// bei mehreren Ländern „+N Länder“, dann neuer Kontinent, neuer Rang, neue Abzeichen.
	let bump = $state({ key: 0, from: 0, on: false });
	let prevN = -1,
		prevCont = -1,
		bumpT: ReturnType<typeof setTimeout> | undefined,
		timers: ReturnType<typeof setTimeout>[] = [];
	const CARD = 3900;
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
			timers.forEach(clearTimeout);
			timers = [];
			const t0 = Date.now(),
				m = addedAll.length,
				calm = reduceMotion(),
				plan = m > 1 && !calm ? tourPlan(m) : null,
				at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, Math.max(0, ms - (Date.now() - t0))));
			const card = (c: Partial<typeof ui.unlock>) => (ui.unlock = { key: ui.unlock.key + 1, cont: '', n: now, rank: '', badge: '', icon: '', sub: '', added: '', ...c });
			let slot = 0;
			const base = plan ? plan.end : 0;
			if (m > 1) at(base + slot++ * CARD, () => card({ sub: String(m), added: addedAll.map(flag).join('') }));
			if (cont > contBefore && contBefore >= 0) {
				// mehrere Länder auf einmal: alle neuen Kontinente in einer Karte
				const had = new Set(counted.filter((c) => !addedAll.includes(c.code)).map((c) => CONT[c.code]));
				const names = [...new Set(addedAll.map((c) => CONT[c]).filter((k) => k && !had.has(k)))].map((k) => CONT_NAMES[k]);
				const label = names.join(' · ') || (CONT[atlas.lastAddedCode] ? CONT_NAMES[CONT[atlas.lastAddedCode]] : '');
				at(base + slot++ * CARD, () => card({ cont: label, n: cont }));
			}
			// neuer Rang im Reisepass: eigene Feier-Karte
			const ri = rankIndex(now, total);
			if (ri > rankIndex(before, total)) {
				const r = ranks(total)[ri];
				at(base + slot++ * CARD, () => card({ rank: r.name, icon: r.icon }));
			}
			// neues Abzeichen bzw. neue Stufe: vorher/nachher vergleichen (Länderfakten werden dafür nachgeladen), jedes eine Karte
			const list = counted,
				slot0 = slot;
			loadFacts().then((facts) => {
				const scope = atlas.settings.countryScope,
					entered = Object.fromEntries(list.map((c) => [c.code, c.entered]));
				const codes = list.map((c) => c.code);
				const was = badges({ codes: codes.filter((c) => !addedAll.includes(c)), facts, entered }, scope);
				const up = badges({ codes, facts, entered }, scope).filter((b, i) => b.level > was[i].level);
				up.slice(0, 3).forEach((b, k) => at(base + (slot0 + k) * CARD, () => card({ badge: b.name, icon: b.icon, sub: `${tierName(b, b.level)} · ${b.fmt(b.v)} ${b.what}` })));
			});
			if (calm) return;
			clearTimeout(bumpT);
			if (plan) {
				// Tour: Zahl springt je angekommenem Land weiter
				let last = before;
				tourN = before;
				tourCont = contBefore;
				plan.arrive.forEach((ms, i) =>
					at(ms, () => {
						const v = before + Math.round(((i + 1) / m) * (now - before));
						bump = { key: bump.key + 1, from: last, on: true };
						tourN = last = v;
						clearTimeout(bumpT);
						bumpT = setTimeout(() => (bump = { ...bump, on: false }), 600);
					})
				);
				at(plan.end - 200, () => {
					tourN = tourCont = null;
					navigator.vibrate?.(cont > contBefore ? [14, 70, 24] : 12);
				});
				return;
			}
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
