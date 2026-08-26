#!/usr/bin/env python3
"""AZOUMAG Planner — single-file bundler.

Reads index.html, inlines css/style.css and every js/*.js referenced
by a <script src>, and writes two outputs:

  dist/planner.html         — full standalone HTML with <!DOCTYPE>.
                              Use when you control the page (GitHub
                              Pages, your own domain, etc.).

  dist/planner-youcan.html  — same payload wrapped in an <iframe srcdoc>.
                              Use inside YouCan / WordPress / Shopify —
                              the iframe isolates the planner from the
                              host page's :root vars and element resets.

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


def wrap_youcan(payload):
    """Wrap the standalone payload in an iframe-with-srcdoc launcher.

    Host CSS (YouCan's :root vars, element resets) cannot cross the
    iframe boundary, so the planner renders exactly as designed no
    matter what the host page injects.
    """
    escaped = payload.replace('&', '&amp;').replace('"', '&quot;')
    return (
        '<!DOCTYPE html>\n'
        '<html lang="en">\n'
        '<head>\n'
        '  <meta charset="UTF-8" />\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
        '  <title>AZOUMAG Planner</title>\n'
        '</head>\n'
        '<body style="margin:0;padding:0">\n'
        '  <iframe title="AZOUMAG Planner" '
        'style="display:block;width:100%;height:100vh;min-height:800px;border:0;margin:0" '
        'srcdoc="' + escaped + '"></iframe>\n'
        '</body>\n'
        '</html>\n'
    )


def main():
    src = read('index.html')
    bundled = inline_js(inline_css(src))

    os.makedirs(DIST, exist_ok=True)

    outputs = {
        'planner.html': bundled,
        'planner-youcan.html': wrap_youcan(bundled),
    }

    for name, content in outputs.items():
        path = os.path.join(DIST, name)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        size_kb = os.path.getsize(path) / 1024
        print(f'  {os.path.relpath(path, ROOT):<28} {size_kb:7.1f} KB')


if __name__ == '__main__':
    main()
