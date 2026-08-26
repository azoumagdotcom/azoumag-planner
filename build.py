#!/usr/bin/env python3
"""AZOUMAG Planner — single-file bundler.

Reads index.html, inlines css/style.css and every js/*.js referenced
by a <script src>, and writes one output:

  dist/planner.html — full standalone HTML with <!DOCTYPE>. Drop into
                      a YouCan / WordPress / Shopify custom-HTML page.

No dependencies. Run with:  python build.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')

LINK_RE = re.compile(r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*/?>')
SCRIPT_RE = re.compile(r'<script\s+src="([^"]+)"></script>')


def read(rel):
    with open(os.path.join(ROOT, rel), 'r', encoding='utf-8') as f:
        return f.read()


def inline_css(html):
    def repl(m):
        css = read(m.group(1))
        return '<style>\n' + css + '\n</style>'
    return LINK_RE.sub(repl, html)


def inline_js(html):
    def repl(m):
        js = read(m.group(1))
        # Guard against premature </script> inside string literals
        js = js.replace('</script>', '<\\/script>')
        return '<script>\n' + js + '\n</script>'
    return SCRIPT_RE.sub(repl, html)


def main():
    src = read('index.html')
    bundled = inline_js(inline_css(src))

    os.makedirs(DIST, exist_ok=True)

    standalone_path = os.path.join(DIST, 'planner.html')
    with open(standalone_path, 'w', encoding='utf-8') as f:
        f.write(bundled)

    size_kb = os.path.getsize(standalone_path) / 1024
    print(f'  {os.path.relpath(standalone_path, ROOT):<28} {size_kb:7.1f} KB')


if __name__ == '__main__':
    main()
