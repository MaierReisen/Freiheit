<script module lang="ts">
	// Es ist immer höchstens eine Zeile aufgewischt (wie in iOS)
	let openRow = $state<symbol | null>(null);
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reduceMotion } from '$lib/app.svelte';

	/* Listenzeile mit „Wischen nach links zum Löschen“ nach iOS-Vorbild:
	   Wischen legt den roten „Löschen“-Knopf frei; gelöscht wird erst per Tipp darauf
	   oder durch erneutes Wischen nach links an der schon offenen Zeile (Knopf wächst, „scharf“).
	   Tipp auf die Zeile, woanders hin oder Scrollen schließt sie wieder. */

	let { children, ondelete, label = 'Löschen' }: { children: Snippet; ondelete: () => void; label?: string } = $props();

	const W = 92; // Breite des Löschen-Knopfs
	const ARM = 70; // so weit über den Knopf hinaus wischen, bis Loslassen löscht
	const id = Symbol();
	let li: HTMLLIElement;
	let x = $state(0);
	let anim = $state(false); // weiches Einrasten statt Folgen des Fingers
	let armed = $state(false); // zweites Wischen weit genug: Loslassen löscht
	let removing = $state(false);
	let g: { x0: number; y0: number; sx: number; dir: 'h' | 'v' | null; lx: number; lt: number; vx: number } | null = null;
	let swallowClick = false;

	const isOpen = $derived(x < 0 && !g);

	function snap(to: number) {
		anim = !reduceMotion();
		x = to;
		if (to) openRow = id;
		else if (openRow === id) openRow = null;
	}

	// andere Zeile geöffnet → diese schließt sich
	$effect(() => {
		if (openRow !== id && !g && !removing && x !== 0) snap(0);
	});

	// offen: Tipp außerhalb der Zeile oder Scrollen schließt sie
	$effect(() => {
		if (!isOpen) return;
		const close = (e: Event) => {
			if (e.type === 'pointerdown' && li.contains(e.target as Node)) return;
			snap(0);
		};
		document.addEventListener('pointerdown', close, true);
		window.addEventListener('scroll', close, { passive: true });
		return () => {
			document.removeEventListener('pointerdown', close, true);
			window.removeEventListener('scroll', close);
		};
	});

	function down(e: PointerEvent) {
		if (removing || (e.pointerType === 'mouse' && e.button !== 0)) return;
		g = { x0: e.clientX, y0: e.clientY, sx: x, dir: null, lx: e.clientX, lt: e.timeStamp, vx: 0 };
		swallowClick = false;
	}
	function move(e: PointerEvent) {
		if (!g) return;
		const dx = e.clientX - g.x0,
			dy = e.clientY - g.y0;
		if (!g.dir) {
			if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
				g.dir = 'h';
				anim = false;
				openRow = id;
				(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
			} else if (Math.abs(dy) > 8) g.dir = 'v';
			else return;
		}
		if (g.dir !== 'h') return;
		const dt = e.timeStamp - g.lt;
		if (dt > 0) g.vx = 0.7 * ((e.clientX - g.lx) / dt) + 0.3 * g.vx;
		g.lx = e.clientX;
		g.lt = e.timeStamp;
		let nx = g.sx + dx;
		// Gummiband: nach rechts kaum. Aus geschlossener Zeile über den Knopf hinaus stark gebremst
		// (erstes Wischen löscht nie), aus offener Zeile leicht gebremst – weit genug = scharf
		const fromOpen = g.sx < 0;
		if (nx > 0) nx *= 0.15;
		else if (nx < -W) nx = -W + (nx + W) * (fromOpen ? 0.85 : 0.3);
		x = nx;
		const arm = fromOpen && nx < -(W + ARM);
		if (arm && !armed) navigator.vibrate?.(10);
		armed = arm;
	}
	function up() {
		if (!g) return;
		const d = g;
		g = null;
		if (d.dir === 'h') {
			swallowClick = true;
			// zweites Wischen: weit genug gezogen oder kräftig nach links geschnippt → löschen
			if (armed || (d.sx < 0 && d.vx < -0.6 && x < d.sx - 24)) return remove();
			const open = d.vx < -0.35 ? true : d.vx > 0.35 ? false : x < -W / 2;
			snap(open ? -W : 0);
		} else if (d.dir === null && d.sx < 0) {
			// Tipp auf die offene Zeile schließt nur
			swallowClick = true;
			snap(0);
		}
	}
	function cancel() {
		if (!g) return;
		g = null;
		armed = false;
		snap(x < -W / 2 ? -W : 0);
	}
	function click(e: MouseEvent) {
		if (!swallowClick) return;
		swallowClick = false;
		e.preventDefault();
		e.stopPropagation();
	}

	function remove() {
		if (removing) return;
		if (reduceMotion()) return ondelete();
		removing = true;
		armed = true;
		openRow = null;
		// Zeile gleitet hinaus und klappt zu, dann wird gelöscht
		li.style.height = li.offsetHeight + 'px';
		void li.offsetHeight;
		anim = true;
		x = -li.offsetWidth;
		li.classList.add('collapsing');
		li.style.height = '0px';
		setTimeout(ondelete, 280);
	}
</script>

<li class="swipe" bind:this={li}>
	{#if x < 0 || removing}
		<button
			type="button"
			class="swipe-del"
			class:armed
			style="width:{Math.max(W, -x)}px"
			tabindex={isOpen ? 0 : -1}
			aria-hidden={!isOpen}
			aria-label={label}
			onclick={remove}
			><span class="swipe-pill" style="transform:scale({Math.min(1, 0.55 + (0.45 * -x) / W)});opacity:{Math.min(1, (-x / W) * 1.6)}"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><path class="bin-lid" d="M4 7h16M9 7V4.8A.8.8 0 0 1 9.8 4h4.4a.8.8 0 0 1 .8.8V7" /><path d="M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 1.8h7a2 2 0 0 0 2-1.8l1-12" /></svg
				></span
			></button
		>
	{/if}
	<div
		class="swipe-fg"
		class:anim
		style="transform:translateX({x}px)"
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={cancel}
		onclickcapture={click}
		role="presentation"
	>
		{@render children()}
	</div>
</li>
