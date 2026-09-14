import { z } from 'zod';

// logo is a plain Orbiter media-id string — same reasoning as
// BlogPostSchema.cover_image above.
export const PartnerSchema = z.object({
  name: z.string().min(1),
  logo: z.string().min(1),
  website_url: z.string().url().optional(),
  description: z.string().optional(),
  is_board_member: z.boolean().default(false),
});
export type Partner = z.infer<typeof PartnerSchema>;
