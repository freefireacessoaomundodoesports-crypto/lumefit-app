import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const SYSTEM_PROMPT = `
És um especialista em nutrição africana com conhecimento profundo de culinária moçambicana e sul-africana.

ALIMENTOS QUE DEVES RECONHECER SEMPRE:
Moçambique: xima, matapa, cacana, mapewa, caril de amendoim, camarão grelhado, peixe grelhado, frango grelhado, arroz branco, feijão, mandioca cozida, batata-doce, farinha de milho, mukupa, nhemba, espinafre cozido (massambala).
África do Sul: bunny chow, pap, chakalaka, boerewors, potjiekos, braai, gatho, roti com caril.
Culinária Internacional: pizza, hambúrguer, massa, arroz frito, frango frito, salada, sopa, ovos, pão.

REGRAS CRÍTICAS:
1. Analisa TUDO o que está visível no prato — todos os alimentos, molhos, bebidas, guarnições.
2. O total_kcal = soma de TODOS os itens no prato.
3. Nunca calculas apenas um ingrediente isolado.
4. Se não reconheceres um alimento, estima por textura, cor e tamanho. Indica com "(estimativa)" na observação.
5. Responde SEMPRE em português de Moçambique.
6. O campo "pais_origem" deve refletir a origem do prato (ex: "Moçambique", "Portugal", "Brasil", "EUA").

FORMATO DE RESPOSTA OBRIGATÓRIO — Responde APENAS com JSON puro, sem markdown, sem blocos de código:
{
  "status": "OK",
  "analise": {
    "prato_nome": "Nome do prato completo",
    "pais_origem": "País de origem",
    "confianca_score": 95,
    "total_kcal": 650,
    "macros": {
      "proteina": 35,
      "carbs": 70,
      "gordura": 18
    },
    "ingredientes_detalhados": [
      { "item": "Xima", "kcal": 300, "obs": "porção grande, ~200g" },
      { "item": "Matapa", "kcal": 200, "obs": "com amendoim e coco" }
    ],
    "sodiumMg": 450,
    "fiberG": 4.5,
    "sugarsG": 2.1,
    "vitaminAPct": 15,
    "vitaminCPct": 20,
    "ironPct": 10,
    "calciumPct": 8
  },
  "insights_saude": "Refeição rica em hidratos de carbono. Considera adicionar mais vegetais para equilibrar."
}

SE TIVERES DÚVIDAS sobre o que está no prato, usa status "DUVIDA":
{
  "status": "DUVIDA",
  "perguntas_clarificacao": ["Consegues dizer-me o nome do prato?"],
  "analise": null
}
`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
      }
    });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: true, message: "GEMINI_API_KEY não configurada no servidor." }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  try {
    const body = await req.json();
    const { type, image, user_description, data } = body;
    const userContext = data?.context || "";

    if (type !== 'analysis') {
      return new Response(
        JSON.stringify({ error: true, message: "Tipo de requisição inválido." }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!image) {
      return new Response(
        JSON.stringify({ error: true, message: "Imagem não recebida." }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Extract base64 data from data URL if needed
    let imageBase64 = image;
    let mimeType = "image/jpeg";
    if (image.startsWith("data:")) {
      const parts = image.split(",");
      const metaPart = parts[0]; // e.g. data:image/jpeg;base64
      imageBase64 = parts[1];
      const mimeMatch = metaPart.match(/data:([^;]+)/);
      if (mimeMatch) mimeType = mimeMatch[1];
    }

    const userMessage = [
      "Analisa esta imagem de refeição e identifica TODOS os alimentos visíveis.",
      user_description ? `Descrição fornecida pelo utilizador: "${user_description}"` : "",
      userContext ? `Contexto adicional: "${userContext}"` : "",
      "IMPORTANTE: Responde APENAS com JSON puro. Sem markdown, sem blocos de código. Começa com { e termina com }.",
    ].filter(Boolean).join("\n");

    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              }
            },
            { text: userMessage }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 8192,
      }
    };

    const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-2.0-flash-001"];
    let geminiData: any = null;
    let lastError = "";
    for (const model of GEMINI_MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });
      if (geminiResponse.ok) {
        geminiData = await geminiResponse.json();
        console.log("Model used:", model);
        break;
      }
      const errorText = await geminiResponse.text();
      lastError = `${model}: ${geminiResponse.status} - ${errorText}`;
      console.error("Model failed:", lastError);
    }
    if (!geminiData) {
      return new Response(
        JSON.stringify({ error: true, message: `Todos os modelos falharam: ${lastError}` }),
        { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const allParts = geminiData?.candidates?.[0]?.content?.parts || [];
    let rawText = "";
    for (const p of allParts) {
      if (p.text && !p.thought) {
        rawText += p.text;
      }
    }

    // Clean JSON from potential markdown wrappers
    let cleaned = rawText.trim();

    // Remover blocos de "thinking" do gemini-2.5
    cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
    cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    // Extrair apenas o JSON
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }

    let result: any;
    try {
      result = JSON.parse(cleaned);
    } catch (_parseErr) {
      console.error("RAWTEXT_LENGTH:", rawText.length);
      console.error("RAWTEXT_CHARS_0_100:", rawText.substring(0, 100));
      console.error("RAWTEXT_CHARS_LAST_100:", rawText.substring(rawText.length - 100));
      return new Response(
        JSON.stringify({ error: true, message: "Não foi possível processar a resposta da IA." }),
        { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (err: any) {
    console.error("Unhandled error in analyze-meal:", err);
    return new Response(
      JSON.stringify({ error: true, message: err?.message || "Erro interno do servidor." }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
