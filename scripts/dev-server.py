#!/usr/bin/env python3
"""Dev-only server that disables caching, so edits always show up on
reload without needing cache-busting query strings. Not used in
production (Cloudflare Pages serves the static files directly)."""
import http.server
import os
import sys

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

if __name__ == "__main__":
    # Serve website/ regardless of the cwd this script is launched from.
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    http.server.test(HandlerClass=NoCacheHandler, port=port)
