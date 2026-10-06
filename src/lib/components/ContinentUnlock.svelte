<script lang="ts">
	import { CONT_NAMES } from '$lib/countries';
	import { reduceMotion, ui } from '$lib/app.svelte';

	/* Neuer Kontinent freigeschaltet: Karte gleitet von oben herein, Sonnen-Medaille mit Strahlenkranz
	   und kurzem Konfetti. Verschwindet von selbst oder per Tipp. */

	const TOTAL = Object.keys(CONT_NAMES).length;
	const COLORS = ['var(--sun)', 'var(--primary)', '#FFFFFF', '#FF8A65', 'var(--sun)'];

	let shown = $state<{ key: number; cont: string; n: number } | null>(null);
	let leaving = $state(false);
	let pieces = $state<{ x: number; y: number; r: number; c: string; d: number; w: number }[]>([]);
	let tShow: ReturnType<typeof setTimeout> | undefined, tHide: ReturnType<typeof setTimeout> | undefined, tGone: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const u = ui.unlock;
		if (!u.key) return;
		clearTimeout(tShow);
		clearTimeout(tHide);
		clearTimeout(tGone);
		// kurz nach dem Hochrollen der Länderzahl
		tShow = setTimeout(() => {
			leaving = false;
			pieces = reduceMotion()
				? []
				: Array.from({ length: 28 }, (_, i) => {
						const a = (i / 28) * Math.PI * 2 + Math.random() * 0.3,
							dist = 60 + Math.random() * 90;
						return { x: Math.cos(a) * dist, y: Math.sin(a) * dist * 0.75 - 20, r: Math.random() * 540 - 270, c: COLORS[i % COLORS.length], d: Math.random() * 120, w: 5 + Math.random() * 4 };
					});
			shown = { ...u };
			tHide = setTimeout(dismiss, 3400);
		}, 420);
	});

	function dismiss() {
		clearTimeout(tHide);
		leaving = true;
		tGone = setTimeout(() => (shown = null), 320);
	}
</script>

{#if shown}
	{#key shown.key}
		<div class="unlock" class:leaving role="status" aria-live="polite">
			<button type="button" class="unlock-card" onclick={dismiss} aria-label="Neuer Kontinent: {shown.cont}. Schließen">
				<span class="unlock-medal" aria-hidden="true">
					<span class="unlock-rays"></span>
					<span class="unlock-disc">{shown.n}</span>
					{#each pieces as p, i (i)}
						<i style="--x:{p.x}px;--y:{p.y}px;--r:{p.r}deg;--c:{p.c};--d:{p.d}ms;--w:{p.w}px"></i>
					{/each}
				</span>
				<span class="unlock-txt">
					<small>Neuer Kontinent</small>
					<strong>{shown.cont}</strong>
					<span>{shown.n} von {TOTAL} Kontinenten</span>
				</span>
			</button>
		</div>
	{/key}
{/if}
