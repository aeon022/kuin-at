// ponytail: regex/char-scan tuple splitter tuned to mysqldump's single-quote,
// backslash-escaped output. It is not a general SQL parser — if import-source
// ever ships a dump in a different quoting style (e.g. from pg_dump), this
// needs a real parser instead of a wider regex.

export interface WpPost {
  id: string;
  postAuthor: string;
  postDate: string;
  postContent: string;
  postTitle: string;
  postExcerpt: string;
  postStatus: string;
  postName: string;
  postParent: string;
  guid: string;
  postType: string;
  postMimeType: string;
}

function splitTopLevelTuples(valuesBlock: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let inString = false;
  let start = -1;
  for (let i = 0; i < valuesBlock.length; i++) {
    const ch = valuesBlock[i];
    const prev = valuesBlock[i - 1];
    if (inString) {
      if (ch === "'" && prev !== '\\') inString = false;
      continue;
    }
    if (ch === "'") { inString = true; continue; }
    if (ch === '(') { if (depth === 0) start = i; depth++; continue; }
    if (ch === ')') {
      depth--;
      if (depth === 0 && start >= 0) { tuples.push(valuesBlock.slice(start + 1, i)); start = -1; }
    }
  }
  return tuples;
}

function splitCells(tuple: string): string[] {
  const cells: string[] = [];
  let inString = false;
  let cur = '';
  for (let i = 0; i < tuple.length; i++) {
    const ch = tuple[i];
    if (inString) {
      if (ch === '\\' && tuple[i + 1] !== undefined) { cur += unescapeOne(tuple[i + 1]); i++; continue; }
      if (ch === "'") { inString = false; continue; }
      cur += ch;
      continue;
    }
    if (ch === "'") { inString = true; continue; }
    if (ch === ',') { cells.push(cur.trim() === 'NULL' ? '' : cur); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur.trim() === 'NULL' ? '' : cur);
  return cells;
}

function unescapeOne(ch: string): string {
  if (ch === 'n') return '\n';
  if (ch === 'r') return '\r';
  if (ch === 't') return '\t';
  return ch; // covers \\' \\\\ \\" etc.
}

export function parseInsertTuples(sql: string, tableSuffix: string): string[][] {
  const re = new RegExp(`INSERT INTO \`[a-zA-Z0-9_]*${tableSuffix}\` VALUES\\n([\\s\\S]*?);\\n`, 'g');
  const tuples: string[][] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(sql)) !== null) {
    for (const t of splitTopLevelTuples(match[1])) tuples.push(splitCells(t));
  }
  return tuples;
}

export function parsePosts(sql: string): WpPost[] {
  return parseInsertTuples(sql, 'posts').map((c) => ({
    id: c[0], postAuthor: c[1], postDate: c[2], postContent: c[4], postTitle: c[5],
    postExcerpt: c[6], postStatus: c[7], postName: c[11], postParent: c[17],
    guid: c[18], postType: c[20], postMimeType: c[21],
  }));
}

export function parsePostmeta(sql: string): Map<string, Array<{ key: string; value: string }>> {
  const byPost = new Map<string, Array<{ key: string; value: string }>>();
  for (const c of parseInsertTuples(sql, 'postmeta')) {
    const postId = c[1];
    const entry = { key: c[2], value: c[3] };
    if (!byPost.has(postId)) byPost.set(postId, []);
    byPost.get(postId)!.push(entry);
  }
  return byPost;
}
