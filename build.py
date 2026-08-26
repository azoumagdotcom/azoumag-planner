#!/usr/bin/env python3
"""AZOUMAG Planner — single-file bundler.

Reads index.html, inlines css/style.css and every js/*.js referenced
by a <script src>, and writes two outputs into dist/:

  dist/planner.html        — full standalone HTML (host anywhere)
  dist/planner-embed.html  — fragment (style + #az-planner + scripts)
                             for pasting into YouCan / WordPress / Shopify

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


def extract_embed(html):
    """Pull out <style>, #az-planner div, and <script> blocks only."""
    style = re.search(r'<style>[\s\S]*?</style>', html)
    planner = re.search(r'<div id="az-planner">[\s\S]*?</div>\s*(?=<script|</body>)', html)
    scripts = re.findall(r'<script>[\s\S]*?</script>', html)
    if not (style and planner and scripts):
        raise RuntimeError('Could not extract embed parts')
    return (
        '<!-- AZOUMAG Planner — embed fragment. Paste inside a YouCan / WordPress / Shopify custom-HTML block. -->\n'
        + style.group(0) + '\n'
        + planner.group(0).rstrip() + '\n'
        + '\n'.join(scripts) + '\n'
    )


def main():
    src = read('index.html')
    bundled = inline_js(inline_css(src))

    os.makedirs(DIST, exist_ok=True)

    standalone_path = os.path.join(DIST, 'planner.html')
    with open(standalone_path, 'w', encoding='utf-8') as f:
        f.write(bundled)

    embed_path = os.path.join(DIST, 'planner-embed.html')
    with open(embed_path, 'w', encoding='utf-8') as f:
        f.write(extract_embed(bundled))

    for p in (standalone_path, embed_path):
        size_kb = os.path.getsize(p) / 1024
        print(f'  {os.path.relpath(p, ROOT):<28} {size_kb:7.1f} KB')


if __name__ == '__main__':
    main()
