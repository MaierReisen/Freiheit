<script lang="ts">
	import { TABS, goTab, ui } from '$lib/app.svelte';
</script>

<nav class="tabbar" id="tabbar" aria-label="Hauptnavigation">
	<div class="tabbar-in">
		<span class="ind" id="tabInd" aria-hidden="true" style="transform:translateX({TABS.indexOf(ui.tab) * 100}%)"></span>
		<button type="button" data-tab="home" aria-current={ui.tab === 'home' ? 'page' : undefined} onclick={() => goTab('home')}
			><svg viewBox="0 0 24 24" aria-hidden="true"
				><circle class="f" cx="12" cy="12" r="9" /><path class="d" d="M12 3c-2.6 2.5-4.1 5.5-4.1 9s1.5 6.5 4.1 9c2.6-2.5 4.1-5.5 4.1-9S14.6 5.5 12 3z" /><path
					class="d"
					d="M3.2 12h17.6M5 7.6c4.4 1.5 9.6 1.5 14 0M5 16.4c4.4-1.5 9.6-1.5 14 0"
				/></svg
			><span>Übersicht</span></button
		>
	</div>
</nav>
