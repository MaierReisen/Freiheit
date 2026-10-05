<script lang="ts">
	import { onMount } from 'svelte';
	import { auth, initAuth } from '$lib/auth.svelte';
	import { TABS, openSettings } from '$lib/app.svelte';
	import LoginView from '$lib/components/LoginView.svelte';
	import Main from '$lib/components/Main.svelte';
	import Toast from '$lib/components/Toast.svelte';

	onMount(initAuth);
</script>

<div class="wrap" class:solo={TABS.length < 2}>
	<header class="bar">
		<div class="brand"><span class="brand-name">Freiheit</span><span class="brand-by">by Maier Reisen</span></div>
		{#if auth.user}
			<button type="button" class="menu-btn" id="menuBtn" aria-label="Einstellungen" aria-haspopup="dialog" onclick={() => openSettings()}
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><path
						d="M10.3 3.6a1.7 1.7 0 0 1 3.4 0l.2 1a1.7 1.7 0 0 0 2.4 1l.9-.5a1.7 1.7 0 0 1 2.4 2.4l-.5.9a1.7 1.7 0 0 0 1 2.4l1 .2a1.7 1.7 0 0 1 0 3.4l-1 .2a1.7 1.7 0 0 0-1 2.4l.5.9a1.7 1.7 0 0 1-2.4 2.4l-.9-.5a1.7 1.7 0 0 0-2.4 1l-.2 1a1.7 1.7 0 0 1-3.4 0l-.2-1a1.7 1.7 0 0 0-2.4-1l-.9.5a1.7 1.7 0 0 1-2.4-2.4l.5-.9a1.7 1.7 0 0 0-1-2.4l-1-.2a1.7 1.7 0 0 1 0-3.4l1-.2a1.7 1.7 0 0 0 1-2.4l-.5-.9a1.7 1.7 0 0 1 2.4-2.4l.9.5a1.7 1.7 0 0 0 2.4-1z"
					/><circle cx="12" cy="12" r="3.2" /></svg
				></button
			>
		{/if}
	</header>

	{#if auth.user}
		<Main />
	{:else if auth.ready}
		<LoginView />
	{/if}
</div>

<Toast />
