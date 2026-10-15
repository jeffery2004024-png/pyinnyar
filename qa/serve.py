"""Local-only Safari QA harness, deliberately outside published dist/."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
from pathlib import Path
import json, sys
sys.path.insert(0, str(Path("scripts").resolve()))
from importlib.machinery import SourceFileLoader
BASE=SourceFileLoader("preview", "scripts/serve-preview.py").load_module().BASE
class QA(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory='dist',**kwargs)
 def do_GET(self):
  path=urlsplit(self.path).path
  if path=='/__qa/':
   b=Path('qa/runner.html').read_text().replace('__BASE_PATH__',BASE).encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(b);return
  if path=='/__qa/slow-match':
   b=Path('dist/en/match/index.html').read_text().replace('<script type="module" src="'+BASE+'portal.mjs"></script>','<script type="module">await new Promise(resolve=>setTimeout(resolve,6000));await import("'+BASE+'portal.mjs");</script>').encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(b);return
  if not path.startswith(BASE):self.send_error(404);return
  self.path='/'+path[len(BASE):]
  super().do_GET()
 def do_POST(self):
  if urlsplit(self.path).path!='/__qa/report':self.send_error(404);return
  size=int(self.headers.get('Content-Length','0'))
  if size>1000000:self.send_error(413);return
  Path('qa-results/2026-10-15').mkdir(parents=True,exist_ok=True);report=json.loads(self.rfile.read(size));Path('qa-results/2026-10-15/safari-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));self.send_response(200);self.end_headers();self.wfile.write(b'ok')
ThreadingHTTPServer(('127.0.0.1',4174),QA).serve_forever()
