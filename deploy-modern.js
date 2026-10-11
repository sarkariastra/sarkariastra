const fs = require('fs');

async function deploy() {
  const accountId = "b8e6acc16f03ab25e92792968d66c637";
  const workerName = "sarkariastra";
  const token = process.env.CF_API_TOKEN;

  if (!token) {
    console.error("CF_API_TOKEN is missing!");
    process.exit(1);
  }

  const formData = new FormData();

  const metadata = {
    bindings: [
      {
        name: "CACHE",
        type: "kv_namespace",
        namespace_id: "f6ea3043a83540faaa0eabd80582f12f"
      }
    ]
  };

  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }), 'metadata.json');
  
  const workerCode = fs.readFileSync('worker.js', 'utf8');
  formData.append('worker.js', new Blob([workerCode], { type: 'application/javascript' }), 'worker.js');

  console.log("Deploying classic worker...");
  
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Deployment failed:", err);
  }
}

deploy();
