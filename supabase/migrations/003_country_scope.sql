-- Freiheit – Einstellung "Was zählt als Land?" (193 UN-Mitglieder / 195 mit Beobachtern / 197 alle Staaten)
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" klicken.

alter table public.user_settings
  add column if not exists country_scope text not null default 'sovereign'
  check (country_scope in ('un','un_observer','sovereign'));
