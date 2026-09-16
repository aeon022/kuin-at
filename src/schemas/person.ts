import { z } from 'zod';

// A real person (Vorstand or Team member) — distinct from PartnerSchema,
// which models organizations (logo, no role/bio/social fields).
export const PersonSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  category: z.enum(['vorstand', 'team']),
  photo: z.string().min(1), // Orbiter media-id
  bio: z.string().optional(),
  social_links: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).default([]),
});
export type Person = z.infer<typeof PersonSchema>;
