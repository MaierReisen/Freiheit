<script lang="ts">
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { flag } from '$lib/countries';
	import { scopeTotal } from '$lib/scope';
	import { openPlaces } from '$lib/app.svelte';

	/* Block „Deine Länder“ auf der Startseite: Zähler, Fortschritt und die zuletzt hinzugefügten Flaggen.
	   Antippen öffnet die Seite mit der ganzen Liste. Weitere Blöcke (Kontinente, Hauptstädte, Weltwunder …) folgen im gleichen Stil. */

	const list = $derived(countedCountries());
	const n = $derived(list.length);
	const total = $derived(scopeTotal(atlas.settings.countryScope));
	const pct = $derived(total ? Math.round((n / total) * 100) : 0);
	const last = $derived(list.slice(-5).reverse());
</script>

<button type="button" class="pp-tile blk-tile" aria-label="Deine Länder öffnen: {n} von {total}" onclick={() => openPlaces()}>
	<span class="blk-ico" aria-hidden="true">
		<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 3c-2.6 2.5-4.1 5.5-4.1 9s1.5 6.5 4.1 9c2.6-2.5 4.1-5.5 4.1-9S14.6 5.5 12 3zM3.2 12h17.6" /></svg>
	</span>
	<span class="pp-tile-txt">
		<span class="blk-name">Deine Länder</span>
		<span class="blk-flags" aria-hidden="true">{#each last as c (c.code)}<span>{flag(c.code)}</span>{/each}</span>
		<span class="pp-bar"><i style="width:{pct}%"></i></span>
		<span class="pp-bar-t">{pct} % der Welt entdeckt</span>
	</span>
	<span class="pp-chev" aria-hidden="true">›</span>
</button>
