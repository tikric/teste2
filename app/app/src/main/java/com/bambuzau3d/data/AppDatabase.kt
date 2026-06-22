package com.bambuzau3d.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(entities = [Client::class, Printer::class, PrintOrder::class, CatalogItem::class, Expense::class, FilamentStock::class, ShoppingItem::class], version = 10, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun clientDao(): ClientDao
    abstract fun printerDao(): PrinterDao
    abstract fun printOrderDao(): PrintOrderDao
    abstract fun catalogItemDao(): CatalogItemDao
    abstract fun expenseDao(): ExpenseDao
    abstract fun filamentStockDao(): FilamentStockDao
    abstract fun shoppingItemDao(): ShoppingItemDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "print_flow_db"
                ).fallbackToDestructiveMigration()
                .addCallback(object : RoomDatabase.Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        // Seed mock data
                        val now = System.currentTimeMillis()
                        // Populate default clients
                        db.execSQL("INSERT INTO clients (id, name, phone, email, address, note) VALUES (1, 'Marcos Silva', '(11) 98765-4321', 'marcos@email.com', 'Rua Augusta, 1000 - SP', 'Cliente exigente, prefere acabados finos')")
                        db.execSQL("INSERT INTO clients (id, name, phone, email, address, note) VALUES (2, 'Ana Souza (Arte3D)', '(21) 99888-7766', 'ana.arte@email.com', 'Av. Atlântica, 450 - RJ', 'Trabalha com action figures e estátuas de colecionador')")
                        db.execSQL("INSERT INTO clients (id, name, phone, email, address, note) VALUES (3, 'Felipe Santos', '(31) 97777-6655', 'felipe.s@email.com', 'Rua Bahia, 200 - BH', 'Pedidos recorrentes de protótipos de engenharia')")

                        // Populate default printers
                        db.execSQL("INSERT INTO printers (id, name, model, status, ipAddress, lastWeeklyMaintenance, lastMonthlyMaintenance) VALUES (1, 'Bambu Lab P1S', 'Bambu Lab P1S', 'PRINTING', '192.168.1.150', " + (now - 8 * 24 * 60 * 60 * 1000L) + ", " + (now - 32 * 24 * 60 * 60 * 1000L) + ")")
                        db.execSQL("INSERT INTO printers (id, name, model, status, ipAddress, lastWeeklyMaintenance, lastMonthlyMaintenance) VALUES (2, 'Creality Ender 3 V3', 'Creality Ender 3 V3', 'IDLE', '192.168.1.162', " + (now - 8 * 24 * 60 * 60 * 1000L) + ", " + (now - 32 * 24 * 60 * 60 * 1000L) + ")")

                        // Populate initial orders
                        // Order 1: Vaso Espiral PLA Ouro (Printing)
                        db.execSQL("INSERT INTO print_orders (id, clientId, clientName, itemName, quantity, filamentType, filamentColor, weightGrams, printTimeHours, priceCharged, platformSource, platformOrderId, status, printingProgress, assignedPrinterId, printerName, createdAt, deadline) VALUES " +
                                "(1, 2, 'Ana Souza (Arte3D)', 'Vaso Espiral Low Poly', 1, 'PLA', 'Ouro Silk', 180.0, 4.5, 95.0, 'MANUAL', '', 'PRINTING', 0.65, 1, 'Bambu Lab P1S', " + now + ", " + (now + 24*3600*1000) + ")")

                        // Order 2: Suporte Headset (Queue)
                        db.execSQL("INSERT INTO print_orders (id, clientId, clientName, itemName, quantity, filamentType, filamentColor, weightGrams, printTimeHours, priceCharged, platformSource, platformOrderId, status, printingProgress, assignedPrinterId, printerName, createdAt, deadline) VALUES " +
                                "(2, 3, 'Felipe Santos', 'Suporte Headset Gamer', 2, 'PETG', 'Preto Carbono', 260.0, 8.0, 140.0, 'MANUAL', '', 'QUEUE', 0.0, 2, 'Creality Ender 3 V3', " + now + ", " + (now + 48*3600*1000) + ")")

                        // Order 3: Action Figure Batman (Post-processing)
                        db.execSQL("INSERT INTO print_orders (id, clientId, clientName, itemName, quantity, filamentType, filamentColor, weightGrams, printTimeHours, priceCharged, platformSource, platformOrderId, status, printingProgress, assignedPrinterId, printerName, createdAt, deadline) VALUES " +
                                "(3, 2, 'Ana Souza (Arte3D)', 'Action Figure Batman 30cm', 1, 'PLA', 'Cinza Metálico', 450.0, 18.5, 290.0, 'MANUAL', '', 'POST_PROCESS', 1.0, 1, 'Bambu Lab P1S', " + (now - 24*3600*1000) + ", " + (now + 12*3600*1000) + ")")

                        // Seed Products Catalog
                        db.execSQL("INSERT INTO catalog_items (id, name, description, weightGrams, printTimeHours, filamentType, defaultPrice, stockCount, minStockCount, productCode, filamentColorsUsed, spentPartId, spentPartQty, hasSecondaryMaterial, secondaryWeightGrams, secondaryFilamentType, secondaryFilamentColorsUsed) VALUES (1, 'Vaso Espiral Low Poly', 'Lindo vaso de decoração com efeito espiralado geométrico', 180.0, 4.5, 'PLA', 95.0, 3, 2, 'VASO01', '', NULL, 0, 0, 0.0, '', '')")
                        db.execSQL("INSERT INTO catalog_items (id, name, description, weightGrams, printTimeHours, filamentType, defaultPrice, stockCount, minStockCount, productCode, filamentColorsUsed, spentPartId, spentPartQty, hasSecondaryMaterial, secondaryWeightGrams, secondaryFilamentType, secondaryFilamentColorsUsed) VALUES (2, 'Suporte Headset Gamer', 'Suporte universal de alta resistência para headsets', 130.0, 4.0, 'PETG', 70.0, 1, 2, 'HEAD02', '', NULL, 0, 0, 0.0, '', '')")
                        db.execSQL("INSERT INTO catalog_items (id, name, description, weightGrams, printTimeHours, filamentType, defaultPrice, stockCount, minStockCount, productCode, filamentColorsUsed, spentPartId, spentPartQty, hasSecondaryMaterial, secondaryWeightGrams, secondaryFilamentType, secondaryFilamentColorsUsed) VALUES (3, 'Suporte de Controle PS5', 'Suporte de mesa elegante para controle de PS5 DualSense', 85.0, 3.0, 'PLA', 45.0, 0, 2, 'PS5CTRL', '', NULL, 0, 0, 0.0, '', '')")
                        db.execSQL("INSERT INTO catalog_items (id, name, description, weightGrams, printTimeHours, filamentType, defaultPrice, stockCount, minStockCount, productCode, filamentColorsUsed, spentPartId, spentPartQty, hasSecondaryMaterial, secondaryWeightGrams, secondaryFilamentType, secondaryFilamentColorsUsed) VALUES (4, 'Action Figure Batman 30cm', 'Estátua super detalhada do Batman para colecionadores', 450.0, 18.5, 'PLA', 290.0, 4, 2, 'BATMAN30', '', NULL, 0, 0, 0.0, '', '')")
                        db.execSQL("INSERT INTO catalog_items (id, name, description, weightGrams, printTimeHours, filamentType, defaultPrice, stockCount, minStockCount, productCode, filamentColorsUsed, spentPartId, spentPartQty, hasSecondaryMaterial, secondaryWeightGrams, secondaryFilamentType, secondaryFilamentColorsUsed) VALUES (5, 'Bico de Extrusão Latão 0.4mm E3D', 'Bico de latão de alta precisão durável para filamento 1.75mm', 0.0, 0.0, 'HARDWARE', 19.90, 5, 2, 'NOZZLE04', '', NULL, 0, 0, 0.0, '', '')")
                        db.execSQL("INSERT INTO catalog_items (id, name, description, weightGrams, printTimeHours, filamentType, defaultPrice, stockCount, minStockCount, productCode, filamentColorsUsed, spentPartId, spentPartQty, hasSecondaryMaterial, secondaryWeightGrams, secondaryFilamentType, secondaryFilamentColorsUsed) VALUES (6, 'Tubo PTFE Capricorn XS Original 1m', 'Tubo PTFE de altíssima fricção reduzida para hotend bowden/direct', 0.0, 0.0, 'HARDWARE', 45.00, 2, 1, 'PTFETYG', '', NULL, 0, 0, 0.0, '', '')")
                        db.execSQL("INSERT INTO catalog_items (id, name, description, weightGrams, printTimeHours, filamentType, defaultPrice, stockCount, minStockCount, productCode, filamentColorsUsed, spentPartId, spentPartQty, hasSecondaryMaterial, secondaryWeightGrams, secondaryFilamentType, secondaryFilamentColorsUsed) VALUES (7, 'Mesa Magnética PEI Texturizada 235mm', 'Chapa flexível magnética PEI com excelente aderência e remoção', 0.0, 0.0, 'HARDWARE', 109.90, 1, 1, 'PEIPLATE', '', NULL, 0, 0, 0.0, '', '')")
                        db.execSQL("INSERT INTO catalog_items (id, name, description, weightGrams, printTimeHours, filamentType, defaultPrice, stockCount, minStockCount, productCode, filamentColorsUsed, spentPartId, spentPartQty, hasSecondaryMaterial, secondaryWeightGrams, secondaryFilamentType, secondaryFilamentColorsUsed) VALUES (8, 'Garganta Bimetálica Heatbreak E3D V6', 'Garganta bimetálica resistente a altas temperaturas sem entupimento', 0.0, 0.0, 'HARDWARE', 32.00, 3, 2, 'GBIMETA', '', NULL, 0, 0, 0.0, '', '')")
                        db.execSQL("INSERT INTO catalog_items (id, name, description, weightGrams, printTimeHours, filamentType, defaultPrice, stockCount, minStockCount, productCode, filamentColorsUsed, spentPartId, spentPartQty, hasSecondaryMaterial, secondaryWeightGrams, secondaryFilamentType, secondaryFilamentColorsUsed) VALUES (9, 'Fita LED RGB 1m USB', 'Fita de LED colorida USB para iluminar luminárias e painéis', 0.0, 0.0, 'HARDWARE', 20.00, 10, 5, 'LEDSTRIP', '', NULL, 0, 0, 0.0, '', '')")
                        db.execSQL("INSERT INTO catalog_items (id, name, description, weightGrams, printTimeHours, filamentType, defaultPrice, stockCount, minStockCount, productCode, filamentColorsUsed, spentPartId, spentPartQty, hasSecondaryMaterial, secondaryWeightGrams, secondaryFilamentType, secondaryFilamentColorsUsed) VALUES (10, 'Ímã de Neodímio 8x2mm', 'Ímã de alto poder para travas de caixas e partes articuladas', 0.0, 0.0, 'HARDWARE', 1.50, 50, 10, 'NEOMAGNET', '', NULL, 0, 0, 0.0, '', '')")

                        // Seed Filament Stocks Table
                        db.execSQL("INSERT INTO filament_stocks (id, type, color, stockGrams, minStockGrams, priceRoll) VALUES (1, 'PLA', 'Ouro Silk', 350.0, 1000.0, 120.0)")
                        db.execSQL("INSERT INTO filament_stocks (id, type, color, stockGrams, minStockGrams, priceRoll) VALUES (2, 'PLA', 'Preto Voolt', 1200.0, 1000.0, 110.0)")
                        db.execSQL("INSERT INTO filament_stocks (id, type, color, stockGrams, minStockGrams, priceRoll) VALUES (3, 'PETG', 'Preto Carbono', 200.0, 1000.0, 135.0)")
                        db.execSQL("INSERT INTO filament_stocks (id, type, color, stockGrams, minStockGrams, priceRoll) VALUES (4, 'TPU', 'Vermelho Flex', 150.0, 500.0, 150.0)")

                        // Seed Purchases / Expenses
                        db.execSQL("INSERT INTO expenses (id, description, category, amount, qty, date) VALUES (1, 'Filamento PLA Ouro Silk 1kg - Voolt3D', 'FILAMENTO', 120.0, 1, " + (now - 5*24*3600*1000) + ")")
                        db.execSQL("INSERT INTO expenses (id, description, category, amount, qty, date) VALUES (2, 'Filamento PETG Preto Carbono 1kg - ESUN', 'FILAMENTO', 135.0, 1, " + (now - 4*24*3600*1000) + ")")
                        db.execSQL("INSERT INTO expenses (id, description, category, amount, qty, date) VALUES (3, 'Bico de Extrusão Latão 0.4mm E3D', 'EQUIPAMENTO', 25.0, 2, " + (now - 3*24*3600*1000) + ")")
                        db.execSQL("INSERT INTO expenses (id, description, category, amount, qty, date) VALUES (4, 'Energia Elétrica Mensal Estimada', 'ENERGIA', 65.0, 1, " + (now - 2*24*3600*1000) + ")")

                        // Seed Shopping Items
                        db.execSQL("INSERT INTO shopping_items (id, name, price, isChecked) VALUES (1, 'Filamento PLA Vermelho 1kg', 115.0, 0)")
                        db.execSQL("INSERT INTO shopping_items (id, name, price, isChecked) VALUES (2, 'Álcool Isopropílico para Limpeza Mesa', 24.90, 1)")
                        db.execSQL("INSERT INTO shopping_items (id, name, price, isChecked) VALUES (3, 'Kit de Bicos Nozzle de Latão 0.4mm Creality', 45.00, 0)")
                    }
                }).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
