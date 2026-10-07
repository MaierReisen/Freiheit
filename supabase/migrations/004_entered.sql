-- Freiheit – Reisepass: Datum der ersten Einreise je Land ("JJJJ-MM" oder "JJJJ", optional)
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" klicken.

alter table public.visited_countries
  add column if not exists entered text
  check (entered is null or entered ~ '^[0-9]{4}(-(0[1-9]|1[0-2]))?$');
