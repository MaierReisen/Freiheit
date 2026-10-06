<script lang="ts">
	import { closeSheet, ui } from '$lib/app.svelte';
	import CountryPicker from './CountryPicker.svelte';
	import CountrySheet from './CountrySheet.svelte';

	/* Nach unten ziehen schließt das Sheet (wie in iOS): am Griff/Titel jederzeit, in der Liste nur,
	   wenn sie ganz oben steht – sonst scrollt die Liste ganz normal. */

	let sheet: HTMLDivElement;
	let scrim: HTMLDivElement;
	let g: { y0: number; x0: number; t0: number; ly: number; lt: number; vy: number; cy: number; sc: HTMLElement | null; on: boolean | null } | null = null;

	function scroller(t: EventTarget | null): HTMLElement | null {
		for (let el = t as HTMLElement | null; el && el !== sheet; el = el.parentElement) {
			if (el.scrollHeight > el.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
		}
		return null;
	}
	function setDrag(dy: number) {
		sheet.style.transition = 'none';
		sheet.style.transform = `translateY(${dy}px)`;
		scrim.style.transition = 'none';
		scrim.style.opacity = String(Math.max(0, 1 - dy / (sheet.offsetHeight || 1)));
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
		g = { y0: t.clientY, x0: t.clientX, t0: e.timeStamp, ly: t.clientY, lt: e.timeStamp, vy: 0, cy: t.clientY, sc: scroller(e.target), on: null };
	}
	function move(e: TouchEvent) {
		if (!g) return;
		const t = e.touches[0],
			dy = t.clientY - g.y0,
			dx = t.clientX - g.x0;
		if (g.on === null) {
			if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
			// nur nach unten, überwiegend senkrecht und Liste (falls darin) ganz oben
			g.on = dy > 0 && Math.abs(dy) > Math.abs(dx) && (!g.sc || g.sc.scrollTop <= 0);
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
		setDrag(Math.max(0, dy) + Math.min(0, dy) * 0.2);
	}
	function end() {
		if (!g) return;
		const d = g;
		g = null;
		if (!d.on) return;
		const dy = d.cy - d.y0;
		release();
		// weit genug oder kräftig nach unten geschnippt → schließen (gleitet aus der aktuellen Lage hinaus)
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

<div class="scrim" class:open={ui.sheetOpen} id="scrim" onclick={closeSheet} role="presentation" bind:this={scrim}></div>
<div class="sheet" class:open={ui.sheetOpen} id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" bind:this={sheet}>
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
