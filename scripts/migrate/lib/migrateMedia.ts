import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export const ALT_TEXT_PLACEHOLDER = '[ALT-TEXT TODO: Bild manuell beschreiben]';

const MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf', '.gif']);
const RESIZE_SUFFIX = /-\d+x\d+$/;

export function isResizedVariant(filename: string): boolean {
  const base = path.basename(filename, path.extname(filename));
  return RESIZE_SUFFIX.test(base);
}

export function resolveAltText(
  postId: string,
  filename: string,
  postmeta: Map<string, Array<{ key: string; value: string }>>,
): string {
  const meta = postmeta.get(postId) ?? [];
  const alt = meta.find((m) => m.key === '_wp_attachment_image_alt')?.value;
  return alt && alt.trim().length > 0 ? alt : ALT_TEXT_PLACEHOLDER;
}

export function collectOriginalMediaFiles(uploadsDir: string): string[] {
  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) { walk(full); continue; }
      const ext = path.extname(entry).toLowerCase();
      if (!MEDIA_EXTENSIONS.has(ext)) continue;
      if (isResizedVariant(entry)) continue;
      results.push(full);
    }
  };
  walk(uploadsDir);
  return results;
}
