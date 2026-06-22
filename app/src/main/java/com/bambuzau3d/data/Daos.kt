package com.bambuzau3d.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ClientDao {
    @Query("SELECT * FROM clients ORDER BY name ASC")
    fun getAllClients(): Flow<List<Client>>

    @Query("SELECT * FROM clients WHERE id = :id LIMIT 1")
    suspend fun getClientById(id: Long): Client?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClient(client: Client): Long

    @Update
    suspend fun updateClient(client: Client)

    @Delete
    suspend fun deleteClient(client: Client)
}

@Dao
interface PrinterDao {
    @Query("SELECT * FROM printers ORDER BY name ASC")
    fun getAllPrinters(): Flow<List<Printer>>

    @Query("SELECT * FROM printers WHERE id = :id LIMIT 1")
    suspend fun getPrinterById(id: Long): Printer?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPrinter(printer: Printer): Long

    @Update
    suspend fun updatePrinter(printer: Printer)

    @Delete
    suspend fun deletePrinter(printer: Printer)
}

@Dao
interface PrintOrderDao {
    @Query("SELECT * FROM print_orders ORDER BY deadline ASC")
    fun getAllOrders(): Flow<List<PrintOrder>>

    @Query("SELECT * FROM print_orders WHERE status = :status ORDER BY deadline ASC")
    fun getOrdersByStatus(status: String): Flow<List<PrintOrder>>

    @Query("SELECT * FROM print_orders WHERE id = :id LIMIT 1")
    suspend fun getOrderById(id: Long): PrintOrder?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: PrintOrder): Long

    @Update
    suspend fun updateOrder(order: PrintOrder)

    @Delete
    suspend fun deleteOrder(order: PrintOrder)
}

@Dao
interface CatalogItemDao {
    @Query("SELECT * FROM catalog_items ORDER BY name ASC")
    fun getAllCatalogItems(): Flow<List<CatalogItem>>

    @Query("SELECT * FROM catalog_items WHERE id = :id LIMIT 1")
    suspend fun getCatalogItemById(id: Long): CatalogItem?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCatalogItem(item: CatalogItem): Long

    @Update
    suspend fun updateCatalogItem(item: CatalogItem)

    @Delete
    suspend fun deleteCatalogItem(item: CatalogItem)
}

@Dao
interface ExpenseDao {
    @Query("SELECT * FROM expenses ORDER BY date DESC")
    fun getAllExpenses(): Flow<List<Expense>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: Expense): Long

    @Update
    suspend fun updateExpense(expense: Expense)

    @Delete
    suspend fun deleteExpense(expense: Expense)
}

@Dao
interface FilamentStockDao {
    @Query("SELECT * FROM filament_stocks ORDER BY type ASC, color ASC")
    fun getAllFilamentStocks(): Flow<List<FilamentStock>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStock(stock: FilamentStock): Long

    @Update
    suspend fun updateStock(stock: FilamentStock)

    @Delete
    suspend fun deleteStock(stock: FilamentStock)
}

@Dao
interface ShoppingItemDao {
    @Query("SELECT * FROM shopping_items ORDER BY id DESC")
    fun getAllShoppingItems(): Flow<List<ShoppingItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShoppingItem(item: ShoppingItem): Long

    @Update
    suspend fun updateShoppingItem(item: ShoppingItem)

    @Delete
    suspend fun deleteShoppingItem(item: ShoppingItem)
}
