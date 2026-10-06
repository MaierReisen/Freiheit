<script lang="ts">
	import { onMount } from 'svelte';
	import { TABS, closeSettings, closeSheet, goTab, hooks, initFromHash, onHashChange, setFull, startIntro, ui } from '$lib/app.svelte';
	import ContinentChips from './ContinentChips.svelte';
	import Hero from './Hero.svelte';
	import SettingsView from './SettingsView.svelte';
	import Sheet from './Sheet.svelte';
	import TabBar from './TabBar.svelte';
	import VisitedList from './VisitedList.svelte';
	import WorldMap from './WorldMap.svelte';

	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		// gleiche Reihenfolge wie bisher: Vollbild, Sheet, Übersicht; Einstellungen nur, wenn kein Sheet offen ist
		if (ui.settingsOpen && !ui.sheetOpen) {
			closeSettings(false);
			return;
		}
		if (ui.full && !ui.sheetOpen) setFull(false);
		closeSheet();
		if (ui.placesOpen && !ui.sheetOpen) hooks.places?.close(false);
	}

	/* Wischen zwischen den Tabs */
	let swipe: { x: number; y: number; t: number } | null = null;
	function onTouchStart(e: TouchEvent) {
		swipe = null;
		if (TABS.length < 2 || e.touches.length !== 1 || ui.full || ui.placesOpen || ui.sheetOpen || ui.settingsOpen) return;
		const target = e.target as Element | null;
		if (target?.closest?.('#mapBox,input,textarea,select,.continents,.chips,.tabbar,.sheet,.count-btn,.hero-add')) return;
		const t = e.touches[0];
		if (t.clientX < 28 || t.clientX > window.innerWidth - 28) return; // Rand frei lassen: Zurück-Geste von iOS
		swipe = { x: t.clientX, y: t.clientY, t: Date.now() };
	}
	function onTouchEnd(e: TouchEvent) {
		if (!swipe) return;
		const t = e.changedTouches[0],
			dx = t.clientX - swipe.x,
			dy = t.clientY - swipe.y,
			dt = Date.now() - swipe.t;
		swipe = null;
		if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6 || dt > 700) return;
		const n = TABS.indexOf(ui.tab) + (dx < 0 ? 1 : -1);
		if (n >= 0 && n < TABS.length) goTab(TABS[n], true, dx < 0 ? 1 : -1);
	}

	onMount(() => {
		initFromHash();
		// Start-Animation: Globus, Länderzahl, Kontinente, Flugkurve und Prozent enden gleichzeitig
		startIntro();
		let hiddenAt = 0;
		const onVis = () => {
			if (document.hidden) hiddenAt = Date.now();
			else if (hiddenAt && Date.now() - hiddenAt > 60000) startIntro(); // nach längerer Pause erneut
		};
		document.addEventListener('visibilitychange', onVis);
		// Beim Abmelden: offene Ansichten schließen
		return () => {
			document.removeEventListener('visibilitychange', onVis);
			closeSheet();
			if (ui.settingsOpen) closeSettings(true);
			ui.focusContinent = null;
			if (ui.full) setFull(false, true);
			ui.placesOpen = false;
			document.body.classList.remove('noscroll');
		};
	});
</script>

<svelte:window onhashchange={onHashChange} />
<svelte:document
	onkeydown={onKeydown}
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
	ontouchcancel={() => (swipe = null)}
/>

<div id="appMain">
	<main class="tab" id="tab-home" hidden={ui.tab !== 'home'}>
		<Hero />
		<ContinentChips id="continents" />
		<WorldMap />
		<VisitedList />
	</main>
</div>

{#if TABS.length > 1}<TabBar />{/if}
<SettingsView />
<Sheet />
