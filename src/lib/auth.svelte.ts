import type { User } from '@supabase/supabase-js';
import { base } from '$app/paths';
import { endSession, flush, loadCache, pendingChanges, startSession } from './atlas.svelte';
import { supabase } from './supabase';

/* Login per Magic Link. Die Mail enthält zusätzlich einen Code: auf dem iPhone öffnet sich der Link in Safari,
   nicht in der App auf dem Home-Bildschirm – dort gibt man stattdessen den Code ein. */

export const auth = $state({ ready: false, user: null as User | null });

let started = false;
export function initAuth() {
	if (started) return;
	started = true;
	supabase.auth.onAuthStateChange((_event, session) => {
		const user = session?.user ?? null;
		// Cache vor dem Anzeigen laden, damit die Karte gleich mit der richtigen Startregion beginnt
		if (user) loadCache(user.id);
		auth.user = user;
		auth.ready = true;
		// nicht direkt im Callback auf Supabase warten (sonst kann der Client blockieren)
		setTimeout(() => (user ? startSession(user.id) : endSession()), 0);
	});
}

export async function sendLoginLink(email: string) {
	const { error } = await supabase.auth.signInWithOtp({
		email,
		// Nur eingeladene Nutzer: neue Konten legt der Admin im Supabase-Dashboard an (Invite user)
		options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}${base}/` }
	});
	if (error) throw error;
}

export async function verifyCode(email: string, token: string) {
	const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
	if (error) throw error;
}

/** Abmelden; offene Änderungen werden vorher noch gesendet. false = Änderungen konnten nicht gesendet werden */
export async function signOut(force = false): Promise<boolean> {
	if (!(await flush()) && pendingChanges() && !force) return false;
	await supabase.auth.signOut({ scope: 'local' });
	return true;
}
