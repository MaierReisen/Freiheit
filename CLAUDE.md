# Freiheit – by Maier Reisen

Reise-App (PWA): besuchte Länder auf Globus/Karte sammeln, Länderseite mit Fakten, Einreise, Klima, Highlights.
Live: https://maierreisen.github.io/Freiheit/ · Repo: MaierReisen/Freiheit · nur auf Einladung.

## Zusammenarbeit
- Nutzer (Patrick) ist Deutsch, kein Entwickler: Antworten auf Deutsch, kurz, ohne Fachjargon; Schritte mit genauen Menüpfaden.
- Supabase-Dashboard-Änderungen macht der Nutzer selbst. Nie Secret-/service_role-Key oder DB-Passwort in den Chat; Nutzer soll keine Tokens einfügen.
- Keine Konten anlegen, keine Zugangsdaten eingeben. E-Mail des Nutzers nie an externe Dienste; für Datenabrufe User-Agent `Freiheit-App-Datenaufbereitung/1.0`.
- Commits/Pushes auf `main` sind erwünscht, wenn ein Feature fertig und geprüft ist (Push = Veröffentlichung).

## Technik
- SvelteKit 2 / Svelte 5 (Runes) / TypeScript / Tailwind 4 / vite-plugin-pwa, adapter-static, base path `/Freiheit`.
- Backend Supabase (Auth per Magic Link + OTP, Schema in `supabase/schema.sql`).
- Deploy: GitHub Actions (`.github/workflows/deploy.yml`) bei Push auf `main` und täglich per Cron (aktualisiert Einreisedaten). Verfolgen mit `gh run watch`.
- Lokal ist Node 14 installiert (zu alt). Node ≥ 20 bei Bedarf als offizielles Tarball ins Scratchpad laden und in den PATH setzen. `gh` liegt in `~/.local/bin`.
- Prüfen: `npm run check` (muss 0 Fehler haben) und `npm run build`. Kein Prettier über ganze Dateien laufen lassen (formatiert sonst alles um).

## Version
- Schema `MAJOR.MINOR.PATCH` in `package.json` (`version`), angezeigt in Einstellungen → App. **Bei jeder Änderung hochzählen**: PATCH = Fehlerkorrektur/Daten/Texte, MINOR = neue Funktion (PATCH dann 0), MAJOR = grundlegender Umbau (Rest 0).

## Aufbau
- `src/lib/components/`: `WorldMap` (Globus/Karte, Halten = aktivieren + ziehen), `CountrySheet` (Länderseite, Schnellkacheln Hauptstadt/Einwohner/Fläche), `EntryCard` (Einreise), `ClimateCard` (Klimadiagramm, beste Reisezeit, Regenzeit/Stürme, Wassertemperatur, Sonnenzeiten, Highlights), `CountryShape` (Minikarte).
- `src/lib/map/`: `engine.ts` (Gesten), `geo.ts` (Umrisse, Caches), `minimap.ts` (Minikarte mit Cache + Vorberechnung der Nachbarn).
- `src/lib/facts.ts`: Datentypen, Lader und Berechnungen (Ortszeit, beste Monate, Regenzeit, Sonnenauf-/-untergang).
- `src/lib/countries.ts`: `nameOf()` – Ländernamen zuerst aus `data/names.json` (feste deutsche Namen).

## Daten (`src/lib/data/`, erzeugt durch `scripts/`)
- `facts.json` ← `build-facts.py` (Wikidata/Natural Earth: Hauptstadt, Einwohner, Fläche, Nachbarn nur Landgrenzen + feste Verbindungen, Berg).
- `entry.json` ← `build-entry.py` (Auswärtiges Amt OpenData) + Handeinordnung `scripts/entry-curated.json`. Ändert das AA Texte, erkennt die Signatur das und die App zeigt den AA-Satz; nach Prüfung mit `--accept` übernehmen.
- `climate.json` ← `build-climate.py` (TerraClimate 1991–2020, Meerestemperatur NOAA OISST, Sturmsaisons kuratiert). Cache in `.climate-cache/` (ignoriert).
- `labels.json` ← `build-labels.mjs` (Namensplatz je Land tief im Land + Innenkreis-Radius für Ländernamen auf Globus/Karte; Ausnahmen von Hand im Skript).
- `water.json` ← `build-water.py` (Natural Earth Flüsse/Seen, Namen korrigiert und eingedeutscht).
- `highlights.json` (in der App „Besonders zur Reisezeit“): von Hand gepflegt, max. 5 je Land, lieber weniger – nur absolute Highlights (Must-sees), NUR zeitgebundene Dinge zur Wahl des Reisezeitraums (Feste, Blüte, Laub, Tierzüge/-saisonen, Polarlicht/Mitternachtssonne, Wasserstände). Keine ganzjährigen Sehenswürdigkeiten, keine Sportevents, keine Bauwerke. Format `{c, t, r?, m:[0-11], v?, d?}`; Kategorien c: fest (Feste aller Art), bluete (Blüte/Laub/Ernte), tier (Land + Meer), natur (Polarlicht, Eis, Wasserstände).

## Stil
- Optik der App beibehalten: Farben/Abstände über Tokens in `src/app.css`, hell + dunkel, Handybreite zuerst.
- Performance ist wichtig: nichts Teures beim Antippen berechnen; vorberechnen, cachen, Daten parallel laden.
