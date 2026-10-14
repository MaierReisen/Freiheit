<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { openCountry, reduceMotion } from '$lib/app.svelte';
	import { flag } from '$lib/countries';
	import { tierCls, tierName, type Badge, type DetailItem } from '$lib/badges';

	/* Details zu einem Abzeichen als Blatt von unten (Reisepass und Flugpass). Erneutes Antippen, Runterwischen (auch
	   aufgeklappt) oder Tippen daneben schließt, Hochwischen klappt die Liste auf (was zählt schon, was fehlt noch).
	   `el` = das Blatt (die Seite misst damit, wie viel Platz unten frei bleiben muss). */
	let { pick, onclose, el = $bindable() }: { pick: Badge | null; onclose: () => void; el?: HTMLDivElement } = $props();

	let list = $state<HTMLDivElement>();
	let open = $state(false);
	const det = $derived(open && pick ? pick.detail() : null);
	let sOff = 0; // aktuelle Zieh-Verschiebung (für das Wegschieben ab dieser Stelle)
	// neues Abzeichen: zugeklappt beginnen
	$effect(() => {
		void pick?.id;
		untrack(() => (open = false));
	});

	/* Auf-/Zuklappen: Höhe springt, die Verschiebung gleicht das aus und läuft weich auf 0 (ab der Zieh-Position) */
	async function setOpen(v: boolean, from = 0) {
		if (!el) return;
		const h0 = el.offsetHeight;
		open = v;
		await tick();
		if (!el) return;
		if (!v && list) list.scrollTop = 0;
		const h1 = el.offsetHeight;
		el.style.transition = 'none';
		el.style.transform = '';
		if (!reduceMotion()) el.animate([{ transform: `translateY(${h1 - h0 + from}px)` }, { transform: 'translateY(0)' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
	}
	function slideUp(node: HTMLElement, _p?: unknown, opt?: { direction?: string }) {
		// herein immer von ganz unten, hinaus ab der Stelle, bis zu der gezogen wurde
		const h = node.offsetHeight + 24,
			o = opt?.direction === 'in' ? 0 : sOff;
		sOff = 0;
		return { duration: reduceMotion() ? 0 : o ? 160 : 240, css: (t: number) => `transform:translateY(${o + (1 - t) * (h - o)}px)`, easing: (t: number) => 1 - (1 - t) ** 3 };
	}
	$effect(() => {
		const s = el;
		if (!s) return;
		// mode: 0 = noch offen (Antippen), 1 = Blatt ziehen, 2 = Liste scrollt selbst
		let d: { y0: number; ly: number; lt: number; vy: number; dy: number; mode: 0 | 1 | 2 } | null = null;
		const ts = (e: TouchEvent) => {
			e.stopPropagation();
			if (e.touches.length !== 1) return (d = null);
			const y = e.touches[0].clientY;
			d = { y0: y, ly: y, lt: e.timeStamp, vy: 0, dy: 0, mode: 0 };
		};
		const tm = (e: TouchEvent) => {
			e.stopPropagation();
			if (!d) return;
			const y = e.touches[0].clientY,
				raw = y - d.y0;
			if (!d.mode) d.mode = open && list?.contains(e.target as Node) && (list.scrollTop > 0 || raw < 0) ? 2 : 1;
			if (d.mode === 2) return;
			e.preventDefault();
			const dt = e.timeStamp - d.lt;
			if (dt >= 12) {
				d.vy = 0.6 * ((y - d.ly) / dt) + 0.4 * d.vy;
				d.ly = y;
				d.lt = e.timeStamp;
			}
			d.dy = raw;
			// zugeklappt nach oben: mit Widerstand, aufgeklappt nur nach unten
			const shown = raw >= 0 ? raw : open ? 0 : Math.max(-60, raw * 0.35);
			s.style.transition = 'none';
			s.style.transform = `translateY(${shown}px)`;
		};
		const te = (e: TouchEvent) => {
			e.stopPropagation();
			if (!d) return;
			const { dy, vy, mode } = d;
			d = null;
			if (mode !== 1) return;
			if (!open && (dy < -40 || (vy < -0.3 && dy < -10))) {
				setOpen(true, Math.max(-60, dy * 0.35));
			} else if (dy > 70 || (vy > 0.5 && dy > 20)) {
				// auch aufgeklappt: Runterwischen schließt das ganze Blatt (wie die Länderseite)
				sOff = dy;
				onclose();
			} else {
				s.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)';
				s.style.transform = '';
			}
		};
		s.addEventListener('touchstart', ts, { passive: true });
		s.addEventListener('touchmove', tm, { passive: false });
		s.addEventListener('touchend', te);
		s.addEventListener('touchcancel', te);
		return () => {
			s.removeEventListener('touchstart', ts);
			s.removeEventListener('touchmove', tm);
			s.removeEventListener('touchend', te);
			s.removeEventListener('touchcancel', te);
		};
	});
</script>

{#snippet row(it: DetailItem)}
	{#if it.code}
		{@const code = it.code}
		<button type="button" class="pp-it" onclick={() => openCountry(code)}
			><span class="pp-it-i">{flag(code)}</span><span><b>{it.label}</b>{#if it.sub}<small>{it.sub}</small>{/if}</span></button
		>
	{:else}
		<div class="pp-it"><span class="pp-it-i">{it.icon}</span><span><b>{it.label}</b>{#if it.sub}<small>{it.sub}</small>{/if}</span></div>
	{/if}
{/snippet}
{#if pick && open}
	<button type="button" class="pp-scrim" aria-label="Details schließen" onclick={onclose} transition:fade={{ duration: reduceMotion() ? 0 : 200 }}></button>
{/if}
{#if pick}
	{@const max = pick.level >= pick.tiers.length}
	<div class="pp-sheet {tierCls(pick, pick.level)}" class:max class:open bind:this={el} transition:slideUp role="status">
		<button type="button" class="pp-grab" aria-label="Details schließen" onclick={onclose}><i></i></button>
		<div class="pp-sh-top">
			<span class="pp-medal" aria-hidden="true"><span><i>{pick.icon}</i></span></span>
			<div>
				<b>{pick.name}</b>
				<span>{pick.fmt(pick.v)} {pick.what}</span>
			</div>
		</div>
		{#if !max}
			<div class="pp-next {tierCls(pick, pick.level + 1)}">
				<div class="pp-next-t"><span>Noch {pick.fmt(pick.tiers[pick.level] - pick.v)} bis <b>{tierName(pick, pick.level + 1)}</b></span><span>{Math.floor(pick.p * 100)} %</span></div>
				<div class="pp-bar"><i style="width:{Math.max(3, pick.p * 100)}%"></i></div>
			</div>
		{:else}
			<p class="pp-done">Höchste Stufe erreicht 🎉</p>
		{/if}
		<span class="pp-tiers"
			>{#each pick.tiers as t, i (t)}<i class:on={pick.level > i} class={tierCls(pick, i + 1)}>{pick.level > i ? '✓ ' : ''}{tierName(pick, i + 1)}: {pick.fmt(t)}</i>{/each}</span
		>
		{#if det}
			<div class="pp-list" bind:this={list}>
				{#if det.have.length}
					<h4>{det.haveT} <span>{det.have.length}</span></h4>
					<div class="pp-its">{#each det.have as it, i (i)}{@render row(it)}{/each}</div>
				{/if}
				{#if det.miss.length && !max}
					<h4>{det.missT} <span>{det.miss.length + (det.missMore ?? 0)}</span></h4>
					{#if det.note}<p class="pp-lnote">{det.note}</p>{/if}
					<div class="pp-its miss">{#each det.miss as it, i (i)}{@render row(it)}{/each}</div>
					{#if det.missMore}<p class="pp-lnote">… und {det.missMore} weitere</p>{/if}
				{:else if det.note}
					<p class="pp-lnote">{det.note}</p>
				{:else if !max && det.missT}
					<p class="pp-lnote">Alles dabei 🎉</p>
				{/if}
			</div>
		{:else}
			<button type="button" class="pp-more" onclick={() => setOpen(true)}><i aria-hidden="true"></i>Was zählt – was fehlt noch?</button>
		{/if}
	</div>
{/if}
