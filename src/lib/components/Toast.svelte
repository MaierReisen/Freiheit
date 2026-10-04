<script lang="ts">
	import { ui } from '$lib/app.svelte';
</script>

<div class="toast" class:show={ui.toastShow} id="toast" role="status">{ui.toastMsg}</div>
