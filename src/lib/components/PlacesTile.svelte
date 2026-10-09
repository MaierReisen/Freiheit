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
	const pct = $derived(total ? Math.round((n / total) * 100) : 0);
	const last = $derived(list.slice(-3).reverse());
</script>

<button type="button" class="cat-row" aria-label="Deine Länder öffnen: {n} von {total}" onclick={() => openPlaces()}>
	<span class="cat-ico flagico" aria-hidden="true">
		<svg viewBox="0 0 48 48">
			<path class="hill" d="M4 38c8-7 16-8 22-5 6 3 12 2 18-3v18H4z" />
			<path class="pole" d="M20 36V9" />
			<path class="flagc" d="M20.8 9.5c4.5-2 8 1.6 12.5-.2 1.2-.5 2.4-.4 3.2.2v11.5c-.8-.6-2-.7-3.2-.2-4.5 1.8-8-1.8-12.5.2z" />
			<circle class="spark" cx="38" cy="30" r="1.6" /><circle class="spark" cx="10" cy="22" r="1.2" />
		</svg>
	</span>
	<span class="cat-txt">
		<span class="cat-name">Deine Länder</span>
		<span class="cat-sub">{pct} % der Welt entdeckt</span>
		<span class="cat-bar"><i style="width:{pct}%"></i></span>
	</span>
	{#if last.length}<span class="cat-flags" aria-hidden="true">{#each last as c (c.code)}<span>{flag(c.code)}</span>{/each}</span>{/if}
	<span class="pp-chev" aria-hidden="true">›</span>
</button>
