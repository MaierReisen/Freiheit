-- Freiheit – Reisepass: seltene Briefmarke je Land (einmal ausgelost, auf allen Geräten gleich)
-- null = noch nicht ausgelost, true = Briefmarke, false = normaler Stempel
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" klicken.

alter table public.visited_countries
  add column if not exists special boolean;
