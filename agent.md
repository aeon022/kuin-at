# Projektkontext: kuin.at (Kultur Inklusiv) Relaunch

## Vision & Ziel
Umbau der bestehenden WordPress/Oxygen-Website von "Kultur Inklusiv Graz" auf einen modernen, pfeilschnellen und 100% barrierefreien Tech-Stack. Die Website muss Inklusion atmen – sowohl technisch als auch inhaltlich. 

## Tech-Stack (Less Noise. Nice Data. No Bloat.)
- **Framework:** Astro (SSG / SSR für Live-Daten)
- **Styling:** Tailwind CSS v4
- **Typisierung:** TypeScript + Zod
- **Backend/CMS:** Orbiter (orbiter.sh) als Headless CMS
- **State Management:** Nano Stores (für den globalen "Leicht Lesen"-Toggle)

## Design- & Migrations-Vorgaben
- **Datenquelle (`import-source`):** Der Agent nutzt die WordPress-Exportdaten im Ordner `import-source`, um Farben, Texte und Medien zu extrahieren.
- **Design:** Das neue Design soll modern, reduziert ("No Bloat") und hochgradig inklusiv sein. Die alten WordPress-Farben werden extrahiert und als Basis für das Tailwind v4 Theme genutzt (angepasst für optimale Kontraste).
- **Medien-Migration:** Bilder und Dokumente aus `import-source` müssen programmatisch in Orbiter hochgeladen werden. Bildbeschreibungen (Alt-Texte) sind ein kritischer Faktor und müssen zwingend in Orbiter mitgespeichert werden.

## Kernanforderungen
1. **100% Barrierefreiheit (WCAG 2.1 AAA):**
   - Striktes, semantisches HTML (`<main>`, `<article>`, `<nav>`, etc.).
   - Alle interaktiven Elemente müssen über die Tastatur bedienbar sein (`focus-visible:ring` ist Pflicht).
   - Zwingende `alt`-Texte für alle Bilder. Kontrastwerte müssen AAA-Standards entsprechen.
2. **"Leicht Lesen" (LL) Funktion:**
   - Ein globaler Schalter in der UI, der die Textkomplexität reduziert.
   - Wenn LL aktiviert ist, wird das Feld `content_leicht_lesen` statt `content_standard` gerendert.
3. **Live-Daten Integration:**
   - Orbiter spielt die Daten über die API/SDK live ein. Schemas in Orbiter sind die Single Source of Truth.

## Orbiter Daten-Schemas (Zod / TypeScript Definitionen)

Alle Schemas müssen ein "Standard"-Feld und ein "Leicht Lesen"-Feld (wo sinnvoll) aufweisen.

### 1. Pages (Seiten)
Für "Über uns", "Manifest", "Barrierefreiheitserklärung".
- `title`: String
- `slug`: String (Unique)
- `content_standard`: Rich Text / Block Editor
- `content_leicht_lesen`: Rich Text / Block Editor (Optional)
- `seo_description`: String

### 2. Events (Veranstaltungen & Walks)
- `title`: String
- `slug`: String
- `start_date`: DateTime
- `end_date`: DateTime
- `location`: String (Adresse oder Treffpunkt)
- `description_standard`: Rich Text
- `description_leicht_lesen`: Rich Text
- `accessibility_features`: Array of Strings (z.B. "Gebärdensprache", "Rollstuhlgerecht")
- `gallery_id`: Relation (Optional)

### 3. Blog (News & Updates)
- `title`: String
- `slug`: String
- `published_at`: DateTime
- `cover_image`: Image (zwingend `alt_text` erforderlich)
- `content_standard`: Rich Text
- `content_leicht_lesen`: Rich Text

### 4. Archive (Galerien)
Rückblicke auf vergangene Walks.
- `title`: String
- `year`: Number
- `description`: Text
- `images`: Array of Objects (`{ image_url, alt_text, caption }`)

### 5. Partners (Netzwerk & Mitglieder)
- `name`: String
- `logo`: Image (zwingend `alt_text` erforderlich)
- `website_url`: String
- `description`: Text
- `is_board_member`: Boolean (Vorstand vs. normales Mitglied)

### 6. Downloads
- `title`: String
- `file`: File
- `description`: Text

## Entwicklungsrichtlinien
- Erstelle keine eigenen, überladenen UI-Bibliotheken, nutze das native HTML/CSS über Tailwind v4.
- Keine "div-Suppe". Nutze das korrekte HTML-Tag für den jeweiligen Job.
- Überlege bei jeder UI-Komponente zuerst, wie ein Screenreader sie vorlesen würde.
