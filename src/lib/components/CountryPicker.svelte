<script lang="ts">
	import { addCountry, addWish, isCounted, visitedSet, wishSet } from '$lib/atlas.svelte';
	import { contOf, flag, nameOf } from '$lib/countries';
	import { ALL } from '$lib/map/geo';
	import { closeSheet, hooks, openCountry, type PickerMode } from '$lib/app.svelte';

	/* mode "fly": Land auf der Karte suchen, sonst Land zur Liste Bereist oder Wunschliste hinzufügen */
	let { mode }: { mode: PickerMode } = $props();

	// Das Sheet wird bei jedem Öffnen neu aufgebaut: mode ist während der Lebensdauer fest
	// svelte-ignore state_referenced_locally
	const flyMode = mode === 'fly';
	// svelte-ignore state_referenced_locally
	let pm = $state<'visited' | 'wish'>(mode === 'wish' ? 'wish' : 'visited');
	let q = $state('');
	const visited = visitedSet();
	const wished = wishSet();

	const mark = (c: string) => (visited.has(c) ? '✓ ' : wished.has(c) ? '★ ' : '');
	const items = $derived.by(() => {
		const s = q.trim().toLowerCase();
		return ALL.filter((c) => (flyMode || (!visited.has(c) && !(pm === 'wish' && wished.has(c)))) && (!s || nameOf(c).toLowerCase().includes(s)));
	});

	function choose(code: string) {
		if (flyMode) {
			closeSheet();
			hooks.map?.flyToCountry(code, { ms: 1100 });
			openCountry(code);
			return;
		}
		pm === 'wish' ? addWish(code) : addCountry(code);
		closeSheet();
	}
</script>

<h3 id="sheetTitle">{flyMode ? 'Land auf der Karte suchen' : 'Land hinzufügen'}</h3>
{#if !flyMode}
	<div class="seg" id="pickSeg" role="group" aria-label="Zu welcher Liste?" style="margin:14px 0 4px">
		<button type="button" data-pm="visited" aria-pressed={pm === 'visited'} onclick={() => (pm = 'visited')}>Bereist</button>
		<button type="button" data-pm="wish" aria-pressed={pm === 'wish'} onclick={() => (pm = 'wish')}>Wunschliste</button>
	</div>
{/if}
<input class="search" id="pickSearch" type="search" placeholder="Land suchen" autocomplete="off" style="margin-top:12px" bind:value={q} />
<ul class="pick-list" id="pickList">
	{#each items as c (c)}
		<li><button data-code={c} onclick={() => choose(c)}><span>{flag(c)}</span>{flyMode ? mark(c) : ''}{nameOf(c)}<span class="ct">{contOf(c)}{isCounted(c) ? '' : ' · zählt nicht'}</span></button></li>
	{:else}
		<li class="empty">Kein Land gefunden.</li>
	{/each}
</ul>
