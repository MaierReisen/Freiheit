import { reduceMotion } from './app.svelte';

/* Zeilen einer Liste per Halten und Ziehen umsortieren (Svelte-Aktion für das <ul>).
   Halten (ca. 0,35 s ohne Bewegung) hebt die Zeile an, Ziehen verschiebt sie, die anderen Zeilen weichen aus,
   am Rand scrollt die Liste mit. Beim Loslassen kommt die neue Reihenfolge als Liste der Länderkürzel.
   Jede Zeile ist ein <li> mit einem Element [data-code]. Vorher passiert nichts Teures. */

export interface ReorderOpts {
	enabled: boolean;
	/** neue Reihenfolge aller Zeilen dieser Liste */
	onreorder: (codes: string[]) => void;
	/** Zeile wurde angehoben bzw. losgelassen */
	ondrag?: (on: boolean) => void;
}

const HOLD_MS = 350;
const SLOP = 6; // so weit darf der Finger beim Halten wandern
const EDGE = 70; // Abstand zum Rand, ab dem die Liste mitscrollt

export function reorder(ul: HTMLElement, initial: ReorderOpts) {
	let opts = initial;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let press: { id: number; x: number; y: number; li: HTMLElement } | null = null;
	let d: {
		id: number;
		li: HTMLElement;
		rows: HTMLElement[];
		from: number;
		to: number;
		y0: number;
		scroll0: number;
		h: number;
		tops: number[];
		cy: number;
		raf: number;
		scroller: HTMLElement | null;
	} | null = null;
	let swallow = false;

	const codeOf = (li: Element) => li.querySelector<HTMLElement>('[data-code]')?.dataset.code ?? '';
	const scrollerOf = (el: HTMLElement) => {
		for (let p = el.parentElement; p; p = p.parentElement) {
			const o = getComputedStyle(p).overflowY;
			if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p;
		}
		return null;
	};

	function start() {
		if (!press) return;
		const li = press.li;
		const rows = [...ul.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
		const from = rows.indexOf(li);
		if (from < 0) return;
		const scroller = scrollerOf(ul);
		d = {
			id: press.id,
			li,
			rows,
			from,
			to: from,
			y0: press.y,
			scroll0: scroller?.scrollTop ?? 0,
			h: li.offsetHeight,
			tops: rows.map((r) => r.offsetTop),
			cy: press.y,
			raf: 0,
			scroller
		};
		press = null;
		try {
			li.setPointerCapture(d.id);
		} catch {}
		li.classList.add('lifted');
		ul.classList.add('dragging');
		for (const r of rows) if (r !== li) r.style.transition = reduceMotion() ? 'none' : 'transform .18s cubic-bezier(.2,.8,.3,1)';
		navigator.vibrate?.(12);
		opts.ondrag?.(true);
		d.raf = requestAnimationFrame(tickScroll);
		place();
	}

	function place() {
		if (!d) return;
		const dy = d.cy - d.y0 + ((d.scroller?.scrollTop ?? 0) - d.scroll0);
		// nicht über die Liste hinaus ziehen
		const min = d.tops[0] - d.tops[d.from],
			max = d.tops[d.tops.length - 1] - d.tops[d.from];
		const y = Math.max(min, Math.min(max, dy));
		d.li.style.transform = `translateY(${y}px) scale(1.02)`;
		// Ziel: Zeile, deren Mitte der gezogenen Zeile am nächsten liegt
		const mid = d.tops[d.from] + y + d.h / 2;
		let to = d.from;
		for (let i = 0; i < d.rows.length; i++) if (mid > d.tops[i]) to = i;
		d.to = Math.max(0, Math.min(d.rows.length - 1, to));
		d.rows.forEach((r, i) => {
			if (r === d!.li) return;
			let shift = 0;
			if (d!.from < d!.to && i > d!.from && i <= d!.to) shift = -d!.h;
			else if (d!.from > d!.to && i >= d!.to && i < d!.from) shift = d!.h;
			r.style.transform = shift ? `translateY(${shift}px)` : '';
		});
	}

	function tickScroll() {
		if (!d) return;
		const sc = d.scroller;
		if (sc) {
			const r = sc.getBoundingClientRect();
			const top = Math.max(r.top, 0),
				bottom = Math.min(r.bottom, window.innerHeight);
			let v = 0;
			if (d.cy < top + EDGE) v = -Math.ceil(((top + EDGE - d.cy) / EDGE) * 14);
			else if (d.cy > bottom - EDGE) v = Math.ceil(((d.cy - (bottom - EDGE)) / EDGE) * 14);
			if (v) {
				sc.scrollTop += v;
				place();
			}
		}
		d.raf = requestAnimationFrame(tickScroll);
	}

	function finish(apply: boolean) {
		clearTimeout(timer);
		press = null;
		if (!d) return;
		const s = d;
		d = null;
		cancelAnimationFrame(s.raf);
		// Zeilen ohne Übergang zurücksetzen: Svelte sortiert gleich danach das DOM um, die Zeilen stehen dann schon richtig
		for (const r of s.rows) {
			r.style.transition = 'none';
			r.style.transform = '';
		}
		s.li.classList.remove('lifted');
		ul.classList.remove('dragging');
		try {
			s.li.releasePointerCapture(s.id);
		} catch {}
		swallow = true;
		setTimeout(() => (swallow = false), 60);
		opts.ondrag?.(false);
		if (apply && s.to !== s.from) {
			const codes = s.rows.map(codeOf);
			const [m] = codes.splice(s.from, 1);
			codes.splice(s.to, 0, m);
			opts.onreorder(codes);
			navigator.vibrate?.(8);
		}
		requestAnimationFrame(() => s.rows.forEach((r) => (r.style.transition = '')));
	}

	function down(e: PointerEvent) {
		if (!opts.enabled || d || (e.pointerType === 'mouse' && e.button !== 0)) return;
		const li = (e.target as Element).closest?.('li');
		if (!li || li.parentElement !== ul || !(li instanceof HTMLElement) || !li.querySelector('[data-code]')) return;
		press = { id: e.pointerId, x: e.clientX, y: e.clientY, li };
		clearTimeout(timer);
		timer = setTimeout(start, HOLD_MS);
	}
	function move(e: PointerEvent) {
		if (d) {
			if (e.pointerId !== d.id) return;
			d.cy = e.clientY;
			place();
			return;
		}
		if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > SLOP) {
			clearTimeout(timer);
			press = null;
		}
	}
	function up(e: PointerEvent) {
		if (d && e.pointerId === d.id) finish(true);
		else {
			clearTimeout(timer);
			press = null;
		}
	}
	function cancel(e: PointerEvent) {
		if (d && e.pointerId === d.id) finish(false);
		else {
			clearTimeout(timer);
			press = null;
		}
	}
	// beim Ziehen darf die Seite nicht mitscrollen (muss vor dem Berühren angemeldet sein, daher nicht passiv)
	function touchmove(e: TouchEvent) {
		if (d) e.preventDefault();
	}
	function click(e: MouseEvent) {
		if (!swallow) return;
		e.preventDefault();
		e.stopPropagation();
	}
	const noMenu = (e: Event) => {
		if (press || d) e.preventDefault();
	};

	ul.addEventListener('pointerdown', down);
	ul.addEventListener('pointermove', move);
	ul.addEventListener('pointerup', up);
	ul.addEventListener('pointercancel', cancel);
	ul.addEventListener('touchmove', touchmove, { passive: false });
	ul.addEventListener('click', click, true);
	ul.addEventListener('contextmenu', noMenu);

	return {
		update(o: ReorderOpts) {
			opts = o;
			if (!o.enabled && d) finish(false);
		},
		destroy() {
			finish(false);
			ul.removeEventListener('pointerdown', down);
			ul.removeEventListener('pointermove', move);
			ul.removeEventListener('pointerup', up);
			ul.removeEventListener('pointercancel', cancel);
			ul.removeEventListener('touchmove', touchmove);
			ul.removeEventListener('click', click, true);
			ul.removeEventListener('contextmenu', noMenu);
		}
	};
}
