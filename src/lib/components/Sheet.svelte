<script lang="ts">
	import { closeSheet, setSheetDetent, ui } from '$lib/app.svelte';
	import CountryPicker from './CountryPicker.svelte';
	import CountrySheet from './CountrySheet.svelte';

	/* Nach unten ziehen schließt das Sheet (wie in iOS): am Griff/Titel jederzeit, in der Liste nur,
	   wenn sie ganz oben steht – sonst scrollt die Liste ganz normal.
	   Länderseite mit zwei Stufen: kompakte Karte („peek“, Globus bleibt sichtbar und antippbar) und volle Seite.
	   Kompakt: hochziehen → voll, runterziehen → schließen. Voll: runterziehen → schließen. */

	const isCountry = $derived(ui.sheetView?.kind === 'country');
	const peek = $derived(isCountry && ui.sheetDetent === 'peek');

	let sheet: HTMLDivElement;
	let scrim: HTMLDivElement;
	let downOnScrim = false;
	let g: {
		y0: number;
		x0: number;
		t0: number;
		ly: number;
		lt: number;
		vy: number;
		cy: number;
		sc: HTMLElement | null;
		on: boolean | null;
		base: number;
		peek: boolean;
	} | null = null;

	function scroller(t: EventTarget | null): HTMLElement | null {
		for (let el = t as HTMLElement | null; el && el !== sheet; el = el.parentElement) {
			if (el.scrollHeight > el.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
		}
		return null;
	}
	/** y: Verschiebung des Sheets nach unten (0 = ganz offen) */
	function setDrag(y: number) {
		sheet.style.transition = 'none';
		sheet.style.transform = `translateY(${y}px)`;
		if (!peek) {
			scrim.style.transition = 'none';
			scrim.style.opacity = String(Math.max(0, 1 - y / (sheet.offsetHeight || 1)));
		}
	}
	function release() {
		sheet.style.transition = '';
		sheet.style.transform = '';
		scrim.style.transition = '';
		scrim.style.opacity = '';
	}

	function start(e: TouchEvent) {
		if (e.touches.length !== 1 || !ui.sheetOpen) return (g = null);
		const t = e.touches[0];
		const base = peek ? Math.max(0, sheet.offsetHeight - ui.sheetPeek) : 0;
		g = { y0: t.clientY, x0: t.clientX, t0: e.timeStamp, ly: t.clientY, lt: e.timeStamp, vy: 0, cy: t.clientY, sc: scroller(e.target), on: null, base, peek };
	}
	function move(e: TouchEvent) {
		if (!g) return;
		const t = e.touches[0],
			dy = t.clientY - g.y0,
			dx = t.clientX - g.x0;
		if (g.on === null) {
			if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
			// überwiegend senkrecht; kompakt in beide Richtungen, sonst nur nach unten und Liste (falls darin) ganz oben
			g.on = Math.abs(dy) > Math.abs(dx) && (g.peek || (dy > 0 && (!g.sc || g.sc.scrollTop <= 0)));
			if (g.on) {
				(document.activeElement as HTMLElement | null)?.blur?.(); // Tastatur weg
				g.ly = t.clientY;
				g.lt = e.timeStamp;
			}
		}
		if (!g.on) return;
		e.preventDefault(); // Liste/Seite nicht mitscrollen
		// Geschwindigkeit nur über ausreichend lange Abstände messen (sonst täuschen Mini-Abstände ein Schnippen vor)
		const dt = e.timeStamp - g.lt;
		if (dt >= 12) {
			g.vy = 0.6 * ((t.clientY - g.ly) / dt) + 0.4 * g.vy;
			g.ly = t.clientY;
			g.lt = e.timeStamp;
		}
		g.cy = t.clientY;
		const y = g.base + dy;
		setDrag(y >= 0 ? y : y * 0.2); // über „ganz offen“ hinaus nur gebremst
	}
	function end() {
		if (!g) return;
		const d = g;
		g = null;
		if (!d.on) return;
		const dy = d.cy - d.y0;
		release();
		if (d.peek) {
			// kompakt: hoch → volle Seite, runter → schließen
			if (dy < -50 || (d.vy < -0.5 && dy < -20)) setSheetDetent('full');
			else if (dy > 70 || (d.vy > 0.5 && dy > 30)) closeSheet();
			return;
		}
		// weit genug oder kräftig nach unten geschnippt → schließen (auch die volle Länderseite)
		if (dy > Math.min(140, sheet.offsetHeight * 0.3) || (d.vy > 0.6 && dy > 40)) closeSheet();
	}

	// nicht-passiv, damit das Ziehen das Scrollen verhindern kann
	$effect(() => {
		sheet.addEventListener('touchstart', start, { passive: true });
		sheet.addEventListener('touchmove', move, { passive: false });
		sheet.addEventListener('touchend', end);
		sheet.addEventListener('touchcancel', end);
		return () => {
			sheet.removeEventListener('touchstart', start);
			sheet.removeEventListener('touchmove', move);
			sheet.removeEventListener('touchend', end);
			sheet.removeEventListener('touchcancel', end);
		};
	});
</script>

<!-- schließt nur, wenn die Berührung auch auf der Abdeckung begann (kein „Geister-Klick“ vom Antippen der Karte) -->
<div
	class="scrim"
	class:open={ui.sheetOpen && !peek}
	id="scrim"
	onpointerdown={() => (downOnScrim = true)}
	onclick={() => {
		if (downOnScrim) closeSheet();
		downOnScrim = false;
	}}
	role="presentation"
	bind:this={scrim}
></div>
<div
	class="sheet"
	class:open={ui.sheetOpen}
	class:country={isCountry}
	class:peek
	style="--peek:{ui.sheetPeek}px"
	id="sheet"
	role="dialog"
	aria-modal={!peek}
	aria-labelledby="sheetTitle"
	bind:this={sheet}
>
	{#if ui.sheetView}
		{#key ui.sheetKey}
			<div class="grab"></div>
			{#if ui.sheetView.kind === 'country'}
				<CountrySheet code={ui.sheetView.code} />
			{:else}
				<CountryPicker mode={ui.sheetView.mode} />
			{/if}
		{/key}
	{/if}
</div>
