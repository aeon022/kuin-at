import type { WpPost } from './parseWpSql.ts';
import type { Page } from '../../../src/schemas/page.ts';
import { extractOxygenContent } from './parseOxygenTree.ts';

export const CONTENT_REVIEW_PLACEHOLDER =
  '<p><em>[INHALT TODO: Für diese Seite konnte kein verwertbarer Inhalt ' +
  'extrahiert werden — manuell aus der Live-Vorschau von kuin.at übertragen.]</em></p>';

export function stripToText(html: string): string {
  return html.replace(/<!--.*?-->/gs, '').trim();
}

export function transformPage(
  post: WpPost,
  oxygenJson: string | undefined,
  resolveImageAlt: (src: string) => string | null,
): { slug: string; data: Page; needsReview: boolean; notes: string[] } {
  const isPublished = post.postStatus === 'publish';

  if (oxygenJson) {
    const { html, notes } = extractOxygenContent(oxygenJson, resolveImageAlt);
    const isUsable = html.trim().length > 0 && isPublished;
    return {
      slug: post.postName,
      data: {
        title: post.postTitle,
        content_standard: isUsable ? html : CONTENT_REVIEW_PLACEHOLDER,
        seo_description: post.postExcerpt || undefined,
      },
      needsReview: !isUsable || notes.length > 0,
      notes,
    };
  }

  // No Oxygen data for this page at all (e.g. a draft never built in the
  // page builder) — fall back to whatever plain post_content has.
  const content = stripToText(post.postContent);
  const isUsable = content.length > 0 && isPublished;
  return {
    slug: post.postName,
    data: {
      title: post.postTitle,
      content_standard: isUsable ? content : CONTENT_REVIEW_PLACEHOLDER,
      seo_description: post.postExcerpt || undefined,
    },
    needsReview: !isUsable,
    notes: [],
  };
}

export function transformBlogPost(
  post: WpPost,
  coverImageId: string | null,
): { slug: string; data: { title: string; published_at: string; cover_image?: string; content_standard: string }; needsReview: boolean } | null {
  if (post.postType !== 'post') return null;
  const content = stripToText(post.postContent);
  const isUsable = content.length > 0;
  return {
    slug: post.postName,
    data: {
      title: post.postTitle,
      published_at: new Date(post.postDate.replace(' ', 'T') + 'Z').toISOString(),
      cover_image: coverImageId ?? undefined,
      content_standard: isUsable ? content : CONTENT_REVIEW_PLACEHOLDER,
    },
    needsReview: !isUsable || !coverImageId,
  };
}
