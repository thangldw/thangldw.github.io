#!/usr/bin/env python3
"""Preview GitHub Pages routes with its custom 404 document."""
from argparse import ArgumentParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

class PagesHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_error(self, code, message=None, explain=None):
        if code != 404:
            return super().send_error(code, message, explain)
        content = (ROOT / '404.html').read_bytes()
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(content)

if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--port', type=int, default=4188)
    args = parser.parse_args()
    ThreadingHTTPServer(('127.0.0.1', args.port), PagesHandler).serve_forever()
