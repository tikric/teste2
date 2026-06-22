package com.bambuzau3d.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.squareup.moshi.JsonClass

@Entity(tableName = "clients")
@JsonClass(generateAdapter = true)
data class Client(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val phone: String,
    val email: String,
    val address: String,
    val note: String = ""
)

@Entity(tableName = "printers")
@JsonClass(generateAdapter = true)
data class Printer(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val model: String,
    val status: String = "IDLE", // "IDLE", "PRINTING", "MAINTENANCE"
    val ipAddress: String = "",
    val lastWeeklyMaintenance: Long = System.currentTimeMillis() - (8 * 24 * 60 * 60 * 1000L),
    val lastMonthlyMaintenance: Long = System.currentTimeMillis() - (32 * 24 * 60 * 60 * 1000L)
)

@Entity(tableName = "print_orders")
@JsonClass(generateAdapter = true)
data class PrintOrder(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val clientId: Long?,
    val clientName: String, // Kept redundant for fast displaying/external sync orders
    val itemName: String,
    val quantity: Int = 1,
    val filamentType: String, // PLA, ABS, PETG, TPU, etc.
    val filamentColor: String,
    val weightGrams: Float,
    val printTimeHours: Float,
    val priceCharged: Double,
    val platformSource: String = "MANUAL", // "MANUAL", "SHOPEE", "MERCADO_LIVRE", "NUVEMSHOP"
    val platformOrderId: String = "",
    val status: String = "WAITING", // "WAITING", "QUEUE", "PRINTING", "POST_PROCESS", "READY", "DELIVERED"
    val printingProgress: Float = 0.0f, // 0.0 to 1.0
    val assignedPrinterId: Long? = null,
    val printerName: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val deadline: Long = System.currentTimeMillis() + (3 * 24 * 60 * 60 * 1000) // Default 3 days deadline
)

@Entity(tableName = "catalog_items")
@JsonClass(generateAdapter = true)
data class CatalogItem(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val description: String,
    val weightGrams: Float,
    val printTimeHours: Float,
    val filamentType: String,
    val defaultPrice: Double,
    val stockCount: Int = 0,
    val minStockCount: Int = 2,
    val productCode: String = "",
    val filamentColorsUsed: String = "",
    val spentPartId: Long? = null,
    val spentPartQty: Int = 0,
    val hasSecondaryMaterial: Boolean = false,
    val secondaryWeightGrams: Float = 0f,
    val secondaryFilamentType: String = "",
    val secondaryFilamentColorsUsed: String = ""
)

@Entity(tableName = "filament_stocks")
@JsonClass(generateAdapter = true)
data class FilamentStock(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: String, // PLA, ABS, PETG, TPU
    val color: String, // Ouro, Preto, Branco, etc.
    val stockGrams: Float,
    val minStockGrams: Float = 1000f, // Limit below which to recommend buying
    val priceRoll: Double = 120.0
)

@Entity(tableName = "expenses")
@JsonClass(generateAdapter = true)
data class Expense(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val description: String,
    val category: String, // "FILAMENTO", "EQUIPAMENTO", "ENERGIA", "OUTROS"
    val amount: Double,
    val qty: Int = 1,
    val date: Long = System.currentTimeMillis()
)

@Entity(tableName = "shopping_items")
@JsonClass(generateAdapter = true)
data class ShoppingItem(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val price: Double,
    val isChecked: Boolean = false
)
