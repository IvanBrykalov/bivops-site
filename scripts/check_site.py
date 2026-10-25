#!/usr/bin/env python3
"""Offline checks: missing local assets, public copy, accidental source publication."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

root = Path(__file__).resolve().parents[1] / 'dist'
errors = []
expected_csp = (
    "default-src 'none'; script-src 'self'; script-src-attr 'none'; "
    "style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; "
    "base-uri 'none'; form-action 'none'"
)


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.csp_count = 0

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == 'meta' and attributes.get('http-equiv', '').lower() == 'content-security-policy':
            self.csp_count += 1
            if attributes.get('content') != expected_csp:
                errors.append(f'{self.file}: unexpected Content Security Policy')
        elif self.csp_count == 0 and tag in {'script', 'style', 'link', 'img', 'base', 'body'}:
            errors.append(f'{self.file}: CSP must precede resource loads and body')
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
            if parser.csp_count != 1:
                errors.append(f'{path.name}: expected exactly one CSP meta element')
if errors:
    raise SystemExit('\n'.join(errors))
print('Site files and local links passed.')
