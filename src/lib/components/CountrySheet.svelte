<script lang="ts">
	import { addCountry, addWish, atlas, removeCountry, removeWish } from '$lib/atlas.svelte';
	import { contOf, flag, nameOf } from '$lib/countries';
	import { closeSheet } from '$lib/app.svelte';

	let { code }: { code: string } = $props();

	// Stand beim Öffnen festhalten: der Inhalt bleibt beim Herausgleiten unverändert
	const s = atlas.data;
	// svelte-ignore state_referenced_locally
	const idx = s.countries.findIndex((c) => c.code === code);
	const been = idx >= 0;
	// svelte-ignore state_referenced_locally
	const wish = s.wishlist.some((w) => w.code === code);
	// svelte-ignore state_referenced_locally
	const name = been ? s.countries[idx].name || nameOf(code) : nameOf(code);

	function toggle() {
		been ? removeCountry(code) : addCountry(code);
		closeSheet();
	}
	function toggleWish() {
		wish ? removeWish(code) : addWish(code);
		closeSheet();
	}
</script>

{#if been}<div class="stamp">✓ Bereist, Land Nr. {idx + 1}</div>{:else if wish}<div class="stamp">★ Wunschziel</div>{/if}
<h3 id="sheetTitle"><span>{flag(code)}</span>{name}</h3>
<div class="meta">{contOf(code)}{been || wish ? '' : ', noch nicht bereist'}</div>
<div class="actions">
	{#if been}
		<button class="btn" id="toggleBtn" onclick={toggle}>Aus Liste entfernen</button>
	{:else}
		<button class="btn primary" id="toggleBtn" onclick={toggle}>Als bereist markieren</button>
		<button class="btn" id="wishBtn" onclick={toggleWish}>{wish ? 'Von Wunschliste entfernen' : 'Auf die Wunschliste'}</button>
	{/if}
	<button class="btn" id="closeBtn" onclick={closeSheet}>Schließen</button>
</div>
