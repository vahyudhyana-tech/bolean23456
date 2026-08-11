#!/usr/bin/env python3
import json
from pathlib import Path
from urllib.parse import urlparse
from http.server import SimpleHTTPRequestHandler, HTTPServer

from app import read_ods_rows, build_reference_rows

ROOT = Path(__file__).resolve().parent
WEB_ROOT = ROOT / 'web'
INPUT_ODS = ROOT / 'sample.ods'
PORT = 8500


class PremiumRequestHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urlparse(path)
        target = parsed.path

        if target in ('/', '/index.html'):
            return str(WEB_ROOT / 'index.html')
        if target == '/prediksi':
            return str(WEB_ROOT / 'prediksi.html')
        if target == '/referensi':
            return str(WEB_ROOT / 'referensi.html')
        if target == '/result' or target == '/hasil':
            return str(WEB_ROOT / 'result.html')

        candidate = WEB_ROOT / target.lstrip('/')
        if candidate.exists():
            return str(candidate)

        return str(ROOT / target.lstrip('/'))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/reference':
            self.respond_json(self.get_reference_data())
            return

        if parsed.path == '/api/patterns':
            self.respond_json(self.get_patterns_data())
            return

        super().do_GET()

    def get_reference_data(self):
        rows = read_ods_rows(str(INPUT_ODS))
        reference = build_reference_rows(rows)
        enriched = []

        for item in reference:
            enriched.append({
                '2D': item['2D'],
                'category': item['atas/bawah'],
                'jalur': item['jalur'],
                'digit1': item['digit1'],
                'digit2': item['digit2'],
                'sum': item['sum'],
                'parity': item['parity'],
                'reverse': item['reverse'],
                'kepala besar/kecil': item['kepala besar/kecil'],
                'ekor besar/kecil': item['ekor besar/kecil'],
                'kepala genap/ganjil': item['kepala genap/ganjil'],
                'ekor genap/ganjil': item['ekor genap/ganjil'],
                'kepala prima': item['kepala prima'],
                'ekor prima': item['ekor prima'],
                '3D_candidates': item['3D_candidates'].split(';'),
                '3D_patterns': item['3D_patterns'].split(';'),
                '4D_patterns': item['4D_patterns'].split(';'),
                '5D_patterns': item['5D_patterns'].split(';'),
                '6D_patterns': item['6D_patterns'].split(';'),
            })

        return enriched

    def get_patterns_data(self):
        reference = self.get_reference_data()
        return {
            item['2D']: {
                '3D_patterns': item['3D_patterns'],
                '4D_patterns': item['4D_patterns'],
                '5D_patterns': item['5D_patterns'],
                '6D_patterns': item['6D_patterns'],
            }
            for item in reference
        }

    def respond_json(self, data):
        payload = json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def run_server():
    server_address = ('', PORT)
    with HTTPServer(server_address, PremiumRequestHandler) as httpd:
        print(f'Premium web interface running at http://localhost:{PORT}')
        print('Tekan CTRL+C untuk menghentikan.')
        httpd.serve_forever()


if __name__ == '__main__':
    run_server()
