import { z } from 'zod';

export const EventSchema = z.object({
  title: z.string().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  location: z.string().min(1),
  description_standard: z.string().min(1),
  description_leicht_lesen: z.string().optional(),
  accessibility_features: z.array(z.string()).default([]),
  // Orbiter auto-resolves relation fields declared without `multiple: false`
  // as arrays (confirmed against @a83/orbiter-integration's _resolveRelations:
  // an unset relation becomes `[]`, a set one becomes an array of resolved
  // entry objects) — never a plain string. An event with no gallery_id set
  // was failing this validation and 404ing, undetected until a real Event
  // entry existed to exercise the path.
  gallery_id: z.union([z.string(), z.array(z.unknown())]).optional(),
});
export type Event = z.infer<typeof EventSchema>;
