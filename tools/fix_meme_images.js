/**
 * Patch meme img URLs in Supabase from meme_image_fixes.json
 * Run: node fix_meme_images.js <SUPABASE_SERVICE_KEY>
 */

const fs = require('fs');
const path = require('path');

const SB_URL = 'https://vyrxqrqfznbpxyzhpmyw.supabase.co';
const KEY = process.argv[2] || process.env.SUPABASE_SERVICE_KEY;
if (!KEY) {
  console.error('Usage: node fix_meme_images.js <SUPABASE_SERVICE_KEY>');
  process.exit(1);
}

const fixes = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'meme_image_fixes.json'), 'utf8')
);

async function patchOne({ id, img }) {
  const res = await fetch(`${SB_URL}/rest/v1/memes?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ img }),
  });
  if (!res.ok) {
    throw new Error(`${id}: HTTP ${res.status} ${await res.text()}`);
  }
}

async function main() {
  console.log(`Patching ${fixes.length} meme images…`);
  for (const fix of fixes) {
    await patchOne(fix);
    console.log('  ✓', fix.id);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});