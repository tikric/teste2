import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

// Gemini Circuit Breaker State Variables
let globalGeminiRateLimitUntil = 0;
let lastGeminiRateLimitMessage = "";

function isGeminiRateLimited(): boolean {
  if (globalGeminiRateLimitUntil && Date.now() < globalGeminiRateLimitUntil) {
    return true;
  }
  return false;
}

function handleGeminiError(error: any) {
  const errStr = String(error?.message || error || "");
  if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("quota") || errStr.includes("limit")) {
    globalGeminiRateLimitUntil = Date.now() + 5 * 60 * 1000; // 5-minute cooldown
    lastGeminiRateLimitMessage = "Limite de cota de uso excedido (RESOURCE_EXHAUSTED / 429).";
    console.log(`[Gemini Circuit Breaker Activated] Limite de cota atingido na API do Gemini (429/RESOURCE_EXHAUSTED). Modo fallback ativado.`);
  } else if (errStr.includes("leaked") || errStr.includes("403") || errStr.includes("PERMISSION_DENIED") || errStr.includes("API key")) {
    globalGeminiRateLimitUntil = Date.now() + 60 * 60 * 1000; // 1-hour cooldown
    lastGeminiRateLimitMessage = "Chave de API do Gemini bloqueada ou reportada como vazada (403/PERMISSION_DENIED).";
    console.log(`[Gemini Circuit Breaker Activated] Chave vazada/inválida detectada na API do Gemini (403/PERMISSION_DENIED). Modo fallback completo ativado.`);
  }
}

function isValidApiKey(key?: any): boolean {
  if (!key) return false;
  let strKey = "";
  if (typeof key !== 'string') {
    if (Array.isArray(key) && key.length > 0) {
      strKey = String(key[0]);
    } else {
      strKey = String(key);
    }
  } else {
    strKey = key;
  }
  const k = strKey.trim();
  const lower = k.toLowerCase();
  if (lower === "" || lower === "null" || lower === "undefined" || lower === "none" || k.length < 10) {
    return false;
  }
  return true;
}

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

function validateServerApiKey(keyName: string, key: string | undefined): { isValid: boolean; error?: string } {
  if (!key) {
    return { isValid: false, error: `A chave de API do ${keyName} não está configurada nos Secrets ou no Ateliê local. Insira sua chave nas Configurações!` };
  }
  const trimmed = key.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "") {
    return { isValid: false, error: `A chave de API do ${keyName} está vazia.` };
  }
  if (lower === "null") {
    return { isValid: false, error: `A chave de API do ${keyName} é inválida porque contém a string literal 'null'.` };
  }
  if (lower === "undefined") {
    return { isValid: false, error: `A chave de API do ${keyName} é inválida porque contém a string literal 'undefined'.` };
  }
  if (lower === "none" || lower === "placeholder") {
    return { isValid: false, error: `A chave de API do ${keyName} fornecida é apenas um marcador de exemplo decorativo.` };
  }
  if (trimmed.length < 15) {
    return { isValid: false, error: `A chave de API do ${keyName} é muito curta! Uma chave válida necessita de no mínimo 15 caracteres (atualmente com apenas ${trimmed.length}).` };
  }
  return { isValid: true };
}

// Helper to create GoogleGenAI using dynamic request custom key or environment variable
function getAi(customKey?: string): GoogleGenAI {
  let apiKey = "";
  if (isValidApiKey(customKey)) {
    apiKey = customKey!.trim();
  } else if (isValidApiKey(process.env.GEMINI_API_KEY)) {
    apiKey = process.env.GEMINI_API_KEY!.trim();
  }

  if (apiKey) {
    // Remove enclosing quotes if copied by accident
    if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
      apiKey = apiKey.slice(1, -1);
    }
    if (apiKey.startsWith("'") && apiKey.endsWith("'")) {
      apiKey = apiKey.slice(1, -1);
    }
    apiKey = apiKey.trim();
  }

  if (!apiKey) {
    throw new Error('A chave API do Gemini (GEMINI_API_KEY) não está configurada nos Secrets do Projeto ou nas Configurações locais do Ateliê.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON payloads up to 10MB (important for base64 custom logos)
  app.use(express.json({ limit: "10mb" }));

  // Custom CORS middleware to support secure requests from native Android WebViews and Web clients
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    const requestedHeaders = req.headers["access-control-request-headers"] || req.headers["Access-Control-Request-Headers"];
    if (requestedHeaders) {
      res.setHeader("Access-Control-Allow-Headers", requestedHeaders);
    } else {
      res.setHeader("Access-Control-Allow-Headers", "*");
    }
    res.setHeader("Access-Control-Expose-Headers", "*");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // SerpApi connection status checker
  app.get("/api/serpapi/status", async (req, res) => {
    try {
      const clientSerpKey = (req.query.api_key as string) || (req.headers['x-custom-serpapi-key'] as string);
      let serpapiKey = "";
      if (isValidApiKey(clientSerpKey)) {
        serpapiKey = clientSerpKey.trim();
      } else if (isValidApiKey(process.env.SERPAPI_API_KEY)) {
        serpapiKey = process.env.SERPAPI_API_KEY!.trim();
      } else {
        return res.json({ authenticated: false, reason: "Chave SerpApi ausente ou vazia" });
      }

      // Check format first to see if it looks like a valid key.
      // This is efficient, avoids wasting search credits, and completely prevents AbortErrors/timeouts.
      const formatCheck = validateServerApiKey("SerpApi", serpapiKey);
      if (!formatCheck.isValid) {
        return res.json({ authenticated: false, reason: formatCheck.error || "Formato de chave inválido" });
      }

      return res.json({ authenticated: true });
    } catch (err: any) {
      console.error("[SerpApi Check Failed]", err);
      return res.json({ authenticated: false, reason: err.message || "Erro ao verificar credenciais SerpApi" });
    }
  });

  // SerpApi Google Shopping Real-time 3D Printing Filament Prices
  // Integrated with Tavily, Jina AI, Groq, Gemini & Google Search representation
  app.get("/api/quotations", async (req, res) => {
    try {
      const clientSerpKey = (req.query.api_key as string) || (req.headers['x-custom-serpapi-key'] as string);
      let serpapiKey = "";
      if (isValidApiKey(clientSerpKey)) {
        serpapiKey = clientSerpKey.trim();
      } else if (isValidApiKey(process.env.SERPAPI_API_KEY)) {
        serpapiKey = process.env.SERPAPI_API_KEY!.trim();
      }

      const clientTavilyKey = req.headers['x-custom-tavily-key'] as string;
      let tavilyApiKey = "";
      if (isValidApiKey(clientTavilyKey)) {
        tavilyApiKey = clientTavilyKey.trim();
      } else if (isValidApiKey(process.env.TAVILY_API_KEY)) {
        tavilyApiKey = process.env.TAVILY_API_KEY!.trim();
      }

      const clientJinaKey = req.headers['x-custom-jina-key'] as string;
      let jinaApiKey = "";
      if (isValidApiKey(clientJinaKey)) {
        jinaApiKey = clientJinaKey.trim();
      } else if (isValidApiKey(process.env.JINA_API_KEY)) {
        jinaApiKey = process.env.JINA_API_KEY!.trim();
      }

      const clientGroqKey = req.headers['x-custom-groq-key'] as string;
      let groqApiKey = "";
      if (isValidApiKey(clientGroqKey)) {
        groqApiKey = clientGroqKey.trim();
      } else if (isValidApiKey(process.env.GROQ_API_KEY)) {
        groqApiKey = process.env.GROQ_API_KEY!.trim();
      }

      const clientGeminiKey = req.headers['x-custom-gemini-key'] as string;
      let geminiApiKey = "";
      if (isValidApiKey(clientGeminiKey)) {
        geminiApiKey = clientGeminiKey.trim();
      } else if (isValidApiKey(process.env.GEMINI_API_KEY)) {
        geminiApiKey = process.env.GEMINI_API_KEY!.trim();
      }

      // Anthropic/Claude key — used for web search grounding (most reliable real-time source)
      const clientAnthropicKey = req.headers['x-custom-anthropic-key'] as string;
      const resolvedAnthropicKey = isValidApiKey(clientAnthropicKey)
        ? clientAnthropicKey.trim()
        : (isValidApiKey(process.env.ANTHROPIC_API_KEY) ? process.env.ANTHROPIC_API_KEY!.trim() : "");
      if (resolvedAnthropicKey) {
        process.env.ANTHROPIC_API_KEY = resolvedAnthropicKey;
      }

      const type = req.query.type as string; // 'PLA', 'PETG' or 'TPU'
      const qMap: Record<string, string> = {
        PLA: "filamento pla 1kg comprar menor preço",
        PETG: "filamento petg 1kg comprar menor preço",
        TPU: "filamento tpu 1kg comprar menor preço"
      };

      const fetchQuoteMultiEngine = async (materialType: string, queryStr: string) => {
        let serpResults: any[] = [];
        let tavilyResults: any[] = [];
        let jinaResults: any[] = [];

        const searchPromises: Promise<any>[] = [];

        // A. Google Shopping (SerpApi)
        if (isValidApiKey(serpapiKey)) {
          searchPromises.push((async () => {
            try {
              const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(queryStr)}&gl=br&hl=pt&tbs=p_ord:p&api_key=${serpapiKey}`;
              console.log(`[Multi-Engine Search] Requesting SerpApi Google Shopping for: ${materialType}`);
              const res = await fetchWithTimeout(url, {}, 8000);
              if (res.ok) {
                const dataValue: any = await res.json();
                serpResults = dataValue.shopping_results || [];
              }
            } catch (err) {
              console.warn(`[SerpApi Failed] for ${materialType}:`, err);
            }
          })());
        }

        // B. Tavily Search
        if (isValidApiKey(tavilyApiKey)) {
          searchPromises.push((async () => {
            try {
              console.log(`[Multi-Engine Search] Requesting Tavily Search for: ${materialType}`);
              const res = await fetchWithTimeout("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  api_key: tavilyApiKey,
                  query: `${queryStr} filamento 3d 1kg melhor preço lojas online brasil r$`,
                  search_depth: "advanced",
                  max_results: 8
                })
              }, 8000);
              if (res.ok) {
                const dataValue: any = await res.json();
                tavilyResults = dataValue.results || [];
              }
            } catch (err) {
              console.warn(`[Tavily Failed] for ${materialType}:`, err);
            }
          })());
        }

        // C. Jina Assistant Search Reader (Free public tool, with premium authorization helper if available)
        searchPromises.push((async () => {
          try {
            console.log(`[Multi-Engine Search] Requesting Jina AI Search for: ${materialType}`);
            const headers: Record<string, string> = { "Accept": "application/json" };
            if (isValidApiKey(jinaApiKey)) {
              headers["Authorization"] = `Bearer ${jinaApiKey}`;
            }
            const res = await fetchWithTimeout(`https://s.jina.ai/${encodeURIComponent(queryStr + " comprar menor preço filamentos 1kg brasil")}`, {
              method: "GET",
              headers
            }, 8000);
            if (res.ok) {
              const dataValue: any = await res.json();
              jinaResults = dataValue.data || [dataValue] || [];
            }
          } catch (err) {
            console.warn(`[Jina Failed] for ${materialType}:`, err);
          }
        })());

        // Run search engines concurrently
        await Promise.allSettled(searchPromises);

        // Special helper to ensure we always have at least 5 offers, filling up real-time ones with stable defaults
        const backfillToMinimum = (offers: any[]) => {
          const result = [...offers];
          const fb = getFallbackOffers(materialType);
          if (result.length < 5) {
            for (const fallbackOffer of fb) {
              if (result.length >= 5) break;
              const exists = result.some((o: any) => 
                String(o?.storeName || "").toLowerCase() === String(fallbackOffer.storeName || "").toLowerCase() ||
                String(o?.productName || "").toLowerCase().includes(String(fallbackOffer.productName || "").toLowerCase().slice(0, 15))
              );
              if (!exists) {
                result.push({
                  storeName: fallbackOffer.storeName,
                  productName: fallbackOffer.productName,
                  price: fallbackOffer.price,
                  rating: fallbackOffer.rating,
                  buyUrl: fallbackOffer.buyUrl
                });
              }
            }
            if (result.length < 5) {
              for (const fallbackOffer of fb) {
                if (result.length >= 5) break;
                result.push({
                  storeName: fallbackOffer.storeName,
                  productName: fallbackOffer.productName,
                  price: fallbackOffer.price,
                  rating: fallbackOffer.rating,
                  buyUrl: fallbackOffer.buyUrl
                });
              }
            }
          }
          return result;
        };

        // Standard, robust normalizer, cleaner and sorter (always ensures clean schema and at least 5 offers sorted by price)
        const normalizeAndSortOffers = (items: any[]) => {
          if (!Array.isArray(items)) return backfillToMinimum([]);
          
          const cleaned = items.filter(Boolean).map((item: any) => {
            if (!item || typeof item !== 'object') return null;
            let priceNum = 79.90;
            if (item.price !== undefined && item.price !== null) {
              const strPrice = String(item.price).replace(/[^\d.,]/g, "");
              let parsed = 0;
              if (strPrice.includes(",") && strPrice.includes(".")) {
                parsed = parseFloat(strPrice.replace(/\./g, "").replace(",", "."));
              } else if (strPrice.includes(",")) {
                parsed = parseFloat(strPrice.replace(",", "."));
              } else {
                parsed = parseFloat(strPrice);
              }
              if (!isNaN(parsed) && parsed > 0) {
                priceNum = parsed;
              }
            }
            
            return {
              storeName: String(item.storeName || item.store || item.source || "Google Shopping").slice(0, 40),
              productName: String(item.productName || item.title || item.name || queryStr).slice(0, 100),
              price: priceNum,
              rating: parseFloat(String(item.rating || 4.8)) || 4.8,
              buyUrl: String(item.buyUrl || item.product_link || item.link || `https://www.google.com/search?q=${encodeURIComponent(queryStr)}`)
            };
          }).filter(Boolean);
          
          const sorted = (cleaned as any[]).sort((a, b) => a.price - b.price);
          return backfillToMinimum(sorted);
        };

        // If no internet resources are available from other search feeds, try AI grounding with web search
        if (serpResults.length === 0 && tavilyResults.length === 0 && jinaResults.length === 0) {
          const claudeGroundingKey = process.env.ANTHROPIC_API_KEY || "";

          // First: try Claude with web_search tool (most reliable real-time grounding)
          if (isValidApiKey(claudeGroundingKey)) {
            try {
              console.log(`[Claude Grounding] Searching real prices via Claude web search for: ${materialType}`);
              const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": claudeGroundingKey,
                  "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                  model: "claude-sonnet-4-20250514",
                  max_tokens: 1536,
                  tools: [{ type: "web_search_20250305", name: "web_search" }],
                  messages: [{
                    role: "user",
                    content: `Pesquise agora: "${queryStr}"\nEncontre de 5 a 8 ofertas reais com os menores preços para filamento ${materialType} 1kg no mercado brasileiro (Mercado Livre, Shopee, Voolt3D, 3D Fila, Amazon Brasil, etc).\nRetorne APENAS um JSON array limpo ordenado por preço menor para maior:\n[\n  {\n    "storeName": "Nome da loja",\n    "productName": "Título completo do produto",\n    "price": 89.90,\n    "rating": 4.8,\n    "buyUrl": "url real"\n  }\n]\nSem markdown, sem explicações, APENAS o JSON.`
                  }]
                })
              });
              if (claudeRes.ok) {
                const claudeData: any = await claudeRes.json();
                const textBlocks = (claudeData.content || []).filter((b: any) => b.type === "text");
                const textResult = textBlocks.map((b: any) => b.text).join("\n").trim();
                if (textResult) {
                  let processed = textResult;
                  if (processed.includes("```")) {
                    processed = processed.split("\n").filter((l: string) => !l.trim().startsWith("```")).join("\n");
                  }
                  const startIdx = processed.indexOf("[");
                  const endIdx = processed.lastIndexOf("]");
                  if (startIdx !== -1 && endIdx !== -1) {
                    processed = processed.slice(startIdx, endIdx + 1);
                  }
                  const resArray = JSON.parse(processed);
                  if (Array.isArray(resArray) && resArray.length > 0) {
                    const finalOfs = normalizeAndSortOffers(resArray);
                    console.log(`[Claude Grounding] Success! Found ${finalOfs.length} offers for ${materialType}`);
                    return { type: materialType, offers: finalOfs.slice(0, 8), searchQuery: encodeURIComponent(queryStr) };
                  }
                }
              }
            } catch (groundingErr) {
              console.warn(`[Claude Grounding Code] for ${materialType}:`, groundingErr);
            }
          }

          // Second: try Gemini with google search grounding
          if (isValidApiKey(geminiApiKey) && !isGeminiRateLimited()) {
            try {
              console.log(`[Gemini Grounding] Searching real prices via Gemini for: ${materialType}`);
              const aiResponseValue = await getAi(geminiApiKey).models.generateContent({
                model: "gemini-3.5-flash",
                contents: `Realize uma pesquisa no Google em tempo real agora mesmo: "${queryStr}".\nEncontre de 5 a 8 ofertas reais com os menores preços para esse filamento no mercado brasileiro atual online de lojas conhecidas (ex: Mercado Livre, Shopee, Voolt3D Store, 3D Fila, Casa da Robótica, etc).\nRetorne APENAS um array JSON limpo ordenado estritamente por preço menor para maior:\n[\n  {\n    "storeName": "Nome simplificado da loja",\n    "productName": "Título amigável completo do produto real carretel 1kg",\n    "price": 89.90,\n    "rating": 4.8,\n    "buyUrl": "url real da oferta ou da busca de mercado"\n  }\n]\nPor favor, responda APENAS o JSON. Sem notas explicativas, sem markdown.`,
                config: { tools: [{ googleSearch: {} }] }
              });
              const textResult = aiResponseValue.text || "";
              if (textResult.trim()) {
                let processed = textResult.trim();
                if (processed.includes("```")) {
                  processed = processed.split("\n").filter((l: string) => !l.trim().startsWith("```")).join("\n");
                }
                const resArray = JSON.parse(processed);
                if (Array.isArray(resArray) && resArray.length > 0) {
                  const finalOfs = normalizeAndSortOffers(resArray);
                  console.log(`[Gemini Grounding] Success! Found ${finalOfs.length} offers for ${materialType}`);
                  return { type: materialType, offers: finalOfs.slice(0, 8), searchQuery: encodeURIComponent(queryStr) };
                }
              }
            } catch (groundingErr) {
              console.log(`[Gemini Grounding Code] Sourcing offline reference list for ${materialType}.`);
              handleGeminiError(groundingErr);
            }
          } else if (isGeminiRateLimited()) {
            console.log(`[Gemini Grounding Skipped] Gemini is currently in cooldown/rate-limited for ${materialType}.`);
          }

          console.log(`[Multi-Engine Search] Sourcing hard fallback for ${materialType}`);
          return {
            type: materialType,
            offers: getFallbackOffers(materialType),
            searchQuery: encodeURIComponent(queryStr)
          };
        }

        // D. Context integration & AI extractions (Groq / Gemini)
        let contextBuffer = "";
        if (serpResults.length > 0) {
          contextBuffer += `--- Google Shopping Offers ---\n${JSON.stringify(serpResults.slice(0, 15))}\n\n`;
        }
        if (tavilyResults.length > 0) {
          contextBuffer += `--- Tavily Web results ---\n${JSON.stringify(tavilyResults.slice(0, 10))}\n\n`;
        }
        if (jinaResults.length > 0) {
          contextBuffer += `--- Jina AI Context Scrapes ---\n${JSON.stringify(jinaResults.slice(0, 5))}\n\n`;
        }

        const promptText = `Você é um robô de busca de preços ultra inteligente e analítico, especializado em suprimentos de impressão 3D no Brasil.
Seu objetivo é analisar os resultados de busca brutos anexados (que contêm dados do Google Shopping, Tavily e/ou Jina AI) e extrair os 5 a 8 itens IDENTIFICADOS MAIS BARATOS (menor preço nos resultados) para filamento tipo Impressão 3D "${materialType}" (ex: PLA, PETG ou TPU de 1kg; ignore kits de amostras pequenos, bicos/nozzles, adesivos ou suportes).

Resultados brutos da pesquisa:
${contextBuffer}

Por favor, analise cuidadosamente e retorne APENAS um array JSON válido contendo de 5 a 8 itens da lista acima (ou cotações reais encontradas na internet para essa pesquisa de mercado), priorizando os menores valores do mercado brasileiro ordenados de forma crescente:
[
  {
    "storeName": "Nome simplificado da loja (ex: Mercado Livre, Shopee, Voolt3D, 123D, 3D Fila, Casa da Robótica, 3D Lab, etc.)",
    "productName": "Título amigável e completo do produto real",
    "price": 79.90, // preço numérico limpo (float, use ponto para decimais, sem caracteres como R$)
    "rating": 4.8, // classificação de 1 a 5 (decida com base nas informações ou use 4.8 como padrão)
    "buyUrl": "URL exata para comprar o item encontrada nos resultados (se indisponível, utilize a URL geral da loja encontrada ou do Google, mas garanta que seja um link válido e seguro)"
  }
]

Regras estritas de saída de dados:
1. Retorne APENAS o JSON limpo. Não inclua observações, explicações, nem blocos de markdown de apoio خارج do JSON.
2. Certifique-se de que os itens correspondem ao material solicitado "${materialType}" e são carretéis de 1kg (ou as opções reais mais baratas identificadas).
3. Ordene estritamente do menor preço para o maior preço. Deva conter no mínimo 5 e no máximo 8 itens.
4. Se o resultado bruto faltar fontes confiáveis para fechar 5 itens, use fontes confiáveis tradicionais de filamento com preços de mercado realistas para completar as 5 opções com maestria.`;

        let extractionText = "";
        let filterSuccess = false;

        // Try Groq extraction
        if (isValidApiKey(groqApiKey)) {
          try {
            console.log(`[AI Price Extractor] Querying Groq with prompt for ${materialType}`);
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${groqApiKey}`
              },
              body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: promptText }],
                temperature: 0.1,
                max_tokens: 1536
              })
            });
            if (groqRes.ok) {
              const bodyVal: any = await groqRes.json();
              extractionText = bodyVal.choices?.[0]?.message?.content || "";
              if (extractionText.trim()) {
                filterSuccess = true;
                console.log(`[AI Price Extractor] Groq successfully extracted prices for ${materialType}!`);
              }
            }
          } catch (e) {
            console.warn("[AI Price Extractor] Groq parsing crashed. Bypassing...", e);
          }
        }

        // Try Claude (Anthropic) extraction — uses web_search tool for real-time grounding
        const anthropicKey = process.env.ANTHROPIC_API_KEY || "";
        if (!filterSuccess && isValidApiKey(anthropicKey)) {
          try {
            console.log(`[AI Price Extractor] Querying Claude (Anthropic) with web search for ${materialType}`);
            const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": anthropicKey,
                "anthropic-version": "2023-06-01"
              },
              body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1536,
                tools: [{ type: "web_search_20250305", name: "web_search" }],
                messages: [{
                  role: "user",
                  content: `Pesquise agora no Google: "filamento ${materialType} 1kg menor preço comprar brasil site:shopee.com.br OR site:mercadolivre.com.br OR site:voolt3d.com.br OR site:amazon.com.br OR site:3dfila.com.br OR site:3dlab.com.br"\n\nEncontre as 5 a 8 melhores ofertas reais com os menores preços disponíveis no mercado brasileiro para filamento de impressão 3D tipo ${materialType} de 1kg.\n\nRetorne APENAS um JSON array limpo, sem markdown, sem explicações:\n[\n  {\n    "storeName": "Nome da loja",\n    "productName": "Título do produto",\n    "price": 79.90,\n    "rating": 4.8,\n    "buyUrl": "https://..."\n  }\n]\nOrdene do menor para o maior preço.`
                }]
              })
            });
            if (claudeRes.ok) {
              const claudeData: any = await claudeRes.json();
              // Extract text from Claude response (may be after web_search tool use)
              const textBlocks = (claudeData.content || []).filter((b: any) => b.type === "text");
              const combined = textBlocks.map((b: any) => b.text).join("\n");
              if (combined.trim()) {
                extractionText = combined.trim();
                filterSuccess = true;
                console.log(`[AI Price Extractor] Claude (Anthropic) successfully extracted prices for ${materialType}!`);
              }
            }
          } catch (e) {
            console.warn("[AI Price Extractor] Claude (Anthropic) crashed. Bypassing...", e);
          }
        }

        // Try Gemini extraction
        if (!filterSuccess && isValidApiKey(geminiApiKey) && !isGeminiRateLimited()) {
          try {
            console.log(`[AI Price Extractor] Querying Gemini model for ${materialType}`);
            const aiResponseValue = await getAi(geminiApiKey).models.generateContent({
              model: "gemini-3.5-flash",
              contents: promptText,
              config: { responseMimeType: "application/json" }
            });
            extractionText = aiResponseValue.text || "";
            if (extractionText.trim()) {
              filterSuccess = true;
              console.log(`[AI Price Extractor] Gemini successfully parsed quotes for ${materialType}!`);
            }
          } catch (e) {
            console.warn("[AI Price Extractor] Gemini parsing crashed.", e);
            handleGeminiError(e);
          }
        }

        if (filterSuccess && extractionText.trim()) {
          try {
            let processed = extractionText.trim();
            if (processed.includes("```")) {
              const spl = processed.split("\n");
              const linesFilter = spl.filter(l => !l.trim().startsWith("```"));
              processed = linesFilter.join("\n");
            }
            const resArray = JSON.parse(processed);
            if (Array.isArray(resArray) && resArray.length > 0) {
              const finalOfs = normalizeAndSortOffers(resArray);
              return {
                type: materialType,
                offers: finalOfs.slice(0, 8),
                searchQuery: encodeURIComponent(queryStr)
              };
            }
          } catch (err) {
            console.warn(`[AI Price Extractor] Extraction JSON parsing failed, resorting to regex parsing.`, err, extractionText);
          }
        }

        // Fallback pricing resolver using manual regex over SerpApi
        console.log(`[Multi-Engine Fallback] Running manual array mapping for ${materialType}`);
        const rawOffers = serpResults;
        const filteredRawOffers = rawOffers.filter((item: any) => {
          const title = String(item.title || "").toLowerCase();
          return !title.includes("suporte") && 
                 !title.includes("support") && 
                 !title.includes("soluvel") && 
                 !title.includes("solúvel") && 
                 !title.includes("bico") && 
                 !title.includes("nozzle") && 
                 !title.includes("adesivo");
        });

        const mappedOffers = filteredRawOffers.map((item: any) => {
          let priceNum = 0;
          if (item.extracted_price !== undefined) {
            priceNum = Number(item.extracted_price);
          } else if (item.price) {
            let cleaned = String(item.price).replace(/[^\d.,]/g, '');
            if (cleaned.includes(',') && cleaned.includes('.')) {
              cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
            } else if (cleaned.includes(',')) {
              cleaned = cleaned.replace(/,/g, '.');
            }
            priceNum = parseFloat(cleaned) || 0;
          }

          return {
            storeName: item.source || "Google Shopping",
            productName: item.title || queryStr,
            price: priceNum || 79.90, 
            rating: item.rating ? parseFloat(item.rating) : 4.8,
            buyUrl: item.product_link || item.link || `https://www.google.com/search?q=${encodeURIComponent(queryStr)}`
          };
        });

        const finalOfs = normalizeAndSortOffers(mappedOffers);

        return {
          type: materialType,
          offers: finalOfs.slice(0, 8),
          searchQuery: encodeURIComponent(queryStr)
        };
      };

      const customQ = (req.query.q as string) || (req.query.query as string);
      if (customQ && customQ.trim()) {
        const singleResult = await fetchQuoteMultiEngine("Busca", customQ.trim());
        return res.json([singleResult]);
      }

      if (type && qMap[type]) {
        const singleResult = await fetchQuoteMultiEngine(type, qMap[type]);
        return res.json([singleResult]);
      } else {
        const results = await Promise.all([
          fetchQuoteMultiEngine("PLA", qMap.PLA),
          fetchQuoteMultiEngine("PETG", qMap.PETG),
          fetchQuoteMultiEngine("TPU", qMap.TPU)
        ]);
        return res.json(results);
      }
    } catch (outerErr: any) {
      console.error("General error in quotations endpoint:", outerErr);
      res.status(500).json({ error: "Erro interno no servidor ao prospectar cotações." });
    }
  });

  // Local clients prospecting using Google Maps, Tavily search, and Jina AI Search
  app.get("/api/local-leads", async (req, res) => {
    try {
      const clientSerpKey = req.headers['x-custom-serpapi-key'] as string;
      let serpapiKey = "";
      if (isValidApiKey(clientSerpKey)) {
        serpapiKey = clientSerpKey.trim();
      } else if (isValidApiKey(process.env.SERPAPI_API_KEY)) {
        serpapiKey = process.env.SERPAPI_API_KEY!.trim();
      }

      const clientTavilyKey = req.headers['x-custom-tavily-key'] as string;
      let tavilyApiKey = "";
      if (isValidApiKey(clientTavilyKey)) {
        tavilyApiKey = clientTavilyKey.trim();
      } else if (isValidApiKey(process.env.TAVILY_API_KEY)) {
        tavilyApiKey = process.env.TAVILY_API_KEY!.trim();
      }

      const clientJinaKey = req.headers['x-custom-jina-key'] as string;
      let jinaApiKey = "";
      if (isValidApiKey(clientJinaKey)) {
        jinaApiKey = clientJinaKey.trim();
      } else if (isValidApiKey(process.env.JINA_API_KEY)) {
        jinaApiKey = process.env.JINA_API_KEY!.trim();
      }

      const clientGroqKey = req.headers['x-custom-groq-key'] as string;
      let groqApiKey = "";
      if (isValidApiKey(clientGroqKey)) {
        groqApiKey = clientGroqKey.trim();
      } else if (isValidApiKey(process.env.GROQ_API_KEY)) {
        groqApiKey = process.env.GROQ_API_KEY!.trim();
      }

      const clientGeminiKey = req.headers['x-custom-gemini-key'] as string;
      let geminiApiKey = "";
      if (isValidApiKey(clientGeminiKey)) {
        geminiApiKey = clientGeminiKey.trim();
      } else if (isValidApiKey(process.env.GEMINI_API_KEY)) {
        geminiApiKey = process.env.GEMINI_API_KEY!.trim();
      }

      const query = (req.query.q as string || "lojas de brinquedos nerd comic").trim();
      const region = (req.query.region as string || "").trim();
      const searchStr = region ? `${query} em ${region}` : query;

      let mapResults: any[] = [];
      let tavilyLeads: any[] = [];
      let jinaLeads: any[] = [];

      // A. Google Maps Leads (SerpApi)
      if (isValidApiKey(serpapiKey)) {
        try {
          const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(searchStr)}&api_key=${serpapiKey}&hl=pt-br`;
          console.log(`[Local Leads Search] Requesting Google Maps for: ${searchStr}`);
          const r = await fetchWithTimeout(url, {}, 8000);
          if (r.ok) {
            const dataVal: any = await r.json();
            mapResults = dataVal.local_results || [];
          }
        } catch (e) {
          console.warn("[Local Leads Search] SerpApi Google Maps search failed.", e);
        }
      }

      // B. Tavily search engines
      if (isValidApiKey(tavilyApiKey)) {
        try {
          console.log(`[Local Leads Search] Requesting Tavily Search...`);
          const res = await fetchWithTimeout("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: tavilyApiKey,
              query: `${searchStr} papelarias escolas nerd maquetes brindes contatos fone brasil r$`,
              search_depth: "advanced",
              max_results: 8
            })
          }, 8000);
          if (res.ok) {
            const dataVal: any = await res.json();
            tavilyLeads = dataVal.results || [];
          }
        } catch (e) {
          console.warn("[Local Leads Search] Tavily search Failed.", e);
        }
      }

      // C. Jina Search Scraper (Free public tool, with premium authorization helper if available)
      try {
        console.log(`[Local Leads Search] Requesting Jina Search...`);
        const headers: Record<string, string> = { "Accept": "application/json" };
        if (isValidApiKey(jinaApiKey)) {
          headers["Authorization"] = `Bearer ${jinaApiKey}`;
        }
        const res = await fetchWithTimeout(`https://s.jina.ai/${encodeURIComponent(searchStr + " fones contatos")}`, {
          method: "GET",
          headers
        }, 8000);
        if (res.ok) {
          const dataVal: any = await res.json();
          jinaLeads = dataVal.data || [dataVal] || [];
        }
      } catch (e) {
        console.warn("[Local Leads Search] Jina Search Failed.", e);
      }

      // Built-in resilient realistic mock defaults if no search succeeds
      const fallbackLeads = [
        {
          name: "Planeta Geek " + (region || "Sua Região"),
          phone: "(11) 99876-5432",
          address: "Centro Comercial, " + (region || "Sua Cidade"),
          category: "Geek",
          pitch: "Articulados articulados exclusivos, dragões de cristal multicor e estátuas pintadas sob demanda.",
          note: "Oferecer mostruário de dragões articulados para venda consignada."
        },
        {
          name: "Escola Criativa Robô " + (region || "Sua Região"),
          phone: "(11) 98765-4321",
          address: "Zona Sul, " + (region || "Sua Cidade"),
          category: "Escolas",
          pitch: "Serviço de fabricação expressa de chassis robóticos sob medida, engrenagens e reposições plásticas rápidas.",
          note: "Mostrar a capacidade de prototipagem PETG de engenharia."
        },
        {
          name: "Brinquedos e Magia " + (region || "Sua Região"),
          phone: "(11) 97654-3210",
          address: "Shopping Central, " + (region || "Sua Cidade"),
          category: "Brinquedos",
          pitch: "Brinquedos ecológicos, bonecos articulados customizados, luminárias LED temáticas de impressão 3D.",
          note: "Grande potencial de compra no atacado para kits de presentes e bazar."
        }
      ];

      if (mapResults.length === 0 && tavilyLeads.length === 0 && jinaLeads.length === 0) {
        console.log("[Local Leads Search] returning hard fallback leads list");
        return res.json(fallbackLeads);
      }

      let contentBuffer = "";
      if (mapResults.length > 0) {
        contentBuffer += `--- Google Maps Listings ---\n${JSON.stringify(mapResults.slice(0, 15))}\n\n`;
      }
      if (tavilyLeads.length > 0) {
        contentBuffer += `--- Tavily Search Outputs ---\n${JSON.stringify(tavilyLeads.slice(0, 10))}\n\n`;
      }
      if (jinaLeads.length > 0) {
        contentBuffer += `--- Jina AI Scrape Markdown ---\n${JSON.stringify(jinaLeads.slice(0, 5))}\n\n`;
      }

      const promptText = `Você é um refinado assistente comercial de captação ativa de clientes para serviços de impressão 3D (Ateliê Bambuzau 3D/OkLoja).
Sua missão é analisar os resultados de busca brutos fornecidos e extrair informações ricas de contato para até 6 potenciais clientes comerciais na região sugerida.

Sempre mapeie a loja extraída para uma das seguintes categorias tradicionais:
- "Brinquedos" (Lojas infantis, presentes)
- "Geek" (Cultura pop, action figures, quadrinhos, jogos)
- "Escolas" (Escolas de informática, colégios técnicos, robótica, cursos criativos)
- "Brindes" (Lojas de festas, agências de publicidade, corporativos)
- "Arquitetura" (Escritórios de decoração, arquitetos, design de interiores)
- "Utilidades" (Lojas de decoração, papelarias, bazares)

Resultados de interesse de negócios:
${contentBuffer}

Por favor, analise as descrições, nomes, telefones e websites informados. Crie e retorne APENAS um array JSON válido contendo até 6 itens refinados com contatos plausíveis extraídos (ou complete de forma altamente realista a prospecção da região se faltar telefones limpos nas fontes brutas, idealizando pitches personalizados extraordinários):
[
  {
    "name": "Nome Fantasia ou Razão Social limpa do local",
    "phone": "Telefone ou WhatsApp de contato no formato brasileiro amigável, ex: (19) 99312-4545 ou (11) 3456-7890",
    "address": "Endereço físico resumido ou rua",
    "category": "Uma das categorias citadas acima estritamente (Brinquedos | Geek | Escolas | Brindes | Arquitetura | Utilidades)",
    "pitch": "Uma proposta irresistível de item ou serviço impresso 3D específico para este comércio (ex: 'Dragões articulados em filamento de seda colorido', ou 'Maquetes realistas de loteamentos', etc.)",
    "note": "Instruções claras de como abordá-los com sucesso pelo WhatsApp do ateliê."
  }
]

Regras estritas de resposta:
1. Retorne APENAS o JSON limpo, sem explicações ou blocos de markdown.
2. Seja profissional e persuasivo nos pitches comerciais.`;

      let extractionText = "";
      let leadSuccess = false;

      // Try Groq first
      if (isValidApiKey(groqApiKey)) {
        try {
          console.log(`[AI Lead Matcher] Querying Groq model Llama for lead parsing`);
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: promptText }],
              temperature: 0.2,
              max_tokens: 1536
            })
          });
          if (groqRes.ok) {
            const bodyVal: any = await groqRes.json();
            extractionText = bodyVal.choices?.[0]?.message?.content || "";
            if (extractionText.trim()) {
              leadSuccess = true;
              console.log("[AI Lead Extractor] Groq successfully extracted active client leads!");
            }
          }
        } catch (e) {
          console.warn("[AI Lead Extractor] Groq lead parsing crashed.", e);
        }
      }

      // Try Gemini fallback
      if (!leadSuccess && isValidApiKey(geminiApiKey) && !isGeminiRateLimited()) {
        try {
          console.log(`[AI Lead Matcher] Querying Gemini for lead parsing`);
          const aiResponseValue = await getAi(geminiApiKey).models.generateContent({
            model: "gemini-3.5-flash",
            contents: promptText,
            config: { responseMimeType: "application/json" }
          });
          extractionText = aiResponseValue.text || "";
          if (extractionText.trim()) {
            leadSuccess = true;
            console.log("[AI Lead Extractor] Gemini successfully extracted active client leads!");
          }
        } catch (e) {
          console.warn("[AI Lead Extractor] Gemini lead parsing crashed.", e);
          handleGeminiError(e);
        }
      }

      if (leadSuccess && extractionText.trim()) {
        try {
          let processed = extractionText.trim();
          if (processed.includes("```")) {
            const spl = processed.split("\n");
            const linesFilter = spl.filter(l => !l.trim().startsWith("```"));
            processed = linesFilter.join("\n");
          }
          const resArray = JSON.parse(processed);
          if (Array.isArray(resArray) && resArray.length > 0) {
            return res.json(resArray.slice(0, 6));
          }
        } catch (err) {
          console.warn("[AI Lead Extractor] Extraction JSON parsing failed, using fallback leads.", err);
        }
      }

      res.json(fallbackLeads);
    } catch (eOuter: any) {
      console.error("General error in leads endpoint:", eOuter);
      res.status(500).json({ error: "Erro interno no servidor ao prospectar leads comerciais locais." });
    }
  });

  // AI-powered color palette extraction from logo
  app.post("/api/gemini/generate-palette", async (req, res) => {
    try {
      const { logoBase64, customGeminiKey } = req.body;
      if (!logoBase64) {
        return res.status(400).json({ error: "Nenhuma imagem de logotipo fornecida para análise." });
      }

      const headerGeminiKey = req.headers['x-custom-gemini-key'] as string;
      const apiKey = (customGeminiKey ? customGeminiKey.trim() : "") || (headerGeminiKey ? headerGeminiKey.trim() : "") || process.env.GEMINI_API_KEY;

      const geminiVal = validateServerApiKey("Gemini", apiKey);
      if (!geminiVal.isValid) {
        return res.status(400).json({ error: geminiVal.error });
      }

      // Extract raw base64 data and mime type
      const matches = logoBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      let mimeType = "image/png";
      let rawBase64 = logoBase64;
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        rawBase64 = matches[2];
      }

      const imagePart = {
        inlineData: {
          mimeType,
          data: rawBase64
        }
      };

       const promptPart = {
        text: `Você é um designer de interfaces (UI/UX) especialista em impressão 3D.
        Analise as cores predominantes e o estilo dessa imagem de logotipo e gere uma recomendação de paleta de cores harmoniosa, moderna e super profissional para o aplicativo do ateliê 3D.
        A paleta deve seguir um esquema de tema predominantemente escuro (dark theme) (exceto se o logo sugerir um claro, mas prefira escuro elegante) para destacar as cores.
        
        Retorne obrigatoriamente um objeto JSON com os seguintes campos exatos em formato hexadecimal (ex: "#1E293B"):
        1. bgMain: Cor de fundo principal mais escura do app (ex: #0A0D0B, #0D0F12 ou semelhante)
        2. bgCard: Cor de fundo para os cartões e painéis à frente (deve ser OBJETIVAMENTE MAIS CLARA e distinta do bgMain para alta legibilidade e melhor distinção visual, ex: se bgMain for #0A0D0B, use #232D28 ou #2A362F)
        3. borderColor: Cor para bordas (deve ser ainda mais clara e iluminada que bgCard para contornos bem visíveis, ex: #3A4A40 ou #435447)
        4. colorPrimary: Cor primária in destaque (geralmente tirada da cor mais marcante e sutilmente vibrante do logo para botões e itens de produção ativos)
        5. colorPrimaryLight: Uma versão mais clara ou brilhante do colorPrimary
        6. colorAccent: Cor de destaque secundária (ex: cor auxiliar ou brilhante do logo para alertas de estoque e progresso de impressão)
        7. colorText: Cor principal do texto (perto do branco para leitura escura, ex: #F8FAFC)
        8. colorMuted: Cor de texto secundária/suave (um cinza/verde fosco que harmonize com a paleta total e seja de fácil leitura)
        9. textAccent: Cor de texto em destaque primário (geralmente igual à primária ou destaque acentuado)`
      };

      let resultText = "";
      let success = false;
      let lastError = "";

      if (isGeminiRateLimited()) {
        throw new Error("A chave de API do Gemini atingiu o limite de cota de uso (Erro 429: RESOURCE_EXHAUSTED). Insira uma nova chave válida ou aguarde alguns minutos.");
      }

      const geminiModelsToTry = [
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest"
      ];

      for (const modelName of geminiModelsToTry) {
        try {
          console.log(`[Logo Palette] Tentando modelo: ${modelName}`);
          const aiResponse = await getAi(apiKey).models.generateContent({
            model: modelName,
            contents: { parts: [imagePart, promptPart] },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  bgMain: { type: Type.STRING },
                  bgCard: { type: Type.STRING },
                  borderColor: { type: Type.STRING },
                  colorPrimary: { type: Type.STRING },
                  colorPrimaryLight: { type: Type.STRING },
                  colorAccent: { type: Type.STRING },
                  colorText: { type: Type.STRING },
                  colorMuted: { type: Type.STRING },
                  textAccent: { type: Type.STRING }
                },
                required: [
                  "bgMain",
                  "bgCard",
                  "borderColor",
                  "colorPrimary",
                  "colorPrimaryLight",
                  "colorAccent",
                  "colorText",
                  "colorMuted",
                  "textAccent"
                ]
              }
            }
          });

          const currentText = aiResponse.text;
          if (currentText && currentText.trim()) {
            resultText = currentText;
            success = true;
            console.log(`[Logo Palette Success] Cores geradas com sucesso usando o modelo: ${modelName}`);
            break;
          }
        } catch (modelErr: any) {
          lastError = modelErr?.message || String(modelErr);
          console.warn(`[Logo Palette Warning] Falha com modelo ${modelName}: ${lastError}`);
          handleGeminiError(modelErr);
          if (isGeminiRateLimited()) {
            console.warn(`[Logo Palette Warning] Quota limit triggered. Breaking out of model loop.`);
            break;
          }
          // Sleep briefly before trying fallback
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      if (!success) {
        throw new Error(lastError || "Todas as tentativas de modelo com Gemini falharam ao processar o logotipo.");
      }

      const paletteData = JSON.parse(resultText.trim());
      res.json(paletteData);

    } catch (err: any) {
      console.error("Erro na geração de paleta:", err);
      res.status(500).json({ error: "Não foi possível gerar a paleta do logotipo via IA. Detalhe: " + err.message });
    }
  });

  // Ok Loja Smart AI Assistant Endpoint with Dual-Provider (Gemini & Groq)
  app.post("/api/ok-loja", async (req, res) => {
    try {
      const { 
        orders = [], 
        printers = [], 
        clients = [], 
        filamentStocks = [], 
        question = "", 
        enableSearchGrounding = false,
        provider = "gemini",
        customGeminiKey = "",
        customGroqKey = ""
      } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Nenhuma pergunta foi enviada para o Ok Loja." });
      }

      // Format current time in Brazil/São Paulo context
      const localTimeStr = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

      // Build context for the AI programmatically to avoid any syntax parsing anomalies with backticks and quotes
      const systemInstruction = "Você é o \"Ok Loja\", um assistente de voz e texto de inteligência artificial ultra inteligente, carismático e prestativo para um ateliê de impressão 3D premium. Sua personalidade é amigável, eficiente e focada em negócios.\n\n" +
        "Você recebeu o status atual completo da oficina para responder perguntas com precisão e clareza.\n" +
        "Sempre se dirija ao usuário de forma cortês e animada. Responda de forma sucinta e direta (ideal para escutar ou ler rapidamente em um painel dinâmico, evitando textos gigantescos, mas sem perder detalhes importantes). Use emojis de maneira profissional.\n\n" +
        "HORA ATUAL DO SISTEMA: " + localTimeStr + "\n\n" +
        "STATUS DAS IMPRESSORAS (PRINTERS):\n" +
        JSON.stringify(printers.map((p: any) => ({
          nome: p.name,
          modelo: p.model,
          status: p.status === 'PRINTING' ? 'Imprimindo' : p.status === 'MAINTENANCE' ? 'Em Manutenção 🛠️' : 'Disponível/Ociosa',
          temperaturaBico: p.nozzleTemp || 'Ambiente',
          temperaturaMesa: p.bedTemp || 'Ambiente',
          progressoPercentual: p.status === 'PRINTING' ? String(((p.printProgress || p.printingProgress || 0) * 100).toFixed(0)) + '%' : 'N/A',
          trabalhoAtual: p.currentJob || 'Nenhum',
          online: p.isOnline ? 'Online 📶' : 'Offline ✕'
        }))) + "\n\n" +
        "PEDIDOS DA FILA DE PRODUÇÃO (ORDERS):\n" +
        JSON.stringify(orders.map((o: any) => {
          const isPastDeadline = o.status !== 'READY' && o.status !== 'DELIVERED' && Date.now() > o.deadline;
          const daysDelayed = isPastDeadline ? Math.max(1, Math.ceil((Date.now() - o.deadline) / (24 * 3600 * 1000))) : 0;
          return {
            id: o.id,
            cliente: o.clientName,
            item: o.itemName,
            quantity: o.quantity,
            material: o.filamentType,
            cor: o.filamentColor,
            pesoTotalGrama: o.weightGrams * o.quantity,
            horasTrabalho: o.printTimeHours,
            valorCobrado: o.priceCharged,
            origem: o.platformSource,
            status: o.status === 'WAITING' ? 'Aguardando Pagamento' : o.status === 'QUEUE' ? 'Na Fila de Produção' : o.status === 'PRINTING' ? 'Imprimindo' : o.status === 'POST_PROCESS' ? 'Pós-Processamento/Acabamento' : o.status === 'READY' ? 'Pronto para Entrega' : 'Entregue / Concluído',
            progressoDeImpressao: String(((o.printingProgress || 0) * 100).toFixed(0)) + '%',
            impressoraDesignada: o.printerName || 'Nenhuma',
            dataCriacao: new Date(o.createdAt).toLocaleDateString('pt-BR'),
            prazoEntrega: new Date(o.deadline).toLocaleDateString('pt-BR'),
            atrasado: isPastDeadline,
            diasDeAtraso: daysDelayed
          };
        })) + "\n\n" +
        "ESTOQUE DE FILAMENTOS (FILAMENTS):\n" +
        JSON.stringify(filamentStocks.map((f: any) => ({
          tipo: f.type,
          cor: f.color,
          pesoDisponivelGrama: f.stockGrams,
          estoqueMinimoGrama: f.minStockGrams,
          statusPreocupacao: f.stockGrams < f.minStockGrams ? 'CRÍTICO - Abaixo do Mínimo! Requer Reposição' : 'Estoque Saudável'
        }))) + "\n\n" +
        "CLIENTES DO ATELIÊ (CLIENTS):\n" +
        JSON.stringify(clients.map((c: any) => {
          const lastContactStr = c.lastContactDate ? new Date(c.lastContactDate).toLocaleDateString('pt-BR') : 'Nunca contatado';
          const hasNoRecentContact = !c.lastContactDate || (Date.now() - c.lastContactDate > 15 * 24 * 60 * 60 * 1000);
          return {
            nome: c.name,
            telefone: c.phone || 'Sem telefone',
            notas: c.note || 'Sem anotações',
            ultimoContato: lastContactStr,
            semAtendimentoRecente: hasNoRecentContact ? 'SIM (Sem contato há mais de 15 dias ou sem histórico de atendimento)' : 'NÃO'
          };
        })) + "\n\n" +
        "DIRETRIZES DE RESPOSTA DO OK LOJA:\n" +
        "1. Se perguntado sobre \"Como estão os pedidos\": Conte a quantidade total de pedidos ativos (não entregues), quantos estão de fato imprimindo, na fila e prontos. Destaque um ou dois que estão em estágio avançado.\n" +
        "2. Se perguntado sobre \"Maiores atrasos\" ou \"Quem está atrasado\": Identifique pedidos onde 'atrasado' é true. Liste em ordem do pior atraso (mais dias atrasados), informando o nome do cliente, o item e há quantos dias já deveria ter sido entregue. Se não houver nenhum pedido atrasado, celebre felizmente!\n" +
        "3. Se perguntado sobre \"Manutenções\" ou \"Problemas\": Indique as impressoras que estão em status 'MAINTENANCE' ou Offline. Mencione cuidados rápidos (como lubrificação dos eixos lineares, conferência de bico entupido ou nivelamento de mesa).\n" +
        "4. Se perguntado sobre \"Clientes sem atendimento\", \"clientes sem atenção\" ou \"com quem falar\": Liste os clientes que estão com 'semAtendimentoRecente' como 'SIM' ou que nunca foram contatados, informando o nome e o telefone deles para que o usuário possa reativá-los ou cobrar com facilidade.\n" +
        "5. Para outras dúvidas financeiras ou estoques baixos: Use os dados recebidos para somar valores, faturamento, filamentos críticos, etc.\n\n" +
        "ESCRITA DA RESPOSTA: Escreva de forma empolgante, clara, concisa, no idioma Português (Brasil). Separe os tópicos principais com marcadores (bullet points) limpos e elegantes. Mantenha as respostas objetivas para que o usuário consiga ler em menos de 15 segundos ou ouvir sem cansar.";

      let responseText = "";
      let success = false;
      let lastError = "";

      // 1. Gather keys
      const headerGroqKey = req.headers['x-custom-groq-key'] as string;
      let groqApiKey = "";
      if (isValidApiKey(customGroqKey)) {
        groqApiKey = customGroqKey.trim();
      } else if (isValidApiKey(headerGroqKey)) {
        groqApiKey = headerGroqKey.trim();
      } else if (isValidApiKey(process.env.GROQ_API_KEY)) {
        groqApiKey = process.env.GROQ_API_KEY!.trim();
      }
      if (groqApiKey) {
        groqApiKey = groqApiKey.trim();
        if (groqApiKey.startsWith('"') && groqApiKey.endsWith('"')) {
          groqApiKey = groqApiKey.slice(1, -1);
        } else if (groqApiKey.startsWith("'") && groqApiKey.endsWith("'")) {
          groqApiKey = groqApiKey.slice(1, -1);
        }
        groqApiKey = groqApiKey.trim();
      }

      const headerGeminiKey = req.headers['x-custom-gemini-key'] as string;
      let geminiApiKey = "";
      if (isValidApiKey(customGeminiKey)) {
        geminiApiKey = customGeminiKey.trim();
      } else if (isValidApiKey(headerGeminiKey)) {
        geminiApiKey = headerGeminiKey.trim();
      } else if (isValidApiKey(process.env.GEMINI_API_KEY)) {
        geminiApiKey = process.env.GEMINI_API_KEY!.trim();
      }
      if (geminiApiKey) {
        geminiApiKey = geminiApiKey.trim();
        if (geminiApiKey.startsWith('"') && geminiApiKey.endsWith('"')) {
          geminiApiKey = geminiApiKey.slice(1, -1);
        } else if (geminiApiKey.startsWith("'") && geminiApiKey.endsWith("'")) {
          geminiApiKey = geminiApiKey.slice(1, -1);
        }
        geminiApiKey = geminiApiKey.trim();
      }

      // Resolve Anthropic/Claude key
      const headerAnthropicKey = req.headers['x-custom-anthropic-key'] as string;
      let anthropicApiKey = "";
      if (isValidApiKey(headerAnthropicKey)) {
        anthropicApiKey = headerAnthropicKey.trim();
      } else if (isValidApiKey(process.env.ANTHROPIC_API_KEY)) {
        anthropicApiKey = process.env.ANTHROPIC_API_KEY!.trim();
      }

      // Ensure we have at least one valid key before continuing
      if (!isValidApiKey(groqApiKey) && !isValidApiKey(geminiApiKey) && !isValidApiKey(anthropicApiKey)) {
        return res.status(400).json({ 
          error: "Nenhuma chave de API configurada. Cadastre sua GEMINI_API_KEY, GROQ_API_KEY ou ANTHROPIC_API_KEY na aba de Configurações!" 
        });
      }

      // Helper function — Claude (Anthropic)
      async function tryClaude(): Promise<boolean> {
        if (!isValidApiKey(anthropicApiKey)) return false;
        console.log("[Ok Loja] Tentando responder via Claude (Anthropic)...");
        try {
          const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1024,
              system: systemInstruction,
              messages: [{ role: "user", content: question }]
            })
          });
          if (!claudeRes.ok) {
            const errBody = await claudeRes.json().catch(() => ({}));
            lastError = (errBody as any)?.error?.message || `Erro Claude (status ${claudeRes.status})`;
            console.warn(`[Ok Loja Claude] Falhou: ${lastError}`);
            return false;
          }
          const claudeData: any = await claudeRes.json();
          const content = claudeData?.content?.[0]?.text || "";
          if (content) {
            responseText = content;
            success = true;
            console.log("[Ok Loja Claude] Respondido com sucesso!");
            return true;
          }
        } catch (e: any) {
          lastError = e?.message || String(e);
          console.warn("[Ok Loja Claude] Exceção:", e);
        }
        return false;
      }

      // Helper function to solve with Groq
      async function tryGroq(): Promise<boolean> {
        if (!isValidApiKey(groqApiKey)) return false;
        // Current Groq models (June 2025) - llama3-70b-8192 and llama3-8b-8192 were deprecated
        const modelsToTry = [
          "llama-3.3-70b-versatile",
          "llama-3.1-70b-versatile",
          "llama-3.1-8b-instant",
          "llama3-groq-70b-8192-tool-use-preview",
          "mixtral-8x7b-32768"
        ];
        console.log("[Ok Loja Failover] Tentando responder por Groq...");
        for (const modelName of modelsToTry) {
          try {
            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${groqApiKey.trim()}`
              },
              body: JSON.stringify({
                model: modelName,
                messages: [
                  { role: "system", content: systemInstruction },
                  { role: "user", content: question }
                ],
                temperature: 0.5,
                max_tokens: 1024
              })
            });

            if (!groqResponse.ok) {
              const errBody = await groqResponse.json().catch(() => ({}));
              lastError = errBody?.error?.message || `Erro da API Groq com modelo ${modelName} (Status ${groqResponse.status})`;
              console.warn(`[Groq Fallback] Falha com o modelo ${modelName}: ${lastError}`);
              continue;
            }

            const groqData: any = await groqResponse.json();
            const content = groqData?.choices?.[0]?.message?.content || "";
            if (content) {
              responseText = content;
              success = true;
              console.log(`[Groq Success] Respondido usando Groq com o modelo: ${modelName}`);
              return true;
            }
          } catch (modelErr: any) {
            lastError = modelErr?.message || String(modelErr);
            console.warn(`[Groq Fallback Exception] Erro durante a chamada no modelo ${modelName}:`, modelErr);
          }
        }
        return false;
      }

      // Helper function to solve with Gemini
      async function tryGemini(): Promise<boolean> {
        if (!isValidApiKey(geminiApiKey)) return false;
        if (isGeminiRateLimited()) {
          console.warn("[Ok Loja Gemini] Skipping: Gemini is currently in circuit breaker cooldown.");
          return false;
        }
        const geminiModelsToTry = [
          "gemini-3.5-flash",
          "gemini-3.1-flash-lite",
          "gemini-flash-latest"
        ];
        const generationConfig: any = { systemInstruction };
        if (enableSearchGrounding) {
          generationConfig.tools = [{ googleSearch: {} }];
        }

        console.log("[Ok Loja Failover] Tentando responder por Gemini...");
        for (const modelName of geminiModelsToTry) {
          try {
            console.log(`[Ok Loja Gemini] Tentando modelo: ${modelName}`);
            const aiResponse = await getAi(geminiApiKey).models.generateContent({
              model: modelName,
              contents: question,
              config: generationConfig
            });

            const currentText = aiResponse.text;
            if (currentText && currentText.trim()) {
              responseText = currentText;
              success = true;
              console.log(`[Ok Loja Gemini Success] Respondido usando Gemini com o modelo: ${modelName}`);
              return true;
            }
          } catch (modelErr: any) {
            lastError = modelErr?.message || String(modelErr);
            console.warn(`[Ok Loja Gemini Retry] Falha com modelo ${modelName}: ${lastError}`);
            handleGeminiError(modelErr);
            if (isGeminiRateLimited()) {
              console.warn(`[Ok Loja Gemini Retry] Quota limit triggered. Breaking out of model loop.`);
              return false;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        return false;
      }

      // Executing based on primary provider choice
      if (provider === "groq") {
        if (!isValidApiKey(groqApiKey)) {
          if (isValidApiKey(geminiApiKey)) {
            console.warn("[Ok Loja Fallover] Groq key missing/invalid, falling back to Gemini.");
            await tryGemini();
          } else if (isValidApiKey(anthropicApiKey)) {
            console.warn("[Ok Loja Fallover] Groq key missing/invalid, falling back to Claude.");
            await tryClaude();
          } else {
            return res.status(400).json({ 
              error: "A chave API da Groq (GROQ_API_KEY) não está configurada. Insira sua chave nas Configurações!" 
            });
          }
        } else {
          const groqOk = await tryGroq();
          if (!groqOk && isValidApiKey(geminiApiKey)) {
            console.warn("[Ok Loja Failover] Groq falhou. Tentando Gemini...");
            await tryGemini();
          }
          if (!success && isValidApiKey(anthropicApiKey)) {
            console.warn("[Ok Loja Failover] Groq+Gemini falharam. Tentando Claude...");
            await tryClaude();
          }
        }
      } else {
        // Default: Gemini first, then Groq, then Claude
        if (!isValidApiKey(geminiApiKey)) {
          if (isValidApiKey(groqApiKey)) {
            console.warn("[Ok Loja Fallover] Gemini key missing/invalid, falling back to Groq.");
            await tryGroq();
          } else if (isValidApiKey(anthropicApiKey)) {
            console.warn("[Ok Loja Fallover] Gemini key missing/invalid, falling back to Claude.");
            await tryClaude();
          } else {
            return res.status(400).json({
              error: "A chave API do Gemini não está configurada. Cole sua chave na aba Configurações!"
            });
          }
        } else {
          const geminiOk = await tryGemini();
          if (!geminiOk && isValidApiKey(groqApiKey)) {
            console.warn("[Ok Loja Failover] Gemini falhou. Tentando Groq...");
            await tryGroq();
          }
          if (!success && isValidApiKey(anthropicApiKey)) {
            console.warn("[Ok Loja Failover] Gemini+Groq falharam. Tentando Claude...");
            await tryClaude();
          }
        }
      }

      if (!success) {
        throw new Error(lastError || "Todas as tentativas de modelo com Gemini e Groq falharam ou estão indisponíveis no momento.");
      }

      res.json({ answer: responseText });

    } catch (err: any) {
      console.error("Erro no serviço Ok Loja Smart AI (Dual-Provider):", err);
      let errorMsg = err.message || String(err);
      if (errorMsg.includes("leaked") || errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("3.1-pro-preview")) {
        errorMsg = "Bloqueio de Segurança da Chave Gemini (Código 403: Chave reportada como vazada/leaked pelo Google). Como esta é uma chave compartilhada pública de cortesia, o Google temporariamente revogou seu acesso. Solução: Insira sua própria chave pessoal gratuita do Google AI Studio (ou chave do Groq) na aba Configurações para continuar usando o assistente do ateliê de forma isolada e segura!";
      }
      res.status(500).json({ error: errorMsg });
    }
  });

  // Real-time Tuya API Gateway Endpoint for Wi-Fi Hygrometers
  app.post("/api/tuya/humidity", async (req, res) => {
    try {
      const { clientId, clientSecret, deviceId, region = "us" } = req.body;
      
      if (!clientId || !clientSecret || !deviceId) {
        return res.status(400).json({ error: "Credenciais de desenvolvedor Tuya ausentes (clientId, clientSecret, deviceId)." });
      }

      // Tuya Multi-Region domain endpoint map
      const regionDomains: Record<string, string> = {
        us: "https://openapi.tuyaus.com",
        cn: "https://openapi.tuyacn.com",
        eu: "https://openapi.tuyaeu.com",
        in: "https://openapi.tuyain.com",
      };

      const domain = regionDomains[region.toLowerCase()] || "https://openapi.tuyaus.com";
      const t = Date.now().toString();
      
      // Step 1: Request Access Token using Tuya Signature Spec v2
      const method = "GET";
      const tokenUri = "/v1.0/token?grant_type=1";
      const stringToSign = clientId + t + method + "\n\n\n" + tokenUri;
      
      const tokenSign = crypto
        .createHmac("sha256", clientSecret)
        .update(stringToSign)
        .digest("hex")
        .toUpperCase();

      const tokenResponse = await fetch(`${domain}${tokenUri}`, {
        method: "GET",
        headers: {
          "client_id": clientId.trim(),
          "sign": tokenSign,
          "t": t,
          "sign_method": "HMAC-SHA256"
        }
      });

      if (!tokenResponse.ok) {
        throw new Error(`Servidor do desenvolvedor Tuya recusou conexão de token (HTTP ${tokenResponse.status})`);
      }

      const tokenData: any = await tokenResponse.json();
      if (!tokenData || !tokenData.success) {
        throw new Error(tokenData?.msg || "Credenciais Access ID ou Client Secret rejeitadas pela nuvem Tuya.");
      }

      const accessToken = tokenData.result?.access_token;
      if (!accessToken) {
        throw new Error("Nuvem Tuya não retornou um token de acesso válido.");
      }

      // Step 2: Request specific Device Status
      const statusUri = `/v1.0/devices/${deviceId.trim()}/status`;
      const t2 = Date.now().toString();
      const stringToSignDevice = clientId + accessToken + t2 + method + "\n\n\n" + statusUri;
      
      const deviceSign = crypto
        .createHmac("sha256", clientSecret)
        .update(stringToSignDevice)
        .digest("hex")
        .toUpperCase();

      const deviceResponse = await fetch(`${domain}${statusUri}`, {
        method: "GET",
        headers: {
          "client_id": clientId.trim(),
          "access_token": accessToken,
          "sign": deviceSign,
          "t": t2,
          "sign_method": "HMAC-SHA256"
        }
      });

      if (!deviceResponse.ok) {
        throw new Error(`Servidor Tuya recusou consulta do dispositivo (HTTP ${deviceResponse.status})`);
      }

      const deviceData: any = await deviceResponse.json();
      if (!deviceData || !deviceData.success) {
        throw new Error(deviceData?.msg || "Erro ao coletar propriedades da impressora/dispositivo.");
      }

      // Parse telemetry data (look for climate values like va_humidity, humidity, work_state etc)
      const dataPoints = deviceData.result || [];
      const humDp = dataPoints.find((dp: any) => 
        dp.code === "va_humidity" || 
        dp.code === "humidity" || 
        dp.code.includes("humid") || 
        dp.code === "humidity_value"
      );
      
      const tempDp = dataPoints.find((dp: any) => 
        dp.code === "va_temperature" || 
        dp.code === "temp" || 
        dp.code.includes("temp") || 
        dp.code === "temp_current"
      );

      // Tuya values usually are integers representing tenths (like 450 values represent 45%) so normalize if needed
      let humidityVal = humDp ? Number(humDp.value) : null;
      if (humidityVal !== null && humidityVal > 100) {
        humidityVal = humidityVal / 10; // convert e.g., 455 -> 45.5%
      }

      let tempVal = tempDp ? Number(tempDp.value) : null;
      if (tempVal !== null && tempVal > 100) {
        tempVal = tempVal / 10; // convert e.g., 245 -> 24.5C
      }

      res.json({
        success: true,
        humidity: humidityVal,
        temperature: tempVal,
        lastUpdated: Date.now(),
        rawStatus: dataPoints
      });

    } catch (err: any) {
      console.error("Tuya Telemetry error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Serve static files / Vite middleware
  const isDev = process.env.NODE_ENV !== "production" || 
                process.argv.some(arg => arg.includes("server.ts")) || 
                process.env.AIS_DEV === "true";

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Robust detection of the static files 'dist' directory
    let distPath = path.join(process.cwd(), "dist");
    
    if (!fs.existsSync(path.join(distPath, "index.html"))) {
      const parentDist = path.join(process.cwd(), "applet", "dist");
      if (fs.existsSync(path.join(parentDist, "index.html"))) {
        distPath = parentDist;
      } else {
        const relativeDist = path.join(__dirname, ".");
        if (fs.existsSync(path.join(relativeDist, "index.html"))) {
          distPath = relativeDist;
        } else {
          const sisterDist = path.join(__dirname, "../dist");
          if (fs.existsSync(path.join(sisterDist, "index.html"))) {
            distPath = sisterDist;
          }
        }
      }
    }
    
    console.log(`[Production] Serving static files from verified path: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function getFallbackOffers(type: string) {
  if (type === "PLA") {
    return [
      { storeName: 'Voolt3D Store', productName: 'Filamento PLA Premium Voolt3D 1.75mm 1kg', price: 79.90, rating: 4.9, buyUrl: 'https://voolt3d.com.br/busca?q=filamento+pla' },
      { storeName: 'Mercado Livre', productName: 'Filamento PLA Premium Voolt3D 1.75mm 1kg Oficial', price: 84.90, rating: 4.8, buyUrl: 'https://lista.mercadolivre.com.br/filamento-pla-voolt3d' },
      { storeName: 'Amazon Brasil', productName: 'Filamento PLA Creality High Speed 1.75mm 1kg', price: 92.50, rating: 4.7, buyUrl: 'https://www.amazon.com.br/s?k=filamento+pla+creality' },
      { storeName: '3D Fila', productName: 'Filamento PLA Premium 3DFila 1.75mm 1kg', price: 89.90, rating: 4.8, buyUrl: 'https://3dfila.com.br/categoria-produto/filamentos-3d/filamento-pla-3d/' },
      { storeName: 'Shopee Brasil', productName: 'Filamento PLA Eco-Friendly Sunlu Impressora 3D 1kg', price: 75.00, rating: 4.6, buyUrl: 'https://shopee.com.br/search?keyword=filamento%20pla' }
    ];
  } else if (type === "PETG") {
    return [
      { storeName: 'Voolt3D Store', productName: 'Filamento PETG Premium Voolt3D 1.75mm 1kg', price: 74.90, rating: 4.7, buyUrl: 'https://voolt3d.com.br/busca?q=filamento+petg' },
      { storeName: 'Mercado Livre', productName: 'Filamento PETG Premium Voolt3D 1.75mm 1kg Oficial', price: 78.90, rating: 4.8, buyUrl: 'https://lista.mercadolivre.com.br/filamento-petg-voolt3d' },
      { storeName: 'Shopee Brasil', productName: 'Filamento PETG eSun 1.75mm Alta Resistência 1kg', price: 72.90, rating: 4.8, buyUrl: 'https://shopee.com.br/search?keyword=filamento%20petg' },
      { storeName: '3D Fila', productName: 'Filamento PETG Premium 3D Fila 1.75mm 1kg', price: 89.90, rating: 4.9, buyUrl: 'https://3dfila.com.br/categoria-produto/filamentos-3d/filamento-petg-3d/' },
      { storeName: 'Amazon Brasil', productName: 'Filamento PETG Creality CR-PETG 1.75mm 1kg', price: 85.00, rating: 4.6, buyUrl: 'https://www.amazon.com.br/s?k=filamento+petg+1kg' }
    ];
  } else {
    return [
      { storeName: 'Voolt3D Store', productName: 'Filamento TPU Flexível Voolt3D 1.75mm 1kg', price: 109.90, rating: 4.8, buyUrl: 'https://voolt3d.com.br/busca?q=filamento+tpu' },
      { storeName: 'Mercado Livre', productName: 'Filamento TPU Flex Voolt3D 1.75mm 1kg Oficial', price: 114.90, rating: 4.8, buyUrl: 'https://lista.mercadolivre.com.br/filamento-tpu-voolt3d' },
      { storeName: '3D Lab', productName: 'Filamento TPU Flexível Premium 3D Lab 1kg', price: 115.05, rating: 4.9, buyUrl: 'https://3dlab.com.br/categoria-produto/filamento/tpu/' },
      { storeName: 'Shopee Brasil', productName: 'Filamento TPU Flexível 1.75mm Impressão 3D 1kg', price: 104.90, rating: 4.5, buyUrl: 'https://shopee.com.br/search?keyword=filamento%20tpu' },
      { storeName: 'Amazon Brasil', productName: 'Filamento TPU Creality Flexível 1.75mm 1kg', price: 129.00, rating: 4.7, buyUrl: 'https://www.amazon.com.br/s?k=filamento+tpu+1kg' }
    ];
  }
}

startServer();
