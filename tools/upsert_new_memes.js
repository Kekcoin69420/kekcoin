/**
 * Upsert only memes from memes_seed.json that are not yet in Supabase.
 * Run: node upsert_new_memes.js <SUPABASE_SERVICE_KEY>
 */

const fs   = require('fs');
const path = require('path');

const SB_URL = 'https://vyrxqrqfznbpxyzhpmyw.supabase.co';
const key = process.argv[2];
if (!key) {
  console.error('Usage: node upsert_new_memes.js <SUPABASE_SERVICE_KEY>');
  process.exit(1);
}

const memes = JSON.parse(fs.readFileSync(path.join(__dirname, 'memes_seed.json'), 'utf8'));

function toRow(m) {
  return {
    id:          m.id,
    title:       m.title,
    year:        m.year   || null,
    creator:     m.creator || null,
    origin:      m.origin  || null,
    cat:         m.cat     || 'modern',
    icon:        m.icon    || '𓂀',
    tier:        m.tier    || 'Modern',
    kek:         m.kek     || 3,
    summary:     m.summary || '',
    description: m.desc    || '',
    lore:        m.lore    || '',
    tags:        m.tags    || [],
    img:         m.img     || null,
  };
}

async function getExistingIds() {
  const res = await fetch(`${SB_URL}/rest/v1/memes?select=id`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Range: '0-9999',
    },
  });
  if (!res.ok) throw new Error(`fetch ids: HTTP ${res.status}`);
  const rows = await res.json();
  return new Set(rows.map(r => r.id));
}

async function upsertBatch(rows) {
  const res = await fetch(`${SB_URL}/rest/v1/memes`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`upsert: HTTP ${res.status} ${await res.text()}`);
}

async function main() {
  const existing = await getExistingIds();
  const newRows = memes.filter(m => !existing.has(m.id)).map(toRow);
  console.log(`Seed: ${memes.length} | Supabase: ${existing.size} | New: ${newRows.length}`);
  if (!newRows.length) {
    console.log('Nothing new to insert.');
    return;
  }
  for (const m of newRows) console.log('  +', m.id, '—', m.title);
  for (let i = 0; i < newRows.length; i += 10) {
    await upsertBatch(newRows.slice(i, i + 10));
  }
  console.log('Done.');
}

main().catch(e => { console.error(e.message); process.exit(1); });