"""Preview GitHub Pages with the configured project base path."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from pathlib import Path
import re
BASE = re.search(r"url:\s*['\"]([^'\"]+)", Path('dist/site-config.mjs').read_text()).group(1)
BASE = urlsplit(BASE).path
class Preview(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs): super().__init__(*args,directory='dist',**kwargs)
 def do_GET(self):
  path=urlsplit(self.path).path
  if not path.startswith(BASE): self.send_error(404); return
  self.path='/'+path[len(BASE):]
  super().do_GET()
if __name__=='__main__': ThreadingHTTPServer(('127.0.0.1',4173),Preview).serve_forever()
