<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { atlas, countedCountries, setWonder, visitedSet } from '$lib/atlas.svelte';
	import { closePass, openCountry, reduceMotion, ui } from '$lib/app.svelte';
	import { CONT, flag, nameOf } from '$lib/countries';
	import { INK_FILTERS, loadScenes, rankIndex, ranks, scenesLoaded, stamp, TIER_LABEL, wonderStamp, yearOf } from '$lib/passport';
	import { WONDERS, type Wonder } from '$lib/wonders';
	import { badgeLevels, badges, tierName, type Badge, type DetailItem } from '$lib/badges';
	import { loadFacts, type Facts } from '$lib/facts';
	import { scopeTotal } from '$lib/scope';
	import { markSeen, passSeen } from '$lib/passSeen.svelte';
	import { stickOn } from '$lib/markfx';
	import { CHANCE, specialLevel, rollSpecials, type Tier } from '$lib/special.svelte';
	import PassTile from './PassTile.svelte';

	/* Reisepass (Vollbild): Seiten zum Blättern mit je 6 Stempeln in der Reihenfolge „Land Nr. X“, danach „?“-Plätze für
	   Wunschziele. Neue Länder seit dem letzten Öffnen werden beim Öffnen sichtbar gestempelt (alle; bei vielen schneller,
	   Antippen überspringt). Darunter die Weltwunder-Seite. */

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

	/* Briefmarken-Bilder: im Leerlauf vorladen, spätestens beim Öffnen des Passes */
	let scenesOk = $state(scenesLoaded());
	const getScenes = () => loadScenes().then(() => (scenesOk = true));
	$effect(() => {
		if (scenesOk) return;
		if (ui.passOpen) return void getScenes();
		const id = 'requestIdleCallback' in window ? requestIdleCallback(getScenes, { timeout: 5000 }) : setTimeout(getScenes, 2000);
		return () => ('cancelIdleCallback' in window ? cancelIdleCallback(id as number) : clearTimeout(id as ReturnType<typeof setTimeout>));
	});
	const withLevel = (code: string, nr: number, entered?: string) => {
		const sp = specialLevel(code);
		return { s: stamp(code, nr, entered, sp), sp };
	};
	const stamps = $derived.by(() => {
		void scenesOk; // nach dem Nachladen der Bilder neu berechnen
		return countedCountries().map((c, i) => ({ code: c.code, name: c.name, nr: i + 1, entered: c.entered, ...withLevel(c.code, i + 1, c.entered) }));
	});
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
	/* Seitenwahl: Regler mit Knopf (Seitenzahl). Knopf direkt ziehen oder auf die Leiste tippen; beim Ziehen zeigt eine kleine
	   Vorschau Seite, Jahre und Flaggen – geblättert wird erst beim Loslassen (die Seiten selbst werden währenddessen nicht neu gezeichnet). */
	const KNOB = 40; // Durchmesser des Knopfs (px), so weit bleibt die Leiste links/rechts frei
	let slide = $state<{ i: number; f: number; x0: number; moved: boolean; w: number } | null>(null);
	function dragAt(x: number, d: { x0: number; moved: boolean }) {
		const r = strip.getBoundingClientRect(),
			f = Math.max(0, Math.min(1, (x - r.left - KNOB / 2) / (r.width - KNOB))),
			i = Math.round(f * (pages.length - 1));
		if (slide && i !== slide.i) navigator.vibrate?.(4);
		slide = { ...d, i, f, w: r.width };
	}
	function nDown(e: PointerEvent) {
		if (e.button > 0 || pages.length < 2) return;
		try { strip.setPointerCapture(e.pointerId); } catch { /* egal */ }
		dragAt(e.clientX, { x0: e.clientX, moved: false });
	}
	function nMove(e: PointerEvent) {
		if (!slide) return;
		dragAt(e.clientX, { x0: slide.x0, moved: slide.moved || Math.abs(e.clientX - slide.x0) > 6 });
	}
	function nUp(e: PointerEvent) {
		const d = slide;
		slide = null;
		if (d && e.type === 'pointerup') goPage(d.i);
	}
	const knobF = $derived(slide ? slide.f : pages.length > 1 ? shown / (pages.length - 1) : 0);
	const preview = $derived(
		slide?.moved ? { ...pages[slide.i], flags: pages[slide.i].slots.map((s) => (s.kind === 'stamp' ? flag(s.st.code) : '?')).join(' ') } : null
	);

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
	/* Details als Blatt von unten; erneutes Antippen, Runterwischen (auch aufgeklappt) oder Tippen daneben schließt, Hochwischen klappt die Liste auf
	   (was zählt schon, was fehlt noch) */
	let sheet = $state<HTMLDivElement>();
	let list = $state<HTMLDivElement>();
	let sheetH = $state(0);
	let open = $state(false);
	const det = $derived(open && pick ? pick.detail() : null);
	let sOff = 0; // aktuelle Zieh-Verschiebung (für das Wegschieben ab dieser Stelle)
	async function choose(id: string | null) {
		sOff = 0;
		open = false;
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
	/* Auf-/Zuklappen: Höhe springt, die Verschiebung gleicht das aus und läuft weich auf 0 (ab der Zieh-Position) */
	async function setOpen(v: boolean, from = 0) {
		if (!sheet) return;
		const h0 = sheet.offsetHeight;
		open = v;
		await tick();
		if (!sheet) return;
		if (!v && list) list.scrollTop = 0;
		const h1 = sheet.offsetHeight;
		sheet.style.transition = 'none';
		sheet.style.transform = '';
		if (!reduceMotion()) sheet.animate([{ transform: `translateY(${h1 - h0 + from}px)` }, { transform: 'translateY(0)' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
	}
	function slideUp(node: HTMLElement) {
		const h = node.offsetHeight + 24,
			o = sOff;
		return { duration: reduceMotion() ? 0 : o ? 160 : 240, css: (t: number) => `transform:translateY(${o + (1 - t) * (h - o)}px)`, easing: (t: number) => 1 - (1 - t) ** 3 };
	}
	$effect(() => {
		const el = sheet;
		if (!el) return;
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
			el.style.transition = 'none';
			el.style.transform = `translateY(${shown}px)`;
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
				picked = null;
				open = false;
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
			open = false;
			leaf = null;
			return;
		}
		if (opened || !scenesOk) return;
		opened = true;
		tab = 'st';
		untrack(() => {
			const codes = stamps.map((s) => s.code);
			rollSpecials(codes);
			const seen = passSeen.codes;
			const fresh = seen ? codes.filter((c) => !seen.includes(c)) : [];
			markSeen(codes);
			body?.scrollTo(0, 0);
			stopTurn();
			// Seite mit den neuesten Stempeln aufschlagen (dort kommt auch der nächste hin)
			cur = shown = Math.max(0, Math.floor((stamps.length - 1) / PER_PAGE));
			near = [cur - 1, cur, cur + 1];
			if (!fresh.length || reduceMotion()) return;
			pending = fresh;
			play(fresh);
		});
	});

	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
	const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

	// Antippen während der Animation: restliche Stempel sofort zeigen
	let skip = false;
	const skipPlay = () => {
		if (pending.length) skip = true;
	};
	async function play(codes: string[]) {
		skip = false;
		// viele neue Stempel: schneller hintereinander
		const k = codes.length > 3 ? 0.45 : 1;
		await tick();
		await wait(350); // Ansicht gleitet erst herein
		let first = true;
		for (const code of codes) {
			const slot = body?.querySelector<HTMLElement>(`[data-stamp="${code}"]`);
			if (!slot || !ui.passOpen || skip) break;
			const pi = Math.floor(stamps.findIndex((s) => s.code === code) / PER_PAGE);
			if (pi !== cur) { goPage(pi); await wait(350); }
			if (first || pi !== cur) slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
			first = false;
			await wait(500 * k);
			if (skip) break;
			const sp = specialLevel(code);
			pending = pending.filter((c) => c !== code);
			await tick();
			const el = slot.querySelector<SVGSVGElement>('.pp-stamp');
			if (!el) continue;
			if (sp) {
				await tearOff(slot, el, sp);
				await wait(900 * k);
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
			await wait(700 * k);
		}
		pending = [];
	}

	/* ---------- Weltwunder ---------- */
	const wonders = $derived.by(() => {
		void scenesOk;
		const vis = visitedSet(),
			have = atlas.settings.wonders;
		return WONDERS.map((w, i) => ({ ...w, have: have.includes(w.id), open: vis.has(w.code), s: wonderStamp(w.id, w.name, i) }));
	});
	const wonderCount = $derived(wonders.filter((w) => w.have).length);
	let wonderNew = $state<string | null>(null); // wartet auf das Aufkleben (unsichtbar)
	async function collect(w: Wonder) {
		if (wonderNew) return;
		const anim = !reduceMotion();
		if (anim) wonderNew = w.id;
		setWonder(w.id, true);
		const all = atlas.settings.wonders.length === WONDERS.length;
		if (anim) {
			await tick();
			const slot = body?.querySelector<HTMLElement>(`[data-wonder="${w.id}"]`),
				el = slot?.querySelector<SVGSVGElement>('.pp-stamp');
			wonderNew = null;
			await tick();
			if (slot && el) await tearOff(slot, el, 4, 'WELTWUNDER');
		}
		if (all)
			ui.unlock = { key: ui.unlock.key + 1, cont: '', n: WONDERS.length, rank: '', badge: 'Alle 7 Weltwunder', icon: '🏛️', sub: 'Die neuen 7 Weltwunder komplett gesehen' };
	}
	function drop(w: Wonder) {
		if (confirm(`„${w.name}“ wieder aus dem Pass nehmen?`)) setWonder(w.id, false);
	}

	/** Briefmarke (Rare und höher): je Stufe etwas anders aufgeklebt (markfx.ts) */
	async function tearOff(slot: HTMLElement, el: SVGSVGElement, tier: Tier | 4, label = TIER_LABEL[tier]) {
		const r = el.getBoundingClientRect(),
			col = getComputedStyle(slot).getPropertyValue('--c') || css('--primary');
		navigator.vibrate?.(15);
		await stickOn(el, tier, () => {
			slot.closest('.pp-page')?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(3px)' }, { transform: 'translateY(0)' }], { duration: 220 });
			navigator.vibrate?.(30);
			const p = document.createElement('div');
			p.className = 'pp-fx pp-plus';
			p.textContent = label;
			Object.assign(p.style, { left: r.left + r.width / 2 + 'px', top: r.top + 6 + 'px', color: col });
			document.body.appendChild(p);
			p.animate([{ transform: 'translate(-50%,0)', opacity: 0 }, { transform: 'translate(-50%,-18px)', opacity: 1, offset: 0.3 }, { transform: 'translate(-50%,-34px)', opacity: 0 }], { duration: 1600, easing: 'ease-out' }).finished.then(() => p.remove());
		});
	}

	/* ---------- Legende: Seltenheitsstufen (Blatt von unten, Runterwischen oder Tippen daneben schließt) ---------- */
	const TIER_NAME = ['Common', 'Rare', 'Epic', 'Legendary'];
	const pct = (p: number) => Math.round(p * 100) + ' %';
	let leaf = $state<null | 'legend' | 'ranks' | 'share'>(null);
	let legSheet = $state<HTMLDivElement>();
	let legList = $state<HTMLDivElement>();
	const legRows = $derived(
		leaf === 'legend' && scenesOk
			? [
					{ t: 0, p: pct(1 - CHANCE.rare - CHANCE.epic - CHANCE.legend), d: 'Normaler Stempel – so sieht es bei den meisten Ländern aus.', s: stamp('JP', 12, undefined, 0) },
					{ t: 1, p: pct(CHANCE.rare), d: 'Eingeklebte Briefmarke statt Stempel.', s: stamp('JP', 12, undefined, 1) },
					{ t: 2, p: pct(CHANCE.epic), d: 'Breite Briefmarke mit Silberrand und eigenem Bild.', s: stamp('JP', 12, undefined, 2) },
					{ t: 3, p: pct(CHANCE.legend), d: 'Prachtvolle Briefmarke mit Goldrand – ganz selten.', s: stamp('JP', 12, undefined, 3) }
				]
			: []
	);
	$effect(() => {
		const el = legSheet;
		if (!el) return;
		let d: { x0: number; y0: number; ly: number; lt: number; vy: number; dy: number; mode: 0 | 1 | 2 } | null = null;
		const ts = (e: TouchEvent) => {
			e.stopPropagation();
			if (e.touches.length !== 1) return (d = null);
			const y = e.touches[0].clientY;
			d = { x0: e.touches[0].clientX, y0: y, ly: y, lt: e.timeStamp, vy: 0, dy: 0, mode: 0 };
		};
		const tm = (e: TouchEvent) => {
			e.stopPropagation();
			if (!d) return;
			const y = e.touches[0].clientY,
				raw = y - d.y0;
			// Liste scrollt selbst, solange sie nicht ganz oben steht oder nach oben gewischt wird; waagerecht = Motive wechseln
			if (!d.mode) {
				const dx = Math.abs(e.touches[0].clientX - d.x0);
				if (dx < 6 && Math.abs(raw) < 6) return;
				d.mode = dx > Math.abs(raw) || (legList?.contains(e.target as Node) && (legList.scrollTop > 0 || raw < 0)) ? 2 : 1;
			}
			if (d.mode === 2) return;
			e.preventDefault();
			const dt = e.timeStamp - d.lt;
			if (dt >= 12) {
				d.vy = 0.6 * ((y - d.ly) / dt) + 0.4 * d.vy;
				d.ly = y;
				d.lt = e.timeStamp;
			}
			d.dy = raw;
			el.style.transition = 'none';
			el.style.transform = `translateY(${Math.max(0, raw)}px)`;
		};
		const te = (e: TouchEvent) => {
			e.stopPropagation();
			if (!d) return;
			const { dy, vy, mode } = d;
			d = null;
			if (mode !== 1) return;
			if (dy > 70 || (vy > 0.5 && dy > 20)) {
				sOff = dy;
				leaf = null;
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

	/* ---------- Reiter: Stempel / Weltwunder / Abzeichen ---------- */
	let tab = $state<'st' | 'ww' | 'ab'>('st');
	function pickTab(t: typeof tab) {
		if (t === tab) return;
		choose(null);
		tab = t;
		body?.scrollTo(0, 0);
	}
	/** „A, B und C“ */
	const list2 = (xs: string[], und: string) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} ${und} ${xs[xs.length - 1]}` : (xs[0] ?? ''));
	// Weltwunder, die auf „Hier war ich“ warten (Punkt am Reiter)
	const wonderOpen = $derived(wonders.filter((w) => w.open && !w.have));
	// Abzeichen in einer Liste: höchste erreichte Stufe zuerst (Gold, Silber, Bronze, noch keine), innerhalb gleich weit nach Fortschritt zur nächsten Stufe
	const bSorted = $derived(bs.map((b) => ({ b, t: +(tierClass(b).slice(1) || 0) })).sort((x, y) => y.t - x.t || y.b.p - x.b.p).map((x) => x.b));
	const medals = $derived([3, 2, 1].map((t) => bs.filter((b) => tierClass(b) === 't' + t).length));

	/* ---------- Teilen: Übersicht als Bild (zwei Varianten, ohne Namen) ---------- */
	type Card = { url: string; png: Blob };
	let share = $state<{ v: 'cover' | 'collage'; cards: Partial<Record<'cover' | 'collage', Card>>; busy: boolean; msg: string } | null>(null);
	let scMod: typeof import('$lib/sharecard') | null = null;
	async function makeCard(v: 'cover' | 'collage') {
		if (!share || share.cards[v]) return;
		const sc = (scMod ??= await import('$lib/sharecard'));
		const area = bs.find((b) => b.id === 'area');
		const years = stamps.map((s) => yearOf(s.entered)).filter(Boolean);
		const svg = await sc.cardSvg(
			{
				n: stamps.length,
				rank: ri >= 0 ? { icon: allRanks[ri].icon, name: allRanks[ri].name } : null,
				conts: [...new Set(stamps.map((s) => CONT[s.code]).filter(Boolean))],
				since: years.length ? Math.min(...years) : 0,
				area: area ? area.v : null,
				wonders: wonderCount,
				wondersAll: WONDERS.length,
				badges: badgeLevels(bs),
				stamps: stamps.map((s) => ({ code: s.code, nr: s.nr, sp: s.sp, s: s.s }))
			},
			v
		);
		const png = await sc.toPng(svg);
		if (!share) return;
		share.cards[v] = { url: URL.createObjectURL(png), png };
	}
	const MOTIFS = [
		{ v: 'cover', name: 'Pass-Umschlag' },
		{ v: 'collage', name: 'Stempel-Collage' }
	] as const;
	let cardsEl = $state<HTMLDivElement>();
	// Wischen zwischen den Motiven (einrastend); die Knöpfe darüber springen hin
	function showMotif(i: number) {
		if (!share || !cardsEl) return;
		share.v = MOTIFS[i].v;
		cardsEl.scrollTo({ left: i * cardsEl.clientWidth, behavior: reduceMotion() ? 'auto' : 'smooth' });
	}
	function onCards() {
		if (!share || !cardsEl) return;
		const v = MOTIFS[Math.round(cardsEl.scrollLeft / cardsEl.clientWidth)]?.v;
		if (v && v !== share.v) share.v = v;
	}
	function openShare() {
		choose(null);
		sOff = 0;
		share = { v: 'cover', cards: {}, busy: false, msg: '' };
		leaf = 'share';
		makeCard('cover').then(() => makeCard('collage')).catch((e) => { console.error(e); if (share) share.msg = 'Das Bild konnte nicht erstellt werden.'; });
	}
	async function doShare() {
		const c = share?.cards[share.v];
		if (!share || !c || share.busy) return;
		if (!scMod) return;
		share.busy = true;
		share.msg = '';
		// sofort aufrufen (ohne vorheriges Warten), sonst öffnet Safari das Teilen-Menü nicht
		const r = await scMod.shareImage(c.png);
		if (share) {
			share.busy = false;
			share.msg = r === 'saved' ? 'Bild gespeichert.' : '';
		}
	}
	// Bilder freigeben, sobald das Blatt zu ist
	$effect(() => {
		if (leaf === 'share' || !share) return;
		for (const c of Object.values(share.cards)) URL.revokeObjectURL(c.url);
		share = null;
	});

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
<section class="ov pp-view" id="passView" bind:this={root} role="dialog" aria-modal="true" aria-labelledby="passTitle" hidden={!ui.passOpen} onpointerdowncapture={skipPlay}>
	<svg class="pp-defs" aria-hidden="true" focusable="false"><defs>{@html INK_FILTERS}</defs></svg>
	<div class="ov-head">
		<button type="button" class="ov-close" id="passClose" aria-label="Reisepass schließen" onclick={() => closePass(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="passTitle">Reisepass</h1>
		{#if stamps.length && scenesOk}
			<button type="button" class="ov-close pp-share" aria-label="Pass als Bild teilen" onclick={openShare}
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg></button
			>
		{/if}
	</div>
	<div class="ov-body" bind:this={body} style:padding-bottom={pick ? sheetH + 16 + 'px' : null} onscroll={() => { if (ui.passOpen) lastScroll = body.scrollTop; }}>
		{#if ui.passOpen && scenesOk}
			<div class="pp-top"><PassTile inPass onrank={() => { choose(null); sOff = 0; leaf = 'ranks'; }} /></div>
			<div class="pp-tabs" role="tablist" aria-label="Bereiche des Passes">
				<button type="button" role="tab" aria-selected={tab === 'st'} onclick={() => pickTab('st')}>Stempel<small>{stamps.length}</small></button>
				<button type="button" role="tab" aria-selected={tab === 'ww'} onclick={() => pickTab('ww')}
					>Weltwunder<small>{wonderCount} / {WONDERS.length}</small>{#if wonderOpen.length}<i class="pp-dot" aria-label="wartet auf dich"></i>{/if}</button
				>
				<button type="button" role="tab" aria-selected={tab === 'ab'} onclick={() => pickTab('ab')}
					>Abzeichen<small>{badgeLevels(bs)} / {bs.reduce((s, b) => s + b.tiers.length, 0)}</small></button
				>
			</div>

			<div role="tabpanel" aria-label="Stempel" hidden={tab !== 'st'}>
			{#if !stamps.length}
				<p class="empty">Noch keine Stempel. Für jedes bereiste Land kommt hier ein Stempel in deinen Pass.</p>
			{/if}
			{#if pages.length}
				<div class="pp-tools">
					<button type="button" class="pp-info" onclick={() => { choose(null); sOff = 0; leaf = 'legend'; }}
						><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>Seltenheit</button
					>
				</div>
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
											aria-label="{sl.st.name}, Land Nr. {sl.st.nr}{sl.st.sp ? `, Briefmarke ${TIER_NAME[sl.st.sp]}` : ''}"
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
						<button type="button" class="pp-arrow" aria-label="Vorherige Seite" disabled={cur <= 0} onclick={() => goPage(cur - 1)}>‹</button>
						<div
							class="pp-strip"
							class:drag={!!slide}
							bind:this={strip}
							role="slider"
							tabindex="0"
							aria-label="Seite wählen"
							aria-valuemin={1}
							aria-valuemax={pages.length}
							aria-valuenow={shown + 1}
							aria-valuetext="Seite {shown + 1} von {pages.length}"
							style="--f:{knobF}"
							onpointerdown={nDown}
							onpointermove={nMove}
							onpointerup={nUp}
							onpointercancel={nUp}
							onkeydown={onKey}
						>
							<i class="pp-track"><i class="pp-fill"></i>{#if pages.length <= 30}{#each pages as _, pi (pi)}<u style="--p:{pi / (pages.length - 1)}" class:on={pi <= (slide ? slide.i : shown)}></u>{/each}{/if}</i>
							<b class="pp-knob">{(slide ? slide.i : shown) + 1}</b>
							{#if slide && preview}
								<div class="pp-bubble" aria-hidden="true" style="left:{Math.max(90, Math.min(slide.w - 90, KNOB / 2 + slide.f * (slide.w - KNOB)))}px">
									<b>Seite {slide.i + 1} <small>von {pages.length}</small></b>
									{#if preview.years}<span>{preview.years}</span>{/if}
									<span class="pp-flags">{preview.flags}</span>
								</div>
							{/if}
						</div>
						<button type="button" class="pp-arrow" aria-label="Nächste Seite" disabled={cur >= pages.length - 1} onclick={() => goPage(cur + 1)}>›</button>
					</div>
					<p class="pp-pnum">Seite {shown + 1} von {pages.length}</p>
				{/if}
			{/if}
				{#if stamps.length}
					<p class="note">Stempel antippen öffnet das Land. Dort kannst du auch das Datum der ersten Einreise eintragen – es erscheint dann auf dem Stempel.</p>
				{/if}
			</div>

			<div role="tabpanel" aria-label="Weltwunder" hidden={tab !== 'ww'}>
				<div class="pp-wintro">
					<span class="pp-wring" style="--p:{(wonderCount / WONDERS.length) * 100}" aria-hidden="true"><span>{wonderCount}/{WONDERS.length}</span></span>
					<p>
						{#if wonderCount === WONDERS.length}
							<b>Alle {WONDERS.length} Weltwunder gesehen!</b> Die ganze Liste ist komplett.
						{:else if wonderOpen.length}
							{#if wonderCount}<b>{wonderCount} Weltwunder gesehen.</b>{/if}
							In {list2([...new Set(wonderOpen.map((w) => nameOf(w.code)))], 'und')} warst du schon – tippe auf das „?“, wenn du {list2(wonderOpen.map((w) => w.name), 'oder')} gesehen hast.
						{:else}
							{#if wonderCount}<b>{wonderCount} Weltwunder gesehen.</b>{/if}
							Sobald du das Land eines Weltwunders bereist hast, erscheint dort ein „?“.
						{/if}
					</p>
				</div>
				<div class="pp-visa pp-wonders">
					<div class="pp-page-h"><span>Weltwunder</span><span>{wonderCount} / {WONDERS.length}</span></div>
					<div class="pp-grid pp-wgrid">
						{#each wonders as w (w.id)}
							{#if w.have}
								<button
									type="button"
									class="pp-slot sp"
									data-wonder={w.id}
									class:wait={wonderNew === w.id}
									style="transform:rotate({w.s.rot}deg);--c:{w.s.color}"
									aria-label="Weltwunder {w.name}, gesehen – antippen zum Entfernen"
									onclick={() => drop(w)}>{@html w.s.svg}</button
								>
							{:else if w.open}
								<button type="button" class="pp-slot" aria-label="Weltwunder {w.name}: Hier war ich" onclick={() => collect(w)}
									><span class="pp-empty pp-wopen"><b>?</b>{w.name}<em>Hier war ich</em></span></button
								>
							{:else}
								<button type="button" class="pp-slot" aria-label="Weltwunder {w.name}, {w.place} – Land noch nicht bereist" onclick={() => openCountry(w.code)}
									><span class="pp-empty pp-wlock"><i>{flag(w.code)}</i>{w.name}<small>{w.place}</small></span></button
								>
							{/if}
						{/each}
					</div>
				</div>
			</div>

			<div role="tabpanel" aria-label="Abzeichen" hidden={tab !== 'ab'}>
				{#if bs.length}
					<div class="pp-mcount" aria-label="{medals[0]} Gold, {medals[1]} Silber, {medals[2]} Bronze">
						<span><i class="t3"></i>{medals[0]} Gold</span><span><i class="t2"></i>{medals[1]} Silber</span><span><i class="t1"></i>{medals[2]} Bronze</span>
					</div>
					<div class="pp-visa">
						<div class="pp-page-h"><span>Abzeichen</span><span>{badgeLevels(bs)} / {bs.reduce((s, b) => s + b.tiers.length, 0)}</span></div>
						<div class="pp-badges">{#each bSorted as b (b.id)}{@render badge(b)}{/each}</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
	{#snippet badge(b: Badge)}
		{@const max = b.level >= b.tiers.length}
		<button
			type="button"
			class="pp-badge {tierClass(b)}"
			class:max
			class:sel={picked === b.id}
			data-badge={b.id}
			aria-pressed={picked === b.id}
			aria-label="{b.name}: {max ? tierName(b, b.level) + ' erreicht' : `${b.prog}, noch ${b.fmt(b.tiers[b.level] - b.v)} bis ${tierName(b, b.level + 1)}`}"
			onclick={() => choose(picked === b.id ? null : b.id)}
		>
			<span class="pp-medal" aria-hidden="true"><span><i>{b.icon}</i></span></span>
			<b>{b.name}</b>
			<span class="pp-steps" aria-hidden="true">{#each b.seg as f, i (i)}<i class={tc(b, i + 1)} style="--f:{f}"></i>{/each}</span>
			<small aria-hidden="true"
				>{#if max}{tierName(b, b.level)} ✓{:else}noch {b.fmt(b.tiers[b.level] - b.v).replace(' ', ' ')} bis <em class={tc(b, b.level + 1)}>{tierName(b, b.level + 1)}</em>{/if}</small
			>
		</button>
	{/snippet}
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
		<button type="button" class="pp-scrim" aria-label="Details schließen" onclick={() => choose(null)} transition:fade={{ duration: reduceMotion() ? 0 : 200 }}></button>
	{/if}
	{#if pick}
		{@const max = pick.level >= pick.tiers.length}
		<div class="pp-sheet {tierClass(pick)}" class:max class:open bind:this={sheet} transition:slideUp role="status">
			<button type="button" class="pp-grab" aria-label="Details schließen" onclick={() => choose(null)}><i></i></button>
			<div class="pp-sh-top">
				<span class="pp-medal" aria-hidden="true"><span><i>{pick.icon}</i></span></span>
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
					{:else if !max}
						<p class="pp-lnote">Alles dabei 🎉</p>
					{/if}
				</div>
			{:else}
				<button type="button" class="pp-more" onclick={() => setOpen(true)}><i aria-hidden="true"></i>Was zählt – was fehlt noch?</button>
			{/if}
		</div>
	{/if}
	{#if leaf}
		{@const closeT = leaf === 'legend' ? 'Legende schließen' : 'Schließen'}
		<button type="button" class="pp-scrim" aria-label={closeT} onclick={() => (leaf = null)} transition:fade={{ duration: reduceMotion() ? 0 : 200 }}></button>
		<div class="pp-sheet pp-leg" class:pp-shr={leaf === 'share'} bind:this={legSheet} transition:slideUp role="dialog" aria-labelledby="ppLegT">
			<button type="button" class="pp-grab" aria-label={closeT} onclick={() => (leaf = null)}><i></i></button>
			<div class="pp-leg-list" bind:this={legList}>
				{#if leaf === 'legend'}
					<h2 id="ppLegT">Seltenheit der Stempel</h2>
					<p>Jedes Land wird beim ersten Öffnen des Passes einmal ausgelost. Das Ergebnis bleibt und gilt auf allen Geräten.</p>
					<ul>
						{#each legRows as x (x.t)}
							<li>
								<span class="pp-leg-st" style="color:{x.s.color}">{@html x.s.svg}</span>
								<span><b>{TIER_NAME[x.t]} <em class="r{x.t}">{x.p}</em></b><small>{x.d}</small></span>
							</li>
						{/each}
					</ul>
				{:else if leaf === 'ranks'}
					<h2 id="ppLegT">Ränge</h2>
					{#if ri >= 0}<p class="pp-rsay">„{allRanks[ri].say}“</p>{:else}<p>Mit dem ersten Land bekommst du deinen ersten Rang.</p>{/if}
					<ol class="pp-rlist">
						{#each allRanks as r, i (r.n)}
							<li class:on={i <= ri} class:cur={i === ri}>
								<span aria-hidden="true">{r.icon}</span><b>{r.name}</b><small>{i === allRanks.length - 1 ? 'alle' : r.n} {r.n === 1 ? 'Land' : 'Länder'}</small>
							</li>
						{/each}
					</ol>
				{:else if share}
					<h2 id="ppLegT">Pass teilen</h2>
					<p>Als Bild – ohne deinen Namen. Passt für WhatsApp, Instagram & Co.</p>
					<div class="pp-seg" role="group" aria-label="Motiv">
						{#each MOTIFS as m, i (m.v)}
							<button type="button" aria-pressed={share.v === m.v} onclick={() => showMotif(i)}>{m.name}</button>
						{/each}
					</div>
					<div class="pp-cards" bind:this={cardsEl} onscroll={onCards}>
						{#each MOTIFS as m (m.v)}
							{@const c = share.cards[m.v]}
							<div class="pp-cardslot">
								<div class="pp-card">
									{#if c}<img src={c.url} alt="Motiv {m.name}" width="1080" height="1920" draggable="false" />{:else}<span class="pp-card-wait" aria-label="Bild wird erstellt"></span>{/if}
								</div>
							</div>
						{/each}
					</div>
					<div class="pp-cdots" aria-hidden="true">{#each MOTIFS as m (m.v)}<i class:on={share.v === m.v}></i>{/each}</div>
					<button type="button" class="pp-sharebtn" disabled={!share.cards[share.v] || share.busy} onclick={doShare}
						><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>Bild teilen</button
					>
					{#if share.msg}<p class="pp-sharemsg" role="status">{share.msg}</p>{/if}
				{/if}
			</div>
		</div>
	{/if}
</section>
