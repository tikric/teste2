package com.bambuzau3d.data

import kotlinx.coroutines.flow.Flow

class PrintRepository(private val db: AppDatabase) {
    private val clientDao = db.clientDao()
    private val printerDao = db.printerDao()
    private val printOrderDao = db.printOrderDao()

    val allClients: Flow<List<Client>> = clientDao.getAllClients()
    val allPrinters: Flow<List<Printer>> = printerDao.getAllPrinters()
    val allOrders: Flow<List<PrintOrder>> = printOrderDao.getAllOrders()

    suspend fun getClientById(id: Long): Client? = clientDao.getClientById(id)
    suspend fun getPrinterById(id: Long): Printer? = printerDao.getPrinterById(id)
    suspend fun getOrderById(id: Long): PrintOrder? = printOrderDao.getOrderById(id)

    // Client operations
    suspend fun insertClient(client: Client): Long = clientDao.insertClient(client)
    suspend fun updateClient(client: Client) = clientDao.updateClient(client)
    suspend fun deleteClient(client: Client) = clientDao.deleteClient(client)

    // Printer operations
    suspend fun insertPrinter(printer: Printer): Long = printerDao.insertPrinter(printer)
    suspend fun updatePrinter(printer: Printer) = printerDao.updatePrinter(printer)
    suspend fun deletePrinter(printer: Printer) = printerDao.deletePrinter(printer)

    // Order operations
    suspend fun insertOrder(order: PrintOrder): Long = printOrderDao.insertOrder(order)
    suspend fun updateOrder(order: PrintOrder) = printOrderDao.updateOrder(order)
    suspend fun deleteOrder(order: PrintOrder) = printOrderDao.deleteOrder(order)

    // Catalog operations
    val allCatalogItems: Flow<List<CatalogItem>> = db.catalogItemDao().getAllCatalogItems()
    suspend fun insertCatalogItem(item: CatalogItem): Long = db.catalogItemDao().insertCatalogItem(item)
    suspend fun updateCatalogItem(item: CatalogItem) = db.catalogItemDao().updateCatalogItem(item)
    suspend fun deleteCatalogItem(item: CatalogItem) = db.catalogItemDao().deleteCatalogItem(item)

    // Filament Stock operations
    val allFilamentStocks: Flow<List<FilamentStock>> = db.filamentStockDao().getAllFilamentStocks()
    suspend fun insertFilamentStock(stock: FilamentStock): Long = db.filamentStockDao().insertStock(stock)
    suspend fun updateFilamentStock(stock: FilamentStock) = db.filamentStockDao().updateStock(stock)
    suspend fun deleteFilamentStock(stock: FilamentStock) = db.filamentStockDao().deleteStock(stock)

    // Expense operations
    val allExpenses: Flow<List<Expense>> = db.expenseDao().getAllExpenses()
    suspend fun insertExpense(expense: Expense): Long = db.expenseDao().insertExpense(expense)
    suspend fun updateExpense(expense: Expense) = db.expenseDao().updateExpense(expense)
    suspend fun deleteExpense(expense: Expense) = db.expenseDao().deleteExpense(expense)

    // Shopping List operations
    val allShoppingItems: Flow<List<ShoppingItem>> = db.shoppingItemDao().getAllShoppingItems()
    suspend fun insertShoppingItem(item: ShoppingItem): Long = db.shoppingItemDao().insertShoppingItem(item)
    suspend fun updateShoppingItem(item: ShoppingItem) = db.shoppingItemDao().updateShoppingItem(item)
    suspend fun deleteShoppingItem(item: ShoppingItem) = db.shoppingItemDao().deleteShoppingItem(item)

    // Simulate printing progression for active printers/orders
    suspend fun tickPrintingProgress() {
        // Collect current orders to look for those in PRINTING status
        // and update progress
    }
}
