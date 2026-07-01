/**
 * Upsert memes from memes_seed.json → Supabase memes table.
 * Run: node migrate_memes.js <SUPABASE_SERVICE_KEY>
 *
 * Get the service key from: Supabase dashboard → Project Settings → API → service_role key
 */

const fs   = require('fs');
const path = require('path');

const SB_URL = 'https://vyrxqrqfznbpxyzhpmyw.supabase.co';

const key = process.argv[2];
if (!key) {
  console.error('Usage: node migrate_memes.js <SUPABASE_SERVICE_KEY>');
  process.exit(1);
}

// Load memes from the pre-exported JSON snapshot of data.js
const memes = JSON.parse(fs.readFileSync(path.join(__dirname, 'memes_seed.json'), 'utf8'));
console.log(`Loaded ${memes.length} memes from memes_seed.json`);

// Map JS field names to Supabase column names
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

async function upsertBatch(rows) {
  const res = await fetch(`${SB_URL}/rest/v1/memes`, {
    method: 'POST',
    headers: {
      'apikey':        key,
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
      'Prefer':        'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.status;
}

async function main() {
  const rows = memes.map(toRow);

  // Upsert in batches of 20
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20);
    const status = await upsertBatch(batch);
    console.log(`  Batch ${Math.floor(i/20)+1}: rows ${i+1}–${i+batch.length} → HTTP ${status}`);
  }
  console.log('Migration complete.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
