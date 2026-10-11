const fs = require('fs');
const https = require('https');

const accountId = "b8e6acc16f03ab25e92792968d66c637";
const workerName = "sarkariastra";
const kvNamespaceId = "f6ea3043a83540faaa0eabd80582f12f";
const token = process.env.CF_API_TOKEN;

if (!token) {
  console.error("Error: CF_API_TOKEN is not set!");
  process.exit(1);
}

const workerCode = fs.readFileSync('worker.js', 'utf8');

const metadata = {
  body_part: "worker.js",
  bindings: [
    {
      name: "CACHE",
      type: "kv_namespace",
      namespace_id: kvNamespaceId
    }
  ]
};

const boundary = "----CloudflareBoundary7MA4YWxkTrZu0gW";
let postData = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="metadata"; filename="metadata.json"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n`),
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="worker.js"; filename="worker.js"\r\nContent-Type: application/javascript\r\n\r\n${workerCode}\r\n`),
  Buffer.from(`--${boundary}--\r\n`)
]);

const req = https.request({
  hostname: 'api.cloudflare.com',
  path: `/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': postData.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Deploy Response:", data);
  });
});

req.on('error', (e) => {
  console.error("Error:", e);
});

req.write(postData);
req.end();
