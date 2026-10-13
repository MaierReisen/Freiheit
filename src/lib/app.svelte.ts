import { tick } from 'svelte';
import { CONT, CONT_VIEW } from './countries';

/* App-weiter Zustand der Oberfläche: Tabs, Bottom-Sheet, Vollbild-Karte, Länder-Übersicht, Toast.
   Die Komponenten mit DOM-Animationen (Karte, Übersicht) melden ihre Steuerfunktionen in `hooks` an. */

// Weitere Tabs (z. B. Flüge, Reisen) hier und in TAB_LABEL ergänzen (Icon in TabBar.svelte); mit nur einem Tab wird die Tab-Leiste ausgeblendet.
// Tabs sind gleichrangige Bereiche: kein Wischen dazwischen, Wechsel schreibt keinen Verlauf. Der Tab „home“ heißt in der App „Welt“.
export const TABS = ['home', 'flights'] as const;
export type Tab = (typeof TABS)[number];
export const TAB_LABEL: Record<Tab, string> = { home: 'Welt', flights: 'Flüge' };
/** Vollbild-Seite im Tab „Flüge“: Liste der Flüge, Flughäfen oder Airlines */
export type FlightsPage = 'flights' | 'airports' | 'airlines';
// Wunschliste vorerst ausgeblendet (Daten bleiben erhalten)
export type PickerMode = 'visited' | 'fly';
/** Sheet: Länderseite, Länderauswahl, Seite zu einer Flugstrecke (key „FRA-JFK“, id = angetippter Flug) und „Flug hinzufügen“ (from/to vorbelegt) */
export type SheetView =
	| { kind: 'country'; code: string }
	| { kind: 'picker'; mode: PickerMode }
	| { kind: 'route'; key: string; id?: string }
	| { kind: 'addFlight'; from?: string; to?: string };

/* ---------- Darstellung: Design und Animationen (gelten nur auf diesem Gerät) ---------- */
export type ThemePref = 'system' | 'light' | 'dark';
export type MotionPref = 'system' | 'on' | 'off';
const PREFS_KEY = 'freiheit-prefs';
const THEME_BG = { light: '#EDF2F4', dark: '#0A1A23' };
const mqReduce = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

function loadPrefs(): { theme: ThemePref; motion: MotionPref } {
	let p: Record<string, unknown> = {};
	try {
		p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {};
	} catch {}
	return {
		theme: p.theme === 'light' || p.theme === 'dark' ? p.theme : 'system',
		motion: p.motion === 'on' || p.motion === 'off' ? p.motion : 'system'
	};
}
export const prefs = $state(loadPrefs());

/** Animationen reduzieren? Eigene Einstellung der App, sonst die des Geräts */
export function reduceMotion() {
	return prefs.motion === 'off' || (prefs.motion === 'system' && !!mqReduce?.matches);
}

/** Setzt data-theme / data-motion am <html> (CSS reagiert darauf) und die Farbe der Statusleiste */
function applyPrefs() {
	if (typeof document === 'undefined') return;
	const r = document.documentElement;
	if (prefs.theme === 'system') r.removeAttribute('data-theme');
	else r.dataset.theme = prefs.theme;
	if (reduceMotion()) r.dataset.motion = 'reduce';
	else r.removeAttribute('data-motion');
	document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
		const dark = (m.getAttribute('media') || '').includes('dark');
		m.setAttribute('content', prefs.theme === 'system' ? THEME_BG[dark ? 'dark' : 'light'] : THEME_BG[prefs.theme]);
	});
}
function savePrefs() {
	try {
		localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
	} catch {}
	applyPrefs();
}
export function setThemePref(t: ThemePref) {
	prefs.theme = t;
	savePrefs();
}
export function setMotionPref(m: MotionPref) {
	prefs.motion = m;
	savePrefs();
}
applyPrefs();
mqReduce?.addEventListener?.('change', applyPrefs);

export const ui = $state({
	tab: 'home' as Tab,
	selected: null as string | null,
	sheetOpen: false,
	sheetView: null as SheetView | null,
	/** zählt jedes Öffnen hoch, damit das Sheet frisch aufgebaut wird (wie vorher per innerHTML) */
	sheetKey: 0,
	/** Länderseite: 'peek' = kompakte Karte unten (Globus bleibt sichtbar), 'full' = volle Detailseite */
	sheetDetent: 'full' as 'peek' | 'full',
	/** Höhe der kompakten Karte in px (misst die Länderseite selbst) */
	sheetPeek: 260,
	/** Seite „Meine Länder“ (Vollbild, über den Block auf der Startseite) */
	placesOpen: false,
	/** Seite „Meine Kontinente“ (Vollbild, über den Block auf der Startseite) */
	continentsOpen: false,
	full: false,
	settingsOpen: false,
	/** Reisepass (Vollbild, über die Kachel in der Länderliste) */
	passOpen: false,
	/** Seite im Tab „Flüge“ (Vollbild, '' = zu) */
	flightsPage: '' as FlightsPage | '',
	/** zählt hoch, wenn der Globus im Tab „Flüge“ alle (bzw. die gewählten) Strecken ins Bild holen soll */
	flightsFit: 0,
	/** Tab, zu dem gerade gewischt wird (Nachbar sichtbar), sonst '' – das Flugzeug im Kopf fliegt dann hinaus */
	swipeTo: '' as Tab | '',
	/** Flugzeug im Kopf: Welt hat beim Wischen an die Flüge übergeben (Ende der einen = Anfang der anderen Kurve) */
	planeHandoff: false,
	/** neu eingetragener Flug: Strecke leuchtet kurz auf dem Globus auf (wie ein neues Land), '' = keine */
	flashRoute: '',
	/** Globus auf der Startseite per Tipp aktiviert (Touch): dann drehen, kippen, zoomen statt Seite scrollen */
	mapActive: false,
	/** Kontinent, auf dem die Karte gerade steht (per Chip oder Ziehen; null = Startregion, '' = mehrere Kontinente im Bild); nur Ansicht */
	focusContinent: null as string | null,
	/** gemeinsame Start-Animation (Globus, Zähler, Flugkurve): Zeitpunkte in performance.now() */
	intro: { key: 0, start: 0, end: 0, resume: false },
	/** mehrere Länder auf einmal (added = Flaggen), neuer Kontinent, neuer Rang (rank gesetzt) bzw. neues Abzeichen (badge gesetzt) im Reisepass: Feier-Karte (key zählt hoch) */
	unlock: { key: 0, cont: '', n: 0, rank: '', badge: '', badgeId: '', icon: '', sub: '', added: '', area: '' },
	/** Abzeichen, das der Pass nach dem Öffnen (per Tipp auf die Meldung) zeigen soll */
	passBadge: '',
	/** Abzeichen-Gruppe, die der Pass nach dem Öffnen zeigen soll (z. B. 'flug' vom Tab „Flüge“) */
	passGroup: '',
	/** Pass soll nach dem Öffnen die Rangübersicht zeigen (Tipp auf die Rang-Meldung) */
	passRanks: false,
	toastMsg: '',
	toastShow: false
});

export interface MapHooks {
	resize(): void;
	flyToCountry(code: string, opts?: { keepK?: boolean; ms?: number }): void;
	flyToContinent(code: string): void;
	/** Länder kurz aufleuchten lassen (delay/dur in ms) */
	highlight(codes: string | string[], delay?: number, dur?: number, opts?: { rings?: boolean; at?: number[]; wave?: number }): void;
	scrollIntoView(): void;
	/** Tab „Flüge“: Strecke wachsen lassen und ins Bild holen */
	focusRoute(key: string): void;
}
export const hooks: { map: MapHooks | null } = { map: null };
/** Zähler auf der Startseite: Ausgangspunkt der Öffnen-/Schließen-Animation der Übersicht */
export const dom: { count: HTMLElement | null } = { count: null };

/* ---------- Start-Animation ---------- */
const INTRO_DELAY = 300;
export const INTRO_MS = 1900;
/** schnell beginnen, zum Ende langsamer */
export const easeOutCubic = (k: number) => 1 - Math.pow(1 - k, 3);
/** Startsignal beim Öffnen der App (und nach längerer Pause): alle Animationen enden gleichzeitig */
/** resume: Rückkehr in die App – Zähler und Flugkurve laufen erneut, der Globus behält die aktuelle Ansicht */
export function startIntro(resume = false) {
	const start = performance.now() + INTRO_DELAY;
	ui.intro = { key: ui.intro.key + 1, start, end: start + INTRO_MS, resume };
}
/** Fortschritt 0..1 der laufenden Start-Animation (1 = fertig bzw. keine aktiv) */
export function introProgress(now = performance.now()) {
	const it = ui.intro;
	if (!it.key || reduceMotion()) return 1;
	return Math.max(0, Math.min(1, (now - it.start) / (it.end - it.start)));
}

/** Fortschritt der Start-Animation als Rune (Zähler, die gleichzeitig mit Globus und Flugkurve hochzählen).
    Beim Aufbau einer Komponente aufrufen. */
export function introClock() {
	let t = $state(reduceMotion() ? 1 : 0);
	$effect(() => {
		const it = ui.intro;
		if (!it.key) return;
		let raf = 0;
		const step = () => {
			t = introProgress();
			if (t < 1) raf = requestAnimationFrame(step);
		};
		step();
		// Absicherung, falls keine Animationsbilder kommen (App im Hintergrund)
		const done = setTimeout(() => (t = 1), Math.max(0, it.end - performance.now()) + 300);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(done);
		};
	});
	return {
		get t() {
			return t;
		}
	};
}

/* ---------- Toast ---------- */
let tt: ReturnType<typeof setTimeout> | undefined;
export function toast(m: string) {
	ui.toastMsg = m;
	ui.toastShow = true;
	clearTimeout(tt);
	tt = setTimeout(() => (ui.toastShow = false), 3200);
}

/* ---------- Sheet ---------- */
function openSheet(view: SheetView) {
	ui.sheetView = view;
	ui.sheetKey++;
	ui.sheetOpen = true;
}
export function closeSheet() {
	ui.sheetOpen = false;
	ui.selected = null;
}
/** peek: aus Globus/Karte geöffnet – erst als kompakte Karte, damit man den Flug zum Land sieht.
    Ist schon eine Länderseite offen, bleibt deren Stufe (Durchtippen durch Nachbarländer). */
export function openCountry(code: string, opts: { peek?: boolean } = {}) {
	const already = ui.sheetOpen && ui.sheetView?.kind === 'country';
	ui.sheetDetent = already ? ui.sheetDetent : opts.peek ? 'peek' : 'full';
	ui.selected = code;
	// vom Globus aus (Tippen, Suche, Nachbarland): Kontinent-Knopf folgt dem Land
	if (opts.peek && CONT[code] && CONT_VIEW[CONT[code]]) ui.focusContinent = CONT[code];
	openSheet({ kind: 'country', code });
}
/** Seite zu einer Flugstrecke; peek: vom Globus aus (kompakt, Globus bleibt sichtbar) */
export function openRoute(key: string, opts: { peek?: boolean; id?: string } = {}) {
	const already = ui.sheetOpen && ui.sheetView?.kind === 'route';
	ui.sheetDetent = already ? ui.sheetDetent : opts.peek ? 'peek' : 'full';
	ui.selected = null;
	openSheet({ kind: 'route', key, id: opts.id });
}
export function openAddFlight(from?: string, to?: string) {
	openSheet({ kind: 'addFlight', from, to });
}
/** ausgewählte Strecke auf dem Globus (Seite zur Strecke offen) */
export const selectedRoute = () => (ui.sheetOpen && ui.sheetView?.kind === 'route' ? ui.sheetView.key : ui.flashRoute || null);
let flashT: ReturnType<typeof setTimeout> | undefined;
/** Strecke nach dem Eintragen hervorheben, sobald der Bogen gewachsen ist; nach einigen Sekunden wieder normal */
export function flashRoute(key: string) {
	clearTimeout(flashT);
	flashT = setTimeout(() => {
		ui.flashRoute = key;
		flashT = setTimeout(() => (ui.flashRoute = ''), 3200);
	}, reduceMotion() ? 0 : 1000);
}
export function setSheetDetent(d: 'peek' | 'full') {
	ui.sheetDetent = d;
}
export function openPicker(mode: PickerMode) {
	openSheet({ kind: 'picker', mode });
}

/* ---------- Ebenen und Verlauf ----------
   Pass, Länder, Kontinente, Einstellungen und Vollbild-Karte sind „Ebenen“ über einem Tab. Sie schreiben bewusst KEINEN Verlaufseintrag:
   die Zurück-Geste von iOS/Android soll keine Ebene schließen und nicht durch besuchte Seiten blättern. Geschlossen wird nur per
   Wischen nach unten oder mit dem Schließen-Knopf (Esc am Rechner). */

/* ---------- Vollbild-Karte ---------- */
export function setFull(on: boolean, fromHash = false) {
	if (on === ui.full) return;
	ui.full = on;
	ui.mapActive = false;
	document.body.classList.toggle('noscroll', on);
}

/* ---------- Einstellungen (Vollbild, über den Button oben rechts) ---------- */
let settingsReturnFocus: Element | null = null;
export function openSettings(fromHash = false) {
	if (ui.settingsOpen) return;
	if (ui.sheetOpen) closeSheet();
	if (ui.full) setFull(false, true);
	if (ui.placesOpen) closePlaces(true);
	if (ui.continentsOpen) closeContinents(true);
	if (ui.passOpen) closePass(true);
	closeFlightsPage();
	settingsReturnFocus = document.activeElement;
	ui.settingsOpen = true;
	document.body.classList.add('noscroll');
	tick().then(() => document.getElementById('setClose')?.focus({ preventScroll: true }));
}
export function closeSettings(fromHash = false) {
	if (!ui.settingsOpen) return;
	ui.settingsOpen = false;
	document.body.classList.remove('noscroll');
	if (settingsReturnFocus instanceof HTMLElement) settingsReturnFocus.focus({ preventScroll: true });
}
const isSettingsHash = (h: string) => h === 'einstellungen' || h === 'more';

/* ---------- Meine Länder (Vollbild, wie die Einstellungen) ---------- */
let placesReturnFocus: Element | null = null;
export function openPlaces(fromHash = false) {
	if (ui.placesOpen) return;
	if (ui.sheetOpen) closeSheet();
	if (ui.full) setFull(false, true);
	if (ui.settingsOpen) closeSettings(true);
	if (ui.passOpen) closePass(true);
	if (ui.continentsOpen) closeContinents(true);
	placesReturnFocus = document.activeElement;
	ui.placesOpen = true;
	document.body.classList.add('noscroll');
	tick().then(() => document.getElementById('placesClose')?.focus({ preventScroll: true }));
}
export function closePlaces(fromHash = false) {
	if (!ui.placesOpen) return;
	ui.placesOpen = false;
	if (ui.sheetOpen) closeSheet();
	if (!ui.settingsOpen && !ui.passOpen) document.body.classList.remove('noscroll');
	if (placesReturnFocus instanceof HTMLElement) placesReturnFocus.focus({ preventScroll: true });
}

/* ---------- Meine Kontinente (Vollbild, wie „Meine Länder“) ---------- */
let contsReturnFocus: Element | null = null;
export function openContinents(fromHash = false) {
	if (ui.continentsOpen) return;
	if (ui.sheetOpen) closeSheet();
	if (ui.full) setFull(false, true);
	if (ui.settingsOpen) closeSettings(true);
	if (ui.passOpen) closePass(true);
	if (ui.placesOpen) closePlaces(true);
	contsReturnFocus = document.activeElement;
	ui.continentsOpen = true;
	document.body.classList.add('noscroll');
	tick().then(() => document.getElementById('contsClose')?.focus({ preventScroll: true }));
}
/** refocus: false, wenn danach etwas anderes den Blick bekommt (z. B. der Globus) */
export function closeContinents(fromHash = false, refocus = true) {
	if (!ui.continentsOpen) return;
	ui.continentsOpen = false;
	if (ui.sheetOpen) closeSheet();
	if (!ui.settingsOpen && !ui.passOpen && !ui.placesOpen) document.body.classList.remove('noscroll');
	if (refocus && contsReturnFocus instanceof HTMLElement) contsReturnFocus.focus({ preventScroll: true });
}

/* ---------- Reisepass (Vollbild, wie die Einstellungen) ---------- */
let passReturnFocus: Element | null = null;
export function openPass(fromHash = false) {
	if (ui.passOpen) return;
	if (ui.sheetOpen) closeSheet();
	if (ui.full) setFull(false, true);
	if (ui.placesOpen) closePlaces(true);
	if (ui.continentsOpen) closeContinents(true);
	passReturnFocus = document.activeElement;
	ui.passOpen = true;
	document.body.classList.add('noscroll');
	tick().then(() => document.getElementById('passClose')?.focus({ preventScroll: true }));
}
export function closePass(fromHash = false) {
	if (!ui.passOpen) return;
	ui.passOpen = false;
	if (ui.sheetOpen) closeSheet();
	if (!ui.settingsOpen) document.body.classList.remove('noscroll');
	if (passReturnFocus instanceof HTMLElement) passReturnFocus.focus({ preventScroll: true });
}

/* ---------- Flüge: Listen (Vollbild, wie „Meine Länder“) ---------- */
let flightsReturnFocus: Element | null = null;
export function openFlightsPage(p: FlightsPage) {
	if (ui.sheetOpen) closeSheet();
	if (!ui.flightsPage) flightsReturnFocus = document.activeElement;
	ui.flightsPage = p;
	document.body.classList.add('noscroll');
	tick().then(() => document.getElementById('flvClose')?.focus({ preventScroll: true }));
}
export function closeFlightsPage() {
	if (!ui.flightsPage) return;
	ui.flightsPage = '';
	if (!ui.settingsOpen && !ui.passOpen && !ui.placesOpen && !ui.continentsOpen) document.body.classList.remove('noscroll');
	if (flightsReturnFocus instanceof HTMLElement) flightsReturnFocus.focus({ preventScroll: true });
}

/* ---------- Tabs ---------- */
function showTab(t: Tab, dir: number) {
	ui.tab = t;
	tick().then(() => {
		// Kopf und Inhalt des Tabs (der Globus dazwischen gehört allen Tabs und bleibt stehen)
		document.querySelectorAll<HTMLElement>(`.tab[data-pane="${t}"]`).forEach((el) => {
			el.classList.remove('in-r', 'in-l');
			if (dir && !reduceMotion()) {
				void el.offsetWidth;
				el.classList.add(dir > 0 ? 'in-r' : 'in-l');
			}
		});
		requestAnimationFrame(() => hooks.map?.resize());
	});
}
export function goTab(tab: string, push = true, dir?: number) {
	const t: Tab = (TABS as readonly string[]).includes(tab) ? (tab as Tab) : 'home';
	if (ui.sheetOpen) closeSheet();
	if (ui.full) setFull(false, true);
	if (ui.placesOpen) closePlaces(true);
	if (ui.continentsOpen) closeContinents(true);
	if (ui.settingsOpen) closeSettings(true);
	if (ui.passOpen) closePass(true);
	closeFlightsPage();
	if (dir === undefined) dir = Math.sign(TABS.indexOf(t) - TABS.indexOf(ui.tab));
	const same = t === ui.tab;
	showTab(t, dir);
	if (push && location.hash !== '#' + t) {
		// Tabwechsel schreibt keinen neuen Verlauf
		history.replaceState(history.state, '', '#' + t);
	}
	if (!same) window.scrollTo(0, 0);
}

/** Startzustand aus der Adresse (#map, #laender, #more …) */
export function initFromHash() {
	const h = location.hash.slice(1);
	if (h === 'map') {
		showTab('home', 0);
		setFull(true, true);
	} else if (h === 'laender' || h === 'places') {
		showTab('home', 0);
		openPlaces(true);
	} else if (h === 'kontinente') {
		showTab('home', 0);
		openContinents(true);
	} else if (isSettingsHash(h)) {
		showTab('home', 0);
		openSettings(true);
	} else if (h === 'pass') {
		showTab('home', 0);
		openPass(true);
	} else goTab(h || 'home', false, 0);
	requestAnimationFrame(() => hooks.map?.resize());
}

export function onHashChange() {
	const h = location.hash.slice(1);
	if (h === 'map') {
		if (ui.placesOpen) closePlaces(true);
		if (ui.continentsOpen) closeContinents(true);
		if (ui.settingsOpen) closeSettings(true);
		if (ui.tab !== 'home') showTab('home', 0);
		setFull(true, true);
	} else if (isSettingsHash(h)) {
		openSettings(true);
	} else if (h === 'pass') {
		if (ui.settingsOpen) closeSettings(true);
		if (ui.placesOpen) closePlaces(true);
		if (ui.full) setFull(false, true);
		openPass(true);
	} else if (h === 'laender' || h === 'places') {
		if (ui.settingsOpen) closeSettings(true);
		if (ui.full) setFull(false, true);
		if (ui.tab !== 'home') showTab('home', 0);
		openPlaces(true);
	} else if (h === 'kontinente') {
		if (ui.settingsOpen) closeSettings(true);
		if (ui.full) setFull(false, true);
		if (ui.tab !== 'home') showTab('home', 0);
		openContinents(true);
	} else {
		if (ui.full) setFull(false, true);
		if (ui.placesOpen) closePlaces(true);
		if (ui.continentsOpen) closeContinents(true);
		if (ui.settingsOpen) closeSettings(true);
		if (ui.passOpen) closePass(true);
		if (h !== ui.tab && !(h === '' && ui.tab === 'home')) goTab(h, false);
	}
}
