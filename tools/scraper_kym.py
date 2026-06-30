"""
KYM Bulk Meme Importer — knowyourmeme.com → Supabase
=====================================================
Usage:
  1. Add KYM slugs to kym_slugs.txt (one per line, e.g. "distracted-boyfriend")
  2. Set SUPABASE_SERVICE_KEY env var  (Project Settings → API → service_role)
  3. python scraper_kym.py

Optional flags:
  --dry-run    Print extracted data without inserting to Supabase
  --cat LABEL  Override category for all memes in this run (default: modern)
               Valid: frog, classic, wojak, reaction, crypto, 4chan, modern

Each meme in kym_slugs.txt can optionally include overrides:
  distracted-boyfriend cat=reaction kek=4 tier=Legendary
"""

import os, sys, re, json, time, urllib.request, urllib.error, argparse, pathlib

SB_URL = 'https://vyrxqrqfznbpxyzhpmyw.supabase.co'
KYM_BASE = 'https://knowyourmeme.com/memes/'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

TIER_MAP = {'eternal': 'Eternal', 'ancient': 'Ancient', 'legendary': 'Legendary', 'sacred': 'Sacred', 'modern': 'Modern'}


def fetch_html(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as r:
                return r.read().decode('utf-8', errors='replace')
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 10 * (attempt + 1)
                print(f'    Rate limited, waiting {wait}s...')
                time.sleep(wait)
            else:
                raise
        except Exception as e:
            if attempt == retries - 1:
                raise
            time.sleep(3)
    return None


def extract_text_tag(html, tag, cls=None):
    """Extract inner text from the first matching tag."""
    if cls:
        pattern = rf'<{tag}[^>]*class="[^"]*{re.escape(cls)}[^"]*"[^>]*>(.*?)</{tag}>'
    else:
        pattern = rf'<{tag}[^>]*>(.*?)</{tag}>'
    m = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
    if not m:
        return None
    return re.sub(r'<[^>]+>', '', m.group(1)).strip()


def scrape_kym(slug):
    """Return a dict with meme fields, or None on failure."""
    url = KYM_BASE + slug
    html = fetch_html(url)
    if not html:
        return None

    # Title
    title = extract_text_tag(html, 'h1')
    if not title:
        return None
    title = re.sub(r'\s+', ' ', title).strip()

    # Entry icon image (mobile CDN thumbnail)
    img = None
    m = re.search(r'<link\s+as="image"\s+href="([^"]+)"\s+rel="preload"', html)
    if m:
        img = m.group(1)
    else:
        # Fallback: og:image
        m = re.search(r'<meta\s+property="og:image"\s+content="([^"]+)"', html)
        if m:
            img = m.group(1)

    # Year — look for "Year" label in the sidebar
    year = None
    m = re.search(r'Year\s*</[^>]+>\s*<[^>]+>\s*(\d{4})', html, re.IGNORECASE)
    if m:
        year = int(m.group(1))

    # Origin
    origin = None
    m = re.search(r'Origin\s*</[^>]+>\s*<[^>]+>(.*?)</[^>]+>', html, re.IGNORECASE | re.DOTALL)
    if m:
        origin = re.sub(r'<[^>]+>', '', m.group(1)).strip()[:120]

    # Description — first paragraph of the About section
    description = ''
    about_m = re.search(r'<section[^>]*id="about"[^>]*>(.*?)</section>', html, re.DOTALL | re.IGNORECASE)
    if not about_m:
        about_m = re.search(r'<h2[^>]*>About</h2>(.*?)(?:<h2|</article)', html, re.DOTALL | re.IGNORECASE)
    if about_m:
        about_html = about_m.group(1)
        paras = re.findall(r'<p[^>]*>(.*?)</p>', about_html, re.DOTALL)
        paras = [re.sub(r'<[^>]+>', '', p).strip() for p in paras]
        paras = [p for p in paras if len(p) > 40]
        description = ' '.join(paras[:3])[:1000]

    # Tags from KYM meta keywords
    tags = []
    m = re.search(r'<meta\s+name="keywords"\s+content="([^"]+)"', html, re.IGNORECASE)
    if m:
        raw_tags = [t.strip().lower().replace(' ', '-') for t in m.group(1).split(',')]
        tags = [t for t in raw_tags if t and len(t) < 40][:10]

    summary = description[:160].rsplit(' ', 1)[0] + '…' if len(description) > 160 else description

    return {
        'id':          slug,
        'title':       title,
        'year':        year,
        'creator':     None,
        'origin':      origin,
        'cat':         'modern',
        'icon':        '𓂀',
        'tier':        'Modern',
        'kek':         3,
        'summary':     summary,
        'description': description,
        'lore':        '',
        'tags':        tags,
        'img':         img,
    }


def upsert_rows(rows, service_key):
    url = SB_URL + '/rest/v1/memes'
    body = json.dumps(rows).encode('utf-8')
    req = urllib.request.Request(url, data=body, method='POST', headers={
        'apikey':        service_key,
        'Authorization': 'Bearer ' + service_key,
        'Content-Type':  'application/json',
        'Prefer':        'resolution=merge-duplicates,return=minimal',
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status


def parse_slug_line(line):
    """Parse 'slug [key=val ...]' into (slug, overrides_dict)."""
    parts = line.strip().split()
    if not parts:
        return None, {}
    slug = parts[0]
    overrides = {}
    for part in parts[1:]:
        if '=' in part:
            k, v = part.split('=', 1)
            overrides[k.strip()] = v.strip()
    return slug, overrides


def main():
    parser = argparse.ArgumentParser(description='Scrape KYM memes into Supabase')
    parser.add_argument('--dry-run', action='store_true', help='Print without inserting')
    parser.add_argument('--cat', default=None, help='Override category for all memes')
    parser.add_argument('--slugs', default='kym_slugs.txt', help='Path to slugs file')
    args = parser.parse_args()

    service_key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not service_key and not args.dry_run:
        print('ERROR: Set SUPABASE_SERVICE_KEY env var, or use --dry-run')
        sys.exit(1)

    slugs_file = pathlib.Path(__file__).parent / args.slugs
    if not slugs_file.exists():
        print(f'ERROR: {slugs_file} not found. Create it with one KYM slug per line.')
        sys.exit(1)

    lines = [l for l in slugs_file.read_text(encoding='utf-8').splitlines()
             if l.strip() and not l.strip().startswith('#')]
    print(f'Processing {len(lines)} slugs from {args.slugs}\n')

    pending = []
    for i, line in enumerate(lines, 1):
        slug, overrides = parse_slug_line(line)
        if not slug:
            continue
        print(f'[{i}/{len(lines)}] {slug}...', end=' ', flush=True)
        try:
            row = scrape_kym(slug)
            if not row:
                print('SKIP (no data)')
                continue
            # Apply overrides from the slugs file
            for k, v in overrides.items():
                if k == 'kek':
                    row['kek'] = int(v)
                elif k == 'tier':
                    row['tier'] = TIER_MAP.get(v.lower(), v)
                elif k in row:
                    row[k] = v
            # Apply global cat override
            if args.cat:
                row['cat'] = args.cat
            print(f"OK — {row['title']} ({row['year'] or '?'})")
            if args.dry_run:
                print(json.dumps(row, ensure_ascii=False, indent=2))
            else:
                pending.append(row)
                # Upsert in batches of 10
                if len(pending) >= 10:
                    status = upsert_rows(pending, service_key)
                    print(f'  → Inserted batch of {len(pending)} (HTTP {status})')
                    pending = []
        except Exception as e:
            print(f'ERROR: {e}')
        time.sleep(0.5)

    if pending and not args.dry_run:
        status = upsert_rows(pending, service_key)
        print(f'  → Inserted final batch of {len(pending)} (HTTP {status})')

    print('\nDone.')


if __name__ == '__main__':
    main()
