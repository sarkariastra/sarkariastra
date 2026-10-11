export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests are allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    try {
      const body = await request.json();
      const keyword = String(body.keyword || "").trim();

      if (!keyword) {
        return new Response(
          JSON.stringify({ error: "Keyword is required" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      const cacheKey = "search:v1:" + keyword.toLowerCase();

      const cached = await env.CACHE.get(cacheKey, "json");

      if (cached) {
        return new Response(
          JSON.stringify({
            cached: true,
            data: cached
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      const prompt = `
Search the web for the latest government job, admit card, result,
syllabus, answer key, admission, recruitment or official notification
information related to: "${keyword}".

Return ONLY valid JSON in this exact format:
{
  "results": [
    {
      "title": "string",
      "organization": "string",
      "url": "https://example.com",
      "type": "Job|Result|Admit Card|Syllabus|Answer Key|Admission|Notification",
      "date": "string"
    }
  ]
}

Return up to 4 highly relevant results.
Prefer official government/organization websites.
Do not invent URLs or information.
`;

      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            tools: [
              {
                google_search: {}
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();

        return new Response(
          JSON.stringify({
            error: "Gemini API error",
            details: errorText
          }),
          {
            status: 502,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      const geminiData = await geminiResponse.json();

      const text =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        return new Response(
          JSON.stringify({
            error: "Gemini returned no usable result"
          }),
          {
            status: 502,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        result = {
          results: []
        };
      }

      await env.CACHE.put(
        cacheKey,
        JSON.stringify(result),
        {
          expirationTtl: 86400
        }
      );

      return new Response(
        JSON.stringify({
          cached: false,
          data: result
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Worker error",
          details: error.message
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
  }
};
