<script lang="ts">
	import { TABS, TAB_LABEL, goTab, ui } from '$lib/app.svelte';
</script>

<nav class="tabbar" class:away={ui.mapActive && !ui.full} id="tabbar" aria-label="Hauptnavigation">
	<div class="tabbar-in">
		<span class="ind" id="tabInd" aria-hidden="true" style="transform:translateX({TABS.indexOf(ui.tab) * 100}%);width:calc((100% - 8px)/{TABS.length})"></span>
		{#each TABS as t}
			<button type="button" data-tab={t} aria-current={ui.tab === t ? 'page' : undefined} onclick={() => goTab(t)}>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					{#if t === 'home'}
						<circle class="f" cx="12" cy="12" r="9" /><path class="d" d="M12 3c-2.6 2.5-4.1 5.5-4.1 9s1.5 6.5 4.1 9c2.6-2.5 4.1-5.5 4.1-9S14.6 5.5 12 3z" /><path
							class="d"
							d="M3.2 12h17.6M5 7.6c4.4 1.5 9.6 1.5 14 0M5 16.4c4.4-1.5 9.6-1.5 14 0"
						/>
					{:else if t === 'flights'}
						<path
							class="f"
							d="M10.6 3.2c.4-.9 2.4-.9 2.8 0 .3.6.4 1.6.4 2.6v3.9l7.2 4.3c.4.2.6.6.6 1v1.1c0 .4-.4.6-.7.5l-7.1-2.3v3.8l2.3 1.7c.2.2.3.4.3.6v.8c0 .3-.3.5-.6.4L12 20.6l-3.8 1c-.3.1-.6-.1-.6-.4v-.8c0-.2.1-.5.3-.6l2.3-1.7v-3.8l-7.1 2.3c-.3.1-.7-.1-.7-.5V15c0-.4.2-.8.6-1l7.2-4.3V5.8c0-1 .1-2 .4-2.6z"
						/>
					{/if}
				</svg><span>{TAB_LABEL[t]}</span></button
			>
		{/each}
	</div>
</nav>
