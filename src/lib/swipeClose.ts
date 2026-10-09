import { reduceMotion } from './app.svelte';

/* Svelte-Aktion für Vollbild-Seiten: nach rechts wischen = zurück, nach unten wischen (oben in der Liste) = schließen.
   Gleiches Verhalten wie in „Deine Länder“: Seite folgt dem Finger ohne Ruck, beim Loslassen entscheiden Weg und Tempo.
   Die Liste muss in `.ov-body` liegen (dort wird geprüft, ob ganz oben). */

export interface SwipeCloseOpts {
	onclose: () => void;
	/** Berührung ignorieren (z. B. im Suchfeld) */
	skip?: (t: Element) => boolean;
}

export function swipeClose(view: HTMLElement, opts: SwipeCloseOpts) {
	let o = opts;
	let s: { x: number; y: number; dir: 'h' | 'd' | 'v' | null; dx: number; dy: number; lx: number; lt: number; v: number; raf: number } | null = null;

	function start(e: TouchEvent) {
		cancelAnimationFrame(s?.raf ?? 0);
		s = null;
		const t = e.target as Element;
		if (e.touches.length !== 1 || t.closest('input') || o.skip?.(t)) return;
		const p = e.touches[0];
		s = { x: p.clientX, y: p.clientY, dir: null, dx: 0, dy: 0, lx: p.clientX, lt: e.timeStamp, v: 0, raf: 0 };
	}
	function paint() {
		if (!s) return;
		s.raf = 0;
		view.style.transform = s.dir === 'd' ? `translate3d(0,${s.dy}px,0)` : `translate3d(${s.dx}px,0,0)`;
	}
	function move(e: TouchEvent) {
		if (!s) return;
		const p = e.touches[0],
			dx = p.clientX - s.x,
			dy = p.clientY - s.y;
		if (!s.dir) {
			if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
			const atTop = (view.querySelector('.ov-body')?.scrollTop ?? 0) <= 0;
			s.dir = dx > 0 && dx > Math.abs(dy) * 1.3 ? 'h' : dy > 0 && dy > Math.abs(dx) && atTop ? 'd' : 'v';
			if (s.dir === 'h') s.x += 6; // ohne Sprung loslegen
			else if (s.dir === 'd') s.y += 6;
			if (s.dir !== 'v') {
				view.classList.add('swiping');
				if (s.dir === 'd') view.classList.add('down');
				view.style.transition = 'none';
			}
			return;
		}
		if (s.dir === 'v') return;
		const down = s.dir === 'd',
			cur = down ? p.clientY : p.clientX;
		if (down) e.preventDefault();
		const dt = e.timeStamp - s.lt;
		if (dt > 0) s.v = 0.6 * ((cur - s.lx) / dt) + 0.4 * s.v; // px pro ms
		s.lx = cur;
		s.lt = e.timeStamp;
		if (down) s.dy = Math.max(0, p.clientY - s.y);
		else s.dx = Math.max(0, p.clientX - s.x);
		if (!s.raf) s.raf = requestAnimationFrame(paint);
	}
	function end() {
		const b = s;
		s = null;
		if (!b) return;
		cancelAnimationFrame(b.raf);
		if (b.dir !== 'h' && b.dir !== 'd') return;
		const down = b.dir === 'd';
		const W = down ? window.innerHeight : window.innerWidth;
		const dist = down ? b.dy : b.dx;
		const go = down ? dist > 140 || (b.v > 0.6 && dist > 40) : dist > W * 0.3 || (b.v > 0.5 && dist > 24);
		const rest = go ? W - dist : dist;
		const ms = reduceMotion() ? 0 : Math.round(Math.max(130, Math.min(260, (rest / Math.max(b.v, 0.9)) * (go ? 1 : 0.7))));
		view.style.transition = ms ? `transform ${ms}ms cubic-bezier(.22,.8,.3,1)` : 'none';
		view.style.transform = go ? (down ? 'translate3d(0,100%,0)' : 'translate3d(100%,0,0)') : '';
		setTimeout(() => {
			if (go) o.onclose();
			view.classList.remove('swiping', 'down');
			// nach dem Schließen Ausgangszustand für das nächste Öffnen
			setTimeout(() => {
				view.style.transition = '';
				if (go) view.style.transform = '';
			}, 30);
		}, ms);
	}

	view.addEventListener('touchstart', start, { passive: true });
	// nicht passiv, damit Runterwischen die Liste nicht mitscrollt
	view.addEventListener('touchmove', move, { passive: false });
	view.addEventListener('touchend', end);
	view.addEventListener('touchcancel', end);
	return {
		update(n: SwipeCloseOpts) {
			o = n;
		},
		destroy() {
			view.removeEventListener('touchstart', start);
			view.removeEventListener('touchmove', move);
			view.removeEventListener('touchend', end);
			view.removeEventListener('touchcancel', end);
		}
	};
}
