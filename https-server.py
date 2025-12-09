#!/usr/bin/env python3
"""
Simple HTTPS server for face tracking app
Generates self-signed certificate if needed
"""

import http.server
import ssl
import os
import subprocess

PORT = 8080

# Generate self-signed certificate if it doesn't exist
if not os.path.exists('cert.pem') or not os.path.exists('key.pem'):
    print('📜 Generating self-signed certificate...')
    subprocess.run([
        'openssl', 'req', '-new', '-x509', '-keyout', 'key.pem', '-out', 'cert.pem',
        '-days', '365', '-nodes',
        '-subj', '/C=US/ST=State/L=City/O=Organization/CN=localhost'
    ])
    print('✅ Certificate generated!')

# Create HTTPS server
httpd = http.server.HTTPServer(('0.0.0.0', PORT), http.server.SimpleHTTPRequestHandler)

# Wrap with SSL
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain('cert.pem', 'key.pem')
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f'🚀 HTTPS Server running at:')
print(f'   https://localhost:{PORT}')
print(f'   https://192.168.0.229:{PORT}')
print(f'\nPress Ctrl+C to stop')

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print('\n👋 Server stopped')
