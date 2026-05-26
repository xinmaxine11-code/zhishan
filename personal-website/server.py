#!/usr/bin/env python3
"""
枝山本地服务器
运行方式: python server.py
首页:    http://localhost:8080
发帖:    http://localhost:8080/admin.html
停止:    Ctrl+C
"""
import json
import os
import re
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

BASE_DIR = Path(__file__).parent


class SiteHandler(SimpleHTTPRequestHandler):

    def do_POST(self):
        if self.path == '/api/posts':
            self._save_posts()
        elif self.path == '/api/images':
            self._upload_images()
        else:
            self.send_error(404)

    # ── 保存 posts.json ──
    def _save_posts(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))
            with open(BASE_DIR / 'posts.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self._ok({'ok': True})
        except Exception as e:
            self._ok({'ok': False, 'error': str(e)}, 500)

    # ── 上传图片 ──
    def _upload_images(self):
        try:
            content_type = self.headers.get('Content-Type', '')
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)

            boundary = None
            for part in content_type.split(';'):
                p = part.strip()
                if p.startswith('boundary='):
                    boundary = p[9:].strip('"')
                    break

            if not boundary:
                self._ok({'ok': False, 'error': 'missing boundary'}, 400)
                return

            images_dir = BASE_DIR / 'images'
            images_dir.mkdir(exist_ok=True)

            saved = []
            for part in body.split(('--' + boundary).encode())[1:]:
                if part.strip() in (b'--', b''):
                    continue
                if b'\r\n\r\n' not in part:
                    continue
                headers_raw, content = part.split(b'\r\n\r\n', 1)
                content = content.rstrip(b'\r\n')
                headers_str = headers_raw.decode('utf-8', errors='replace')

                m = re.search(r'filename="([^"]+)"', headers_str)
                if m and content:
                    original = m.group(1)
                    safe = f"{int(time.time() * 1000)}-{re.sub(r'[^a-zA-Z0-9._-]', '_', original)}"
                    with open(images_dir / safe, 'wb') as f:
                        f.write(content)
                    saved.append(safe)

            self._ok({'ok': True, 'files': saved})
        except Exception as e:
            self._ok({'ok': False, 'error': str(e)}, 500)

    def _ok(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # 安静运行


if __name__ == '__main__':
    os.chdir(BASE_DIR)
    port = 8080
    server = HTTPServer(('localhost', port), SiteHandler)
    print(f'✓ 枝山已启动 → http://localhost:{port}')
    print(f'  发帖页面 → http://localhost:{port}/admin.html')
    print(f'  停止服务 → Ctrl+C\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n已停止。')
