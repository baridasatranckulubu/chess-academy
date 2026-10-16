#!/usr/bin/env python3
"""Check local HTML resource links before deploying a static Chess Academy site."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP = ('http:', 'https:', '//', 'data:', 'mailto:', 'tel:', 'javascript:', '#')

class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'script' and a.get('src'):
            self.paths.append(a['src'])
        if tag == 'link' and a.get('href') and a.get('rel') in ('stylesheet', 'icon', 'manifest'):
            self.paths.append(a['href'])

errors = []
pages = list(ROOT.rglob('*.html'))
for page in pages:
    parser = Assets()
    parser.feed(page.read_text(encoding='utf-8'))
    for ref in parser.paths:
        if ref.startswith(SKIP):
            continue
        target = unquote(urlsplit(ref).path)
        if not target:
            continue
        dest = (ROOT / target.lstrip('/')) if target.startswith('/') else (page.parent / target)
        dest = dest.resolve()
        if not dest.is_relative_to(ROOT.resolve()) or not dest.is_file():
            errors.append(f'{page.relative_to(ROOT)} -> {ref}')
print(f'Checked {len(pages)} HTML files for local script/CSS assets.')
if errors:
    print('MISSING ASSETS:', *errors, sep='\n - ')
    sys.exit(1)
print('PASS: no missing local script/CSS assets')
