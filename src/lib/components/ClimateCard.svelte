<script lang="ts">
	import { bestMonths, climateNow, daylight, highlightsNow, loadHighlights, type Highlight, fmtDaylight, loadClimate, MONTHS_LONG, monthRanges, type ClimatePlace } from '$lib/facts';

	/* Klima & beste Reisezeit: je Monat Tages-/Nachttemperatur (Balken) und Niederschlag, beste Monate markiert.
	   Große Länder mit mehreren Klimazonen: Orte zum Umschalten. Quelle TerraClimate, Mittel 1991–2020. */

	let { code }: { code: string } = $props();

	// svelte-ignore state_referenced_locally
	let places = $state<ClimatePlace[] | null>(climateNow(code) ?? null);
	let pi = $state(0);
	let sel = $state(new Date().getMonth());
	$effect(() => {
		if (!places) loadClimate().then((d) => (places = d[code] ?? null));
	});

	// svelte-ignore state_referenced_locally
	let hls = $state<Highlight[]>(highlightsNow(code) ?? []);
	$effect(() => {
		if (highlightsNow(code) === undefined) loadHighlights().then((d) => (hls = d[code] ?? []));
	});
	const hlMonths = $derived(new Set(hls.flatMap((h) => h.m)));
	const when = (h: Highlight) => h.d ?? monthRanges(h.m);

	const p = $derived(places?.[pi] ?? null);
	const best = $derived(p ? bestMonths(p[2], p[4]) : null);
	const bestSet = $derived(new Set(best?.months ?? []));

	// Tageslicht je Monat (aus der Sonnenbahn berechnet)
	const light = $derived(p ? [...Array(12).keys()].map((m) => daylight(p[1][1], m)) : []);

	// Diagramm: 12 Spalten à 25 Einheiten; Temperatur oben (y 24–84), Tageslicht als feine Linie (y 99–109),
	// Niederschlag unten (bis y 136)
	const CW = 25,
		X0 = 10;
	const scale = $derived.by(() => {
		if (!p) return { lo: 0, hi: 1, rain: 1 };
		let lo = Math.min(...p[3]) - 1,
			hi = Math.max(...p[2]) + 1;
		if (hi - lo < 18) {
			const m = (hi + lo) / 2; // gleichmäßiges Tropenklima nicht übertrieben schwanken lassen
			lo = m - 9;
			hi = m + 9;
		}
		return { lo, hi, rain: Math.max(150, ...p[4]) };
	});
	const ty = (t: number) => 84 - ((t - scale.lo) / (scale.hi - scale.lo)) * 60;
	const ry = (mm: number) => (Math.min(mm, scale.rain) / scale.rain) * 22;
	const ly = (h: number) => 109 - (h / 24) * 10;

	// Farbe nach Tagestemperatur: kalt blau → mild türkis → warm gelb → heiß orange/rot
	const STOPS: [number, [number, number, number]][] = [
		[-10, [108, 142, 240]],
		[2, [95, 184, 232]],
		[14, [52, 209, 191]],
		[23, [246, 196, 69]],
		[31, [242, 139, 75]],
		[39, [229, 72, 77]]
	];
	function tcol(t: number) {
		if (t <= STOPS[0][0]) return `rgb(${STOPS[0][1]})`;
		for (let i = 1; i < STOPS.length; i++) {
			const [t1, c1] = STOPS[i];
			if (t <= t1) {
				const [t0, c0] = STOPS[i - 1];
				const f = (t - t0) / (t1 - t0);
				return `rgb(${c0.map((v, k) => Math.round(v + (c1[k] - v) * f)).join(',')})`;
			}
		}
		return `rgb(${STOPS[STOPS.length - 1][1]})`;
	}
	const LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
</script>

{#if places && p && best}
	<div class="cs-tile wide cs-clim">
		<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></svg>
		<span class="lbl">Klima &amp; Reisezeit</span>
		{#if places.length > 1}
			<div class="cl-places" role="tablist" aria-label="Ort">
				{#each places as pl, i (pl[0])}
					<button type="button" role="tab" aria-selected={i === pi} class:on={i === pi} onclick={() => (pi = i)}>{pl[0]}</button>
				{/each}
			</div>
		{/if}
		<div class="cl-best">
			<span>{best.good ? 'Beste Reisezeit' : best.months.length === 12 ? 'Klima' : 'Am angenehmsten'}</span>
			<b>{!best.good && best.months.length === 12 ? 'ganzjährig ähnlich' : monthRanges(best.months)}</b>
		</div>

		<div class="cl-chart">
			<svg viewBox="0 0 320 161" aria-hidden="true">
				{#each p[2] as tmax, i (i)}
					{@const x = X0 + i * CW}
					{@const cx = x + CW / 2}
					{#if bestSet.has(i)}<rect class="cl-good" x={x + 1} y="2" width={CW - 2} height="152" rx="7" />{/if}
					{#if i === sel}<rect class="cl-sel" x={x + 1} y="2" width={CW - 2} height="152" rx="7" />{/if}
					{#if bestSet.has(i)}<rect class="cl-sun" x={cx - 5} y="7" width="10" height="3" rx="1.5" />{/if}
					<text class="cl-tmax" x={cx} y={ty(tmax) - 4}>{tmax}°</text>
					<rect x={cx - 4.5} y={ty(tmax)} width="9" height={Math.max(4, ty(p[3][i]) - ty(tmax))} rx="4.5" fill={tcol(tmax)} />
					<text class="cl-tmin" x={cx} y={ty(p[3][i]) + 10}>{p[3][i]}°</text>
					<rect class="cl-rain" x={cx - 5} y={136 - ry(p[4][i])} width="10" height={Math.max(1, ry(p[4][i]))} rx="2" />
					<text class="cl-m" class:on={i === sel} x={cx} y="151">{LETTERS[i]}</text>
					{#if hlMonths.has(i)}<circle class="cl-hl-dot" cx={cx} cy="157.5" r="1.8" />{/if}
				{/each}
				<line class="cl-base" x1={X0} x2={X0 + 12 * CW} y1="136.5" y2="136.5" />
				<polyline class="cl-light" points={light.map((h, i) => `${X0 + i * CW + CW / 2},${ly(h).toFixed(1)}`).join(' ')} />
				<circle class="cl-light-dot" cx={X0 + sel * CW + CW / 2} cy={ly(light[sel])} r="2.4" />
			</svg>
			<div class="cl-hit">
				{#each LETTERS as _, i (i)}
					<button type="button" aria-label={MONTHS_LONG[i]} aria-pressed={i === sel} onclick={() => (sel = i)}></button>
				{/each}
			</div>
		</div>
		<div class="cl-legend" aria-hidden="true">
			<span><i class="t"></i>Tag/Nacht</span><span><i class="r"></i>Regen</span><span><i class="l"></i>Tageslicht</span>{#if bestSet.size}<span><i class="g"></i>{best.good ? 'beste Zeit' : 'angenehmste Zeit'}</span>{/if}
		</div>
		<div class="cl-detail">
			<b>{MONTHS_LONG[sel]}</b>
			<span>tagsüber <b>{p[2][sel]} °C</b></span>
			<span>nachts <b>{p[3][sel]} °C</b></span>
			<span><b>{p[4][sel]} mm</b> Regen</span>
			<span class="cl-day">☀ <b>{fmtDaylight(light[sel])}</b></span>
		</div>
		{#if hls.length}
			<div class="cl-hls">
				<span class="lbl">Highlights</span>
				{#each hls as h (h.t + (h.r ?? ''))}
					<div class="cl-hl" class:on={h.m.includes(sel)}>
						<i class="cl-hl-ic {h.c}" aria-hidden="true">
							<svg viewBox="0 0 24 24">
								{#if h.c === 'tier'}<circle cx="6.5" cy="10" r="1.9" /><circle cx="10" cy="5.8" r="1.9" /><circle cx="14" cy="5.8" r="1.9" /><circle cx="17.5" cy="10" r="1.9" /><path d="M12 11.5c-2.9 0-5.2 3.6-5.2 6 0 1.5 1.3 2.4 2.8 1.9l2.4-.8 2.4.8c1.5.5 2.8-.4 2.8-1.9 0-2.4-2.3-6-5.2-6z" />
								{:else if h.c === 'meer'}<path d="M3 17.5c2.4 1.8 4.8 1.8 7.2 0s4.8-1.8 7.2 0 2.4 1.2 3.6 1.2" /><path d="M12 14.5V8.5M12 8.5c-1.1-2-3.4-3.3-5.6-3 .5 2.6 2.7 4.4 5.6 4.2 2.9.2 5.1-1.6 5.6-4.2-2.2-.3-4.5 1-5.6 3z" />
								{:else if h.c === 'bluete'}<circle cx="12" cy="12" r="2" /><path d="M12 10c-1.6-2.2-1.6-5 0-6.5 1.6 1.5 1.6 4.3 0 6.5zM13.9 11.4c1.6-2.2 4.2-3.1 6.2-2.5-.4 2.1-2.6 3.8-6.2 2.5zM13.2 13.7c2.6.8 4.2 3 4 5.2-2.1.1-4.1-1.7-4-5.2zM10.8 13.7c.1 3.5-1.9 5.3-4 5.2-.2-2.2 1.4-4.4 4-5.2zM10.1 11.4C6.5 12.7 4.3 11 3.9 8.9c2-.6 4.6.3 6.2 2.5z" />
								{:else if h.c === 'laub'}<path d="M5 19.5C5 11 10.5 5 19.5 4.5 19.5 13.5 13.5 19.5 5 19.5zM5 19.5l8.5-8.5" />
								{:else if h.c === 'natur'}<path d="M3 19.5l6-9 4 6 2.2-3.2 5.8 6.2z" /><circle cx="17" cy="6.5" r="2.3" />
								{:else}<path d="M12 3.5v3.5M12 17v3.5M3.5 12H7M17 12h3.5M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /><circle cx="12" cy="12" r="1.6" />{/if}
							</svg>
						</i>
						<div class="cl-hl-txt"><b>{h.t}</b>{#if h.r}<span>{h.r}</span>{/if}</div>
						<span class="cl-hl-when">{when(h)}{#if h.v}<small>je nach Jahr</small>{/if}</span>
					</div>
				{/each}
			</div>
		{/if}
		<span class="sub cl-src">Mittel 1991–2020{places.length > 1 || p[0] ? ` · ${p[0]}` : ''} · TerraClimate</span>
	</div>
{/if}
