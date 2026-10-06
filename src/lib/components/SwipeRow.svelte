<script module lang="ts">
	// Es ist immer höchstens eine Zeile aufgewischt (wie in iOS)
	let openRow = $state<symbol | null>(null);
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reduceMotion } from '$lib/app.svelte';

	/* Listenzeile mit „Wischen nach links zum Löschen“ nach iOS-Vorbild:
	   Wischen legt den roten „Löschen“-Knopf frei, erst ein Tipp darauf löscht.
	   Tipp auf die Zeile, woanders hin oder Scrollen schließt sie wieder. */

	let { children, ondelete, label = 'Löschen' }: { children: Snippet; ondelete: () => void; label?: string } = $props();

	const W = 88; // Breite des Löschen-Knopfs
	const id = Symbol();
	let li: HTMLLIElement;
	let x = $state(0);
	let anim = $state(false); // weiches Einrasten statt Folgen des Fingers
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
		// Gummiband: nach rechts kaum, über den Knopf hinaus gebremst (kein Löschen durch Durchwischen)
		if (nx > 0) nx *= 0.15;
		else if (nx < -W) nx = -W + (nx + W) * 0.3;
		x = nx;
	}
	function up() {
		if (!g) return;
		const d = g;
		g = null;
		if (d.dir === 'h') {
			swallowClick = true;
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
	<button
		type="button"
		class="swipe-del"
		style="width:{Math.max(W, -x)}px"
		tabindex={isOpen ? 0 : -1}
		aria-hidden={!isOpen}
		onclick={remove}><span style="width:{W}px">{label}</span></button
	>
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
