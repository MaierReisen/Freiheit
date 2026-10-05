# Freiheit – by Maier Reisen

Persönliche Reise-App zum Sammeln von bereisten Ländern und Wunschzielen. Geplant: Reisen, Flüge, Flughäfen und Kostenübersicht.

SvelteKit · TypeScript · Tailwind CSS · PWA (vite-plugin-pwa) · statisch gebaut mit adapter-static, gehostet auf GitHub Pages unter `/Freiheit`.

## Entwicklung

Voraussetzung: Node.js 22 (siehe `.nvmrc`).

```bash
npm install
npm run dev       # http://localhost:5173 (ohne Base-Path)
npm run check     # Typprüfung
npm run build     # statischer Build nach build/ mit Base-Path /Freiheit
npm run preview   # Build ansehen unter http://localhost:4173/Freiheit/
npm run icons     # PWA-Icons aus static/icon.svg neu erzeugen
```

## Struktur

| Pfad | Inhalt |
| --- | --- |
| `src/lib/data/` | Weltkarte (TopoJSON 50m), ISO-Numerisch → Alpha-2, Kontinente |
| `src/lib/countries.ts` | Ländernamen (deutsch), Flaggen, Kontinente |
| `src/lib/atlas.svelte.ts` | Daten-Store: lokaler Cache, Sync-Warteschlange zu Supabase, JSON-Export/-Import |
| `src/lib/auth.svelte.ts`, `src/lib/supabase.ts` | Supabase-Client und Login |
| `src/lib/app.svelte.ts` | UI-Zustand: Tabs, Sheets, Vollbild-Karte, Hash-Navigation, Toast |
| `src/lib/map/` | Canvas-Weltkarte (Globus und flache Karte), Detailstufen |
| `src/lib/components/` | Svelte-Komponenten der Oberfläche (Einstellungen: `SettingsView.svelte`) |
| `src/app.css` | Design (Farben, Typografie, Komponenten-Styles) |

## Daten und Login

Login per Magic Link (Supabase Auth); die Mail enthält zusätzlich einen Code für die App auf dem Home-Bildschirm.
Daten liegen in Supabase (`supabase/schema.sql`, geschützt per Row Level Security) und werden lokal zwischengespeichert,
damit die App offline funktioniert. Änderungen gehen über eine Warteschlange an Supabase. Beim ersten Login werden
Länder aus der früheren Version ohne Konto (localStorage `freiheit-state-v2`) ins Konto übernommen.

Einrichtung in Supabase:
1. `supabase/schema.sql` im SQL Editor ausführen (neues Projekt). Bestehende Projekte: neue Dateien aus `supabase/migrations/` ausführen.
2. *Authentication → URL Configuration*: Site URL `https://maierreisen.github.io/Freiheit/`, Redirect URLs zusätzlich `http://localhost:5173/**` und `http://localhost:4173/Freiheit/**`.
3. *Authentication → Emails → SMTP Settings*: eigenes SMTP (Brevo, `smtp-relay.brevo.com:587`), sonst sind die Templates gesperrt.
4. *Authentication → Emails → Templates → Magic Link* und *Confirm signup*: `{{ .Token }}` in die Mail aufnehmen.

## Deployment

`.github/workflows/deploy.yml` baut bei jedem Push auf `main` und veröffentlicht auf GitHub Pages. Dafür muss in den Repository-Einstellungen unter *Settings → Pages → Build and deployment* die Quelle **GitHub Actions** gewählt sein.
