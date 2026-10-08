<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { closePass, openCountry, reduceMotion, ui } from '$lib/app.svelte';
	import { flag } from '$lib/countries';
	import { INK_FILTERS, rankIndex, ranks, stamp, yearOf } from '$lib/passport';
	import { badgeLevels, badges, tierName, type Badge } from '$lib/badges';
	import { loadFacts, type Facts } from '$lib/facts';
	import { scopeTotal } from '$lib/scope';
	import { markSeen, passSeen } from '$lib/passSeen.svelte';
	import { specialLevel, rollSpecials } from '$lib/special.svelte';
	import PassTile from './PassTile.svelte';

	/* Reisepass (Vollbild): Seiten zum Blättern mit je 6 Stempeln in der Reihenfolge „Land Nr. X“, danach „?“-Plätze für
	   Wunschziele. Neue Länder seit dem letzten Öffnen werden beim Öffnen sichtbar gestempelt. */

	const PER_PAGE = 6;
	let body: HTMLDivElement;
	let lastScroll = 0; // Scrollposition beim Verlassen merken

	/* Nach unten ziehen schließt den Pass (nur wenn die Seite ganz oben steht) */
	let root: HTMLElement;
	let pg: { y0: number; x0: number; lt: number; ly: number; vy: number; dy: number; on: boolean | null } | null = null;
	function tStart(e: TouchEvent) {
		if (e.touches.length !== 1 || !ui.passOpen) return (pg = null);
		const t = e.touches[0];
		pg = { y0: t.clientY, x0: t.clientX, lt: e.timeStamp, ly: t.clientY, vy: 0, dy: 0, on: null };
	}
	function tMove(e: TouchEvent) {
		if (!pg) return;
		const t = e.touches[0],
			dy = t.clientY - pg.y0,
			dx = t.clientX - pg.x0;
		if (pg.on === null) {
			if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
			pg.on = dy > 0 && Math.abs(dy) > Math.abs(dx) && body.scrollTop <= 0;
			if (pg.on) { pg.ly = t.clientY; pg.lt = e.timeStamp; }
		}
		if (!pg.on) return;
		e.preventDefault();
		const dt = e.timeStamp - pg.lt;
		if (dt >= 12) {
			pg.vy = 0.6 * ((t.clientY - pg.ly) / dt) + 0.4 * pg.vy;
			pg.ly = t.clientY;
			pg.lt = e.timeStamp;
		}
		pg.dy = Math.max(0, dy);
		root.style.transition = 'none';
		root.style.transform = `translateY(${pg.dy}px)`;
	}
	function tEnd() {
		if (!pg) return;
		const d = pg;
		pg = null;
		if (!d.on) return;
		if (d.dy > 140 || (d.vy > 0.6 && d.dy > 40)) {
			root.style.transition = 'transform .18s cubic-bezier(.4,0,1,1)';
			root.style.transform = 'translateY(100%)';
			setTimeout(() => {
				closePass(false);
				root.style.transition = '';
				root.style.transform = '';
			}, 180);
		} else {
			root.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)';
			root.style.transform = '';
		}
	}
	$effect(() => {
		root.addEventListener('touchstart', tStart, { passive: true });
		root.addEventListener('touchmove', tMove, { passive: false });
		root.addEventListener('touchend', tEnd);
		root.addEventListener('touchcancel', tEnd);
		return () => {
			root.removeEventListener('touchstart', tStart);
			root.removeEventListener('touchmove', tMove);
			root.removeEventListener('touchend', tEnd);
			root.removeEventListener('touchcancel', tEnd);
		};
	});

	const withLevel = (code: string, nr: number, entered?: string) => {
		const sp = specialLevel(code);
		return { s: stamp(code, nr, entered, sp), sp };
	};
	const stamps = $derived(countedCountries().map((c, i) => ({ code: c.code, name: c.name, nr: i + 1, entered: c.entered, ...withLevel(c.code, i + 1, c.entered) })));
	const wishes = $derived(atlas.data.wishlist.slice(0, 4));
	const pages = $derived.by(() => {
		const slots: ({ kind: 'stamp'; st: (typeof stamps)[number] } | { kind: 'wish'; code: string; name: string })[] = [
			...stamps.map((st) => ({ kind: 'stamp' as const, st })),
			...wishes.map((w) => ({ kind: 'wish' as const, code: w.code, name: w.name }))
		];
		const out: { slots: typeof slots; years: string }[] = [];
		for (let i = 0; i < slots.length; i += PER_PAGE) {
			const part = slots.slice(i, i + PER_PAGE);
			const ys = part.flatMap((x) => (x.kind === 'stamp' && x.st.entered ? [yearOf(x.st.entered)] : []));
			const lo = Math.min(...ys),
				hi = Math.max(...ys);
			out.push({ slots: part, years: ys.length ? (lo === hi ? String(lo) : `${lo} – ${hi}`) : '' });
		}
		return out;
	});
	const total = $derived(scopeTotal(atlas.settings.countryScope));
	const allRanks = $derived(ranks(total));
	const ri = $derived(rankIndex(stamps.length, total));

	/* ---------- Blättern ----------
	   Flüssig auf jedem Gerät: Die Nachbarseiten liegen schon fertig gezeichnet (eigene Grafik-Ebene) unter der aktuellen
	   Seite. Während der Bewegung ändern sich nur transform/opacity – nichts wird neu gezeichnet oder neu gesetzt. */
	let book = $state.raw<HTMLDivElement>(undefined as unknown as HTMLDivElement);
	let strip = $state.raw<HTMLDivElement>(undefined as unknown as HTMLDivElement);
	let cur = $state(0);
	let shown = $state(0); // Seitenzahl in der Leiste: springt schon beim Umblättern um, nicht erst wenn die Seite liegt
	let near = $state<number[]>([0, 1]); // vorbereitete Seiten (aktuelle ± 1), wird nach dem Blättern im Leerlauf nachgezogen
	$effect(() => {
		const c = cur;
		const id = setTimeout(() => (near = [c - 1, c, c + 1]), 180);
		return () => clearTimeout(id);
	});
	// laufendes Umblättern: from → to, p = 0 (Start) … 1 (umgeblättert), v = Tempo in p/ms
	type Turn = { from: number; to: number; p: number; v: number; goal: 0 | 1; w: number; top?: HTMLElement; under?: HTMLElement; sTop?: HTMLElement; sUnder?: HTMLElement };
	let turn: Turn | null = null;
	let raf = 0,
		last = 0;

	// einmal zu Beginn: Ebenen festlegen, Maße lesen – danach im Takt nur noch transform/opacity
	function begin(t: Turn) {
		const kids = book.children;
		t.w = book.clientWidth + 24; // Weg, bis die Seite ganz draußen ist
		if (t.from === t.to) {
			t.top = kids[t.from] as HTMLElement;
			return;
		}
		const fwd = t.to > t.from;
		t.top = kids[fwd ? t.from : t.to] as HTMLElement; // die Seite, die gleitet
		t.under = kids[fwd ? t.to : t.from] as HTMLElement; // die Seite darunter
		t.top.style.cssText = 'display:block;z-index:3';
		t.under.style.cssText = 'display:block;z-index:2';
		t.top.dataset.r = 'turn';
		t.under.dataset.r = 'under';
		t.sTop = t.top.lastElementChild as HTMLElement;
		t.sUnder = t.under.lastElementChild as HTMLElement;
		if (!fwd) t.top.style.transform = `perspective(1400px) translate3d(${-t.w}px,0,0) rotateY(-32deg)`; // startet draußen
	}
	function paint() {
		const t = turn;
		if (!t?.top) return;
		if (t.from === t.to) { // erste/letzte Seite: gummiartig, federt zurück
			t.top.style.transform = `translate3d(${t.p * t.w}px,0,0)`;
			return;
		}
		const q = Math.min(1, Math.max(-0.04, t.to > t.from ? t.p : 1 - t.p)), // 0 = liegt, 1 = links draußen
			qc = Math.max(0, q);
		t.top.style.transform = `perspective(1400px) translate3d(${-q * t.w}px,0,0) rotateY(${-q * 32}deg)`;
		t.under!.style.transform = `scale(${0.94 + 0.06 * qc})`;
		t.sTop!.style.opacity = String(qc * 0.7);
		t.sUnder!.style.opacity = String((1 - qc) * 0.55);
	}
	function clearTurn(t: Turn) {
		for (const el of [t.top, t.under]) {
			if (!el) continue;
			el.style.cssText = '';
			delete el.dataset.r;
			(el.lastElementChild as HTMLElement).style.opacity = '';
		}
	}
	// straffe Feder: ~200 ms, nimmt den Schwung vom Finger mit; zurück mit kleinem Nachfedern
	function step(now: number) {
		raf = 0;
		const t = turn;
		if (!t) return;
		const dt = Math.min(34, Math.max(1, now - last));
		last = now;
		const w = 0.032, z = t.goal ? 1 : 0.78;
		for (let s = 0; s < dt; s += 4) {
			const h = Math.min(4, dt - s);
			t.v += (w * w * (t.goal - t.p) - 2 * z * w * t.v) * h;
			t.p += t.v * h;
		}
		if (t.goal && t.p >= 0.985) return done(true);
		if (!t.goal && Math.abs(t.p) < 0.003 && Math.abs(t.v) < 0.0001) return done(false);
		paint();
		raf = requestAnimationFrame(step);
	}
	function run(goal: 0 | 1) {
		if (!turn) return;
		turn.goal = goal;
		shown = goal ? turn.to : turn.from;
		cancelAnimationFrame(raf);
		last = performance.now();
		raf = requestAnimationFrame(step);
	}
	function done(ok: boolean) {
		const t = turn!;
		turn = null;
		if (ok) {
			cur = shown = t.to;
			navigator.vibrate?.(6);
		}
		// Ebenen erst lösen, wenn Svelte die neue aktuelle Seite markiert hat (sonst blitzt die alte kurz auf)
		tick().then(() => clearTurn(t));
	}
	function stopTurn() {
		cancelAnimationFrame(raf);
		raf = 0;
		if (!turn) return;
		const t = turn;
		turn = null;
		clearTurn(t);
		cur = shown = t.goal ? t.to : t.from;
	}
	function goPage(i: number) {
		i = Math.max(0, Math.min(pages.length - 1, i));
		stopTurn();
		if (i === cur) return;
		if (reduceMotion() || !book) return void (cur = shown = i);
		const t: Turn = { from: cur, to: i, p: 0, v: 0.005, goal: 1, w: 0 };
		turn = t;
		begin(t);
		paint();
		// weiter entfernte Seite war noch nicht gezeichnet: erst einen Frame zeichnen lassen, dann losfedern
		if (!near.includes(i)) requestAnimationFrame(() => turn === t && run(1));
		else run(1);
	}

	/* Wischen (Finger + Maus): Richtung nach wenigen Pixeln festlegen, waagerecht = blättern, senkrecht = Seite scrollt */
	let drag: { x0: number; y0: number; on: boolean | null; lx: number; lt: number; vx: number } | null = null;
	let swallowClick = false;
	const pOf = (t: Turn, dx: number) =>
		t.from === t.to ? Math.max(-0.12, Math.min(0.12, (dx * 0.3) / t.w)) : Math.max(-0.04, Math.min(1, (t.to > t.from ? -dx : dx) / t.w));
	const dxOf = (t: Turn) => (t.from === t.to ? (t.p * t.w) / 0.3 : (t.to > t.from ? -t.p : t.p) * t.w);
	function gStart(x: number, y: number, ts: number) {
		if (pages.length < 2) return;
		if (turn) { cancelAnimationFrame(raf); raf = 0; } // laufende Seite auffangen
		drag = { x0: x, y0: y, on: null, lx: x, lt: ts, vx: 0 };
		swallowClick = false;
	}
	/** true = Geste gehört dem Blättern (Scrollen verhindern) */
	function gMove(x: number, y: number, ts: number) {
		const d = drag;
		if (!d) return false;
		if (d.on === null) {
			const dx = x - d.x0, dy = y - d.y0;
			if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return false;
			d.on = Math.abs(dx) > Math.abs(dy) * 0.8;
			if (!d.on) { drag = null; if (turn) run(turn.goal); return false; }
			swallowClick = true;
			book.classList.add('drag');
			if (!turn) {
				turn = { from: cur, to: Math.max(0, Math.min(pages.length - 1, cur + (dx < 0 ? 1 : -1))), p: 0, v: 0, goal: 0, w: 0 };
				begin(turn);
			} else d.x0 = x - dxOf(turn); // aufgefangene Seite springt nicht
			d.lx = x;
			d.lt = ts;
		}
		const t = turn;
		if (!t) return true;
		const dt = ts - d.lt;
		if (dt > 0) {
			const v = (x - d.lx) / dt;
			d.vx = dt > 40 ? v : 0.65 * v + 0.35 * d.vx;
			d.lx = x;
			d.lt = ts;
		}
		t.p = pOf(t, x - d.x0);
		const sh = t.from !== t.to && t.p > 0.5 ? t.to : t.from;
		if (sh !== shown) shown = sh;
		if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(); });
		return true;
	}
	function gEnd(ok: boolean, ts: number) {
		const d = drag;
		drag = null;
		book?.classList.remove('drag');
		const t = turn;
		if (!d || !t) return;
		if (!d.on) return run(t.goal);
		cancelAnimationFrame(raf);
		const fwd = t.to > t.from,
			vx = ts - d.lt > 80 ? 0 : d.vx, // Finger stand zuletzt still: kein Schwung
			vDir = fwd ? -vx : vx; // px/ms in Blätterrichtung
		t.v = Math.max(-0.012, Math.min(0.012, vDir / t.w));
		const go = ok && t.from !== t.to && (vDir > 0.25 || (vDir > -0.25 && t.p > 0.35));
		run(go ? 1 : 0);
	}
	$effect(() => {
		const b = book;
		if (!b) return;
		const ts = (e: TouchEvent) => (e.touches.length === 1 ? gStart(e.touches[0].clientX, e.touches[0].clientY, e.timeStamp) : drag && gEnd(false, e.timeStamp));
		const tm = (e: TouchEvent) => { if (e.touches.length === 1 && gMove(e.touches[0].clientX, e.touches[0].clientY, e.timeStamp)) e.preventDefault(); };
		const te = (e: TouchEvent) => gEnd(e.type === 'touchend', e.timeStamp);
		b.addEventListener('touchstart', ts, { passive: true });
		b.addEventListener('touchmove', tm, { passive: false });
		b.addEventListener('touchend', te);
		b.addEventListener('touchcancel', te);
		return () => {
			b.removeEventListener('touchstart', ts);
			b.removeEventListener('touchmove', tm);
			b.removeEventListener('touchend', te);
			b.removeEventListener('touchcancel', te);
		};
	});
	// Maus (Rechner): gleiche Geste über Pointer-Events
	function pDown(e: PointerEvent) {
		if (e.pointerType !== 'mouse' || e.button !== 0) return;
		gStart(e.clientX, e.clientY, e.timeStamp);
		try { book.setPointerCapture(e.pointerId); } catch { /* egal */ }
	}
	function pMove(e: PointerEvent) {
		if (e.pointerType === 'mouse' && drag) gMove(e.clientX, e.clientY, e.timeStamp);
	}
	function pUp(e: PointerEvent) {
		if (e.pointerType === 'mouse' && drag) gEnd(e.type === 'pointerup', e.timeStamp);
	}
	function onClickCapture(e: MouseEvent) {
		if (swallowClick) { e.stopPropagation(); e.preventDefault(); swallowClick = false; }
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') goPage(cur + 1);
		else if (e.key === 'ArrowLeft') goPage(cur - 1);
	}
	/* Schnellwahl: Seitenleiste gedrückt halten → wird zum Schieberegler, Finger ziehen wählt die Seite, Loslassen blättert hin.
	   Während des Ziehens wird nur die kleine Vorschau (Nummer, Jahre, Flaggen) erneuert – die Seiten selbst erst beim Loslassen. */
	const PAD = 26; // Rand des Reglers links/rechts (px)
	let scrub = $state<{ i: number; x: number; w: number } | null>(null);
	let hold: { x: number; y: number; id: ReturnType<typeof setTimeout> } | null = null;
	let swallowStrip = false;
	function scrubAt(x: number) {
		const r = strip.getBoundingClientRect(),
			f = Math.max(0, Math.min(1, (x - r.left - PAD) / (r.width - 2 * PAD))),
			i = Math.round(f * (pages.length - 1));
		if (scrub && i !== scrub.i) navigator.vibrate?.(4);
		scrub = { i, x: PAD + f * (r.width - 2 * PAD), w: r.width };
	}
	function sDown(x: number, y: number) {
		if (pages.length < 3) return;
		sCancel();
		swallowStrip = false;
		hold = { x, y, id: setTimeout(() => { hold = null; swallowStrip = true; navigator.vibrate?.(10); scrubAt(x); }, 280) };
	}
	/** true = Regler aktiv (Scrollen der Leiste verhindern) */
	function sMove(x: number, y: number) {
		if (scrub) {
			scrubAt(x);
			return true;
		}
		if (hold && Math.hypot(x - hold.x, y - hold.y) > 8) sCancel(); // bewegt statt gehalten: normales Scrollen der Leiste
		return false;
	}
	function sUp(ok: boolean) {
		sCancel();
		const s = scrub;
		scrub = null;
		if (s && ok) goPage(s.i);
	}
	function sCancel() {
		if (hold) clearTimeout(hold.id);
		hold = null;
	}
	$effect(() => {
		const s = strip;
		if (!s) return;
		const ts = (e: TouchEvent) => (e.touches.length === 1 ? sDown(e.touches[0].clientX, e.touches[0].clientY) : sUp(false));
		const tm = (e: TouchEvent) => { if (e.touches.length === 1 && sMove(e.touches[0].clientX, e.touches[0].clientY)) e.preventDefault(); };
		const te = (e: TouchEvent) => sUp(e.type === 'touchend');
		s.addEventListener('touchstart', ts, { passive: true });
		s.addEventListener('touchmove', tm, { passive: false });
		s.addEventListener('touchend', te);
		s.addEventListener('touchcancel', te);
		return () => {
			sCancel();
			s.removeEventListener('touchstart', ts);
			s.removeEventListener('touchmove', tm);
			s.removeEventListener('touchend', te);
			s.removeEventListener('touchcancel', te);
		};
	});
	// Maus (Rechner): gedrückt halten und ziehen
	function spDown(e: PointerEvent) {
		if (e.pointerType !== 'mouse' || e.button !== 0) return;
		sDown(e.clientX, e.clientY);
		try { strip.setPointerCapture(e.pointerId); } catch { /* egal */ }
	}
	const spMove = (e: PointerEvent) => e.pointerType === 'mouse' && sMove(e.clientX, e.clientY);
	const spUp = (e: PointerEvent) => e.pointerType === 'mouse' && sUp(e.type === 'pointerup');
	function onStripClick(e: MouseEvent) {
		if (swallowStrip) { e.stopPropagation(); e.preventDefault(); swallowStrip = false; }
	}
	const preview = $derived(
		scrub ? { ...pages[scrub.i], flags: pages[scrub.i].slots.map((s) => (s.kind === 'stamp' ? flag(s.st.code) : '?')).join(' ') } : null
	);

	// aktive Seitenzahl in der Leiste mittig halten
	$effect(() => {
		const i = shown;
		const el = strip?.children[i + 1] as HTMLElement | undefined; // [0] = Zurück-Pfeil
		if (el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'auto' });
	});

	/* ---------- Abzeichen (Leiste unter der Seite) ---------- */
	let facts = $state.raw<Record<string, Facts> | null>(null);
	$effect(() => {
		if (ui.passOpen && !facts) loadFacts().then((f) => (facts = f));
	});
	const bs = $derived(
		facts ? badges({ codes: stamps.map((s) => s.code), facts, entered: Object.fromEntries(stamps.map((s) => [s.code, s.entered])) }, atlas.settings.countryScope) : []
	);
	let picked = $state<string | null>(null);
	const pick = $derived(bs.find((b) => b.id === picked) ?? null);
	// Stufen-Klasse t1–t3 (Bronze/Silber/Gold) zu Stufe 1..n des Abzeichens
	const tc = (b: Badge, level: number) => (level > 0 && level <= b.tiers.length ? 't' + (level + 3 - b.tiers.length) : '');
	const tierClass = (b: Badge) => tc(b, b.level);
	/* Details als Blatt von unten; erneutes Antippen oder Runterziehen schließt */
	let sheet = $state<HTMLDivElement>();
	let sheetH = $state(0);
	let sOff = 0; // aktuelle Zieh-Verschiebung (für das Wegschieben ab dieser Stelle)
	async function choose(id: string | null) {
		sOff = 0;
		picked = id;
		if (!id) return;
		await tick();
		if (!sheet) return;
		sheetH = sheet.offsetHeight; // Platz unten sofort freihalten
		await tick();
		// angetipptes Abzeichen nicht vom Blatt verdecken lassen
		const btn = body?.querySelector<HTMLElement>(`[data-badge="${id}"]`);
		if (!btn || !sheet) return;
		const over = btn.getBoundingClientRect().bottom + 12 - (window.innerHeight - sheet.offsetHeight);
		if (over > 0) body.scrollBy({ top: over, behavior: reduceMotion() ? 'auto' : 'smooth' });
	}
	function slideUp(node: HTMLElement) {
		const h = node.offsetHeight + 24,
			o = sOff;
		return { duration: reduceMotion() ? 0 : o ? 160 : 240, css: (t: number) => `transform:translateY(${o + (1 - t) * (h - o)}px)`, easing: (t: number) => 1 - (1 - t) ** 3 };
	}
	$effect(() => {
		const el = sheet;
		if (!el) return;
		let d: { y0: number; ly: number; lt: number; vy: number; dy: number } | null = null;
		const ts = (e: TouchEvent) => {
			e.stopPropagation();
			if (e.touches.length !== 1) return (d = null);
			const y = e.touches[0].clientY;
			d = { y0: y, ly: y, lt: e.timeStamp, vy: 0, dy: 0 };
		};
		const tm = (e: TouchEvent) => {
			e.stopPropagation();
			if (!d) return;
			e.preventDefault();
			const y = e.touches[0].clientY,
				dt = e.timeStamp - d.lt;
			if (dt >= 12) {
				d.vy = 0.6 * ((y - d.ly) / dt) + 0.4 * d.vy;
				d.ly = y;
				d.lt = e.timeStamp;
			}
			d.dy = Math.max(0, y - d.y0);
			el.style.transition = 'none';
			el.style.transform = `translateY(${d.dy}px)`;
		};
		const te = (e: TouchEvent) => {
			e.stopPropagation();
			if (!d) return;
			const { dy, vy } = d;
			d = null;
			if (dy > 70 || (vy > 0.5 && dy > 20)) {
				sOff = dy;
				picked = null;
			} else {
				el.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)';
				el.style.transform = '';
			}
		};
		el.addEventListener('touchstart', ts, { passive: true });
		el.addEventListener('touchmove', tm, { passive: false });
		el.addEventListener('touchend', te);
		el.addEventListener('touchcancel', te);
		return () => {
			el.removeEventListener('touchstart', ts);
			el.removeEventListener('touchmove', tm);
			el.removeEventListener('touchend', te);
			el.removeEventListener('touchcancel', te);
		};
	});

	/* ---------- Stempel-Animation beim Öffnen ---------- */
	// Stempel, die gerade noch auf ihren Auftritt warten (unsichtbar)
	let pending = $state<string[]>([]);
	let opened = false;
	$effect(() => {
		if (!ui.passOpen) {
			opened = false;
			picked = null;
			return;
		}
		if (opened) return;
		opened = true;
		untrack(() => {
			const codes = stamps.map((s) => s.code);
			rollSpecials(codes);
			const seen = passSeen.codes;
			const fresh = seen ? codes.filter((c) => !seen.includes(c)).slice(-3) : [];
			markSeen(codes);
			body?.scrollTo(0, 0);
			stopTurn();
			cur = shown = 0;
			if (!fresh.length || reduceMotion()) return;
			pending = fresh;
			play(fresh);
		});
	});

	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
	const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

	async function play(codes: string[]) {
		await tick();
		await wait(350); // Ansicht gleitet erst herein
		for (const code of codes) {
			const slot = body?.querySelector<HTMLElement>(`[data-stamp="${code}"]`);
			if (!slot || !ui.passOpen) break;
			const pi = Math.floor(stamps.findIndex((s) => s.code === code) / PER_PAGE);
			if (pi !== cur) { goPage(pi); await wait(350); }
			slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
			await wait(500);
			const sp = specialLevel(code);
			pending = pending.filter((c) => c !== code);
			await tick();
			const el = slot.querySelector<HTMLElement>('.pp-stamp');
			if (!el) continue;
			if (sp) {
				await tearOff(slot, el, sp > 1);
				await wait(900);
				continue;
			}
			// Stempel fällt mit Schwung herunter, quetscht und federt nach
			await el.animate(
				[
					{ transform: 'translateY(-180px) scale(2.2) rotate(-22deg)', opacity: 0 },
					{ transform: 'translateY(-30px) scale(1.4) rotate(-6deg)', opacity: 0.6, offset: 0.6 },
					{ transform: 'translateY(0) scale(.86,.8) rotate(0)', opacity: 1 }
				],
				{ duration: 420, easing: 'cubic-bezier(.6,0,.9,.5)' }
			).finished;
			el.animate([{ transform: 'scale(.86,.8)' }, { transform: 'scale(1.08,1.05)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
			slot.closest('.pp-page')?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(-1px)' }, { transform: 'translateY(0)' }], { duration: 260 });
			navigator.vibrate?.(20);
			burst(slot);
			await wait(700);
		}
		pending = [];
	}

	/** Seltene Briefmarke: hängt mit der Nachbarmarke am Bogen über dem Feld, wird abgerissen und klebt sich fest */
	async function tearOff(slot: HTMLElement, el: HTMLElement, legend: boolean) {
		const r = el.getBoundingClientRect(),
			col = getComputedStyle(slot).getPropertyValue('--c') || css('--primary'),
			up = 'translate(0,-56px) scale(1.12)',
			k = r.right + r.width > innerWidth ? -1 : 1; // Nachbarmarke rechts, in der rechten Spalte links
		// Nachbarmarke (Kopie) daneben – bleibt nach dem Abreißen am Bogen und verschwindet
		const twin = document.createElement('div');
		twin.className = 'pp-fx';
		Object.assign(twin.style, { left: (k > 0 ? r.right - 1 : r.left - r.width + 1) + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', color: col, transformOrigin: k > 0 ? '0 50%' : '100% 50%' });
		twin.innerHTML = el.outerHTML;
		(twin.firstElementChild as HTMLElement).style.cssText = 'width:100%;height:100%';
		document.body.appendChild(twin);
		el.style.transformOrigin = k > 0 ? '100% 50%' : '0 50%';
		const D = 1900,
			o = { duration: D, easing: 'ease-in-out', fill: 'backwards' } as const;
		twin.animate(
			[
				{ transform: up, opacity: 0 },
				{ transform: up, opacity: 1, offset: 0.12 },
				{ transform: `translate(${3 * k}px,-56px) scale(1.12)`, offset: 0.3 },
				{ transform: up, offset: 0.36 },
				{ transform: `translate(${4 * k}px,-56px) scale(1.12)`, offset: 0.46 },
				{ transform: `translate(${16 * k}px,-56px) scale(1.12) rotate(${4 * k}deg)`, opacity: 1, offset: 0.52 },
				{ transform: `translate(${70 * k}px,-34px) scale(1.04) rotate(${12 * k}deg)`, opacity: 0, offset: 0.76 },
				{ transform: `translate(${70 * k}px,-34px) scale(1.04) rotate(${12 * k}deg)`, opacity: 0 }
			],
			o
		).finished.then(() => twin.remove());
		navigator.vibrate?.(15);
		setTimeout(() => {
			// Abreißen: kleine Papierfasern an der Zähnung
			navigator.vibrate?.([10, 30, 10]);
			for (let i = 0; i < 7; i++) {
				const e = document.createElement('i'),
					sz = 3 + Math.random() * 4;
				e.className = 'pp-fx';
				Object.assign(e.style, { left: (k > 0 ? r.right : r.left) + 'px', top: r.top - 56 + r.height * (0.15 + Math.random() * 0.7) + 'px', width: sz + 'px', height: sz + 'px', background: css('--stp') || '#fff', border: '1px solid ' + css('--line'), borderRadius: '1px' });
				document.body.appendChild(e);
				e.animate(
					[
						{ transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 },
						{ transform: `translate(${k * (10 + Math.random() * 30)}px,${30 + Math.random() * 50}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
					],
					{ duration: 700 + Math.random() * 400, easing: 'ease-in' }
				).finished.then(() => e.remove());
			}
		}, D * 0.5);
		await el.animate(
			[
				{ transform: up, opacity: 0 },
				{ transform: up, opacity: 1, offset: 0.12 },
				{ transform: `translate(${-3 * k}px,-56px) scale(1.12)`, offset: 0.3 },
				{ transform: up, offset: 0.36 },
				{ transform: `translate(${-4 * k}px,-56px) scale(1.12)`, offset: 0.46 },
				{ transform: `translate(${-12 * k}px,-64px) scale(1.12) rotate(${-7 * k}deg)`, offset: 0.54 },
				{ transform: 'translate(0,3px) scale(.96) rotate(0)', offset: 0.84 },
				{ transform: 'translate(0,0) scale(1.02)', offset: 0.92 },
				{ transform: 'none' }
			],
			o
		).finished;
		el.style.transformOrigin = '';
		slot.closest('.pp-page')?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(3px)' }, { transform: 'translateY(0)' }], { duration: 220 });
		navigator.vibrate?.(30);
		const p = document.createElement('div');
		p.className = 'pp-fx pp-plus';
		p.textContent = legend ? 'Legende!' : 'Seltene Marke';
		Object.assign(p.style, { left: r.left + r.width / 2 + 'px', top: r.top + 6 + 'px', color: col });
		document.body.appendChild(p);
		p.animate([{ transform: 'translate(-50%,0)', opacity: 0 }, { transform: 'translate(-50%,-18px)', opacity: 1, offset: 0.3 }, { transform: 'translate(-50%,-34px)', opacity: 0 }], { duration: 1600, easing: 'ease-out' }).finished.then(() => p.remove());
	}

	/** Tintenspritzer, Konfetti und „+1 Stempel“ über dem Stempel */
	function burst(slot: HTMLElement) {
		const r = slot.getBoundingClientRect(),
			cx = r.left + r.width / 2,
			cy = r.top + r.height / 2;
		const ink = css('--primary'),
			cols = [css('--sun'), css('--primary'), css('--st-coral'), css('--st-teal'), css('--sun')];
		for (let i = 0; i < 26; i++) {
			const e = document.createElement('i'),
				sz = 5 + Math.random() * 5,
				splash = i < 8;
			e.className = 'pp-fx';
			Object.assign(e.style, {
				left: cx + 'px',
				top: cy + 'px',
				width: sz + 'px',
				height: (splash ? sz : sz * 1.6) + 'px',
				background: splash ? ink : cols[i % 5],
				borderRadius: splash ? '50%' : '2px'
			});
			document.body.appendChild(e);
			const a = Math.random() * Math.PI * 2,
				d = (splash ? 70 : 90) + Math.random() * 90;
			e.animate(
				[
					{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
					{ transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.8 - 30}px) rotate(${Math.random() * 600 - 300}deg)`, opacity: 1, offset: 0.7 },
					{ transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.8 + 20}px)`, opacity: 0 }
				],
				{ duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }
			).finished.then(() => e.remove());
		}
		const p = document.createElement('div');
		p.className = 'pp-fx pp-plus';
		p.textContent = '+1 Stempel';
		Object.assign(p.style, { left: cx + 'px', top: r.top + 10 + 'px' });
		document.body.appendChild(p);
		p.animate(
			[
				{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 },
				{ transform: 'translate(-50%,-26px) scale(1.1)', opacity: 1, offset: 0.3 },
				{ transform: 'translate(-50%,-60px)', opacity: 0 }
			],
			{ duration: 1300, easing: 'ease-out' }
		).finished.then(() => p.remove());
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov pp-view" id="passView" bind:this={root} role="dialog" aria-modal="true" aria-labelledby="passTitle" hidden={!ui.passOpen}>
	<svg class="pp-defs" aria-hidden="true" focusable="false"><defs>{@html INK_FILTERS}</defs></svg>
	<div class="ov-head">
		<button type="button" class="ov-close" id="passClose" aria-label="Reisepass schließen" onclick={() => closePass(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="passTitle">Reisepass</h1>
	</div>
	<div class="ov-body" bind:this={body} style:padding-bottom={pick ? sheetH + 16 + 'px' : null} onscroll={() => { if (ui.passOpen) lastScroll = body.scrollTop; }}>
		{#if ui.passOpen}
			<div style="margin-top:20px"><PassTile inPass /></div>
			<ol class="pp-ranks" aria-label="Ränge">
				{#each allRanks as r, i (r.n)}
					<li class:on={i <= ri} class:cur={i === ri}><span aria-hidden="true">{r.icon}</span><b>{r.name}</b><small>{r.n}</small></li>
				{/each}
			</ol>
			{#if ri >= 0}<p class="pp-say">„{allRanks[ri].say}“</p>{/if}

			{#if !stamps.length}
				<p class="empty">Noch keine Stempel. Für jedes bereiste Land kommt hier ein Stempel in deinen Pass.</p>
			{/if}
			{#if pages.length}
				<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
				<div
					class="pp-book"
					bind:this={book}
					role="region"
					aria-label="Stempelseiten, wischen zum Blättern"
					tabindex="0"
					onpointerdown={pDown}
					onpointermove={pMove}
					onpointerup={pUp}
					onpointercancel={pUp}
					onclickcapture={onClickCapture}
					onkeydown={onKey}
				>
					{#each pages as pg, pi (pi)}
						<div class="pp-page" class:on={pi === cur} class:nb={pi !== cur && near.includes(pi)} aria-hidden={pi !== cur} inert={pi !== cur} aria-label="Seite {pi + 1} von {pages.length}">
							<div class="pp-page-h"><span>Stempel · Seite {pi + 1}</span><span>{pg.years}</span></div>
							<div class="pp-grid">
								{#each pg.slots as sl (sl.kind + (sl.kind === 'stamp' ? sl.st.code : sl.code))}
									{#if sl.kind === 'stamp'}
										<button
											type="button"
											class="pp-slot"
											data-stamp={sl.st.code}
											class:wait={pending.includes(sl.st.code)}
											class:sp={sl.st.sp > 0}
											style="transform:translateY({sl.st.s.dy}px) rotate({sl.st.s.rot}deg);--c:{sl.st.s.color};--w:{sl.st.s.w}%"
											aria-label="{sl.st.name}, Land Nr. {sl.st.nr}{sl.st.sp > 1 ? ', Legenden-Briefmarke' : sl.st.sp ? ', seltene Briefmarke' : ''}"
											onclick={() => openCountry(sl.st.code)}>{@html sl.st.s.svg}</button
										>
									{:else}
										<button type="button" class="pp-slot" aria-label="Wunschziel {sl.name}" onclick={() => openCountry(sl.code)}
											><span class="pp-empty"><b>?</b>Wunschziel<br />{flag(sl.code)} {sl.name}</span></button
										>
									{/if}
								{/each}
							</div>
							<i class="pp-shade" aria-hidden="true"></i>
						</div>
					{/each}
				</div>
				{#if pages.length > 1}
					<div class="pp-nav">
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="pp-strip"
							bind:this={strip}
							role="group"
							aria-label="Seite wählen – gedrückt halten und ziehen zum schnellen Blättern"
							onpointerdown={spDown}
							onpointermove={spMove}
							onpointerup={spUp}
							onpointercancel={spUp}
							onclickcapture={onStripClick}
							oncontextmenu={(e) => e.preventDefault()}
						>
							<button type="button" class="pp-arrow" aria-label="Vorherige Seite" disabled={cur <= 0} onclick={() => goPage(cur - 1)}>‹</button>
							{#each pages as _, pi (pi)}
								<button type="button" class:on={pi === shown} aria-label="Seite {pi + 1}" aria-current={pi === shown ? 'page' : undefined} onclick={() => goPage(pi)}>{pi + 1}</button>
							{/each}
							<button type="button" class="pp-arrow" aria-label="Nächste Seite" disabled={cur >= pages.length - 1} onclick={() => goPage(cur + 1)}>›</button>
						</div>
						{#if scrub && preview}
							<div class="pp-scrub" aria-hidden="true">
								<i class="pp-track"></i>
								<b class="pp-knob" style="left:{scrub.x}px">{scrub.i + 1}</b>
								<div class="pp-bubble" style="left:{Math.max(90, Math.min(scrub.w - 90, scrub.x))}px">
									<b>Seite {scrub.i + 1} <small>von {pages.length}</small></b>
									{#if preview.years}<span>{preview.years}</span>{/if}
									<span class="pp-flags">{preview.flags}</span>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			{/if}
			{#if bs.length}
				<div class="pp-visa">
					<div class="pp-page-h"><span>Abzeichen</span><span>{badgeLevels(bs)} / {bs.reduce((s, b) => s + b.tiers.length, 0)}</span></div>
					<div class="pp-badges">
						{#each bs as b (b.id)}
							{@const max = b.level >= b.tiers.length}
							<button
								type="button"
								class="pp-badge {tierClass(b)}"
								class:max
								class:sel={picked === b.id}
								data-badge={b.id}
								aria-pressed={picked === b.id}
								onclick={() => choose(picked === b.id ? null : b.id)}
							>
								<span class="pp-medal {max ? '' : 'n' + tc(b, b.level + 1)}" style="--p:{max ? 1 : b.p}" aria-hidden="true"><span><i>{b.icon}</i></span></span>
								<b>{b.name}</b>
								<span class="pp-pips" aria-hidden="true">{#each b.tiers as t, i (t)}<i class="{tc(b, i + 1)}" class:on={b.level > i}></i>{/each}</span>
								<small>{max ? tierName(b, b.level) + ' ✓' : b.prog}</small>
							</button>
						{/each}
					</div>
				</div>
			{/if}
			{#if stamps.length}
				<p class="note">Stempel antippen öffnet das Land. Dort kannst du auch das Datum der ersten Einreise eintragen – es erscheint dann auf dem Stempel.</p>
			{/if}
		{/if}
	</div>
	{#if pick}
		{@const max = pick.level >= pick.tiers.length}
		<div class="pp-sheet {tierClass(pick)}" class:max bind:this={sheet} bind:offsetHeight={sheetH} transition:slideUp role="status">
			<button type="button" class="pp-grab" aria-label="Details schließen" onclick={() => choose(null)}><i></i></button>
			<div class="pp-sh-top">
				<span class="pp-medal {max ? '' : 'n' + tc(pick, pick.level + 1)}" style="--p:{max ? 1 : pick.p}" aria-hidden="true"><span><i>{pick.icon}</i></span></span>
				<div>
					<b>{pick.name}</b>
					<span>{pick.fmt(pick.v)} {pick.what}</span>
				</div>
			</div>
			{#if !max}
				<div class="pp-next {tc(pick, pick.level + 1)}">
					<div class="pp-next-t"><span>Noch {pick.fmt(pick.tiers[pick.level] - pick.v)} bis <b>{tierName(pick, pick.level + 1)}</b></span><span>{Math.floor(pick.p * 100)} %</span></div>
					<div class="pp-bar"><i style="width:{Math.max(3, pick.p * 100)}%"></i></div>
				</div>
			{:else}
				<p class="pp-done">Höchste Stufe erreicht 🎉</p>
			{/if}
			<span class="pp-tiers"
				>{#each pick.tiers as t, i (t)}<i class:on={pick.level > i} class={tc(pick, i + 1)}>{pick.level > i ? '✓ ' : ''}{tierName(pick, i + 1)}: {pick.fmt(t)}</i>{/each}</span
			>
		</div>
	{/if}
</section>
