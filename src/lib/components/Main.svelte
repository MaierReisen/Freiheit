<script lang="ts">
	import { onMount } from 'svelte';
	import { TABS, closeContinents, closePass, closePlaces, closeSettings, closeSheet, initFromHash, onHashChange, setFull, startIntro, ui } from '$lib/app.svelte';
	import ContinentChips from './ContinentChips.svelte';
	import Hero from './Hero.svelte';
	import SettingsView from './SettingsView.svelte';
	import Sheet from './Sheet.svelte';
	import ContinentUnlock from './ContinentUnlock.svelte';
	import PassView from './PassView.svelte';
	import TabBar from './TabBar.svelte';
	import PassTile from './PassTile.svelte';
	import PlacesTile from './PlacesTile.svelte';
	import ContinentsTile from './ContinentsTile.svelte';
	import CapitalsTile from './CapitalsTile.svelte';
	import PlacesView from './PlacesView.svelte';
	import ContinentsView from './ContinentsView.svelte';
	import WorldMap from './WorldMap.svelte';

	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		// gleiche Reihenfolge wie bisher: Vollbild, Sheet, Übersicht; Einstellungen nur, wenn kein Sheet offen ist
		if (ui.settingsOpen && !ui.sheetOpen) {
			closeSettings(false);
			return;
		}
		if (ui.placesOpen && !ui.sheetOpen && !ui.settingsOpen && !ui.passOpen) {
			closePlaces(false);
			return;
		}
		if (ui.continentsOpen && !ui.sheetOpen && !ui.settingsOpen && !ui.passOpen) {
			closeContinents(false);
			return;
		}
		if (ui.passOpen && !ui.sheetOpen) {
			closePass(false);
			return;
		}
		if (ui.full && !ui.sheetOpen) setFull(false);
		closeSheet();
	}

	onMount(() => {
		initFromHash();
		// Start-Animation: Globus, Länderzahl, Kontinente, Flugkurve und Prozent enden gleichzeitig
		startIntro();
		let hiddenAt = 0;
		const onVis = () => {
			if (document.hidden) hiddenAt = Date.now();
			else if (hiddenAt && Date.now() - hiddenAt > 60000) startIntro(true); // nach längerer Pause erneut (Globus bleibt, wo er war)
		};
		document.addEventListener('visibilitychange', onVis);
		// Beim Abmelden: offene Ansichten schließen
		return () => {
			document.removeEventListener('visibilitychange', onVis);
			closeSheet();
			if (ui.settingsOpen) closeSettings(true);
			if (ui.passOpen) closePass(true);
			ui.focusContinent = null;
			if (ui.full) setFull(false, true);
			if (ui.placesOpen) closePlaces(true);
			if (ui.continentsOpen) closeContinents(true);
			document.body.classList.remove('noscroll');
		};
	});
</script>

<svelte:window onhashchange={onHashChange} />
<svelte:document onkeydown={onKeydown} />

<div id="appMain">
	<main class="tab" id="tab-home" hidden={ui.tab !== 'home'}>
		<Hero />
		<ContinentChips id="continents" />
		<WorldMap />
		<div class="blocks">
			<PassTile />
			<h2 class="blocks-h">Deine Welt</h2>
			<div class="cats">
				<PlacesTile />
				<ContinentsTile />
				<CapitalsTile />
			</div>
		</div>
	</main>
</div>

{#if TABS.length > 1}<TabBar />{/if}
<SettingsView />
<PassView />
<PlacesView />
<ContinentsView />
<Sheet />
<ContinentUnlock />
