#!/usr/bin/env python3
"""Check canonical design ownership, documented values, and native-route drift."""
import re
from pathlib import Path
from audit_ui_standards import audit_color_contract
ROOT = Path(__file__).resolve().parent.parent

def audit_design_system():
    errors = audit_color_contract()
    tokens = (ROOT/'css/tokens.css').read_text()
    shell = (ROOT/'css/site-shell.css').read_text()
    design = (ROOT/'DESIGN.md').read_text()
    values = dict(re.findall(r'(--[\w-]+):\s*([^;]+);',tokens.split('html:root[data-theme="dark"]')[0]))
    mappings = {'canvas':'--color-canvas','text':'--color-text','muted':'--color-text-body','accent':'--color-accent','border':'--color-border','control':'--color-surface-subtle','support':'--color-support'}
    for name,token in mappings.items():
        expected = re.search(r'^  '+name+r': "([^"]+)"$',design,re.M)
        if not expected or expected[1] != values.get(token): errors.append(f'DESIGN.md: {name} differs from {token}')
    dark = dict(re.findall(r'(--[\w-]+):\s*([^;]+);',tokens.split('html:root[data-theme="dark"]')[1]))
    for name,token in mappings.items():
        if name=='support': continue
        expected = re.search(r'^  '+name+r'-dark: "([^"]+)"$',design,re.M)
        if not expected or expected[1] != dark.get(token): errors.append(f'DESIGN.md: {name}-dark differs from {token}')
    for token in ['--font-family-ui','--text-body','--text-body-lg','--text-caption','--leading-body','--leading-prose','--space-8','--space-16','--space-24','--logo-mark-size','--logo-text-size','--control-size','--control-size-touch','--focus-width','--focus-offset','--disabled-opacity']:
        if token not in values: errors.append(f'tokens.css: missing {token}')
    for name,size,leading in [('body','--text-body','--leading-body'),('prose','--text-body-lg','--leading-prose'),('caption','--text-caption','--leading-body'),('logo','--text-title-lg',None)]:
        entry = re.search(r'^  '+name+r': \{fontFamily: "Inter", fontSize: "([^"]+)", lineHeight: "([^"]+)"\}',design,re.M)
        if not entry or entry[1] != values.get(size) or (leading and entry[2] != values.get(leading)):
            errors.append(f'DESIGN.md: typography {name} differs from shared tokens')
    for name,token in [('small','--space-8'),('medium','--space-16'),('large','--space-24')]:
        expected=re.search(r'^  '+name+r': "([^"]+)"$',design,re.M)
        if not expected or expected[1]!=values.get(token): errors.append(f'DESIGN.md: spacing {name} differs from shared tokens')
    # Every authored stylesheet inherits core values from the official owner.
    protected = re.compile(r'--(?:color-[\w-]+|font-family-ui|text-[\w-]+|leading-[\w-]+|weight-[\w-]+|tracking-[\w-]+|space-[\w-]+|logo-[\w-]+|control-size[\w-]*|focus-[\w-]+|disabled-opacity|radius-[\w-]+)\s*:')
    for stylesheet in (ROOT/'css').glob('*.css'):
        if stylesheet.name == 'tokens.css':
            continue
        authored = re.sub(r'/\*.*?\*/', '', stylesheet.read_text(), flags=re.S)
        for definition in protected.findall(authored):
            errors.append(f'{stylesheet.relative_to(ROOT)}: redefines official token {definition.rstrip(": ")}')
    for file in ['css/homepage.css','css/apps-catalog.css']:
        source = (ROOT/file).read_text()
        source = re.sub(r'/\*.*?\*/','',source,flags=re.S)
        if re.search(r'#[\da-fA-F]{3,8}\b',source): errors.append(f'{file}: raw palette value outside owner')
        if re.search(r'font-size:\s*\d',source): errors.append(f'{file}: raw font size outside owner')
        if re.search(r'font-weight:\s*\d',source): errors.append(f'{file}: raw font weight outside owner')
        if re.search(r'\.site-brand[^{}]*\{[^{}]*(?:font-size|border-radius)',source): errors.append(f'{file}: local brand recipe')
    if '@import url("/css/tokens.css?' not in shell: errors.append('site-shell.css: canonical token integration missing')
    for recipe in ['--logo-mark-size','--logo-text-size',':hover:not(:disabled)',':active:not(:disabled)',':focus-visible',':disabled','prefers-reduced-motion','--control-size-touch']:
        if recipe not in shell: errors.append(f'site-shell.css: missing {recipe}')
    for route in ['index.html','apps/index.html','aws/index.html']:
        if '/css/site-shell.css?' not in (ROOT/route).read_text(): errors.append(f'{route}: missing shared shell integration')
    if 'class="support"' in (ROOT/'index.html').read_text(): errors.append('index.html: duplicate sidebar support link')
    return errors

if __name__=='__main__':
    errors=audit_design_system()
    if errors:
        print('\n'.join(errors)); raise SystemExit(1)
    print('Design ownership, light/dark document drift, native typography/color debt, logo/control recipes, and three-route integration passed.')
