<script lang="ts">
	import { onMount } from 'svelte';
	import { REDUCE } from '$lib/app.svelte';

	/* Logo-Motiv im Hintergrund der Startseite: Flugbahn von der Sonne nach rechts oben.
	   Das Flugzeug steht so weit auf der Bahn, wie Länder der gewählten Liste bereist sind;
	   der zurückgelegte Teil ist durchgezogen, der Rest gepunktet. */

	let { progress, label }: { progress: number; label: string } = $props();

	let host: HTMLDivElement;
	let pathEl = $state<SVGPathElement | null>(null);
	let w = $state(0);
	let h = $state(0);
	let sunX = $state(0);
	let sunY = $state(0);
	let sunR = $state(75);
	let btnBottom = $state(0);
	let shown = $state(0); // angezeigter Fortschritt (animiert)
	let len = $state(0);
	let anim = 0;
	let tagEl = $state<HTMLSpanElement | null>(null);
	let tagW = $state(100);
	$effect(() => {
		void label;
		if (tagEl) tagW = tagEl.offsetWidth;
	});

	// Bahn: hebt an der rechten Flanke der Sonne ab und steigt unter dem „+ Land“-Button zum rechten Rand –
	// durch den freien Bereich, ohne Zahl, Text oder Button zu kreuzen
	const d = $derived.by(() => {
		if (!w || !h) return '';
		const a = (24 * Math.PI) / 180;
		const sx = sunX + sunR * Math.cos(a),
			sy = sunY - sunR * Math.sin(a);
		const ex = w - 4,
			ey = Math.min(sy - 14, Math.max(btnBottom + 16, 24));
		return `M${sx} ${sy} C${sx + 24} ${sy - 4} ${ex - 46} ${ey + 6} ${ex} ${ey}`;
	});

	const plane = $derived.by(() => {
		if (!pathEl || !len) return null;
		const at = Math.min(len - 0.5, Math.max(0.5, len * shown));
		const p = pathEl.getPointAtLength(at),
			q = pathEl.getPointAtLength(Math.min(len, at + 1)),
			r = pathEl.getPointAtLength(Math.max(0, at - 1));
		return { x: p.x, y: p.y, deg: (Math.atan2(q.y - r.y, q.x - r.x) * 180) / Math.PI };
	});

	function measure() {
		const box = host.parentElement?.getBoundingClientRect();
		const sun = host.parentElement?.querySelector('.sun')?.getBoundingClientRect();
		const btn = host.parentElement?.querySelector('.hero-add')?.getBoundingClientRect();
		if (!box) return;
		w = box.width;
		h = box.height;
		sunX = sun ? sun.left - box.left + sun.width / 2 : w * 0.4;
		sunY = sun ? sun.top - box.top + sun.height / 2 : h;
		sunR = sun ? sun.width / 2 : 75;
		btnBottom = btn ? btn.bottom - box.top : 0;
	}

	$effect(() => {
		void d;
		if (pathEl) len = pathEl.getTotalLength();
	});

	// Beim Start und bei Änderungen zum neuen Stand fliegen
	$effect(() => {
		const to = Math.max(0, Math.min(1, progress));
		cancelAnimationFrame(anim);
		if (REDUCE) {
			shown = to;
			return;
		}
		const from = shown,
			t0 = performance.now(),
			ms = 900 + Math.abs(to - from) * 900;
		const step = (t: number) => {
			const k = Math.min(1, (t - t0) / ms),
				e = 1 - Math.pow(1 - k, 3);
			shown = from + (to - from) * e;
			if (k < 1) anim = requestAnimationFrame(step);
		};
		anim = requestAnimationFrame(step);
	});

	onMount(() => {
		measure();
		const ro = new ResizeObserver(measure);
		if (host.parentElement) ro.observe(host.parentElement);
		// Zahl und Button können sich verschieben, ohne dass sich die Größe der Startseite ändert
		host.parentElement?.querySelectorAll('.hero-add, .count').forEach((el) => ro.observe(el));
		return () => {
			ro.disconnect();
			cancelAnimationFrame(anim);
		};
	});
</script>

<div class="flight" bind:this={host} aria-hidden="true">
	{#if d}
		<svg width={w} height={h} viewBox="0 0 {w} {h}">
			<path class="flight-rest" {d} />
			<path class="flight-done" {d} bind:this={pathEl} stroke-dasharray="{len * shown} {len + 10}" />
			{#if plane}
				<g transform="translate({plane.x} {plane.y}) rotate({plane.deg})">
					<path class="flight-plane" transform="scale(.62)" d="M34 0c0-3-4-5-8-5H10L-6-28h-9l8 23H-18l-7-9h-7l4 14-4 14h7l7-9H-7l-8 23h9L10 5h16c4 0 8-2 8-5z" />
				</g>
			{/if}
		</svg>
		{#if plane}
			<span
				class="flight-tag"
				class:below={plane.y - 40 < btnBottom}
				bind:this={tagEl}
				style="left:{Math.max(4, Math.min(plane.x - tagW / 2, w - tagW - 2))}px;top:{plane.y}px">{label}</span
			>
		{/if}
	{/if}
</div>
