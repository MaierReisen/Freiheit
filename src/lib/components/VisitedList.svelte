<script lang="ts">
	import { onMount } from 'svelte';
	import { atlas, countedCountries, isCounted, removeCountry, type CountryEntry } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, contOf, flag } from '$lib/countries';
	import { SCOPES, scopeTotal } from '$lib/scope';
	import { reduceMotion, hooks, openCountry } from '$lib/app.svelte';
	import Timeline from './Timeline.svelte';
	import SwipeRow from './SwipeRow.svelte';

	/* Liste der bereisten Länder unter dem Globus, sortierbar. Gebiete, die nicht zählen, stehen darunter.
	   Wischen nach links legt „Löschen“ frei (wie in iOS). */

	type Sort = 'nr' | 'az' | 'cont' | 'new';
	const SORTS: { id: Sort; label: string }[] = [
		{ id: 'nr', label: 'Nr.' },
		{ id: 'az', label: 'A–Z' },
		{ id: 'cont', label: 'Kontinent' },
		{ id: 'new', label: 'Neueste' }
	];
	const SORT_KEY = 'freiheit-list-sort';

	let section: HTMLElement;
	let filter = $state('');
	let sort = $state<Sort>('nr');

	const total = $derived(scopeTotal(atlas.settings.countryScope));
	const scopeLabel = $derived(SCOPES.find((s) => s.id === atlas.settings.countryScope)?.label ?? '');
	const match = (c: CountryEntry) => {
		const q = filter.trim().toLowerCase();
		return !q || (c.name || '').toLowerCase().includes(q);
	};
	const byName = (a: CountryEntry, b: CountryEntry) => (a.name || '').localeCompare(b.name || '', 'de');

	// Nummer = Reihenfolge des Hinzufügens ("Land Nr. X"), unabhängig von der Sortierung
	const numbered = $derived(countedCountries().map((c, i) => ({ ...c, nr: i + 1 })));
	const items = $derived.by(() => {
		const list = numbered.filter(match);
		if (sort === 'az') return [...list].sort(byName);
		if (sort === 'new') return [...list].reverse();
		return list;
	});
	// Nach Kontinent: Gruppen nach Anzahl, innerhalb alphabetisch
	const groups = $derived.by(() => {
		const m = new Map<string, typeof items>();
		for (const c of items) {
			const k = CONT[c.code] || '';
			if (!m.has(k)) m.set(k, []);
			m.get(k)!.push(c);
		}
		return [...m.entries()]
			.map(([k, list]) => ({ name: CONT_NAMES[k as keyof typeof CONT_NAMES] || 'Sonstige', list: [...list].sort(byName) }))
			.sort((a, b) => b.list.length - a.list.length || a.name.localeCompare(b.name, 'de'));
	});
	const others = $derived(atlas.data.countries.filter((c) => !isCounted(c.code) && match(c)).sort(byName));

	function setSort(s: Sort) {
		sort = s;
		try {
			localStorage.setItem(SORT_KEY, s);
		} catch {}
	}

	onMount(() => {
		try {
			const s = localStorage.getItem(SORT_KEY);
			if (SORTS.some((x) => x.id === s)) sort = s as Sort;
		} catch {}
		// Tipp auf die Länderzahl (bzw. #laender) springt zur Liste
		hooks.places = {
			open: () => section.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }),
			close: () => {}
		};
		return () => (hooks.places = null);
	});
</script>

{#snippet row(c: CountryEntry & { nr?: number })}
	<SwipeRow ondelete={() => removeCountry(c.code)}>
		<button data-code={c.code} onclick={() => openCountry(c.code)}
			><span class="nr">{c.nr ?? ''}</span><span class="flag">{flag(c.code)}</span><span class="nm">{c.name}</span><span class="ct">{contOf(c.code)}</span></button
		>
	</SwipeRow>
{/snippet}

<section class="visited" id="laender" bind:this={section} aria-labelledby="visitedTitle">
	<h2 id="visitedTitle">Deine Länder <span class="h-count">{numbered.length} von {total}</span></h2>
	<Timeline />
	<div class="seg sort-seg" role="group" aria-label="Sortierung">
		{#each SORTS as s (s.id)}
			<button type="button" aria-pressed={sort === s.id} onclick={() => setSort(s.id)}>{s.label}</button>
		{/each}
	</div>
	<input class="search" id="filter" type="search" placeholder="Land suchen" autocomplete="off" bind:value={filter} />

	{#if sort === 'cont'}
		{#each groups as g (g.name)}
			<h3 class="list-sub">{g.name} <span class="h-count">{g.list.length}</span></h3>
			<ul class="list">
				{#each g.list as c (c.code)}{@render row(c)}{/each}
			</ul>
		{/each}
	{:else}
		<ul class="list" id="list">
			{#each items as c (c.code)}{@render row(c)}{/each}
		</ul>
	{/if}
	{#if !items.length}
		<p class="empty">{numbered.length ? 'Kein Treffer.' : 'Noch keine Länder. Tippe oben auf „+ Land“, um dein erstes Land hinzuzufügen.'}</p>
	{/if}

	{#if others.length}
		<h3 class="list-sub">Weitere bereiste Gebiete</h3>
		<p class="note">Zählen bei „{scopeLabel} ({total})“ nicht als Land. Ändern kannst du das in den Einstellungen.</p>
		<ul class="list" id="otherList">
			{#each others as c (c.code)}{@render row(c)}{/each}
		</ul>
	{/if}
</section>
