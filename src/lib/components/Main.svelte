<script lang="ts">
	import { onMount } from 'svelte';
	import { TABS, closeContinents, reduceMotion, closeFlightsPage, closePass, closePlaces, closeSettings, closeSheet, goTab, initFromHash, onHashChange, setFull, startIntro, ui } from '$lib/app.svelte';
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
	import FlightsTab from './FlightsTab.svelte';
	import FlightsHero from './FlightsHero.svelte';

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
		if (ui.flightsPage && !ui.sheetOpen && !ui.settingsOpen) {
			closeFlightsPage();
			return;
		}
		if (ui.passOpen && !ui.sheetOpen) {
			closePass(false);
			return;
		}
		if (ui.full && !ui.sheetOpen) setFull(false);
		closeSheet();
	}

	/* Wischen zwischen den Tabs: Kopf und Inhalt folgen dem Finger (der Globus dazwischen bleibt stehen), nur zum
	   Nachbar-Tab, schreibt keinen Verlauf (siehe goTab). Geht auch auf dem ruhenden Globus; ist er aktiv, dreht er sich. */
	type Swipe = { x: number; y: number; lock: boolean; panes: HTMLElement[]; lx: number; lt: number; v: number };
	let swipe: Swipe | null = null;
	const neighbor = (dx: number) => {
		const n = TABS.indexOf(ui.tab) + (dx < 0 ? 1 : -1);
		return n >= 0 && n < TABS.length ? TABS[n] : null;
	};
	function setPanes(s: Swipe, x: number, ms = 0) {
		const w = window.innerWidth;
		for (const el of s.panes) {
			el.style.transition = ms ? `transform ${ms}ms cubic-bezier(.2,.8,.2,1),opacity ${ms}ms` : 'none';
			el.style.transform = x ? `translateX(${x}px)` : '';
			el.style.opacity = x ? String(1 - Math.min(1, Math.abs(x) / w) * 0.7) : '';
		}
	}
	const clearPanes = (els: HTMLElement[]) => els.forEach((el) => (el.style.transition = el.style.transform = el.style.opacity = ''));
	function onTouchStart(e: TouchEvent) {
		swipe = null;
		if (TABS.length < 2 || e.touches.length !== 1 || ui.full || ui.flightsPage || ui.placesOpen || ui.continentsOpen || ui.sheetOpen || ui.settingsOpen || ui.passOpen) return;
		const target = e.target as Element | null;
		if (!target?.closest?.('#appMain') || target.closest('input,textarea,select,.continents,.chips,.sheet')) return;
		if (ui.mapActive && target.closest('#mapBox')) return;
		const t = e.touches[0];
		if (t.clientX < 28 || t.clientX > window.innerWidth - 28) return; // Rand frei lassen: Zurück-Geste von iOS
		swipe = { x: t.clientX, y: t.clientY, lock: false, panes: [], lx: t.clientX, lt: e.timeStamp, v: 0 };
	}
	function onTouchMove(e: TouchEvent) {
		const s = swipe;
		if (!s || e.touches.length !== 1) return;
		const t = e.touches[0],
			dx = t.clientX - s.x,
			dy = t.clientY - s.y;
		if (!s.lock) {
			if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
			if (Math.abs(dx) < Math.abs(dy) * 1.2 || ui.mapActive) {
				swipe = null; // Seite scrollt bzw. Globus wurde gerade aktiviert (Halten)
				return;
			}
			s.lock = true;
			s.panes = [...document.querySelectorAll<HTMLElement>(`#appMain .tab[data-pane="${ui.tab}"]`)];
			s.panes.forEach((el) => el.classList.remove('in-r', 'in-l'));
		}
		if (e.cancelable) e.preventDefault(); // Seite scrollt währenddessen nicht
		const dt = e.timeStamp - s.lt;
		if (dt > 0) s.v = 0.6 * ((t.clientX - s.lx) / dt) + 0.4 * s.v;
		s.lx = t.clientX;
		s.lt = e.timeStamp;
		setPanes(s, neighbor(dx) ? dx : dx * 0.25); // ohne Nachbar-Tab nur federnd
	}
	function onTouchEnd(e: TouchEvent) {
		const s = swipe;
		swipe = null;
		if (!s?.lock) return;
		if (e.cancelable) e.preventDefault(); // kein Klick auf den Knopf unter dem Finger
		const dx = (e.changedTouches[0]?.clientX ?? s.lx) - s.x,
			w = window.innerWidth,
			next = e.type === 'touchend' ? neighbor(dx) : null;
		const fling = Math.abs(s.v) > 0.4 && Math.sign(s.v) === Math.sign(dx) && Math.abs(dx) > 30;
		const els = s.panes;
		if (next && (Math.abs(dx) > w * 0.25 || fling)) {
			const dir = dx < 0 ? 1 : -1;
			if (reduceMotion()) {
				clearPanes(els);
				goTab(next, true, dir);
				return;
			}
			// alter Tab gleitet weiter hinaus, dann gleitet der neue von der anderen Seite herein
			setPanes(s, -dir * w * 0.45, 130);
			setTimeout(() => {
				goTab(next, true, dir);
				clearPanes(els);
			}, 120);
		} else {
			setPanes(s, 0, reduceMotion() ? 0 : 220);
			setTimeout(() => clearPanes(els), 240);
		}
	}

	onMount(() => {
		document.addEventListener('touchstart', onTouchStart, { passive: true });
		document.addEventListener('touchmove', onTouchMove, { passive: false });
		document.addEventListener('touchend', onTouchEnd, { passive: false });
		document.addEventListener('touchcancel', onTouchEnd);
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
			document.removeEventListener('touchstart', onTouchStart);
			document.removeEventListener('touchmove', onTouchMove);
			document.removeEventListener('touchend', onTouchEnd);
			document.removeEventListener('touchcancel', onTouchEnd);
			closeSheet();
			if (ui.settingsOpen) closeSettings(true);
			if (ui.passOpen) closePass(true);
			ui.focusContinent = null;
			if (ui.full) setFull(false, true);
			if (ui.placesOpen) closePlaces(true);
			if (ui.continentsOpen) closeContinents(true);
			closeFlightsPage();
			document.body.classList.remove('noscroll');
		};
	});
</script>

<svelte:window onhashchange={onHashChange} />
<svelte:document onkeydown={onKeydown} />

<!-- Kopf je Tab, darunter ein gemeinsamer Globus (eine Karte für alle Tabs: bleibt beim Wechsel stehen, kein zweites
     Zeichnen/Laden), darunter der Inhalt je Tab. Kopf und Inhalt eines Tabs gleiten beim Wechsel gemeinsam herein. -->
<div id="appMain">
	<div class="tab" data-pane="home" hidden={ui.tab !== 'home'}>
		<Hero />
		<ContinentChips id="continents" />
	</div>
	<div class="tab" data-pane="flights" hidden={ui.tab !== 'flights'}>
		<FlightsHero />
	</div>
	<WorldMap />
	<main class="tab" id="tab-home" data-pane="home" hidden={ui.tab !== 'home'}>
		<div class="blocks">
			<PassTile />
			<h2 class="blocks-h">Meine Welt</h2>
			<div class="cats">
				<PlacesTile />
				<ContinentsTile />
				<CapitalsTile />
			</div>
		</div>
	</main>
	<FlightsTab />
</div>

{#if TABS.length > 1}<TabBar />{/if}
<SettingsView />
<PassView />
<PlacesView />
<ContinentsView />
<Sheet />
<ContinentUnlock />
