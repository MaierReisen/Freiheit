# Freiheit – by Maier Reisen

Reise-App (PWA): besuchte Länder auf Globus/Karte sammeln, Länderseite mit Fakten, Einreise, Klima, Highlights.
Live: https://maierreisen.github.io/Freiheit/ · Repo: MaierReisen/Freiheit · nur auf Einladung.

## Zusammenarbeit
- Nutzer (Patrick) ist Deutsch, kein Entwickler: Antworten auf Deutsch, kurz, ohne Fachjargon; Schritte mit genauen Menüpfaden.
- Supabase-Dashboard-Änderungen macht der Nutzer selbst. Nie Secret-/service_role-Key oder DB-Passwort in den Chat; Nutzer soll keine Tokens einfügen.
- Keine Konten anlegen, keine Zugangsdaten eingeben. E-Mail des Nutzers nie an externe Dienste; für Datenabrufe User-Agent `Freiheit-App-Datenaufbereitung/1.0`.
- Parallele Sitzungen: Läuft schon eine andere Sitzung im Ordner (`git status` zeigt fremde Änderungen) und die Arbeit ist größer, in einem eigenen Worktree arbeiten (`EnterWorktree`, eigener Zweig unter `.claude/worktrees/`), damit sich nichts überschneidet; fertig → Zweig mit `main` abgleichen (`sync_with_base_branch`) und über `/release` veröffentlichen. Alte, nicht mehr gebrauchte Worktrees nur nach Rückfrage entfernen.
- Commits/Pushes auf `main` sind erwünscht, wenn ein Feature fertig und geprüft ist (Push = Veröffentlichung).

## Technik
- SvelteKit 2 / Svelte 5 (Runes) / TypeScript / Tailwind 4 / vite-plugin-pwa, adapter-static, base path `/Freiheit`.
- Backend Supabase (Auth per Magic Link + OTP, Schema in `supabase/schema.sql`).
- Deploy: GitHub Actions (`.github/workflows/deploy.yml`) bei Push auf `main` und täglich per Cron (Einreisedaten werden nur nachts bzw. bei Start von Hand aktualisiert, nicht bei Push; nach Änderung an `build-entry.py`: `gh workflow run deploy.yml`). Verfolgen mit `gh run watch`.
- Lokal ist Node 24 installiert (`/usr/local/bin`), passt (Startkonfiguration `dev-5175` in `.claude/launch.json`). `gh` liegt in `~/.local/bin`.
- Prüfen: `npm run check` (muss 0 Fehler haben) und `npm run build`. Schnelltest der Kernseiten (Konsolenfehler, Inhalte): `node tests/smoke.mjs` (startet die App selbst, nutzt Brave/Chrome; einmalig `cd tests && npm i`). Zeigt auch, wenn die Startseite wegen halbfertiger Arbeit anderer Sitzungen nicht lädt. Kein Prettier über ganze Dateien laufen lassen (formatiert sonst alles um).

## Navigation (Konzept, seit v1.37.2)
- **Tabs** = gleichrangige Bereiche in der Leiste unten (`TABS`/`TAB_LABEL` in `app.svelte.ts`, Icon in `TabBar.svelte`). Erster Tab heißt in der App **„Welt“** (interne ID `home`; Globus + Blöcke „Deine Welt“). Geplant: Flüge, Reisen o. ä.; der Globus ist kein Tab-Name, sondern ein Element, das auch dort vorkommen darf. Bis zum zweiten Tab bleibt die Leiste ausgeblendet. Höchstens 4–5 Tabs; Weiteres (Einstellungen) hinter ein Symbol oben.
- **Wischen zwischen Tabs** (waagerecht, nur zum Nachbar-Tab, in `Main.svelte`; nicht auf Globus/Karte, Rand frei) ist erwünscht. Tabwechsel schreibt keinen Verlauf (`replaceState`), also kein Blättern durch besuchte Seiten.
- **Ebenen** über einem Tab: Blatt von unten = Detail zu einer Sache (Land, Rang); Vollbild-Seite = Bereich (Pass, Länder, Kontinente, Einstellungen, Vollbild-Karte). Ebenen schreiben **keinen Verlaufseintrag**: die iOS-Zurück-Geste vom Rand schließt nichts und blättert nie. Geschlossen wird einheitlich per **Wischen nach unten** (`swipeClose.ts`, Pass hat eigene Logik, weil dort waagerecht geblättert wird) oder Schließen-Knopf; kein Wischen zur Seite zum Schließen.

## Version
- Schema `MAJOR.MINOR.PATCH` in `package.json` (`version`), angezeigt in Einstellungen → App. **Bei jeder Änderung hochzählen**: PATCH = Fehlerkorrektur/Daten/Texte, MINOR = neue Funktion (PATCH dann 0), MAJOR = grundlegender Umbau (Rest 0).

## Aufbau und Daten
Ausführliche Beschreibung aller Bauteile (Karte, Länderseite, Pass, Stempel, Abzeichen, Teilen, Länderlisten, Datenquellen): **`docs/AUFBAU.md`** – vor Arbeit an einem Bereich den passenden Absatz lesen. Stempel/Galerie: `docs/STEMPEL.md`, `docs/stempel.html`.
- Kernordner: `src/lib/components/` (Oberfläche), `src/lib/map/` (Karte/Globus), `src/lib/data/` (Daten, erzeugt durch `scripts/`), `src/lib/passport.ts` + `scenes.ts` (Stempel), `src/lib/scope.ts` (Länderlisten), `src/lib/badges.ts`, `src/lib/wonders.ts`.
- Regeln beim Ändern:
  - Stempel, Bilder, Chancen, Ränge, Abzeichen → `node scripts/build-stempel-doc.mjs` und `node scripts/build-stempel-galerie.mjs`, Ergebnis mit committen (nie von Hand ändern).
  - Kartendaten, `map/geoinfo.ts` oder `map/lodcore.ts` → `node scripts/build-geoinfo.mjs`.
  - `scripts/build-entry.py` → nach dem Push `gh workflow run deploy.yml`.
  - Alphabetisch immer über `compareNames()` in `countries.ts`; Ländernamen über `nameOf()`.
  - `highlights.json` nur von Hand: max. 5 je Land, nur zeitgebundene Must-sees (Details in `docs/AUFBAU.md`).

## Stil
- Optik der App beibehalten: Farben/Abstände über Tokens in `src/app.css`, hell + dunkel, Handybreite zuerst.
- Performance ist wichtig: nichts Teures beim Antippen berechnen; vorberechnen, cachen, Daten parallel laden.
