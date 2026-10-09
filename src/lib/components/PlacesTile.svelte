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
	const last = $derived(list.slice(-3).reverse());
</script>

<button type="button" class="cat-row" aria-label="Deine Länder öffnen: {n} von {total}" onclick={() => openPlaces()}>
	<span class="cat-ico flagico" aria-hidden="true">
<svg viewBox="0 0 48 48">
			<circle class="gl" cx="22" cy="26" r="14" />
			<ellipse class="gl-l" cx="22" cy="26" rx="6" ry="14" /><path class="gl-l" d="M8 26h28M10.5 18.5q11.5 4 23 0M10.5 33.5q11.5-4 23 0" />
			<path class="pin" d="M35 5.5a7 7 0 0 1 7 7c0 5.2-7 12-7 12s-7-6.800-7-12a7 7 0 0 1 7-7z" /><circle class="pin-o" cx="35" cy="12.5" r="2.600" />
		</svg>
	</span>
	<span class="cat-txt">
		<span class="cat-name">Deine Länder</span>
		<span class="cat-sub">{pctT} % der Welt entdeckt</span>
		<span class="cat-bar"><i style="width:{pct}%"></i></span>
	</span>
	{#if last.length}<span class="cat-flags" aria-hidden="true">{#each last as c (c.code)}<span>{flag(c.code)}</span>{/each}</span>{/if}
</button>
