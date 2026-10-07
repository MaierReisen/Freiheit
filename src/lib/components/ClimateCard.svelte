<script lang="ts">
	import { bestMonths, climateNow, highlightsNow, loadClimate, loadHighlights, MONSOON, MONTHS_LONG, monthRanges, rainSeason, sunTimes, type ClimatePlace, type Highlight } from '$lib/facts';

	/* Klima & beste Reisezeit: je Monat Tages-/Nachttemperatur (Balken), Niederschlag und – am Meer – Wassertemperatur
	   (Linie); darunter Regenzeit/Monsun und Wirbelsturmsaison als Balken, beste Monate markiert. Große Länder mit
	   mehreren Klimazonen: Orte zum Umschalten. Quellen TerraClimate und NOAA OISST, Mittel 1991–2020. */

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
	// ganzjährige Highlights werden beim Antippen eines Monats nie ausgegraut
	const when = (h: Highlight) => (h.y ? 'ganzjährig' : (h.d ?? monthRanges(h.m)));
	const whenSub = (h: Highlight) => (h.y ? (h.m.length ? `am besten ${monthRanges(h.m)}` : '') : h.v ? 'je nach Jahr' : '');

	const p = $derived(places?.[pi] ?? null);
	const best = $derived(p ? bestMonths(p[2], p[4]) : null);
	const bestSet = $derived(new Set(best?.months ?? []));

	const water = $derived(p?.[5] ?? null);
	const sun = $derived(p?.[6] ? sunTimes(p[1][1], p[1][0], sel, p[6]) : null);

	// Jahreszeiten-Balken unter dem Diagramm: Regenzeit bzw. Monsun (aus dem Niederschlag) und Wirbelsturmsaison
	const seasons = $derived.by(() => {
		if (!p) return [];
		const out: { label: string; months: Set<number>; cls: string }[] = [];
		const wet = rainSeason(p[4]);
		if (wet.length) out.push({ label: MONSOON.has(code) ? 'Monsun' : 'Regenzeit', months: new Set(wet), cls: 'rain' });
		if (p[7]) out.push({ label: p[7][0], months: new Set(p[7][1]), cls: 'storm' });
		return out;
	});
	/** zusammenhängende Monate als Abschnitte [Start, Ende] (über den Jahreswechsel geteilt, weil das Diagramm bei Januar beginnt) */
	const runs = (ms: Set<number>) => {
		const out: [number, number][] = [];
		for (let i = 0; i < 12; i++) if (ms.has(i) && !ms.has(i - 1)) {
			let j = i;
			while (ms.has(j + 1)) j++;
			out.push([i, j]);
		}
		return out;
	};

	// Diagramm: 12 Spalten à 25 Einheiten; Temperatur oben (y 24–96), Niederschlag unten (bis y 136), Monate (y 151),
	// darunter je Jahreszeit eine Zeile
	const CW = 25,
		X0 = 10;
	const H = $derived(156 + seasons.length * 14);
	const scale = $derived.by(() => {
		if (!p) return { lo: 0, hi: 1, rain: 1 };
		let lo = Math.min(...p[3], ...(water ?? [])) - 1,
			hi = Math.max(...p[2], ...(water ?? [])) + 1;
		if (hi - lo < 18) {
			const m = (hi + lo) / 2; // gleichmäßiges Tropenklima nicht übertrieben schwanken lassen
			lo = m - 9;
			hi = m + 9;
		}
		return { lo, hi, rain: Math.max(150, ...p[4]) };
	});
	const ty = (t: number) => 92 - ((t - scale.lo) / (scale.hi - scale.lo)) * 68;
	const ry = (mm: number) => (Math.min(mm, scale.rain) / scale.rain) * 22;

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
			<svg viewBox="0 0 320 {H}" aria-hidden="true">
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
				{#if water}
					<polyline class="cl-water" points={water.map((w, i) => `${X0 + i * CW + CW / 2},${ty(w).toFixed(1)}`).join(' ')} />
					{#each water as w, i (i)}<circle class="cl-water-dot" class:on={i === sel} cx={X0 + i * CW + CW / 2} cy={ty(w)} r={i === sel ? 3 : 1.6} />{/each}
				{/if}
				{#each seasons as se, k (se.label)}
					{@const y = 158 + k * 14}
					{#each runs(se.months) as [a, b] (a)}
						<rect class="cl-season {se.cls}" x={X0 + a * CW + 2} {y} width={(b - a + 1) * CW - 4} height="11" rx="5.5" />
						{#if b - a + 1 >= 3}<text class="cl-season-t {se.cls}" x={X0 + ((a + b + 1) * CW) / 2} y={y + 8.2}>{se.label}</text>{/if}
					{/each}
				{/each}
			</svg>
			<div class="cl-hit">
				{#each LETTERS as _, i (i)}
					<button type="button" aria-label={MONTHS_LONG[i]} aria-pressed={i === sel} onclick={() => (sel = i)}></button>
				{/each}
			</div>
		</div>
		<div class="cl-legend" aria-hidden="true">
			<span><i class="t"></i>Tag/Nacht</span><span><i class="r"></i>Regen</span>{#if water}<span><i class="w"></i>Wasser</span>{/if}{#if bestSet.size}<span><i class="g"></i>{best.good ? 'beste Zeit' : 'angenehmste Zeit'}</span>{/if}{#each seasons as se (se.label)}<span><i class="s {se.cls}"></i>{se.label}</span>{/each}
		</div>
		<div class="cl-detail">
			<b>{MONTHS_LONG[sel]}</b>
			<span>tagsüber <b>{p[2][sel]} °C</b></span>
			<span>nachts <b>{p[3][sel]} °C</b></span>
			<span><b>{p[4][sel]} mm</b> Regen</span>
			{#if water}<span>Wasser <b>{water[sel]} °C</b></span>{/if}
			{#if sun}
				<span class="cl-sun-t">
					{#if 'polar' in sun}<b>{sun.polar === 'day' ? 'Mitternachtssonne' : 'Polarnacht'}</b>
					{:else}<svg viewBox="0 0 24 24" aria-label="Sonnenaufgang"><path d="M4 18h16M7 14.5a5 5 0 0 1 10 0M12 4v4M9.5 6.5 12 4l2.5 2.5" /></svg><b>{sun.rise}</b>
						<svg viewBox="0 0 24 24" aria-label="Sonnenuntergang"><path d="M4 18h16M7 14.5a5 5 0 0 1 10 0M12 4v4M9.5 5.5 12 8l2.5-2.5" /></svg><b>{sun.set}</b>{/if}
				</span>
			{/if}
			{#each seasons.filter((se) => se.months.has(sel)) as se (se.label)}<span class="cl-season-chip {se.cls}">{se.label}</span>{/each}
		</div>
		{#if hls.length}
			<div class="cl-hls">
				<span class="lbl">Besonders zur Reisezeit</span>
				{#each hls as h (h.t + (h.r ?? ''))}
					<div class="cl-hl" class:on={h.y || h.m.includes(sel)}>
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
						<span class="cl-hl-when">{when(h)}{#if whenSub(h)}<small>{whenSub(h)}</small>{/if}</span>
					</div>
				{/each}
			</div>
		{/if}
		<span class="sub cl-src">Mittel 1991–2020 · {p[0]} · TerraClimate{water ? ', NOAA' : ''}{sun ? ' · Sonnenzeiten am 15.' : ''}</span>
	</div>
{/if}
