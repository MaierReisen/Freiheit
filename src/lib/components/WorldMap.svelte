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

	// Touch-Geräte: Tipp öffnet ein Land, langes Drücken aktiviert Drehen/Verschieben – sonst scrollt die Seite (siehe engine.ts)
	const coarse = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
	const hint = $derived(
		ui.full
			? 'Ziehen, zoomen, tippen'
			: ui.mapActive
				? 'Aktiv · außerhalb tippen zum Beenden'
				: coarse
					? s.mode === 'globe'
						? 'Zwei Finger zoomen · halten zum Drehen'
						: 'Zwei Finger zoomen · halten zum Verschieben'
					: s.mode === 'globe'
						? 'Ziehen zum Drehen'
						: 'Tippe auf ein Land'
	);

	// Einmalige Einführung beim ersten Öffnen: zeigt die Geste (Halten, dann ziehen); höchstens zweimal, danach nie wieder
	const COACH_KEY = 'freiheit-globe-coach';
	let coach = $state(false);
	let coachTimer: ReturnType<typeof setTimeout> | undefined;
	const coachCount = () => {
		try {
			return Number(localStorage.getItem(COACH_KEY)) || 0;
		} catch {
			return 99;
		}
	};
	function hideCoach(done = true) {
		clearTimeout(coachTimer);
		if (!coach) return;
		coach = false;
		if (done) {
			try {
				localStorage.setItem(COACH_KEY, '9');
			} catch {}
		}
	}
	function scheduleCoach(delay: number) {
		clearTimeout(coachTimer);
		if (coachCount() >= 2) return;
		coachTimer = setTimeout(() => {
			if (ui.full || ui.mapActive || ui.sheetOpen || ui.tab !== 'home' || document.hidden) return;
			try {
				localStorage.setItem(COACH_KEY, String(coachCount() + 1));
			} catch {}
			coach = true;
			coachTimer = setTimeout(() => hideCoach(false), 9000);
		}, delay);
	}

	/** Seite so rollen, dass der Globus mittig im freien Bereich über der kompakten Länderseite steht */
	function keepMapVisible() {
		if (ui.full || !ui.sheetOpen || ui.sheetDetent !== 'peek') return;
		const r = box.getBoundingClientRect(),
			free = window.innerHeight - ui.sheetPeek;
		const delta = r.top + r.height / 2 - free / 2;
		if (Math.abs(delta) > 24) window.scrollBy({ top: delta, behavior: reduceMotion() ? 'auto' : 'smooth' });
	}
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
			// angetipptes Land: Kontinent-Knopf auf dessen Kontinent, Länderseite kompakt öffnen und den Globus
			// darüber mittig zeigen (man sieht den Flug zum Land)
			onTapCountry: (code) => {
				focusContinentOf(code);
				openCountry(code, { peek: true });
				requestAnimationFrame(keepMapVisible);
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
		// Tippen oder Scrollen außerhalb des Globus beendet den aktiven Modus, hebt die Länderauswahl auf und schließt
		// die kompakte Länderkarte (Sheet und Abdunklung zählen nicht als „außerhalb“; die volle Seite schließt per Abdeckung)
		const onOutside = (e: Event) => {
			const t = e.target as Element | null;
			if (t && (box.contains(t) || t.closest('.sheet, .scrim'))) return;
			const peekOpen = ui.sheetOpen && ui.sheetView?.kind === 'country' && ui.sheetDetent === 'peek';
			if (!ui.mapActive && !peekOpen && !ui.selected) return;
			if (ui.sheetOpen && !peekOpen) return;
			ui.mapActive = false;
			if (peekOpen) closeSheet();
			ui.selected = null;
		};
		// jede Berührung des Globus beendet die Einführung (Hinweis ist nur Anzeige und fängt keine Eingaben ab)
		const onTouchMap = () => hideCoach();
		box.addEventListener('pointerdown', onTouchMap, true);
		document.addEventListener('pointerdown', onOutside, true);
		document.addEventListener('wheel', onOutside, { capture: true, passive: true });
		hooks.map = {
			resize: m.resize,
			flyToCountry: m.flyToCountry,
			flyToContinent: m.flyToContinent,
			scrollIntoView: () => box.scrollIntoView?.({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' })
		};
		return () => {
			clearTimeout(coachTimer);
			box.removeEventListener('pointerdown', onTouchMap, true);
			document.removeEventListener('pointerdown', onOutside, true);
			document.removeEventListener('wheel', onOutside, true);
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
		scheduleCoach(Math.max(0, it.end - now) + 900);
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
	// Aktiviert, Vollbild, Länderseite oder Moduswechsel: Einführung ist erledigt
	$effect(() => {
		if (ui.full || ui.mapActive || ui.sheetOpen) hideCoach();
	});
	$effect(() => {
		void s.mode;
		hideCoach(false);
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
	{#if coach}
		<div class="coach" aria-hidden="true" class:still={reduceMotion()}>
			<div class="coach-demo">
				<span class="coach-ring"></span>
				<span class="coach-dot"></span>
			</div>
			<div class="coach-text">
				<b>{coarse ? 'Halten, dann ziehen' : 'Ziehen'}</b>
				<span>{s.mode === 'globe' ? 'dreht den Globus' : 'verschiebt die Karte'} · Tippen öffnet ein Land</span>
			</div>
		</div>
	{/if}
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

<style>
	.coach{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:14px;pointer-events:none;z-index:5;animation:coach-in .5s ease both}
	.coach-demo{position:relative;width:120px;height:56px}
	.coach-dot,.coach-ring{position:absolute;left:8px;top:14px;width:28px;height:28px;border-radius:50%}
	.coach-dot{background:rgba(255,255,255,.92);box-shadow:0 2px 12px rgba(0,0,0,.35);animation:coach-move 3.2s ease-in-out infinite}
	.coach-ring{border:2px solid rgba(255,255,255,.9);animation:coach-ring 3.2s ease-in-out infinite}
	.coach-text{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 16px;border-radius:16px;background:rgba(7,20,31,.66);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#fff;text-align:center}
	.coach-text b{font-size:15px;font-weight:700}
	.coach-text span{font-size:12px;color:rgba(255,255,255,.8)}
	.coach.still .coach-dot,.coach.still .coach-ring{animation:none}
	.coach.still .coach-dot{left:46px}
	.coach.still .coach-ring{display:none}
	@keyframes coach-in{from{opacity:0}to{opacity:1}}
	/* 0–35 % Finger drückt (Ring füllt sich), 35–80 % zieht nach rechts, danach loslassen */
	@keyframes coach-move{0%{transform:translateX(0) scale(1.25);opacity:0}8%{transform:translateX(0) scale(1);opacity:1}35%{transform:translateX(0) scale(.9)}80%{transform:translateX(76px) scale(.9);opacity:1}92%,100%{transform:translateX(76px) scale(1.25);opacity:0}}
	@keyframes coach-ring{0%{transform:scale(2.2);opacity:0}8%{transform:scale(2.2);opacity:.9}35%{transform:scale(1);opacity:.9}40%,100%{transform:scale(1);opacity:0}}
</style>
