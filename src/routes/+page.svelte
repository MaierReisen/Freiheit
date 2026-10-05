<script lang="ts">
	import { onMount } from 'svelte';
	import { auth, initAuth } from '$lib/auth.svelte';
	import LoginView from '$lib/components/LoginView.svelte';
	import Main from '$lib/components/Main.svelte';
	import Toast from '$lib/components/Toast.svelte';

	onMount(initAuth);
</script>

<div class="wrap">
	<header class="bar">
		<div class="brand"><span class="brand-name">Freiheit</span><span class="brand-by">by Maier Reisen</span></div>
	</header>

	{#if auth.user}
		<Main />
	{:else if auth.ready}
		<LoginView />
	{/if}
</div>

<Toast />
