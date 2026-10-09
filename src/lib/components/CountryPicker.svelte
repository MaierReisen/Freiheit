<script lang="ts">
	import { addCountries, isCounted, visitedSet } from '$lib/atlas.svelte';
	import { contOf, flag, nameOf } from '$lib/countries';
	import { ALL } from '$lib/map/geo';
	import { closeSheet, hooks, openCountry, toast, type PickerMode } from '$lib/app.svelte';

	/* mode "fly": Land auf der Karte suchen (alle Länder und Gebiete).
	   Sonst Länder als bereist hinzufügen – nur Länder, die in der gewählten Länderliste zählen. Wie „Auswählen“ in der Länderliste:
	   Länder antippen = markieren (Haken), unten „Alle“ / „Hinzufügen“. Die Reihenfolge des Antippens bestimmt „Land Nr. X“.
	   Suche und Auswahl bleiben unabhängig: markierte Länder bleiben auch nach neuer Suche markiert. */
	let { mode }: { mode: PickerMode } = $props();

	// Das Sheet wird bei jedem Öffnen neu aufgebaut: mode ist während der Lebensdauer fest
	// svelte-ignore state_referenced_locally
	const flyMode = mode === 'fly';
	let q = $state('');
	const visited = visitedSet();

	const items = $derived.by(() => {
		const s = q.trim().toLowerCase();
		return ALL.filter((c) => (flyMode || (!visited.has(c) && isCounted(c))) && (!s || nameOf(c).toLowerCase().includes(s)));
	});

	let picked = $state<string[]>([]);
	const allShownPicked = $derived(items.length > 0 && items.every((c) => picked.includes(c)));

	function choose(code: string) {
		if (flyMode) {
			closeSheet();
			hooks.map?.flyToCountry(code, { ms: 1100 });
			openCountry(code, { peek: true });
			return;
		}
		picked = picked.includes(code) ? picked.filter((c) => c !== code) : [...picked, code];
	}
	function toggleAll() {
		picked = allShownPicked ? picked.filter((c) => !items.includes(c)) : [...picked, ...items.filter((c) => !picked.includes(c))];
	}
	function addPicked() {
		const n = picked.length;
		if (!n) return;
		closeSheet();
		addCountries(picked);
		if (n > 1) toast(`${n} Länder hinzugefügt`);
	}
</script>

<h3 id="sheetTitle">{flyMode ? 'Land auf der Karte suchen' : 'Land hinzufügen'}</h3>
<input class="search" id="pickSearch" type="search" placeholder="Land suchen" autocomplete="off" style="margin-top:12px" bind:value={q} />
<ul class="pick-list" id="pickList">
	{#each items as c (c)}
			<li class:sel-li={!flyMode} class:on={picked.includes(c)}>
			<button data-code={c} aria-pressed={flyMode ? undefined : picked.includes(c)} onclick={() => choose(c)}
				>{#if !flyMode}<span class="chk" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>{/if}<span>{flag(c)}</span>{flyMode && visited.has(c) ? '✓ ' : ''}{nameOf(c)}<span class="ct">{contOf(c)}{flyMode && !isCounted(c) ? ' · zählt nicht' : ''}</span></button
			>
			</li>
	{:else}
		<li class="empty">Kein Land gefunden.</li>
	{/each}
</ul>
{#if !flyMode}
	<div class="pick-bar">
		<span class="lv-bar-n">{picked.length ? `${picked.length} ausgewählt` : 'Länder antippen'}</span>
		<button type="button" class="btn" onclick={toggleAll} disabled={!items.length}>{allShownPicked ? 'Keine' : 'Alle'}</button>
		<button type="button" class="btn primary" disabled={!picked.length} onclick={addPicked}>Hinzufügen</button>
	</div>
{/if}
