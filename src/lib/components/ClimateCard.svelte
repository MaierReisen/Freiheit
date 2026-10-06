<script lang="ts">
	import { bestMonths, climateNow, daylight, fmtDaylight, loadClimate, MONTHS_LONG, monthRanges, type ClimatePlace } from '$lib/facts';

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
			<svg viewBox="0 0 320 156" aria-hidden="true">
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
		<span class="sub cl-src">Mittel 1991–2020{places.length > 1 || p[0] ? ` · ${p[0]}` : ''} · TerraClimate</span>
	</div>
{/if}
