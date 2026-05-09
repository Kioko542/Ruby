#!/usr/bin/env node
/**
 * Archives open Trello cards whose titles look like default template noise.
 *
 * Setup:
 *   1. https://trello.com/power-ups/admin → create a Power-Up or use Trello API key page
 *   2. export TRELLO_KEY=... TRELLO_TOKEN=... TRELLO_BOARD_ID=...
 *
 * Usage:
 *   node scripts/trello-archive-default-cards.mjs --dry-run
 *   node scripts/trello-archive-default-cards.mjs
 *
 * Add patterns in TITLE_PATTERNS below if your template uses different wording.
 */

const key = process.env.TRELLO_KEY;
const token = process.env.TRELLO_TOKEN;
const boardId = process.env.TRELLO_BOARD_ID;

/** @type {RegExp[]} */
const TITLE_PATTERNS = [
  /^welcome\b/i,
  /^getting started\b/i,
  /^project overview\b/i,
  /^meeting agenda\b/i,
  /^tip:?/i,
  /\bclick (here |to)\b/i,
  /^todo$/i,
  /^card \d+$/i,
  /^task \d+$/i,
  /^example card\b/i,
  /^sample\b/i,
  /^this is (a card|your)/i,
  /^⭐️/,
  /^🎯/,
  /^✅ .*getting started/i,
];

function archiveListNamesArg() {
  const out = [];
  for (const a of process.argv) {
    if (a.startsWith('--archive-open-cards-in-list='))
      out.push(a.slice('--archive-open-cards-in-list='.length).trim());
  }
  return out.map((s) => s.toLowerCase());
}

async function getJson(path, searchParams = {}) {
  const q = new URLSearchParams({ key, token, ...searchParams });
  const url = `https://api.trello.com/1/${path}?${q}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${path}: ${await r.text()}`);
  return r.json();
}

async function archiveCard(cardId) {
  const q = new URLSearchParams({
    key,
    token,
    closed: 'true',
  });
  const r = await fetch(`https://api.trello.com/1/cards/${cardId}?${q}`, {
    method: 'PUT',
  });
  if (!r.ok) throw new Error(`${r.status} archive ${cardId}: ${await r.text()}`);
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const archiveByList = new Set(archiveListNamesArg());

  if (!key || !token || !boardId) {
    console.error(
      'Set TRELLO_KEY, TRELLO_TOKEN, and TRELLO_BOARD_ID (Board → Share → … or board URL)'
    );
    process.exit(1);
  }

  const [cards, lists] = await Promise.all([
    getJson(`boards/${boardId}/cards`, {
      fields: 'name,id,idList',
      filter: 'open',
    }),
    getJson(`boards/${boardId}/lists`, { fields: 'id,name', filter: 'open' }),
  ]);

  const listNameById = new Map(lists.map((l) => [l.id, (l.name || '').trim()]));

  const matchedByPattern = cards.filter((c) =>
    TITLE_PATTERNS.some((re) => re.test(String(c.name).trim()))
  );

  const matchedByList =
    archiveByList.size > 0
      ? cards.filter((c) => {
          const n = (listNameById.get(c.idList) || '').toLowerCase();
          return archiveByList.has(n);
        })
      : [];

  const targets = [...new Map([...matchedByPattern, ...matchedByList].map((c) => [c.id, c])).values()];

  console.log(`Open cards: ${cards.length}`);
  console.log(`To archive (${targets.length}):`);
  for (const c of targets) {
    const ln = listNameById.get(c.idList) || '?';
    console.log(`  - [${ln}] ${c.name}`);
  }

  if (dry) {
    console.log('\n--dry-run: no changes. Run without --dry-run to archive.');
    return;
  }

  if (targets.length === 0) return;

  for (const c of targets) {
    await archiveCard(c.id);
    console.log('Archived:', c.name);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
