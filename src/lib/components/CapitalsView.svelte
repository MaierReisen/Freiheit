<script lang="ts">
	import { atlas, countedCapitals, countedCountries, setCapital } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, compareNames, flag, nameOf, type ContinentCode } from '$lib/countries';
	import { SCOPES, scopeTotal } from '$lib/scope';
	import { fmtPop, loadFacts, type Facts } from '$lib/facts';
	import { closeCapitals, openCapital, ui } from '$lib/app.svelte';
	import { swipeClose } from '$lib/swipeClose';

	/* Seite „Meine Hauptstädte“ (öffnet über den Block auf der Startseite): die Hauptstädte aller bereisten Länder, nach Kontinent.
	   Haken rechts = in der Hauptstadt gewesen (gespeichert in den Einstellungen, Spalte „capitals“), Antippen der Zeile öffnet die Seite der Hauptstadt.
	   Gezählt wird nur, wenn das Land bereist ist und zur gewählten Länderliste gehört. */

	const KEYS = Object.keys(CONT_NAMES) as ContinentCode[];
	let facts = $state<Record<string, Facts> | null>(null);
	$effect(() => {
		if (ui.capitalsOpen && !facts) loadFacts().then((f) => (facts = f));
	});

	const scope = $derived(atlas.settings.countryScope);
	const scopeLabel = $derived(SCOPES.find((s) => s.id === scope)?.label ?? '');
	const total = $derived(scopeTotal(scope));
	const done = $derived(new Set(countedCapitals()));
	// bereiste Länder mit Hauptstadt, je Kontinent alphabetisch nach Hauptstadt
	const groups = $derived.by(() => {
		if (!facts) return [];
		const f = facts;
		const rows = countedCountries()
			.filter((c) => f[c.code]?.cap?.length)
			.map((c) => ({ code: c.code, cap: f[c.code].cap![0], also: f[c.code].cap!.slice(1), pop: f[c.code].capPop?.[0] }));
		return KEYS.map((k) => ({ k, rows: rows.filter((r) => CONT[r.code] === k).sort((a, b) => compareNames(a.cap, b.cap)) })).filter((g) => g.rows.length);
	});
	const open = $derived(groups.reduce((n, g) => n + g.rows.length, 0) - done.size);

	let view: HTMLElement;
	$effect(() => {
		if (ui.capitalsOpen && view) {
			view.style.transform = '';
			view.style.transition = '';
			view.classList.remove('swiping', 'down');
		}
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov set-view" id="capitalsView" role="dialog" aria-modal="true" aria-labelledby="capsTitle" hidden={!ui.capitalsOpen} bind:this={view} use:swipeClose={{ onclose: () => closeCapitals(false) }}>
	<div class="ov-head lv-head">
		<button type="button" class="ov-close" id="capsClose" aria-label="Meine Hauptstädte schließen" onclick={() => closeCapitals(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="capsTitle">Meine Hauptstädte <span class="ov-of">{done.size} von {total}</span></h1>
	</div>
	{#if ui.capitalsOpen}
		<div class="ov-body cp-body">
			<div class="cp-sum">
				<span class="cat-bar"><i style="width:{total ? (done.size / total) * 100 : 0}%"></i></span>
				<p class="note">
					{#if !groups.length && facts}Trag zuerst ein Land ein – seine Hauptstadt erscheint dann hier.
					{:else if open > 0}Hake ab, in welchen Hauptstädten deiner Länder du warst ({open} noch offen).
					{:else if groups.length}Du warst in allen Hauptstädten deiner Länder.{/if}
				</p>
			</div>
			{#each groups as g (g.k)}
				<h2 class="list-sub cp-h" style="--cc:var(--ct-{g.k})"><i aria-hidden="true"></i>{CONT_NAMES[g.k]} <span>{g.rows.filter((r) => done.has(r.code)).length}/{g.rows.length}</span></h2>
				<ul class="list cp-list">
					{#each g.rows as r (r.code)}
						{@const on = done.has(r.code)}
						<li class:on>
							<button type="button" class="cp-main" onclick={() => openCapital(r.code)}>
								<span class="flag">{flag(r.code)}</span>
								<span class="cp-txt">
									<span class="nm">{r.cap}</span>
									<span class="ct">{[nameOf(r.code), r.pop ? fmtPop(r.pop) + ' Einw.' : '', r.also.length ? 'auch ' + r.also.join(', ') : ''].filter(Boolean).join(' · ')}</span>
								</span>
							</button>
							<button type="button" class="cp-tog" aria-pressed={on} aria-label="{r.cap}: {on ? 'besucht' : 'nicht besucht'}" onclick={() => setCapital(r.code, !on)}
								><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></button
							>
						</li>
					{/each}
				</ul>
			{/each}
			<p class="note cv-note">Gezählt nach deiner Länderliste „{scopeLabel}“ (änderbar in den Einstellungen). Hauptstädte weiterer Länder erscheinen, sobald du das Land einträgst.</p>
		</div>
	{/if}
</section>
