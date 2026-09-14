import { z } from 'zod';

export const EventSchema = z.object({
  title: z.string().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  location: z.string().min(1),
  description_standard: z.string().min(1),
  description_leicht_lesen: z.string().optional(),
  accessibility_features: z.array(z.string()).default([]),
  gallery_id: z.string().optional(),
});
export type Event = z.infer<typeof EventSchema>;
