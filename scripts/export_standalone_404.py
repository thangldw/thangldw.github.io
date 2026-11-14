#!/usr/bin/env python3
"""Usage: python3 scripts/export_standalone_404.py OUTPUT.html

Generate a self-contained copy of https://thangldw.github.io/404.html for the Workers study apps.

Inlines the portfolio's real CSS (no hand-copied rules), drops web fonts / scripts / theme toggle,
and points the image at a same-origin path so strict CSPs (default-src 'none') keep working.
"""
import re, sys, pathlib
SITE = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1])
PORTFOLIO = "https://thangldw.github.io"
def css(name):
    t = (SITE/"css"/name).read_text(encoding="utf-8")
    t = re.sub(r'@import[^;]+;', '', t)
    t = re.sub(r'@font-face\s*\{[^}]*\}', '', t)
    t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'\s*([{};,>])\s*', r'\1', t)
    return t.strip()
styles = "".join(css(n) for n in ["reset.css","tokens.css","404.css","compact-footer.css","app-design-system.css","site-shell.css"])
# Cross-app 404: use system fonts (Inter is not shipped with the apps).
html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Page not found — Thang Luu</title>
<meta name="description" content="This page could not be found. Return home, or browse the application library.">
<meta name="robots" content="noindex,follow">
<style>{styles}</style>
</head>
<body class="site-page portfolio-app not-found-page" data-page-kind="product">
<header class="site-header">
<div class="site-shell-inner">
<a class="site-brand" href="{PORTFOLIO}/" aria-label="Thang Luu home"><span class="site-brand-mark" aria-hidden="true">t:&gt;</span><span>thang<span class="site-brand-dot">.</span></span></a><nav class="site-nav" aria-label="Site"><a href="{PORTFOLIO}/apps/">Apps</a><a href="{PORTFOLIO}/community/">Community</a></nav>
</div>
</header>
<main class="content-shell" id="main">
<section class="dad-hero" aria-labelledby="notFoundTitle">
<div class="dad-copy">
<span class="content-eyebrow">404 · Dad mode activated</span>
<div class="dad-error-code" aria-label="Error 404"><strong>404</strong><span>Page on parental leave</span></div>
<h1 id="notFoundTitle">Dad’s on duty. This page slipped away.</h1>
<p class="content-lead">Between a bottle, a cuddle, and one very urgent tiny sock, the page you were looking for wandered off. Let’s get you somewhere useful.</p>
<div class="content-actions"><a class="btn btn-primary" href="/">Return home</a><a class="btn" href="{PORTFOLIO}/apps/">Browse applications</a></div>
<p class="dad-reassurance"><strong>Good news:</strong> the baby is happy. The missing page is the only thing we couldn’t find.</p>
</div>
<figure class="dad-scene">
<img src="/404-dad-on-duty.webp" width="1693" height="929" alt="A busy father reaching for his laptop while securely holding his smiling baby">
<figcaption><span><i aria-hidden="true"></i> Dad mode · active</span><strong>One hand for the baby. One hand for everything else.</strong></figcaption>
</figure>
</section>
</main>
<footer class="site-foot compact-footer" id="footer">
<p class="footer-signature"><span><strong translate="no">404</strong> © 2026 <a href="{PORTFOLIO}/">thang.</a></span> <span lang="en" translate="no">crafted with care. stay steadfast, stay free</span></p>
</footer>
</body>
</html>
'''
OUT.write_text(html, encoding="utf-8"); print(len(html), "bytes")
