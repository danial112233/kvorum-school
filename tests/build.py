"""Builds tests/school.html: the page with a stand-in runtime and the demo seed, for tests/school-test.js.

    python3 tests/build.py
"""
from pathlib import Path

here = Path(__file__).resolve().parent
page = (here.parent / "page" / "nash-school.html").read_text(encoding="utf-8")
stub = (here / "stub.js").read_text(encoding="utf-8") + "\n" + (here / "school-seed.js").read_text(encoding="utf-8")
# the same skeleton claude.ai wraps a published page in
head = ('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}'
        'img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>')
mark = '<script>\n(() => {\n  "use strict";'
assert page.count(mark) == 1, "page script not found"
(here / "school.html").write_text(head + page.replace(mark, "<script>\n" + stub + "</script>\n" + mark, 1) + "</body></html>", encoding="utf-8")
print("built tests/school.html")
