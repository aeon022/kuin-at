import { z } from 'zod';

export const PageSchema = z.object({
  title: z.string().min(1),
  content_standard: z.string().min(1),
  content_leicht_lesen: z.string().optional(),
  seo_description: z.string().max(320).optional(),
});
export type Page = z.infer<typeof PageSchema>;
