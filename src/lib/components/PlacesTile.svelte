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
		<!-- Fähnchen mit Herz, auf einen kleinen Globus gesteckt -->
		<svg viewBox="0 0 48 48">
			<circle class="gl" cx="24" cy="32.5" r="11.5" />
			<ellipse class="gl-l" cx="24" cy="32.5" rx="5" ry="11.5" /><path class="gl-l" d="M12.5 32.5h23M14.5 26.5q9.5 3 19 0M14.5 38.5q9.5-3 19 0" />
			<path class="pole" d="M24 21.5V5.5" />
			<path class="flg" d="M24.5 6.5c3-1.7 5.6-1.7 8 0s5 1.7 7.5 0v9c-2.5 1.7-5 1.7-7.5 0s-5-1.7-8 0z" />
			<path class="hrt" d="M32.2 14.4c-2.1-1.4-3.1-2.5-3.1-3.6a1.55 1.55 0 0 1 3.1-.4a1.55 1.55 0 0 1 3.1.4c0 1.1-1 2.2-3.1 3.6z" />
		</svg>
	</span>
	<span class="cat-txt">
		<span class="cat-name">Deine Länder</span>
		<span class="cat-sub">{pctT} % der Welt entdeckt</span>
		<span class="cat-bar"><i style="width:{pct}%"></i></span>
	</span>
	{#if last.length}<span class="cat-flags" aria-hidden="true">{#each last as c (c.code)}<span>{flag(c.code)}</span>{/each}</span>{/if}
</button>
