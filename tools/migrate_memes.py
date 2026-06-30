"""
Migrate existing memes from data.js → Supabase memes table.
Run: python migrate_memes.py <SUPABASE_SERVICE_KEY>
"""
import sys, re, ast, json, urllib.request, urllib.error

SB_URL = 'https://vyrxqrqfznbpxyzhpmyw.supabase.co'

def parse_data_js(path):
    with open(path, encoding='utf-8') as f:
        js = f.read()
    m = re.search(r'memeDatabase\s*:\s*(\[.+?\])\s*\n\s*\}', js, re.DOTALL)
    if not m:
        raise ValueError('memeDatabase array not found')
    arr = m.group(1)
    # Strip JS block and line comments
    arr = re.sub(r'/\*.*?\*/', '', arr, flags=re.DOTALL)
    arr = re.sub(r'//[^\n]*', '', arr)
    # Quote unquoted object keys: word before colon at start of token
    arr = re.sub(r'([{,\n])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', lambda x: x.group(1) + "'" + x.group(2) + "':", arr)
    # null → None
    arr = re.sub(r'\bnull\b', 'None', arr)
    return ast.literal_eval(arr)

def meme_to_row(m):
    return {
        'id':          m.get('id', ''),
        'title':       m.get('title', ''),
        'year':        m.get('year'),
        'creator':     m.get('creator'),
        'origin':      m.get('origin'),
        'cat':         m.get('cat', 'modern'),
        'icon':        m.get('icon', '𓂀'),
        'tier':        m.get('tier', 'Modern'),
        'kek':         m.get('kek', 3),
        'summary':     m.get('summary', ''),
        'description': m.get('desc', ''),
        'lore':        m.get('lore', ''),
        'tags':        m.get('tags', []),
        'img':         m.get('img'),
    }

def upsert_batch(rows, key):
    url = SB_URL + '/rest/v1/memes'
    body = json.dumps(rows).encode('utf-8')
    req = urllib.request.Request(url, data=body, method='POST', headers={
        'apikey':        key,
        'Authorization': 'Bearer ' + key,
        'Content-Type':  'application/json',
        'Prefer':        'resolution=merge-duplicates,return=minimal',
    })
    try:
        with urllib.request.urlopen(req) as r:
            print(f'  Inserted {len(rows)} rows — HTTP {r.status}')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'  ERROR {e.code}: {body}')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python migrate_memes.py <SUPABASE_SERVICE_KEY>')
        sys.exit(1)
    key = sys.argv[1]

    import os
    data_js = os.path.join(os.path.dirname(__file__), '..', 'assets', 'data.js')
    print(f'Parsing {data_js}...')
    memes = parse_data_js(data_js)
    print(f'Found {len(memes)} memes')

    rows = [meme_to_row(m) for m in memes]
    print('Upserting to Supabase...')
    # Send in batches of 20
    for i in range(0, len(rows), 20):
        batch = rows[i:i+20]
        print(f'  Batch {i//20 + 1}: rows {i+1}–{i+len(batch)}')
        upsert_batch(batch, key)

    print('Done.')
