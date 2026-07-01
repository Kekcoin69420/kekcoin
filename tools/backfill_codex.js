/**
 * Backfill meme lore + scripture for the Codex and archive.
 *
 * - Merges memes_seed.json (rich lore) into Supabase
 * - Generates scripture from lore + summary + description when missing
 * - Adds source_url for KYM links
 *
 * Run: node backfill_codex.js <SUPABASE_SERVICE_KEY>
 */

const fs = require('fs');
const path = require('path');

const SB_URL = 'https://vyrxqrqfznbpxyzhpmyw.supabase.co';
const key = process.argv[2];
if (!key) {
  console.error('Usage: node backfill_codex.js <SUPABASE_SERVICE_KEY>');
  process.exit(1);
}

const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'memes_seed.json'), 'utf8'));
const seedById = Object.fromEntries(seed.map(m => [m.id, m]));

function scriptureFrom(m) {
  if (m.scripture) return m.scripture;
  const lore = (m.lore || '').trim();
  const summary = (m.summary || '').trim();
  const desc = (m.description || m.desc || '').trim();
  if (lore && desc && lore !== desc) {
    return lore + '\n\n' + desc;
  }
  if (lore) return lore;
  if (desc) return desc;
  return summary;
}

function sourceUrl(id) {
  return 'https://knowyourmeme.com/memes/' + id;
}

async function fetchAllMemes() {
  const res = await fetch(`${SB_URL}/rest/v1/memes?select=*&order=id.asc`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Range: '0-9999',
    },
  });
  if (!res.ok) throw new Error('fetch memes: HTTP ' + res.status);
  return res.json();
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
  if (!res.ok) throw new Error('upsert: HTTP ' + res.status + ' ' + await res.text());
}

function toRow(db, seedRow) {
  const merged = {
    id: db.id,
    title: db.title || seedRow?.title,
    year: db.year ?? seedRow?.year ?? null,
    creator: db.creator || seedRow?.creator || null,
    origin: db.origin || seedRow?.origin || null,
    cat: db.cat || seedRow?.cat || 'modern',
    icon: db.icon || seedRow?.icon || '𓂀',
    tier: db.tier || seedRow?.tier || 'Modern',
    kek: db.kek ?? seedRow?.kek ?? 3,
    summary: db.summary || seedRow?.summary || '',
    description: db.description || seedRow?.desc || seedRow?.description || '',
    lore: (seedRow?.lore || db.lore || '').trim(),
    tags: db.tags?.length ? db.tags : (seedRow?.tags || []),
    img: db.img || seedRow?.img || null,
    source_url: db.source_url || sourceUrl(db.id),
  };
  merged.scripture = scriptureFrom({
    scripture: db.scripture,
    lore: merged.lore,
    summary: merged.summary,
    description: merged.description,
  });
  if (!merged.lore && merged.scripture) merged.lore = merged.scripture.split('\n\n')[0];
  return merged;
}

async function insertSeedOnly() {
  const existing = await fetchAllMemes();
  const have = new Set(existing.map(m => m.id));
  const missing = seed.filter(m => !have.has(m.id)).map(m => ({
    id: m.id,
    title: m.title,
    year: m.year || null,
    creator: m.creator || null,
    origin: m.origin || null,
    cat: m.cat || 'modern',
    icon: m.icon || '𓂀',
    tier: m.tier || 'Modern',
    kek: m.kek || 3,
    summary: m.summary || '',
    description: m.desc || '',
    lore: m.lore || '',
    tags: m.tags || [],
    img: m.img || null,
    source_url: sourceUrl(m.id),
    scripture: scriptureFrom({ lore: m.lore, summary: m.summary, desc: m.desc }),
  }));
  if (!missing.length) return 0;
  for (let i = 0; i < missing.length; i += 15) {
    await upsertBatch(missing.slice(i, i + 15));
  }
  return missing.length;
}

async function main() {
  const dbMemes = await fetchAllMemes();
  console.log(`DB memes: ${dbMemes.length} | Seed: ${seed.length}`);

  const inserted = await insertSeedOnly();
  if (inserted) console.log(`Inserted ${inserted} new memes from seed`);

  const refreshed = await fetchAllMemes();
  const rows = refreshed.map(db => toRow(db, seedById[db.id]));
  const withScripture = rows.filter(r => r.scripture && r.scripture.length > 40);
  console.log(`Upserting ${rows.length} rows (${withScripture.length} with scripture)...`);

  for (let i = 0; i < rows.length; i += 15) {
    await upsertBatch(rows.slice(i, i + 15));
    console.log(`  batch ${Math.floor(i / 15) + 1}`);
  }
  console.log('Codex backfill complete.');
}

main().catch(e => { console.error(e.message); process.exit(1); });