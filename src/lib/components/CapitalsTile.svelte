<script lang="ts">
	import { atlas, countedCapitals } from '$lib/atlas.svelte';
	import { scopeTotal } from '$lib/scope';
	import { openCapitals } from '$lib/app.svelte';

	/* Zeile „Meine Hauptstädte“ im Bereich „Meine Welt“: wie viele Hauptstädte besucht sind (nur von bereisten Ländern der Länderliste).
	   Antippen öffnet die Seite „Meine Hauptstädte“. */

	const n = $derived(countedCapitals().length);
	const total = $derived(scopeTotal(atlas.settings.countryScope));
</script>

<button type="button" class="cat-row" aria-label="Meine Hauptstädte öffnen: {n} von {total}" onclick={() => openCapitals()}>
	<span class="cat-ico" aria-hidden="true">
		<!-- Goldprägung wie auf dem Reisepass: Kuppelbau mit Hauptstadt-Stern -->
		<svg viewBox="0 0 24 24"><path d="M3.5 20.5h17M5.5 20.5V13h13v7.5M9 15.5V18M12 15.5V18M15 15.5V18M8 13a4 4 0 0 1 8 0M12 9V7.6" /><path class="thin" d="M12 2.4l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" /></svg>
	</span>
	<span class="cat-txt">
		<span class="cat-name">Hauptstädte</span>
		<span class="cat-sub">{n} von {total} Hauptstädten</span>
		<span class="cat-bar"><i style="width:{total ? (n / total) * 100 : 0}%"></i></span>
	</span>
</button>
