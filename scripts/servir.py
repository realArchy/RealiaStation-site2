#!/usr/bin/env python3
"""Serveur de travail pour le site, sans cache.

`python -m http.server` ne renvoie aucun en-tête de cache. Firefox garde alors
les anciennes pages et les anciens scripts : on croit tester la version qu'on
vient d'écrire, alors qu'on regarde celle d'il y a deux heures, barre « tiroir
suivant » comprise. Ce serveur dit au navigateur, à chaque réponse, de ne rien
garder.

    python scripts/servir.py            # port 8123, dossier web/
    python scripts/servir.py 9000       # autre port
"""

import functools
import http.server
import pathlib
import socketserver
import sys

RACINE = pathlib.Path(__file__).resolve().parent.parent / "web"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123


class SansCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # silencieux : on lit les erreurs, pas chaque requête


hote = functools.partial(SansCache, directory=str(RACINE))
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("0.0.0.0", PORT), hote) as srv:
    print(f"  site servi depuis {RACINE} — http://127.0.0.1:{PORT}/index.html (sans cache)")
    srv.serve_forever()
