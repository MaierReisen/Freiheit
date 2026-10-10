<script lang="ts">
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { scopeTotal } from '$lib/scope';
	import { openPass } from '$lib/app.svelte';
	import { rankInfo } from '$lib/passport';
	import { passSeen } from '$lib/passSeen.svelte';

	/* Reisepass-Kachel: Zähler, Rang-Abzeichen und Fortschritt bis zum nächsten Rang.
	   In der Länderliste ein Knopf (öffnet den Pass), im Pass selbst kompakt als Knopf zu den Rängen. */

	let { inPass = false, onrank }: { inPass?: boolean; onrank?: () => void } = $props();

	const codes = $derived(countedCountries().map((c) => c.code));
	const n = $derived(codes.length);
	const stamps = $derived(atlas.data.countries.length);
	const info = $derived(rankInfo(n, scopeTotal(atlas.settings.countryScope)));
	// neue Stempel seit dem letzten Blick in den Pass (auch von Gebieten, die nicht zählen)
	const fresh = $derived(passSeen.codes ? atlas.data.countries.filter((c) => !passSeen.codes!.includes(c.code)).length : 0);
</script>

{#snippet body()}
	<span class="pp-cover t{info.tier}" aria-hidden="true">
		<svg viewBox="0 0 60 60">
			{#if info.tier >= 6}<path class="fill" d="M14 30c-6-1-10-5-12-10 5 1 8 0 11-3-4-1-7-3-9-7 6 0 10 1 14 4zM46 30c6-1 10-5 12-10-5 1-8 0-11-3 4-1 7-3 9-7-6 0-10 1-14 4z" />{/if}
			{#if info.tier >= 5}{#each Array(12) as _, k}<circle class="fill" cx={30 + 27 * Math.sin((k * Math.PI) / 6)} cy={32 - 27 * Math.cos((k * Math.PI) / 6)} r="1.1" />{/each}{/if}
			{#if info.tier >= 2}<path class="fill" d="M30 6l2.2 5h-4.4zM54 32l-5 2.2v-4.4zM30 58l-2.2-5h4.4zM6 32l5-2.2v4.4z" />{/if}
			<circle cx="30" cy="32" r="16" /><ellipse cx="30" cy="32" rx="7" ry="16" /><path d="M14 32h32" />
			{#if info.tier >= 3}<path d="M17.5 23q12.5 4 25 0M17.5 41q12.5-4 25 0" />{/if}
			{#if info.tier >= 4}<ellipse cx="30" cy="32" rx="12" ry="16" />{/if}
			{#if info.tier >= 7}<path class="fill" d="M19 14l3 4 4-6 4 6 4-6 4 6 3-4-2 9H21z" />{/if}
		</svg>
		<b>REISEPASS</b>
		{#if info.tier >= 2}<i class="pp-pips">{#each Array(Math.min(info.tier, 7)) as _}<u></u>{/each}</i>{/if}
	</span>
	<span class="pp-tile-txt">
		<span class="pp-tile-n">{inPass ? n : stamps}<small>{inPass ? (n === 1 ? 'Land' : 'Länder') : 'Stempel'}</small>{#if fresh && !inPass}<em class="pp-new">✨ {fresh} neu</em>{/if}</span>
		{#if info.rank}<span class="pp-rank">{info.rank.icon} {info.rank.name}</span>{/if}
		<span class="pp-bar"><i style="width:{info.p * 100}%"></i></span>
		<span class="pp-bar-t"
			>{#if info.next}Noch {info.left} {info.left === 1 ? 'Land' : 'Länder'} bis <b>{info.next.name}</b>{:else}Höchster Rang erreicht{/if}</span
		>
	</span>
{/snippet}

{#if inPass}
	<button type="button" class="pp-tile in-pass" aria-label="{n} {n === 1 ? 'Land' : 'Länder'}{info.rank ? `, Rang ${info.rank.name}` : ''} – alle Ränge zeigen" onclick={() => onrank?.()}
		>{@render body()}<span class="pp-chev" aria-hidden="true">›</span></button
	>
{:else}
	<button type="button" class="pp-tile" class:fresh={fresh > 0} aria-label="Reisepass öffnen: {stamps} {'Stempel'}{fresh ? `, ${fresh} neue Stempel` : ''}{info.rank ? `, Rang ${info.rank.name}` : ''}" onclick={() => openPass()}>{@render body()}</button>
{/if}
