<script lang="ts">
	import { CONT_NAMES } from '$lib/countries';
	import { openPass, reduceMotion, ui } from '$lib/app.svelte';

	/* Neuer Kontinent freigeschaltet bzw. neuer Rang im Reisepass: Karte gleitet von oben herein, Sonnen-Medaille mit Strahlenkranz
	   und kurzem Konfetti. Verschwindet von selbst oder per Tipp. */

	const TOTAL = Object.keys(CONT_NAMES).length;
	const COLORS = ['var(--sun)', 'var(--primary)', '#FFFFFF', '#FF8A65', 'var(--sun)'];

	let shown = $state<typeof ui.unlock | null>(null);
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

	function onTap() {
		const id = shown?.badgeId,
			rank = !!shown?.rank;
		dismiss();
		if (id || rank) {
			if (id) ui.passBadge = id;
			else ui.passRanks = true;
			openPass();
		}
	}
	function dismiss() {
		clearTimeout(tHide);
		leaving = true;
		tGone = setTimeout(() => (shown = null), 320);
	}
</script>

{#if shown}
	{#key shown.key}
		<div class="unlock" class:leaving role="status" aria-live="polite">
			<button type="button" class="unlock-card" onclick={onTap} aria-label="{shown.added ? `${shown.sub} neue Länder` : shown.badge ? `Neues Abzeichen: ${shown.badge}` : shown.rank ? `Neuer Rang: ${shown.rank}` : `Neuer Kontinent: ${shown.cont}`}. {shown.badgeId || shown.rank ? 'Im Reisepass öffnen' : 'Schließen'}">
				<span class="unlock-medal" aria-hidden="true">
					<span class="unlock-rays"></span>
					<span class="unlock-disc" class:emo={!!shown.badge}>{shown.badge ? shown.icon : shown.n}</span>
					{#each pieces as p, i (i)}
						<i style="--x:{p.x}px;--y:{p.y}px;--r:{p.r}deg;--c:{p.c};--d:{p.d}ms;--w:{p.w}px"></i>
					{/each}
				</span>
				{#if shown.added}
					<span class="unlock-txt">
						<small>Auf einen Schlag</small>
						<strong>+{shown.sub} Länder</strong>
						<span class="unlock-flags">{shown.added}</span>
					</span>
				{:else if shown.badge}
					<span class="unlock-txt">
						<small>Neues Abzeichen im Reisepass</small>
						<strong>{shown.badge}</strong>
						<span>{shown.sub}</span>
					</span>
				{:else if shown.rank}
					<span class="unlock-txt">
						<small>Neuer Rang im Reisepass</small>
						<strong>{shown.icon} {shown.rank}</strong>
						<span>{shown.n} Stempel im Pass</span>
					</span>
				{:else}
					<span class="unlock-txt">
						<small>Neuer Kontinent</small>
						<strong>{shown.cont}</strong>
						<span>{shown.n} von {TOTAL} Kontinenten</span>
					</span>
				{/if}
			</button>
		</div>
	{/key}
{/if}

<style>
	.unlock-flags{font-size:18px;line-height:1.35;letter-spacing:1px;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all}
</style>
