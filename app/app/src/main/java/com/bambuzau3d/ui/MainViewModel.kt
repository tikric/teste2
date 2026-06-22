package com.bambuzau3d.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.bambuzau3d.data.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlin.random.Random

data class AppAlert(
    val id: String = java.util.UUID.randomUUID().toString(),
    val title: String,
    val message: String,
    val type: AlertType = AlertType.INFO,
    val timestamp: Long = System.currentTimeMillis()
)

enum class AlertType {
    INFO, WARNING, OPPORTUNITY, SHORTAGE
}

data class MaterialProfile(
    val type: String, // PLA, PETG, ABS, TPU
    val filamentPriceRoll: Double,
    val printerPowerW: Float,
    val electricityCostKwh: Double,
    val laborCostHour: Double,
    val miscCostPercent: Double,
    val defaultProfitMarginPercent: Double
)

data class CalcFilamentSegment(
    val id: String = java.util.UUID.randomUUID().toString(),
    val filamentStockId: Long,
    val weightGrams: Float
)

data class CalcExtraPart(
    val id: String = java.util.UUID.randomUUID().toString(),
    val catalogItemId: Long, // HARDWARE type
    val quantity: Int
)

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getDatabase(application)
    private val repository = PrintRepository(db)

    // Room reactive flows
    val clients: StateFlow<List<Client>> = repository.allClients
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val printers: StateFlow<List<Printer>> = repository.allPrinters
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val orders: StateFlow<List<PrintOrder>> = repository.allOrders
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val catalogItems: StateFlow<List<CatalogItem>> = repository.allCatalogItems
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val filamentStocks: StateFlow<List<FilamentStock>> = repository.allFilamentStocks
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val expenses: StateFlow<List<Expense>> = repository.allExpenses
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val shoppingItems: StateFlow<List<ShoppingItem>> = repository.allShoppingItems
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // UI Tab state
    private val _currentTab = MutableStateFlow(0) // 0: Dashboard, 1: Clientes/Imp, 2: Plataformas, 3: Preços/Custos
    val currentTab = _currentTab.asStateFlow()

    // Dialog & Form states
    private val _isClientDialogVisible = MutableStateFlow(false)
    val isClientDialogVisible = _isClientDialogVisible.asStateFlow()
    private val _editingClient = MutableStateFlow<Client?>(null)
    val editingClient = _editingClient.asStateFlow()

    private val _isPrinterDialogVisible = MutableStateFlow(false)
    val isPrinterDialogVisible = _isPrinterDialogVisible.asStateFlow()
    private val _editingPrinter = MutableStateFlow<Printer?>(null)
    val editingPrinter = _editingPrinter.asStateFlow()

    private val _isOrderDialogVisible = MutableStateFlow(false)
    val isOrderDialogVisible = _isOrderDialogVisible.asStateFlow()
    private val _editingOrder = MutableStateFlow<PrintOrder?>(null)
    val editingOrder = _editingOrder.asStateFlow()

    // Platform syncing states
    private val _platformConnections = MutableStateFlow<List<PlatformConnection>>(emptyList())
    val platformConnections = _platformConnections.asStateFlow()

    private val _selectedSyncPlatform = MutableStateFlow("Mercado Livre")
    val selectedSyncPlatform = _selectedSyncPlatform.asStateFlow()

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing = _isSyncing.asStateFlow()

    private val _syncedExternalOrders = MutableStateFlow<List<ExternalPlatformOrder>>(emptyList())
    val syncedExternalOrders = _syncedExternalOrders.asStateFlow()

    // Filament search states
    private val _searchMaterial = MutableStateFlow("PETG")
    val searchMaterial = _searchMaterial.asStateFlow()

    private val _isSearchingPrices = MutableStateFlow(false)
    val isSearchingPrices = _isSearchingPrices.asStateFlow()

    private val _filamentOffers = MutableStateFlow<List<FilamentOffer>>(emptyList())
    val filamentOffers = _filamentOffers.asStateFlow()

    // Separate filament searches for PETG, PLA and TPU to put them all in a single tab
    private val _petgOffers = MutableStateFlow<List<FilamentOffer>>(emptyList())
    val petgOffers = _petgOffers.asStateFlow()

    private val _plaOffers = MutableStateFlow<List<FilamentOffer>>(emptyList())
    val plaOffers = _plaOffers.asStateFlow()

    private val _tpuOffers = MutableStateFlow<List<FilamentOffer>>(emptyList())
    val tpuOffers = _tpuOffers.asStateFlow()

    // Opportunity alerts configuration threshold
    private val _opportunityThreshold = MutableStateFlow(80.0)
    val opportunityThreshold = _opportunityThreshold.asStateFlow()

    // Global Alarm / Notification state center
    private val _activeAlerts = MutableStateFlow<List<AppAlert>>(emptyList())
    val activeAlerts = _activeAlerts.asStateFlow()

    init {
        // Load configurations
        loadPlatformConnections()

        // Populate initial offers instantly with offline fallbacks to avoid delayed search perception
        _petgOffers.value = FilamentPriceService.fallbackOffers["PETG"] ?: emptyList()
        _plaOffers.value = FilamentPriceService.fallbackOffers["PLA"] ?: emptyList()
        _tpuOffers.value = FilamentPriceService.fallbackOffers["TPU"] ?: emptyList()

        // Check for instant opportunities in the seeded system
        checkOpportunities(_petgOffers.value)
        checkOpportunities(_plaOffers.value)

        // Monitor filament stock updates reactively for automatic low stock alerts
        viewModelScope.launch {
            filamentStocks.collect { stocks ->
                stocks.forEach { stock ->
                    if (stock.stockGrams < stock.minStockGrams) {
                        val alertTitle = "🚨 Estoque Baixo: ${stock.type} (${stock.color})"
                        val alertMsg = "Seu estoque de ${stock.type} ${stock.color} está em apenas ${stock.stockGrams.toInt()}g! O limite mínimo de alerta é de ${stock.minStockGrams.toInt()}g. Economize ou compre mais."
                        addAlert(AppAlert(
                            title = alertTitle,
                            message = alertMsg,
                            type = AlertType.SHORTAGE
                        ))
                    }
                }
            }
        }

        // Start live printing simulation progression
        startPrintingSimulation()
    }

    private fun loadPlatformConnections() {
        val prefs = getApplication<Application>().getSharedPreferences("platform_sync_prefs", android.content.Context.MODE_PRIVATE)
        val list = mutableListOf<PlatformConnection>()
        
        val platforms = listOf("Mercado Livre", "Shopee", "Amazon", "Nuvemshop")
        val defaultStores = mapOf(
            "Mercado Livre" to "Ateliê 3D Hub Store",
            "Shopee" to "Oficina3D Oficial",
            "Amazon" to "Astro3D Amazon Store",
            "Nuvemshop" to "Arte3D Prime"
        )
        val defaultTokens = mapOf(
            "Mercado Livre" to "ml_tok_928131...",
            "Shopee" to "shp_tok_089182...",
            "Amazon" to "amz_tok_471928...",
            "Nuvemshop" to "nv_tok_556112..."
        )
        val defaultConnected = mapOf(
            "Mercado Livre" to false,
            "Shopee" to false,
            "Amazon" to false,
            "Nuvemshop" to false
        )

        for (plat in platforms) {
            val store = prefs.getString("${plat}_store", defaultStores[plat] ?: "") ?: ""
            val token = prefs.getString("${plat}_token", defaultTokens[plat] ?: "") ?: ""
            val conn = prefs.getBoolean("${plat}_connected", defaultConnected[plat] ?: false)
            list.add(PlatformConnection(plat, store, token, conn))
        }
        _platformConnections.value = list
    }

    fun savePlatformConnection(platformName: String, storeName: String, token: String, isConnected: Boolean) {
        val prefs = getApplication<Application>().getSharedPreferences("platform_sync_prefs", android.content.Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString("${platformName}_store", storeName)
            putString("${platformName}_token", token)
            putBoolean("${platformName}_connected", isConnected)
            apply()
        }
        loadPlatformConnections()
    }

    fun selectTab(tabIndex: Int) {
        _currentTab.value = tabIndex
    }

    // --- Client Operations ---
    fun openAddClientDialog() {
        _editingClient.value = null
        _isClientDialogVisible.value = true
    }

    fun openEditClientDialog(client: Client) {
        _editingClient.value = client
        _isClientDialogVisible.value = true
    }

    fun dismissClientDialog() {
        _isClientDialogVisible.value = false
        _editingClient.value = null
    }

    fun saveClient(name: String, phone: String, email: String, address: String, note: String) {
        viewModelScope.launch {
            val client = _editingClient.value?.copy(
                name = name,
                phone = phone,
                email = email,
                address = address,
                note = note
            ) ?: Client(name = name, phone = phone, email = email, address = address, note = note)

            if (client.id == 0L) {
                repository.insertClient(client)
            } else {
                repository.updateClient(client)
            }
            dismissClientDialog()
        }
    }

    fun deleteClient(client: Client) {
        viewModelScope.launch {
            repository.deleteClient(client)
        }
    }

    // --- Printer Operations ---
    fun openAddPrinterDialog() {
        _editingPrinter.value = null
        _isPrinterDialogVisible.value = true
    }

    fun openEditPrinterDialog(printer: Printer) {
        _editingPrinter.value = printer
        _isPrinterDialogVisible.value = true
    }

    fun dismissPrinterDialog() {
        _isPrinterDialogVisible.value = false
        _editingPrinter.value = null
    }

    fun savePrinter(name: String, model: String, status: String, ipAddress: String) {
        viewModelScope.launch {
            val printer = _editingPrinter.value?.copy(
                name = name,
                model = model,
                status = status,
                ipAddress = ipAddress
            ) ?: Printer(name = name, model = model, status = status, ipAddress = ipAddress)

            if (printer.id == 0L) {
                repository.insertPrinter(printer)
            } else {
                repository.updatePrinter(printer)
            }
            dismissPrinterDialog()
        }
    }

    fun deletePrinter(printer: Printer) {
        viewModelScope.launch {
            repository.deletePrinter(printer)
        }
    }

    // --- Order Operations ---
    fun openAddOrderDialog() {
        _editingOrder.value = null
        _isOrderDialogVisible.value = true
    }

    fun openAddOrderDialogWithParams(
        itemName: String,
        weight: Float,
        time: Float,
        priceCharged: Double,
        filamentType: String,
        filamentColor: String
    ) {
        _editingOrder.value = PrintOrder(
            id = 0L,
            clientId = null,
            clientName = "",
            itemName = itemName,
            quantity = 1,
            filamentType = filamentType,
            filamentColor = filamentColor,
            weightGrams = weight,
            printTimeHours = time,
            priceCharged = priceCharged,
            status = "WAITING"
        )
        _isOrderDialogVisible.value = true
    }

    fun openEditOrderDialog(order: PrintOrder) {
        _editingOrder.value = order
        _isOrderDialogVisible.value = true
    }

    fun dismissOrderDialog() {
        _isOrderDialogVisible.value = false
        _editingOrder.value = null
    }

    fun saveOrder(
        clientName: String,
        itemName: String,
        quantity: Int,
        filamentType: String,
        filamentColor: String,
        weightGrams: Float,
        printTimeHours: Float,
        priceCharged: Double,
        status: String,
        assignedPrinterId: Long?,
        deadlineDays: Int
    ) {
        viewModelScope.launch {
            val printerObj = assignedPrinterId?.let { repository.getPrinterById(it) }
            val matchingClient = clients.value.firstOrNull { it.name.trim().lowercase() == clientName.trim().lowercase() }
            val clientId = matchingClient?.id

            val order = _editingOrder.value?.copy(
                clientId = clientId,
                clientName = clientName,
                itemName = itemName,
                quantity = quantity,
                filamentType = filamentType,
                filamentColor = filamentColor,
                weightGrams = weightGrams,
                printTimeHours = printTimeHours,
                priceCharged = priceCharged,
                status = status,
                assignedPrinterId = assignedPrinterId,
                printerName = printerObj?.name ?: "",
                deadline = System.currentTimeMillis() + (deadlineDays * 24L * 3600L * 1000L)
            ) ?: PrintOrder(
                clientId = clientId,
                clientName = clientName,
                itemName = itemName,
                quantity = quantity,
                filamentType = filamentType,
                filamentColor = filamentColor,
                weightGrams = weightGrams,
                printTimeHours = printTimeHours,
                priceCharged = priceCharged,
                status = status,
                assignedPrinterId = assignedPrinterId,
                printerName = printerObj?.name ?: "",
                deadline = System.currentTimeMillis() + (deadlineDays * 24L * 3600L * 1000L)
            )

            if (order.id == 0L) {
                repository.insertOrder(order)
                
                // Deduct matching FilamentStock automatically based on quantity, weight, and a 15% loss multiplier (waste)
                val matType = filamentType.trim()
                val matColor = filamentColor.trim()
                val totalWeightNeeded = weightGrams * quantity * 1.15f
                
                val currentStocks = filamentStocks.value
                val matchedStock = currentStocks.firstOrNull {
                    it.type.equals(matType, ignoreCase = true) && it.color.equals(matColor, ignoreCase = true)
                } ?: currentStocks.firstOrNull {
                    it.type.equals(matType, ignoreCase = true)
                }
                
                if (matchedStock != null) {
                    val updatedStock = matchedStock.copy(
                        stockGrams = (matchedStock.stockGrams - totalWeightNeeded).coerceAtLeast(0f)
                    )
                    viewModelScope.launch {
                        repository.updateFilamentStock(updatedStock)
                    }
                }
            } else {
                repository.updateOrder(order)
            }

            // Sync printer activity status based on assignment
            updateMachineStatuses()
            dismissOrderDialog()
        }
    }

    // Fast status update (Kanban slide action or single-tap progress edit)
    fun updateOrderStatus(order: PrintOrder, newStatus: String) {
        viewModelScope.launch {
            var updatedProg = order.printingProgress
            if (newStatus == "READY" || newStatus == "DELIVERED") {
                updatedProg = 1.0f
            } else if (newStatus == "WAITING" || newStatus == "QUEUE") {
                updatedProg = 0.0f
            }

            val updated = order.copy(
                status = newStatus,
                printingProgress = updatedProg
            )
            repository.updateOrder(updated)
            updateMachineStatuses()
        }
    }

    fun deleteOrder(order: PrintOrder) {
        viewModelScope.launch {
            repository.deleteOrder(order)
            updateMachineStatuses()
        }
    }

    // Helper to align printers with actual assignments in database
    private suspend fun updateMachineStatuses() {
        val currentOrders = db.printOrderDao().getAllOrders().first()
        val currentPrinters = db.printerDao().getAllPrinters().first()

        for (printer in currentPrinters) {
            val printingJobs = currentOrders.filter { it.assignedPrinterId == printer.id && it.status == "PRINTING" }
            val resolvedStatus = if (printingJobs.isNotEmpty()) "PRINTING" else "IDLE"
            if (printer.status != resolvedStatus) {
                repository.updatePrinter(printer.copy(status = resolvedStatus))
            }
        }
    }

    // --- Platforms Sync Operations ---
    fun selectSyncPlatform(platformName: String) {
        _selectedSyncPlatform.value = platformName
        _syncedExternalOrders.value = emptyList() // Clear old sync to prompt scanning
    }

    fun togglePlatformConnection(platformName: String) {
        val prefs = getApplication<Application>().getSharedPreferences("platform_sync_prefs", android.content.Context.MODE_PRIVATE)
        val current = _platformConnections.value.firstOrNull { it.platformName == platformName } ?: return
        prefs.edit().apply {
            putBoolean("${platformName}_connected", !current.isConnected)
            apply()
        }
        loadPlatformConnections()
    }

    fun applyFilamentPriceToCalculator(price: Double) {
        _calcFilamentPriceRoll.value = String.format(java.util.Locale.US, "%.2f", price)
        _pricingSubTab.value = 0 // Switch to Calculadora Sub-Tab
        _currentTab.value = 3    // Enforce Tab 3 (Preços/Custos)
    }

    fun syncPlatformOrders() {
        val platformName = _selectedSyncPlatform.value
        val conn = _platformConnections.value.firstOrNull { it.platformName == platformName }
        if (conn == null || !conn.isConnected) {
            // Can only sync if credential exists & connected
            return
        }

        viewModelScope.launch {
            _isSyncing.value = true
            try {
                val results = PlatformSyncSimulator.fetchOrdersFromApi(platformName)
                // Filter out those already imported (match by platformOrderId in current database)
                val currentOrders = orders.value
                val filtered = results.map { ext ->
                    val alreadyImported = currentOrders.any { o -> o.platformSource == ext.platform && o.platformOrderId == ext.id }
                    ext.copy(isImported = alreadyImported)
                }
                _syncedExternalOrders.value = filtered
            } catch (e: Exception) {
                // Recoverable gracefully
            } finally {
                _isSyncing.value = false
            }
        }
    }

    fun importExternalOrder(extOrder: ExternalPlatformOrder, targetPrinterId: Long?) {
        viewModelScope.launch {
            // First select or dynamically create a client based on the order info
            val clientPhone = extOrder.clientPhone
            var resolvedClientId: Long? = null

            val matchingClient = clients.value.firstOrNull { it.phone == clientPhone }
            if (matchingClient != null) {
                resolvedClientId = matchingClient.id
            } else {
                // Auto create client profile
                val newClient = Client(
                    name = extOrder.clientName,
                    phone = extOrder.clientPhone,
                    email = "${extOrder.clientName.lowercase().replace(" ", "")}@plataforma.com",
                    address = extOrder.clientAddress,
                    note = "Criado via importação de pedidos ${extOrder.platform}"
                )
                resolvedClientId = repository.insertClient(newClient)
            }

            val printerObj = targetPrinterId?.let { repository.getPrinterById(it) }

            // Extract template code from the end of description/title (e.g. "Some Title [VASO01]")
            val itemTitle = extOrder.itemName
            var resolvedItemName = extOrder.itemName
            var resolvedFilamentType = "PLA"
            var resolvedWeight = extOrder.weightGrams
            var resolvedPrintTime = extOrder.printTimeHours
            var resolvedPrice = extOrder.priceCharged

            val bracketRegex = Regex("\\[([^\\]]+)\\]")
            val matchResult = bracketRegex.find(itemTitle)
            val extractedCode = matchResult?.groupValues?.get(1)?.trim()

            val currentCatalog = catalogItems.value
            var matchedCatalogItem: CatalogItem? = null

            if (!extractedCode.isNullOrEmpty()) {
                matchedCatalogItem = currentCatalog.firstOrNull { it.productCode.equals(extractedCode, ignoreCase = true) }
            }
            if (matchedCatalogItem == null) {
                // Inline match fallback search
                matchedCatalogItem = currentCatalog.firstOrNull { 
                    it.productCode.isNotBlank() && itemTitle.contains(it.productCode, ignoreCase = true)
                }
            }

            // Overlay catalog template statistics if identified
            if (matchedCatalogItem != null) {
                resolvedItemName = matchedCatalogItem.name
                resolvedFilamentType = matchedCatalogItem.filamentType
                resolvedWeight = matchedCatalogItem.weightGrams
                resolvedPrintTime = matchedCatalogItem.printTimeHours
                resolvedPrice = matchedCatalogItem.defaultPrice
            }

            val importedOrder = PrintOrder(
                clientId = resolvedClientId,
                clientName = extOrder.clientName,
                itemName = resolvedItemName,
                quantity = 1,
                filamentType = resolvedFilamentType,
                filamentColor = "Preto", // Default starting
                weightGrams = resolvedWeight,
                printTimeHours = resolvedPrintTime,
                priceCharged = resolvedPrice,
                platformSource = extOrder.platform,
                platformOrderId = extOrder.id,
                status = if (targetPrinterId != null) "PRINTING" else "QUEUE",
                printingProgress = 0.0f,
                assignedPrinterId = targetPrinterId,
                printerName = printerObj?.name ?: "",
                createdAt = System.currentTimeMillis()
            )

            repository.insertOrder(importedOrder)
            updateMachineStatuses()

            // Update local synced check
            _syncedExternalOrders.value = _syncedExternalOrders.value.map {
                if (it.id == extOrder.id) it.copy(isImported = true) else it
            }
        }
    }

    // --- Filament Prices Search ---
    fun selectSearchMaterial(material: String) {
        _searchMaterial.value = material
        searchFilamentPrices(material)
    }

    fun searchFilamentPrices(material: String) {
        viewModelScope.launch {
            _isSearchingPrices.value = true
            try {
                val results = FilamentPriceService.getCheapestFilaments(material)
                _filamentOffers.value = results
                // Update specific material lists and check opportunities
                when (material) {
                    "PETG" -> {
                        _petgOffers.value = results
                        checkOpportunities(results)
                    }
                    "PLA" -> {
                        _plaOffers.value = results
                        checkOpportunities(results)
                    }
                    "TPU" -> {
                        _tpuOffers.value = results
                        checkOpportunities(results)
                    }
                }
            } catch (e: Exception) {
                // Recoverable gracefully
            } finally {
                _isSearchingPrices.value = false
            }
        }
    }

    fun searchAllFilamentPrices() {
        viewModelScope.launch {
            _isSearchingPrices.value = true
            try {
                val petg = FilamentPriceService.getCheapestFilaments("PETG")
                _petgOffers.value = petg
                checkOpportunities(petg)

                val pla = FilamentPriceService.getCheapestFilaments("PLA")
                _plaOffers.value = pla
                checkOpportunities(pla)

                val tpu = FilamentPriceService.getCheapestFilaments("TPU")
                _tpuOffers.value = tpu
                checkOpportunities(tpu)
            } catch (e: Exception) {
                // Recoverable gracefully
            } finally {
                _isSearchingPrices.value = false
            }
        }
    }

    // Alert controls
    fun addAlert(alert: AppAlert) {
        _activeAlerts.value = listOf(alert)
    }

    fun dismissAlert(id: String) {
        _activeAlerts.value = _activeAlerts.value.filter { it.id != id }
    }

    fun setOpportunityThreshold(value: Double) {
        _opportunityThreshold.value = value
        // Run reactive scans
        checkOpportunities(_petgOffers.value)
        checkOpportunities(_plaOffers.value)
    }

    fun checkOpportunities(offers: List<FilamentOffer>) {
        val thresh = _opportunityThreshold.value
        offers.forEach { offer ->
            val isShopee = offer.storeName.contains("Shopee", ignoreCase = true)
            val limit = if (isShopee) maxOf(thresh, 80.0) else thresh
            if ((offer.materialType.equals("PLA", ignoreCase = true) || offer.materialType.equals("PETG", ignoreCase = true)) && offer.price <= limit) {
                val alertId = "OPPORTUNITY_${offer.storeName}_${offer.price}"
                addAlert(AppAlert(
                    id = alertId,
                    title = "🔥 Oportunidade: ${offer.materialType} por R$ ${String.format(java.util.Locale.US, "%.2f", offer.price)} na Shopee!",
                    message = "Encontramos o filamento ${offer.filamentName} por apenas R$ ${String.format(java.util.Locale.US, "%.2f", offer.price)} na loja ${offer.storeName}! Limiar de oportunidade configurado: R$ ${String.format(java.util.Locale.US, "%.2f", thresh)}.",
                    type = AlertType.OPPORTUNITY
                ))
            }
        }
    }

    // --- Sub-Tab for prices & calculations ---
    private val _pricingSubTab = MutableStateFlow(0) // 0: Calculadora, 1: Catálogos, 2: Gastos/Compras, 3: Cotação AI
    val pricingSubTab = _pricingSubTab.asStateFlow()

    fun selectPricingSubTab(subIndex: Int) {
        _pricingSubTab.value = subIndex
    }

    // --- Material Base Cost Profiles (Cadastro Base de Materiais) ---
    private val _materialProfiles = MutableStateFlow(
        listOf(
            MaterialProfile("PLA", 120.0, 350f, 0.85, 15.0, 15.0, 50.0),
            MaterialProfile("PETG", 140.0, 350f, 0.85, 15.0, 15.0, 50.0),
            MaterialProfile("ABS", 130.0, 380f, 0.85, 15.0, 15.0, 50.0),
            MaterialProfile("TPU", 160.0, 320f, 0.85, 15.0, 15.0, 50.0)
        )
    )
    val materialProfiles = _materialProfiles.asStateFlow()

    fun updateMaterialProfile(updated: MaterialProfile) {
        _materialProfiles.value = _materialProfiles.value.map {
            if (it.type.equals(updated.type, ignoreCase = true)) updated else it
        }
    }

    fun getFilamentPriceFromStock(type: String): Double {
        val spools = filamentStocks.value.filter { it.type.equals(type, ignoreCase = true) }
        if (spools.isNotEmpty()) {
            return spools.map { it.priceRoll }.average()
        }
        val p = _materialProfiles.value.firstOrNull { it.type.equals(type, ignoreCase = true) }
        return p?.filamentPriceRoll ?: 120.0
    }

    fun getExtraPartCost(partId: Long?, qty: Int): Double {
        if (partId == null || qty <= 0) return 0.0
        val matchedPart = catalogItems.value.firstOrNull { it.id == partId }
        return (matchedPart?.defaultPrice ?: 0.0) * qty
    }

    fun calculateBaseProductionCost(
        type: String,
        weightGrams: Float,
        printTimeHours: Float
    ): Double {
        val p = _materialProfiles.value.firstOrNull { it.type.equals(type, ignoreCase = true) }
            ?: MaterialProfile(type, 120.0, 350f, 0.85, 15.0, 15.0, 50.0)
        
        val filamentCost = (weightGrams / 1000.0) * getFilamentPriceFromStock(type)
        val energyCost = (p.printerPowerW / 1000.0) * printTimeHours * p.electricityCostKwh
        val laborCost = printTimeHours * p.laborCostHour
        val directCost = filamentCost + energyCost + laborCost
        val miscCost = directCost * (p.miscCostPercent / 100.0)
        return directCost + miscCost
    }

    fun calculateCatalogItemProductionCost(item: CatalogItem): Double {
        val filamentPrice = getFilamentPriceFromStock(item.filamentType)
        val p = _materialProfiles.value.firstOrNull { it.type.equals(item.filamentType, ignoreCase = true) }
            ?: MaterialProfile(item.filamentType, 120.0, 350f, 0.85, 15.0, 15.0, 50.0)
        
        var filamentCost = (item.weightGrams / 1000.0) * filamentPrice
        if (item.hasSecondaryMaterial && item.secondaryWeightGrams > 0f) {
            val secFilamentPrice = getFilamentPriceFromStock(item.secondaryFilamentType)
            filamentCost += (item.secondaryWeightGrams / 1000.0) * secFilamentPrice
        }
        
        val energyCost = (p.printerPowerW / 1000.0) * item.printTimeHours * p.electricityCostKwh
        val laborCost = item.printTimeHours * p.laborCostHour
        val directCost = filamentCost + energyCost + laborCost
        val miscCost = directCost * (p.miscCostPercent / 100.0)
        
        val extraPartCost = getExtraPartCost(item.spentPartId, item.spentPartQty)
        return directCost + miscCost + extraPartCost
    }

    fun calculateBasePriceWithProfit(
        type: String,
        weightGrams: Float,
        printTimeHours: Float
    ): Double {
        val p = _materialProfiles.value.firstOrNull { it.type.equals(type, ignoreCase = true) }
            ?: MaterialProfile(type, 120.0, 350f, 0.85, 15.0, 15.0, 50.0)
        val baseCost = calculateBaseProductionCost(type, weightGrams, printTimeHours)
        val profitEarned = baseCost * (p.defaultProfitMarginPercent / 100.0)
        return baseCost + profitEarned
    }

    // --- 3D Printing Cost Calculator States ---
    private val _calcWeightGrams = MutableStateFlow("150.0")
    val calcWeightGrams = _calcWeightGrams.asStateFlow()

    private val _calcPrintTimeHours = MutableStateFlow("4.5")
    val calcPrintTimeHours = _calcPrintTimeHours.asStateFlow()

    private val _calcFilamentPriceRoll = MutableStateFlow("120.0")
    val calcFilamentPriceRoll = _calcFilamentPriceRoll.asStateFlow()

    private val _calcPrinterPowerW = MutableStateFlow("350")
    val calcPrinterPowerW = _calcPrinterPowerW.asStateFlow()

    private val _calcElectricityCostKwh = MutableStateFlow("0.85")
    val calcElectricityCostKwh = _calcElectricityCostKwh.asStateFlow()

    private val _calcLaborCostHour = MutableStateFlow("15.0")
    val calcLaborCostHour = _calcLaborCostHour.asStateFlow()

    private val _calcProfitMarginPercent = MutableStateFlow("50")
    val calcProfitMarginPercent = _calcProfitMarginPercent.asStateFlow()

    private val _calcMiscCostPercent = MutableStateFlow("15")
    val calcMiscCostPercent = _calcMiscCostPercent.asStateFlow()

    // Calculator Platform Fees and Extras Config
    private val _calcPlatformFeePercent = MutableStateFlow("15")
    val calcPlatformFeePercent = _calcPlatformFeePercent.asStateFlow()

    private val _calcPlatformFeeFixed = MutableStateFlow("5.00")
    val calcPlatformFeeFixed = _calcPlatformFeeFixed.asStateFlow()

    private val _calcExtraFee = MutableStateFlow("0.00")
    val calcExtraFee = _calcExtraFee.asStateFlow()

    // New reactive lists supporting multiple filament materials and extra parts/accessories
    private val _calcFilamentSegments = MutableStateFlow<List<CalcFilamentSegment>>(
        listOf(CalcFilamentSegment(id = "default_seg", filamentStockId = 1L, weightGrams = 150f))
    )
    val calcFilamentSegments = _calcFilamentSegments.asStateFlow()

    private val _calcExtraParts = MutableStateFlow<List<CalcExtraPart>>(emptyList())
    val calcExtraParts = _calcExtraParts.asStateFlow()

    private val _calcPowerAndLaborCost = MutableStateFlow("25.00") // flat typed cost for Electricity + Labor
    val calcPowerAndLaborCost = _calcPowerAndLaborCost.asStateFlow()

    private val _calcLossPercent = MutableStateFlow("10") // manual typed material estimated waste percentage
    val calcLossPercent = _calcLossPercent.asStateFlow()

    fun setCalcWeightGrams(w: String) { _calcWeightGrams.value = w }
    fun setCalcPrintTimeHours(t: String) { _calcPrintTimeHours.value = t }
    fun setCalcFilamentPriceRoll(p: String) { _calcFilamentPriceRoll.value = p }
    fun setCalcPrinterPowerW(w: String) { _calcPrinterPowerW.value = w }
    fun setCalcElectricityCostKwh(e: String) { _calcElectricityCostKwh.value = e }
    fun setCalcLaborCostHour(l: String) { _calcLaborCostHour.value = l }
    fun setCalcProfitMarginPercent(p: String) { _calcProfitMarginPercent.value = p }
    fun setCalcMiscCostPercent(m: String) { _calcMiscCostPercent.value = m }

    fun setCalcPlatformFeePercent(p: String) { _calcPlatformFeePercent.value = p }
    fun setCalcPlatformFeeFixed(f: String) { _calcPlatformFeeFixed.value = f }
    fun setCalcExtraFee(e: String) { _calcExtraFee.value = e }

    // Multi-materials and Accessories setters
    fun setCalcPowerAndLaborCost(c: String) { _calcPowerAndLaborCost.value = c }
    fun setCalcLossPercent(p: String) { _calcLossPercent.value = p }

    fun addCalcFilamentSegment(filamentStockId: Long, weightGrams: Float) {
        val current = _calcFilamentSegments.value.toMutableList()
        current.add(CalcFilamentSegment(filamentStockId = filamentStockId, weightGrams = weightGrams))
        _calcFilamentSegments.value = current
    }

    fun removeCalcFilamentSegment(id: String) {
        _calcFilamentSegments.value = _calcFilamentSegments.value.filter { it.id != id }
    }

    fun updateCalcFilamentSegmentWeight(id: String, weightGrams: Float) {
        _calcFilamentSegments.value = _calcFilamentSegments.value.map {
            if (it.id == id) it.copy(weightGrams = weightGrams) else it
        }
    }

    fun updateCalcFilamentSegmentStockId(id: String, stockId: Long) {
        _calcFilamentSegments.value = _calcFilamentSegments.value.map {
            if (it.id == id) it.copy(filamentStockId = stockId) else it
        }
    }

    fun addCalcExtraPart(catalogItemId: Long, quantity: Int) {
        val current = _calcExtraParts.value.toMutableList()
        current.add(CalcExtraPart(catalogItemId = catalogItemId, quantity = quantity))
        _calcExtraParts.value = current
    }

    fun removeCalcExtraPart(id: String) {
        _calcExtraParts.value = _calcExtraParts.value.filter { it.id != id }
    }

    fun updateCalcExtraPartQty(id: String, quantity: Int) {
        _calcExtraParts.value = _calcExtraParts.value.map {
            if (it.id == id) it.copy(quantity = quantity) else it
        }
    }

    fun updateCalcExtraPartId(id: String, partId: Long) {
        _calcExtraParts.value = _calcExtraParts.value.map {
            if (it.id == id) it.copy(catalogItemId = partId) else it
        }
    }

    fun fillCalculatorFromCatalog(item: CatalogItem) {
        _calcWeightGrams.value = item.weightGrams.toString()
        _calcPrintTimeHours.value = item.printTimeHours.toString()
        _calcFilamentPriceRoll.value = getFilamentPriceFromStock(item.filamentType).toString()
        _pricingSubTab.value = 0 // Switch directly to calculator
    }

    // --- Catalog Operations ---
    fun saveCatalogItem(
        id: Long = 0,
        name: String,
        description: String,
        weightGrams: Float,
        printTimeHours: Float,
        filamentType: String,
        defaultPrice: Double,
        stockCount: Int = 0,
        minStockCount: Int = 2,
        productCode: String = "",
        filamentColorsUsed: String = "",
        spentPartId: Long? = null,
        spentPartQty: Int = 0,
        hasSecondaryMaterial: Boolean = false,
        secondaryWeightGrams: Float = 0f,
        secondaryFilamentType: String = "",
        secondaryFilamentColorsUsed: String = ""
    ) {
        viewModelScope.launch {
            val item = CatalogItem(
                id = id,
                name = name,
                description = description,
                weightGrams = weightGrams,
                printTimeHours = printTimeHours,
                filamentType = filamentType,
                defaultPrice = defaultPrice,
                stockCount = stockCount,
                minStockCount = minStockCount,
                productCode = productCode,
                filamentColorsUsed = filamentColorsUsed,
                spentPartId = spentPartId,
                spentPartQty = spentPartQty,
                hasSecondaryMaterial = hasSecondaryMaterial,
                secondaryWeightGrams = secondaryWeightGrams,
                secondaryFilamentType = secondaryFilamentType,
                secondaryFilamentColorsUsed = secondaryFilamentColorsUsed
            )
            repository.insertCatalogItem(item)
        }
    }

    fun adjustCatalogItemStock(item: CatalogItem, amount: Int) {
        viewModelScope.launch {
            val updated = item.copy(stockCount = (item.stockCount + amount).coerceAtLeast(0))
            repository.updateCatalogItem(updated)

            // Auto-deduct inventory & add queue production order if printing new stock (amount > 0)
            if (amount > 0) {
                // Auto-create a print order for the internal queue so it is printed and tracked
                val replenishmentOrder = PrintOrder(
                    clientId = null,
                    clientName = "Estoque Interno",
                    itemName = "${item.name} (Reposição)",
                    quantity = amount,
                    filamentType = item.filamentType,
                    filamentColor = if (item.filamentColorsUsed.isNotEmpty()) item.filamentColorsUsed.split(",").first().trim() else "Preto Carbono",
                    weightGrams = item.weightGrams,
                    printTimeHours = item.printTimeHours,
                    priceCharged = item.defaultPrice,
                    platformSource = "MANUAL",
                    status = "QUEUE",
                    printingProgress = 0.0f,
                    createdAt = System.currentTimeMillis(),
                    deadline = System.currentTimeMillis() + (2 * 24 * 3600 * 1000L) // 2 days deadline
                )
                repository.insertOrder(replenishmentOrder)

                // Deduct filament including a 15% loss multiplier (waste)
                val colors = item.filamentColorsUsed.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                if (colors.isNotEmpty() && item.weightGrams > 0f) {
                    val weightPerColor = (item.weightGrams / colors.size) * amount * 1.15f
                    val currentStocks = filamentStocks.value
                    colors.forEach { docColor ->
                        val matchedStock = currentStocks.firstOrNull {
                            it.type.equals(item.filamentType, ignoreCase = true) && 
                            it.color.equals(docColor, ignoreCase = true)
                        } ?: currentStocks.firstOrNull {
                            it.type.equals(item.filamentType, ignoreCase = true)
                        }
                        if (matchedStock != null) {
                            val updatedStock = matchedStock.copy(
                                stockGrams = (matchedStock.stockGrams - weightPerColor).coerceAtLeast(0f)
                            )
                            repository.updateFilamentStock(updatedStock)
                        }
                    }
                }

                // Deduct secondary filament if present, including a 15% loss multiplier (waste)
                if (item.hasSecondaryMaterial && item.secondaryWeightGrams > 0f) {
                    val secondaryColors = item.secondaryFilamentColorsUsed.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                    if (secondaryColors.isNotEmpty()) {
                        val secondaryWeightPerColor = (item.secondaryWeightGrams / secondaryColors.size) * amount * 1.15f
                        val currentStocks = filamentStocks.value
                        secondaryColors.forEach { docColor ->
                            val matchedStock = currentStocks.firstOrNull {
                                it.type.equals(item.secondaryFilamentType, ignoreCase = true) && 
                                it.color.equals(docColor, ignoreCase = true)
                            } ?: currentStocks.firstOrNull {
                                it.type.equals(item.secondaryFilamentType, ignoreCase = true)
                            }
                            if (matchedStock != null) {
                                val updatedStock = matchedStock.copy(
                                    stockGrams = (matchedStock.stockGrams - secondaryWeightPerColor).coerceAtLeast(0f)
                                )
                                repository.updateFilamentStock(updatedStock)
                            }
                        }
                    }
                }

                // Deduct spent parts ("peças gastas")
                if (item.spentPartId != null && item.spentPartId != 0L && item.spentPartQty > 0) {
                    val totalPartsNeeded = item.spentPartQty * amount
                    val allCatalogItems = catalogItems.value
                    val matchedPart = allCatalogItems.firstOrNull { it.id == item.spentPartId }
                    if (matchedPart != null) {
                        val updatedPart = matchedPart.copy(
                            stockCount = (matchedPart.stockCount - totalPartsNeeded).coerceAtLeast(0)
                        )
                        repository.updateCatalogItem(updatedPart)
                    }
                }
            }
        }
    }

    fun deleteCatalogItem(item: CatalogItem) {
        viewModelScope.launch {
            repository.deleteCatalogItem(item)
        }
    }

    // --- Filament Stock Operations ---
    fun saveFilamentStock(
        id: Long = 0,
        type: String,
        color: String,
        stockGrams: Float,
        minStockGrams: Float = 1000f,
        priceRoll: Double = 120.0
    ) {
        viewModelScope.launch {
            val stock = FilamentStock(
                id = id,
                type = type,
                color = color,
                stockGrams = stockGrams,
                minStockGrams = minStockGrams,
                priceRoll = priceRoll
            )
            repository.insertFilamentStock(stock)
        }
    }

    fun adjustFilamentStock(stock: FilamentStock, amountGrams: Float) {
        viewModelScope.launch {
            val updated = stock.copy(stockGrams = (stock.stockGrams + amountGrams).coerceAtLeast(0f))
            repository.updateFilamentStock(updated)
        }
    }

    fun deleteFilamentStock(stock: FilamentStock) {
        viewModelScope.launch {
            repository.deleteFilamentStock(stock)
        }
    }

    // --- Expense Operations ---
    fun saveExpense(description: String, category: String, amount: Double, qty: Int) {
        viewModelScope.launch {
            val expense = Expense(
                description = description,
                category = category,
                amount = amount,
                qty = qty,
                date = System.currentTimeMillis()
            )
            repository.insertExpense(expense)
        }
    }

    fun deleteExpense(expense: Expense) {
        viewModelScope.launch {
            repository.deleteExpense(expense)
        }
    }

    // --- Firebase Sync States & Actions ---
    private val _isFirebaseSyncing = MutableStateFlow(false)
    val isFirebaseSyncing = _isFirebaseSyncing.asStateFlow()

    private val _firebaseStatus = MutableStateFlow("")
    val firebaseStatus = _firebaseStatus.asStateFlow()

    private val _firebaseUrlInput = MutableStateFlow(FirebaseSyncService.getFirebaseUrl(application))
    val firebaseUrlInput = _firebaseUrlInput.asStateFlow()

    private val _firebaseWorkspaceCodeInput = MutableStateFlow(FirebaseSyncService.getWorkspaceCode(application))
    val firebaseWorkspaceCodeInput = _firebaseWorkspaceCodeInput.asStateFlow()

    fun updateFirebaseSettings(url: String, code: String) {
        FirebaseSyncService.saveSettings(getApplication(), url, code)
        _firebaseUrlInput.value = FirebaseSyncService.getFirebaseUrl(getApplication())
        _firebaseWorkspaceCodeInput.value = FirebaseSyncService.getWorkspaceCode(getApplication())
        _firebaseStatus.value = "Configurações do Firebase atualizadas!"
    }

    fun backupToFirebase() {
        viewModelScope.launch {
            _isFirebaseSyncing.value = true
            _firebaseStatus.value = "Fazendo backup para o Firebase..."
            val result = FirebaseSyncService.backupToCloud(getApplication(), db)
            result.onSuccess {
                _firebaseStatus.value = "Backup realizado com sucesso no Firebase!"
            }
            result.onFailure { error ->
                _firebaseStatus.value = "Falha no Backup: ${error.message}"
            }
            _isFirebaseSyncing.value = false
        }
    }

    fun restoreFromFirebase() {
        viewModelScope.launch {
            _isFirebaseSyncing.value = true
            _firebaseStatus.value = "Restaurando dados do Firebase..."
            val result = FirebaseSyncService.restoreFromCloud(getApplication(), db)
            result.onSuccess {
                _firebaseStatus.value = "Dados restaurados e atualizados localmente!"
                updateMachineStatuses()
            }
            result.onFailure { error ->
                _firebaseStatus.value = "Falha na Restauração: ${error.message}"
            }
            _isFirebaseSyncing.value = false
        }
    }

    // --- Real-time print simulation loop ---
    private fun startPrintingSimulation() {
        viewModelScope.launch {
            while (true) {
                delay(6000) // Trigger progression step every 6 seconds
                val activeJobs = orders.value.filter { it.status == "PRINTING" }
                if (activeJobs.isNotEmpty()) {
                    activeJobs.forEach { job ->
                        val increment = (0.01f + Random.nextFloat() * 0.04f) // Increments between 1% and 5%
                        val nextProgress = (job.printingProgress + increment).coerceAtMost(1.0f)
                        if (nextProgress >= 1.0f) {
                            // Finish printing, move to Post Processing!
                            val updatedJob = job.copy(
                                printingProgress = 1.0f,
                                status = "POST_PROCESS"
                            )
                            repository.updateOrder(updatedJob)
                        } else {
                            // Adjust progress
                            val updatedJob = job.copy(printingProgress = nextProgress)
                            repository.updateOrder(updatedJob)
                        }
                    }
                    updateMachineStatuses()
                }
            }
        }
    }

    // --- Shopping list and Machine maintenance operations ---
    fun saveShoppingItem(name: String, price: Double) {
        viewModelScope.launch {
            repository.insertShoppingItem(ShoppingItem(name = name, price = price, isChecked = false))
        }
    }

    fun toggleShoppingItem(item: ShoppingItem) {
        viewModelScope.launch {
            repository.updateShoppingItem(item.copy(isChecked = !item.isChecked))
        }
    }

    fun deleteShoppingItem(item: ShoppingItem) {
        viewModelScope.launch {
            repository.deleteShoppingItem(item)
        }
    }

    fun completeWeeklyMaintenance(printer: Printer) {
        viewModelScope.launch {
            repository.updatePrinter(printer.copy(lastWeeklyMaintenance = System.currentTimeMillis()))
        }
    }

    fun completeMonthlyMaintenance(printer: Printer) {
        viewModelScope.launch {
            repository.updatePrinter(printer.copy(lastMonthlyMaintenance = System.currentTimeMillis()))
        }
    }
}
