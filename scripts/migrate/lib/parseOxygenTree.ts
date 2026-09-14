export interface OxygenExtractResult { html: string; notes: string[] }

interface OxygenNode {
  name?: string;
  options?: {
    ct_content?: string;
    original?: Record<string, unknown> | unknown[];
  };
  children?: OxygenNode[];
}

// Layout wrappers and site-wide nav/header/decorative nodes carry no page
// content of their own — recurse into children, emit nothing for themselves.
const SKIP_SILENT = new Set([
  'root', 'ct_div_block', 'ct_section', 'ct_inner_content',
  'oxy_header', 'oxy_header_center', 'oxy_header_left', 'oxy_header_right', 'oxy_header_row',
  'oxy-pro-menu', 'ct_fancy_icon', 'ct_code_block',
]);

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

// ponytail: covers only the entities actually present in this dump's content
// (verified during planning). Swap for a full decoder (e.g. `he`) if future
// Oxygen content introduces entities outside this set.
const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&apos;': "'",
  '&nbsp;': ' ', '&#8211;': '–', '&#8212;': '—', '&#8216;': '‘', '&#8217;': '’',
  '&#8220;': '“', '&#8221;': '”', '&#8230;': '…',
};

function decodeEntities(text: string): string {
  return text.replace(/&[a-zA-Z0-9#]+;/g, (m) => ENTITY_MAP[m] ?? m);
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function getOriginal(node: OxygenNode): Record<string, unknown> {
  const original = node.options?.original;
  return original && !Array.isArray(original) ? original : {};
}

export function extractOxygenContent(
  builderJsonText: string,
  resolveImageAlt: (src: string) => string | null,
): OxygenExtractResult {
  const notes: string[] = [];
  let root: OxygenNode;
  try {
    root = JSON.parse(builderJsonText);
  } catch {
    notes.push('_ct_builder_json was not valid JSON — could not extract content');
    return { html: '', notes };
  }

  function renderNode(node: OxygenNode): string {
    const name = node.name ?? '';
    const original = getOriginal(node);
    const rawContent = node.options?.ct_content;
    const content = typeof rawContent === 'string' ? decodeEntities(rawContent) : undefined;
    const children = (node.children ?? []).map(renderNode).join('');

    if (name === 'ct_shortcode') {
      const raw = typeof original.full_shortcode === 'string' ? original.full_shortcode : '';
      notes.push(`shortcode found, not rendered — needs manual re-implementation: ${raw}`);
      return `<!-- [SHORTCODE TODO: ${raw.replace(/--/g, '—')}] -->`;
    }
    if (name === 'oxy_posts_grid') {
      notes.push('dynamic post grid widget skipped (superseded by the new /blog route)');
      return '';
    }
    if (SKIP_SILENT.has(name)) {
      return children;
    }
    if (name === 'ct_headline') {
      const tag = typeof original.tag === 'string' && HEADING_TAGS.has(original.tag) ? original.tag : 'h2';
      return `<${tag}>${content ?? children}</${tag}>`;
    }
    if (name === 'ct_text_block' || name === 'oxy_rich_text') {
      if (content === undefined) return children;
      const tag = typeof original.tag === 'string' && original.tag.length > 0 && original.tag !== 'div' ? original.tag : 'p';
      return `<${tag}>${content}</${tag}>`;
    }
    if (name === 'ct_span') {
      return content !== undefined ? content : children;
    }
    if (name === 'ct_image') {
      // Oxygen's image component has two reference modes: image_type "1"
      // stores a direct URL in `src`; image_type "2" references the WP
      // media library and stores the resolved URL in `attachment_url`
      // instead. Both must be checked — a real "Netzwerk" partner-logo
      // section (16 images, all image_type "2") was silently dropped
      // before this fix because only `src` was read.
      const src = typeof original.src === 'string' ? original.src
        : typeof original.attachment_url === 'string' ? original.attachment_url
        : '';
      if (!src) return children;
      const alt = resolveImageAlt(src) ?? '[ALT-TEXT TODO: Bild manuell beschreiben]';
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" />`;
    }
    if (name === 'ct_link_text' || name === 'ct_link_button') {
      const url = typeof original.url === 'string' ? original.url : '';
      const target = original.target === '_blank' ? ' target="_blank" rel="noopener"' : '';
      const label = content ?? children;
      return url ? `<a href="${escapeAttr(url)}"${target}>${label}</a>` : label;
    }
    if (name === 'ct_link') {
      const url = typeof original.url === 'string' ? original.url : '';
      return url ? `<a href="${escapeAttr(url)}">${children}</a>` : children;
    }
    if (content !== undefined) {
      notes.push(`unknown component type '${name}' with text content — emitted as a paragraph, verify manually`);
      return `<p>${content}</p>`;
    }
    return children;
  }

  return { html: renderNode(root).trim(), notes };
}
