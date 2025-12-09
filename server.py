#!/usr/bin/env python3
import http.server
import ssl

PORT = 8080

httpd = http.server.HTTPServer(('0.0.0.0', PORT), http.server.SimpleHTTPRequestHandler)

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain('cert.pem', 'key.pem')
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f'Starting HTTPS server on port {PORT}...')
print(f'Access at: https://localhost:{PORT}/')
print(f'Or from other devices: https://192.168.0.229:{PORT}/')
httpd.serve_forever()
