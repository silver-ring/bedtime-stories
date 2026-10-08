#!/usr/bin/env node
// Dev-only tool. Extracts a curated set of public-domain tales from three
// Project Gutenberg plain-text books and writes typed TypeScript data files to
// src/data/stories. The app never runs this at build time; the output is
// committed.
//
// Usage: node scripts/extract-stories.mjs <cache-dir>
//   <cache-dir> holds pg2591.txt, pg1597.txt, pg21.txt (downloaded on demand).

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cacheDir = process.argv[2];
if (!cacheDir) {
  console.error('usage: node scripts/extract-stories.mjs <cache-dir>');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'src', 'data', 'stories');

const BOOKS = {
  grimm: {
    id: 2591,
    collection: "Grimms' Fairy Tales",
    author: 'Jacob and Wilhelm Grimm',
    category: 'fairy-tale-grimm',
    translator: 'Edgar Taylor and Marian Edwardes',
    contentsAnchor: /^CONTENTS:?$/,
  },
  andersen: {
    id: 1597,
    collection: "Andersen's Fairy Tales",
    author: 'Hans Christian Andersen',
    category: 'fairy-tale-andersen',
    translator: undefined,
    contentsAnchor: /^CONTENTS$/,
  },
  aesop: {
    id: 21,
    collection: "Three Hundred Aesop's Fables",
    author: 'Aesop',
    category: 'fable',
    translator: 'George Fyler Townsend',
    contentsAnchor: null,
  },
};

// heading is the title as it appears in the book's contents list.
const WANTED = [
  ['grimm', 'HANSEL AND GRETEL', 'hansel-and-gretel', 'Hansel and Gretel', 'Two children abandoned in the forest find a house made of bread and a witch who wants to eat them.'],
  ['grimm', 'LITTLE RED-CAP [LITTLE RED RIDING HOOD]', 'little-red-cap', 'Little Red-Cap', 'A girl visiting her grandmother meets a wolf who is far cleverer than he looks.'],
  ['grimm', 'RUMPELSTILTSKIN', 'rumpelstiltskin', 'Rumpelstiltskin', 'A miller\'s daughter must guess a strange little man\'s name to keep her firstborn child.'],
  ['grimm', 'SNOWDROP', 'snowdrop', 'Snowdrop', 'A jealous queen pursues a princess who finds shelter with seven dwarfs.'],
  ['grimm', 'ASHPUTTEL', 'ashputtel', 'Ashputtel', 'A kind girl, kept in the ashes by her stepfamily, goes to the king\'s ball with help from a hazel tree.'],
  ['grimm', 'BRIAR ROSE', 'briar-rose', 'Briar Rose', 'A curse sends a princess and her whole castle to sleep for a hundred years.'],
  ['andersen', "THE EMPEROR'S NEW CLOTHES", 'emperors-new-clothes', "The Emperor's New Clothes", 'Two weavers sell a vain emperor clothes that only clever people can see.'],
  ['andersen', 'THE REAL PRINCESS', 'real-princess', 'The Real Princess', 'A prince searches for a true princess, and a single pea decides the matter.'],
  ['andersen', 'THE LITTLE MATCH GIRL', 'little-match-girl', 'The Little Match Girl', 'A poor girl strikes her matches one by one on a freezing New Year\'s Eve.'],
  ['andersen', 'THE FIR TREE', 'fir-tree', 'The Fir Tree', 'A young fir tree longs to be taller and grander, and forgets to enjoy where it is.'],
  ['andersen', 'THE SNOW QUEEN', 'snow-queen', 'The Snow Queen', 'Gerda travels across the world to rescue her friend Kay from the Snow Queen\'s palace of ice.'],
  ['aesop', 'The Hare and the Tortoise', 'hare-and-tortoise', 'The Hare and the Tortoise', 'A boastful hare naps during a race against a slow and steady tortoise.'],
  ['aesop', 'The Lion And The Mouse', 'lion-and-mouse', 'The Lion and the Mouse', 'A lion spares a tiny mouse and is later rescued by it.'],
  ['aesop', 'The Fox and the Grapes', 'fox-and-grapes', 'The Fox and the Grapes', 'A fox who cannot reach some grapes decides they were sour anyway.'],
  ['aesop', 'The Shepherd’s Boy and the Wolf', 'shepherds-boy-and-wolf', 'The Shepherd\'s Boy and the Wolf', 'A boy who cries wolf for fun is ignored when a real wolf arrives.'],
];

async function loadBook(bookKey) {
  const book = BOOKS[bookKey];
  const file = path.join(cacheDir, `pg${book.id}.txt`);
  try {
    await access(file);
  } catch {
    const url = `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`;
    console.log(`fetching ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    await mkdir(cacheDir, { recursive: true });
    await writeFile(file, await res.text());
  }
  return (await readFile(file, 'utf8')).replace(/\r\n/g, '\n').split('\n');
}

const norm = s => s.trim().toUpperCase();

/** Returns the list of heading line indices (one per contents entry, in order). */
function locateHeadings(lines, book) {
  const startMarker = lines.findIndex(l => l.startsWith('*** START OF'));
  if (!book.contentsAnchor && book.id === 21) {
    // Aesop: the contents list is ordered differently from the body, so use the
    // layout instead: a heading has two blank lines before and one after.
    const found = [];
    for (let i = startMarker + 3; i < lines.length - 1; i++) {
      if (lines[i].startsWith('*** END OF')) break;
      const t = lines[i];
      if (t.trim() && !t.startsWith(' ') && !lines[i - 1].trim() && !lines[i - 2].trim() && !lines[i + 1].trim()) {
        found.push({ title: t.trim(), line: i });
      }
    }
    const endMarker = lines.findIndex(l => l.startsWith('*** END OF'));
    return { found, endMarker, contentsStart: startMarker };
  }
  let i = startMarker + 1;
  if (book.contentsAnchor) {
    const anchor = lines.findIndex(
      (l, idx) => idx > startMarker && book.contentsAnchor.test(l.trim()),
    );
    if (anchor < 0) throw new Error('contents anchor not found');
    i = anchor + 1;
  }
  const titles = [];
  const contentsStart = i;
  let firstTitle = null;
  let bodyStart = -1;
  for (; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (firstTitle === null) {
      firstTitle = norm(t);
      titles.push(t);
      continue;
    }
    if (norm(t) === firstTitle) {
      bodyStart = i;
      break;
    }
    titles.push(t);
  }
  if (bodyStart < 0) throw new Error('body start not found');
  const found = [{ title: titles[0], line: bodyStart }];
  let cursor = bodyStart + 1;
  for (const title of titles.slice(1)) {
    for (let j = cursor; j < lines.length; j++) {
      if (lines[j].startsWith('*** END OF')) break;
      if (norm(lines[j]) === norm(title) && lines[j].trim() !== '') {
        found.push({ title, line: j });
        cursor = j + 1;
        break;
      }
    }
  }
  const endMarker = lines.findIndex(l => l.startsWith('*** END OF'));
  return { found, endMarker, contentsStart };
}

function cleanParagraphs(rawLines) {
  const text = rawLines.join('\n');
  return text
    .split(/\n\s*\n/)
    .map(block =>
      block
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\[Illustration[^\]]*\]/g, '')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const cache = {};
  const written = [];
  for (const [bookKey, heading, slug, title, summary] of WANTED) {
    const book = BOOKS[bookKey];
    cache[bookKey] ??= await (async () => {
      const lines = await loadBook(bookKey);
      return { lines, ...locateHeadings(lines, book) };
    })();
    const { lines, found, endMarker } = cache[bookKey];
    const idx = found.findIndex(f => norm(f.title) === norm(heading));
    if (idx < 0) throw new Error(`heading not found: ${heading}`);
    const start = found[idx].line + 1;
    const next = found[idx + 1];
    const end = next ? next.line : endMarker;
    const paragraphs = cleanParagraphs(lines.slice(start, end));
    if (paragraphs[0] && norm(paragraphs[0]) === norm(heading)) paragraphs.shift();
    const wordCount = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
    const readingMinutes = Math.max(1, Math.round(wordCount / 200));
    const story = {
      id: slug,
      title,
      author: book.author,
      category: book.category,
      summary,
      paragraphs,
      wordCount,
      readingMinutes,
      source: {
        collection: book.collection,
        url: `https://www.gutenberg.org/ebooks/${book.id}`,
        ...(book.translator ? { translator: book.translator } : {}),
      },
    };
    const exportName = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const body = `import type { Story } from '../../types/domain';\n\n// Generated by scripts/extract-stories.mjs. Do not edit by hand.\nexport const ${exportName}: Story = ${JSON.stringify(story, null, 2)};\n`;
    await writeFile(path.join(outDir, `${slug}.ts`), body);
    written.push({ slug, exportName, wordCount, paragraphs: paragraphs.length });
    console.log(`${slug.padEnd(26)} ${String(wordCount).padStart(5)} words  ${paragraphs.length} paragraphs  lines ${start}-${end}`);
  }
  const index =
    `import type { Story } from '../../types/domain';\n` +
    written.map(w => `import { ${w.exportName} } from './${w.slug}';`).join('\n') +
    `\n\n// Generated by scripts/extract-stories.mjs. Do not edit by hand.\nexport const STORIES: readonly Story[] = [\n` +
    written.map(w => `  ${w.exportName},`).join('\n') +
    `\n];\n`;
  await writeFile(path.join(outDir, 'index.ts'), index);
  console.log(`wrote ${written.length} stories to ${path.relative(root, outDir)}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
