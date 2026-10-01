/**
 * One-off (2026-10-01): the three autumn events from the Coming-Soon page, taken only from
 * the flyer / Save-the-Date / newsletter — nothing invented.
 *  - Workshop-Tag: "ganztags ab 9:30 Uhr" → end = start (open end, shown as "ab 09:30 Uhr")
 *  - Oper Graz: no time published yet → start 00:00 (shown without time), end = start
 * Idempotent. Run: ORBITER_POD=... node scripts/migrate/add-events-herbst-2026.ts
 */
import { openPod } from '@a83/orbiter-core';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const db = openPod(process.env.ORBITER_POD || './content.pod');
// files are the ones used on the Coming-Soon page (copied to import-source/mail/ on the server)
function media(file: string, mime: string, alt: string | null) {
  const buf = readFileSync(`import-source/mail/${file}`);
  const id = randomUUID();
  db.insertMedia(id, file, mime, buf.length, buf, alt);
  return `/orbiter/media/${id}`;
}

const KUG = 'Kunstuniversität Graz, Brandhofgasse 21, 8010 Graz';
const EVENTS = [
  {
    slug: 'kuin-workshop-tag-mut-2026-10',
    title: 'KUIN Workshop-Tag „MUT“ für Kinder und Jugendliche mit und ohne Behinderungen',
    start_date: '2026-10-24T07:30:00.000Z', // 09:30 MESZ
    end_date: '2026-10-24T07:30:00.000Z',
    location: KUG,
    accessibility_features: ['Barrierefrei zugänglich'],
    description_standard:
      '<p>Ein kreativer Workshop-Tag für Kinder und Jugendliche mit und ohne Behinderungen. Öffentliche Präsentation um 15:00 Uhr.</p>' +
      '<h3>Was bedeutet Mut?</h3><p>Wir finden es zusammen heraus. Am Vormittag gibt es zwei Workshops: <strong>Musik</strong> mit Sunny Lila und <strong>Theater</strong> mit Christoph Pauger und Darsteller*innen der Theaterakademie LebensGroß. Am Nachmittag proben wir für die gemeinsame Abschluss-Präsentation.</p>' +
      '<h3>Wer kann mitmachen?</h3><p>Kinder von 6 bis 16 Jahren mit und ohne Behinderungen, gerne mit Begleitperson.</p>' +
      '<h3>Wie melde ich mein Kind an?</h3><p>Schreib ein Mail an <a href="mailto:office@kuin.at">office@kuin.at</a> bis 20. Oktober 2026. Bitte gib auch an, ob dein Kind lieber Musik machen oder Theater spielen möchte.</p>' +
      '<h3>Unser Zeitplan</h3><ul><li><strong>9:30 Uhr:</strong> Ankommen und Aufwärmen</li><li><strong>10:00 bis 12:00 Uhr:</strong> Workshops</li><li><strong>12:00 bis 13:00 Uhr:</strong> Gemeinsames Mittagessen</li><li><strong>13:00 bis 15:00 Uhr:</strong> Proben</li><li><strong>15:00 Uhr:</strong> Öffentliche Präsentation in der Aula</li></ul>' +
      '<h3>Gut zu wissen</h3><p>Die Teilnahme ist kostenlos. Alle Räume sind barrierefrei zugänglich. Für die Workshop-Teilnehmer*innen gibt es Getränke, Snacks und Pizza. Es werden Fotos und Videos gemacht.</p>' +
      '<p>Künstlerische Leitung: Matthias Ohner</p>',
    flyers: true,
  },
  {
    slug: 'kuin-konferenz-2026-11',
    title: 'KUIN Konferenz zur kulturellen Teilhabe von Kindern und Jugendlichen mit Behinderungen',
    start_date: '2026-11-11T08:00:00.000Z', // 09:00 MEZ
    end_date: '2026-11-11T15:00:00.000Z', // 16:00 MEZ
    location: KUG,
    accessibility_features: ['Barrierefrei zugänglich', 'Gebärdensprache'],
    description_standard:
      '<p>Der Verein Kultur Inklusiv (KUIN) lädt zur Konferenz zur kulturellen Teilhabe von Kindern und Jugendlichen mit Behinderungen.</p>' +
      '<p>Am Programm der Weiterbildungsveranstaltung stehen Kurzvorträge von Expert*innen aus den Bereichen Pädagogik und Forschung, Kunst und Kultur sowie Erfahrungsberichte und künstlerische Beiträge. Das genaue Programm wird demnächst veröffentlicht.</p>' +
      '<p>Die Veranstaltung richtet sich an alle Menschen, die sich mit der Vermittlung und der Ausübung von Kunst und Kultur für Kinder und Jugendliche mit Behinderungen auseinandersetzen und in diesem Bereich tätig sind bzw. tätig sein wollen, z. B. Pädagog*innen im (Musik-)Schulbereich, Studierende, Personal in diversen Betreuungseinrichtungen, Freizeit-Assistent*innen, Kulturschaffende, Sozialarbeiter*innen in Jugendzentren, diverse Multiplikator*innen im Bereich der Kinder- und Jugendkultur. Alle Interessierten sind herzlich willkommen!</p>' +
      '<p>Die Veranstaltung ist kostenlos und barrierefrei zugänglich. Für Verpflegung ist gesorgt. Es gibt eine Dolmetschung in die Österreichische Gebärdensprache (ÖGS).</p>' +
      '<p>Wir ersuchen um <strong>Voranmeldung (begrenzte Teilnehmer*innenzahl)</strong> an <a href="mailto:office@kuin.at">office@kuin.at</a> bis 31.10.2026.</p>' +
      '<p><a href="@@STD@@">Save the Date herunterladen (PDF)</a></p>',
    saveTheDate: true,
  },
  {
    slug: 'kuin-unterwegs-in-der-oper-graz-2026-12',
    title: 'KUIN – Unterwegs in der Oper Graz',
    start_date: '2026-12-08T23:00:00.000Z', // 9.12., 00:00 MEZ = Uhrzeit noch nicht bekannt
    end_date: '2026-12-08T23:00:00.000Z',
    location: 'Oper Graz',
    accessibility_features: ['Tastparcours'],
    description_standard:
      '<p>Ein gemeinsamer inklusiver Kulturspaziergang.</p><p>Zwischen musikalischen Darbietungen, Gesprächen mit Künstler*innen des Hauses und einem Tastparcours bietet sich die Möglichkeit, das Grazer Opernhaus besser kennenzulernen und einen Blick hinter die Kulissen zu werfen.</p>',
  },
];

for (const { slug, flyers, saveTheDate, ...data } of EVENTS as (typeof EVENTS[number] & { flyers?: boolean; saveTheDate?: boolean })[]) {
  if (db.getEntry('events', slug)) { console.log(`skip ${slug} — exists`); continue; }
  if (flyers) {
    const front = media('flyer-mut-vorne.jpg', 'image/jpeg', 'Flyer Vorderseite: Kultur Inklusiv – MUT, ein kreativer Workshop-Tag für Kinder und Jugendliche mit und ohne Behinderungen, Samstag 24. Oktober 2026, ab 9:30 Uhr an der Kunstuniversität Graz, Brandhofgasse 21');
    const back = media('flyer-mut-hinten.jpg', 'image/jpeg', 'Flyer Rückseite: Was bedeutet Mut, wer kann mitmachen, Anmeldung per Mail an office@kuin.at bis 20. Oktober, Zeitplan von 9:30 bis 15:00 Uhr und Informationen zum Verein');
    data.description_standard += `<h3>Flyer</h3><p><img src="${front}" alt="Flyer Vorderseite: Kultur Inklusiv – MUT, ein kreativer Workshop-Tag für Kinder und Jugendliche mit und ohne Behinderungen, Samstag 24. Oktober 2026, ab 9:30 Uhr an der Kunstuniversität Graz, Brandhofgasse 21"> <img src="${back}" alt="Flyer Rückseite: Was bedeutet Mut, wer kann mitmachen, Anmeldung per Mail an office@kuin.at bis 20. Oktober, Zeitplan von 9:30 bis 15:00 Uhr und Informationen zum Verein"></p>`;
  }
  if (saveTheDate) data.description_standard = data.description_standard.replace('@@STD@@', media('kuin-konferenz-save-the-date-2026-11-11.pdf', 'application/pdf', null));
  db.createEntry('events', slug, data, 'published');
  console.log(`added events/${slug}`);
}
db.close();
