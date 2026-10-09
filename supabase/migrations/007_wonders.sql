-- Freiheit – Reisepass: gesammelte Weltwunder (Liste der ids, z. B. {machu,taj}), auf allen Geräten gleich
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" klicken.

alter table public.user_settings
  add column if not exists wonders text[] not null default '{}';
