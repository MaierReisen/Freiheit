<script lang="ts">
	import { tierCls, tierName, type Badge } from '$lib/badges';

	/* Ein Abzeichen in der Übersicht (Reisepass und Flugpass): Medaille, Name, Stufenleiste, „noch N bis …“ */
	let { b, sel, onpick }: { b: Badge; sel: boolean; onpick: () => void } = $props();
	const max = $derived(b.level >= b.tiers.length);
</script>

<button
	type="button"
	class="pp-badge {tierCls(b, b.level)}"
	class:max
	class:sel
	data-badge={b.id}
	aria-pressed={sel}
	aria-label="{b.name}: {max ? tierName(b, b.level) + ' erreicht' : `${b.prog}, noch ${b.fmt(b.tiers[b.level] - b.v)} bis ${tierName(b, b.level + 1)}`}"
	onclick={onpick}
>
	<span class="pp-medal" aria-hidden="true"><span><i>{b.icon}</i></span></span>
	<b>{b.name}</b>
	<span class="pp-steps" aria-hidden="true">{#each b.seg as f, i (i)}<i class={tierCls(b, i + 1)} style="--f:{f}"></i>{/each}</span>
	<small aria-hidden="true"
		>{#if max}{tierName(b, b.level)} ✓{:else}noch {b.fmt(b.tiers[b.level] - b.v).replace(' ', ' ')} bis <em class={tierCls(b, b.level + 1)}>{tierName(b, b.level + 1)}</em>{/if}</small
	>
</button>
