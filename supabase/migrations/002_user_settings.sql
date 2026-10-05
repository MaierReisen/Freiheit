-- Freiheit – Nutzereinstellungen (Startregion der Karte, später weitere)
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" klicken.

create table if not exists public.user_settings (
  user_id        uuid primary key default auth.uid() references auth.users on delete cascade,
  home_continent text not null default 'EU' check (home_continent in ('EU','AS','AF','NA','SA','OC')),
  updated_at     timestamptz not null default now()
);

alter table public.user_settings enable row level security;
drop policy if exists "eigene Daten" on public.user_settings;
create policy "eigene Daten" on public.user_settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_settings to authenticated;
