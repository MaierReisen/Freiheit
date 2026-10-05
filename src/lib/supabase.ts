import { createClient } from '@supabase/supabase-js';

// Öffentliche Projektdaten: dürfen im Client stehen, der Zugriff wird per Row Level Security geschützt
const SUPABASE_URL = 'https://rhqjycqqteemeenpuemc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6bXoxaImsbzck7QXYFLUFQ_4PcsyTln';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
	auth: {
		// PKCE: der Magic Link kommt mit ?code=… zurück und stört die Hash-Navigation (#map, #more …) nicht
		flowType: 'pkce',
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
		storageKey: 'freiheit-auth'
	}
});
