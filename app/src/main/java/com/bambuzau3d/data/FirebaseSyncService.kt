package com.bambuzau3d.data

import android.content.Context
import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.flow.first

object FirebaseSyncService {
    private const val TAG = "FirebaseSyncService"
    private const val PREFS_NAME = "print_flow_firebase_prefs"
    private const val KEY_FIREBASE_URL = "firebase_url"
    private const val KEY_WORKSPACE_CODE = "firebase_workspace_code"
    
    // Public backup database URL for demo/out-of-the-box experience
    private const val DEFAULT_FIREBASE_URL = "https://bambuzau1-60868-default-rtdb.firebaseio.com/"

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    // Retrieve settings
    fun getFirebaseUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val current = prefs.getString(KEY_FIREBASE_URL, null)
        if (current == null || current.contains("printflow-3d-b4b11") || current.contains("inova-49b60-default-rtdb")) {
            prefs.edit().putString(KEY_FIREBASE_URL, DEFAULT_FIREBASE_URL).apply()
            return DEFAULT_FIREBASE_URL
        }
        return current
    }

    fun getWorkspaceCode(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        var code = prefs.getString(KEY_WORKSPACE_CODE, "")
        if (code.isNullOrEmpty()) {
            code = generateRandomWorkspaceCode()
            prefs.edit().putString(KEY_WORKSPACE_CODE, code).apply()
        }
        return code
    }

    fun saveSettings(context: Context, url: String, code: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val formattedUrl = if (url.endsWith("/")) url else "$url/"
        prefs.edit()
            .putString(KEY_FIREBASE_URL, formattedUrl)
            .putString(KEY_WORKSPACE_CODE, code.trim())
            .apply()
    }

    private fun generateRandomWorkspaceCode(): String {
        val chars = "abcdefghijklmnopqrstuvwxyz0123456789"
        val code = (1..6).map { chars.random() }.joinToString("")
        return "wp_$code"
    }

    // Backup current data to Firebase
    suspend fun backupToCloud(context: Context, db: AppDatabase): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val url = getFirebaseUrl(context)
            val code = getWorkspaceCode(context)
            
            val clients = db.clientDao().getAllClients().first()
            val printers = db.printerDao().getAllPrinters().first()
            val orders = db.printOrderDao().getAllOrders().first()
            val catalogItems = db.catalogItemDao().getAllCatalogItems().first()
            val expenses = db.expenseDao().getAllExpenses().first()

            val jsonRoot = JSONObject().apply {
                put("updatedAt", System.currentTimeMillis())
                
                // Clients Array
                val jClients = JSONArray()
                clients.forEach { c ->
                    jClients.put(JSONObject().apply {
                        put("id", c.id)
                        put("name", c.name)
                        put("phone", c.phone)
                        put("email", c.email)
                        put("address", c.address)
                        put("note", c.note)
                    })
                }
                put("clients", jClients)

                // Printers Array
                val jPrinters = JSONArray()
                printers.forEach { p ->
                    jPrinters.put(JSONObject().apply {
                        put("id", p.id)
                        put("name", p.name)
                        put("model", p.model)
                        put("status", p.status)
                        put("ipAddress", p.ipAddress)
                    })
                }
                put("printers", jPrinters)

                // Orders Array
                val jOrders = JSONArray()
                orders.forEach { o ->
                    jOrders.put(JSONObject().apply {
                        put("id", o.id)
                        put("clientId", o.clientId ?: JSONObject.NULL)
                        put("clientName", o.clientName)
                        put("itemName", o.itemName)
                        put("quantity", o.quantity)
                        put("filamentType", o.filamentType)
                        put("filamentColor", o.filamentColor)
                        put("weightGrams", o.weightGrams.toDouble())
                        put("printTimeHours", o.printTimeHours.toDouble())
                        put("priceCharged", o.priceCharged)
                        put("platformSource", o.platformSource)
                        put("platformOrderId", o.platformOrderId)
                        put("status", o.status)
                        put("printingProgress", o.printingProgress.toDouble())
                        put("assignedPrinterId", o.assignedPrinterId ?: JSONObject.NULL)
                        put("printerName", o.printerName)
                        put("createdAt", o.createdAt)
                        put("deadline", o.deadline)
                    })
                }
                put("orders", jOrders)

                // Catalog Items Array
                val jCatalog = JSONArray()
                catalogItems.forEach { c ->
                    jCatalog.put(JSONObject().apply {
                        put("id", c.id)
                        put("name", c.name)
                        put("description", c.description)
                        put("weightGrams", c.weightGrams.toDouble())
                        put("printTimeHours", c.printTimeHours.toDouble())
                        put("filamentType", c.filamentType)
                        put("defaultPrice", c.defaultPrice)
                        put("productCode", c.productCode)
                    })
                }
                put("catalogItems", jCatalog)

                // Expenses Array
                val jExpenses = JSONArray()
                expenses.forEach { e ->
                    jExpenses.put(JSONObject().apply {
                        put("id", e.id)
                        put("description", e.description)
                        put("category", e.category)
                        put("amount", e.amount)
                        put("qty", e.qty)
                        put("date", e.date)
                    })
                }
                put("expenses", jExpenses)
            }

            val requestBody = jsonRoot.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            val targetUrl = "${url}workspaces/$code.json"
            
            val request = Request.Builder()
                .url(targetUrl)
                .put(requestBody)
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Result.success(Unit)
                } else {
                    Result.failure(Exception("Erro no Firebase (HTTP ${response.code}): ${response.message}"))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in backupToCloud", e)
            Result.failure(e)
        }
    }

    // Restore and replace database data from Firebase
    suspend fun restoreFromCloud(context: Context, db: AppDatabase): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val url = getFirebaseUrl(context)
            val code = getWorkspaceCode(context)
            val targetUrl = "${url}workspaces/$code.json"

            val request = Request.Builder()
                .url(targetUrl)
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("Erro ao ler Firebase: HTTP ${response.code}"))
                }

                val bodyStr = response.body?.string() ?: ""
                if (bodyStr.isEmpty() || bodyStr == "null") {
                    return@withContext Result.failure(Exception("Nenhum dado encontrado no workspace '$code'."))
                }

                val jsonRoot = JSONObject(bodyStr)
                
                // Truncate SQLite Database locally
                db.clearAllTables()

                // Insert Clients
                if (jsonRoot.has("clients")) {
                    val clientsArr = jsonRoot.optJSONArray("clients") ?: JSONArray()
                    for (i in 0 until clientsArr.length()) {
                        val o = clientsArr.getJSONObject(i)
                        db.clientDao().insertClient(Client(
                            id = o.optLong("id", 0),
                            name = o.optString("name", ""),
                            phone = o.optString("phone", ""),
                            email = o.optString("email", ""),
                            address = o.optString("address", ""),
                            note = o.optString("note", "")
                        ))
                    }
                }

                // Insert Printers
                if (jsonRoot.has("printers")) {
                    val printersArr = jsonRoot.optJSONArray("printers") ?: JSONArray()
                    for (i in 0 until printersArr.length()) {
                        val o = printersArr.getJSONObject(i)
                        db.printerDao().insertPrinter(Printer(
                            id = o.optLong("id", 0),
                            name = o.optString("name", ""),
                            model = o.optString("model", ""),
                            status = o.optString("status", "IDLE"),
                            ipAddress = o.optString("ipAddress", "")
                        ))
                    }
                }

                // Insert Orders
                if (jsonRoot.has("orders")) {
                    val ordersArr = jsonRoot.optJSONArray("orders") ?: JSONArray()
                    for (i in 0 until ordersArr.length()) {
                        val o = ordersArr.getJSONObject(i)
                        
                        val cId = if (o.isNull("clientId")) null else o.optLong("clientId")
                        val pId = if (o.isNull("assignedPrinterId")) null else o.optLong("assignedPrinterId")

                        db.printOrderDao().insertOrder(PrintOrder(
                            id = o.optLong("id", 0),
                            clientId = cId,
                            clientName = o.optString("clientName", ""),
                            itemName = o.optString("itemName", ""),
                            quantity = o.optInt("quantity", 1),
                            filamentType = o.optString("filamentType", "PLA"),
                            filamentColor = o.optString("filamentColor", ""),
                            weightGrams = o.optDouble("weightGrams", 0.0).toFloat(),
                            printTimeHours = o.optDouble("printTimeHours", 0.0).toFloat(),
                            priceCharged = o.optDouble("priceCharged", 0.0),
                            platformSource = o.optString("platformSource", "MANUAL"),
                            platformOrderId = o.optString("platformOrderId", ""),
                            status = o.optString("status", "WAITING"),
                            printingProgress = o.optDouble("printingProgress", 0.0).toFloat(),
                            assignedPrinterId = pId,
                            printerName = o.optString("printerName", ""),
                            createdAt = o.optLong("createdAt", System.currentTimeMillis()),
                            deadline = o.optLong("deadline", System.currentTimeMillis())
                        ))
                    }
                }

                // Insert Catalog Items
                if (jsonRoot.has("catalogItems")) {
                    val catalogArr = jsonRoot.optJSONArray("catalogItems") ?: JSONArray()
                    for (i in 0 until catalogArr.length()) {
                        val o = catalogArr.getJSONObject(i)
                        db.catalogItemDao().insertCatalogItem(CatalogItem(
                            id = o.optLong("id", 0),
                            name = o.optString("name", ""),
                            description = o.optString("description", ""),
                            weightGrams = o.optDouble("weightGrams", 0.0).toFloat(),
                            printTimeHours = o.optDouble("printTimeHours", 0.0).toFloat(),
                            filamentType = o.optString("filamentType", "PLA"),
                            defaultPrice = o.optDouble("defaultPrice", 0.0),
                            productCode = o.optString("productCode", "")
                        ))
                    }
                }

                // Insert Expenses
                if (jsonRoot.has("expenses")) {
                    val expensesArr = jsonRoot.optJSONArray("expenses") ?: JSONArray()
                    for (i in 0 until expensesArr.length()) {
                        val o = expensesArr.getJSONObject(i)
                        db.expenseDao().insertExpense(Expense(
                            id = o.optLong("id", 0),
                            description = o.optString("description", ""),
                            category = o.optString("category", "OUTROS"),
                            amount = o.optDouble("amount", 0.0),
                            qty = o.optInt("qty", 1),
                            date = o.optLong("date", System.currentTimeMillis())
                        ))
                    }
                }

                Result.success(Unit)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in restoreFromCloud", e)
            Result.failure(e)
        }
    }
}
