-- Freiheit – Datenbankschema für Supabase
-- Vollständiges Schema für ein neues Projekt. Spätere Änderungen liegen zusätzlich in supabase/migrations/.
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" klicken.
-- Jede Tabelle ist per Row Level Security geschützt: jeder sieht und ändert nur seine eigenen Zeilen.

-- ---------- Länder ----------

create table if not exists public.visited_countries (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  code       text not null check (code ~ '^[A-Z]{2}$'),
  name       text,
  position   integer not null default 0,          -- Reihenfolge: "Land Nr. X"
  entered    text check (entered is null or entered ~ '^[0-9]{4}(-(0[1-9]|1[0-2]))?$'),  -- erste Einreise (Reisepass)
  created_at timestamptz not null default now(),
  primary key (user_id, code)
);

create table if not exists public.wishlist (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  code       text not null check (code ~ '^[A-Z]{2}$'),
  name       text,
  created_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- Länder pro Jahr (früheres Diagramm, wird nicht mehr angezeigt; Daten bleiben erhalten)
create table if not exists public.milestones (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  year    integer not null check (year between 1900 and 2100),
  count   integer not null check (count >= 0),
  primary key (user_id, year)
);

-- ---------- Einstellungen ----------

create table if not exists public.user_settings (
  user_id        uuid primary key default auth.uid() references auth.users on delete cascade,
  home_continent text not null default 'EU' check (home_continent in ('EU','AS','AF','NA','SA','OC')),
  country_scope  text not null default 'sovereign' check (country_scope in ('un','un_observer','sovereign')),
  wonders        text[] not null default '{}',
  updated_at     timestamptz not null default now()
);

-- ---------- Reisen, Flüge, Kosten (Oberfläche folgt) ----------

create table if not exists public.trips (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  title      text not null,
  start_date date,
  end_date   date,
  countries  text[] not null default '{}',        -- ISO-Codes, z. B. {IT,FR}
  cities     text[] not null default '{}',
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.flights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  trip_id       uuid references public.trips on delete set null,
  flight_date   date,
  from_airport  text not null check (from_airport ~ '^[A-Z]{3}$'),   -- IATA, z. B. MUC
  to_airport    text not null check (to_airport ~ '^[A-Z]{3}$'),
  airline       text,
  flight_number text,
  price         numeric(10,2) check (price is null or price >= 0),
  currency      text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  created_at    timestamptz not null default now()
);

create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  trip_id    uuid references public.trips on delete cascade,
  category   text not null default 'sonstiges'
             check (category in ('flug','unterkunft','transport','essen','aktivitaeten','sonstiges')),
  amount     numeric(10,2) not null check (amount >= 0),
  currency   text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  spent_on   date,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists flights_user_idx  on public.flights (user_id);
create index if not exists flights_trip_idx  on public.flights (trip_id);
create index if not exists trips_user_idx    on public.trips (user_id);
create index if not exists expenses_user_idx on public.expenses (user_id);
create index if not exists expenses_trip_idx on public.expenses (trip_id);

-- ---------- Zugriffsschutz ----------

do $$
declare t text;
begin
  foreach t in array array['visited_countries','wishlist','milestones','user_settings','trips','flights','expenses'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "eigene Daten" on public.%I', t);
    execute format(
      'create policy "eigene Daten" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Zugriff über die Data API nur für angemeldete Nutzer (Zeilen filtert die Policy oben)
grant select, insert, update, delete on
  public.visited_countries, public.wishlist, public.milestones, public.user_settings,
  public.trips, public.flights, public.expenses
to authenticated;
