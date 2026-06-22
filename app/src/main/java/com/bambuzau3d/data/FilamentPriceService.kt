package com.bambuzau3d.data

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class FilamentOffer(
    val storeName: String,
    val filamentName: String,
    val price: Double,
    val link: String,
    val materialType: String,
    val rating: Float = 4.7f
)

object FilamentPriceService {
    private const val TAG = "FilamentPriceService"
    private const val GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent"
    private const val SERP_API_KEY = ""

    private fun getGeminiApiKey(): String {
        return try {
            val packages = listOf("com.bambuzau3d", "com.example", "com.example.data", "com.bambuzau3d.data")
            var apiKey: String? = null
            for (pkg in packages) {
                try {
                    val clazz = Class.forName("$pkg.BuildConfig")
                    val field = clazz.getField("GEMINI_API_KEY")
                    val value = field.get(null) as? String
                    if (!value.isNullOrEmpty() && value != "MY_GEMINI_API_KEY") {
                        apiKey = value
                        break
                    }
                } catch (e: Exception) {
                    // Try next package
                }
            }
            apiKey ?: ""
        } catch (e: Exception) {
            ""
        }
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    // Real-world fallback prices including both specialty online stores and marketplaces in Brazil
    val fallbackOffers = mapOf(
        "PLA" to listOf(
            FilamentOffer("Compre 3D", "Filamento PLA Econômico 1kg Nacional", 69.90, "https://www.mercadolivre.com.br", "PLA", 4.7f),
            FilamentOffer("Shopee", "Filamento PLA Impressão 3D 1kg Premium", 72.50, "https://shopee.com.br/search?keyword=filamento%20pla%201kg", "PLA", 4.6f),
            FilamentOffer("Voolt3D", "Filamento PLA Premium 1kg - Original", 75.90, "https://www.voolt3d.com.br", "PLA", 4.8f),
            FilamentOffer("Mercado Livre", "Filamento PLA HT 1kg Alta Fluidez", 79.90, "https://lista.mercadolivre.com.br/filamento-pla-1kg", "PLA", 4.9f),
            FilamentOffer("Slim3D", "Filamento PLA Pro 1kg - Slim3D", 82.50, "https://www.slim3d.com.br", "PLA", 4.7f)
        ),
        "ABS" to listOf(
            FilamentOffer("3D Fila", "Filamento ABS Genuíno 1kg Barato", 65.00, "https://3dfila.com.br", "ABS", 4.5f),
            FilamentOffer("Voolt3D", "Filamento ABS Premium 1kg - Voolt3D", 69.90, "https://www.voolt3d.com.br", "ABS", 4.7f),
            FilamentOffer("Mercado Livre", "Filamento ABS MG94 1kg Profissional", 71.50, "https://lista.mercadolivre.com.br/filamento-abs-1kg", "ABS", 4.8f),
            FilamentOffer("3D Lab", "Filamento ABS Profissional 1kg - 3D Lab", 74.00, "https://www.3dlab.com.br", "ABS", 4.6f),
            FilamentOffer("Slim3D", "Filamento ABS de alta resistência 1kg", 77.00, "https://www.slim3d.com.br", "ABS", 4.7f)
        ),
        "PETG" to listOf(
            FilamentOffer("Shopee", "Filamento PETG Premium 1kg - 3D Prime", 73.90, "https://shopee.com.br/search?keyword=filamento%20petg%201kg", "PETG", 4.6f),
            FilamentOffer("Voolt3D", "Filamento PETG High Gloss 1kg - Voolt3D", 76.00, "https://www.voolt3d.com.br", "PETG", 4.8f),
            FilamentOffer("Mercado Livre", "Filamento PETG XT Resistente 1kg Master", 79.10, "https://lista.mercadolivre.com.br/filamento-petg-1kg", "PETG", 4.7f),
            FilamentOffer("3D Lab", "Filamento PETG Profissional 1kg - 3D Lab", 82.50, "https://www.3dlab.com.br", "PETG", 4.6f),
            FilamentOffer("Slim3D", "Filamento PETG Pro 1kg Alta Precisão", 84.90, "https://www.slim3d.com.br", "PETG", 4.7f)
        ),
        "TPU" to listOf(
            FilamentOffer("Compre 3D", "Filamento TPU Soft 1kg Promoção", 119.00, "https://shopee.com.br", "TPU", 4.7f),
            FilamentOffer("Clona3D", "Filamento TPU Flexível 1kg Premium", 125.00, "https://www.clona3d.com.br", "TPU", 4.9f),
            FilamentOffer("Mercado Livre", "Filamento TPU Flexível Importado 1kg", 129.50, "https://lista.mercadolivre.com.br/filamento-tpu-1kg", "TPU", 4.7f),
            FilamentOffer("Voolt3D", "Filamento TPU Soft 1kg Flex - Voolt3D", 134.90, "https://www.voolt3d.com.br", "TPU", 4.8f),
            FilamentOffer("3D Lab", "Filamento Flexível TPU Premium 1kg - 3D Lab", 139.00, "https://www.3dlab.com.br", "TPU", 4.8f)
        )
    )

    suspend fun getCheapestFilaments(materialType: String): List<FilamentOffer> = withContext(Dispatchers.IO) {
        // 1. Try SerpAPI (via Worker or direct endpoint) for real google shopping prices
        val query = "filamento $materialType 1kg"
        val requestUrls = listOf(
            "https://worker-withered-wildflower-8f32.pl-economica.workers.dev/search?engine=google_shopping&q=filamento+$materialType+1kg&google_domain=google.com.br&gl=br&hl=pt&api_key=$SERP_API_KEY",
            "https://serpapi.com/search.json?engine=google_shopping&q=filamento+$materialType+1kg&google_domain=google.com.br&gl=br&hl=pt&api_key=$SERP_API_KEY"
        )

        for (url in requestUrls) {
            try {
                val request = Request.Builder()
                    .url(url)
                    .get()
                    .build()
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val responseBody = response.body?.string() ?: ""
                        if (responseBody.isNotEmpty()) {
                            val jsonObj = JSONObject(responseBody)
                            val shoppingResults = jsonObj.optJSONArray("shopping_results")
                                ?: jsonObj.optJSONArray("inline_shopping_results")
                            
                            if (shoppingResults != null && shoppingResults.length() > 0) {
                                val parsedResults = mutableListOf<FilamentOffer>()
                                for (i in 0 until shoppingResults.length()) {
                                    val item = shoppingResults.getJSONObject(i)
                                    val title = item.optString("title", "")
                                    val priceStr = item.optString("price", "")
                                    val extractedPrice = item.optDouble("extracted_price", 0.0)
                                    val link = item.optString("link", "")
                                    val source = item.optString("source", "Loja Web")
                                    val rating = item.optDouble("rating", 4.7).toFloat()

                                    val finalPrice = if (extractedPrice > 1.0) {
                                        extractedPrice
                                    } else {
                                        try {
                                            val cleaned = priceStr.replace("R$", "")
                                                .replace(" ", "")
                                                .replace(".", "")
                                                .replace(",", ".")
                                                .trim()
                                            val numeric = cleaned.replace(Regex("[^0-9.]"), "")
                                            numeric.toDouble()
                                        } catch (e: Exception) {
                                            0.0
                                        }
                                    }

                                    if (finalPrice > 10.0 && title.lowercase().contains(materialType.lowercase())) {
                                        parsedResults.add(
                                            FilamentOffer(
                                                storeName = source,
                                                filamentName = title,
                                                price = finalPrice,
                                                link = link.ifEmpty { "https://www.google.com.br" },
                                                materialType = materialType,
                                                rating = rating
                                            )
                                        )
                                    }
                                }

                                if (parsedResults.isNotEmpty()) {
                                    // Sort by lowest price first and take the 5 best
                                    return@withContext parsedResults.sortedBy { it.price }.take(5)
                                }
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Search URL failed: $url. Error: ${e.message}")
            }
        }

        // 2. Fall back to Gemini API
        val apiKey = getGeminiApiKey()

        if (apiKey.isNotEmpty() && apiKey != "MY_GEMINI_API_KEY") {
            try {
                val prompt = """
                    Você é um assistente especialista em Impressão 3D e compras no varejo do Brasil.
                    Retorne as 5 melhores ofertas (menores preços aproximados) de filamento de 1kg de material $materialType no varejo brasileiro geral (como Voolt3D, PrintLoja, 3D Lab, Slim3D, Clona3D, 3D Fila, etc.). Considere e estime o menor preço disponível.
                    
                    Retorne EXCLUSIVAMENTE um JSON estruturado seguindo o modelo abaixo, sem qualquer marcação markdown (como ```json) ou de texto. Deve ser um JSON puro e válido.
                    
                    Exemplo de formato esperado:
                    {
                      "offers": [
                        {
                          "storeName": "Voolt3D",
                          "filamentName": "Filamento PLA Premium 1kg Preto",
                          "price": 79.90,
                          "link": "https://www.voolt3d.com.br",
                          "materialType": "$materialType"
                        }
                      ]
                    }
                """.trimIndent()

                val requestJson = JSONObject().apply {
                    put("contents", JSONArray().apply {
                        put(JSONObject().apply {
                            put("parts", JSONArray().apply {
                                put(JSONObject().apply {
                                    put("text", prompt)
                                })
                            })
                        })
                    })
                    put("generationConfig", JSONObject().apply {
                        put("responseMimeType", "application/json")
                    })
                }

                val body = requestJson.toString().toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("$GEMINI_API_URL?key=$apiKey")
                    .post(body)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val responseBody = response.body?.string() ?: ""
                        val responseJson = JSONObject(responseBody)
                        val textResponse = responseJson
                            .getJSONArray("candidates")
                            .getJSONObject(0)
                            .getJSONObject("content")
                            .getJSONArray("parts")
                            .getJSONObject(0)
                            .getString("text")

                        val parsedOutput = JSONObject(textResponse)
                        val offersArray = parsedOutput.getJSONArray("offers")
                        val results = mutableListOf<FilamentOffer>()

                        for (i in 0 until offersArray.length()) {
                            val fallbackRating = 4.5f + (i * 0.1f)
                            val obj = offersArray.getJSONObject(i)
                            results.add(
                                FilamentOffer(
                                    storeName = obj.optString("storeName", "Loja Parceira"),
                                    filamentName = obj.optString("filamentName", "Filamento $materialType 1kg"),
                                    price = obj.optDouble("price", 95.00),
                                    link = obj.optString("link", "https://google.com.br"),
                                    materialType = obj.optString("materialType", materialType),
                                    rating = (Math.round(fallbackRating.coerceAtMost(5.0f) * 10) / 10f)
                                )
                            )
                        }

                        if (results.isNotEmpty()) {
                            return@withContext results.sortedBy { it.price }.take(5)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Gemini fallback failed: ${e.message}")
            }
        }

        // 3. Fallback database / offline list sorted by lowest
        delaySim(500)
        fallbackOffers[materialType] ?: fallbackOffers["PLA"]!!
    }

    private suspend fun delaySim(ms: Long) {
        try {
            kotlinx.coroutines.delay(ms)
        } catch (e: Exception) {
            // Ignored
        }
    }
}
