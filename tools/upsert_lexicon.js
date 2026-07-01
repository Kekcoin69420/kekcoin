/**
 * Upsert lexicon rows from lexicon_expand.json (new terms + rewrites).
 * Run: node upsert_lexicon.js <SUPABASE_SERVICE_KEY>
 */

const fs = require('fs');
const path = require('path');

const SB_URL = 'https://vyrxqrqfznbpxyzhpmyw.supabase.co';
const key = process.argv[2];
if (!key) {
  console.error('Usage: node upsert_lexicon.js <SUPABASE_SERVICE_KEY>');
  process.exit(1);
}

const rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'lexicon_expand.json'), 'utf8'));

function toRow(r) {
  return {
    id: r.id,
    term: r.term,
    cat: r.cat,
    definition: r.definition,
    origin: r.origin || null,
    aka: r.aka || [],
    related: r.related || [],
  };
}

async function upsertBatch(batch) {
  const res = await fetch(`${SB_URL}/rest/v1/lexicon`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(batch.map(toRow)),
  });
  if (!res.ok) throw new Error(`upsert: HTTP ${res.status} ${await res.text()}`);
}

async function count() {
  const res = await fetch(`${SB_URL}/rest/v1/lexicon?select=id`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  });
  const range = res.headers.get('content-range') || '';
  const m = range.match(/\/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

async function main() {
  const before = await count();
  console.log(`Upserting ${rows.length} lexicon rows (was ${before ?? '?'} total)…`);
  for (const r of rows) console.log('  ·', r.id);
  for (let i = 0; i < rows.length; i += 10) {
    await upsertBatch(rows.slice(i, i + 10));
  }
  const after = await count();
  console.log(`Done. Lexicon now holds ${after ?? '?'} words.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });