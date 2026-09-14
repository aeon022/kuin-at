import { z } from 'zod';

// cover_image is a plain Orbiter media-id string (the entry stores a
// reference; Orbiter's own `image` field type works this way — see
// setup-collections.ts). The required alt text lives on the `_media` row
// itself, enforced when the media is uploaded (Task 8), not duplicated
// here. Resolve it at render time via `getMediaItem` from 'orbiter:media'.
export const BlogPostSchema = z.object({
  title: z.string().min(1),
  published_at: z.string().datetime(),
  // Optional: 21 of the 25 migrated WP posts have no featured image at all.
  cover_image: z.string().optional(),
  content_standard: z.string().min(1),
  content_leicht_lesen: z.string().optional(),
});
export type BlogPost = z.infer<typeof BlogPostSchema>;
