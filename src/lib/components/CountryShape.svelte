<script lang="ts">
	import { geoOrthographic, geoPath, geoGraticule10 } from 'd3-geo';
	import { shapeOf } from '$lib/map/geo';

	/* Kartenausschnitt des Landes im Stil des Globus: Land hervorgehoben (bereist türkis, sonst hell), Nachbarn gedämpft */

	let { code, been = false }: { code: string; been?: boolean } = $props();

	const W = 340,
		H = 190;
	const view = $derived.by(() => {
		const s = shapeOf(code);
		if (!s) return null;
		const P = geoOrthographic()
			.rotate([-s.c[0], -s.c[1]])
			.clipAngle(90)
			.fitExtent(
				[
					[24, 18],
					[W - 24, H - 18]
				],
				s.shape
			);
		const path = geoPath(P);
		return { land: path(s.shape) ?? '', around: path(s.around) ?? '', grat: path(geoGraticule10()) ?? '' };
	});
</script>

{#if view}
	<svg class="cshape" viewBox="0 0 {W} {H}" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
		<defs>
			<radialGradient id="cs-sea" cx="35%" cy="25%" r="90%">
				<stop offset="0" stop-color="#1D5A7A" />
				<stop offset="1" stop-color="#0C2E45" />
			</radialGradient>
			<filter id="cs-glow" x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur stdDeviation="6" />
			</filter>
		</defs>
		<rect width={W} height={H} fill="url(#cs-sea)" />
		<path d={view.grat} fill="none" stroke="rgba(255,255,255,.07)" stroke-width=".6" />
		<path d={view.around} fill="#4B6F82" stroke="#0D2A3D" stroke-width=".7" stroke-linejoin="round" />
		<path d={view.land} fill={been ? '#34D1BF' : '#F6C445'} opacity=".55" filter="url(#cs-glow)" />
		<path d={view.land} fill={been ? '#34D1BF' : '#DCE9EE'} stroke={been ? '#A0F5E8' : '#FFFFFF'} stroke-width="1.2" stroke-linejoin="round" />
	</svg>
{/if}
