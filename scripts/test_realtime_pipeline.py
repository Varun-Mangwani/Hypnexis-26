import urllib.request
import json
import time

base = 'http://127.0.0.1:8000'

# 1. Ingest a new document (Markdown / Audit report)
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    f'--{boundary}\r\n'
    'Content-Disposition: form-data; name="file"; filename="quarterly_security_audit.md"\r\n'
    'Content-Type: text/markdown\r\n\r\n'
    '# Q3 Security Audit Report\n\n'
    '## Authentication & Cryptography\n'
    'All backend APIs must enforce TLS 1.3 with AES-256-GCM encryption at rest.\n'
    'Session timeouts are strictly enforced at 15 minutes of inactivity.\n\n'
    '## Zero-Trust Access Control\n'
    'Multi-factor authentication (MFA) with FIDO2 hardware keys is mandatory for database access.\n'
    'Admin access requires dual-custody authorization for production mutations.\r\n'
    f'--{boundary}--\r\n'
).encode('utf-8')

req = urllib.request.Request(f'{base}/api/corpora', data=body, method='POST')
req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
with urllib.request.urlopen(req) as r:
    corpus = json.loads(r.read())
print('Ingested Corpus:', corpus)
cid = corpus['corpus_id']

# 2. Trigger real-time evaluation run
run_req = urllib.request.Request(
    f'{base}/api/runs',
    data=json.dumps({'corpus_id': cid, 'name': 'Q3 Security Audit Run', 'probes_enabled': True}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(run_req) as r:
    run_res = json.loads(r.read())
print('Evaluation Triggered:', run_res)
rid = run_res['run_id']

# 3. Fetch run summary & live cases
time.sleep(1.2)
with urllib.request.urlopen(f'{base}/api/runs/{rid}') as r:
    summary = json.loads(r.read())
print('Run Status:', summary['status'])
print('Scores:', summary['scores'])

with urllib.request.urlopen(f'{base}/api/runs/{rid}/cases') as r:
    cases = json.loads(r.read())
print(f'Total Evaluated Cases: {len(cases)}')
for c in cases:
    print(f'  Case {c["id"]}: Verdict={c["verdict"]}, Faithfulness={c.get("scores", {}).get("faithfulness")}, Question="{c["question"][:55]}..."')
