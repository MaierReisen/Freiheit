import { tick } from 'svelte';

/* App-weiter Zustand der Oberfläche: Tabs, Bottom-Sheet, Vollbild-Karte, Länder-Übersicht, Toast.
   Die Komponenten mit DOM-Animationen (Karte, Übersicht) melden ihre Steuerfunktionen in `hooks` an. */

// Weitere Tabs (z. B. Reisen) hier ergänzen; mit nur einem Tab wird die Tab-Leiste ausgeblendet
export const TABS = ['home'] as const;
export type Tab = (typeof TABS)[number];
// Wunschliste vorerst ausgeblendet (Daten bleiben erhalten)
export type PickerMode = 'visited' | 'fly';
export type SheetView = { kind: 'country'; code: string } | { kind: 'picker'; mode: PickerMode };

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
	placesOpen: false,
	full: false,
	settingsOpen: false,
	/** Globus auf der Startseite per Tipp aktiviert (Touch): dann drehen, kippen, zoomen statt Seite scrollen */
	mapActive: false,
	/** Kontinent, auf den die Karte zuletzt per Chip geflogen ist (null = Startregion); nur Ansicht, wird nicht gespeichert */
	focusContinent: null as string | null,
	/** gemeinsame Start-Animation (Globus, Zähler, Flugkurve): Zeitpunkte in performance.now() */
	intro: { key: 0, start: 0, end: 0 },
	/** neuer Kontinent freigeschaltet: Feier-Karte (key zählt hoch) */
	unlock: { key: 0, cont: '', n: 0 },
	toastMsg: '',
	toastShow: false
});

export interface MapHooks {
	resize(): void;
	flyToCountry(code: string, opts?: { keepK?: boolean; ms?: number }): void;
	flyToContinent(code: string): void;
	scrollIntoView(): void;
}
export interface PlacesHooks {
	open(fromHash: boolean): void;
	close(fromHash: boolean): void;
}
export const hooks: { map: MapHooks | null; places: PlacesHooks | null } = { map: null, places: null };
/** Zähler auf der Startseite: Ausgangspunkt der Öffnen-/Schließen-Animation der Übersicht */
export const dom: { count: HTMLElement | null } = { count: null };

/* ---------- Start-Animation ---------- */
const INTRO_DELAY = 300;
export const INTRO_MS = 1900;
/** schnell beginnen, zum Ende langsamer */
export const easeOutCubic = (k: number) => 1 - Math.pow(1 - k, 3);
/** Startsignal beim Öffnen der App (und nach längerer Pause): alle Animationen enden gleichzeitig */
export function startIntro() {
	const start = performance.now() + INTRO_DELAY;
	ui.intro = { key: ui.intro.key + 1, start, end: start + INTRO_MS };
}
/** Fortschritt 0..1 der laufenden Start-Animation (1 = fertig bzw. keine aktiv) */
export function introProgress(now = performance.now()) {
	const it = ui.intro;
	if (!it.key || reduceMotion()) return 1;
	return Math.max(0, Math.min(1, (now - it.start) / (it.end - it.start)));
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
export function openCountry(code: string) {
	ui.selected = code;
	openSheet({ kind: 'country', code });
}
export function openPicker(mode: PickerMode) {
	openSheet({ kind: 'picker', mode });
}

/* ---------- Vollbild-Karte ---------- */
let pushedMap = false;
export function setFull(on: boolean, fromHash = false) {
	if (on === ui.full) return;
	ui.full = on;
	ui.mapActive = false;
	document.body.classList.toggle('noscroll', on);
	if (!fromHash) {
		if (on) {
			pushedMap = true;
			location.hash = 'map';
		} else if (pushedMap && location.hash === '#map') {
			pushedMap = false;
			history.back();
		} else if (location.hash === '#map') {
			location.hash = 'home';
		}
	} else if (!on) pushedMap = false;
}

/* ---------- Einstellungen (Vollbild, über den Button oben rechts) ---------- */
let pushedSettings = false;
let settingsReturnFocus: Element | null = null;
export function openSettings(fromHash = false) {
	if (ui.settingsOpen) return;
	if (ui.sheetOpen) closeSheet();
	if (ui.full) setFull(false, true);
	if (ui.placesOpen) hooks.places?.close(true);
	settingsReturnFocus = document.activeElement;
	ui.settingsOpen = true;
	document.body.classList.add('noscroll');
	if (!fromHash) {
		pushedSettings = true;
		location.hash = 'einstellungen';
	}
	tick().then(() => document.getElementById('setClose')?.focus({ preventScroll: true }));
}
export function closeSettings(fromHash = false) {
	if (!ui.settingsOpen) return;
	ui.settingsOpen = false;
	document.body.classList.remove('noscroll');
	if (!fromHash) {
		if (pushedSettings && location.hash === '#einstellungen') {
			pushedSettings = false;
			history.back();
		} else if (location.hash === '#einstellungen') location.hash = 'home';
	} else pushedSettings = false;
	if (settingsReturnFocus instanceof HTMLElement) settingsReturnFocus.focus({ preventScroll: true });
}
const isSettingsHash = (h: string) => h === 'einstellungen' || h === 'more';

/* ---------- Tabs ---------- */
function showTab(t: Tab, dir: number) {
	ui.tab = t;
	tick().then(() => {
		const el = document.getElementById('tab-' + t);
		if (!el) return;
		el.classList.remove('in-r', 'in-l');
		if (dir && !reduceMotion()) {
			void el.offsetWidth;
			el.classList.add(dir > 0 ? 'in-r' : 'in-l');
		}
		if (t === 'home') requestAnimationFrame(() => hooks.map?.resize());
	});
}
export function goTab(tab: string, push = true, dir?: number) {
	const t: Tab = (TABS as readonly string[]).includes(tab) ? (tab as Tab) : 'home';
	if (ui.sheetOpen) closeSheet();
	if (ui.full) setFull(false, true);
	if (ui.placesOpen) hooks.places?.close(true);
	if (ui.settingsOpen) closeSettings(true);
	if (dir === undefined) dir = Math.sign(TABS.indexOf(t) - TABS.indexOf(ui.tab));
	showTab(t, dir);
	if (push && location.hash !== '#' + t) location.hash = t;
	window.scrollTo(0, 0);
}

/** Startzustand aus der Adresse (#map, #laender, #more …) */
export function initFromHash() {
	const h = location.hash.slice(1);
	if (h === 'map') {
		showTab('home', 0);
		setFull(true, true);
	} else if (h === 'laender' || h === 'places') {
		showTab('home', 0);
		hooks.places?.open(true);
	} else if (isSettingsHash(h)) {
		showTab('home', 0);
		openSettings(true);
	} else goTab(h || 'home', false, 0);
	requestAnimationFrame(() => hooks.map?.resize());
}

export function onHashChange() {
	const h = location.hash.slice(1);
	if (h === 'map') {
		if (ui.placesOpen) hooks.places?.close(true);
		if (ui.settingsOpen) closeSettings(true);
		if (ui.tab !== 'home') showTab('home', 0);
		setFull(true, true);
	} else if (isSettingsHash(h)) {
		openSettings(true);
	} else if (h === 'laender' || h === 'places') {
		if (ui.settingsOpen) closeSettings(true);
		if (ui.full) setFull(false, true);
		if (ui.tab !== 'home') showTab('home', 0);
		hooks.places?.open(true);
	} else {
		if (ui.full) setFull(false, true);
		if (ui.placesOpen) hooks.places?.close(true);
		if (ui.settingsOpen) closeSettings(true);
		if (h !== ui.tab) goTab(h, false);
	}
}
