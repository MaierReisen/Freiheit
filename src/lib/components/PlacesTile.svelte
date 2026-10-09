<script lang="ts">
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { flag } from '$lib/countries';
	import { scopeTotal } from '$lib/scope';
	import { openPlaces } from '$lib/app.svelte';

	/* Zeile „Deine Länder“ im Bereich „Deine Welt“ auf der Startseite (Pass-Block steht darüber).
	   Weitere Kategorien (Kontinente, Hauptstädte, Weltwunder …) kommen als gleiche Zeilen darunter.
	   Zeigt bewusst nicht die Zahl vom Pass, sondern Prozent und die zuletzt hinzugefügten Flaggen. */

	const list = $derived(countedCountries());
	const n = $derived(list.length);
	const total = $derived(scopeTotal(atlas.settings.countryScope));
	const pct = $derived(total ? (n / total) * 100 : 0);
	const pctT = $derived(pct.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
	// zuletzt bereiste Länder: „… 3 2 1“, ganz rechts das neueste
	const last = $derived(list.slice(-3));
</script>

<button type="button" class="cat-row" aria-label="Deine Länder öffnen: {n} von {total}" onclick={() => openPlaces()}>
	<span class="cat-ico" aria-hidden="true">
		<!-- Goldprägung wie auf dem Reisepass: Fähnchen -->
		<svg viewBox="0 0 24 24"><path d="M6 21V3.5M6 4.5c3-1.6 5.5 1.6 8.5 0 1.8-.9 3.3-.9 4.5-.3v8c-1.2-.6-2.7-.6-4.5.3-3 1.6-5.5-1.6-8.5 0" /></svg>
	</span>
	<span class="cat-txt">
		<span class="cat-name">Deine Länder</span>
		<span class="cat-sub">{pctT} % der Welt entdeckt</span>
		<span class="cat-bar"><i style="width:{pct}%"></i></span>
	</span>
	{#if last.length}<span class="cat-flags" aria-hidden="true">{#if n > 3}<span class="cat-more">…</span>{/if}{#each last as c (c.code)}<span>{flag(c.code)}</span>{/each}</span>{/if}
</button>
