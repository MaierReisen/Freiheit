<script lang="ts">
	import { atlas } from '$lib/atlas.svelte';
	import { easeOutCubic, introClock, openAddFlight, openFlightsPage, ui } from '$lib/app.svelte';
	import { fd } from '$lib/flightData.svelte';
	import { MOON_KM, fmtDuration, fmtInt } from '$lib/flights';
	import HeroFlight from './HeroFlight.svelte';

	/* Kopf des Tabs „Flüge“ im Stil der Startseite: große Zahl, Knopf „+ Flug“ (von Hand eintragen; Import aus Flighty steht in den Einstellungen), Flugkurve (Anteil der Strecke zum Mond)
	   und darunter Jahres-Knöpfe für den Globus (wie die Kontinent-Knöpfe auf der Startseite). */

	const st = $derived(fd.st);
	const n = $derived(st ? st.n : atlas.flights.length);

	// Start-Animation wie auf der Startseite: Zahl zählt hoch und endet mit Globus und Flugkurve
	const intro = introClock();
	// Strecke im Vergleich zum Mond; wer weiter geflogen ist: zum Mond und zurück (bzw. mehrmals), damit der Wert weiter wächst
	const moon = $derived.by(() => {
		const km = st?.km ?? 0;
		let goal = MOON_KM;
		while (km > goal) goal *= 2;
		const k = goal / (2 * MOON_KM);
		return { p: km / goal, label: goal === MOON_KM ? 'zum Mond' : k === 1 ? 'zum Mond und zurück' : `${k}× zum Mond und zurück` };
	});
	const shownN = $derived(intro.t >= 1 ? n : Math.round(easeOutCubic(intro.t) * n));

	function pickYear(y: number | null) {
		fd.year = y;
		ui.flightsFit++;
	}
</script>

<section class="hero fl-hero">
	<div class="hero-row">
		<button type="button" class="count-btn" aria-label="{n} Flüge. Zur Liste" onclick={() => st && n && openFlightsPage('flights')}>
			<span class="count" class:d3={n >= 100}>{shownN}</span>
			<span class="count-meta">
				<span class="count-label">{shownN === 1 ? 'Flug' : 'Flüge'}</span>
				<span class="count-sub">{st && n ? `${fmtInt(st.km)} km · ${fmtDuration(st.min)}` : 'noch keine'}</span>
			</span>
		</button>
		<button type="button" class="hero-add" aria-label="Flug hinzufügen" onclick={() => openAddFlight()}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg><span>Flug</span></button
		>
	</div>
	<HeroFlight progress={moon.p} label={moon.label} />
</section>
<div class="continents" id="flightYears">
	<button type="button" class="cont" aria-pressed={fd.year === null} onclick={() => pickYear(null)}><b>Alle</b>{n} {n === 1 ? 'Flug' : 'Flüge'}</button>
	{#each fd.years as [y, k] (y)}
		<button type="button" class="cont" aria-pressed={fd.year === y} onclick={() => pickYear(y)}><b>{y}</b>{k} {k === 1 ? 'Flug' : 'Flüge'}</button>
	{/each}
</div>
