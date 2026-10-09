/* Reisepass: welche Stempel auf diesem Gerät schon „gestempelt“ zu sehen waren.
   Neue Länder bekommen beim nächsten Öffnen des Passes die Stempel-Animation. null = Pass noch nie geöffnet. */

const KEY = 'freiheit-pass-seen';

function load(): string[] | null {
	try {
		const v = JSON.parse(localStorage.getItem(KEY) || 'null');
		return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : null;
	} catch {
		return null;
	}
}

export const passSeen = $state<{ codes: string[] | null }>({ codes: typeof window === 'undefined' ? null : load() });

export function markSeen(codes: string[]) {
	passSeen.codes = codes;
	try {
		localStorage.setItem(KEY, JSON.stringify(codes));
	} catch {}
}

/** Zurück auf „Pass noch nie geöffnet“ (Konto zurücksetzen) */
export function resetSeen() {
	passSeen.codes = null;
	try {
		localStorage.removeItem(KEY);
	} catch {}
}
