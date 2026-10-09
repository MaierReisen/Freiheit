<script lang="ts">
	import { tick } from 'svelte';
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, compareNames, flag, nameOf, type ContinentCode } from '$lib/countries';
	import { SCOPES, scopeCodes } from '$lib/scope';
	import { CONT_BADGES, TIER_NAMES } from '$lib/badges';
	import { longDate } from '$lib/passport';
	import { closeContinents, hooks, openCountry, openPass, reduceMotion, ui } from '$lib/app.svelte';
	import { swipeClose } from '$lib/swipeClose';

	/* Seite „Deine Kontinente“ (öffnet über den Block auf der Startseite): je Kontinent eine Karte mit Fortschrittsring.
	   Antippen klappt die Länder des Kontinents auf (bereiste mit Flagge, fehlende blass), dazu „Zuerst betreten“,
	   das Kontinent-Abzeichen aus dem Pass und „Auf dem Globus zeigen“. Gesamtzahl je nach gewählter Länderliste. */

	const KEYS = Object.keys(CONT_NAMES) as ContinentCode[];
	const R = 19,
		CIRC = 2 * Math.PI * R;

	const scope = $derived(atlas.settings.countryScope);
	const scopeLabel = $derived(SCOPES.find((s) => s.id === scope)?.label ?? '');
	// alle Länder der Liste je Kontinent, alphabetisch (nur bei Wechsel der Länderliste neu)
	const pool = $derived.by(() => {
		const m = Object.fromEntries(KEYS.map((k) => [k, [] as string[]])) as Record<ContinentCode, string[]>;
		for (const c of scopeCodes(scope)) if (CONT[c]) m[CONT[c]].push(c);
		for (const k of KEYS) m[k].sort((a, b) => compareNames(nameOf(a), nameOf(b)));
		return m;
	});
	// bereiste Länder (eigene Reihenfolge): je Kontinent Menge und erstes Land
	const stats = $derived.by(() => {
		const list = countedCountries();
		return KEYS.map((k) => {
			const mine = list.filter((c) => CONT[c.code] === k);
			const total = pool[k].length,
				n = mine.length;
			// Abzeichen wie im Pass: Bronze ¼, Silber ½, Gold alle Länder (Antarktis hat keins)
			const tiers = CONT_BADGES[k as keyof typeof CONT_BADGES] ? [...new Set([Math.ceil(total / 4), Math.ceil(total / 2), total].filter((t) => t > 0))] : [];
			const level = tiers.filter((t) => n >= t).length;
			return { k, n, total, p: total ? n / total : 0, have: new Set(mine.map((c) => c.code)), first: mine[0], tiers, level };
		});
	});
	const reached = $derived(stats.filter((s) => s.n).length);

	let open = $state<ContinentCode | null>(null);
	let view: HTMLElement;

	// beim Öffnen: Wisch-Zustand vom letzten Schließen sicher löschen, zugeklappt beginnen
	$effect(() => {
		if (ui.continentsOpen && view) {
			view.style.transform = '';
			view.style.transition = '';
			view.classList.remove('swiping', 'down');
		}
	});
	$effect(() => {
		if (!ui.continentsOpen) open = null;
	});

	async function toggle(k: ContinentCode) {
		open = open === k ? null : k;
		if (!open) return;
		await tick();
		view.querySelector(`[data-cont-card="${k}"]`)?.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
	}
	const tierName = (s: (typeof stats)[number], level: number) => TIER_NAMES[level - 1 + 3 - s.tiers.length] ?? '';

	function showOnGlobe(s: (typeof stats)[number]) {
		closeContinents(false, false);
		ui.focusContinent = s.k;
		const m = hooks.map;
		if (!m) return;
		m.flyToContinent(s.k);
		// bereiste Länder leuchten auf, wenn der Globus ankommt
		if (s.n) m.highlight([...s.have], reduceMotion() ? 0 : 800, 2600);
		requestAnimationFrame(() => m.scrollIntoView());
	}
	function showBadge(k: ContinentCode) {
		ui.passBadge = 'c' + k;
		openPass();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov set-view" id="continentsView" role="dialog" aria-modal="true" aria-labelledby="contsTitle" hidden={!ui.continentsOpen} bind:this={view} use:swipeClose={{ onclose: () => closeContinents(false) }}>
	<div class="ov-head lv-head">
		<button type="button" class="ov-close" id="contsClose" aria-label="Deine Kontinente schließen" onclick={() => closeContinents(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="contsTitle">Deine Kontinente <span class="ov-of">{reached} von {KEYS.length}</span></h1>
	</div>
	{#if ui.continentsOpen}
		<div class="ov-body cv-body">
			<ul class="cv-list">
				{#each stats as s (s.k)}
					<li class="cv-card" class:open={open === s.k} class:none={!s.n} data-cont-card={s.k} style="--cc:var(--ct-{s.k})">
						<button type="button" class="cv-head" aria-expanded={open === s.k} onclick={() => toggle(s.k)}>
							<span class="cv-ring" aria-hidden="true">
								<svg viewBox="0 0 44 44"
									><circle cx="22" cy="22" r={R} class="bg" /><circle cx="22" cy="22" r={R} class="fg" stroke-dasharray="{s.p * CIRC} {CIRC}" /></svg
								>
								<b>{Math.round(s.p * 100)}<small>%</small></b>
							</span>
							<span class="cv-txt">
								<span class="cv-name">{CONT_NAMES[s.k]}</span>
								<span class="cv-sub">{s.n} von {s.total} {s.total === 1 ? 'Land' : 'Ländern'}</span>
							</span>
							{#if s.level}<span class="cv-medal t{s.level + 3 - s.tiers.length}">{tierName(s, s.level)}</span>{/if}
							<svg class="cv-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
						</button>
						{#if open === s.k}
							<div class="cv-more">
								{#if s.first}
									<button type="button" class="cv-first" onclick={() => openCountry(s.first.code)}>
										<span class="cv-lab">Zuerst betreten</span>
										<span class="cv-fv"><span class="flag">{flag(s.first.code)}</span>{s.first.name || nameOf(s.first.code)}{#if s.first.entered}<span class="cv-date"> · {longDate(s.first.entered)}</span>{/if}</span>
									</button>
								{/if}
								{#if s.tiers.length}
									{@const b = CONT_BADGES[s.k as keyof typeof CONT_BADGES]}
									{@const next = s.tiers[s.level]}
									<button type="button" class="cv-badge" onclick={() => showBadge(s.k)}>
										<span class="cv-bi" aria-hidden="true">{b[1]}</span>
										<span class="cv-bt"
											><b>Abzeichen „{b[0]}“</b><span
												>{s.level ? tierName(s, s.level) : 'Noch keine Stufe'}{next ? ` · noch ${next - s.n} bis ${tierName(s, s.level + 1)}` : ' · komplett'}</span
											></span
										>
									</button>
								{/if}
								<button type="button" class="btn cv-globe" onclick={() => showOnGlobe(s)}
									><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3" /></svg>Auf dem Globus zeigen</button
								>
								<ul class="list cv-countries">
									{#each pool[s.k] as c (c)}
										{@const have = s.have.has(c)}
										<li class:miss={!have}>
											<button type="button" onclick={() => openCountry(c)}
												><span class="flag">{flag(c)}</span><span class="nm">{nameOf(c)}</span>{#if have}<span class="cv-ok" aria-label="bereist"
														><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span
													>{/if}</button
											>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
			<p class="note cv-note">Gezählt nach deiner Länderliste „{scopeLabel}“ (änderbar in den Einstellungen).</p>
		</div>
	{/if}
</section>
