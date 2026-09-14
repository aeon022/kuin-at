// One-off: add the real, currently-planned KUIN event.
//
// The old WordPress "Veranstaltungen" page never had a working "start date"
// field (Anita's own email, 10.7.2026: "Beim Programm 2026 ... finde ich
// keine Möglichkeit, das angezeigte Feld 'Wann findet die Veranstaltung
// statt' zu befüllen") — so she inserted a flyer JPG as a placeholder
// instead (import-source/uploads/2026/07/KUIN-Programm-2026.jpg, already
// migrated as the cover image of the "Programm 2026" blog post). The real
// event details only exist as text printed on that flyer image. Read
// directly from it (not invented): "KUIN – Unterwegs in Graz", Fr.
// 25.9.2026, 15:00–17:15, Treffpunkt Atelier Randkunst von LebensGroß.
//
// The flyer also lists 3 further "Vorschau" (save-the-date) items for
// Oct/Nov/Dec 2026 with no time or location given — NOT added here, since
// inventing a time/location for those would misrepresent them as
// confirmed. Noted in stage.md for the client to add via the Orbiter
// admin once full details exist.
import { openPod } from '@a83/orbiter-core';

const db = openPod('./content.pod');

const existing = db.getEntry('events', 'kuin-unterwegs-in-graz-2026-09');
if (existing) {
  console.log('already exists, skipping');
} else {
  db.createEntry('events', 'kuin-unterwegs-in-graz-2026-09', {
    title: 'KUIN – Unterwegs in Graz',
    start_date: '2026-09-25T13:00:00.000Z', // 15:00 CEST
    end_date: '2026-09-25T15:15:00.000Z',   // 17:15 CEST
    location: 'Treffpunkt: Atelier Randkunst von LebensGroß, Anzengrubergasse 8/1, Graz',
    description_standard:
      '<p>Ein gemeinsamer inklusiver Kultur-Spaziergang für Kinder und Familien.</p>' +
      '<h3>Ablauf</h3>' +
      '<ul>' +
      '<li><strong>Kreativer Workshop: Wir machen Fahnen!</strong><br>im Atelier Randkunst von LebensGroß, Anzengrubergasse 8/1</li>' +
      '<li><strong>Musikalische Wegbegleitung</strong><br>mit Musiker*innen von der Young Academy Styria (YAS) der Kunstuniversität Graz</li>' +
      '<li><strong>Mitmach-Theaterstück „Forscherixa und die wilde Hummel"</strong><br>im Frida &amp; freD – Das Grazer Kindermuseum, Friedrichgasse 34</li>' +
      '</ul>' +
      '<p>Der Walk wird von einer Dolmetscherin für die Österreichische Gebärdensprache begleitet. Um besser planen zu können, ersuchen wir um Anmeldung an <a href="mailto:office@kuin.at">office@kuin.at</a> bis 20.9.2026.</p>',
    accessibility_features: ['Gebärdensprache'],
  }, 'published');
  console.log('created events/kuin-unterwegs-in-graz-2026-09');
}

db.close();
