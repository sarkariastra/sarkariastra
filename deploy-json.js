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

// Convert worker code to base64 to safely embed in JSON payload
const workerBase64 = Buffer.from(workerCode).toString('base64');

const payload = JSON.stringify({
  main_module: "worker.js",
  compatibility_date: "2024-03-20",
  bindings: [
    {
      name: "CACHE",
      type: "kv_namespace",
      namespace_id: "f6ea3043a83540faaa0eabd80582f12f"
    }
  ],
  modules: [
    {
      name: "worker.js",
      content: workerBase64,
      type: "ESModule"
    }
  ]
});

const req = https.request({
  hostname: 'api.cloudflare.com',
  path: `/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
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

req.write(payload);
req.end();
