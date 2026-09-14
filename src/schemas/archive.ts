import { z } from 'zod';

const ArchiveImage = z.object({
  image_url: z.string().min(1),
  alt_text: z.string().min(1, 'alt_text is required for every image'),
  caption: z.string().optional(),
});

export const ArchiveSchema = z.object({
  title: z.string().min(1),
  year: z.number().int(),
  description: z.string().optional(),
  images: z.array(ArchiveImage).default([]),
});
export type Archive = z.infer<typeof ArchiveSchema>;
