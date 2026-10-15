<script lang="ts">
	import { atlas, isCounted } from '$lib/atlas.svelte';
	import { defaultYear, entryYear, flightsIn, travelYears } from '$lib/travelYear';
	import { openYear } from '$lib/app.svelte';

	/* Zeile „Reisejahr“ im Bereich „Meine Welt“: neue Länder und Flüge im laufenden (bzw. letzten) Reisejahr.
	   Antippen öffnet die Seite „Mein Reisejahr“. */

	const years = $derived(travelYears(atlas.data.countries, atlas.flights));
	const y = $derived(defaultYear(years));
	const nc = $derived(atlas.data.countries.filter((c) => isCounted(c.code) && entryYear(c) === y).length);
	const nf = $derived(flightsIn(atlas.flights, y).length);
	const sub = $derived(
		years.length
			? [nc ? `${nc} ${nc === 1 ? 'neues Land' : 'neue Länder'}` : '', nf ? `${nf} ${nf === 1 ? 'Flug' : 'Flüge'}` : ''].filter(Boolean).join(' · ') || 'noch nichts Neues'
			: 'Einreisedaten eintragen'
	);
</script>

<button type="button" class="cat-row" aria-label="Mein Reisejahr {y} öffnen: {sub}" onclick={() => openYear()}>
	<span class="cat-ico" aria-hidden="true">
		<!-- Goldprägung wie auf dem Reisepass: Kalenderblatt mit Stern -->
		<svg viewBox="0 0 24 24"><path d="M4 6.5h16V20H4zM4 10.5h16M8 4v4M16 4v4" /><path class="thin" d="M12 12.4l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" /></svg>
	</span>
	<span class="cat-txt">
		<span class="cat-name">Reisejahr {y}</span>
		<span class="cat-sub">{sub}</span>
	</span>
</button>
