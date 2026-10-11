const fs = require('fs');
const https = require('https');

const accountId = "b8e6acc16f03ab25e92792968d66c637";
const workerName = "sarkariastra";
const token = process.env.CF_API_TOKEN;

if (!token) {
  console.error("CF_API_TOKEN is missing!");
  process.exit(1);
}

const workerCode = fs.readFileSync('worker.js', 'utf8');

// Using boundary manually in Node.js to ensure 100% compatibility with Cloudflare API
const boundary = '----CloudflareWorkerBoundary' + Math.random().toString(36).substring(2);

const metadata = JSON.stringify({
  bindings: [
    {
      name: "CACHE",
      type: "kv_namespace",
      namespace_id: "f6ea3043a83540faaa0eabd80582f12f"
    }
  ]
});

let body = '';
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="metadata"; filename="metadata.json"\r\n`;
body += `Content-Type: application/json\r\n\r\n`;
body += `${metadata}\r\n`;

body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="worker.js"; filename="worker.js"\r\n`;
body += `Content-Type: application/javascript\r\n\r\n`;
body += `${workerCode}\r\n`;
body += `--${boundary}--\r\n`;

const req = https.request({
  hostname: 'api.cloudflare.com',
  path: `/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Response:", data);
  });
});

req.on('error', (e) => {
  console.error("Error:", e);
});

req.write(body);
req.end();
