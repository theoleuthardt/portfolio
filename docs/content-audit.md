# Content-Audit des Bestandsportfolios

Stand: 2026-10-24, Commit `cbad1ca` auf `master`. Grundlage für den Umbau zum interaktiven Terminal/HUD-Portfolio mit Three.js-Rack-Szene (Epics #17, #18).

Bewertung: **behalten** (unverändert übernehmen), **überarbeiten** (Inhalt bleibt, Umsetzung ändert sich), **verwerfen** (fällt weg).

## 1. Seiten und Abschnitte

Die Seite ist eine einzige Scroll-Seite ohne echte Routen.

| Abschnitt     | Inhalt                                                                                  | Bewertung    | Begründung                                                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero          | Typewriter „Hii! I'm Theo.“ → „Welcome to my Portfolio!“, Button „Explore my projects!“ | überarbeiten | Begrüßung und Tippeffekt passen zum Terminal. Sie werden zur Boot-Sequenz bzw. zum MOTD des Terminals, ohne die Bibliothek.                                                     |
| Projects      | Raster mit 6 Projektkarten (Icon und Titel, Link)                                       | überarbeiten | Die Projekte sind der Kern. Sie werden Rack-Module in der 3D-Szene und der Befehl `projects` im Terminal. Bisher gibt es nur einen Titel ohne Beschreibung und ohne Tech-Stack. |
| Impressum     | Name, Adresse, Telefon, E-Mail (Komponente wird nicht gerendert)                        | verwerfen    | Laut Vorgabe raus (#21). Sie wird ohnehin nirgends angezeigt.                                                                                                                   |
| „Career Path“ | nur `careerpathRef` und Navbar-Zweige, kein Abschnitt                                   | verwerfen    | Toter Code, den es nie als Abschnitt gab. Ob ein `about`/`cv`-Befehl kommt, siehe offene Fragen.                                                                                |

## 2. Inhalte (`src/constants/index.ts`)

### Navigation (`navLinks`)

| Eintrag    | Ziel                          | Bewertung    | Begründung                                                                           |
| ---------- | ----------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| Home       | Scroll nach oben              | überarbeiten | Wird zu `clear` bzw. `home` im Terminal.                                             |
| Projects   | Scroll zum Abschnitt          | überarbeiten | Wird zu `projects` und zum Kamerafokus aufs Rack.                                    |
| Github     | github.com/theoleuthardt      | behalten     | Wichtigster Link für ein Entwicklerportfolio, geplant als `contact`/`socials`.       |
| AlexInABox | alexinabox.de                 | behalten     | Freundes- bzw. Partnerportfolio, geplant als Befehl `friends` statt Hauptnavigation. |
| Lagopodus  | lagopodus.github.io/portfolio | behalten     | Wie AlexInABox.                                                                      |

### Projekte (`projects`)

| Projekt               | Link                         | Bewertung    | Begründung                                                                     |
| --------------------- | ---------------------------- | ------------ | ------------------------------------------------------------------------------ |
| Werkzeugkiste         | toolbox.theocloud.dev        | überarbeiten | Live-Projekt. Braucht Beschreibung und Stack.                                  |
| Network Interaction   | GitHub                       | überarbeiten | Passt thematisch perfekt zum Rack (Netzwerk-Modul). Braucht eine Beschreibung. |
| Homelab Docker        | GitHub                       | überarbeiten | Passt zur Rack/Homelab-Szene. Braucht eine Beschreibung.                       |
| Python Best Practices | GitHub                       | überarbeiten | Braucht eine Beschreibung. Das Icon ist viel zu groß (siehe Assets).           |
| Dino Game             | GitHub                       | überarbeiten | Braucht eine Beschreibung. Eignet sich als Easter Egg (`play dino`).           |
| Grow Green            | GitHub Releases (AlexInABox) | überarbeiten | Gemeinschaftsprojekt. Die Rolle sollte genannt werden.                         |

Projekte, die auf GitHub existieren, aber hier fehlen (zum Beispiel Backlog Manager, für den sogar schon `backlog-icon.svg` im Repo liegt), stehen unter den offenen Fragen.

## 3. Komponenten

| Datei                          | Zweck                                    | Bewertung    | Begründung                                                                                                                                                                                                                                                                                             |
| ------------------------------ | ---------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/App.tsx`                  | Layout, `AnimatedBackground`, Refs       | überarbeiten | Wird zu Canvas plus Terminal-Overlay. `BrowserRouter` ohne Routen und die Klasse `bg-hero-pattern` ohne Definition fallen weg.                                                                                                                                                                         |
| `src/components/Navbar.tsx`    | Desktop- und Mobile-Navigation           | verwerfen    | Navigation läuft künftig über das Terminal (Befehle und klickbare Vorschläge). Außerdem fehlerhaft: `link.type in [...]` prüft Array-Indizes und ist immer `false`. Das Mobile-Menü baut für AlexInABox und Lagopodus `#id`-Anker statt externer Links. Die Logik ist doppelt und hängt an den Titeln. |
| `src/components/Hero.tsx`      | Typewriter-Hero                          | verwerfen    | Ersetzt durch die Boot-Sequenz des Terminals (siehe Seiten).                                                                                                                                                                                                                                           |
| `src/components/Projects.tsx`  | Projektraster                            | überarbeiten | Datenmodell bleibt, die Darstellung wird ein Rack plus Terminal-Ausgabe. Alle Bilder haben das Alt-Attribut `alt="backlogIcon"`, die Breiten sind vertauscht (`w-[40rem] sm:w-[20rem]`) und Links haben weder `target` noch `rel`.                                                                     |
| `src/components/Button.tsx`    | Glas-Button                              | verwerfen    | Wird im Terminal-Design nicht gebraucht. Er wird zudem doppelt exportiert (named und default).                                                                                                                                                                                                         |
| `src/components/Impressum.tsx` | Impressum                                | verwerfen    | #21.                                                                                                                                                                                                                                                                                                   |
| `src/components/index.ts`      | Barrel-Export                            | überarbeiten | Wird an die neuen Komponenten angepasst.                                                                                                                                                                                                                                                               |
| `src/styles.ts`                | Tailwind-Klassenstrings                  | verwerfen    | Nur `paddingX` wird benutzt. Ersetzt durch Design-Tokens (#30).                                                                                                                                                                                                                                        |
| `src/index.css`                | Poppins-Import, Gradients, `rainbowText` | verwerfen    | Bis auf `rainbowText` ist kein Gradient in Gebrauch. Neue Typo (Monospace) und Effekte kommen aus #30.                                                                                                                                                                                                 |
| `tailwind.config.ts`           | Farben, Schatten, Breakpoint `xs`        | überarbeiten | Tailwind bleibt, Farben und Typografie werden durch Tokens ersetzt.                                                                                                                                                                                                                                    |
| `src/types/*.d.ts`             | Modul-Deklarationen                      | verwerfen    | Werden mit `animated-backgrounds` und `typewriter-effect` überflüssig.                                                                                                                                                                                                                                 |
| `index.html`                   | Titel „Theo“, Favicon                    | überarbeiten | Es fehlen Meta-Description, Open-Graph-Tags, `theme-color` und eine `noscript`-Alternative. `lang="en"` muss zur Sprachentscheidung passen.                                                                                                                                                            |

## 4. Assets

| Datei                                                       | Größe                 | Nutzung                 | Bewertung    | Begründung                                                                                                                          |
| ----------------------------------------------------------- | --------------------- | ----------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/assets/logo_me.png`                                    | 84 KB, 256×256        | Navbar, Favicon         | überarbeiten | Behalten als Avatar/Favicon, aber als WebP und mit eigenen Favicon-Größen.                                                          |
| `public/logo_me.png`                                        | 84 KB                 | ungenutzt               | verwerfen    | Duplikat von `src/assets/logo_me.png`.                                                                                              |
| `src/assets/python.png`                                     | **821 KB**, 3000×3000 | Projekt-Icon (40×40 px) | überarbeiten | 92 % aller Asset-Bytes. Auf ein Icon in passender Größe oder ein SVG verkleinern.                                                   |
| `src/assets/godot.png`                                      | 102 KB, 2048×2048     | Projekt-Icon            | überarbeiten | Wie python.png.                                                                                                                     |
| `src/assets/docker.png`, `network.png`, `dinosaur-game.png` | 1–8 KB                | Projekt-Icons           | überarbeiten | Größe ist in Ordnung. Im Rack werden sie Texturen bzw. Labels, ein einheitlicher Stil wäre gut.                                     |
| `src/assets/toolbox.svg`                                    | 2 KB                  | Projekt-Icon            | behalten     | Ist bereits ein SVG.                                                                                                                |
| `src/assets/backlog-icon.svg`                               | 2 KB                  | ungenutzt               | überarbeiten | Behalten, falls Backlog Manager als Projekt dazukommt (offene Frage). Sonst verwerfen.                                              |
| `src/assets/github.png`                                     | 11 KB                 | ungenutzt               | verwerfen    | Nicht referenziert. Wird künftig ein SVG-Icon, falls gebraucht.                                                                     |
| `src/assets/menu.svg`, `close.svg`                          | 1 KB                  | Burger-Menü             | verwerfen    | Fallen mit der Navbar weg.                                                                                                          |
| Google Fonts „Poppins“ (extern)                             | –                     | global                  | verwerfen    | Wird von `fonts.googleapis.com` geladen und überträgt dabei IP-Adressen an Google. Die neue Monospace-Schrift wird selbst gehostet. |

## 5. Abhängigkeiten

Installierte Versionen laut `npm outdated`. Die CVE-Bewertung folgt in #22, Major-Updates nur nach Rückfrage.

| Paket                                                         | Version          | Bewertung    | Begründung                                                                                                                                            |
| ------------------------------------------------------------- | ---------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react`, `react-dom`                                          | 18.3.1           | behalten     | Basis. Ob auf React 19 gewechselt wird, entscheidet sich bei #22 und #18 (aktuelles `@react-three/fiber` setzt React 19 voraus, siehe Hinweis unten). |
| `animated-backgrounds`                                        | 1.1.0            | verwerfen    | Wird durch die Three.js-Szene ersetzt.                                                                                                                |
| `typewriter-effect`                                           | 2.22.0           | verwerfen    | Der Tippeffekt des Terminals ist ein paar Zeilen eigener Code und testbar.                                                                            |
| `framer-motion`                                               | 11.18.2          | verwerfen    | Nirgends importiert.                                                                                                                                  |
| `react-router-dom`                                            | 6.30.1           | verwerfen    | Nur ein `BrowserRouter` ohne Routen. Deep Links wie `/projects` lassen sich später gezielt neu bewerten.                                              |
| `tailwindcss`, `postcss`, `autoprefixer`                      | 3.4 / 8.5 / 10.4 | behalten     | Bleiben für das UI-Overlay.                                                                                                                           |
| `vite`, `@vitejs/plugin-react`, `typescript`                  | 7.1 / 4.7 / 5.9  | behalten     | Stack-Entscheidung: Vite.                                                                                                                             |
| `eslint` 8, `@typescript-eslint/*` 7, `eslint-plugin-react-*` | –                | überarbeiten | ESLint 8 ist End-of-Life. Ein Wechsel auf ESLint 9 mit Flat Config wäre ein Major-Update (Rückfrage in #22).                                          |
| `prettier`                                                    | 3.3.3            | behalten     | Bisher ohne Skript. `format`/`format:check` kommen mit #23/#25.                                                                                       |
| neu: `three`, `@react-three/fiber`, `@react-three/drei`       | –                | neu          | Für #18, vorher `npm audit`.                                                                                                                          |
| neu: `vitest`, `@testing-library/react`, `jsdom`              | –                | neu          | Für #24.                                                                                                                                              |

Hinweis: `@react-three/fiber` v9 verlangt React 19, v8 läuft mit React 18. Ob auf React 19 gewechselt wird, ist eine Major-Entscheidung und wird bei #22 bzw. vor #18 abgefragt.

## 6. Build, Tooling und CI

| Punkt                             | Befund                                                                                                                   | Bewertung                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `npm run build`                   | grün, JS 224 KB (71 KB gzip)                                                                                             | behalten                                          |
| `npm run lint`                    | grün                                                                                                                     | behalten                                          |
| Tests                             | keine                                                                                                                    | überarbeiten → Vitest und TDD (#24)               |
| `npm audit`                       | 19 Findings (1 low, 3 moderate, 15 high)                                                                                 | überarbeiten → #22                                |
| `.github/workflows/portfolio.yml` | Deployt bei jedem Push auf `master` nach GitHub Pages, ohne Lint und Tests, mit Node 20 und toter Paketmanager-Erkennung | überarbeiten → #25, #28                           |
| `CNAME`                           | `theocloud.dev`                                                                                                          | behalten (Deployment-Ziel wird in #28 abgestimmt) |
| `README.md`                       | nur „Small Portfolio“                                                                                                    | überarbeiten                                      |
| `vite.config.ts`                  | Kommentar-Link aus dem Template                                                                                          | überarbeiten (Kommentar-Regel)                    |

## 7. Offene Fragen an Theo

1. **Projektauswahl:** Sollen weitere Projekte rein, etwa Backlog Manager (Icon liegt schon im Repo), und gibt es Projekte, die rausfallen?
2. **Projekttexte:** Liefert Theo die Kurzbeschreibungen (1–2 Sätze, Stack, Rolle), oder soll ich Entwürfe aus den READMEs der Repos schreiben, die Theo dann freigibt?
3. **About/CV:** Soll es einen Befehl `about` bzw. `whoami` mit Text über Theo geben (Ausbildung, Stack, Interessen)? Wenn ja, mit welchen Inhalten?
4. **Kontakt:** Welche Kanäle sollen sichtbar sein (GitHub, E-Mail, LinkedIn, …)?
5. **Sprache:** Englisch (wie bisher), Deutsch oder beides mit einem Befehl `lang`?
