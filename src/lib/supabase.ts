import { createClient } from '@supabase/supabase-js';

// Öffentliche Projektdaten: dürfen im Client stehen, der Zugriff wird per Row Level Security geschützt
const SUPABASE_URL = 'https://rhqjycqqteemeenpuemc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6bXoxaImsbzck7QXYFLUFQ_4PcsyTln';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
	auth: {
		// implicit: der Magic Link funktioniert auch, wenn er in einem anderen Browser geöffnet wird als angefordert
		// (bei PKCE müsste es derselbe Browser sein). Die Tokens im Hash liest der Client beim Start aus und entfernt sie.
		flowType: 'implicit',
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
		storageKey: 'freiheit-auth'
	}
});
