addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event));
});

async function handleRequest(request, event) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";

    if (!query.trim()) {
      return new Response(JSON.stringify({ error: "Query parameter 'q' is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const cacheKey = "search:" + query.trim().toLowerCase();

    // 1. Check KV Cache
    let cachedResult = await CACHE.get(cacheKey);
    if (cachedResult) {
      return new Response(JSON.stringify({
        source: "cache",
        result: JSON.parse(cachedResult)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Call Gemini API with Fallback models
    const models = ["gemini-3.8-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let geminiData = null;
    let lastError = "";

    const geminiPayload = {
      contents: [{
        parts: [{ text: "You are SarkariAstra, an assistant for Indian government exams, jobs, admissions, and results. Answer accurately and clearly using clean Markdown. Use ## for main headings and ### for subheadings. Use bullet lists and numbered steps where appropriate. Use valid Markdown tables only for structured comparisons, with a header row and separator row. Always put a space after heading markers. Never output strange symbols such as 井 or 并. Do not wrap the entire answer in a code block. Include clickable Markdown links only for official URLs you know are genuine. Never invent official links, dates, results, vacancies, or notifications. If information is uncertain or cannot be verified, say so clearly. Organize the answer for easy reading. User query: " + query }]
      }]
    };

    for (const model of models) {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=` + GEMINI_API_KEY;
      
      const geminiResponse = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload)
      });

      if (geminiResponse.ok) {
        geminiData = await geminiResponse.json();
        break;
      } else {
        lastError = await geminiResponse.text();
      }
    }

    if (!geminiData) {
      throw new Error("All Gemini models busy or failed: " + lastError);
    }

    let answerText = "No results found.";
    if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content && geminiData.candidates[0].content.parts && geminiData.candidates[0].content.parts[0]) {
      answerText = geminiData.candidates[0].content.parts[0].text;
    }

    const responsePayload = {
      query: query,
      answer: answerText,
      timestamp: new Date().toISOString()
    };

    // 3. Save to KV Cache
    event.waitUntil(CACHE.put(cacheKey, JSON.stringify(responsePayload), { expirationTtl: 43200 }));

    // 4. Return response
    return new Response(JSON.stringify({
      source: "gemini",
      result: responsePayload
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
