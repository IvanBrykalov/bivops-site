#!/usr/bin/env python3
"""Offline checks: missing local assets, public copy, accidental source publication."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

root = Path(__file__).resolve().parents[1] / 'dist'
errors = []


class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name not in ('href', 'src') or not value:
                continue
            url = urlsplit(value)
            if url.scheme or url.netloc or not url.path:
                continue
            target = (root / unquote(url.path.lstrip('/'))).resolve()
            if not target.is_relative_to(root.resolve()) or not target.is_file():
                errors.append(f'{self.file}: missing local target {value}')


for path in root.rglob('*'):
    if not path.is_file():
        continue
    if path.is_symlink() or path.suffix.lower() not in {'.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp'}:
        errors.append(f'Unexpected public file: {path}')
    if path.suffix in {'.html', '.css', '.js'}:
        text = path.read_text()
        if '\u2014' in text or '\u2013' in text:
            errors.append(f'Long dash in {path}')
        if 'terraform-aws-modules' in text:
            errors.append(f'Excluded project reference in {path}')
        if path.suffix == '.html':
            parser = Links()
            parser.file = path.name
            parser.feed(text)
if errors:
    raise SystemExit('\n'.join(errors))
print('Site files and local links passed.')
