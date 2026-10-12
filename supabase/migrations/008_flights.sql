-- Freiheit – Tab „Flüge“: Flüge aus Flighty (oder von Hand) speichern, auf allen Geräten gleich
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" klicken.
-- Die Tabelle gibt es meist schon (aus schema.sql); hier kommen die neuen Spalten dazu.

create table if not exists public.flights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  trip_id       uuid,
  flight_date   date,
  from_airport  text not null check (from_airport ~ '^[A-Z]{3}$'),
  to_airport    text not null check (to_airport ~ '^[A-Z]{3}$'),
  airline       text,
  flight_number text,
  price         numeric(10,2) check (price is null or price >= 0),
  currency      text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  created_at    timestamptz not null default now()
);

-- ext_id: Kennung des Flugs (Flighty-ID bzw. Datum+Strecke), damit erneutes Einlesen nichts doppelt anlegt
-- detail: Zeiten (Ortszeit), Terminal, Gate, Flugzeug, Sitz, Klasse, Notiz …
alter table public.flights add column if not exists ext_id text;
alter table public.flights add column if not exists detail jsonb not null default '{}';
create unique index if not exists flights_user_ext on public.flights (user_id, ext_id);
create index if not exists flights_user_idx on public.flights (user_id);

alter table public.flights enable row level security;
drop policy if exists "eigene Daten" on public.flights;
create policy "eigene Daten" on public.flights for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.flights to authenticated;
