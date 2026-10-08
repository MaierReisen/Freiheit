-- Freiheit – Reisepass: Seltenheit je Land statt ja/nein (einmal ausgelost, auf allen Geräten gleich)
-- null = noch nicht ausgelost, 0 = Common (normaler Stempel), 1 = Rare (Briefmarke), 2 = Super Rare (Silberrand)
-- Legendary-Länder stehen fest in der App und brauchen keinen Eintrag.
-- Bisherige Lose: Briefmarke (true) wird Rare, kein Gewinn (false) wird neu ausgelost.
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" klicken.

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'visited_countries' and column_name = 'special') then
    alter table public.visited_countries add column special smallint;
  elsif (select data_type from information_schema.columns
         where table_schema = 'public' and table_name = 'visited_countries' and column_name = 'special') = 'boolean' then
    alter table public.visited_countries alter column special type smallint using (case when special then 1 end);
  end if;
end $$;
