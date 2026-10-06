<script lang="ts">
	import { onMount } from 'svelte';
	import { atlas, isCounted, visitedSet } from '$lib/atlas.svelte';
	import { reduceMotion, closeSheet, hooks, openCountry, openPicker, setFull, ui } from '$lib/app.svelte';
	import { CONT, CONT_VIEW } from '$lib/countries';
	import { createWorldMap, type MapSync, type WorldMap } from '$lib/map/engine';
	import ContinentChips from './ContinentChips.svelte';

	let box: HTMLDivElement;
	let cvB: HTMLCanvasElement;
	let cvT: HTMLCanvasElement;
	let map: WorldMap | null = null;
	let s = $state<MapSync>({ mode: 'globe', spin: false, fineState: 'idle' });

	// Legende "zählt nicht" nur zeigen, wenn es solche bereisten Gebiete gibt
	const hasUncounted = $derived(atlas.data.countries.some((c) => !isCounted(c.code)));

	// Touch-Geräte: Globus erst nach einem Tipp drehbar, sonst scrollt die Seite (siehe engine.ts)
	const coarse = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
	const hint = $derived(
		ui.full
			? 'Ziehen, zoomen, tippen'
			: ui.mapActive
				? 'Aktiv · außerhalb tippen zum Beenden'
				: coarse
					? 'Tippen zum Drehen'
					: s.mode === 'globe'
						? 'Ziehen zum Drehen'
						: 'Tippe auf ein Land'
	);

	const focusContinentOf = (code: string) => {
		const k = CONT[code];
		if (k && CONT_VIEW[k]) ui.focusContinent = k;
	};

	onMount(() => {
		const m = createWorldMap({
			cvB,
			cvT,
			reduce: reduceMotion,
			getVisited: visitedSet,
			isCounted,
			getWish: () => new Set<string>(), // Wunschliste vorerst ausgeblendet
			getSelected: () => ui.selected,
			isVisible: () => ui.full || ui.tab === 'home',
			isFull: () => ui.full,
			getAvoid: () => {
				const r = cvT.getBoundingClientRect();
				return [...box.querySelectorAll<HTMLElement>('.mseg, .mbtn, .map-hint, .map-panel')]
					.filter((el) => el.offsetParent)
					.map((el) => {
						const b = el.getBoundingClientRect();
						return [b.left - r.left - 4, b.top - r.top - 4, b.right - r.left + 4, b.bottom - r.top + 4] as [number, number, number, number];
					});
			},
			isActive: () => ui.mapActive,
			onActivate: () => (ui.mapActive = true),
			getStartView: () => CONT_VIEW[atlas.settings.homeContinent],
			// angetipptes Land: Kontinent-Knopf auf dessen Kontinent
			onTapCountry: (code) => {
				focusContinentOf(code);
				openCountry(code);
			},
			// erster Tipp: Land nur markieren (Umriss + Name), Detailseite erst beim nächsten Tipp
			onFocusCountry: (code) => {
				focusContinentOf(code);
				ui.selected = code;
			},
			onTapEmpty: () => {
				if (ui.selected) closeSheet();
			},
			onSync: (v) => (s = v),
			// nach eigenem Ziehen/Zoomen: gedrückter Kontinent-Knopf = wo man gerade ist; mehrere Kontinente im Bild: keiner.
			// (Nach Flügen per Kontinent-Knopf oder neuem Land bleibt der gesetzte Knopf gedrückt.)
			onSettle: (code) => {
				const k = code ? CONT[code] : undefined;
				ui.focusContinent = k && CONT_VIEW[k] ? k : '';
			}
		});
		map = m;
		if (import.meta.env.DEV) (window as unknown as { __freiheitMap: WorldMap }).__freiheitMap = m;
		// Tipp außerhalb des Globus beendet den aktiven Modus (Sheet und Abdunklung zählen dazu)
		const onOutside = (e: PointerEvent) => {
			if (!ui.mapActive) return;
			const t = e.target as Element | null;
			if (t && (box.contains(t) || t.closest('.sheet, .scrim'))) return;
			ui.mapActive = false;
			if (!ui.sheetOpen) ui.selected = null; // nur markiertes Land (ohne Detailseite) wieder abwählen
		};
		document.addEventListener('pointerdown', onOutside, true);
		hooks.map = {
			resize: m.resize,
			flyToCountry: m.flyToCountry,
			flyToContinent: m.flyToContinent,
			scrollIntoView: () => box.scrollIntoView?.({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' })
		};
		return () => {
			document.removeEventListener('pointerdown', onOutside, true);
			ui.mapActive = false;
			m.destroy();
			hooks.map = null;
			map = null;
		};
	});

	// Länder, Länderliste oder Auswahl geändert: Karte neu zeichnen
	$effect(() => {
		void atlas.data.countries;
		void atlas.settings.countryScope;
		void ui.selected;
		map?.markDirty(true);
	});
	// Start-Animation: Einflug auf die Startregion, endet gleichzeitig mit Zählern und Flugkurve
	$effect(() => {
		const it = ui.intro;
		if (!it.key || !map || it.resume) return; // bei Rückkehr in die App kein Sprung in die Ausgangslage
		const now = performance.now();
		map.intro(Math.max(0, it.start - now), Math.max(200, it.end - Math.max(now, it.start)));
	});
	// Neues Land selbst hinzugefügt: Globus fliegt hin, Kontinent-Leiste wechselt auf dessen Kontinent
	$effect(() => {
		const at = atlas.lastAddedAt,
			code = atlas.lastAddedCode;
		if (!at || !map || Date.now() - at > 2000) return;
		const k = CONT[code];
		if (k && CONT_VIEW[k]) ui.focusContinent = k;
		map.flyToCountry(code, { ms: 1300, zoom: 0.3 });
		map.highlight(code, reduceMotion() ? 0 : 950); // leuchtet auf, wenn der Globus ankommt
	});
	// Vollbild an/aus: Größe neu bestimmen
	$effect(() => {
		void ui.full;
		map?.resize();
	});
</script>

<div class="map-box" class:full={ui.full} class:active={ui.mapActive && !ui.full} id="mapBox" bind:this={box} oncontextmenu={(e) => e.preventDefault()} role="presentation">
	<canvas id="mapCv" aria-hidden="true" bind:this={cvB}></canvas>
	<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
	<canvas id="mapTop" role="img" aria-label="Interaktive Weltkarte mit deinen bereisten Ländern" bind:this={cvT}></canvas>
	<div class="mseg" id="mapMode" role="group" aria-label="Kartenansicht">
		<button type="button" data-mode="globe" aria-pressed={s.mode === 'globe'} onclick={() => map?.setMode('globe')}>Globus</button>
		<button type="button" data-mode="flat" aria-pressed={s.mode === 'flat'} onclick={() => map?.setMode('flat')}>Karte</button>
	</div>
	<button type="button" class="mbtn" id="fullBtn" aria-label={ui.full ? 'Vollbild schließen' : 'Vollbild öffnen'} onclick={() => setFull(!ui.full)}>
		<svg class="i-expand" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
		<svg class="i-close" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
	</button>
	<div class="map-zoom">
		<button type="button" class="mbtn" id="zoomIn" aria-label="Hineinzoomen" onclick={() => map?.zoomBy(2)}>+</button>
		<button type="button" class="mbtn" id="zoomOut" aria-label="Herauszoomen" onclick={() => map?.zoomBy(1 / 2)}>−</button>
	</div>
	<span class="map-hint" id="mapHint">{hint}</span>
	<div class="map-panel" id="mapPanel">
		<div class="legend"><span><i class="sw v"></i>Bereist</span>{#if hasUncounted}<span><i class="sw vs"></i>Bereist, zählt nicht</span>{/if}</div>
		<div class="panel-row">
			<button type="button" class="mchip" id="mSpin" aria-pressed={s.spin} hidden={s.mode !== 'globe'} onclick={() => map?.toggleSpin()}>Drehen</button>
			<button type="button" class="mchip" id="mSearch" onclick={() => openPicker('fly')}>Land suchen</button>
		</div>
		<ContinentChips id="mapConts" all />
	</div>
</div>
<div class="legend"><span><i class="sw v"></i>Bereist</span>{#if hasUncounted}<span><i class="sw vs"></i>Bereist, zählt nicht</span>{/if}</div>
