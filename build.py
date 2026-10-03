#!/usr/bin/env python3
"""Inline Three.js and the game into one self-contained file: dist/BrawlNite.html"""
from pathlib import Path

root = Path(__file__).parent
html = (root / 'src/index.html').read_text()
three = (root / 'vendor/three.min.js').read_text()
game = (root / 'src/game.js').read_text()
rules = (root / 'shared/rules.js').read_text().replace('export function', 'function')
html = html.replace('<!--THREE-->', '<script>\n' + three + '\n</script>')
html = html.replace('<!--GAME-->', '<script>\n' + rules + '\n</script>\n<script>\n' + game + '\n</script>')
(root / 'dist').mkdir(exist_ok=True)
for name in ('BrawlNite.html', 'index.html'):  # index.html is what the website serves
    out = root / 'dist' / name
    out.write_text(html)
print(f'Wrote dist/BrawlNite.html and dist/index.html ({out.stat().st_size // 1024} KB)')
