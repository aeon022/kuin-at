import { z } from 'zod';

// file is a plain Orbiter media-id string — Orbiter's media-serve route
// (/orbiter/media/:id) already sends the correct filename via
// Content-Disposition, so no separate filename field is needed here.
export const DownloadSchema = z.object({
  title: z.string().min(1),
  file: z.string().min(1),
  description: z.string().optional(),
  // Free-text like people.category — "jahresbericht" groups into /downloads'
  // "Jahresberichte" section and is the only category /archiv also shows
  // (its "Jahresberichte" section would otherwise just be an unfiltered
  // copy of /downloads). Anything else (or empty) falls into "Sonstiges".
  category: z.string().optional(),
});
export type Download = z.infer<typeof DownloadSchema>;
