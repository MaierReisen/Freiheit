-- Freiheit – Meine Hauptstädte: besuchte Hauptstädte (Ländercodes, z. B. {FR,IT}), auf allen Geräten gleich
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" klicken.

alter table public.user_settings
  add column if not exists capitals text[] not null default '{}';
