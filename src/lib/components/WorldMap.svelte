<script lang="ts">
	import { onMount } from 'svelte';
	import { atlas, isCounted, visitedSet, wishSet } from '$lib/atlas.svelte';
	import { REDUCE, closeSheet, hooks, openCountry, openPicker, setFull, ui } from '$lib/app.svelte';
	import { CONT_VIEW } from '$lib/countries';
	import { createWorldMap, type MapSync, type WorldMap } from '$lib/map/engine';
	import ContinentChips from './ContinentChips.svelte';

	let box: HTMLDivElement;
	let cvB: HTMLCanvasElement;
	let cvT: HTMLCanvasElement;
	let map: WorldMap | null = null;
	let s = $state<MapSync>({ mode: 'globe', spin: false, fineState: 'idle' });

	// Legende "zählt nicht" nur zeigen, wenn es solche bereisten Gebiete gibt
	const hasUncounted = $derived(atlas.data.countries.some((c) => !isCounted(c.code)));

	const hint = $derived(
		s.fineState === 'loading'
			? 'Feine Details werden geladen …'
			: ui.full
				? 'Ziehen, zoomen, tippen'
				: s.mode === 'globe'
					? 'Ziehen zum Drehen'
					: 'Tippe auf ein Land'
	);

	onMount(() => {
		const m = createWorldMap({
			cvB,
			cvT,
			reduce: REDUCE,
			getVisited: visitedSet,
			isCounted,
			getWish: wishSet,
			getSelected: () => ui.selected,
			isVisible: () => ui.full || ui.tab === 'home',
			isFull: () => ui.full,
			getStartView: () => CONT_VIEW[atlas.settings.homeContinent],
			onTapCountry: openCountry,
			onTapEmpty: () => {
				if (ui.selected) closeSheet();
			},
			onSync: (v) => (s = v)
		});
		map = m;
		hooks.map = {
			resize: m.resize,
			flyToCountry: m.flyToCountry,
			flyToContinent: m.flyToContinent,
			scrollIntoView: () => box.scrollIntoView?.({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' })
		};
		return () => {
			m.destroy();
			hooks.map = null;
			map = null;
		};
	});

	// Länder, Wunschliste oder Auswahl geändert: Karte neu zeichnen
	$effect(() => {
		void atlas.data.countries;
		void atlas.data.wishlist;
		void atlas.settings.countryScope;
		void ui.selected;
		map?.markDirty(true);
	});
	// Vollbild an/aus: Größe neu bestimmen
	$effect(() => {
		void ui.full;
		map?.resize();
	});
</script>

<div class="map-box" class:full={ui.full} id="mapBox" bind:this={box}>
	<canvas id="mapCv" aria-hidden="true" bind:this={cvB}></canvas>
	<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
	<canvas id="mapTop" role="img" aria-label="Interaktive Weltkarte mit deinen bereisten Ländern und Wunschzielen" bind:this={cvT}></canvas>
	<div class="mseg" id="mapMode" role="group" aria-label="Kartenansicht">
		<button type="button" data-mode="globe" aria-pressed={s.mode === 'globe'} onclick={() => map?.setMode('globe')}>Globus</button>
		<button type="button" data-mode="flat" aria-pressed={s.mode === 'flat'} onclick={() => map?.setMode('flat')}>Karte</button>
	</div>
	<button type="button" class="mbtn" id="fullBtn" aria-label={ui.full ? 'Vollbild schließen' : 'Vollbild öffnen'} onclick={() => setFull(!ui.full)}>
		<svg class="i-expand" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
		<svg class="i-close" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
	</button>
	<div class="map-zoom">
		<button type="button" class="mbtn" id="zoomIn" aria-label="Hineinzoomen" onclick={() => map?.zoomBy(1.7)}>+</button>
		<button type="button" class="mbtn" id="zoomOut" aria-label="Herauszoomen" onclick={() => map?.zoomBy(1 / 1.7)}>−</button>
	</div>
	<span class="map-hint" id="mapHint">{hint}</span>
	<div class="map-panel" id="mapPanel">
		<div class="legend"><span><i class="sw v"></i>Bereist</span>{#if hasUncounted}<span><i class="sw vs"></i>Bereist, zählt nicht</span>{/if}<span><i class="sw w"></i>Wunschziel</span></div>
		<div class="panel-row">
			<button type="button" class="mchip" id="mSpin" aria-pressed={s.spin} hidden={s.mode !== 'globe'} onclick={() => map?.toggleSpin()}>Drehen</button>
			<button type="button" class="mchip" id="mSearch" onclick={() => openPicker('fly')}>Land suchen</button>
		</div>
		<ContinentChips id="mapConts" all />
	</div>
</div>
<div class="legend"><span><i class="sw v"></i>Bereist</span>{#if hasUncounted}<span><i class="sw vs"></i>Bereist, zählt nicht</span>{/if}<span><i class="sw w"></i>Wunschziel</span></div>
