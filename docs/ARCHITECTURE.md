# Architektur

## Ist-Stand

Statische Single-Page-App auf Vite, React und TypeScript. Der Build (`npm run build`) erzeugt `dist/`, das ein GitHub-Actions-Workflow bei jedem Push auf `master` nach GitHub Pages deployt (Domain `theocloud.dev` über `CNAME`). Es gibt kein Backend und keine Laufzeit-API, alle Inhalte sind im Bundle.

```
index.html → src/main.tsx → src/App.tsx
                              ├─ components/Navbar   (Navigation, Mobile-Menü)
                              ├─ components/Hero     (Typewriter-Begrüßung)
                              └─ components/Projects (Projektkarten)
src/constants/index.ts  Inhalte: navLinks, projects
src/assets/             Icons und Bilder
```

Bewertung jedes Teils: [content-audit.md](content-audit.md).

## Zielbild

Die Website ist ein **interaktives Terminal** über einer **Three.js-Szene mit einem Hardware-Rack**. Das Terminal ist die primäre Bedienung (tippen oder Befehle anklicken), die Szene reagiert darauf (Kamerafahrt zum Rack-Modul eines Projekts, LEDs, Glow). Das genaue Design wird in #29 festgelegt; diese Struktur ist der technische Rahmen dafür.

```
src/
├─ content/      Inhalte als typisierte Daten (Projekte, About, Links), ohne React
├─ terminal/     reine Logik: Befehlsparser, Befehlsregister, Ausgabeformat, Verlauf
├─ scene/        Three.js über @react-three/fiber: Rack, Module, Kamera, Effekte
├─ ui/           2D-Overlay: Terminal-Komponente, HUD-Elemente, Fallback-Ansicht
├─ state/        gemeinsamer Zustand zwischen Terminal und Szene (z. B. fokussiertes Projekt)
└─ App.tsx       setzt Canvas, Overlay und Fallback zusammen
```

### Prinzipien

- **Logik ohne React und Three.js.** Befehlsparser, Befehle und Inhalte sind reine TypeScript-Module mit Vitest-Tests. Komponenten rendern nur.
- **Eine Datenquelle.** Projekte und Texte stehen einmal in `content/`; Terminal-Ausgabe und Rack-Module werden daraus erzeugt.
- **Terminal führt, Szene folgt.** Ein Befehl ändert den Zustand in `state/`, die Szene liest ihn. Dadurch funktioniert die Seite auch ohne Szene vollständig.
- **Progressive Enhancement.** Ohne WebGL oder mit `prefers-reduced-motion` gibt es das Terminal ohne bzw. mit ruhiger Szene; die Inhalte sind immer erreichbar.
- **Lazy Loading.** Die 3D-Szene wird als eigener Chunk nachgeladen, das Terminal ist sofort bedienbar.

## Build, CI und Deployment

| Schritt                                                             | Werkzeug                         | Issue |
| ------------------------------------------------------------------- | -------------------------------- | ----- |
| Tests                                                               | Vitest + Testing Library         | #24   |
| Lint, Typecheck, Build, Tests in der CI                             | GitHub Actions                   | #25   |
| Security-Checks (`npm audit --audit-level=high`, Dependency Review) | GitHub Actions                   | #26   |
| Update-PRs                                                          | Dependabot, wöchentlich          | #27   |
| Deployment                                                          | GitHub Pages, nur nach grüner CI | #28   |

## Entscheidungen

| Datum      | Entscheidung                                               | Grund                                                                 |
| ---------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| 2026-10-24 | Bei Vite bleiben, kein Wechsel auf Next.js                 | Statische Seite auf GitHub Pages, kein SSR nötig                      |
| 2026-10-24 | Three.js über `@react-three/fiber` und `@react-three/drei` | Deklarative Szene im React-Baum, gemeinsamer Zustand mit dem Terminal |
| 2026-10-24 | `react-router-dom` entfernt                                | Wurde nicht genutzt; die Navigation läuft über das Terminal           |
| 2026-10-24 | Deployment bleibt vorerst GitHub Pages                     | Bestehende Domain und Workflow, keine Kosten                          |
| 2026-10-24 | React 19 vor dem Three.js-Umbau (#33)                      | `@react-three/fiber` v9 verlangt React 19                             |
